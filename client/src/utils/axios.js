import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",

  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for token

api.interceptors.request.use(
  (config) => {
    console.log("Making request to:", config.url, "with data:", config.data);

    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  (error) => {
    console.error("Request error:", error);

    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log("Received response:", response.data);

    return response;
  },

  (error) => {
    console.error("Response error:", error);

    return Promise.reject(error);
  }
);

export default api;
