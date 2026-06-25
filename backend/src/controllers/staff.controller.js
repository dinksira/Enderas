import { sendSuccess } from '../utils/response.util.js';
import { staffService } from '../services/staff.service.js';

function resolveStaffId(req) {
  return req.user?.staffId ?? req.auth?.staffId ?? null;
}

export async function listStaff(req, res, next) {
  try {
    const { page, limit, search, department, isActive, includeStats } = req.query;
    const result = await staffService.listStaff({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      search: search || null,
      department: department || null,
      isActive: isActive ?? null,
      includeStats: includeStats === 'true' || includeStats === '1',
    });

    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function getStaffStats(req, res, next) {
  try {
    const stats = await staffService.getStaffStats();
    return sendSuccess(res, { stats });
  } catch (error) {
    return next(error);
  }
}

export async function getStaffById(req, res, next) {
  try {
    const staff = await staffService.getStaffById(req.params.id);
    return sendSuccess(res, { staff });
  } catch (error) {
    return next(error);
  }
}

export async function createStaff(req, res, next) {
  try {
    const staff = await staffService.createStaff(
      {
        mobileNumber: req.body.mobileNumber || req.body.mobile_number,
        password: req.body.password,
        roleId: req.body.roleId || req.body.role_id,
        firstName: req.body.firstName || req.body.first_name,
        lastName: req.body.lastName || req.body.last_name,
        email: req.body.email,
        employeeId: req.body.employeeId || req.body.employee_id,
        department: req.body.department,
        preferredLanguage: req.body.preferredLanguage || req.body.preferred_language,
      },
      resolveStaffId(req),
    );

    return sendSuccess(res, { staff }, 201);
  } catch (error) {
    return next(error);
  }
}

export async function updateStaff(req, res, next) {
  try {
    const staff = await staffService.updateStaff(
      req.params.id,
      {
        firstName: req.body.firstName ?? req.body.first_name,
        lastName: req.body.lastName ?? req.body.last_name,
        email: req.body.email,
        preferredLanguage: req.body.preferredLanguage ?? req.body.preferred_language,
        employeeId: req.body.employeeId ?? req.body.employee_id,
        department: req.body.department,
        roleId: req.body.roleId || req.body.role_id,
        isActive: req.body.isActive ?? req.body.is_active,
      },
      resolveStaffId(req),
    );

    return sendSuccess(res, { staff });
  } catch (error) {
    return next(error);
  }
}

export async function deactivateStaff(req, res, next) {
  try {
    const staff = await staffService.deactivateStaff(req.params.id, resolveStaffId(req));
    return sendSuccess(res, { staff });
  } catch (error) {
    return next(error);
  }
}

export async function deleteStaff(req, res, next) {
  try {
    const result = await staffService.deleteStaff(req.params.id, resolveStaffId(req));
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function listAssignableRoles(req, res, next) {
  try {
    const result = await staffService.listAssignableRoles();
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export const staffController = Object.freeze({
  listStaff,
  getStaffStats,
  getStaffById,
  createStaff,
  updateStaff,
  deactivateStaff,
  deleteStaff,
  listAssignableRoles,
});

export default staffController;
