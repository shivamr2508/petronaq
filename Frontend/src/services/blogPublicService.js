import axios from "axios";
import { API_BASE } from "../config/api";

const client = axios.create({
  baseURL: API_BASE,
});

export const blogPublicService = {
  getBlogs: async (params = {}) => {
    const response = await client.get("/api/blogs/search", { params });
    return response.data;
  },

  getFeaturedBlogs: async () => {
    const response = await client.get("/api/blogs/featured");
    return response.data;
  },

  getLatestBlogs: async () => {
    const response = await client.get("/api/blogs/latest");
    return response.data;
  },

  getPopularBlogs: async () => {
    const response = await client.get("/api/blogs/popular");
    return response.data;
  },

  getBlogBySlug: async (slug) => {
    const response = await client.get(`/api/blogs/${slug}`);
    return response.data;
  },

  getCategories: async () => {
    const response = await client.get("/api/blogs/categories");
    return response.data;
  },

  getTags: async () => {
    const response = await client.get("/api/blogs/tags");
    return response.data;
  },

  getRelatedBlogs: async (id) => {
    const response = await client.get(`/api/blogs/related/${id}`);
    return response.data;
  },
};
