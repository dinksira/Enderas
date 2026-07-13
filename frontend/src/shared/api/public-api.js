import { ENV } from './env.js';

/**
 * Unauthenticated API requests for public pages (no session side-effects on 401).
 * @param {string} endpoint
 * @param {RequestInit} [options]
 */
export async function publicApiRequest(endpoint, options = {}) {
  const url = `${ENV.apiBaseUrl}${endpoint}`;

  let response;

  try {
    response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  } catch (err) {
    const error = new Error(
      ENV.isProd
        ? 'Unable to reach the server. It may be starting up — please try again in a few seconds.'
        : 'Unable to reach the server. Is the backend running on port 3000?',
    );
    error.code = 'NETWORK_ERROR';
    throw error;
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

export const publicApi = Object.freeze({
  get: (endpoint) => publicApiRequest(endpoint),
});

export default publicApi;
