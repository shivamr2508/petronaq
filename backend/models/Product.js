const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
{
  name: {
    type: String,
    required: true,
  },

  slug: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },

  // 🔹 NEW (Small description)
  smallDescription: {
    type: String,
    required: true,
  },

  // 🔹 BIG description (already exists)
  description: {
    type: String,
    required: true,
  },

  // 🔹 ORIGINAL PRICE (MRP)
  price: {
    type: Number,
    required: true,
  },

  // 🔹 DISCOUNT PRICE (Selling price)
  discountPrice: {
    type: Number,
    default: 0,
  },

  petTypes: [
    {
      type: String,
      enum: ["Dog", "Cat", "Fish", "Bird"],
    }
  ],

  // ✅ ADD "Treats" HERE
  categories: [
    {
      type: String,
      enum: ["Food", "Toys", "Accessories", "Grooming", "Beds", "Health", "Treats"],
    }
  ],

  stock: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },

  images: [
    {
      type: String,
    },
  ],

  ratings: {
    type: Number,
    default: 0,
  },

  numReviews: {
    type: Number,
    default: 0,
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
},
{
  timestamps: true,
}
);

module.exports = mongoose.model("Product", productSchema);