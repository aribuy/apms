import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NODE_ENV === 'production'
    ? window.location.origin
    : 'http://127.0.0.1:3011',
  withCredentials: false,
});

let refreshPromise: Promise<string> | null = null;

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
  async (error) => {
    const originalRequest = error.config as { _retry?: boolean; url?: string; headers?: Record<string, string> };
    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes('/api/v1/auth/refresh')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('apms_refresh_token');
      if (!refreshToken) {
        localStorage.removeItem('apms_token');
        localStorage.removeItem('apms_user');
        localStorage.removeItem('apms_refresh_token');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (!refreshPromise) {
        refreshPromise = apiClient
          .post('/api/v1/auth/refresh', { refreshToken })
          .then((response) => {
            const { accessToken, refreshToken: nextRefreshToken } = response.data.data || {};
            if (!accessToken) {
              throw new Error('Missing access token in refresh response');
            }
            localStorage.setItem('apms_token', accessToken);
            if (nextRefreshToken) {
              localStorage.setItem('apms_refresh_token', nextRefreshToken);
            }
            return accessToken;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      try {
        const newAccessToken = await refreshPromise;
        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${newAccessToken}`
        };
        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('apms_token');
        localStorage.removeItem('apms_user');
        localStorage.removeItem('apms_refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
