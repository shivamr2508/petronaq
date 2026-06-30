const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const calculateDeliveryCharge = require("../utils/deliveryCharge");
const Address = require("../models/Address");
const sendEmail = require("../utils/sendEmail");
const User = require("../models/User");

// Place order (COD)

exports.placeOrder = async (req, res) => {
  try {

    const { addressId, items, discount = 0 } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        message: "No items to order"
      });
    }

    // Get address
    const address = await Address.findById(addressId);

    if (!address) {
      return res.status(404).json({
        message: "Address not found"
      });
    }

    // Delivery charge
    const deliveryCharge = calculateDeliveryCharge(
      address.lat,
      address.lng
    );

    if (deliveryCharge === null) {
      return res.status(400).json({
        message: "Delivery not available in your area"
      });
    }

    let subtotal = 0;
    const orderItems = [];

    // PROCESS ORDER ITEMS
    for (const item of items) {

      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({
          message: "Product not found"
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Only ${product.stock} left in stock for ${product.name}`
        });
      }

      // Reduce stock
      product.stock -= item.quantity;
      await product.save();

      const finalPrice = product.discountPrice > 0
  ? product.discountPrice
  : product.price;

     subtotal += finalPrice * item.quantity;

      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.images[0] || "",
        price: finalPrice,
        quantity: item.quantity
      });
    }

  

   const totalAmount = Math.max(
  0,
  subtotal - discount + deliveryCharge
);

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      address: addressId,
      subtotal,
      discount,
      deliveryCharge,
      totalAmount
    });

    // REMOVE ORDERED ITEMS FROM CART
    const cart = await Cart.findOne({ user: req.user._id });

    if (cart) {

      cart.items = cart.items.filter(cartItem => {

        const orderedItem = items.find(
          i => i.productId === cartItem.product.toString()
        );

        return !orderedItem;

      });

      await cart.save();
    }

    // EMAIL
// 👇 Frontend ko turant response bhejo
res.status(201).json(order);

// 👇 Background me email bhejo
(async () => {
  try {

    const user = await User.findById(req.user._id); 

    const itemsList = order.items
      .map(item => `${item.name} x ${item.quantity}`)
      .join("<br>");

    const message = `
<div style="font-family: Arial; padding:20px">

<h2 style="color:#ff6b6b">PetRonaq 🐾</h2>

<h3>Order Confirmed</h3>

<p>Hello <b>${user.name}</b>,</p>

<p>Your order has been placed successfully.</p>

<hr/>

<p><b>Order ID:</b> ${order._id}</p>

<p><b>Items:</b><br>
${itemsList}
</p>

<p><b>Total Amount:</b> ₹${order.totalAmount}</p>

<hr/>

<p>We will notify you when your order is shipped.</p>

<p style="margin-top:20px">
Thank you for shopping with <b>PetRonaq</b> 🐾
</p>

</div>
`;

    await sendEmail(
      user.email,
      "Order Confirmation - PetRonaq",
      message
    );

    console.log("Order email sent");

  } catch (err) {

    console.log("Email failed:", err.message);

  }

})();

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: error.message
    });

  }
};



// Get user orders
exports.getUserOrders = async (req, res) => {
  try {

    const orders = await Order.find({ user: req.user._id })
      .populate("address");

    res.json(orders);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};


// Admin get all orders
exports.getAllOrders = async (req, res) => {
  try {

    const orders = await Order.find()
      .populate("user", "name email")
      .populate("address");

    res.json(orders);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};



// Admin update order status
exports.updateOrderStatus = async (req, res) => {

  try {

    const { status } = req.body;

    const order = await Order.findById(req.params.id)
      .populate("user", "name email");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = req.body.status;
    await order.save();

    if (status === "Delivered") {

      const itemsList = order.items
        .map(item => `${item.name} x ${item.quantity}`)
        .join("<br>");

      const reviewLink =
        `http://localhost:5173/review/${order.items[0].product}`;

      const message = `
<div style="font-family: Arial; padding:20px">

<h2 style="color:#ff6b6b">PetRonaq 🐾</h2>

<h3>Your Order Has Been Delivered 🎉</h3>

<p>Hello <b>${order.user.name}</b>,</p>

<p>Your order <b>${order._id}</b> has been delivered successfully.</p>

<hr/>

<p><b>Items:</b><br>
${itemsList}
</p>

<hr/>

<p>We hope your pet loves it 🐶🐱</p>

<a href="${reviewLink}"
style="
display:inline-block;
margin-top:15px;
padding:10px 16px;
background:#ff6b6b;
color:white;
text-decoration:none;
border-radius:6px;
font-weight:bold;
">
Leave a Review
</a>

<p style="margin-top:20px">
Thank you for shopping with PetRonaq 🐾
</p>

</div>
`;

      try {
        await sendEmail(
          order.user.email,
          "Order Delivered - PetRonaq",
          message
        );
      } catch (error) {
        console.log("Email failed:", error.message);
      }

    }

    res.json(order);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};


















// const Order = require("../models/Order");
// const Cart = require("../models/Cart");
// const Product = require("../models/Product");
// const calculateDeliveryCharge = require("../utils/deliveryCharge");
// const Address = require("../models/Address");
// const sendEmail = require("../utils/sendEmail");
// const User = require("../models/User");

// // Place order (COD)
// exports.placeOrder = async (req, res) => {
//   try {
//     const { addressId, items } = req.body;

//     // Get full address with lat lng
//     const address = await Address.findById(addressId);

//     if (!address) {
//       return res.status(404).json({
//         message: "Address not found",
//       });
//     }

//     // Calculate delivery charge
//     const deliveryCharge = calculateDeliveryCharge(
//       address.lat,
//       address.lng
//     );

//     if (deliveryCharge === null) {
//       return res.status(400).json({
//         message: "Delivery not available in your area",
//       });
//     }

//     // const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");

//     // if (!cart || cart.items.length === 0) {
//     //   return res.status(400).json({
//     //     message: "Cart is empty",
//     //   });
//     // }


//     let subtotal = 0;
// const orderItems = [];

// for (const item of items) {

//   const product = await Product.findById(item.productId);

//   if (!product) {
//     return res.status(404).json({
//       message: "Product not found"
//     });
//   }

//   // 🚨 STOCK VALIDATION
//   if (product.stock < item.quantity) {
//     return res.status(400).json({
//       message: `Only ${product.stock} left in stock for ${product.name}`
//     });
//   }

//   // ✅ Reduce stock
//   product.stock -= item.quantity;
//   await product.save();

//   subtotal += product.price * item.quantity;

//   // orderItems.push({
//   //   product: product._id,
//   //   quantity: item.quantity,
//   //   price: product.price
//   // });

//   orderItems.push({
//   product: product._id,
//   name: product.name,               // ✅ snapshot name
//   image: product.images[0] || "",   // ✅ snapshot image
//   price: product.price,             // ✅ snapshot price
//   quantity: item.quantity
// });

// }

//     const discount = 0;

//     const totalAmount =
//       subtotal - discount + deliveryCharge;

//     const order = await Order.create({
//       user: req.user._id,
//       items: orderItems,
//       address: addressId,
//       subtotal,
//       discount,
//       deliveryCharge,
//       totalAmount,
//     });

//     // Clear cart

//     // cart.items = [];
//     // await cart.save();

// //     if (req.body.productId) {

// //   cart.items = cart.items.filter(
// //     item => item.product.toString() !== req.body.productId
// //   );

// // } else {

// //   cart.items = [];

// // }

// // await cart.save();

//     const user = await User.findById(req.user._id);

//     const itemsList = order.items
//   .map(item => `${item.name} x ${item.quantity}`)
//   .join("<br>");

// const message = `
// <div style="font-family: Arial; padding:20px">

// <h2 style="color:#ff6b6b">PetRonaq 🐾</h2>

// <h3>Order Confirmed</h3>

// <p>Hello <b>${user.name}</b>,</p>

// <p>Your order has been placed successfully.</p>

// <hr/>

// <p><b>Order ID:</b> ${order._id}</p>

// <p><b>Items:</b><br>
// ${itemsList}
// </p>

// <p><b>Total Amount:</b> ₹${order.totalAmount}</p>

// <hr/>

// <p>We will notify you when your order is shipped.</p>

// <p style="margin-top:20px">
// Thank you for shopping with <b>PetRonaq</b> 🐾
// </p>

// </div>
// `;


// try {
//   await sendEmail(
//     user.email,
//     "Order Confirmation - PetRonaq",
//     message
//   );
// } catch (error) {
//   console.log("Email failed:", error.message);
// }

//     res.status(201).json(order);

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       message: error.message,
//     });
//   }
// };

// // Get user orders
// exports.getUserOrders = async (req, res) => {
//   try {
//     const orders = await Order.find({ user: req.user._id })
      
//       .populate("address");

//     res.json(orders);

//   } catch (error) {
//     res.status(500).json({
//       message: error.message,
//     });
//   }
// };

// // Admin get all orders
// exports.getAllOrders = async (req, res) => {
//   try {
//     const orders = await Order.find()
//       .populate("user", "name email")
    
//       .populate("address");

//     res.json(orders);

//   } catch (error) {
//     res.status(500).json({
//       message: error.message,
//     });
//   }
// };

// // Admin update order status

// // exports.updateOrderStatus = async (req, res) => {
// //   try {

// //     const { status } = req.body;

// //     const updatedOrder = await Order.findByIdAndUpdate(
// //       req.params.id,
// //       { status },
// //       { new: true }
// //     );

// //     if (!updatedOrder) {
// //       return res.status(404).json({
// //         message: "Order not found",
// //       });
// //     }

// //     res.json(updatedOrder);

// //   } catch (error) {
// //     res.status(500).json({
// //       message: error.message,
// //     });
// //   }
// // };


// exports.updateOrderStatus = async (req, res) => {
//   try {

//     const { status } = req.body;

//     const order = await Order.findById(req.params.id)
//       .populate("user", "name email");

//     if (!order) {
//       return res.status(404).json({ message: "Order not found" });
//     }

//     order.status = status;
//     await order.save();

//     if (status === "Delivered") {

//       const product = order.items[0];

//     const itemsList = order.items
//   .map(item => `${item.name} x ${item.quantity}`)
//   .join("<br>");

// const reviewLink =
// `http://localhost:5173/review/${order.items[0].product}`;

// const message = `
// <div style="font-family: Arial; padding:20px">

// <h2 style="color:#ff6b6b">PetRonaq 🐾</h2>

// <h3>Your Order Has Been Delivered 🎉</h3>

// <p>Hello <b>${order.user.name}</b>,</p>

// <p>Your order <b>${order._id}</b> has been delivered successfully.</p>

// <hr/>

// <p><b>Items:</b><br>
// ${itemsList}
// </p>

// <hr/>

// <p>We hope your pet loves it 🐶🐱</p>

// <a href="${reviewLink}"
// style="
// display:inline-block;
// margin-top:15px;
// padding:10px 16px;
// background:#ff6b6b;
// color:white;
// text-decoration:none;
// border-radius:6px;
// font-weight:bold;
// ">
// Leave a Review
// </a>

// <p style="margin-top:20px">
// Thank you for shopping with PetRonaq 🐾
// </p>

// </div>
// `;

//    try {
//   await sendEmail(
//     order.user.email,
//     "Order Delivered - PetRonaq",
//     message
//   );
// } catch (error) {
//   console.log("Email failed:", error.message);
// }
//     }

//     res.json(order);

//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };


