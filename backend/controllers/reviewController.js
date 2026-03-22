const Review = require("../models/Review");
const Order = require("../models/Order");
const Product = require("../models/Product");

// CREATE REVIEW
exports.createReview = async (req, res) => {

  console.log("BODY:", req.body);
console.log("FILE:", req.file);

  try {

      const rating = Number(req.body.rating);
      const comment = req.body.comment;

    const productId = req.params.productId;

    const userId = req.user._id;

    // 1️⃣ Find delivered order containing this product

    const order = await Order.findOne({

      user: userId,
      status: "Delivered",
      "items.product": productId

    });

    if (!order) {

      return res.status(400).json({
        message: "You can review only delivered purchased products"
      });

    }

    // 2️⃣ Prevent duplicate review

    const existingReview = await Review.findOne({
      user: userId,
      product: productId
    });

    if (existingReview) {

      return res.status(400).json({
        message: "You already reviewed this product"
      });

    }

    // 3️⃣ Create review

     const imagePath = req.file
  ? `/uploads/reviews/${req.file.filename}`
  : "";

    const review = await Review.create({

      user: userId,
      product: productId,
      order: order._id,

      rating,
      comment,

       images: imagePath ? [imagePath] : [],

      isVerifiedPurchase: true

    });

    // 4️⃣ Update product rating automatically

    const reviews = await Review.find({ product: productId });

    const avgRating =
      reviews.reduce((acc, item) => acc + item.rating, 0)
      / reviews.length;

    await Product.findByIdAndUpdate(productId, {

      ratings: avgRating,
      numReviews: reviews.length

    });

    res.status(201).json(review);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server error"
    });

  }

};

// GET REVIEWS FOR PRODUCT
exports.getProductReviews = async (req, res) => {

  try {

    const reviews = await Review.find({
      product: req.params.productId
    })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    res.json(reviews);

  } catch (error) {

    res.status(500).json({
      message: "Server error"
    });

  }

};


// CHECK IF USER REVIEWED PRODUCT
exports.checkIfReviewed = async (req, res) => {

  try {

    const review = await Review.findOne({
      user: req.user._id,
      product: req.params.productId
    });

    if (review) {

      return res.json({ reviewed: true });

    }

    res.json({ reviewed: false });

  } catch (error) {

    res.status(500).json({
      message: "Server error"
    });

  }

};


// ADMIN - GET ALL REVIEWS
exports.getAllReviews = async (req, res) => {
  try {

    const reviews = await Review.find()
      .populate("user", "name")
      .populate("product", "name")
      .sort({ createdAt: -1 });

    res.json(reviews);

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};


// ADMIN - DELETE REVIEW
exports.deleteReview = async (req, res) => {
  try {

    await Review.findByIdAndDelete(req.params.id);

    res.json({ message: "Review deleted" });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};


// ADMIN - REPLY TO REVIEW
exports.replyToReview = async (req, res) => {
  try {

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    review.adminReply = req.body.reply;
    review.repliedAt = new Date();

    await review.save();

    res.json({ message: "Reply added" });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};