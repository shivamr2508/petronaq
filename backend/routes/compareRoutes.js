const express = require("express");
const router = express.Router();

const {
  findOrCreate,
  findComparison,
  findBySlug,
} = require("../controllers/compareController");

/* ═══════════════════════════════════════════════════════════════════════════════
   Compare Routes — PetRonaq AI Compare (Phase 2)

   IMPORTANT: /find MUST be registered before /:slug.
   If /:slug comes first, Express will match the literal string "find"
   as a slug parameter instead of routing to findComparison.
   ═══════════════════════════════════════════════════════════════════════════════ */

// GET /api/compare/find?products=id1,id2&type=dog&breed=labrador
// Check if a comparison already exists (no creation side-effect)
router.get("/find", findComparison);

// POST /api/compare/create
// Idempotent: returns existing comparison or creates a new draft
router.post("/create", findOrCreate);

// GET /api/compare/:slug
// Fetch a comparison by slug + increment viewCount
router.get("/:slug", findBySlug);

module.exports = router;
