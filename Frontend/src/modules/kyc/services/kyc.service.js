import { api } from '../../../services/api.js';
import { ENV } from '../../../config/env.js';

const KYC_BASE = `${ENV.apiV1Prefix}/kyc`;

const KYC_ENDPOINTS = Object.freeze({
  SUBMIT: KYC_BASE,
  GET_MY: `${KYC_BASE}/my`,
  RESUBMIT: `${KYC_BASE}/resubmit`,
  LIST: KYC_BASE,
  GET_BY_ID: (id) => `${KYC_BASE}/${id}`,
  AUDIT: (id) => `${KYC_BASE}/${id}/audit`,
  MARK_UNDER_REVIEW: (id) => `${KYC_BASE}/${id}/mark-under-review`,
  APPROVE: (id) => `${KYC_BASE}/${id}/approve`,
  REJECT: (id) => `${KYC_BASE}/${id}/reject`,
});

/**
 * @param {object} data
 */
export async function submitKYC(data) {
  return api.post(KYC_ENDPOINTS.SUBMIT, data);
}

export async function getMyKYC() {
  return api.get(KYC_ENDPOINTS.GET_MY);
}

/**
 * @param {object} data
 */
export async function resubmitKYC(data) {
  return api.post(KYC_ENDPOINTS.RESUBMIT, data);
}

/**
 * @param {{
 *   page?: number,
 *   limit?: number,
 *   status?: string,
 *   tab?: string,
 *   userType?: string,
 *   search?: string,
 *   dateFrom?: string,
 *   dateTo?: string,
 *   includeStats?: boolean,
 * }} params
 */
export async function listKYCs(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.status) query.set('status', params.status);
  if (params.tab) query.set('tab', params.tab);
  if (params.userType) query.set('userType', params.userType);
  if (params.search) query.set('search', params.search);
  if (params.dateFrom) query.set('dateFrom', params.dateFrom);
  if (params.dateTo) query.set('dateTo', params.dateTo);
  if (params.includeStats) query.set('includeStats', 'true');

  const qs = query.toString();
  const endpoint = qs ? `${KYC_ENDPOINTS.LIST}?${qs}` : KYC_ENDPOINTS.LIST;
  return api.get(endpoint);
}

/**
 * @param {string} id
 */
export async function getKYCById(id) {
  return api.get(KYC_ENDPOINTS.GET_BY_ID(id));
}

/**
 * @param {string} id
 */
export async function getKYCAuditTrail(id) {
  return api.get(KYC_ENDPOINTS.AUDIT(id));
}

/**
 * @param {string} id
 * @param {string|null} reviewNotes
 */
export async function markKYCUnderReview(id, reviewNotes) {
  return api.post(KYC_ENDPOINTS.MARK_UNDER_REVIEW(id), { reviewNotes });
}

/**
 * @param {string} id
 * @param {string|null} reviewNotes
 */
export async function approveKYC(id, reviewNotes) {
  return api.post(KYC_ENDPOINTS.APPROVE(id), { reviewNotes });
}

/**
 * @param {string} id
 * @param {string} rejectionReason
 * @param {string|null} reviewNotes
 */
export async function rejectKYC(id, rejectionReason, reviewNotes) {
  return api.post(KYC_ENDPOINTS.REJECT(id), { rejectionReason, reviewNotes });
}

export const kycService = Object.freeze({
  submitKYC,
  getMyKYC,
  resubmitKYC,
  listKYCs,
  getKYCById,
  getKYCAuditTrail,
  markKYCUnderReview,
  approveKYC,
  rejectKYC,
});

export default kycService;
