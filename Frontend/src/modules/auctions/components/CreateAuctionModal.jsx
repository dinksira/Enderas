import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/Button.jsx';
import { Input } from '../../../components/Input.jsx';
import { auctionService } from '../services/auction-service.js';
import {
  AUCTION_CATEGORY_KEYS,
  AUCTION_STEP_ORDER,
  AUCTION_STEPS,
  buildAuctionPayload,
  EMPTY_AUCTION_FORM,
  formatFileSize,
  validateAuctionStep,
} from '../utils/auction-form-utils.js';

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/gif,image/webp';
const PDF_ACCEPT = 'application/pdf';

function cloneInitialForm() {
  return {
    ...EMPTY_AUCTION_FORM,
    images: [],
    documents: [],
  };
}

/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   onSuccess: () => void,
 * }} props
 */
export function CreateAuctionModal({ open, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(AUCTION_STEPS.BASIC);
  const [form, setForm] = useState(cloneInitialForm);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [imagePreviews, setImagePreviews] = useState([]);

  const imageInputRef = useRef(null);
  const documentInputRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setStep(AUCTION_STEPS.BASIC);
      setForm(cloneInitialForm());
      setErrors({});
      setSubmitError('');
      setSubmitting(false);
      setImagePreviews((current) => {
        current.forEach((preview) => {
          if (preview?.url) {
            URL.revokeObjectURL(preview.url);
          }
        });
        return [];
      });
    }
  }, [open]);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => {
        if (preview?.url) {
          URL.revokeObjectURL(preview.url);
        }
      });
    };
  }, [imagePreviews]);

  const stepIndex = AUCTION_STEP_ORDER.indexOf(step);

  const clearFieldError = (field) => {
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
    setSubmitError('');
  };

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    clearFieldError(field);
  };

  const goToStep = (targetStep) => {
    setStep(targetStep);
    setErrors({});
    setSubmitError('');
  };

  const handleNext = () => {
    const stepErrors = validateAuctionStep(step, form, t);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    const nextStep = AUCTION_STEP_ORDER[stepIndex + 1];
    if (nextStep) {
      goToStep(nextStep);
    }
  };

  const handleBack = () => {
    const prevStep = AUCTION_STEP_ORDER[stepIndex - 1];
    if (prevStep) {
      goToStep(prevStep);
    }
  };

  const handleImageSelect = (event) => {
    const selected = Array.from(event.target.files || []);
    if (!selected.length) {
      return;
    }

    const nextImages = [...form.images, ...selected];
    const nextPreviews = [
      ...imagePreviews,
      ...selected.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        url: URL.createObjectURL(file),
        name: file.name,
      })),
    ];

    setForm((current) => ({ ...current, images: nextImages }));
    setImagePreviews(nextPreviews);
    clearFieldError('images');
    event.target.value = '';
  };

  const removeImage = (index) => {
    setForm((current) => ({
      ...current,
      images: current.images.filter((_, i) => i !== index),
    }));

    setImagePreviews((current) => {
      const removed = current[index];
      if (removed?.url) {
        URL.revokeObjectURL(removed.url);
      }
      return current.filter((_, i) => i !== index);
    });
  };

  const handleDocumentSelect = (event) => {
    const selected = Array.from(event.target.files || []).filter(
      (file) => file.type === 'application/pdf',
    );

    if (!selected.length) {
      setErrors((current) => ({
        ...current,
        documents: t('auctions.create.errors.pdfOnly'),
      }));
      return;
    }

    const nextDocuments = [
      ...form.documents,
      ...selected.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        name: file.name,
        size: file.size,
      })),
    ];

    setForm((current) => ({ ...current, documents: nextDocuments }));
    clearFieldError('documents');
    event.target.value = '';
  };

  const removeDocument = (id) => {
    setForm((current) => ({
      ...current,
      documents: current.documents.filter((doc) => doc.id !== id),
    }));
  };

  const handleSubmit = async () => {
    const reviewErrors = {
      ...validateAuctionStep(AUCTION_STEPS.BASIC, form, t),
      ...validateAuctionStep(AUCTION_STEPS.SCHEDULE, form, t),
      ...validateAuctionStep(AUCTION_STEPS.MEDIA, form, t),
    };

    if (Object.keys(reviewErrors).length > 0) {
      setErrors(reviewErrors);
      setSubmitError(t('auctions.create.errors.fixBeforeSubmit'));
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const imageFiles = form.images;
      const documentFiles = form.documents.map((doc) => doc.file);

      const [uploadedImages, uploadedDocuments] = await Promise.all([
        auctionService.uploadFiles(imageFiles, 'auctions/images'),
        auctionService.uploadFiles(documentFiles, 'auctions/documents'),
      ]);

      const payload = buildAuctionPayload(form);
      payload.imageUrls = uploadedImages.map((file) => file.fileUrl).filter(Boolean);
      payload.documents = uploadedDocuments.map((file, index) => ({
        name: form.documents[index]?.name || file.originalName || file.fileName,
        url: file.fileUrl,
        size: file.fileSize || form.documents[index]?.size || 0,
      }));

      await auctionService.create(payload);
      onSuccess();
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('auctions.create.errors.submitFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const reviewRows = useMemo(
    () => [
      { label: t('auctions.create.fields.title'), value: form.title, step: AUCTION_STEPS.BASIC },
      {
        label: t('auctions.create.fields.category'),
        value: form.category ? t(`category.${form.category}`) : '—',
        step: AUCTION_STEPS.BASIC,
      },
      {
        label: t('auctions.create.fields.description'),
        value: form.description || '—',
        step: AUCTION_STEPS.BASIC,
      },
      {
        label: t('auctions.create.fields.auctionConditions'),
        value: form.auctionConditions || '—',
        step: AUCTION_STEPS.BASIC,
      },
      {
        label: t('auctions.create.fields.startDate'),
        value: form.startDate ? new Date(form.startDate).toLocaleString() : '—',
        step: AUCTION_STEPS.SCHEDULE,
      },
      {
        label: t('auctions.create.fields.endDate'),
        value: form.endDate ? new Date(form.endDate).toLocaleString() : '—',
        step: AUCTION_STEPS.SCHEDULE,
      },
      {
        label: t('auctions.create.fields.reservePrice'),
        value: form.reservePrice ? `${form.reservePrice} ETB` : '—',
        step: AUCTION_STEPS.SCHEDULE,
      },
      {
        label: t('auctions.create.fields.documentFee'),
        value: form.documentFee !== '' ? `${form.documentFee} ETB` : '—',
        step: AUCTION_STEPS.SCHEDULE,
      },
      {
        label: t('auctions.create.fields.cpoPercentage'),
        value: form.cpoPercentage !== '' ? `${form.cpoPercentage}%` : '—',
        step: AUCTION_STEPS.SCHEDULE,
      },
      {
        label: t('auctions.create.fields.images'),
        value: t('auctions.create.review.imageCount', { count: form.images.length }),
        step: AUCTION_STEPS.MEDIA,
      },
      {
        label: t('auctions.create.fields.documents'),
        value: t('auctions.create.review.documentCount', { count: form.documents.length }),
        step: AUCTION_STEPS.MEDIA,
      },
    ],
    [form, t],
  );

  if (!open) {
    return null;
  }

  const handleOverlayClick = () => {
    if (!submitting) {
      onClose();
    }
  };

  return (
    <div className="kyc-modal-overlay" role="presentation" onClick={handleOverlayClick}>
      <div
        className="kyc-modal auction-create-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-auction-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="auction-create-modal__header">
          <div>
            <h2 id="create-auction-modal-title" className="kyc-modal__title">
              {t('auctions.create.title')}
            </h2>
            <p className="kyc-modal__body">{t('auctions.create.subtitle')}</p>
          </div>
          <button
            type="button"
            className="auction-create-modal__close"
            onClick={onClose}
            disabled={submitting}
            aria-label={t('common.close')}
          >
            ×
          </button>
        </div>

        <ol className="auction-create-modal__steps" aria-label={t('auctions.create.stepProgress')}>
          {AUCTION_STEP_ORDER.map((stepKey, index) => {
            const isActive = stepKey === step;
            const isComplete = index < stepIndex;
            return (
              <li
                key={stepKey}
                className={[
                  'auction-create-modal__step',
                  isActive ? 'auction-create-modal__step--active' : '',
                  isComplete ? 'auction-create-modal__step--complete' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span className="auction-create-modal__step-index">{index + 1}</span>
                <span className="auction-create-modal__step-label">
                  {t(`auctions.create.steps.${stepKey}`)}
                </span>
              </li>
            );
          })}
        </ol>

        <div className="auction-create-modal__body">
          {step === AUCTION_STEPS.BASIC && (
            <div className="auction-create-modal__grid">
              <Input
                label={t('auctions.create.fields.title')}
                name="title"
                value={form.title}
                onChange={(event) => updateField('title', event.target.value)}
                error={errors.title}
                disabled={submitting}
              />

              <div className="input-field">
                <label className="input-field__label" htmlFor="auction-category">
                  {t('auctions.create.fields.category')}
                </label>
                <select
                  id="auction-category"
                  className={[
                    'input-field__control',
                    'auction-create-modal__select',
                    errors.category ? 'input-field__control--error' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  value={form.category}
                  onChange={(event) => updateField('category', event.target.value)}
                  disabled={submitting}
                  aria-invalid={errors.category ? 'true' : undefined}
                >
                  <option value="">{t('auctions.create.placeholders.selectCategory')}</option>
                  {AUCTION_CATEGORY_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {t(`category.${key}`)}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <span className="input-field__error" role="alert">
                    {errors.category}
                  </span>
                )}
              </div>

              <div className="input-field auction-create-modal__full">
                <label className="input-field__label" htmlFor="auction-description">
                  {t('auctions.create.fields.description')}
                </label>
                <textarea
                  id="auction-description"
                  className="kyc-modal__textarea auction-create-modal__textarea"
                  rows={4}
                  value={form.description}
                  onChange={(event) => updateField('description', event.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="input-field auction-create-modal__full">
                <label className="input-field__label" htmlFor="auction-conditions">
                  {t('auctions.create.fields.auctionConditions')}
                </label>
                <textarea
                  id="auction-conditions"
                  className={[
                    'kyc-modal__textarea',
                    'auction-create-modal__textarea',
                    errors.auctionConditions ? 'auction-create-modal__textarea--error' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  rows={5}
                  value={form.auctionConditions}
                  onChange={(event) => updateField('auctionConditions', event.target.value)}
                  disabled={submitting}
                  aria-invalid={errors.auctionConditions ? 'true' : undefined}
                />
                {errors.auctionConditions && (
                  <span className="input-field__error" role="alert">
                    {errors.auctionConditions}
                  </span>
                )}
              </div>
            </div>
          )}

          {step === AUCTION_STEPS.SCHEDULE && (
            <div className="auction-create-modal__grid">
              <Input
                label={t('auctions.create.fields.startDate')}
                name="startDate"
                type="datetime-local"
                value={form.startDate}
                onChange={(event) => updateField('startDate', event.target.value)}
                error={errors.startDate}
                disabled={submitting}
              />
              <Input
                label={t('auctions.create.fields.endDate')}
                name="endDate"
                type="datetime-local"
                value={form.endDate}
                onChange={(event) => updateField('endDate', event.target.value)}
                error={errors.endDate}
                disabled={submitting}
              />
              <Input
                label={t('auctions.create.fields.reservePrice')}
                name="reservePrice"
                type="number"
                min="0"
                step="0.01"
                value={form.reservePrice}
                onChange={(event) => updateField('reservePrice', event.target.value)}
                error={errors.reservePrice}
                disabled={submitting}
              />
              <Input
                label={t('auctions.create.fields.documentFee')}
                name="documentFee"
                type="number"
                min="0"
                step="0.01"
                value={form.documentFee}
                onChange={(event) => updateField('documentFee', event.target.value)}
                error={errors.documentFee}
                disabled={submitting}
              />
              <Input
                label={t('auctions.create.fields.cpoPercentage')}
                name="cpoPercentage"
                type="number"
                min="1"
                max="100"
                step="0.01"
                value={form.cpoPercentage}
                onChange={(event) => updateField('cpoPercentage', event.target.value)}
                error={errors.cpoPercentage}
                disabled={submitting}
              />
            </div>
          )}

          {step === AUCTION_STEPS.MEDIA && (
            <div className="auction-create-modal__media">
              <section className="auction-create-modal__upload-section">
                <h3 className="auction-create-modal__section-title">
                  {t('auctions.create.sections.images')}
                </h3>
                <p className="auction-create-modal__section-hint">
                  {t('auctions.create.hints.images')}
                </p>

                <div
                  className="auction-create-modal__dropzone"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const files = Array.from(event.dataTransfer.files || []).filter((file) =>
                      file.type.startsWith('image/'),
                    );
                    if (!files.length) {
                      return;
                    }
                    const syntheticEvent = { target: { files, value: '' } };
                    handleImageSelect(syntheticEvent);
                  }}
                >
                  <p>{t('auctions.create.dropzone.images')}</p>
                  <button
                    type="button"
                    className="auction-create-modal__browse-btn"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={submitting}
                  >
                    {t('common.selectFile')}
                  </button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept={IMAGE_ACCEPT}
                    multiple
                    hidden
                    onChange={handleImageSelect}
                  />
                </div>

                {imagePreviews.length > 0 && (
                  <div className="auction-create-modal__image-grid">
                    {imagePreviews.map((preview, index) => (
                      <div key={preview.id} className="auction-create-modal__image-card">
                        <img src={preview.url} alt={preview.name} />
                        <button
                          type="button"
                          className="auction-create-modal__remove-btn"
                          onClick={() => removeImage(index)}
                          disabled={submitting}
                          aria-label={t('auctions.create.removeImage', { name: preview.name })}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="auction-create-modal__upload-section">
                <h3 className="auction-create-modal__section-title">
                  {t('auctions.create.sections.documents')}
                </h3>
                <p className="auction-create-modal__section-hint">
                  {t('auctions.create.hints.documents')}
                </p>

                <div
                  className="auction-create-modal__dropzone"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const files = Array.from(event.dataTransfer.files || []);
                    const syntheticEvent = { target: { files, value: '' } };
                    handleDocumentSelect(syntheticEvent);
                  }}
                >
                  <p>{t('auctions.create.dropzone.documents')}</p>
                  <button
                    type="button"
                    className="auction-create-modal__browse-btn"
                    onClick={() => documentInputRef.current?.click()}
                    disabled={submitting}
                  >
                    {t('common.selectFile')}
                  </button>
                  <input
                    ref={documentInputRef}
                    type="file"
                    accept={PDF_ACCEPT}
                    multiple
                    hidden
                    onChange={handleDocumentSelect}
                  />
                </div>

                {errors.documents && (
                  <p className="kyc-modal__error" role="alert">
                    {errors.documents}
                  </p>
                )}

                {form.documents.length > 0 && (
                  <ul className="auction-create-modal__doc-list">
                    {form.documents.map((doc) => (
                      <li key={doc.id} className="auction-create-modal__doc-item">
                        <div>
                          <p className="auction-create-modal__doc-name">{doc.name}</p>
                          <p className="auction-create-modal__doc-size">
                            {formatFileSize(doc.size)}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="auction-create-modal__remove-btn"
                          onClick={() => removeDocument(doc.id)}
                          disabled={submitting}
                          aria-label={t('auctions.create.removeDocument', { name: doc.name })}
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}

          {step === AUCTION_STEPS.REVIEW && (
            <div className="auction-create-modal__review">
              {reviewRows.map((row) => (
                <div key={row.label} className="auction-create-modal__review-row">
                  <div>
                    <p className="auction-create-modal__review-label">{row.label}</p>
                    <p className="auction-create-modal__review-value">{row.value}</p>
                  </div>
                  <button
                    type="button"
                    className="auction-create-modal__edit-link"
                    onClick={() => goToStep(row.step)}
                    disabled={submitting}
                  >
                    {t('auctions.create.review.edit')}
                  </button>
                </div>
              ))}
            </div>
          )}

          {submitError && (
            <p className="kyc-modal__error auction-create-modal__submit-error" role="alert">
              {submitError}
            </p>
          )}
        </div>

        <div className="kyc-modal__actions auction-create-modal__actions">
          {stepIndex > 0 && (
            <Button variant="secondary" onClick={handleBack} disabled={submitting}>
              {t('auctions.create.actions.back')}
            </Button>
          )}

          <div className="auction-create-modal__actions-right">
            <Button variant="secondary" onClick={onClose} disabled={submitting}>
              {t('auctions.create.actions.cancel')}
            </Button>

            {step !== AUCTION_STEPS.REVIEW ? (
              <Button variant="primary" onClick={handleNext} disabled={submitting}>
                {t('auctions.create.actions.next')}
              </Button>
            ) : (
              <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
                {submitting
                  ? t('auctions.create.actions.submitting')
                  : t('auctions.create.actions.submit')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateAuctionModal;
