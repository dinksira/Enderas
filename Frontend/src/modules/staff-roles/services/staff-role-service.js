import { api } from '../../../services/api.js';

export const staffRoleService = Object.freeze({
  getAll: () => api.get('/staff-roles'),
  getById: (id) => api.get(`/staff-roles/${id}`),
  create: (payload) => api.post('/staff-roles', payload),
  update: (id, payload) => api.put(`/staff-roles/${id}`, payload),
  remove: (id) => api.delete(`/staff-roles/${id}`),
});

export default staffRoleService;
