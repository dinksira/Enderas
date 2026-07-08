import { ENV, api } from '../api/index.js';

const AUDIT_BASE = `${ENV.apiV1Prefix}/audit-logs`;

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

export const auditService = Object.freeze({
  listAuditLogs: (params = {}) => api.get(`${AUDIT_BASE}${buildQuery(params)}`),
  getAuditLogById: (id) =>
    api.get(`${AUDIT_BASE}/${id}`).then((response) => response?.auditLog ?? response),
});

export default auditService;
