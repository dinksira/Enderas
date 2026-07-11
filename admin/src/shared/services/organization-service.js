import { ENV, api } from '../api/index.js';

const ORG_BASE = `${ENV.apiV1Prefix}/organizations`;

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

export const organizationService = Object.freeze({
  listOrganizations: (params = {}) => api.get(`${ORG_BASE}${buildQuery(params)}`),
  getOrganizationById: (id) =>
    api.get(`${ORG_BASE}/${id}`).then((response) => response?.organization ?? response),
  createOrganization: (payload) => api.post(ORG_BASE, payload),
  updateOrganization: (id, payload) => api.put(`${ORG_BASE}/${id}`, payload),
  deleteOrganization: (id) => api.delete(`${ORG_BASE}/${id}`),
  getOrganizationActiveAuctions: (id) => api.get(`${ORG_BASE}/${id}/active-auctions`),
  listLinkedAuctions: (id) => api.get(`${ORG_BASE}/${id}/auction-links`),
  getAvailableAuctions: (id) => api.get(`${ORG_BASE}/${id}/available-auctions`),
  linkAuction: (orgId, auctionId) =>
    api.post(`${ORG_BASE}/${orgId}/auction-links`, { auctionId }),
  unlinkAuction: (orgId, auctionId) =>
    api.delete(`${ORG_BASE}/${orgId}/auction-links/${auctionId}`),
});

export default organizationService;
