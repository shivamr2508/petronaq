import axios from "axios";
import { API_BASE } from "../config/api";

const API_URL = `${API_BASE}/api/products`;



// export const getProducts = async (keyword = "") => {

//   const response = await axios.get(
//     `${API_URL}?keyword=${keyword}`
//   );

//   return response.data;

// };


export const getProducts = async (
  keyword = "",
  petType = "",
  category = ""
) => {

  let url = `${API_URL}?keyword=${keyword}`;

  if (petType) {
    url += `&petType=${petType}`;
  }

  if (category) {
    url += `&category=${category}`;
  }

  const response = await axios.get(url);

  return response.data;

};
