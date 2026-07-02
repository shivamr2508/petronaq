import axios from "axios";
import { API_BASE } from "../config/api";

const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  },
});

export const blogService = {
  getStats: async () => {
    const response = await axios.get(`${API_BASE}/api/blogs/stats`, getAuthHeaders());
    return response.data;
  },

  getAdminBlogs: async (params = {}) => {
    const response = await axios.get(`${API_BASE}/api/blogs/admin`, {
      ...getAuthHeaders(),
      params,
    });
    return response.data;
  },

  getBlogById: async (id) => {
    const response = await axios.get(`${API_BASE}/api/blogs/admin/${id}`, getAuthHeaders());
    return response.data;
  },

  createBlog: async (payload) => {
    const response = await axios.post(`${API_BASE}/api/blogs`, payload, getAuthHeaders());
    return response.data;
  },

  updateBlog: async (id, payload) => {
    const response = await axios.put(`${API_BASE}/api/blogs/${id}`, payload, getAuthHeaders());
    return response.data;
  },

  deleteBlog: async (id) => {
    const response = await axios.delete(`${API_BASE}/api/blogs/${id}`, getAuthHeaders());
    return response.data;
  },

  bulkUpdateBlogs: async (payload) => {
    const response = await axios.post(`${API_BASE}/api/blogs/bulk`, payload, getAuthHeaders());
    return response.data;
  },

  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append("image", file);
    const response = await axios.post(`${API_BASE}/api/upload`, formData, getAuthHeaders());
    return response.data.url;
  },

  getProducts: async () => {
    const response = await axios.get(`${API_BASE}/api/blogs/products`);
    return response.data;
  },

  getCategories: async () => {
    const response = await axios.get(`${API_BASE}/api/blogs/categories`);
    return response.data;
  },

  getTags: async () => {
    const response = await axios.get(`${API_BASE}/api/blogs/tags`);
    return response.data;
  },
};
