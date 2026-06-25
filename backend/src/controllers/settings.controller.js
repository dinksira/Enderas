import { sendSuccess } from '../utils/response.util.js';
import { settingsService } from '../services/settings.service.js';

function resolveStaffId(req) {
  return req.user?.staffId ?? req.auth?.staffId ?? null;
}

export async function getSettings(req, res, next) {
  try {
    const result = await settingsService.getAllSettings();
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function updateSettings(req, res, next) {
  try {
    const patch = req.body.settings ?? req.body;
    const result = await settingsService.updateSettings(patch, resolveStaffId(req));
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export const settingsController = Object.freeze({
  getSettings,
  updateSettings,
});

export default settingsController;
