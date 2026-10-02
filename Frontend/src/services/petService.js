import axios from "axios";
import { API_BASE } from "../config/api";

const API_URL = `${API_BASE}/api/pets`;

export const getPublicPetProfile = async (token) => {
  const response = await axios.get(`${API_URL}/public/${token}`);
  return response.data;
};
