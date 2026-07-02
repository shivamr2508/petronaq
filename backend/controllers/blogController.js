const Blog = require("../models/Blog");
const BlogView = require("../models/BlogView");
const Product = require("../models/Product");
const { toReadableSlug, generateUniqueSlug } = require("../utils/slugify");
const { sanitizePlainText, sanitizeTextArray } = require("../utils/sanitize");

const buildBlogQuery = (value) => {
  if (!value) return null;
  if (/^[0-9a-fA-F]{24}$/.test(value)) {
    return { _id: value };
  }
  return { slug: value };
};

const getReadingTime = (content = "") => {
  const plainText = String(content || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = plainText ? plainText.split(" ").length : 0;
  return Math.max(1, Math.ceil(words / 200));
};

const parsePagination = (req) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(24, Math.max(1, Number(req.query.limit) || 12));
  return { page, limit, skip: (page - 1) * limit };
};

const buildBlogFilter = (req) => {
  const filter = { status: "published" };

  if (req.query.category) {
    filter.category = sanitizePlainText(req.query.category);
  }

  if (req.query.tag) {
    filter.tags = { $in: [sanitizePlainText(req.query.tag)] };
  }

  if (req.query.search) {
    const searchValue = sanitizePlainText(req.query.search);
    filter.$or = [
      { title: { $regex: searchValue, $options: "i" } },
      { slug: { $regex: searchValue, $options: "i" } },
      { tags: { $regex: searchValue, $options: "i" } },
      { category: { $regex: searchValue, $options: "i" } },
      { content: { $regex: searchValue, $options: "i" } },
    ];
  }

  return filter;
};

const formatBlogResponse = (blog) => {
  if (!blog) return null;
  const plainBlog = blog.toObject ? blog.toObject() : blog;
  return {
    ...plainBlog,
    excerpt: plainBlog.excerpt || "",
  };
};

exports.createBlog = async (req, res) => {
  try {
    const payload = req.body || {};

    if (!payload.title || String(payload.title).trim().length < 3) {
      return res.status(422).json({ message: "Title must be at least 3 characters" });
    }

    if (!payload.content || String(payload.content).trim().length < 20) {
      return res.status(422).json({ message: "Content must be at least 20 characters" });
    }

    const baseSlug = payload.slug || toReadableSlug(payload.title || "blog");
    const uniqueSlug = await generateUniqueSlug(baseSlug, null, Blog);

    const blog = await Blog.create({
      ...payload,
      title: sanitizePlainText(payload.title),
      category: sanitizePlainText(payload.category || "General"),
      tags: sanitizeTextArray(payload.tags || []),
      author: req.user._id,
      readingTime: getReadingTime(payload.content || ""),
      slug: uniqueSlug,
      publishedAt: payload.status === "published" ? payload.publishedAt || new Date() : null,
    });

    res.status(201).json(formatBlogResponse(blog));
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "A blog with this slug already exists" });
    }

    res.status(422).json({ message: error.message });
  }
};

exports.getBlogs = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req);
    const filter = buildBlogFilter(req);

    const [blogs, total] = await Promise.all([
      Blog.find(filter)
        .select("title slug excerpt featuredImage category tags readingTime publishedAt views author")
        .populate("author", "name")
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Blog.countDocuments(filter),
    ]);

    res.json({ blogs, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: "Unable to load blogs" });
  }
};

exports.getFeaturedBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ status: "published", featured: true })
      .select("title slug excerpt featuredImage category tags readingTime publishedAt author")
      .populate("author", "name")
      .sort({ publishedAt: -1 })
      .limit(6)
      .lean();
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: "Unable to load featured blogs" });
  }
};

exports.getLatestBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ status: "published" })
      .select("title slug excerpt featuredImage category tags readingTime publishedAt author")
      .populate("author", "name")
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(6)
      .lean();
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: "Unable to load latest blogs" });
  }
};

exports.getPopularBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ status: "published" })
      .select("title slug excerpt featuredImage category tags readingTime publishedAt views author")
      .populate("author", "name")
      .sort({ views: -1, publishedAt: -1 })
      .limit(6)
      .lean();
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: "Unable to load popular blogs" });
  }
};

exports.getBlogByIdentifier = async (req, res) => {
  try {
    const query = buildBlogQuery(req.params.identifier);
    const blog = await Blog.findOne(query)
      .populate("author", "name")
      .populate("relatedProducts", "name slug images discountPrice price");

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    if (blog.status !== "published") {
      return res.status(404).json({ message: "Blog not found" });
    }

    const fingerprint = req.headers["x-forwarded-for"] || req.ip || "unknown";
    const existingView = await BlogView.findOne({ blog: blog._id, fingerprint: String(fingerprint) });

    if (!existingView) {
      blog.views += 1;
      await blog.save({ validateBeforeSave: false });
      await BlogView.create({ blog: blog._id, fingerprint: String(fingerprint) });
    }

    res.json(formatBlogResponse(blog));
  } catch (error) {
    res.status(500).json({ message: "Unable to load blog" });
  }
};

