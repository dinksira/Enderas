import { sendSuccess } from '../utils/response.util.js';
import { organizationService } from '../services/organization.service.js';

function resolveStaffId(req) {
  return req.user?.staffId ?? req.auth?.staffId ?? null;
}

export async function listOrganizations(req, res, next) {
  try {
    const { page, limit, search, status, includeStats } = req.query;
    const result = await organizationService.listOrganizations({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      search: search || null,
      status: status || null,
      includeStats: includeStats === 'true' || includeStats === '1',
    });

    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function getOrgStats(req, res, next) {
  try {
    const stats = await organizationService.getOrgStats();
    return sendSuccess(res, { stats });
  } catch (error) {
    return next(error);
  }
}

export async function getOrganizationById(req, res, next) {
  try {
    const organization = await organizationService.getOrganizationById(req.params.id);
    return sendSuccess(res, { organization });
  } catch (error) {
    return next(error);
  }
}

export async function createOrganization(req, res, next) {
  try {
    const organization = await organizationService.createOrganization(
      {
        organizationName: req.body.organizationName || req.body.organization_name,
        tinNumber: req.body.tinNumber || req.body.tin_number,
        mobileNumber: req.body.mobileNumber || req.body.mobile_number,
        email: req.body.email,
        firstName: req.body.firstName || req.body.first_name,
        lastName: req.body.lastName || req.body.last_name,
        password: req.body.password,
        preferredLanguage: req.body.preferredLanguage || req.body.preferred_language,
        roleId: req.body.roleId || req.body.role_id,
      },
      resolveStaffId(req),
    );

    return sendSuccess(res, { organization }, 201);
  } catch (error) {
    return next(error);
  }
}

export async function updateOrganization(req, res, next) {
  try {
    const organization = await organizationService.updateOrganization(
      req.params.id,
      {
        organizationName: req.body.organizationName ?? req.body.organization_name,
        tinNumber: req.body.tinNumber ?? req.body.tin_number,
        email: req.body.email,
        firstName: req.body.firstName ?? req.body.first_name,
        lastName: req.body.lastName ?? req.body.last_name,
        preferredLanguage: req.body.preferredLanguage ?? req.body.preferred_language,
        password: req.body.password,
        status: req.body.status,
      },
      resolveStaffId(req),
    );

    return sendSuccess(res, { organization });
  } catch (error) {
    return next(error);
  }
}

export async function deleteOrganization(req, res, next) {
  try {
    const result = await organizationService.deleteOrganization(req.params.id, resolveStaffId(req));
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function getPortal(req, res, next) {
  try {
    const userId = req.auth?.identity?.userId || req.user?.id;
    const portal = await organizationService.getOrganizationPortal(userId);
    return sendSuccess(res, portal);
  } catch (error) {
    return next(error);
  }
}

export async function getPortalAssets(req, res, next) {
  try {
    const userId = req.auth?.identity?.userId || req.user?.id;
    const result = await organizationService.getOrganizationPortalAssets(userId);
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function getOrganizationActiveAuctions(req, res, next) {
  try {
    const result = await organizationService.getOrganizationActiveAuctions(req.params.id);
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export const organizationController = Object.freeze({
  listOrganizations,
  getOrgStats,
  getOrganizationById,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  getPortal,
  getPortalAssets,
  getOrganizationActiveAuctions,
});

export default organizationController;
