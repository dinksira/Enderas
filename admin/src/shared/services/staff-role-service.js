import { ENV, api } from '../api/index.js';

const ROLES_BASE = `${ENV.apiV1Prefix}/roles`;

export const staffRoleService = Object.freeze({
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(query ? `${ROLES_BASE}?${query}` : ROLES_BASE);
  },
  getById: (id) => api.get(`${ROLES_BASE}/${id}`),
  create: (payload) => api.post(ROLES_BASE, payload),
  update: (id, payload) => api.put(`${ROLES_BASE}/${id}`, payload),
  remove: (id) => api.delete(`${ROLES_BASE}/${id}`),
});

export default staffRoleService;
