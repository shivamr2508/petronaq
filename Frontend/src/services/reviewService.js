import axios from "axios";
import { API_BASE } from "../config/api";

const BASE_URL = `${API_BASE}/api/reviews`;

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