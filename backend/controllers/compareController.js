const Comparison = require("../models/Comparison");
const Product = require("../models/Product");
const { toReadableSlug } = require("../utils/slugify");
const { generateGroqComparison, getLastUsedModel } = require("../services/groqCompareService");

/* ═══════════════════════════════════════════════════════════════════════════════
   Compare Controller — PetRonaq AI Compare (Phase 4B)
   ═══════════════════════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────────────────────
   Internal helper: derive a canonical comparison slug from an array of
   product IDs.
───────────────────────────────────────────────────────────────────────────── */
async function deriveSlug(productIds) {
  const dsStart = Date.now();
  console.log(`[COMPARE PROFILE] [${new Date().toISOString()}] deriveSlug() START`);
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

  const dsElapsed = Date.now() - dsStart;
  console.log(`[COMPARE PROFILE] [${new Date().toISOString()}] deriveSlug() END — slug: "${slug}" (${dsElapsed}ms)`);
  return { slug, products };
}

/* ─────────────────────────────────────────────────────────────────────────────
   Internal helper: run AI generation in the background (fire-and-forget).
   Used by findOrCreate so the HTTP response is sent first.
───────────────────────────────────────────────────────────────────────────── */
function triggerAIBackground(comparisonId) {
  // Defer to next event-loop tick so the response is sent first
  setImmediate(async () => {
    const bgStart = Date.now();
    console.log(`[COMPARE PROFILE] [${new Date().toISOString()}] Background AI task started inside setImmediate for ID: ${comparisonId}`);
    try {
      // Re-fetch fresh document (the one returned to frontend is already populated)
      let comparison = await Comparison.findById(comparisonId);
      if (!comparison) {
        console.warn(`[COMPARE BG] Comparison ${comparisonId} not found in background job.`);
        return;
      }

      // Guard: already completed or processing by another concurrent request
      if (comparison.aiStatus === "completed" && comparison.aiResponse) {
        console.log(`[COMPARE BG] Comparison ${comparisonId} already completed – skipping.`);
        return;
      }

      // Acquire processing lock atomically to prevent duplicate Gemini calls
      const locked = await Comparison.findOneAndUpdate(
        { _id: comparisonId, aiStatus: { $ne: "processing" } },
        { $set: { aiStatus: "processing", status: "processing", aiError: null } },
        { new: true }
      );

      if (!locked) {
        console.log(`[COMPARE BG] Lock not acquired for ${comparisonId} – another job is running.`);
        return;
      }

      comparison = locked;

      // Populate product fields needed for the Gemini prompt
      await comparison.populate(
        "products",
        "name slug images discountPrice price smallDescription description categories petTypes stock ingredients nutrition nutritionalInfo brand"
      );
      const productsList = comparison.products || [];

      const aiStart = Date.now();
      console.log(`[COMPARE BG] Calling generateGroqComparison() for ${comparisonId}`);

      const aiText = await generateGroqComparison(productsList, comparison.petType, comparison.breed);

      const aiMs = Date.now() - aiStart;
      console.log(`[COMPARE BG] generateGroqComparison() completed in ${aiMs}ms for ${comparisonId}`);

      comparison.aiResponse = aiText;
      comparison.aiGeneratedAt = new Date();
      comparison.lastGeneratedAt = new Date();
      comparison.aiModel = getLastUsedModel() || "llama-3.3-70b-versatile";
      comparison.aiStatus = "completed";
      comparison.status = "completed";
      await comparison.save();

      const totalMs = Date.now() - bgStart;
      console.log(`[COMPARE BG] AI generation saved successfully for ${comparisonId} (total: ${totalMs}ms)`);
    } catch (err) {
      const totalMs = Date.now() - bgStart;
      console.error(`[COMPARE BG] AI generation failed for ${comparisonId} after ${totalMs}ms:`, err.message || err);
      try {
        await Comparison.findByIdAndUpdate(comparisonId, {
          $set: { aiStatus: "failed", status: "failed", aiError: err.message || String(err) },
        });
      } catch (saveErr) {
        console.error(`[COMPARE BG] Could not save failure state for ${comparisonId}:`, saveErr.message || saveErr);
      }
    }
  });
}


