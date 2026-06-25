import { sendSuccess } from '../utils/response.util.js';
import { userService } from '../services/user.service.js';

function resolveStaffId(req) {
  return req.user?.staffId ?? req.auth?.staffId ?? null;
}

function resolveUserId(req) {
  return req.user?.id ?? req.auth?.userId ?? null;
}

export async function listUsers(req, res, next) {
  try {
    const { page, limit, tab, status, userType, search, dateFrom, dateTo, includeStats } = req.query;
    const result = await userService.listUsers(
      {
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
        tab: tab || null,
        status: status || null,
        userType: userType || null,
        search: search || null,
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
        includeStats: includeStats === 'true' || includeStats === '1',
      },
      req,
    );

    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function getUserById(req, res, next) {
  try {
    const user = await userService.getUserById(req.params.id, {
      includeKyc: req.query.includeKyc !== 'false',
      includeAssetOwner: req.query.includeAssetOwner !== 'false',
    });

    return sendSuccess(res, { user });
  } catch (error) {
    return next(error);
  }
}

export async function createUser(req, res, next) {
  try {
    const user = await userService.createUser(
      {
        mobileNumber: req.body.mobileNumber || req.body.mobile_number,
        password: req.body.password,
        roleId: req.body.roleId || req.body.role_id,
        userType: req.body.userType || req.body.user_type,
        firstName: req.body.firstName || req.body.first_name,
        lastName: req.body.lastName || req.body.last_name,
        email: req.body.email,
        organizationName: req.body.organizationName || req.body.organization_name,
        preferredLanguage: req.body.preferredLanguage || req.body.preferred_language,
        status: req.body.status,
      },
      resolveStaffId(req),
    );

    return sendSuccess(res, { user }, 201);
  } catch (error) {
    return next(error);
  }
}

export async function updateUser(req, res, next) {
  try {
    const user = await userService.updateUser(
      req.params.id,
      {
        email: req.body.email,
        firstName: req.body.firstName || req.body.first_name,
        lastName: req.body.lastName || req.body.last_name,
        organizationName: req.body.organizationName || req.body.organization_name,
        preferredLanguage: req.body.preferredLanguage || req.body.preferred_language,
        roleId: req.body.roleId || req.body.role_id,
      },
      resolveStaffId(req),
    );

    return sendSuccess(res, { user });
  } catch (error) {
    return next(error);
  }
}

export async function updateUserStatus(req, res, next) {
  try {
    const user = await userService.updateUserStatus(
      req.params.id,
      {
        status: req.body.status,
        reason: req.body.reason || null,
      },
      resolveStaffId(req),
      resolveUserId(req),
    );

    return sendSuccess(res, { user });
  } catch (error) {
    return next(error);
  }
}

export async function deleteUser(req, res, next) {
  try {
    const result = await userService.deleteUser(
      req.params.id,
      resolveStaffId(req),
      resolveUserId(req),
    );

    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export const userController = Object.freeze({
  listUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
});

export default userController;
