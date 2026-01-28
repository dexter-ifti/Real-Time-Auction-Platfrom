import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const message = error.response?.data?.error || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

export const auctionAPI = {
  getAllItems: () => apiClient.get('/items'),
  getItem: (itemId) => apiClient.get(`/items/${itemId}`),
  getBidHistory: (itemId) => apiClient.get(`/items/${itemId}/history`),
  createItem: (itemData) => apiClient.post('/items', itemData),
  healthCheck: () => apiClient.get('/health'),
};

export default apiClient;