import { Button, FileUpload, ModalCloseButton } from '@enderass/shared/ui';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fileUploadService } from '@enderass/shared/services';

function parseAmount(value) {
  const normalized = String(value || '').replace(/,/g, '').trim();
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : NaN;
}

function formatAmountInput(value) {
  const digits = String(value || '').replace(/[^\d.]/g, '');
  if (!digits) return '';
  const [whole, fraction] = digits.split('.');
  const formattedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return fraction !== undefined ? `${formattedWhole}.${fraction}` : formattedWhole;
}

/**
 * @param {{
 *   open: boolean,
 *   loading?: boolean,
 *   evaluation?: object|null,
 *   onClose: () => void,
 *   onSubmit: (payload: {
 *     reservePriceRecommendation: number,
 *     photoUrls?: string[],
 *     reportUrl?: string,
 *     notes?: string,
 *   }) => Promise<void>,
 * }} props
 */
export function EvaluationCompleteModal({
  open,
  loading = false,
  evaluation,
  onClose,
  onSubmit,
}) {
  const { t } = useTranslation();
  const [reservePrice, setReservePrice] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUrls, setPhotoUrls] = useState([]);
  const [reportUrl, setReportUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setReservePrice('');
      setNotes('');
      setPhotoUrls([]);
      setReportUrl('');
      setError('');
      return;
    }

    const existingReserve = evaluation?.reservePriceRecommendation ?? evaluation?.valuationAmount;
    const ownerHint = evaluation?.asset?.desiredReservePrice;

    if (existingReserve != null) {
      setReservePrice(formatAmountInput(String(existingReserve)));
    } else if (ownerHint != null) {
      setReservePrice(formatAmountInput(String(ownerHint)));
    }

    if (evaluation?.notes) {
      setNotes(evaluation.notes);
    }
    setPhotoUrls(evaluation?.photoUrls ?? []);
    setReportUrl(evaluation?.reportUrl ?? '');
  }, [open, evaluation]);

  if (!open) return null;

  const handlePhotoFiles = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    setError('');
    try {
      const uploads = await Promise.all(
        Array.from(files).map((file) => fileUploadService.uploadFile(file, 'evaluations/photos')),
      );
      const newUrls = uploads.map((item) => item?.url || item?.fileUrl).filter(Boolean);
      setPhotoUrls((current) => [...current, ...newUrls]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('evaluations.management.completeModal.failed'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const reserve = parseAmount(reservePrice);

    if (!Number.isFinite(reserve) || reserve <= 0) {
      setError(t('evaluations.management.completeModal.reserveRequired'));
      return;
    }
    if (!photoUrls.length) {
      setError(t('evaluations.management.completeModal.photosRequired'));
      return;
    }
    if (!reportUrl?.trim()) {
      setError(t('evaluations.management.completeModal.reportRequired'));
      return;
    }

    setError('');
    try {
      await onSubmit({
        reservePriceRecommendation: reserve,
        photoUrls,
        reportUrl: reportUrl.trim(),
        notes: notes.trim() || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('evaluations.management.completeModal.failed'));
    }
  };

  const busy = loading || uploading;
  const ownerReserveHint = evaluation?.asset?.desiredReservePrice;

  return (
    <div className="kyc-modal-overlay" role="presentation" onClick={busy ? undefined : onClose}>
      <form
        className="kyc-modal kyc-modal--wide kyc-modal--scrollable"
        role="dialog"
        aria-modal="true"
        aria-labelledby="complete-evaluation-title"
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <ModalCloseButton onClick={onClose} disabled={busy} />
        <h2 id="complete-evaluation-title" className="kyc-modal__title">
          {t('evaluations.management.completeModal.title')}
        </h2>
        <p className="kyc-modal__body">{t('evaluations.management.completeModal.subtitle')}</p>

        <label className="kyc-modal__label" htmlFor="complete-reserve-price">
          {t('evaluations.management.completeModal.reserveRecommendation')}
        </label>
        <input
          id="complete-reserve-price"
          type="text"
          inputMode="decimal"
          className="input-field__control"
          value={reservePrice}
          onChange={(event) => setReservePrice(formatAmountInput(event.target.value))}
          disabled={busy}
        />
        <p className="kyc-modal__hint">{t('evaluations.management.completeModal.reserveHint')}</p>
        {ownerReserveHint != null && (
          <p className="kyc-modal__hint">
            {t('evaluations.management.completeModal.ownerReserveHint', {
              amount: formatAmountInput(String(ownerReserveHint)),
            })}
          </p>
        )}

        <h3 className="kyc-modal__section-label">{t('evaluations.management.completeModal.documentationSection')}</h3>

        <label className="kyc-modal__label" htmlFor="complete-evaluation-photos">
          {t('evaluations.management.completeModal.photos')}
        </label>
        <input
          id="complete-evaluation-photos"
          type="file"
          accept="image/*"
          multiple
          className="input-field__control"
          onChange={(event) => handlePhotoFiles(event.target.files)}
          disabled={busy}
        />
        {photoUrls.length > 0 && (
          <div className="admin-drawer__thumbnails evaluation-complete-modal__thumbnails">
            {photoUrls.map((url) => (
              <img key={url} src={url} alt="" className="admin-drawer__thumbnail" />
            ))}
          </div>
        )}

        <FileUpload
          label={t('evaluations.management.completeModal.report')}
          folder="evaluations/reports"
          accept=".pdf,application/pdf"
          disabled={busy}
          onUpload={(result) => setReportUrl(result?.fileUrl || result?.url || '')}
        />
        {reportUrl && (
          <p className="kyc-modal__hint">{t('evaluations.management.completeModal.reportUploaded')}</p>
        )}

        <label className="kyc-modal__label" htmlFor="complete-evaluation-notes">
          {t('evaluations.management.completeModal.notes')}
        </label>
        <textarea
          id="complete-evaluation-notes"
          className="kyc-modal__textarea evaluation-complete-modal__notes"
          rows={3}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          disabled={busy}
        />

        {error && (
          <p className="kyc-modal__error" role="alert">
            {error}
          </p>
        )}

        <div className="kyc-modal__actions kyc-modal__actions--sticky">
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
            {t('admin.cancel')}
          </Button>
          <Button type="submit" variant="primary" disabled={busy}>
            <span className="auction-confirm-modal__btn-content">
              {busy && <span className="auction-confirm-modal__spinner" aria-hidden="true" />}
              {busy
                ? t('evaluations.management.completeModal.submitting')
                : t('evaluations.management.completeModal.submit')}
            </span>
          </Button>
        </div>
      </form>
    </div>
  );
}

export default EvaluationCompleteModal;
