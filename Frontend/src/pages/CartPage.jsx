import { useEffect, useState } from "react";
import { getCart, removeFromCart } from "../services/cartService";
import { useNavigate } from "react-router-dom";
import "../styles/cart.css";
import { showSuccess, showError } from "../utils/toast";

function CartPage() {
  const [cart, setCart] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      showError("Please login first");

      setTimeout(() => {
        navigate("/login");
      }, 1000);

      return;
    }

    fetchCart();
  }, [navigate]);

  const fetchCart = async () => {
    try {
      const data = await getCart();
      setCart(data);
    } catch (error) {
      showError("Failed to load cart");
    }
  };

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

  const handleRemove = async (productId) => {
    try {
      await removeFromCart(productId);

      showSuccess("Item removed from cart 🗑️");

      fetchCart();
    } catch (error) {
      showError("Failed to remove item");
    }
  };

  if (!localStorage.getItem("token")) {
    return (
      <div className="login-required">
        <h2>🔒 Login Required</h2>
        <p>Please login first to view your cart.</p>

        <button
          className="checkout-btn"
          onClick={() => navigate("/login")}
        >
          Login
        </button>
      </div>
    );
  }

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
              <h3 className="product-name">
                {item.product?.name}
              </h3>

              <p className="product-price">
                ₹{item.product?.price}
              </p>

              <p className="product-qty">
                Quantity: <span>{item.quantity}</span>
              </p>

              <div className="cart-buttons">
                <button
                  className="remove"
                  onClick={() =>
                    handleRemove(item.product._id)
                  }
                >
                  Remove
                </button>

                <button
                  className="checkout-btn"
                  onClick={() =>
                    handleCheckoutSingle(item.product._id)
                  }
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