/* ─────────────────────────────────────────────────────────────────────────────
   POST /api/compare/create
   Body: { productIds: string[], petType?: string, breed?: string }

   IMPORTANT: This handler MUST respond immediately with the slug.
   AI generation is kicked off asynchronously AFTER the response is sent.
───────────────────────────────────────────────────────────────────────────── */
exports.findOrCreate = async (req, res) => {
  const reqStart = Date.now();
  console.log(`\n===================================================================`);
  console.log(`[COMPARE PROFILE] [${new Date().toISOString()}] 1. Request received for POST /api/compare/create`);

  try {
    const { productIds, petType, breed } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: "productIds must be a non-empty array" });
    }

    if (productIds.length > 3) {
      return res.status(400).json({ message: "Maximum 3 products can be compared" });
    }

    // ── Step 1: Slug generation ──────────────────────────────────────────────
    console.log(`[COMPARE PROFILE] [${new Date().toISOString()}] 2. deriveSlug() START`);
    const slugStart = Date.now();
    let slug, resolvedProducts;
    try {
      ({ slug, products: resolvedProducts } = await deriveSlug(productIds));
    } catch (slugErr) {
      return res.status(400).json({ message: slugErr.message });
    }
    const slugMs = Date.now() - slugStart;
    console.log(`[COMPARE PROFILE] [${new Date().toISOString()}] 2. deriveSlug() END (${slugMs}ms elapsed from step 2 start, ${Date.now() - reqStart}ms total)`);

    // ── Step 2: MongoDB lookup ───────────────────────────────────────────────
    console.log(`[COMPARE PROFILE] [${new Date().toISOString()}] 3. MongoDB findOne() START`);
    const dbStart = Date.now();
    const existing = await Comparison.findOne({ slug }).populate(
      "products",
      "name slug images discountPrice price smallDescription description categories petTypes stock ingredients nutrition nutritionalInfo brand"
    );
    const dbMs = Date.now() - dbStart;
    console.log(`[COMPARE PROFILE] [${new Date().toISOString()}] 3. MongoDB findOne() END (${dbMs}ms elapsed, found: ${!!existing}, ${Date.now() - reqStart}ms total)`);

    if (existing) {
      // Comparison already exists – return immediately, trigger background AI only if needed
      console.log(`[COMPARE PROFILE] [${new Date().toISOString()}] 5. res.json() START sending response (existing comparison found after ${Date.now() - reqStart}ms)`);
      res.status(200).json({ comparison: existing, found: true });
      console.log(`[COMPARE PROFILE] [${new Date().toISOString()}] 5. res.json() END sent to frontend successfully`);

      // Fire background AI if not yet complete (non-blocking – response already sent)
      if (existing.aiStatus !== "completed" && existing.aiStatus !== "processing") {
        console.log(`[COMPARE PROFILE] [${new Date().toISOString()}] 6. Background AI triggering via setImmediate for ID: ${existing._id}`);
        triggerAIBackground(existing._id);
      }
      console.log(`===================================================================\n`);
      return;
    }

    // ── Step 3: Create new comparison document ───────────────────────────────
    console.log(`[COMPARE PROFILE] [${new Date().toISOString()}] 4. MongoDB save() / create() START`);
    const createStart = Date.now();
    const resolvedIds = resolvedProducts.map((p) => p._id);

    const comparison = await Comparison.create({
      slug,
      products: resolvedIds,
      petType: petType ? String(petType).trim().toLowerCase() : undefined,
      breed: breed ? String(breed).trim() : undefined,
      status: "draft",
      aiStatus: "pending",
    });
    const createMs = Date.now() - createStart;
    console.log(`[COMPARE PROFILE] [${new Date().toISOString()}] 4. MongoDB save() / create() END (ID: ${comparison._id}, ${createMs}ms elapsed, ${Date.now() - reqStart}ms total)`);

    // Populate for the response payload
    console.log(`[COMPARE PROFILE] [${new Date().toISOString()}] 4b. MongoDB populate() START`);
    const popStart = Date.now();
    await comparison.populate(
      "products",
      "name slug images discountPrice price smallDescription description categories petTypes stock ingredients nutrition nutritionalInfo brand"
    );
    console.log(`[COMPARE PROFILE] [${new Date().toISOString()}] 4b. MongoDB populate() END (${Date.now() - popStart}ms elapsed, ${Date.now() - reqStart}ms total)`);

    // ── Step 4: Send response IMMEDIATELY (AI runs in background) ────────────
    console.log(`[COMPARE PROFILE] [${new Date().toISOString()}] 5. res.json() START sending response (new comparison created after ${Date.now() - reqStart}ms total)`);
    res.status(201).json({ comparison, found: false });
    console.log(`[COMPARE PROFILE] [${new Date().toISOString()}] 5. res.json() END sent to frontend successfully`);

    // ── Step 5: Fire background AI generation (after response is sent) ───────
    console.log(`[COMPARE PROFILE] [${new Date().toISOString()}] 6. Background AI triggering via setImmediate for ID: ${comparison._id}`);
    triggerAIBackground(comparison._id);
    console.log(`===================================================================\n`);

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

    const comparison = await Comparison.findOne({ slug }).populate(
      "products",
      "name slug images discountPrice price smallDescription description categories petTypes stock ingredients nutrition nutritionalInfo brand"
    );

    if (!comparison) {
      return res.status(404).json({ message: "Comparison not found", slug });
    }

    // Return immediately — frontend polls until aiStatus === "completed"
    res.status(200).json({ comparison, found: true });

    // Trigger background AI only if not already done or in progress
    if (comparison.aiStatus !== "completed" && comparison.aiStatus !== "processing") {
      console.log(`[COMPARE FIND] Triggering background AI for: ${comparison._id} (aiStatus: ${comparison.aiStatus})`);
      triggerAIBackground(comparison._id);
    }
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

    const comparison = await Comparison.findOneAndUpdate(
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

    // Return immediately — frontend polls until aiStatus === "completed"
    res.status(200).json({ comparison });

    // Trigger background AI only if not already done or in progress
    if (comparison.aiStatus !== "completed" && comparison.aiStatus !== "processing") {
      console.log(`[COMPARE SLUG] Triggering background AI for: ${comparison._id} (aiStatus: ${comparison.aiStatus})`);
      triggerAIBackground(comparison._id);
    }
  } catch (err) {
    console.error("[compareController] findBySlug error:", err);
    return res.status(500).json({ message: "Server error fetching comparison" });
  }
};
