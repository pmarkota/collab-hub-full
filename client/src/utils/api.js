const API_BASE_URL = "http://localhost:3000/api";

const api = {
  async post(endpoint, data, config = {}) {
    try {
      console.log("Making POST request to:", `${API_BASE_URL}${endpoint}`);
      console.log("Request data:", data);
      console.log("Request config:", config);
      console.log("Is FormData?", data instanceof FormData);

      const isFormData = data instanceof FormData;

      const headers = {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(localStorage.getItem("token") && {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        }),
        ...(isFormData ? {} : config.headers),
      };

      console.log("Final headers:", headers);

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers,
        body: isFormData ? data : JSON.stringify(data),
      });

      console.log("Response status:", response.status);
      const responseData = await response.json();
      console.log("Response data:", responseData);

      if (!response.ok) {
        throw new Error(responseData.error || "Something went wrong");
      }

      return responseData;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  },

  async get(endpoint) {
    try {
      console.log("Making GET request to:", `${API_BASE_URL}${endpoint}`);
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(localStorage.getItem("token") && {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          }),
        },
      });

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  },

  async delete(endpoint) {
    try {
      console.log("Making DELETE request to:", `${API_BASE_URL}${endpoint}`);
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(localStorage.getItem("token") && {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          }),
        },
      });

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  },
};

export default api;
