import { useEffect, useState } from "react";
import { getMyOrders } from "../services/orderService";
import { useNavigate } from "react-router-dom";
import ReviewButton from "../components/ReviewButton";

import axios from "axios";
import "../styles/orders.css";

function OrdersPage() {

  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {

    fetchOrders();

  }, []);

  const fetchOrders = async () => {

    try {

      const data = await getMyOrders();

      setOrders(data);

    } catch (error) {

      console.error(error);

    }

    setLoading(false);

  };

  if (loading) {

    return <h2 className="center">Loading orders...</h2>;

  }

  if (orders.length === 0) {

    return <h2 className="center">No orders yet</h2>;

  }

      return (
    <div className="orders-container">

      <h2 className="orders-title">My Orders</h2>

      {orders.map((order) => (

        <div key={order._id} className="order-card">

          {/* ORDER HEADER */}
          <div className="order-header">

            <div className="order-id">
              Order #{order._id.slice(-6)}
            </div>

            <div className={`status-badge ${order.status}`}>
              {order.status}
            </div>

          </div>

          {/* ORDER META */}
          <div className="order-meta">

            <p className="order-total">
              Total: ₹{order.totalAmount}
            </p>

            <p className="order-date">
              {new Date(order.createdAt).toLocaleDateString()}
            </p>

          </div>

          {/* ORDER ITEMS */}
          <div className="order-items">

            {order.items.map((item, index) => (

              <div key={index} className="order-item">

                <img
                  src={item.image || "/no-image.png"}
                  alt={item.name}
                  className="order-image"
                />

                <div className="order-item-info">

                  <p className="product-name">
                    {item.name}
                  </p>

                  <p className="product-qty">
                    Qty: {item.quantity}
                  </p>

                  <p className="product-price">
                    ₹{item.price}
                  </p>

                  {order.status === "Delivered" && (
                    <ReviewButton
                      productId={item.product}
                      orderId={order._id}
                      navigate={navigate}
                    />
                  )}

                </div>

              </div>

            ))}

          </div>

        </div>

      ))}

    </div>
  );

}

export default OrdersPage;