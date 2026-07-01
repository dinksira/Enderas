import { ENV } from '@/lib/env';
import { api } from '@/services/api';
import type { ProposedBidPayload } from '@/types/auctionApi';

const CPO_BASE = `${ENV.apiV1Prefix}/cpo`;

export interface CreateCpoPayload {
  auctionId: string;
  documentUrl: string;
  proposedBids: ProposedBidPayload[];
  declaredCpoAmount?: number;
}

export interface CpoRecord {
  id: string;
  status: string;
  requiredCpoAmount?: number | null;
  rejectionReason?: string | null;
}

async function unwrapCpo(response: { cpo?: CpoRecord } | CpoRecord): Promise<CpoRecord> {
  return (response as { cpo?: CpoRecord }).cpo ?? (response as CpoRecord);
}

export async function createCpo(payload: CreateCpoPayload): Promise<CpoRecord> {
  return unwrapCpo(await api.post(CPO_BASE, payload));
}

export const cpoApi = Object.freeze({
  createCpo,
});

export default cpoApi;
