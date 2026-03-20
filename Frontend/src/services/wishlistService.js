import axios from "axios";

const API_URL = "/api/wishlist";

export const getWishlist = async () => {

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

export const addToWishlist = async (productId) => {

  const token = localStorage.getItem("token");

  await axios.post(
    API_URL,
    { productId },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

};

export const removeFromWishlist = async (productId) => {

  const token = localStorage.getItem("token");

  await axios.delete(
    `${API_URL}/${productId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

};