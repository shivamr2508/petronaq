import axios from "axios";

const API_URL = "http://localhost:5000/api/address";

export const getAddresses = async () => {

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

export const addAddress = async (data) => {

  const token = localStorage.getItem("token");

  const res = await axios.post(API_URL, data, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return res.data;

};

export const updateAddress = async (id, data) => {

  const token = localStorage.getItem("token");

  const res = await axios.put(
    `${API_URL}/${id}`,
    data,
    {
      headers:{
        Authorization:`Bearer ${token}`
      }
    }
  );

  return res.data;

};

export const deleteAddress = async (id) => {

  const token = localStorage.getItem("token");

  const res = await axios.delete(
    `${API_URL}/${id}`,
    {
      headers:{
        Authorization:`Bearer ${token}`
      }
    }
  );

  return res.data;

};