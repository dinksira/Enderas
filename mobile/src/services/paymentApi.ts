import { ENV } from '@/lib/env';
import { api } from '@/services/api';

const PAYMENTS_BASE = `${ENV.apiV1Prefix}/payments`;

export interface CreatePaymentPayload {
  auctionId: string;
  amount: number;
  paymentMethod: 'manual' | 'addis_pay';
  receiptUrl?: string;
  transactionReference?: string;
}

export interface PaymentRecord {
  id: string;
  status: string;
  amount: number;
  auctionId?: string;
  receiptUrl?: string;
}

async function unwrapPayment(response: { payment?: PaymentRecord } | PaymentRecord): Promise<PaymentRecord> {
  return (response as { payment?: PaymentRecord }).payment ?? (response as PaymentRecord);
}

export async function createPayment(payload: CreatePaymentPayload): Promise<PaymentRecord> {
  return unwrapPayment(await api.post(PAYMENTS_BASE, payload));
}

export const paymentApi = Object.freeze({
  createPayment,
});

export default paymentApi;
