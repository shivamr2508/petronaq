const express = require("express");

const router = express.Router();

const {
  getCoupons,
  createCoupon,
  deleteCoupon,
} = require("../controllers/couponController");

const { protect, admin } = require("../middleware/authMiddleware");

router.get("/", protect, getCoupons);

router.post("/", protect, admin, createCoupon);

router.delete("/:id", protect, admin, deleteCoupon);

module.exports = router;