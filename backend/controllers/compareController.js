const Comparison = require("../models/Comparison");
const Product = require("../models/Product");
const { toReadableSlug } = require("../utils/slugify");
const { generateComparison } = require("../services/geminiCompareService");

/* ═══════════════════════════════════════════════════════════════════════════════
   Compare Controller — PetRonaq AI Compare (Phase 4B)
   ═══════════════════════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────────────────────
   Internal helper: derive a canonical comparison slug from an array of
   product IDs.
───────────────────────────────────────────────────────────────────────────── */
async function deriveSlug(productIds) {
  if (!productIds || productIds.length === 0) {
    throw new Error("At least one product ID is required");
  }

  const products = await Product.find(
    { _id: { $in: productIds } },
    { _id: 1, slug: 1, name: 1 }
  ).lean();

  if (products.length === 0) {
    throw new Error("No valid products found for the supplied IDs");
  }

  const tokens = products.map((p) => {
    if (p.slug && p.slug.trim()) {
      return p.slug.trim().toLowerCase();
    }
    if (p.name) {
      return toReadableSlug(p.name).slice(0, 60) || String(p._id).slice(-8);
    }
    return String(p._id).slice(-8);
  });

  tokens.sort();

  const raw = tokens.join("-vs-");
  const slug = toReadableSlug(raw) || "compare";

  return { slug, products };
}

/* ─────────────────────────────────────────────────────────────────────────────
   Internal helper: process AI generation or retry based on aiStatus (Phase 4B)
───────────────────────────────────────────────────────────────────────────── */
async function processOrRetryAI(comparison) {
  if (!comparison) return comparison;

  console.log("[DEBUG AI 1] Entered processOrRetryAI(), comparison ID:", comparison._id);
  console.log("[DEBUG AI 2] aiStatus before processing:", comparison.aiStatus);

  // 1. If aiStatus == completed -> Return saved AI response. Never call Gemini again.
  if (comparison.aiStatus === "completed" && comparison.aiResponse) {
    console.log("[DEBUG AI] Comparison already completed, skipping Gemini call.");
    return comparison;
  }

  // 2. If aiStatus == processing -> Do NOT call Gemini again. Return immediately. Frontend can poll later.
  if (comparison.aiStatus === "processing") {
    console.log("[DEBUG AI] Comparison is currently processing, returning immediately without calling Gemini again.");
    return comparison;
  }

  // 3. If aiResponse does not exist OR aiStatus == pending OR aiStatus == failed (allow regeneration)
  try {
    // Immediately update aiStatus = processing and save document using atomic findOneAndUpdate
    // This prevents duplicate AI generation across concurrent requests for the same comparison.
    const locked = await Comparison.findOneAndUpdate(
      {
        _id: comparison._id,
        aiStatus: { $ne: "processing" },
      },
      {
        $set: {
          aiStatus: "processing",
          status: "processing",
          aiError: null,
        },
      },
      { new: true }
    );

    if (!locked) {
      // Another request won the race and is already processing or completed. Do NOT call Gemini again.
      console.log("[DEBUG AI] Failed to acquire processing lock (already locked by another request).");
      return comparison;
    }

    comparison = locked;
    console.log("[DEBUG AI 3] Acquired processing lock for comparison ID:", comparison._id);

    // Ensure products array is populated with full data for the prompt
    let productsList = comparison.products || [];
    if (productsList.length > 0 && typeof productsList[0] === "object" && productsList[0]._id) {
      // already populated
    } else {
      await comparison.populate(
        "products",
        "name slug images discountPrice price smallDescription description categories petTypes stock ingredients nutrition nutritionalInfo brand"
      );
      productsList = comparison.products || [];
    }

    console.log("[DEBUG AI 4] Calling generateComparison()");
    const aiText = await generateComparison(
      productsList,
      comparison.petType,
      comparison.breed
    );

    // After Gemini succeeds -> Save aiResponse, aiGeneratedAt, aiModel, aiStatus = completed
    comparison.aiResponse = aiText;
    comparison.aiGeneratedAt = new Date();
    comparison.lastGeneratedAt = new Date();
    comparison.aiModel = "gemini-2.5-flash";
    comparison.aiStatus = "completed";
    comparison.status = "completed";
    console.log("[DEBUG AI 9] aiStatus updated to completed");
    await comparison.save();
    console.log("[DEBUG AI 8] Comparison saved");
  } catch (err) {
    console.error("[DEBUG AI ERROR in processOrRetryAI] Full error stack:\n", err.stack || err);
    console.error("[processOrRetryAI] Gemini generation failed:", err.message || err);
    // If Gemini fails -> Save aiStatus = failed, aiError. Return comparison safely without crashing API.
    comparison.aiStatus = "failed";
    comparison.status = "failed";
    comparison.aiError = err.message || String(err);
    await comparison.save();
  }

  return comparison;
}

