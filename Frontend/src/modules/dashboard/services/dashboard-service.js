import { ENV } from '../../../config/env.js';
import { api } from '../../../services/api.js';

const DASHBOARD_BASE = `${ENV.apiV1Prefix}/dashboard`;

function buildQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

export const dashboardService = Object.freeze({
  getMetrics: () => api.get(DASHBOARD_BASE),
  listReports: (params = {}) => api.get(`${DASHBOARD_BASE}/reports${buildQuery(params)}`),
  exportReport: (params = {}) => api.get(`${DASHBOARD_BASE}/reports/export${buildQuery(params)}`),
});

export default dashboardService;
