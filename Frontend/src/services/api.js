import { ENV } from '../config/env.js';

/**
 * @param {string} endpoint
 * @param {RequestInit} [options]
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${ENV.apiBaseUrl}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const api = Object.freeze({
  get: (endpoint) => apiRequest(endpoint),
  post: (endpoint, body) =>
    apiRequest(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) =>
    apiRequest(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' }),
});

export default api;
