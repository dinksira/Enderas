import { useTranslation } from 'react-i18next';
import { RejectReasonModal } from '../../../components/admin/RejectReasonModal.jsx';

/**
 * @param {{
 *   open: boolean,
 *   statusTarget: 'suspended'|'deactivated'|null,
 *   userName?: string,
 *   loading?: boolean,
 *   error?: string,
 *   onConfirm: (reason: string) => void,
 *   onCancel: () => void,
 * }} props
 */
export function UserStatusModal({
  open,
  statusTarget,
  userName = '',
  loading = false,
  error = '',
  onConfirm,
  onCancel,
}) {
  const { t } = useTranslation();

  if (!statusTarget) return null;

  const isSuspend = statusTarget === 'suspended';

  return (
    <RejectReasonModal
      open={open}
      title={
        isSuspend
          ? t('users.management.statusModal.suspendTitle')
          : t('users.management.statusModal.deactivateTitle')
      }
      body={
        isSuspend
          ? t('users.management.statusModal.suspendBody', { name: userName })
          : t('users.management.statusModal.deactivateBody', { name: userName })
      }
      reasonLabel={t('users.management.statusModal.reasonLabel')}
      confirmLabel={
        isSuspend
          ? t('users.management.statusModal.confirmSuspend')
          : t('users.management.statusModal.confirmDeactivate')
      }
      quickReasons={
        isSuspend
          ? [
              t('users.management.statusModal.quickReasons.policy'),
              t('users.management.statusModal.quickReasons.fraud'),
              t('users.management.statusModal.quickReasons.abuse'),
            ]
          : [
              t('users.management.statusModal.quickReasons.requested'),
              t('users.management.statusModal.quickReasons.duplicate'),
              t('users.management.statusModal.quickReasons.inactive'),
            ]
      }
      loading={loading}
      error={error}
      onConfirm={onConfirm}
      onCancel={onCancel}
      titleId="user-status-modal-title"
    />
  );
}

export default UserStatusModal;
