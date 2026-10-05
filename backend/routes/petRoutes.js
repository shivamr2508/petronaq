const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { protect, admin } = require("../middleware/authMiddleware");

const {
  generatePet,
  getPublicPetProfile,
  activatePet,
  resetPetPin,
} = require("../controllers/petController");

// IP Rate limiter for activation
const activationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  skipSuccessfulRequests: true, // Only count failed requests (status >= 400)
  handler: (req, res) => {
    res.status(429).json({ 
      success: false, 
      message: "Too many activation attempts. Please try again after 15 minutes." 
    });
  }
});

// Protected Routes
// @route   POST /api/pets/activate
router.post("/activate", protect, activationLimiter, activatePet);

// Admin Routes
// @route   POST /api/pets/admin/generate
router.post("/admin/generate", protect, admin, generatePet);

// @route   POST /api/pets/admin/reset-pin
router.post("/admin/reset-pin", protect, admin, resetPetPin);

// Public Routes
// @route   GET /api/pets/public/:token
router.get("/public/:token", getPublicPetProfile);

module.exports = router;
