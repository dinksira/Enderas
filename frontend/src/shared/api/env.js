export const ENV = Object.freeze({
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? '/api' : 'http://localhost:3000/api'),
  apiV1Prefix: import.meta.env.VITE_API_V1_PREFIX ?? '/v1',
  adminAppUrl: import.meta.env.VITE_ADMIN_APP_URL ?? 'http://localhost:5174',
  publicAppUrl: import.meta.env.VITE_PUBLIC_APP_URL ?? 'http://localhost:5173',
  appKind: import.meta.env.VITE_APP_KIND ?? 'public',
  appEnv: import.meta.env.MODE,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
});

export default ENV;
