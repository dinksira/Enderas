import { ENV } from './env.js';
import { useAuthStore } from '../auth/auth-store.js';

/**
 * @param {string} endpoint
 * @param {RequestInit} [options]
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${ENV.apiBaseUrl}${endpoint}`;
  const token = useAuthStore.getState().accessToken;

  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch {
    const error = new Error('Unable to reach the server. Ensure the backend is running on port 3000.');
    error.code = 'NETWORK_ERROR';
    throw error;
  }

  if (response.status === 401 && !endpoint.startsWith('/auth/')) {
    useAuthStore.getState().clearSession();
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const error = new Error(
      errorBody.message || `Request failed with status ${response.status}`,
    );
    error.code = errorBody.code;
    error.status = response.status;
    throw error;
  }

  const payload = await response.json();
  return payload.data ?? payload;
}

export const api = Object.freeze({
  get: (endpoint) => apiRequest(endpoint),
  post: (endpoint, body) =>
    apiRequest(endpoint, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }),
  put: (endpoint, body) =>
    apiRequest(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (endpoint, body) =>
    apiRequest(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' }),
});

export default api;
