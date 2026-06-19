import axios from "axios";

const API_URL =
  "https://petronaq-production.up.railway.app/api/auth";

export const loginUser = async (email, password) => {

  const response = await axios.post(
    `${API_URL}/login`,
    { email, password }
  );

  localStorage.setItem("token", response.data.token);
  localStorage.setItem("user", JSON.stringify(response.data));

  return response.data;

};

export const registerUser = async (name, email, password) => {

  const response = await axios.post(
    `${API_URL}/register`,
    { name, email, password }
  );

  localStorage.setItem("token", response.data.token);
  localStorage.setItem("user", JSON.stringify(response.data));

  return response.data;

};

export const logoutUser = () => {

  localStorage.removeItem("token");

};

export const getProfile = async () => {

  const token = localStorage.getItem("token");

  const response = await axios.get(
    "/api/auth/profile",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};


