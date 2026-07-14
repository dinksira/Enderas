import { ENV, api, apiRequest } from '@enderass/shared/api';
import { END_USER_ROLE_CODES } from '@enderass/shared/config';

const USERS_BASE = `${ENV.apiV1Prefix}/users`;

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

const AUTH_ME = `${ENV.apiV1Prefix}/auth/me`;
const AUTH_CHANGE_PASSWORD = `${ENV.apiV1Prefix}/auth/change-password`;
const AUTH_AVATAR = `${ENV.apiV1Prefix}/auth/avatar`;
const ROLES_BASE = `${ENV.apiV1Prefix}/roles`;

async function unwrapUser(responsePromise) {
  const response = await responsePromise;
  return response?.user ?? response;
}

export async function listCreateRoles() {
  try {
    const response = await api.get(ROLES_BASE);
    const items = response?.items ?? response?.roles ?? [];
    const filtered = items.filter((role) => END_USER_ROLE_CODES.includes(role.code));
    if (filtered.length > 0) {
      return filtered;
    }
  } catch {
    // roles list may be stubbed; resolve from existing users
  }

  const listResponse = await api.get(`${USERS_BASE}${buildQuery({ limit: 100, tab: 'active' })}`);
  const users = listResponse?.users ?? [];
  const roles = [];

  for (const code of END_USER_ROLE_CODES) {
    const match = users.find((user) => user.roleCode === code);
    if (!match?.id) continue;

    const detail = await unwrapUser(api.get(`${USERS_BASE}/${match.id}`));
    if (detail?.roleId) {
      roles.push({
        id: detail.roleId,
        code,
        name: detail.roleName ?? code,
      });
    }
  }

  return roles;
}

export const userService = Object.freeze({
  listUsers: (params = {}) => api.get(`${USERS_BASE}${buildQuery(params)}`),
  getUserById: (id) => {
    if (!id) {
      return Promise.reject(new Error('User id is required'));
    }
    return unwrapUser(api.get(`${USERS_BASE}/${id}`));
  },
  createUser: (payload) => api.post(USERS_BASE, payload),
  updateUser: (id, payload) => api.put(`${USERS_BASE}/${id}`, payload),
  updateUserStatus: (id, payload) => api.post(`${USERS_BASE}/${id}/status`, payload),
  deleteUser: (id) => api.delete(`${USERS_BASE}/${id}`),
  getMe: () => api.get(AUTH_ME),
  updateMe: (payload) => apiRequest(AUTH_CHANGE_PASSWORD.replace('/change-password', '/me'), { method: 'PATCH', body: JSON.stringify(payload) }),
  changePassword: (payload) => apiRequest(AUTH_CHANGE_PASSWORD, { method: 'POST', body: JSON.stringify(payload) }),
  updateAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiRequest(AUTH_AVATAR, { method: 'POST', body: formData });
  },
  listCreateRoles,
  getAll: (params = {}) => api.get(`${USERS_BASE}${buildQuery(params)}`),
  getById: (id) => {
    if (!id) {
      return Promise.reject(new Error('User id is required'));
    }
    return unwrapUser(api.get(`${USERS_BASE}/${id}`));
  },
  create: (payload) => api.post(USERS_BASE, payload),
  update: (id, payload) => api.put(`${USERS_BASE}/${id}`, payload),
  remove: (id) => api.delete(`${USERS_BASE}/${id}`),
});

export default userService;
