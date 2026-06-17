import { api } from '../../../services/api.js';

export const userService = Object.freeze({
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (payload) => api.post('/users', payload),
  update: (id, payload) => api.put(`/users/${id}`, payload),
  remove: (id) => api.delete(`/users/${id}`),
});

export default userService;
