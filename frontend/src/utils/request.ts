import axios from 'axios';
import { message } from 'antd';

// Create axios instance
const request = axios.create({
    baseURL: '/api', // Proxy to backend
    timeout: 10000,
});

// Request interceptor
request.interceptors.request.use(
    (config) => {
        // Get token from localStorage (or store)
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
request.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error) => {
        const { response } = error;
        if (response) {
            // Handle 401 Unauthorized
            if (response.status === 401) {
                // Only redirect if not already on login page to avoid loops
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
            }
            const errorMsg = response.data?.detail || 'Request failed';
            message.error(errorMsg);
        } else {
            message.error('Network Error');
        }
        return Promise.reject(error);
    }
);

export default request;