exports.getBlogByAdmin = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).lean();
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: "Unable to load blog" });
  }
};

exports.getAllAdminBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find()
      .select("title slug status featured category publishedAt views readingTime author createdAt")
      .populate("author", "name")
      .sort({ createdAt: -1 })
      .lean();
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: "Unable to load admin blogs" });
  }
};

exports.updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const updatePayload = { ...req.body };
    if (updatePayload.title && updatePayload.title !== blog.title) {
      updatePayload.slug = await generateUniqueSlug(updatePayload.title, blog._id, Blog);
    }

    if (updatePayload.title) {
      updatePayload.title = sanitizePlainText(updatePayload.title);
    }

    if (updatePayload.category) {
      updatePayload.category = sanitizePlainText(updatePayload.category);
    }

    if (updatePayload.tags) {
      updatePayload.tags = sanitizeTextArray(updatePayload.tags);
    }

    if (updatePayload.content) {
      updatePayload.readingTime = getReadingTime(updatePayload.content);
    }

    if (updatePayload.status === "published" && !blog.publishedAt) {
      updatePayload.publishedAt = new Date();
    }

    Object.assign(blog, updatePayload);
    const updatedBlog = await blog.save();
    res.json(formatBlogResponse(updatedBlog));
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "A blog with this slug already exists" });
    }

    res.status(422).json({ message: error.message });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    await blog.deleteOne();
    res.json({ message: "Blog deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Unable to delete blog" });
  }
};

exports.bulkUpdateBlogs = async (req, res) => {
  try {
    const { ids = [], action, category } = req.body || {};
    if (!Array.isArray(ids) || !ids.length || !action) {
      return res.status(422).json({ message: "Select one or more blogs and an action" });
    }

    const query = { _id: { $in: ids } };

    if (action === "delete") {
      await Blog.deleteMany(query);
      return res.json({ message: "Blogs deleted successfully" });
    }

    const update = {};
    if (action === "publish") {
      update.status = "published";
      update.publishedAt = new Date();
    } else if (action === "draft") {
      update.status = "draft";
    } else if (action === "feature") {
      update.featured = true;
    } else if (action === "unfeature") {
      update.featured = false;
    } else if (action === "category") {
      if (!category) {
        return res.status(422).json({ message: "Category is required" });
      }
      update.category = sanitizePlainText(category);
    } else {
      return res.status(422).json({ message: "Unsupported action" });
    }

    await Blog.updateMany(query, update);
    res.json({ message: "Blogs updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Unable to perform bulk update" });
  }
};

exports.getBlogCategories = async (req, res) => {
  try {
    const categories = await Blog.distinct("category");
    res.json(categories.sort());
  } catch (error) {
    res.status(500).json({ message: "Unable to load categories" });
  }
};

exports.getBlogProducts = async (req, res) => {
  try {
    const products = await Product.find({})
      .select("name slug images price discountPrice")
      .lean();

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Unable to load products" });
  }
};

exports.getBlogTags = async (req, res) => {
  try {
    const tags = await Blog.distinct("tags");
    res.json([...new Set(tags.flat())].sort());
  } catch (error) {
    res.status(500).json({ message: "Unable to load tags" });
  }
};

exports.getRelatedBlogs = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const related = await Blog.find({
      _id: { $ne: blog._id },
      status: "published",
      $or: [
        { category: blog.category },
        { tags: { $in: blog.tags } },
      ],
    })
      .select("title slug excerpt featuredImage category tags readingTime publishedAt author")
      .populate("author", "name")
      .sort({ publishedAt: -1 })
      .limit(4)
      .lean();

    res.json(related);
  } catch (error) {
    res.status(500).json({ message: "Unable to load related blogs" });
  }
};

exports.getBlogStats = async (req, res) => {
  try {
    const [total, published, drafts, scheduled, featured] = await Promise.all([
      Blog.countDocuments(),
      Blog.countDocuments({ status: "published" }),
      Blog.countDocuments({ status: "draft" }),
      Blog.countDocuments({ status: "scheduled" }),
      Blog.countDocuments({ featured: true }),
    ]);

    res.json({ total, published, drafts, scheduled, featured });
  } catch (error) {
    res.status(500).json({ message: "Unable to load blog statistics" });
  }
};
