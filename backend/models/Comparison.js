const mongoose = require("mongoose");

/* ═══════════════════════════════════════════════════════════════════════════════
   Comparison Model — PetRonaq AI Compare
   ───────────────────────────────────────────────────────────────────────────────
   Phase 2: Core persistence schema.
   Fields reserved for Phase 4 (aiVersion, lastGeneratedAt, metadata) are
   defined here so the schema is stable — no migrations needed later.
   ═══════════════════════════════════════════════════════════════════════════════ */

const ComparisonSchema = new mongoose.Schema(
  {
    /* ── Identity ─────────────────────────────────────────────────────────────
       slug: canonical URL key, derived ONLY from compared product slugs.
       Pet type and breed are intentionally excluded to keep one URL per
       product combination regardless of the user's pet context.
    ──────────────────────────────────────────────────────────────────────────── */
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    /* ── Products ─────────────────────────────────────────────────────────────
       Ordered array of Product references (sorted alphabetically by slug
       at write time so lookups are deterministic).
    ──────────────────────────────────────────────────────────────────────────── */
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
    ],

    /* ── Pet Context (stored for AI personalization, NOT in the URL) ──────────
       Kept for Phase 4 Gemini prompting and personalised recommendations.
       Multiple comparisons with the same products but different petType/breed
       share one canonical slug and one DB document.
    ──────────────────────────────────────────────────────────────────────────── */
    petType: {
      type: String,
      trim: true,
      lowercase: true,
    },

    breed: {
      type: String,
      trim: true,
    },

    /* ── Lifecycle Status ─────────────────────────────────────────────────────
       draft     → comparison created, AI content not yet generated
       completed → AI content has been generated (Phase 4)
    ──────────────────────────────────────────────────────────────────────────── */
    status: {
      type: String,
      enum: ["draft", "completed"],
      default: "draft",
    },

    /* ── AI Fields (reserved for Phase 4) ────────────────────────────────────
       aiVersion      → model/prompt version that generated the content
       lastGeneratedAt → when AI content was last produced
    ──────────────────────────────────────────────────────────────────────────── */
    aiVersion: {
      type: String,
      default: null,
    },

    lastGeneratedAt: {
      type: Date,
      default: null,
    },

    /* ── Analytics ────────────────────────────────────────────────────────────
       viewCount   → incremented on every GET /api/compare/:slug
       lastViewedAt → timestamp of the most recent view
       Used for "Trending Comparisons" feature in a future phase.
    ──────────────────────────────────────────────────────────────────────────── */
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastViewedAt: {
      type: Date,
      default: null,
    },

    /* ── Metadata (reserved for Phase 4) ─────────────────────────────────────
       Flexible bucket for AI-generated SEO and content fields:
         metaTitle, metaDescription, summary, pros, cons, faq, schemaOrg, etc.
       Using Mixed type keeps Phase 2 lean while avoiding future migrations.
    ──────────────────────────────────────────────────────────────────────────── */
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

/* ─── Indexes ────────────────────────────────────────────────────────────────
   slug is already uniquely indexed above.
   Compound index on products array for reverse-lookup (find by product set).
────────────────────────────────────────────────────────────────────────────── */
ComparisonSchema.index({ products: 1 });
ComparisonSchema.index({ viewCount: -1 }); // for trending queries

module.exports = mongoose.model("Comparison", ComparisonSchema);
