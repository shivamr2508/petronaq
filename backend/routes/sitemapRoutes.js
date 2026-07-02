const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

router.get("/sitemap.xml", async (req, res) => {
  try {
    const products = await Product.find({}, "_id slug updatedAt");

    const urls = products
      .map(
        (p) => `
<url>
  <loc>https://www.petronaq.in/products/${p.slug || p._id}</loc>
  <lastmod>${p.updatedAt.toISOString()}</lastmod>
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

${urls}

</urlset>`;

    res.header("Content-Type", "application/xml");
    res.send(sitemap);

  } catch (err) {
    res.status(500).send("Error generating sitemap");
  }
});

module.exports = router;