import { SystemSetting } from '../models/systemSetting.model.js';
import { AppError } from '../utils/error.util.js';
import { generateUuid } from '../utils/crypto.util.js';
import { auditService, AUDIT_ACTIONS } from './audit.service.js';

const DEFAULT_SETTINGS = Object.freeze({
  'localization.default_language': 'en',
  'localization.supported_languages': ['en', 'am'],
  'auction.default_currency': 'ETB',
  'auction.default_cpo_percentage': 1,
  'auction.min_bid_increment': 1000,
  'otp.ttl_seconds': 300,
  'storage.max_file_size': 5242880,
});

const EDITABLE_KEYS = Object.freeze(Object.keys(DEFAULT_SETTINGS));

export function assertEditableKey(key) {
  if (!EDITABLE_KEYS.includes(key)) {
    throw new AppError(`Setting key '${key}' is not editable`, 400, 'INVALID_SETTING_KEY');
  }
}

function serializeSettingRow(row) {
  return {
    key: row.setting_key,
    value: row.setting_value,
    description: row.description,
    updatedAt: row.updated_at,
    updatedByStaffId: row.updated_by_staff_id,
  };
}

function buildMergedSettings(dbRows) {
  const merged = { ...DEFAULT_SETTINGS };

  for (const row of dbRows) {
    if (EDITABLE_KEYS.includes(row.setting_key)) {
      merged[row.setting_key] = row.setting_value;
    }
  }

  return merged;
}

export async function getAllSettings() {
  const rows = await SystemSetting.findAll({
    where: { setting_key: EDITABLE_KEYS },
    order: [['setting_key', 'ASC']],
  });

  const merged = buildMergedSettings(rows);

  return {
    settings: merged,
    items: rows.map(serializeSettingRow),
  };
}

export async function getSetting(key) {
  assertEditableKey(key);

  const row = await SystemSetting.findOne({ where: { setting_key: key } });
  if (row) {
    return row.setting_value;
  }

  return DEFAULT_SETTINGS[key];
}

/**
 * @param {Record<string, unknown>} patch
 * @param {string} staffId
 */
export async function updateSettings(patch, staffId) {
  if (!patch || typeof patch !== 'object') {
    throw new AppError('Settings payload is required', 400, 'VALIDATION_ERROR');
  }

  const keys = Object.keys(patch);
  if (keys.length === 0) {
    return getAllSettings();
  }

  keys.forEach(assertEditableKey);

  const oldValues = {};
  const newValues = {};

  for (const key of keys) {
    oldValues[key] = await getSetting(key);
    newValues[key] = patch[key];

    const existing = await SystemSetting.findOne({ where: { setting_key: key } });

    if (existing) {
      await existing.update({
        setting_value: patch[key],
        updated_by_staff_id: staffId,
      });
    } else {
      await SystemSetting.create({
        id: generateUuid(),
        setting_key: key,
        setting_value: patch[key],
        description: null,
        updated_by_staff_id: staffId,
      });
    }
  }

  await auditService.writeAuditLog({
    staffId,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: 'SystemSetting',
    entityId: null,
    oldValues,
    newValues,
  });

  return getAllSettings();
}

export const settingsService = Object.freeze({
  getAllSettings,
  getSetting,
  updateSettings,
  assertEditableKey,
  DEFAULT_SETTINGS,
  EDITABLE_KEYS,
});

export default settingsService;
