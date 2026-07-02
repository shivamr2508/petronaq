const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Blog = require("../models/Blog");

router.get("/sitemap.xml", async (req, res) => {
  try {
    const [products, blogs] = await Promise.all([
      Product.find({}, "_id slug updatedAt"),
      Blog.find({ status: "published" }, "slug updatedAt"),
    ]);

    const productUrls = products
      .map(
        (p) => `
<url>
  <loc>https://www.petronaq.in/products/${p.slug || p._id}</loc>
  <lastmod>${p.updatedAt.toISOString()}</lastmod>
</url>`
      )
      .join("");

    const blogUrls = blogs
      .map(
        (b) => `
<url>
  <loc>https://www.petronaq.in/blog/${b.slug}</loc>
  <lastmod>${b.updatedAt.toISOString()}</lastmod>
</url>`
      )
      .join("");

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

<url>
  <loc>https://www.petronaq.in/</loc>
</url>

<url>
  <loc>https://www.petronaq.in/products</loc>
</url>

${productUrls}
${blogUrls}

</urlset>`;

    res.header("Content-Type", "application/xml");
    res.send(sitemap);

  } catch (err) {
    res.status(500).send("Error generating sitemap");
  }
});

module.exports = router;