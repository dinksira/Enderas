import { StatusPill, AdminDetailDrawer } from '@enderass/shared/ui-admin';
import { Button, ImageViewer, ModalCloseButton } from '@enderass/shared/ui';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MODULES, ACTIONS } from '../../../config/navigation.config.js';
import { useAuthStore } from '@enderass/shared/auth';
import { formatEtbAmount } from '@enderass/shared/utils';
import { paymentService } from '@enderass/shared/services';
import { formatDate, getPaymentStatusVariant, isPdfUrl } from '../utils/payment-management-utils.js';

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
  const [viewerSrc, setViewerSrc] = useState(null);

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
      setViewerSrc(null);
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
                children: isPdfUrl(payment.receiptUrl) ? (
                  <Button variant="secondary" onClick={() => setViewerSrc(payment.receiptUrl)}>
                    {t('payments.management.drawer.viewReceipt')}
                  </Button>
                ) : (
                  <button
                    type="button"
                    className="admin-drawer__thumbnail-btn"
                    onClick={() => setViewerSrc(payment.receiptUrl)}
                    aria-label={t('payments.management.drawer.viewReceipt')}
                  >
                    <img
                      src={payment.receiptUrl}
                      alt={t('payments.management.drawer.receipt')}
                      className="admin-drawer__thumbnail"
                    />
                  </button>
                ),
              },
            ]
          : []),
      ]
    : [];

  return (
    <>
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

      {viewerSrc && !isPdfUrl(viewerSrc) && (
        <ImageViewer
          src={viewerSrc}
          alt={t('payments.management.drawer.receipt')}
          onClose={() => setViewerSrc(null)}
        />
      )}

      {viewerSrc && isPdfUrl(viewerSrc) && (
        <div className="kyc-modal-overlay" role="presentation" onClick={() => setViewerSrc(null)}>
          <div className="kyc-pdf-viewer" onClick={(event) => event.stopPropagation()}>
            <header className="kyc-pdf-viewer__header">
              <ModalCloseButton onClick={() => setViewerSrc(null)} />
            </header>
            <iframe
              title={t('payments.management.drawer.receiptPreview')}
              src={viewerSrc}
              className="kyc-pdf-viewer__frame"
            />
          </div>
        </div>
      )}
    </>
  );
}

export default PaymentDetailDrawer;
