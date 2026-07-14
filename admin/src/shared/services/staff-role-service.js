import { ENV, api } from '../api/index.js';
import { staffService } from './staff-service.js';

const ROLES_BASE = `${ENV.apiV1Prefix}/roles`;

export const staffRoleService = Object.freeze({
  getAll: async () => {
    const response = await staffService.getAssignableRoles();
    return {
      items: response?.roles ?? [],
      permissionCatalog: response?.permissionCatalog ?? null,
    };
  },
  getById: async (id) => {
    const response = await staffService.getAssignableRoles();
    const role = (response?.roles ?? []).find((item) => item.id === id);
    if (!role) {
      throw new Error('Role not found');
    }
    return { role, permissionCatalog: response?.permissionCatalog ?? null };
  },
  update: (id, payload) =>
    api.put(`${ROLES_BASE}/${id}`, payload).then((response) => response?.role ?? response),
});

export default staffRoleService;