/* ─────────────────────────────────────────────────────────────────────────────
   POST /api/compare/create
   Body: { productIds: string[], petType?: string, breed?: string }
───────────────────────────────────────────────────────────────────────────── */
exports.findOrCreate = async (req, res) => {
  try {
    const { productIds, petType, breed } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: "productIds must be a non-empty array" });
    }

    if (productIds.length > 3) {
      return res.status(400).json({ message: "Maximum 3 products can be compared" });
    }

    let slug, resolvedProducts;
    try {
      ({ slug, products: resolvedProducts } = await deriveSlug(productIds));
    } catch (slugErr) {
      return res.status(400).json({ message: slugErr.message });
    }

    // Check for existing comparison
    let existing = await Comparison.findOne({ slug }).populate(
      "products",
      "name slug images discountPrice price smallDescription description categories petTypes stock ingredients nutrition nutritionalInfo brand"
    );

    if (existing) {
      existing = await processOrRetryAI(existing);
      return res.status(200).json({ comparison: existing, found: true });
    }

    // Create new comparison
    const resolvedIds = resolvedProducts.map((p) => p._id);

    let comparison = await Comparison.create({
      slug,
      products: resolvedIds,
      petType: petType ? String(petType).trim().toLowerCase() : undefined,
      breed: breed ? String(breed).trim() : undefined,
      status: "draft",
      aiStatus: "pending",
    });

    await comparison.populate(
      "products",
      "name slug images discountPrice price smallDescription description categories petTypes stock ingredients nutrition nutritionalInfo brand"
    );

    comparison = await processOrRetryAI(comparison);

    return res.status(201).json({ comparison, found: false });
  } catch (err) {
    console.error("[compareController] findOrCreate error:", err);
    return res.status(500).json({ message: "Server error creating comparison" });
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   GET /api/compare/find
   Query: ?products=id1,id2,id3&type=dog&breed=labrador
───────────────────────────────────────────────────────────────────────────── */
exports.findComparison = async (req, res) => {
  try {
    const rawProducts = req.query.products || "";
    const productIds = rawProducts.split(",").map((s) => s.trim()).filter(Boolean);

    if (productIds.length === 0) {
      return res.status(400).json({ message: "products query param is required" });
    }

    let slug;
    try {
      ({ slug } = await deriveSlug(productIds));
    } catch (slugErr) {
      return res.status(400).json({ message: slugErr.message });
    }

    let comparison = await Comparison.findOne({ slug }).populate(
      "products",
      "name slug images discountPrice price smallDescription description categories petTypes stock ingredients nutrition nutritionalInfo brand"
    );

    if (!comparison) {
      return res.status(404).json({ message: "Comparison not found", slug });
    }

    comparison = await processOrRetryAI(comparison);

    return res.status(200).json({ comparison, found: true });
  } catch (err) {
    console.error("[compareController] findComparison error:", err);
    return res.status(500).json({ message: "Server error finding comparison" });
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   GET /api/compare/:slug
───────────────────────────────────────────────────────────────────────────── */
exports.findBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    if (!slug || slug.trim() === "") {
      return res.status(400).json({ message: "Slug is required" });
    }

    let comparison = await Comparison.findOneAndUpdate(
      { slug: slug.toLowerCase().trim() },
      {
        $inc: { viewCount: 1 },
        $set: { lastViewedAt: new Date() },
      },
      {
        new: true,       // return the updated document
        runValidators: false,
      }
    ).populate(
      "products",
      "name slug images discountPrice price smallDescription description categories petTypes stock ingredients nutrition nutritionalInfo brand"
    );

    if (!comparison) {
      return res.status(404).json({ message: "Comparison not found" });
    }

    comparison = await processOrRetryAI(comparison);

    return res.status(200).json({ comparison });
  } catch (err) {
    console.error("[compareController] findBySlug error:", err);
    return res.status(500).json({ message: "Server error fetching comparison" });
  }
};
