// const User = require("../models/User");
// const Product = require("../models/Product");
// const Order = require("../models/Order");

// exports.getAnalytics = async (req, res) => {
//   try {
//     const totalUsers = await User.countDocuments();

//     const totalProducts = await Product.countDocuments();

//     const totalOrders = await Order.countDocuments();

//     const orders = await Order.find();

//     const totalRevenue = orders.reduce(
//       (sum, order) => sum + order.totalAmount,
//       0
//     );

//     res.json({
//       totalUsers,
//       totalProducts,
//       totalOrders,
//       totalRevenue,
//     });

//   } catch (error) {
//     res.status(500).json({
//       message: error.message,
//     });
//   }
// };




const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");

exports.getAnalytics = async (req, res) => {
  try {

    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    const orders = await Order.find();

    // TOTAL REVENUE

    const totalRevenue = orders
  .filter(order => order.status === "Delivered")
  .reduce((sum, order) => sum + order.totalAmount, 0);

    // const totalRevenue = orders.reduce(
    //   (sum, order) => sum + order.totalAmount,
    //   0
    // );

    // DELIVERED PRODUCTS & REVENUE
    let deliveredProducts = 0;
    let deliveredRevenue = 0;

    orders.forEach(order => {
      if (order.status === "Delivered") {
        deliveredRevenue += order.totalAmount;

        order.items.forEach(item => {
          deliveredProducts += item.quantity;
        });
      }
    });

    // ORDER STATUS COUNTS (for pie chart)
    const orderStatus = {};

    orders.forEach(order => {
      orderStatus[order.status] = (orderStatus[order.status] || 0) + 1;
    });

    // MONTHLY SALES (for line chart)
    const monthlySales = {};

    orders.forEach(order => {
      if (order.status === "Delivered") {

        const month = new Date(order.createdAt).toLocaleString("default", {
          month: "short"
        });

        monthlySales[month] =
          (monthlySales[month] || 0) + order.totalAmount;
      }
    });

    const dailySales = {};

orders.forEach(order => {

  if (order.status === "Delivered") {

    const day = new Date(order.createdAt).toLocaleDateString();

    dailySales[day] = (dailySales[day] || 0) + order.totalAmount;

  }

});

const dailySalesArray = Object.entries(dailySales).map(
  ([day, revenue]) => ({ day, revenue })
);

// LOW STOCK PRODUCTS

const lowStockProducts = await Product.find({
  stock: { $lte: 5 }
})
.select("name stock")
.limit(5);


    res.json({
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      deliveredProducts,
      deliveredRevenue,
      orderStatus,
      monthlySales,
      dailySales: dailySalesArray,
      lowStockProducts
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};