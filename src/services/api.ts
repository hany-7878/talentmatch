import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const registerUser = async (data: { email: string; password: string; role: string }) => {
  const res = await api.post('/auth/register/', data);
  return res.data;
};

export const loginUser = async (data: { email: string; password: string }) => {
  const res = await api.post('/auth/login/', data);
  return res.data; // Should return access and refresh tokens
};

export const refreshToken = async (refresh: string) => {
  const res = await api.post('/auth/refresh/', { refresh });
  return res.data;
};

export const logoutUser = async () => {
  await api.post('/auth/logout/');
};

export default api;
