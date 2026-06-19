import axios from "axios";
import { API_BASE } from "../config/api";

const API_URL = `${API_BASE}/api/orders`;

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
    `${API_URL}/my`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};