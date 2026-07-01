import { api } from '@/services/api';

const KYC_BASE = '/v1/kyc';

export interface KycRecord {
  id: string;
  user_id: string;
  document_type?: string;
  document_number?: string;
  document_front_url?: string;
  document_back_url?: string;
  trade_license_url?: string;
  tin_certificate_url?: string;
  business_registration_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string | null;
  review_notes?: string | null;
  under_review_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface KycSubmitPayload {
  userType: string;
  documentType?: string;
  documentNumber?: string;
  tinNumber?: string;
  documentFrontUrl?: string;
  documentBackUrl?: string;
  tradeLicenseUrl?: string;
  tinCertificateUrl?: string;
  businessRegistrationUrl?: string;
}

export async function getMyKYC(): Promise<{ kyc: KycRecord | null }> {
  return api.get<{ kyc: KycRecord | null }>(`${KYC_BASE}/my`);
}

export async function submitKYC(data: KycSubmitPayload): Promise<{ kyc: KycRecord }> {
  return api.post<{ kyc: KycRecord }>(KYC_BASE, data);
}

export async function resubmitKYC(data: KycSubmitPayload): Promise<{ kyc: KycRecord }> {
  return api.post<{ kyc: KycRecord }>(`${KYC_BASE}/resubmit`, data);
}

export const kycApi = Object.freeze({
  getMyKYC,
  submitKYC,
  resubmitKYC,
});

export default kycApi;
