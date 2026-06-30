import axios from 'axios';

const resolveBaseURL = () => {
  const configuredBaseURL = import.meta.env.VITE_BASE_URL;

  if (import.meta.env.DEV && configuredBaseURL && typeof window !== 'undefined') {
    try {
      const url = new URL(configuredBaseURL);
      const browserHost = window.location.hostname;
      const isLocalBrowser = browserHost === 'localhost' || browserHost === '127.0.0.1';

      if (isLocalBrowser && url.hostname !== browserHost) {
        url.hostname = browserHost;
        return url.toString().replace(/\/$/, '');
      }
    } catch {
      return configuredBaseURL;
    }
  }

  return configuredBaseURL;
};

const API_BASE_URL = resolveBaseURL();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Refresh-and-retry on 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

const clearSession = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('mustResetPassword');
  globalThis.dispatchEvent(new CustomEvent('auth:session-expired'));
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401, and not on auth endpoints to avoid loops
    const isAuthEndpoint =
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/logout');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        // Queue requests that arrive while a refresh is in flight
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refresh_token = localStorage.getItem('refresh_token');
        if (!refresh_token) throw new Error('No refresh token');

        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refresh_token },
          { timeout: 20000 },
        );

        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);

        api.defaults.headers.common.Authorization = `Bearer ${data.access_token}`;
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;

        processQueue(null, data.access_token);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearSession();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
