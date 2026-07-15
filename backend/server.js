const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
// const dotenv = require("dotenv");
const connectDB = require("./config/db");
const cartRoutes = require("./routes/cartRoutes");
const addressRoutes = require("./routes/addressRoutes");
const orderRoutes = require("./routes/orderRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");

const couponRoutes = require("./routes/couponRoutes");

const reviewRoutes = require("./routes/reviewRoutes");

const adminRoutes = require("./routes/adminRoutes");

const { protect } = require("./middleware/authMiddleware");

const sitemapRoutes = require("./routes/sitemapRoutes");

const productRoutes = require("./routes/productRoutes");
const googleFeedRoutes = require("./routes/googleFeedRoutes");
const blogRoutes = require("./routes/blogRoutes");
const newsletterRoutes = require("./routes/newsletterRoutes");
const compareRoutes = require("./routes/compareRoutes");
const Product = require("./models/Product");




// Connect Database
connectDB();

const app = express();

app.use("/", googleFeedRoutes);

app.use(cors());
app.use(express.json());

const authRoutes = require("./routes/authRoutes");

app.use("/api/auth", authRoutes);

app.use("/", sitemapRoutes);

app.use("/api/products", productRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/newsletter", newsletterRoutes);

const uploadRoutes = require("./routes/uploadRoutes");

app.use("/api/upload", uploadRoutes);

app.use("/api/cart", cartRoutes);

app.use("/api/address", addressRoutes);

app.use("/api/orders", orderRoutes);

app.use("/api/wishlist", wishlistRoutes);

app.use("/api/reviews", reviewRoutes);

app.use("/api/coupons", couponRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/coupons", couponRoutes);

app.use("/api/compare", compareRoutes);

app.get("/api/debug/groq", async (req, res) => {
  try {
    let rawKey = process.env.GROQ_API_KEY ? String(process.env.GROQ_API_KEY).trim() : "";
    if ((rawKey.startsWith('"') && rawKey.endsWith('"')) || (rawKey.startsWith("'") && rawKey.endsWith("'"))) {
      rawKey = rawKey.slice(1, -1).trim();
    }

    const keyExists = Boolean(rawKey);
    console.log(`[DEBUG GROQ] API key loaded: exists=${keyExists}, First 8 chars=${keyExists ? rawKey.slice(0, 8) + "..." : "N/A"}`);

    if (!keyExists) {
      return res.status(400).json({
        success: false,
        error: "GROQ_API_KEY environment variable is not configured.",
        status: 400,
        responseBody: null,
        stack: null
      });
    }

    const Groq = require("groq-sdk");
    const groq = new Groq({ apiKey: rawKey });
    const model = "llama-3.3-70b-versatile";

    console.log(`[DEBUG GROQ] Request started: model=${model}`);
    const start = Date.now();

    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: 'Reply ONLY with:\n{"status":"ok"}'
        }
      ],
      model: model,
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const latency = Date.now() - start;
    console.log(`[DEBUG GROQ] Response received in ${latency}ms`);

    const rawResponse = response.choices?.[0]?.message?.content ? response.choices[0].message.content.trim() : "";
    let parsedResponse = null;
    try {
      parsedResponse = JSON.parse(rawResponse);
      console.log("[DEBUG GROQ] JSON parsed successfully:", parsedResponse);
    } catch (parseErr) {
      console.warn("[DEBUG GROQ] JSON parse error:", parseErr.message);
      parsedResponse = rawResponse;
    }

    return res.json({
      success: true,
      model,
      rawResponse,
      parsedResponse,
      latency
    });
  } catch (err) {
    console.error("[DEBUG GROQ] Error thrown during Groq test:", err);
    return res.status(500).json({
      success: false,
      error: err.message || String(err),
      status: err.status || err.statusCode || 500,
      responseBody: err.error || err.body || err.response || null,
      stack: err.stack || null
    });
  }
});

app.get(["/products/:identifier", "/product/:identifier"], async (req, res, next) => {
  const { identifier } = req.params;

  if (!/^[0-9a-fA-F]{24}$/.test(identifier)) {
    return next();
  }

  try {
    const product = await Product.findById(identifier).select("slug");
    if (product?.slug) {
      return res.redirect(301, `/products/${product.slug}`);
    }
  } catch (error) {
    console.error(error);
  }

  return next();
});

app.use("/uploads", express.static("uploads"));

//test ---------------------
app.get("/api/protected", protect, (req, res) => {
  res.json({
    message: "Protected route accessed",
    user: req.user,
  });
});
        
//---------------------------

// app.get("/", (req, res) => {        
//   res.send("PetRonaq API is running...");
// });

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../Frontend/dist")));

  app.get(["/products/:identifier", "/product/:identifier"], async (req, res, next) => {
    const { identifier } = req.params;

    if (!/^[0-9a-fA-F]{24}$/.test(identifier)) {
      return next();
    }

    try {
      const product = await Product.findById(identifier).select("slug");
      if (product?.slug) {
        return res.redirect(301, `/products/${product.slug}`);
      }
    } catch (error) {
      console.error(error);
    }

    return next();
  });

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname, "../Frontend", "dist", "index.html"))
  );
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
 
});        


