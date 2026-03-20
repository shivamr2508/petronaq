const express = require("express");
const router = express.Router();

const {
  addToCart,
  getCart,
  removeFromCart,
  updateCartItem,
} = require("../controllers/cartController");

const { protect } = require("../middleware/authMiddleware");

router.post("/add", protect, addToCart);

router.get("/", protect, getCart);

router.delete("/remove/:productId", protect, removeFromCart);

router.put("/update", protect, updateCartItem);

module.exports = router;