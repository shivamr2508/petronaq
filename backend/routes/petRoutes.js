const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/authMiddleware");

const {
  generatePet,
  getPublicPetProfile,
} = require("../controllers/petController");

// Admin Routes
// @route   POST /api/pets/admin/generate
router.post("/admin/generate", protect, admin, generatePet);

// Public Routes
// @route   GET /api/pets/public/:token
router.get("/public/:token", getPublicPetProfile);

module.exports = router;
