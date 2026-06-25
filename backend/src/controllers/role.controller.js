import { sendSuccess } from '../utils/response.util.js';
import { roleAdminService } from '../services/role-admin.service.js';

function resolveStaffId(req) {
  return req.user?.staffId ?? req.auth?.staffId ?? null;
}

export async function updateRolePermissions(req, res, next) {
  try {
    const role = await roleAdminService.updateRolePermissions(
      req.params.id,
      {
        summary: req.body.summary,
        modules: req.body.modules,
        actions: req.body.actions,
        routes: req.body.routes,
      },
      resolveStaffId(req),
    );

    return sendSuccess(res, { role });
  } catch (error) {
    return next(error);
  }
}

export const roleController = Object.freeze({
  updateRolePermissions,
});

export default roleController;
