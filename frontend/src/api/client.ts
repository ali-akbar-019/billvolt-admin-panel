import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // send httpOnly cookies (accessToken/refreshToken)
});

let isRefreshing = false;
let pendingRequests: Array<() => void> = [];

// If an access token expires mid-session, transparently refresh it once
// and retry the original request — the user never sees a failed request.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/')) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingRequests.push(() => resolve(apiClient(originalRequest)));
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await apiClient.post('/auth/refresh');
        pendingRequests.forEach((cb) => cb());
        pendingRequests = [];
        return apiClient(originalRequest);
      } catch (refreshError) {
        pendingRequests = [];
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
