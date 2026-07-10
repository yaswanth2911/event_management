// src/services/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor 1: Automatically attach Access Token to outbound requests
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor 2: Handle Expired Tokens automatically
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If backend returns 401 and we haven't tried retrying yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          // Attempt to get a fresh access token using the refresh token
         const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/token/refresh/`, {
            refresh: refreshToken,
          });
          
          const newAccessToken = res.data.access;
          localStorage.setItem('access_token', newAccessToken);
          
          // Re-fire the original request that failed
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return API(originalRequest);
        } catch (refreshError) {
          // Both tokens are invalid or expired -> Clear store and boot to login
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default API;