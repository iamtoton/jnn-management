import axios from 'axios';

// Use environment variable for API URL, fallback to relative path
const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Students API
export const studentAPI = {
  getAll: (params = {}) => api.get('/api/students', { params }),
  getById: (id) => api.get(`/api/students/${id}`),
  create: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    });
    return api.post('/api/students', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  update: (id, data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    });
    return api.put(`/api/students/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  delete: (id) => api.delete(`/api/students/${id}`),
};

// Fees API
export const feeAPI = {
  getAll: (params = {}) => api.get('/api/fees', { params }),
  create: (data) => api.post('/api/fees', data),
  delete: (id) => api.delete(`/api/fees/${id}`),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/api/dashboard'),
};

// Settings API
export const settingsAPI = {
  get: () => api.get('/api/settings'),
  update: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    });
    return api.put('/api/settings', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

// Backup API
export const backupAPI = {
  create: () => api.post('/api/backup'),
  getAll: () => api.get('/api/backup'),
  download: (filename) => api.get(`/api/backup/${filename}`, { responseType: 'blob' }),
  restore: (filename) => api.post(`/api/backup/restore/${filename}`),
  delete: (filename) => api.delete(`/api/backup/${filename}`),
};

export default api;
