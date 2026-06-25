import { formatDate } from '../../users/utils/user-management-utils.js';

export const EVALUATION_PAGE_SIZE = 20;

export const EVALUATION_TAB_KEYS = Object.freeze([
  'all',
  'scheduled',
  'in_progress',
  'completed',
  'approved',
  'rejected',
]);

export const EVALUATION_TABLE_COLUMNS = Object.freeze([
  'asset',
  'category',
  'owner',
  'scheduledDate',
  'evaluator',
  'status',
  'actions',
]);

export function getEvaluationStatusVariant(status) {
  switch (status) {
    case 'scheduled':
      return 'pending';
    case 'in_progress':
      return 'under-review';
    case 'completed':
      return 'default';
    case 'approved':
      return 'active';
    case 'rejected':
      return 'rejected';
    default:
      return 'default';
  }
}

export function formatAssetCategory(t, assetType) {
  if (!assetType) return '—';
  return t(`assets.types.${assetType}`, { defaultValue: assetType });
}

export { formatDate };
