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
export function StaffReactivateConfirmModal({
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
      title={t('staff.management.reactivateModal.title')}
      body={t('staff.management.reactivateModal.body', { name: staffName })}
      confirmLabel={t('staff.management.reactivateModal.confirm')}
      loading={loading}
      onConfirm={onConfirm}
      onCancel={onCancel}
      titleId="staff-reactivate-modal-title"
    />
  );
}

export default StaffReactivateConfirmModal;
