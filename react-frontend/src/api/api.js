import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});
// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ai_judge_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth service
export const auth = {
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('ai_judge_token', response.data.token);
    }
    return response.data;
  },

  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('ai_judge_token', response.data.token);
    }
    return response.data;
  },

  logout() {
    localStorage.removeItem('ai_judge_token');
  },

  getToken() {
    return localStorage.getItem('ai_judge_token');
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data;
  }
};

// Debates service
export const debates = {
  async submitDebate(debateData) {
    const response = await api.post('/debates/judge', debateData);
    return response.data;
  },

  async getHistory() {
    const response = await api.get('/debates/history');
    return response.data;
  },

  async getDebate(id) {
    const response = await api.get(`/debates/${id}`);
    return response.data;
  },

  async deleteDebate(id) {
    const response = await api.delete(`/debates/${id}`);
    return response.data;
  },

};

export default api;
