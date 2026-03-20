import axios from "axios";

const API_URL = "http://localhost:5000/api/cart";

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
    "http://localhost:5000/api/cart",
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
    `http://localhost:5000/api/cart/remove/${productId}`,
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

    "http://localhost:5000/api/cart/update",

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