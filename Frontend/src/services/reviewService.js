import axios from "axios";

const BASE_URL = "http://localhost:5000/api/reviews";

export const getReviews = async (productId) => {

  const res = await axios.get(`${BASE_URL}/${productId}`);

  return res.data;

};

export const addReview = async (productId, reviewData) => {

  const token = localStorage.getItem("token");

  const res = await axios.post(
    `${BASE_URL}/${productId}`,
    reviewData,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return res.data;

};