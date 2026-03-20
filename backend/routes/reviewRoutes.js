const express = require("express");
const router = express.Router();
const { admin } = require("../middleware/authMiddleware");

const {
  createReview,
  getProductReviews,
  checkIfReviewed
} = require("../controllers/reviewController");

const {
  getAllReviews,
  deleteReview,
  replyToReview
} = require("../controllers/reviewController");

const { protect } = require("../middleware/authMiddleware");


// CREATE REVIEW (needs productId param)
router.post("/:productId", protect, createReview);

// CHECK IF REVIEWED (must be ABOVE :productId route)
router.get("/check/:productId", protect, checkIfReviewed);

// ADMIN
router.get("/admin/all", protect, admin, getAllReviews);

router.put("/reply/:id", protect, admin, replyToReview);

router.delete("/:id", protect, admin, deleteReview);


// GET PRODUCT REVIEWS
router.get("/:productId", getProductReviews);



module.exports = router;