import axios from 'axios';
import { getToken, clearToken } from '@/utils/tokenStorage';
import { normalizeError } from '@/utils/errorHandler';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach auth token to every request
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(normalizeError(error))
);

// Normalize responses and handle global errors (e.g. 401)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await clearToken();
    }
    return Promise.reject(normalizeError(error));
  }
);

export default apiClient;
