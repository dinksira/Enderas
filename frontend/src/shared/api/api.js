import { ENV } from './env.js';
import { useAuthStore } from '../auth/auth-store.js';

let refreshPromise = null;

async function attemptTokenRefresh() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const { refreshToken } = useAuthStore.getState();
    if (!refreshToken) return false;

    try {
      const resp = await fetch(`${ENV.apiBaseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!resp.ok) return false;

      const payload = await resp.json();
      const data = payload.data ?? payload;

      useAuthStore.getState().setSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        refreshTokenExpiresAt: data.refreshTokenExpiresAt,
        identity: data.identity,
        authz: data.authz,
        user: data.user,
      });

      return true;
    } catch {
      return false;
    }
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

function buildAuthHeaders(token, options) {
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...options.headers,
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

/**
 * @param {string} endpoint
 * @param {RequestInit} [options]
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${ENV.apiBaseUrl}${endpoint}`;
  let token = useAuthStore.getState().accessToken;
  let headers = buildAuthHeaders(token, options);
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
    const refreshed = await attemptTokenRefresh();
    if (refreshed) {
      token = useAuthStore.getState().accessToken;
      headers = buildAuthHeaders(token, options);
      try {
        response = await fetch(url, { ...options, headers });
      } catch {
        const error = new Error('Unable to reach the server. Ensure the backend is running on port 3000.');
        error.code = 'NETWORK_ERROR';
        throw error;
      }
    } else {
      useAuthStore.getState().clearSession();
    }
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
