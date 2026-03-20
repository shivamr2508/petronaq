import axios from "axios";

const API_URL = "http://localhost:5000/api/auth";

export const loginUser = async (email, password) => {

  const response = await axios.post(
    `${API_URL}/login`,
    { email, password }
  );

  localStorage.setItem("token", response.data.token);

  return response.data;

};

export const registerUser = async (name, email, password) => {

  const response = await axios.post(
    `${API_URL}/register`,
    { name, email, password }
  );

  localStorage.setItem("token", response.data.token);

  return response.data;

};

export const logoutUser = () => {

  localStorage.removeItem("token");

};

export const getProfile = async () => {

  const token = localStorage.getItem("token");

  const response = await axios.get(
    "http://localhost:5000/api/auth/profile",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};


