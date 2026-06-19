import axios from "axios";
import { API_BASE } from "../config/api";

const API_URL = `${API_BASE}/api/cart`;

export const addToCart = async (productId, quantity = 1) => {

  const token = localStorage.getItem("token");

  const response = await axios.post(
    `${API_URL}/add`,
    {
      productId,
      quantity
    },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return response.data;
};


export const getCart = async () => {

  const token = localStorage.getItem("token");

  const response = await axios.get(
    API_URL,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const removeFromCart = async (productId) => {

  const token = localStorage.getItem("token");

  await axios.delete(
    `${API_URL}/remove/${productId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

};

export const updateCartItem = async (productId, quantity) => {

  const token = localStorage.getItem("token");

  const res = await axios.put(

    `${API_URL}/update`,

    {
      productId,
      quantity
    },

    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }

  );

  return res.data;

};