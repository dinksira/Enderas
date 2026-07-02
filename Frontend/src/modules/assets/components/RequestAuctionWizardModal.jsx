import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/Button.jsx';
import { Input } from '../../../components/Input.jsx';
import { FileUpload } from '../../../components/FileUpload.jsx';
import { ROUTES } from '../../../config/routes.js';
import { assetService } from '../services/asset-service.js';
import {
  ASSET_REQUEST_STEP_ORDER,
  ASSET_REQUEST_STEPS,
  ASSET_TYPE_KEYS,
  buildAssetPayload,
  buildEmptyAssetForm,
  cloneAssetFormDraft,
  formatReserveAmount,
  getOwnershipDocType,
  MAX_ASSETS_PER_BATCH,
  OWNERSHIP_DOC_LABEL_KEYS,
  summarizeAssetDraft,
  validateAssetForm,
  validateAssetStep,
} from '../utils/asset-form-utils.js';

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/gif,image/webp';
const OWNERSHIP_ACCEPT = 'application/pdf,image/jpeg,image/png,image/webp';
const PDF_ACCEPT = 'application/pdf';

function cloneInitialForm() {
  return buildEmptyAssetForm();
}

function createClientId() {
  return globalThis.crypto?.randomUUID?.() ?? `asset-${Date.now()}-${Math.random()}`;
}

function buildPhotoPreviewsFromFiles(files) {
  return files.map((file) => ({
    id: `${file.name}-${file.size}-${file.lastModified}`,
    url: URL.createObjectURL(file),
    name: file.name,
  }));
}

function revokePhotoPreviews(previews) {
  previews.forEach((preview) => {
    if (preview?.url) {
      URL.revokeObjectURL(preview.url);
    }
  });
}

/**
 * Scrollable auction request wizard for bidders and asset owners.
 * All form sections appear in one modal; supports queuing multiple assets before batch submission.
 * @param {{ open: boolean, onClose: () => void, onSuccess?: () => void }} props
 */
