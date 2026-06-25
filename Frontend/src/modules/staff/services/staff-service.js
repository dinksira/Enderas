import { ENV } from '../../../config/env.js';
import { api } from '../../../services/api.js';

const STAFF_BASE = `${ENV.apiV1Prefix}/staff`;

function buildQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

export const staffService = Object.freeze({
  listStaff: (params = {}) => api.get(`${STAFF_BASE}${buildQuery(params)}`),
  getStaffById: (id) => api.get(`${STAFF_BASE}/${id}`).then((response) => response?.staff ?? response),
  createStaff: (payload) => api.post(STAFF_BASE, payload),
  updateStaff: (id, payload) => api.put(`${STAFF_BASE}/${id}`, payload),
  deactivateStaff: (id) => api.post(`${STAFF_BASE}/${id}/deactivate`, {}),
  deleteStaff: (id) => api.delete(`${STAFF_BASE}/${id}`),
  getAssignableRoles: () =>
    api.get(`${STAFF_BASE}/assignable-roles`).then((response) => {
      const roles = response?.roles ?? [];
      return {
        roles: Array.isArray(roles) ? roles : [],
        permissionCatalog: response?.permissionCatalog ?? null,
      };
    }),
  updateRolePermissions: (id, payload) =>
    api.put(`${ENV.apiV1Prefix}/roles/${id}`, payload).then((response) => response?.role ?? response),
});

export default staffService;
