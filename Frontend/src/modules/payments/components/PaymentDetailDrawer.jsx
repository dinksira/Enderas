import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/Button.jsx';
import { AdminDetailDrawer } from '../../../components/admin/AdminDetailDrawer.jsx';
import { StatusPill } from '../../../components/admin/StatusPill.jsx';
import { MODULES, ACTIONS } from '../../../config/navigation.config.js';
import { useAuthStore } from '@enderass/shared/auth';
import { formatEtbAmount } from '@enderass/shared/utils';
import { paymentService } from '../services/payment-service.js';
import { formatDate, getPaymentStatusVariant } from '../utils/payment-management-utils.js';

function MetaField({ label, value }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value || '—'}</dd>
    </>
  );
}

/**
 * @param {{
 *   paymentId: string|null,
 *   open: boolean,
 *   actionLoading?: boolean,
 *   onClose: () => void,
 *   onApprove: (payment: object) => void,
 *   onReject: (payment: object) => void,
 *   onRefresh: () => void,
 * }} props
 */
export function PaymentDetailDrawer({
  paymentId,
  open,
  actionLoading = false,
  onClose,
  onApprove,
  onReject,
  onRefresh,
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'am' ? 'am' : 'en';
  const can = useAuthStore((state) => state.can);

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadDetail = async () => {
    if (!paymentId) return;
    setLoading(true);
    setError('');
    try {
      const detail = await paymentService.getPaymentById(paymentId);
      setPayment(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('payments.management.drawer.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !paymentId) {
      setPayment(null);
      setError('');
      return undefined;
    }
    loadDetail();
    return undefined;
  }, [open, paymentId]);

  const canApprove = can(MODULES.PAYMENTS, ACTIONS.APPROVE);
  const canReject = can(MODULES.PAYMENTS, ACTIONS.REJECT);
  const isPending = payment?.status === 'pending';

  const footer =
    !loading && !error && payment && isPending && (canApprove || canReject) ? (
      <>
        {canApprove && (
          <Button variant="primary" disabled={actionLoading} onClick={() => onApprove(payment)}>
            {t('payments.management.drawer.approve')}
          </Button>
        )}
        {canReject && (
          <Button variant="secondary" disabled={actionLoading} onClick={() => onReject(payment)}>
            {t('payments.management.drawer.reject')}
          </Button>
        )}
        <Button variant="secondary" onClick={onRefresh}>
          {t('payments.management.drawer.refresh')}
        </Button>
      </>
    ) : null;

  const sections = payment
    ? [
        {
          key: 'payment',
          title: t('payments.management.drawer.paymentSection'),
          children: (
            <dl className="admin-drawer__meta-grid">
              <MetaField label={t('payments.management.drawer.payer')} value={payment.payerName} />
              <MetaField label={t('payments.management.drawer.auction')} value={payment.auctionTitle} />
              <MetaField
                label={t('payments.management.drawer.amount')}
                value={formatEtbAmount(payment.amount)}
              />
              <MetaField
                label={t('payments.management.drawer.method')}
                value={t(`payments.management.methods.${payment.paymentMethod}`, {
                  defaultValue: payment.paymentMethod,
                })}
              />
              <MetaField
                label={t('payments.management.drawer.transactionRef')}
                value={payment.transactionReference}
              />
              <MetaField
                label={t('payments.management.drawer.paidAt')}
                value={formatDate(payment.paidAt, locale)}
              />
              <MetaField
                label={t('payments.management.drawer.verifiedBy')}
                value={payment.verifiedByName}
              />
              <MetaField
                label={t('payments.management.drawer.verifiedAt')}
                value={formatDate(payment.verifiedAt, locale)}
              />
              {payment.rejectionReason && (
                <MetaField
                  label={t('payments.management.drawer.rejectionReason')}
                  value={payment.rejectionReason}
                />
              )}
            </dl>
          ),
        },
        ...(payment.receiptUrl
          ? [
              {
                key: 'receipt',
                title: t('payments.management.drawer.receipt'),
                children: (
                  <a href={payment.receiptUrl} target="_blank" rel="noreferrer">
                    <img src={payment.receiptUrl} alt="" className="admin-drawer__thumbnail" />
                  </a>
                ),
              },
            ]
          : []),
      ]
    : [];

  return (
    <AdminDetailDrawer
      open={open}
      onClose={onClose}
      title={payment?.payerName || t('payments.management.drawer.title')}
      subtitle={payment?.auctionTitle}
      status={
        payment ? (
          <StatusPill
            label={t(`payments.management.status.${payment.status}`, { defaultValue: payment.status })}
            variant={getPaymentStatusVariant(payment.status)}
          />
        ) : null
      }
      sections={sections}
      footer={footer}
      loading={loading}
      error={error}
      onRetry={loadDetail}
    />
  );
}

export default PaymentDetailDrawer;
