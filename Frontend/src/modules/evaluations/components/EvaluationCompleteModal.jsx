import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/Button.jsx';
import { FileUpload } from '../../../components/FileUpload.jsx';
import { fileUploadService } from '../../kyc/services/file-upload.service.js';

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
 *     valuationAmount: number,
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
  const [valuationAmount, setValuationAmount] = useState('');
  const [reservePrice, setReservePrice] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUrls, setPhotoUrls] = useState([]);
  const [reportUrl, setReportUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setValuationAmount('');
      setReservePrice('');
      setNotes('');
      setPhotoUrls([]);
      setReportUrl('');
      setError('');
      return;
    }
    if (evaluation?.valuationAmount != null) {
      setValuationAmount(formatAmountInput(String(evaluation.valuationAmount)));
    }
    if (evaluation?.reservePriceRecommendation != null) {
      setReservePrice(formatAmountInput(String(evaluation.reservePriceRecommendation)));
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
    const amount = parseAmount(valuationAmount);
    const reserve = parseAmount(reservePrice);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError(t('evaluations.management.completeModal.valuationRequired'));
      return;
    }
    if (!Number.isFinite(reserve) || reserve <= 0) {
      setError(t('evaluations.management.completeModal.reserveRequired'));
      return;
    }
    if (reserve > amount) {
      setError(t('evaluations.management.completeModal.reserveTooHigh'));
      return;
    }

    setError('');
    try {
      await onSubmit({
        valuationAmount: amount,
        reservePriceRecommendation: reserve,
        photoUrls: photoUrls.length ? photoUrls : undefined,
        reportUrl: reportUrl || undefined,
        notes: notes.trim() || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('evaluations.management.completeModal.failed'));
    }
  };

  const busy = loading || uploading;

  return (
    <div className="kyc-modal-overlay" role="presentation" onClick={busy ? undefined : onClose}>
      <form
        className="kyc-modal kyc-modal--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="complete-evaluation-title"
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2 id="complete-evaluation-title" className="kyc-modal__title">
          {t('evaluations.management.completeModal.title')}
        </h2>
        <p className="kyc-modal__body">{t('evaluations.management.completeModal.subtitle')}</p>

        <h3 className="kyc-modal__section-label">{t('evaluations.management.completeModal.valuationSection')}</h3>

        <label className="kyc-modal__label" htmlFor="complete-valuation-amount">
          {t('evaluations.management.completeModal.valuationAmount')}
        </label>
        <input
          id="complete-valuation-amount"
          type="text"
          inputMode="decimal"
          className="input-field__control"
          value={valuationAmount}
          onChange={(event) => setValuationAmount(formatAmountInput(event.target.value))}
          disabled={busy}
        />

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
          <div className="admin-drawer__thumbnails">
            {photoUrls.map((url) => (
              <img key={url} src={url} alt="" className="admin-drawer__thumbnail" />
            ))}
          </div>
        )}

        <FileUpload
          label={t('evaluations.management.completeModal.report')}
          folder="evaluations/reports"
          accept=".pdf,.doc,.docx,application/pdf"
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
          className="kyc-modal__textarea"
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

        <div className="kyc-modal__actions">
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
