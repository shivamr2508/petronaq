const Comparison = require("../models/Comparison");
const Product = require("../models/Product");
const { toReadableSlug } = require("../utils/slugify");

/* ═══════════════════════════════════════════════════════════════════════════════
   Compare Controller — PetRonaq AI Compare (Phase 2)
   ═══════════════════════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────────────────────
   Internal helper: derive a canonical comparison slug from an array of
   product IDs.

   Algorithm:
   1. Fetch the product slug (or fall back to the last 8 chars of _id)
      for each supplied product ID.
   2. Sort the resulting slug tokens alphabetically — this makes the slug
      deterministic regardless of selection order.
   3. Join with "-vs-".
   4. Run through toReadableSlug for final sanitisation (lowercase, dashes).

   Pet type and breed are intentionally excluded from the slug so that the
   same product combination always maps to one canonical URL.
───────────────────────────────────────────────────────────────────────────── */
async function deriveSlug(productIds) {
  if (!productIds || productIds.length === 0) {
    throw new Error("At least one product ID is required");
  }

  // Fetch products — select only the fields we need
  const products = await Product.find(
    { _id: { $in: productIds } },
    { _id: 1, slug: 1, name: 1 }
  ).lean();

  if (products.length === 0) {
    throw new Error("No valid products found for the supplied IDs");
  }

  // Build a slug token for each product (prefer product.slug, fallback to id tail)
  const tokens = products.map((p) => {
    if (p.slug && p.slug.trim()) {
      return p.slug.trim().toLowerCase();
    }
    // Fallback: sanitise the product name or use id suffix
    if (p.name) {
      return toReadableSlug(p.name).slice(0, 60) || String(p._id).slice(-8);
    }
    return String(p._id).slice(-8);
  });

  // Sort alphabetically → deterministic regardless of selection order
  tokens.sort();

  // Join and sanitise
  const raw = tokens.join("-vs-");
  const slug = toReadableSlug(raw) || "compare";

  return { slug, products };
}

/* ─────────────────────────────────────────────────────────────────────────────
   POST /api/compare/create
   Body: { productIds: string[], petType?: string, breed?: string }

   Finds an existing comparison by canonical slug or creates a new one.
   Returns { comparison, found } where found=true means it already existed.
───────────────────────────────────────────────────────────────────────────── */
exports.findOrCreate = async (req, res) => {
  try {
    const { productIds, petType, breed } = req.body;

    // ── Validation ────────────────────────────────────────────────────────────
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: "productIds must be a non-empty array" });
    }

    if (productIds.length > 3) {
      return res.status(400).json({ message: "Maximum 3 products can be compared" });
    }

    // ── Derive canonical slug ─────────────────────────────────────────────────
    let slug, resolvedProducts;
    try {
      ({ slug, products: resolvedProducts } = await deriveSlug(productIds));
    } catch (slugErr) {
      return res.status(400).json({ message: slugErr.message });
    }

    // ── Check for existing comparison ─────────────────────────────────────────
    const existing = await Comparison.findOne({ slug }).populate(
      "products",
      "name slug images discountPrice price smallDescription categories petTypes stock"
    );

    if (existing) {
      return res.status(200).json({ comparison: existing, found: true });
    }

    // ── Create new comparison (status: draft, no AI content yet) ─────────────
    const resolvedIds = resolvedProducts.map((p) => p._id);

    const comparison = await Comparison.create({
      slug,
      products: resolvedIds,
      petType: petType ? String(petType).trim().toLowerCase() : undefined,
      breed: breed ? String(breed).trim() : undefined,
      status: "draft",
    });

    // Populate for the response
    await comparison.populate("products", "name slug images discountPrice price smallDescription categories petTypes stock");

    return res.status(201).json({ comparison, found: false });
  } catch (err) {
    console.error("[compareController] findOrCreate error:", err);
    return res.status(500).json({ message: "Server error creating comparison" });
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   GET /api/compare/find
   Query: ?products=id1,id2,id3&type=dog&breed=labrador

   Re-derives the canonical slug and returns the comparison if it exists.
   Does NOT create a new one.
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
      "name slug images discountPrice price smallDescription categories petTypes stock"
    );

    if (!comparison) {
      return res.status(404).json({ message: "Comparison not found", slug });
    }

    return res.status(200).json({ comparison, found: true });
  } catch (err) {
    console.error("[compareController] findComparison error:", err);
    return res.status(500).json({ message: "Server error finding comparison" });
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   GET /api/compare/:slug

   Fetches a single comparison by its canonical slug.
   Increments viewCount and updates lastViewedAt on every hit (analytics).
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
    ).populate("products", "name slug images discountPrice price smallDescription categories petTypes stock");

    if (!comparison) {
      return res.status(404).json({ message: "Comparison not found" });
    }

    return res.status(200).json({ comparison });
  } catch (err) {
    console.error("[compareController] findBySlug error:", err);
    return res.status(500).json({ message: "Server error fetching comparison" });
  }
};
