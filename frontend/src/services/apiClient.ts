import axios from "axios";

const apiClient = axios.create({
  baseURL: "/api",
  timeout: 60000,
});

apiClient.interceptors.response.use(
  (resp) => resp,
  (error) => {
    const message = error?.response?.data?.message ?? error.message;
    console.error("API error", message);
    return Promise.reject(error);
  },
);

export default apiClient;
