import { RejectReasonModal } from '@enderass/shared/ui-admin';
/**
 * Payment-specific reject modal wrapper.
 * @param {import('../../../components/admin/RejectReasonModal.jsx').RejectReasonModalProps} props
 */
export function PaymentRejectModal({ title, body, quickReasons, ...rest }) {
  return (
    <RejectReasonModal
      title={title}
      body={body}
      quickReasons={quickReasons}
      {...rest}
    />
  );
}

export default PaymentRejectModal;
