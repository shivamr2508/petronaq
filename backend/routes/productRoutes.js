const express = require("express");
const router = express.Router();


const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const { protect, admin } = require("../middleware/authMiddleware");

// Admin only
router.post("/", protect, admin, createProduct);

// Public
router.get("/", getProducts);
router.get("/:identifier", getProductById);

router.put("/:id", protect, admin, updateProduct);

router.delete("/:id", protect, admin, deleteProduct);

module.exports = router;