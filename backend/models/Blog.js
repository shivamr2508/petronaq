const mongoose = require("mongoose");
const { toReadableSlug, generateUniqueSlug } = require("../utils/slugify");
const { stripDangerousContent, sanitizePlainText, sanitizeTextArray } = require("../utils/sanitize");

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [160, "Title cannot exceed 160 characters"],
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      minlength: [3, "Slug must be at least 3 characters"],
      maxlength: [100, "Slug cannot exceed 100 characters"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      minlength: [20, "Content must be at least 20 characters"],
    },
    excerpt: {
      type: String,
      default: "",
      maxlength: [320, "Excerpt cannot exceed 320 characters"],
    },
    featuredImage: {
      type: String,
      default: "",
      trim: true,
    },
    images: [
      {
        type: String,
        trim: true,
      },
    ],
    category: {
      type: String,
      default: "General",
      trim: true,
      minlength: [2, "Category must be at least 2 characters"],
      maxlength: [60, "Category cannot exceed 60 characters"],
    },
    tags: [
      {
        type: String,
        trim: true,
        minlength: [2, "Tag must be at least 2 characters"],
        maxlength: [30, "Tag cannot exceed 30 characters"],
      },
    ],
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author is required"],
    },
    status: {
      type: String,
      enum: ["draft", "published", "scheduled"],
      default: "draft",
    },
    featured: {
      type: Boolean,
      default: false,
    },
    metaTitle: {
      type: String,
      default: "",
      maxlength: [70, "Meta title cannot exceed 70 characters"],
    },
    metaDescription: {
      type: String,
      default: "",
      maxlength: [160, "Meta description cannot exceed 160 characters"],
    },
    canonical: {
      type: String,
      default: "",
      trim: true,
    },
    faq: [
      {
        question: { type: String, trim: true, maxlength: 160 },
        answer: { type: String, trim: true, maxlength: 1000 },
      },
    ],
    relatedProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    views: {
      type: Number,
      default: 0,
      min: [0, "Views cannot be negative"],
    },
    readingTime: {
      type: Number,
      default: 0,
      min: [1, "Reading time cannot be less than 1"],
    },
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

blogSchema.index({ slug: 1 }, { unique: true, sparse: true });
blogSchema.index({ status: 1, publishedAt: -1 });
blogSchema.index({ featured: 1, status: 1, publishedAt: -1 });
blogSchema.index({ category: 1, status: 1, publishedAt: -1 });
blogSchema.index({ tags: 1, status: 1 });
blogSchema.index({ author: 1, createdAt: -1 });
blogSchema.index({ views: -1, publishedAt: -1 });
blogSchema.index({ title: "text", slug: "text", category: "text", tags: "text", content: "text" });

blogSchema.pre("validate", async function (next) {
  if (this.isModified("title") || !this.slug) {
    const baseSlug = toReadableSlug(this.title || "blog");
    this.slug = baseSlug || "blog";
  }

  if (this.isModified("content") || !this.readingTime) {
    const plainText = (this.content || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const words = plainText ? plainText.split(" ").length : 0;
    this.readingTime = Math.max(1, Math.ceil(words / 200));
  }

  if (this.isModified("excerpt") || !this.excerpt) {
    const excerptSource = this.excerpt || this.content || "";
    const stripped = stripDangerousContent(excerptSource).replace(/<[^>]*>/g, " ");
    const plainExcerpt = sanitizePlainText(stripped).substring(0, 320);
    this.excerpt = plainExcerpt;
  }

  if (this.isModified("title") || !this.metaTitle) {
    this.metaTitle = sanitizePlainText(this.metaTitle || this.title || "");
  }

  if (this.isModified("content") || !this.metaDescription) {
    const plainText = sanitizePlainText(stripDangerousContent(this.content || ""));
    this.metaDescription = plainText.substring(0, 160);
  }

  if (this.status === "published" && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  if (!this.slug || this.isModified("title")) {
    this.slug = await generateUniqueSlug(this.slug || this.title || "blog", this._id, mongoose.model("Blog"));
  }

  this.title = sanitizePlainText(this.title);
  this.category = sanitizePlainText(this.category);
  this.tags = sanitizeTextArray(this.tags || []);
  this.content = stripDangerousContent(this.content || "");
  this.featuredImage = sanitizePlainText(this.featuredImage || "");
  this.canonical = sanitizePlainText(this.canonical || "");
  this.metaTitle = sanitizePlainText(this.metaTitle || "");
  this.metaDescription = sanitizePlainText(this.metaDescription || "");
  this.faq = (this.faq || []).map((item) => ({
    question: sanitizePlainText(item.question || ""),
    answer: sanitizePlainText(item.answer || ""),
  }));

  next();
});

module.exports = mongoose.model("Blog", blogSchema);
