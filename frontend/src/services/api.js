import axios from 'axios';

// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const API_URL = 'https://mockforge-wvx2.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach the JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401s and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          // Attempt to refresh token
          const response = await axios.post(`${API_URL}/accounts/login/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;

          // Save new token
          localStorage.setItem('access_token', access);

          // Update original request header and retry
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed (e.g. refresh token expired or invalid)
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          // Redirect to login (optional, handled by components or router usually)
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
