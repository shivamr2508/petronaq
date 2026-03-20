// import { useEffect, useState } from "react";
// import { getCart, removeFromCart } from "../services/cartService";
// import "../styles/cart.css";

// function CartPage() {

//   const [cart, setCart] = useState(null);

//   useEffect(() => {

//     fetchCart();

//   }, []);

//   const fetchCart = async () => {

//     const data = await getCart();

//     setCart(data);

//   };

//   const handleRemove = async (productId) => {

//     await removeFromCart(productId);

//     fetchCart();

//   };

//   if (!cart) return <p>Loading...</p>;

//   return (
//     <div className="container">

//       <h2>Your Cart</h2>

//       {cart.items.length === 0 && (
//         <p>Cart is empty</p>
//       )}

//       {cart.items.map((item) => (

//         <div key={item.product._id} className="cart-item">

//           <img
//             src={item.product?.images?.[0]}
//             className="cart-image"
//           />

//           <div className="cart-details">

//             <h3>{item.product.name}</h3>

//             <p>₹{item.product.price}</p>

//             <p>Quantity: {item.quantity}</p>

//             <button
//   className="btn btn-primary"
//   onClick={() => window.location.href = "/checkout"}
// >
//   Proceed to Checkout
// </button>

//           </div>

//         </div>

//       ))}

//     </div>
//   );
// }

// export default CartPage;



import { useEffect, useState } from "react";
import { getCart, removeFromCart } from "../services/cartService";
import { useNavigate } from "react-router-dom";
import "../styles/cart.css";

import { showSuccess, showError } from "../utils/toast";

function CartPage() {

  const [cart, setCart] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

 const fetchCart = async () => {

  try {
    const data = await getCart();
    setCart(data);
  } catch (error) {
    showError("Failed to load cart");
  }

};

//   const handleCheckoutSingle = (productId) => {
//   navigate(`/checkout?productId=${productId}`);
// };

const handleCheckoutSingle = (productId) => {

  const token = localStorage.getItem("token");

  if (!token) {
    showError("Please login first");

    setTimeout(() => {
      navigate("/login");
    }, 1000);

    return;
  }

  navigate(`/checkout?productId=${productId}`);
};

// const handleCheckoutAll = () => {
//   navigate("/checkout");
// };

const handleCheckoutAll = () => {

  const token = localStorage.getItem("token");

  if (!token) {
    showError("Please login first");

    setTimeout(() => {
      navigate("/login");
    }, 1000);

    return;
  }

  navigate("/checkout");
};

//   const handleCheckout = (productId) => {
//   navigate(`/checkout?productId=${productId}`);
// };

  const handleRemove = async (productId) => {

  try {
    await removeFromCart(productId);

    showSuccess("Item removed from cart 🗑️");

    fetchCart();

  } catch (error) {
    showError("Failed to remove item");
  }

};

  if (!cart) return <p>Loading...</p>;

   return (
    <div className="cart-container">

      <h2 className="cart-title">Your Cart</h2>

      {cart.items.length === 0 && (
        <p className="empty-cart">Your cart is empty 🐾</p>
      )}

      {cart.items.map((item) => {

        if (!item.product) return null;

        return (
          <div key={item.product._id} className="cart-card">

            <img
              src={item.product?.images?.[0]}
              alt={item.product?.name}
              className="cart-image"
            />

            <div className="cart-info">

              <h3 className="product-name">{item.product?.name}</h3>

              <p className="product-price">₹{item.product?.price}</p>

              <p className="product-qty">
                Quantity: <span>{item.quantity}</span>
              </p>

              <div className="cart-buttons">

                <button
                  className="remove"
                  onClick={() => handleRemove(item.product._id)}
                >
                  Remove
                </button>

                <button
                  className="checkout-btn"
                  onClick={() => handleCheckoutSingle(item.product._id)}
                >
                  Checkout
                </button>

              </div>

            </div>

          </div>
        );
      })}

      {cart.items.length > 0 && (

        <div className="checkout-all-container">

          <button
            className="checkout-all-btn"
            onClick={handleCheckoutAll}
          >
            Checkout All Products
          </button>

        </div>

      )}

    </div>
  );

}

export default CartPage;