export function RequestAuctionWizardModal({ open, onClose, onSuccess }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const additionalInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const scrollBodyRef = useRef(null);
  const detailsRef = useRef(null);
  const locationRef = useRef(null);
  const photosRef = useRef(null);
  const documentsRef = useRef(null);
  const reviewRef = useRef(null);

  const sectionRefs = useMemo(() => ({
    [ASSET_REQUEST_STEPS.DETAILS]: detailsRef,
    [ASSET_REQUEST_STEPS.LOCATION]: locationRef,
    [ASSET_REQUEST_STEPS.PHOTOS]: photosRef,
    [ASSET_REQUEST_STEPS.DOCUMENTS]: documentsRef,
    [ASSET_REQUEST_STEPS.BATCH_REVIEW]: reviewRef,
  }), []);
  const [form, setForm] = useState(cloneInitialForm);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [assetQueue, setAssetQueue] = useState([]);
  const [editingClientId, setEditingClientId] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAdditional, setUploadingAdditional] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [submittedCount, setSubmittedCount] = useState(0);
  const [ownershipUploadKey, setOwnershipUploadKey] = useState(0);

  const ownershipDocType = form.assetType ? getOwnershipDocType(form.assetType) : '';
  const ownershipDocLabelKey = ownershipDocType
    ? OWNERSHIP_DOC_LABEL_KEYS[ownershipDocType]
    : null;
  const canAddAnother = assetQueue.length < MAX_ASSETS_PER_BATCH;

  const resetCurrentForm = () => {
    setForm(cloneInitialForm());
    setPhotoPreviews((current) => {
      revokePhotoPreviews(current);
      return [];
    });
    setEditingClientId(null);
    setOwnershipUploadKey((current) => current + 1);
  };

  useEffect(() => {
    if (!open) {
      setForm(cloneInitialForm());
      setPhotoPreviews((current) => {
        revokePhotoPreviews(current);
        return [];
      });
      setAssetQueue([]);
      setEditingClientId(null);
      setErrors({});
      setSubmitError('');
      setSubmitting(false);
      setUploadingAdditional(false);
      setCompleted(false);
      setSubmittedCount(0);
      setOwnershipUploadKey((current) => current + 1);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !submitting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose, submitting]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      delete next.form;
      return next;
    });
    setSubmitError('');
  };

  const handleAssetTypeChange = (event) => {
    updateField('assetType', event.target.value);
  };

  const handlePhotoSelect = (event) => {
    const selected = Array.from(event.target.files || []);
    if (!selected.length) return;

    const nextFiles = [...form.photoFiles, ...selected];
    const nextPreviews = [
      ...photoPreviews,
      ...selected.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        url: URL.createObjectURL(file),
        name: file.name,
      })),
    ];

    setForm((current) => ({ ...current, photoFiles: nextFiles }));
    setPhotoPreviews(nextPreviews);
    setErrors((current) => {
      const next = { ...current };
      delete next.photos;
      return next;
    });
    event.target.value = '';
  };

  const removePhoto = (index) => {
    setForm((current) => ({
      ...current,
      photoFiles: current.photoFiles.filter((_, fileIndex) => fileIndex !== index),
    }));

    setPhotoPreviews((current) => {
      const removed = current[index];
      if (removed?.url) {
        URL.revokeObjectURL(removed.url);
      }
      return current.filter((_, previewIndex) => previewIndex !== index);
    });
  };

  const handleAdditionalFiles = async (event) => {
    const selected = Array.from(event.target.files || []).filter(
      (file) => file.type === 'application/pdf',
    );

    if (!selected.length) {
      setErrors((current) => ({
        ...current,
        additionalDocuments: t('assets.form.errors.pdfOnly'),
      }));
      event.target.value = '';
      return;
    }

    setUploadingAdditional(true);
    setErrors((current) => {
      const next = { ...current };
      delete next.additionalDocuments;
      return next;
    });

    try {
      const uploaded = await assetService.uploadFiles(selected, 'assets/documents');
      const docs = uploaded.map((entry, index) => ({
        name: selected[index]?.name || entry.fileName || entry.originalName || 'document',
        url: entry.fileUrl || entry.url || '',
        size: selected[index]?.size || entry.fileSize || 0,
      })).filter((doc) => doc.url);
      setForm((current) => ({
        ...current,
        additionalDocuments: [...current.additionalDocuments, ...docs],
      }));
    } catch (err) {
      setErrors((current) => ({
        ...current,
        additionalDocuments: err instanceof Error ? err.message : t('common.uploadFailed'),
      }));
    } finally {
      setUploadingAdditional(false);
      event.target.value = '';
    }
  };

  const removeAdditionalDocument = (index) => {
    setForm((current) => ({
      ...current,
      additionalDocuments: current.additionalDocuments.filter((_, docIndex) => docIndex !== index),
    }));
  };

  const scrollToSection = (stepKey) => {
    sectionRefs[stepKey]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToFirstErrorSection = (validationErrors) => {
    const firstErrorStep = ASSET_REQUEST_STEP_ORDER.find(
      (stepKey) => stepKey !== ASSET_REQUEST_STEPS.BATCH_REVIEW
        && Object.keys(validateAssetStep(stepKey, form, t)).some((key) => validationErrors[key]),
    );
    if (firstErrorStep) {
      scrollToSection(firstErrorStep);
    }
  };

  const commitCurrentToQueue = () => {
    const validationErrors = validateAssetForm(form, t);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      scrollToFirstErrorSection(validationErrors);
      return false;
    }

    if (!editingClientId && assetQueue.length >= MAX_ASSETS_PER_BATCH) {
      setSubmitError(t('assets.requestWizard.batchReview.limitReached', { max: MAX_ASSETS_PER_BATCH }));
      return false;
    }

    const entry = {
      clientId: editingClientId || createClientId(),
      form: cloneAssetFormDraft(form),
      photoPreviews: photoPreviews.map((preview) => ({ ...preview })),
    };

    setAssetQueue((current) => {
      if (editingClientId) {
        return [...current.filter((item) => item.clientId !== editingClientId), entry];
      }
      return [...current, entry];
    });

    resetCurrentForm();
    return true;
  };

  const removeFromQueue = (clientId) => {
    setAssetQueue((current) => {
      const removed = current.find((item) => item.clientId === clientId);
      if (removed) {
        revokePhotoPreviews(removed.photoPreviews);
      }
      return current.filter((item) => item.clientId !== clientId);
    });
    if (editingClientId === clientId) {
      resetCurrentForm();
    }
  };

  const editQueueItem = (clientId) => {
    const item = assetQueue.find((entry) => entry.clientId === clientId);
    if (!item) return;

    setAssetQueue((current) => current.filter((entry) => entry.clientId !== clientId));
    setForm(cloneAssetFormDraft(item.form));
    setPhotoPreviews((current) => {
      revokePhotoPreviews(current);
      return buildPhotoPreviewsFromFiles(item.form.photoFiles);
    });
    setEditingClientId(clientId);
    setOwnershipUploadKey((current) => current + 1);
    scrollToSection(ASSET_REQUEST_STEPS.DETAILS);
  };

  const handleAddAnother = () => {
    if (!canAddAnother) {
      setSubmitError(t('assets.requestWizard.batchReview.limitReached', { max: MAX_ASSETS_PER_BATCH }));
      return;
    }
    resetCurrentForm();
    scrollBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToQueue = () => {
    if (commitCurrentToQueue()) {
      scrollToSection(ASSET_REQUEST_STEPS.BATCH_REVIEW);
    }
  };

  const handleSubmit = async () => {
    if (!assetQueue.length) {
      setSubmitError(t('assets.requestWizard.errors.emptyQueue'));
      return;
    }

    for (const item of assetQueue) {
      const validationErrors = validateAssetForm(item.form, t);
      if (Object.keys(validationErrors).length > 0) {
        setSubmitError(t('assets.requestWizard.errors.fixBeforeSubmit'));
        editQueueItem(item.clientId);
        setErrors(validationErrors);
        return;
      }
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const payloads = [];

      for (const item of assetQueue) {
        const uploadedImages = await assetService.uploadFiles(item.form.photoFiles, 'assets/images');
        const imageUrls = uploadedImages.map((file) => file.fileUrl).filter(Boolean);

        if (!imageUrls.length) {
          throw new Error(t('assets.form.errors.photosRequired'));
        }

        payloads.push(buildAssetPayload(item.form, imageUrls));
      }

      if (payloads.length === 1) {
        await assetService.create(payloads[0]);
      } else {
        await assetService.createBatch(payloads);
      }

      setSubmittedCount(payloads.length);
      setCompleted(true);
      onSuccess?.();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('assets.form.submitFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const queueSummaries = useMemo(
    () => assetQueue.map((item, index) => ({
      clientId: item.clientId,
      index: index + 1,
      ...summarizeAssetDraft(item.form, t),
    })),
    [assetQueue, t],
  );

  if (!open) {
    return null;
  }

  const submitLabel = assetQueue.length <= 1
    ? t('assets.requestWizard.actions.submit')
    : t('assets.requestWizard.actions.submitAll', { count: assetQueue.length });

  return (
    <div className="kyc-modal-overlay" role="presentation" onClick={submitting ? undefined : onClose}>
      <div
        className="kyc-modal auction-create-modal request-auction-wizard request-auction-wizard--single-scroll"
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-auction-wizard-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="auction-create-modal__header">
          <div>
            <h2 id="request-auction-wizard-title" className="kyc-modal__title">
              {completed ? t('assets.requestWizard.success.title') : t('assets.requestWizard.title')}
            </h2>
            <p className="kyc-modal__body">
              {completed
                ? t('assets.requestWizard.success.subtitle')
                : t('assets.requestWizard.subtitle')}
            </p>
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

        {!completed && (
          <nav
            className="request-auction-wizard__section-nav"
            aria-label={t('assets.requestWizard.stepProgress')}
          >
            {ASSET_REQUEST_STEP_ORDER.map((stepKey, index) => (
              <button
                key={stepKey}
                type="button"
                className="request-auction-wizard__section-nav-item"
                onClick={() => scrollToSection(stepKey)}
                disabled={submitting}
              >
                <span className="request-auction-wizard__section-nav-index">{index + 1}</span>
                <span className="request-auction-wizard__section-nav-label">
                  {t(`assets.requestWizard.steps.${stepKey}`)}
                </span>
              </button>
            ))}
          </nav>
        )}

        <div ref={scrollBodyRef} className="auction-create-modal__body request-auction-wizard__scroll">
          {completed && (
            <div className="request-auction-wizard__success">
              <div className="request-auction-wizard__success-icon" aria-hidden="true">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="square"
                  />
                </svg>
              </div>
              <p className="request-auction-wizard__success-lead">
                {submittedCount > 1
                  ? t('assets.requestWizard.success.bodyMultiple', { count: submittedCount })
                  : t('assets.requestWizard.success.body')}
              </p>
              <ul className="request-auction-wizard__timeline">
                <li>{t('assets.requestWizard.success.stepReview')}</li>
                <li>{t('assets.requestWizard.success.stepEvaluation')}</li>
                <li>{t('assets.requestWizard.success.stepLaunch')}</li>
              </ul>
            </div>
          )}

          {!completed && (
            <div className="request-auction-wizard__sections">
              <section
                ref={detailsRef}
                id="wizard-section-details"
                className="request-auction-wizard__section"
                aria-labelledby="wizard-section-details-title"
              >
                <header className="request-auction-wizard__section-head">
                  <span className="request-auction-wizard__section-num" aria-hidden="true">1</span>
                  <div>
                    <h3 id="wizard-section-details-title" className="request-auction-wizard__section-title">
                      {t('assets.requestWizard.steps.details')}
                    </h3>
                    <p className="request-auction-wizard__section-desc">
                      {t('assets.requestWizard.sectionHints.details')}
                    </p>
                  </div>
                </header>
                <div className="auction-create-modal__grid">
                  {editingClientId && (
                    <p className="request-auction-wizard__editing-banner auction-create-modal__full">
                      {t('assets.requestWizard.batchReview.editing')}
                    </p>
                  )}

                  <Input
                    label={t('assets.form.fields.title')}
                    value={form.title}
                    onChange={(event) => updateField('title', event.target.value)}
                    error={errors.title}
                    disabled={submitting}
                  />

                  <div className="input-field">
                    <label className="input-field__label" htmlFor="request-asset-type">
                      {t('assets.form.fields.assetType')}
                    </label>
                    <select
                      id="request-asset-type"
                      className={[
                        'input-field__control',
                        'auction-create-modal__select',
                        errors.assetType ? 'input-field__control--error' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      value={form.assetType}
                      onChange={handleAssetTypeChange}
                      disabled={submitting}
                    >
                      <option value="">{t('assets.form.placeholders.selectAssetType')}</option>
                      {ASSET_TYPE_KEYS.map((key) => (
                        <option key={key} value={key}>
                          {t(`assets.types.${key}`)}
                        </option>
                      ))}
                    </select>
                    {errors.assetType && (
                      <span className="input-field__error" role="alert">
                        {errors.assetType}
                      </span>
                    )}
                  </div>

                  <div className="input-field auction-create-modal__full">
                    <label className="input-field__label" htmlFor="request-asset-description">
                      {t('assets.form.fields.description')}
                    </label>
                    <textarea
                      id="request-asset-description"
                      className={[
                        'kyc-modal__textarea',
                        'auction-create-modal__textarea',
                        errors.description ? 'auction-create-modal__textarea--error' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      rows={4}
                      value={form.description ?? ''}
                      onChange={(event) => updateField('description', event.target.value)}
                      disabled={submitting}
                      placeholder={t('assets.requestWizard.placeholders.description')}
                    />
                    {errors.description && (
                      <span className="input-field__error" role="alert">
                        {errors.description}
                      </span>
                    )}
                  </div>

                  <div className="input-field auction-create-modal__full">
                    <label className="input-field__label" htmlFor="request-asset-condition">
                      {t('assets.form.fields.conditionNotes')}
                    </label>
                    <textarea
                      id="request-asset-condition"
                      className={[
                        'kyc-modal__textarea',
                        'auction-create-modal__textarea',
                        errors.conditionNotes ? 'auction-create-modal__textarea--error' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      rows={3}
                      value={form.conditionNotes ?? ''}
                      onChange={(event) => updateField('conditionNotes', event.target.value)}
                      disabled={submitting}
                      placeholder={t('assets.requestWizard.placeholders.conditionNotes')}
                    />
                    {errors.conditionNotes && (
                      <span className="input-field__error" role="alert">
                        {errors.conditionNotes}
                      </span>
                    )}
                  </div>
                </div>
              </section>

              <section
                ref={locationRef}
                id="wizard-section-location"
                className="request-auction-wizard__section"
                aria-labelledby="wizard-section-location-title"
              >
                <header className="request-auction-wizard__section-head">
                  <span className="request-auction-wizard__section-num" aria-hidden="true">2</span>
                  <div>
                    <h3 id="wizard-section-location-title" className="request-auction-wizard__section-title">
                      {t('assets.requestWizard.steps.location')}
                    </h3>
                    <p className="request-auction-wizard__section-desc">
                      {t('assets.requestWizard.sectionHints.location')}
                    </p>
                  </div>
                </header>
                <div className="auction-create-modal__grid">
                  <Input
                    label={t('assets.form.fields.location')}
                    value={form.location}
                    onChange={(event) => updateField('location', event.target.value)}
                    error={errors.location}
                    disabled={submitting}
                    placeholder={t('assets.requestWizard.placeholders.location')}
                  />

                  <Input
                    label={t('assets.form.fields.desiredReservePrice')}
                    type="number"
                    min="1"
                    step="0.01"
                    value={form.desiredReservePrice ?? ''}
                    onChange={(event) => updateField('desiredReservePrice', event.target.value)}
                    error={errors.desiredReservePrice}
                    disabled={submitting}
                    placeholder={t('assets.requestWizard.placeholders.reservePrice')}
                  />

                  <div className="input-field auction-create-modal__full">
                    <label className="input-field__label" htmlFor="request-auction-conditions">
                      {t('assets.form.fields.auctionConditions')}
                    </label>
                    <textarea
                      id="request-auction-conditions"
                      className={[
                        'kyc-modal__textarea',
                        'auction-create-modal__textarea',
                        errors.auctionConditions ? 'auction-create-modal__textarea--error' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      rows={4}
                      value={form.auctionConditions ?? ''}
                      onChange={(event) => updateField('auctionConditions', event.target.value)}
                      disabled={submitting}
                      placeholder={t('assets.requestWizard.placeholders.auctionConditions')}
                    />
                    <p className="asset-submit-form__hint">
                      {t('assets.requestWizard.reserveHint')}
                    </p>
                    {errors.auctionConditions && (
                      <span className="input-field__error" role="alert">
                        {errors.auctionConditions}
                      </span>
                    )}
                  </div>
                </div>
              </section>

              <section
                ref={photosRef}
                id="wizard-section-photos"
                className="request-auction-wizard__section"
                aria-labelledby="wizard-section-photos-title"
              >
                <header className="request-auction-wizard__section-head">
                  <span className="request-auction-wizard__section-num" aria-hidden="true">3</span>
                  <div>
                    <h3 id="wizard-section-photos-title" className="request-auction-wizard__section-title">
                      {t('assets.requestWizard.steps.photos')}
                    </h3>
                    <p className="request-auction-wizard__section-desc">
                      {t('assets.form.hints.photos')}
                    </p>
                  </div>
                </header>
                <div className="auction-create-modal__media">
                  <button
                    type="button"
                    className="auction-create-modal__browse-btn"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={submitting}
                  >
                    {t('assets.requestWizard.actions.addPhotos')}
                  </button>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept={IMAGE_ACCEPT}
                    multiple
                    hidden
                    onChange={handlePhotoSelect}
                  />
                  {photoPreviews.length > 0 && (
                    <div className="auction-create-modal__image-grid">
                      {photoPreviews.map((preview, index) => (
                        <div key={preview.id} className="auction-create-modal__image-card">
                          <img src={preview.url} alt={preview.name} />
                          <button
                            type="button"
                            className="auction-create-modal__remove-btn"
                            onClick={() => removePhoto(index)}
                            disabled={submitting}
                            aria-label={t('assets.requestWizard.removePhoto', { name: preview.name })}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {errors.photos && (
                    <span className="input-field__error" role="alert">
                      {errors.photos}
                    </span>
                  )}
                </div>
              </section>

              <section
                ref={documentsRef}
                id="wizard-section-documents"
                className="request-auction-wizard__section"
                aria-labelledby="wizard-section-documents-title"
              >
                <header className="request-auction-wizard__section-head">
                  <span className="request-auction-wizard__section-num" aria-hidden="true">4</span>
                  <div>
                    <h3 id="wizard-section-documents-title" className="request-auction-wizard__section-title">
                      {t('assets.requestWizard.steps.documents')}
                    </h3>
                    <p className="request-auction-wizard__section-desc">
                      {ownershipDocLabelKey
                        ? t('assets.form.hints.ownershipDoc', {
                            document: t(`assets.ownershipDocs.${ownershipDocLabelKey}`),
                          })
                        : t('assets.requestWizard.sectionHints.documents')}
                    </p>
                  </div>
                </header>
                <div className="auction-create-modal__media">
                  <FileUpload
                    label={t('assets.form.fields.ownershipDocument')}
                    folder="assets/ownership"
                    accept={OWNERSHIP_ACCEPT}
                    disabled={submitting || !form.assetType}
                    resetKey={ownershipUploadKey}
                    onUpload={(result) => updateField(
                      'ownershipDocumentUrl',
                      result?.fileUrl || result?.url || '',
                    )}
                  />
                  {errors.ownershipDocumentUrl && (
                    <span className="input-field__error" role="alert">
                      {errors.ownershipDocumentUrl}
                    </span>
                  )}

                  <section className="auction-create-modal__upload-section">
                    <h4 className="auction-create-modal__section-title">
                      {t('assets.form.fields.additionalDocuments')}
                    </h4>
                    <p className="auction-create-modal__section-hint">
                      {t('assets.form.hints.additionalDocuments')}
                    </p>
                    <button
                      type="button"
                      className="auction-create-modal__browse-btn"
                      onClick={() => additionalInputRef.current?.click()}
                      disabled={submitting || uploadingAdditional}
                    >
                      {uploadingAdditional ? t('common.uploading') : t('common.selectFile')}
                    </button>
                    <input
                      ref={additionalInputRef}
                      type="file"
                      accept={PDF_ACCEPT}
                      multiple
                      hidden
                      onChange={handleAdditionalFiles}
                    />
                    {form.additionalDocuments.length > 0 && (
                      <ul className="auction-create-modal__doc-list">
                        {form.additionalDocuments.map((doc, index) => (
                          <li key={`${doc.url}-${index}`} className="auction-create-modal__doc-item">
                            <div>
                              <p className="auction-create-modal__doc-name">{doc.name}</p>
                            </div>
                            <button
                              type="button"
                              className="auction-create-modal__remove-btn"
                              onClick={() => removeAdditionalDocument(index)}
                              disabled={submitting}
                              aria-label={t('assets.requestWizard.removeDocument', { name: doc.name })}
                            >
                              ×
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    {errors.additionalDocuments && (
                      <span className="input-field__error" role="alert">
                        {errors.additionalDocuments}
                      </span>
                    )}
                  </section>

                  {assetQueue.length > 0 && (
                    <p className="request-auction-wizard__queue-hint">
                      {t('assets.requestWizard.batchReview.queuedCount', { count: assetQueue.length })}
                    </p>
                  )}
                </div>
              </section>

              <section
                ref={reviewRef}
                id="wizard-section-review"
                className="request-auction-wizard__section request-auction-wizard__section--review"
                aria-labelledby="wizard-section-review-title"
              >
                <header className="request-auction-wizard__section-head">
                  <span className="request-auction-wizard__section-num" aria-hidden="true">5</span>
                  <div>
                    <h3 id="wizard-section-review-title" className="request-auction-wizard__section-title">
                      {t('assets.requestWizard.steps.batchReview')}
                    </h3>
                    <p className="request-auction-wizard__section-desc">
                      {t('assets.requestWizard.batchReview.intro')}
                    </p>
                  </div>
                </header>
                <div className="request-auction-wizard__batch-review">
                  {queueSummaries.length === 0 ? (
                    <div className="request-auction-wizard__batch-empty-card" role="status">
                      <p className="request-auction-wizard__batch-empty">
                        {t('assets.requestWizard.batchReview.empty')}
                      </p>
                      <p className="request-auction-wizard__batch-empty-hint">
                        {t('assets.requestWizard.sectionHints.review')}
                      </p>
                    </div>
                  ) : (
                    <ul className="request-auction-wizard__batch-list">
                      {queueSummaries.map((item) => (
                        <li key={item.clientId} className="request-auction-wizard__batch-item">
                          <div className="request-auction-wizard__batch-item-main">
                            <p className="request-auction-wizard__batch-item-title">
                              {t('assets.requestWizard.batchReview.assetLabel', { index: item.index })}
                              {' — '}
                              {item.title}
                            </p>
                            <p className="request-auction-wizard__batch-item-meta">
                              {item.assetTypeLabel}
                              {' · '}
                              {item.location}
                              {' · '}
                              {item.reserve}
                            </p>
                            <p className="request-auction-wizard__batch-item-meta">
                              {t('assets.requestWizard.review.photoCount', { count: item.photoCount })}
                              {' · '}
                              {t('assets.requestWizard.review.documentCount', { count: item.documentCount })}
                            </p>
                          </div>
                          <div className="request-auction-wizard__batch-item-actions">
                            <button
                              type="button"
                              className="auction-create-modal__edit-link"
                              onClick={() => editQueueItem(item.clientId)}
                              disabled={submitting}
                            >
                              {t('assets.requestWizard.actions.edit')}
                            </button>
                            <button
                              type="button"
                              className="auction-create-modal__edit-link request-auction-wizard__remove-link"
                              onClick={() => removeFromQueue(item.clientId)}
                              disabled={submitting}
                            >
                              {t('assets.requestWizard.actions.removeFromQueue')}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            </div>
          )}

          {submitError && (
            <p className="kyc-modal__error auction-create-modal__submit-error" role="alert">
              {submitError}
            </p>
          )}
        </div>

        <div className="kyc-modal__actions auction-create-modal__actions">
          {completed ? (
            <div className="auction-create-modal__actions-right">
              <Button variant="secondary" onClick={onClose}>
                {t('assets.requestWizard.success.close')}
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  onClose();
                  navigate(ROUTES.APP_MY_ASSETS);
                }}
              >
                {t('assets.requestWizard.success.viewRequests')}
              </Button>
            </div>
          ) : (
            <>
              <div className="auction-create-modal__actions-right">
                <Button variant="secondary" onClick={onClose} disabled={submitting}>
                  {t('assets.requestWizard.actions.cancel')}
                </Button>

                {canAddAnother && assetQueue.length > 0 && (
                  <Button variant="secondary" onClick={handleAddAnother} disabled={submitting}>
                    {t('assets.requestWizard.actions.addAnother')}
                  </Button>
                )}

                <Button
                  variant="secondary"
                  onClick={handleAddToQueue}
                  disabled={submitting || uploadingAdditional}
                >
                  {editingClientId
                    ? t('assets.requestWizard.actions.updateQueue')
                    : t('assets.requestWizard.actions.addToQueue')}
                </Button>

                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={submitting || assetQueue.length === 0}
                >
                  {submitting ? t('assets.requestWizard.actions.submitting') : submitLabel}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default RequestAuctionWizardModal;
