const Coupon = require("../models/Coupon");

// GET all coupons
exports.getCoupons = async (req, res) => {

  const coupons = await Coupon.find();

  res.json(coupons);

};

// CREATE coupon
exports.createCoupon = async (req, res) => {

  const { code, discount } = req.body;

  const coupon = new Coupon({
    code,
    discount,
  });

  await coupon.save();

  res.json(coupon);

};

// DELETE coupon
exports.deleteCoupon = async (req, res) => {

  await Coupon.findByIdAndDelete(req.params.id);

  res.json({
    message: "Coupon deleted",
  });

};