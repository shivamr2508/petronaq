import axios from "axios";

const API_URL = "http://localhost:5000/api/orders";

export const placeOrder = async (orderData) => {

  const token = localStorage.getItem("token");

  const res = await axios.post(
    API_URL,
    orderData,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return res.data;

};

export const getMyOrders = async () => {

  const token = localStorage.getItem("token");

  const response = await axios.get(
    "http://localhost:5000/api/orders/my",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};