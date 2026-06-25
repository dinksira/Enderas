import { formatDisplayValue, formatDate } from '../../users/utils/user-management-utils.js';

export const STAFF_ROLE_CODES = Object.freeze([
  'super_admin',
  'auction_manager',
  'evaluation_officer',
  'finance_officer',
  'customer_service_officer',
]);

/**
 * @param {object|null|undefined} staff
 */
export function getStaffDisplayName(staff) {
  if (!staff) return '';
  const user = staff.user;
  if (user?.displayName) return user.displayName;
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
  return fullName || staff.displayName || '';
}

/**
 * @param {import('i18next').TFunction} t
 * @param {string|null|undefined} roleCode
 */
export function getStaffRoleLabel(t, roleCode) {
  if (!roleCode) return '';
  return t(`staff.management.roles.${roleCode}.name`, { defaultValue: roleCode });
}

/**
 * @param {import('i18next').TFunction} t
 * @param {string|null|undefined} roleCode
 */
export function getStaffRoleDescription(t, roleCode) {
  if (!roleCode) return '';
  return t(`staff.management.roles.${roleCode}.description`, { defaultValue: '' });
}

/**
 * @param {import('i18next').TFunction} t
 * @param {string|null|undefined} language
 */
export function formatStaffLanguage(t, language) {
  if (language === 'am') return t('common.languages.amharic');
  if (language === 'en') return t('common.languages.english');
  return language;
}

/**
 * @param {import('i18next').TFunction} t
 * @param {string} moduleName
 */
export function getPermissionModuleLabel(t, moduleName) {
  return t(`staff.management.permissions.modules.${moduleName}`, { defaultValue: moduleName });
}

/**
 * @param {import('i18next').TFunction} t
 * @param {string} actionName
 */
export function getPermissionActionLabel(t, actionName) {
  return t(`staff.management.permissions.actions.${actionName}`, { defaultValue: actionName });
}

/**
 * @param {import('i18next').TFunction} t
 * @param {object} role
 */
export function buildRoleAccessPreview(t, role) {
  const matrix = Array.isArray(role?.matrix) ? role.matrix : [];

  return matrix.map((row) => {
    const grantedActions = Object.entries(row.actions || {})
      .filter(([, granted]) => granted)
      .map(([actionName]) => actionName);

    if (grantedActions.length === 0) {
      return {
        module: row.module,
        label: getPermissionModuleLabel(t, row.module),
        granted: false,
        summary: t('staff.management.permissions.none'),
      };
    }

    const summary = grantedActions.length === Object.keys(row.actions || {}).length
      ? t('staff.management.permissions.full')
      : grantedActions.map((actionName) => getPermissionActionLabel(t, actionName)).join(', ');

    return {
      module: row.module,
      label: getPermissionModuleLabel(t, row.module),
      granted: true,
      summary,
    };
  });
}

export { formatDisplayValue, formatDate };
