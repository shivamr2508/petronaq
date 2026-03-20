const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    discountPrice: {
      type: Number,
      default: 0,
    },

      // NEW
   petTypes: [
  {
    type: String,
    enum: ["Dog", "Cat", "Fish", "Bird"],
  }
],

categories: [
  {
    type: String,
    enum: ["Food", "Toys", "Accessories", "Grooming", "Beds", "Health"],
  }
],

    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0, // prevents megative stock
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