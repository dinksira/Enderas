import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, ModalCloseButton } from '@enderass/shared/ui';
import { FileUpload } from '../../../components/FileUpload.jsx';
import { formatEtbAmount } from '@enderass/shared/utils';
import { paymentService } from '../../payments/services/payment-service.js';

/**
 * @param {{
 *   open: boolean,
 *   loading?: boolean,
 *   auction?: object|null,
 *   onClose: () => void,
 *   onSubmit: () => Promise<void>,
 * }} props
 */
export function DocumentPaymentModal({ open, loading = false, auction, onClose, onSubmit }) {
  const { t } = useTranslation();
  const [receiptUrl, setReceiptUrl] = useState('');
  const [transactionReference, setTransactionReference] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const documentFee = auction?.documentFee ?? auction?.document_price ?? 0;
  const busy = loading || submitting;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!auction?.id) return;
    if (!receiptUrl) {
      setError(t('bidder.participation.paymentModal.receiptRequired'));
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await paymentService.createPayment({
        auctionId: auction.id,
        amount: documentFee,
        paymentMethod: 'manual',
        receiptUrl,
        transactionReference: transactionReference.trim() || undefined,
      });
      await onSubmit();
      setReceiptUrl('');
      setTransactionReference('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('bidder.participation.paymentModal.failed'));
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="kyc-modal-overlay" role="presentation" onClick={busy ? undefined : onClose}>
      <form
        className="kyc-modal kyc-modal--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="document-payment-title"
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <ModalCloseButton onClick={onClose} disabled={busy} />
        <h2 id="document-payment-title" className="kyc-modal__title">
          {t('bidder.participation.paymentModal.title')}
        </h2>
        <p className="kyc-modal__body">{t('bidder.participation.paymentModal.subtitle')}</p>

        <dl className="auction-participation-modal__meta">
          <dt>{t('bidder.participation.paymentModal.auction')}</dt>
          <dd>{auction?.title || '—'}</dd>
          <dt>{t('bidder.participation.paymentModal.amount')}</dt>
          <dd>{formatEtbAmount(documentFee)}</dd>
        </dl>

        <label className="kyc-modal__label" htmlFor="payment-transaction-ref">
          {t('bidder.participation.paymentModal.transactionReference')}
        </label>
        <input
          id="payment-transaction-ref"
          type="text"
          className="input-field__control"
          value={transactionReference}
          onChange={(event) => setTransactionReference(event.target.value)}
          disabled={busy}
          placeholder={t('bidder.participation.paymentModal.transactionReferencePlaceholder')}
        />

        <FileUpload
          label={t('bidder.participation.paymentModal.receipt')}
          folder="payments/receipts"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          disabled={busy}
          onUpload={(result) => setReceiptUrl(result?.fileUrl || result?.url || '')}
        />
        {receiptUrl && (
          <p className="kyc-modal__hint">{t('bidder.participation.paymentModal.receiptUploaded')}</p>
        )}

        {error && (
          <p className="kyc-modal__error" role="alert">
            {error}
          </p>
        )}

        <div className="kyc-modal__actions">
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
            {t('admin.cancel')}
          </Button>
          <Button type="submit" variant="primary" disabled={busy}>
            <span className="auction-confirm-modal__btn-content">
              {busy && <span className="auction-confirm-modal__spinner" aria-hidden="true" />}
              {busy
                ? t('bidder.participation.paymentModal.submitting')
                : t('bidder.participation.paymentModal.submit')}
            </span>
          </Button>
        </div>
      </form>
    </div>
  );
}

export default DocumentPaymentModal;
