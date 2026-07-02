require("dotenv").config({ path: "./.env" });
const mongoose = require("mongoose");
const Product = require("../models/Product");
const { generateProductSlug } = require("../utils/slugify");

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const products = await Product.find({ $or: [{ slug: { $exists: false } }, { slug: null }, { slug: "" }] });

    for (const product of products) {
      const slug = await generateProductSlug(product.name, product._id, Product);
      product.slug = slug;
      await product.save({ validateBeforeSave: false });
      console.log(`Generated slug for ${product.name}: ${slug}`);
    }

    console.log(`Done. Processed ${products.length} products.`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();
