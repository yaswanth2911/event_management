import axios from 'axios';

// Dynamically use the production Vercel variable, falling back to local for dev workflows
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Access Tokens dynamically
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

// Response Interceptor: Seamless background silent token refresh handling
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          // Dynamic production URL routing for silent refresh loop
          const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'}/token/refresh/`, {
            refresh: refreshToken,
          });

          const newAccessToken = res.data.access;
          localStorage.setItem('access_token', newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          
          return API(originalRequest);
        } catch (refreshError) {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default API;