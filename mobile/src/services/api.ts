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

/**
 * Low-level JSON API helper. Mirrors Frontend `services/api.js`.
 */
export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${ENV.apiBaseUrl}${endpoint}`;
  const token = useAuthStore.getState().accessToken;
  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      'Unable to reach the server. Check your connection and API URL.',
      'NETWORK_ERROR',
    );
  }

  if (response.status === 401 && !endpoint.startsWith('/auth/')) {
    useAuthStore.getState().clearSession();
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
  return (payload as { data?: T }).data ?? (payload as T);
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
  delete: <T = unknown>(endpoint: string) => apiRequest<T>(endpoint, { method: 'DELETE' }),
});

export default api;
