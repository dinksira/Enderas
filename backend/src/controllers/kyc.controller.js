import { sendSuccess } from '../utils/response.util.js';
import { kycService } from '../services/kyc.service.js';

export async function submitKYC(req, res, next) {
  try {
    const userId = req.user.id;
    const userType = req.body.userType || req.user.identity?.userType || 'individual';
    const kycData = {
      document_type: req.body.documentType || req.body.document_type,
      document_number: req.body.documentNumber || req.body.document_number,
      document_front_url: req.body.documentFrontUrl || req.body.document_front_url,
      document_back_url: req.body.documentBackUrl || req.body.document_back_url,
      trade_license_url: req.body.tradeLicenseUrl || req.body.trade_license_url,
      tin_certificate_url: req.body.tinCertificateUrl || req.body.tin_certificate_url,
      business_registration_url: req.body.businessRegistrationUrl || req.body.business_registration_url,
      tin_number: req.body.tinNumber || req.body.tin_number,
    };

    const kyc = await kycService.submitKYC(userId, kycData, userType);

    return sendSuccess(res, { kyc });
  } catch (error) {
    return next(error);
  }
}

export async function getMyKYC(req, res, next) {
  try {
    const userId = req.user.id;
    const kyc = await kycService.getKYCByUserId(userId);

    return sendSuccess(res, { kyc });
  } catch (error) {
    return next(error);
  }
}

export async function resubmitKYC(req, res, next) {
  try {
    const userId = req.user.id;
    const userType = req.body.userType || req.user.identity?.userType || 'individual';
    const kycData = {
      document_number: req.body.documentNumber || req.body.document_number,
      document_front_url: req.body.documentFrontUrl || req.body.document_front_url,
      document_back_url: req.body.documentBackUrl || req.body.document_back_url,
      trade_license_url: req.body.tradeLicenseUrl || req.body.trade_license_url,
      tin_certificate_url: req.body.tinCertificateUrl || req.body.tin_certificate_url,
      business_registration_url: req.body.businessRegistrationUrl || req.body.business_registration_url,
      tin_number: req.body.tinNumber || req.body.tin_number,
    };

    const kyc = await kycService.resubmitKYC(userId, kycData, userType);

    return sendSuccess(res, { kyc });
  } catch (error) {
    return next(error);
  }
}

export async function getKYCById(req, res, next) {
  try {
    const { id } = req.params;
    const kyc = await kycService.getKYCById(id);

    return sendSuccess(res, { kyc });
  } catch (error) {
    return next(error);
  }
}

export async function listKYCs(req, res, next) {
  try {
    const { page, limit, status, tab, userType, search, dateFrom, dateTo, includeStats } = req.query;
    const result = await kycService.listKYCs({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      status: status || null,
      tab: tab || null,
      userType: userType || null,
      search: search || null,
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
      includeStats: includeStats === 'true',
    });

    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function getKYCAuditTrail(req, res, next) {
  try {
    const { id } = req.params;
    const auditTrail = await kycService.getKYCAuditTrail(id);

    return sendSuccess(res, { auditTrail });
  } catch (error) {
    return next(error);
  }
}

export async function markKYCUnderReview(req, res, next) {
  try {
    const { id } = req.params;
    const { reviewNotes } = req.body;
    const staffId = req.user.staffId;

    const kyc = await kycService.markKYCUnderReview(id, staffId, reviewNotes || null);

    return sendSuccess(res, { kyc });
  } catch (error) {
    return next(error);
  }
}

export async function approveKYC(req, res, next) {
  try {
    const { id } = req.params;
    const { reviewNotes } = req.body;
    const staffId = req.user.staffId;

    const kyc = await kycService.approveKYC(id, staffId, reviewNotes || null);

    return sendSuccess(res, { kyc });
  } catch (error) {
    return next(error);
  }
}

export async function rejectKYC(req, res, next) {
  try {
    const { id } = req.params;
    const { rejectionReason, reviewNotes } = req.body;
    const staffId = req.user.staffId;

    const kyc = await kycService.rejectKYC(id, staffId, rejectionReason, reviewNotes || null);

    return sendSuccess(res, { kyc });
  } catch (error) {
    return next(error);
  }
}

export const kycController = Object.freeze({
  submitKYC,
  getMyKYC,
  resubmitKYC,
  getKYCById,
  listKYCs,
  getKYCAuditTrail,
  markKYCUnderReview,
  approveKYC,
  rejectKYC,
});

export default kycController;
