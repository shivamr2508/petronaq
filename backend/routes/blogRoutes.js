const express = require("express");
const router = express.Router();
const {
  createBlog,
  bulkUpdateBlogs,
  getBlogs,
  getFeaturedBlogs,
  getLatestBlogs,
  getPopularBlogs,
  getBlogByIdentifier,
  getBlogByAdmin,
  getAllAdminBlogs,
  updateBlog,
  deleteBlog,
  getBlogCategories,
  getBlogProducts,
  getBlogTags,
  getRelatedBlogs,
  getBlogStats,
} = require("../controllers/blogController");
const { protect, admin } = require("../middleware/authMiddleware");

router.get("/featured", getFeaturedBlogs);
router.get("/latest", getLatestBlogs);
router.get("/popular", getPopularBlogs);
router.get("/categories", getBlogCategories);
router.get("/products", getBlogProducts);
router.get("/tags", getBlogTags);
router.get("/search", getBlogs);
router.get("/related/:id", getRelatedBlogs);
router.get("/stats", protect, admin, getBlogStats);
router.get("/admin", protect, admin, getAllAdminBlogs);
router.get("/admin/:id", protect, admin, getBlogByAdmin);
router.post("/bulk", protect, admin, bulkUpdateBlogs);
router.post("/", protect, admin, createBlog);
router.get("/:identifier", getBlogByIdentifier);
router.put("/:id", protect, admin, updateBlog);
router.delete("/:id", protect, admin, deleteBlog);

module.exports = router;
