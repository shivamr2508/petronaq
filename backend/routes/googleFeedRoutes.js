const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

router.get("/merchant-feed.xml", async (req, res) => {
  const products = await Product.find();

  const items = products.map(product => `
    <item>
      <g:id>${product._id}</g:id>
      <g:title><![CDATA[${product.name}]]></g:title>
      <g:description><![CDATA[${product.description}]]></g:description>
      <g:link>https://www.petronaq.in/products/${product._id}</g:link>
      <g:image_link>${product.images?.[0]}</g:image_link>
      <g:availability>in stock</g:availability>
      <g:price>${product.discountPrice || product.price} INR</g:price>
      <g:condition>new</g:condition>
      <g:brand>PetRonaq</g:brand>
    </item>
  `).join("");

  const xml = `<?xml version="1.0"?>
  <rss version="2.0"
    xmlns:g="http://base.google.com/ns/1.0">
    <channel>
      <title>PetRonaq</title>
      <link>https://www.petronaq.in</link>
      ${items}
    </channel>
  </rss>`;

  res.header("Content-Type", "application/xml");
  res.send(xml);
});

module.exports = router;