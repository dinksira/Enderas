import { ENV, api } from '@enderass/shared/api';

const PAYMENTS_BASE = `${ENV.apiV1Prefix}/payments`;

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

async function unwrapPayment(response) {
  return response?.payment ?? response;
}

export const paymentService = Object.freeze({
  listPayments: (params = {}) => api.get(`${PAYMENTS_BASE}${buildQuery(params)}`),
  getPaymentById: async (id) => unwrapPayment(await api.get(`${PAYMENTS_BASE}/${id}`)),
  createPayment: async (payload) => unwrapPayment(await api.post(PAYMENTS_BASE, payload)),
  approvePayment: async (id) => unwrapPayment(await api.post(`${PAYMENTS_BASE}/${id}/approve`, {})),
  rejectPayment: async (id, rejectionReason) =>
    unwrapPayment(await api.post(`${PAYMENTS_BASE}/${id}/reject`, { rejectionReason })),
  getAll: (params = {}) => api.get(`${PAYMENTS_BASE}${buildQuery(params)}`),
  getById: async (id) => unwrapPayment(await api.get(`${PAYMENTS_BASE}/${id}`)),
});

export default paymentService;
