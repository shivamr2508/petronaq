import { useLocation, useNavigate } from "react-router-dom";
import "../styles/orderSuccess.css";

function OrderSuccessPage() {

  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order;

  if (!order) {
    return (
      <div className="success-container">
        <h2>No order found</h2>
      </div>
    );
  }

  return (

    <div className="success-container">

      <div className="success-content">

        <div className="success-icon">🎉</div>

        <h1 className="success-title">
          Order Placed Successfully
        </h1>

        <p className="success-subtitle">
          Thank you for your order!
        </p>

        <div className="success-card">

          <div className="order-row">
            <span>Order ID</span>
            <span className="order-id">{order._id}</span>
          </div>

          <div className="order-row">
            <span>Total</span>
            <span className="order-total">
              ₹{order.totalAmount}
            </span>
          </div>

          <div className="order-row">
            <span>Status</span>
            <span className="order-status">
              {order.status}
            </span>
          </div>

        </div>

        <button
          className="continue-btn"
          onClick={() => navigate("/")}
        >
          Continue Shopping
        </button>

      </div>

    </div>

  );

}

export default OrderSuccessPage;