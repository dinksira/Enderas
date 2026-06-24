export const ENV = Object.freeze({
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api',
  apiV1Prefix: import.meta.env.VITE_API_V1_PREFIX ?? '/v1',
  appEnv: import.meta.env.MODE,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
});

export default ENV;
