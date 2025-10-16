import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://apms.datacodesolution.com' 
    : 'http://127.0.0.1:3011',
  withCredentials: false,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('apms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('apms_token');
      localStorage.removeItem('apms_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
