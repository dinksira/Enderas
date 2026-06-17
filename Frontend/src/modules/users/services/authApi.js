import { api } from '../../../services/api.js';

const AUTH_ENDPOINTS = Object.freeze({
  LOGIN: '/auth/login',
});

/**
 * @param {{ email: string, password: string }} credentials
 */
export async function login(credentials) {
  return api.post(AUTH_ENDPOINTS.LOGIN, credentials);
}

export const authApi = Object.freeze({
  login,
});

export default authApi;
