import { useTranslation } from 'react-i18next';
import { ApproveConfirmModal } from '@enderass/shared/ui-admin';

/**
 * @param {{
 *   open: boolean,
 *   staffName?: string,
 *   loading?: boolean,
 *   onConfirm: () => void,
 *   onCancel: () => void,
 * }} props
 */
export function StaffDeactivateConfirmModal({
  open,
  staffName = '',
  loading = false,
  onConfirm,
  onCancel,
}) {
  const { t } = useTranslation();

  return (
    <ApproveConfirmModal
      open={open}
      title={t('staff.management.deactivateModal.title')}
      body={t('staff.management.deactivateModal.body', { name: staffName })}
      confirmLabel={t('staff.management.deactivateModal.confirm')}
      loading={loading}
      onConfirm={onConfirm}
      onCancel={onCancel}
      titleId="staff-deactivate-modal-title"
    />
  );
}

export default StaffDeactivateConfirmModal;
