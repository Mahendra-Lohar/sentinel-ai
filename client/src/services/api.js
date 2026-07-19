import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({ baseURL: API_URL, withCredentials: true });

// Attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sentinel_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sentinel_token');
      localStorage.removeItem('sentinel_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────
export const login = (data) => api.post('/auth/login', data).then(r => r.data);
export const register = (data) => api.post('/auth/register', data).then(r => r.data);

// ─── Stats & Settings ─────────────────────────────────────────
export const getStats = () => api.get('/stats').then(r => r.data);
export const getSettings = () => api.get('/settings').then(r => r.data);
export const updateSettings = (data) => api.post('/settings', data).then(r => r.data);

// ─── Demo Packs (metadata only) ───────────────────────────
export const listDemoPacks = () => api.get('/demo-packs').then(r => r.data);

// ─── Investigations ───────────────────────────────────────
export const listInvestigations = (params = {}) =>
  api.get('/investigations', { params }).then(r => r.data.investigations);

export const createInvestigation = (data) =>
  api.post('/investigations', data).then(r => r.data.investigation);

export const getInvestigation = (id) =>
  api.get(`/investigations/${id}`).then(r => r.data);

export const deleteInvestigation = (id) =>
  api.delete(`/investigations/${id}`);

export const launchInvestigation = (id) =>
  api.post(`/investigations/${id}/launch`).then(r => r.data);

export const getResults = (id) =>
  api.get(`/investigations/${id}/results`).then(r => r.data.results);

// Loads real demo files from demo-data/ on the server, parsed + classified
export const loadDemoEvidence = (id, packId = 'incident-01-redis-timeout') =>
  api.post(`/investigations/${id}/load-demo/${packId}`).then(r => r.data);

// ─── Evidence ─────────────────────────────────────────────
export const uploadEvidence = (id, formData) =>
  api.post(`/investigations/${id}/evidence`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data);

export const listEvidence = (id) =>
  api.get(`/investigations/${id}/evidence`).then(r => r.data);

// ─── Chat ─────────────────────────────────────────────────
export const getChatHistory = (id) =>
  api.get(`/investigations/${id}/chat`).then(r => r.data.messages);

export const sendChatMessage = (id, message) =>
  api.post(`/investigations/${id}/chat`, { message }).then(r => r.data);

export const dispatchIntegration = (id, target) =>
  api.post(`/investigations/${id}/dispatch`, { target }).then(r => r.data);
