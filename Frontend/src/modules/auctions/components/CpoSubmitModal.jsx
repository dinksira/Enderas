import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/Button.jsx';
import { FileUpload } from '../../../components/FileUpload.jsx';
import { cpoService } from '../../cpo-management/services/cpo-service.js';

/**
 * @param {{
 *   open: boolean,
 *   loading?: boolean,
 *   auction?: object|null,
 *   onClose: () => void,
 *   onSubmit: () => Promise<void>,
 * }} props
 */
export function CpoSubmitModal({ open, loading = false, auction, onClose, onSubmit }) {
  const { t } = useTranslation();
  const [documentUrl, setDocumentUrl] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const busy = loading || submitting;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!auction?.id) return;
    if (!documentUrl) {
      setError(t('bidder.participation.cpoModal.documentRequired'));
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await cpoService.createCpo({
        auctionId: auction.id,
        documentUrl,
      });
      await onSubmit();
      setDocumentUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('bidder.participation.cpoModal.failed'));
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
        aria-labelledby="cpo-submit-title"
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2 id="cpo-submit-title" className="kyc-modal__title">
          {t('bidder.participation.cpoModal.title')}
        </h2>
        <p className="kyc-modal__body">{t('bidder.participation.cpoModal.subtitle')}</p>

        <dl className="auction-participation-modal__meta">
          <dt>{t('bidder.participation.cpoModal.auction')}</dt>
          <dd>{auction?.title || '—'}</dd>
        </dl>

        <FileUpload
          label={t('bidder.participation.cpoModal.document')}
          folder="cpo/documents"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          disabled={busy}
          onUpload={(result) => setDocumentUrl(result?.fileUrl || result?.url || '')}
        />
        {documentUrl && (
          <p className="kyc-modal__hint">{t('bidder.participation.cpoModal.documentUploaded')}</p>
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
                ? t('bidder.participation.cpoModal.submitting')
                : t('bidder.participation.cpoModal.submit')}
            </span>
          </Button>
        </div>
      </form>
    </div>
  );
}

export default CpoSubmitModal;
