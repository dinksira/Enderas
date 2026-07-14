import { ENV } from '@/lib/env';
import { useAuthStore } from '@/lib/authStore';

export class ApiError extends Error {
  code?: string;
  status?: number;

  constructor(message: string, code?: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

type RefreshResponse = {
  accessToken: string;
  refreshToken?: string | null;
  refreshTokenExpiresAt?: string | null;
  session?: Record<string, unknown>;
  identity?: Record<string, unknown>;
  authz?: Record<string, unknown>;
  user?: Record<string, unknown>;
  permissions?: Record<string, unknown>;
};

let refreshPromise: Promise<string | null> | null = null;

function unwrapPayload<T>(payload: { data?: T } | T): T {
  return (payload as { data?: T }).data ?? (payload as T);
}

function shouldAttemptRefresh(endpoint: string, response: Response): boolean {
  return response.status === 401 && !endpoint.startsWith('/auth/');
}

async function requestTokenRefresh(): Promise<string | null> {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(`${ENV.apiBaseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return null;
    }

    const payload = unwrapPayload((await response.json()) as { data?: RefreshResponse } | RefreshResponse);
    if (!payload.accessToken) {
      return null;
    }

    useAuthStore.getState().setSession(payload);
    return payload.accessToken;
  } catch {
    return null;
  }
}

export async function refreshStoredSession(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = requestTokenRefresh().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

async function sendRequest(endpoint: string, options: RequestInit, token: string | null): Promise<Response> {
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(`${ENV.apiBaseUrl}${endpoint}`, {
    ...options,
    headers,
  });
}

/**
 * Low-level JSON API helper. Mirrors Frontend `services/api.js`.
 */
export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = useAuthStore.getState().accessToken;
  let response: Response;

  try {
    response = await sendRequest(endpoint, options, token);
  } catch {
    throw new ApiError(
      'Unable to reach the server. Check your connection and API URL.',
      'NETWORK_ERROR',
    );
  }

  if (shouldAttemptRefresh(endpoint, response)) {
    const nextToken = await refreshStoredSession();
    if (nextToken) {
      try {
        response = await sendRequest(endpoint, options, nextToken);
      } catch {
        throw new ApiError(
          'Unable to reach the server. Check your connection and API URL.',
          'NETWORK_ERROR',
        );
      }
    } else {
      useAuthStore.getState().expireSession();
    }
  }

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as {
      message?: string;
      code?: string;
    };
    throw new ApiError(
      errorBody.message || `Request failed with status ${response.status}`,
      errorBody.code,
      response.status,
    );
  }

  const payload = (await response.json()) as { data?: T } | T;
  return unwrapPayload(payload);
}

export const api = Object.freeze({
  get: <T = unknown>(endpoint: string) => apiRequest<T>(endpoint),
  post: <T = unknown>(endpoint: string, body?: unknown) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  put: <T = unknown>(endpoint: string, body?: unknown) =>
    apiRequest<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T = unknown>(endpoint: string, body?: unknown) =>
    apiRequest<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T = unknown>(endpoint: string) => apiRequest<T>(endpoint, { method: 'DELETE' }),
});

export default api;
