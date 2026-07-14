import { publicApiRequest, ENV } from '@enderass/shared/api';

const TRACK_STORAGE_KEY_PREFIX = 'track_token_';
<<<<<<< HEAD
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2000;
=======
>>>>>>> magersoftware/main

function getStorageKey(token) {
  return `${TRACK_STORAGE_KEY_PREFIX}${token}`;
}

function getStoredToken(token) {
  try {
    return sessionStorage.getItem(getStorageKey(token));
  } catch {
    return null;
  }
}

function setStoredToken(token, jwt) {
  try {
    sessionStorage.setItem(getStorageKey(token), jwt);
  } catch {
    // ignore
  }
}

function clearStoredToken(token) {
  try {
    sessionStorage.removeItem(getStorageKey(token));
  } catch {
    // ignore
  }
}

<<<<<<< HEAD
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options, retries = MAX_RETRIES) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      return res;
    } catch (err) {
      lastErr = err;
      if (attempt < retries) await sleep(RETRY_DELAY_MS * (attempt + 1));
    }
  }
  throw lastErr;
}

=======
>>>>>>> magersoftware/main
export const trackingService = {
  async authenticate(token, password) {
    const data = await publicApiRequest(`/track/${token}/authenticate`, {
      method: 'POST',
      body: JSON.stringify(password ? { password } : {}),
    });
    setStoredToken(token, data.accessToken);
    return data;
  },

  async getTrackingData(token) {
    const jwt = getStoredToken(token);
    if (!jwt) throw new Error('Not authenticated');

<<<<<<< HEAD
    const response = await fetchWithRetry(
=======
    const response = await fetch(
>>>>>>> magersoftware/main
      `${ENV.apiBaseUrl}/track/${token}/data`,
      {
        headers: {
          Authorization: `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      if (response.status === 401) {
        clearStoredToken(token);
        throw new Error('Session expired');
      }
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Request failed with status ${response.status}`);
    }

    const payload = await response.json();
    return payload.data ?? payload;
  },

  isAuthenticated(token) {
    return !!getStoredToken(token);
  },

  logout(token) {
    clearStoredToken(token);
  },
};

export default trackingService;
