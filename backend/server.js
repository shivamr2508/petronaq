require("dotenv").config({ path: "./.env" });

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




// Connect Database
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

const authRoutes = require("./routes/authRoutes");

app.use("/api/auth", authRoutes);

const productRoutes = require("./routes/productRoutes");

app.use("/api/products", productRoutes);


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


const path = require("path");

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../Frontend/dist")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname, "../Frontend", "dist", "index.html"))
  );
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
 
});        


