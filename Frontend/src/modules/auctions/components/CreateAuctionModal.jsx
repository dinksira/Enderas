import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/Button.jsx';
import { Input } from '../../../components/Input.jsx';
import { auctionService } from '../services/auction-service.js';
import {
  AUCTION_CATEGORY_KEYS,
  AUCTION_MODES,
  AUCTION_STEP_ORDER,
  AUCTION_STEPS,
  buildAuctionPayload,
  buildFormPrefillFromAsset,
  buildSelectedLotFromAsset,
  computeLotsTotalReserve,
  EMPTY_AUCTION_FORM,
  formatFileSize,
  MAX_LOTS_PER_AUCTION,
  validateAuctionStep,
} from '../utils/auction-form-utils.js';

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/gif,image/webp';
const PDF_ACCEPT = 'application/pdf';

function cloneInitialForm() {
  return {
    ...EMPTY_AUCTION_FORM,
    images: [],
    documents: [],
    prefilledImageUrls: [],
    prefilledDocuments: [],
  };
}

/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   onSuccess: (auction?: { id?: string }) => void,
 *   initialAssetId?: string|null,
 * }} props
 */
export function CreateAuctionModal({ open, onClose, onSuccess, initialAssetId = null }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(AUCTION_STEPS.ASSET);
  const [form, setForm] = useState(cloneInitialForm);
  const [auctionMode, setAuctionMode] = useState(AUCTION_MODES.SINGLE);
  const [selectedLots, setSelectedLots] = useState([]);
  const [eligibleAssets, setEligibleAssets] = useState([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [assetsError, setAssetsError] = useState('');
  const [assetSearch, setAssetSearch] = useState('');
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [initialAssetApplied, setInitialAssetApplied] = useState(false);

  const imageInputRef = useRef(null);
  const documentInputRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setStep(AUCTION_STEPS.ASSET);
      setForm(cloneInitialForm());
      setAuctionMode(AUCTION_MODES.SINGLE);
      setSelectedLots([]);
      setEligibleAssets([]);
      setAssetsLoading(false);
      setAssetsError('');
      setAssetSearch('');
      setErrors({});
      setSubmitError('');
      setSubmitting(false);
      setInitialAssetApplied(false);
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
    if (!open) {
      return undefined;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setAssetsLoading(true);
      setAssetsError('');

      auctionService
        .getEligibleAssets({
          search: assetSearch.trim() || undefined,
          assetId: !assetSearch.trim() && initialAssetId ? initialAssetId : undefined,
        })
        .then((items) => {
          if (!cancelled) {
            setEligibleAssets(items);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setEligibleAssets([]);
            setAssetsError(t('auctions.create.assetStep.loadFailed'));
          }
        })
        .finally(() => {
          if (!cancelled) {
            setAssetsLoading(false);
          }
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, assetSearch, initialAssetId, t]);

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
  const isMultiMode = auctionMode === AUCTION_MODES.MULTI;
  const categoryLocked = !isMultiMode && selectedLots.length === 1;
  const lotsTotalReserve = computeLotsTotalReserve(selectedLots);
  const validationOptions = { auctionMode, selectedLots };

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

  const applyAssetPrefill = (asset) => {
    const prefill = buildFormPrefillFromAsset(asset, t);
    setForm((current) => ({
      ...current,
      title: prefill.title || current.title,
      category: prefill.category || current.category,
      description: prefill.description || current.description,
      auctionConditions: prefill.auctionConditions || current.auctionConditions,
      reservePrice: prefill.reservePrice || current.reservePrice,
      prefilledImageUrls: prefill.prefilledImageUrls.length
        ? prefill.prefilledImageUrls
        : current.prefilledImageUrls,
      prefilledDocuments: prefill.prefilledDocuments.length
        ? prefill.prefilledDocuments
        : current.prefilledDocuments,
    }));
    clearFieldError('title');
    clearFieldError('category');
    clearFieldError('auctionConditions');
    clearFieldError('reservePrice');
    clearFieldError('documents');
  };

  const clearAssetSelections = () => {
    setSelectedLots([]);
    setForm((current) => ({
      ...cloneInitialForm(),
      startDate: current.startDate,
      endDate: current.endDate,
      documentFee: current.documentFee,
      cpoPercentage: current.cpoPercentage,
    }));
  };

  const toggleAssetSelection = (asset) => {
    if (isMultiMode) {
      setSelectedLots((current) => {
        const exists = current.some((lot) => lot.assetId === asset.id);
        if (exists) {
          return current.filter((lot) => lot.assetId !== asset.id);
        }
        if (current.length >= MAX_LOTS_PER_AUCTION) {
          setSubmitError(t('auctions.create.errors.lotLimitReached', { max: MAX_LOTS_PER_AUCTION }));
          return current;
        }
        const nextLots = [...current, buildSelectedLotFromAsset(asset, current.length)];
        if (current.length === 0) {
          applyAssetPrefill(asset);
        }
        return nextLots;
      });
      setSubmitError('');
      return;
    }

    const isSelected = selectedLots.some((lot) => lot.assetId === asset.id);
    if (isSelected) {
      clearAssetSelections();
      return;
    }

    const nextLot = buildSelectedLotFromAsset(asset, 0);
    setSelectedLots([nextLot]);
    applyAssetPrefill(asset);
  };

  const updateLotField = (assetId, field, value) => {
    setSelectedLots((current) => current.map((lot) => (
      lot.assetId === assetId ? { ...lot, [field]: value } : lot
    )));
    if (field === 'reservePrice') {
      clearFieldError(`lotReserve_${assetId}`);
    }
  };

  const handleAuctionModeChange = (nextMode) => {
    if (nextMode === auctionMode) {
      return;
    }
    setAuctionMode(nextMode);
    clearAssetSelections();
    setErrors({});
    setSubmitError('');
  };

  useEffect(() => {
    if (!open || !initialAssetId || assetsLoading || initialAssetApplied) {
      return;
    }

    const asset = eligibleAssets.find((item) => item.id === initialAssetId);
    if (!asset) {
      return;
    }

    const nextLot = buildSelectedLotFromAsset(asset, 0);
    setSelectedLots([nextLot]);
    applyAssetPrefill(asset);
    setStep(AUCTION_STEPS.BASIC);
    setInitialAssetApplied(true);
  }, [open, initialAssetId, eligibleAssets, assetsLoading, initialAssetApplied, t]);

  const goToStep = (targetStep) => {
    setStep(targetStep);
    setErrors({});
    setSubmitError('');
  };

  const handleNext = () => {
    const stepErrors = validateAuctionStep(step, form, t, validationOptions);
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

  const removePrefilledImage = (index) => {
    setForm((current) => ({
      ...current,
      prefilledImageUrls: current.prefilledImageUrls.filter((_, i) => i !== index),
    }));
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

  const removePrefilledDocument = (id) => {
    setForm((current) => ({
      ...current,
      prefilledDocuments: current.prefilledDocuments.filter((doc) => doc.id !== id),
    }));
  };

  const handleSubmit = async () => {
    const reviewErrors = {
      ...validateAuctionStep(AUCTION_STEPS.ASSET, form, t, validationOptions),
      ...validateAuctionStep(AUCTION_STEPS.BASIC, form, t, validationOptions),
      ...validateAuctionStep(AUCTION_STEPS.SCHEDULE, form, t, validationOptions),
      ...validateAuctionStep(AUCTION_STEPS.MEDIA, form, t, validationOptions),
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

      const payload = buildAuctionPayload(form, { auctionMode, selectedLots });
      payload.imageUrls = [
        ...form.prefilledImageUrls,
        ...uploadedImages.map((file) => file.fileUrl).filter(Boolean),
      ];
      payload.documents = [
        ...form.prefilledDocuments.map((doc) => ({
          name: doc.name,
          url: doc.url,
          size: doc.size || 0,
        })),
        ...uploadedDocuments.map((file, index) => ({
          name: form.documents[index]?.name || file.originalName || file.fileName,
          url: file.fileUrl,
          size: file.fileSize || form.documents[index]?.size || 0,
        })),
      ];

      const auction = await auctionService.create(payload);
      onSuccess(auction);
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('auctions.create.errors.submitFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const totalImageCount = form.images.length + form.prefilledImageUrls.length;
  const totalDocumentCount = form.documents.length + form.prefilledDocuments.length;

  const reviewRows = useMemo(
    () => {
      const linkedAssetValue = isMultiMode
        ? t('auctions.create.review.multiAssetCount', { count: selectedLots.length })
        : selectedLots[0]?.asset?.title ?? t('auctions.create.review.noAsset');

      const rows = [
        {
          label: t('auctions.create.fields.auctionMode'),
          value: isMultiMode
            ? t('auctions.create.assetStep.modeMulti')
            : t('auctions.create.assetStep.modeSingle'),
          step: AUCTION_STEPS.ASSET,
        },
        {
          label: t('auctions.create.fields.linkedAsset'),
          value: linkedAssetValue,
          step: AUCTION_STEPS.ASSET,
        },
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
          label: isMultiMode
            ? t('auctions.create.fields.totalReservePrice')
            : t('auctions.create.fields.reservePrice'),
          value: isMultiMode
            ? `${lotsTotalReserve.toLocaleString()} ETB`
            : (form.reservePrice ? `${form.reservePrice} ETB` : '—'),
          step: isMultiMode ? AUCTION_STEPS.ASSET : AUCTION_STEPS.SCHEDULE,
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
          value: t('auctions.create.review.imageCount', { count: totalImageCount }),
          step: AUCTION_STEPS.MEDIA,
        },
        {
          label: t('auctions.create.fields.documents'),
          value: t('auctions.create.review.documentCount', { count: totalDocumentCount }),
          step: AUCTION_STEPS.MEDIA,
        },
      ];

      return rows;
    },
    [form, isMultiMode, lotsTotalReserve, selectedLots, t, totalDocumentCount, totalImageCount],
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
          {step === AUCTION_STEPS.ASSET && (
            <div className="auction-create-modal__asset-step">
              <fieldset className="auction-create-modal__mode-toggle">
                <legend className="input-field__label">
                  {t('auctions.create.fields.auctionMode')}
                </legend>
                <label className="auction-create-modal__mode-option">
                  <input
                    type="radio"
                    name="auction-mode"
                    value={AUCTION_MODES.SINGLE}
                    checked={!isMultiMode}
                    onChange={() => handleAuctionModeChange(AUCTION_MODES.SINGLE)}
                    disabled={submitting}
                  />
                  <span>{t('auctions.create.assetStep.modeSingle')}</span>
                </label>
                <label className="auction-create-modal__mode-option">
                  <input
                    type="radio"
                    name="auction-mode"
                    value={AUCTION_MODES.MULTI}
                    checked={isMultiMode}
                    onChange={() => handleAuctionModeChange(AUCTION_MODES.MULTI)}
                    disabled={submitting}
                  />
                  <span>{t('auctions.create.assetStep.modeMulti')}</span>
                </label>
              </fieldset>

              <p className="auction-create-modal__section-hint">
                {isMultiMode
                  ? t('auctions.create.assetStep.multiHint')
                  : t('auctions.create.assetStep.hint')}
              </p>

              <label className="input-field__label" htmlFor="auction-asset-search">
                {t('auctions.create.assetStep.search')}
              </label>
              <input
                id="auction-asset-search"
                type="search"
                className="input-field__control"
                value={assetSearch}
                onChange={(event) => setAssetSearch(event.target.value)}
                placeholder={t('auctions.create.assetStep.searchPlaceholder')}
                disabled={submitting}
              />

              {assetsError && (
                <p className="kyc-modal__error" role="alert">
                  {assetsError}
                </p>
              )}

              {errors.assets && (
                <p className="kyc-modal__error" role="alert">
                  {errors.assets}
                </p>
              )}

              {assetsLoading ? (
                <p className="auction-create-modal__section-hint">
                  {t('auctions.create.assetStep.loading')}
                </p>
              ) : (
                <ul className="auction-create-modal__asset-list" role="listbox" aria-label={t('auctions.create.assetStep.search')}>
                  {eligibleAssets.length === 0 ? (
                    <li className="auction-create-modal__asset-empty">
                      {t('auctions.create.assetStep.empty')}
                    </li>
                  ) : (
                    eligibleAssets.map((asset) => {
                      const isSelected = selectedLots.some((lot) => lot.assetId === asset.id);
                      const valuation = asset.evaluation?.valuationAmount;
                      return (
                        <li key={asset.id}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            className={[
                              'auction-create-modal__asset-item',
                              isSelected ? 'auction-create-modal__asset-item--selected' : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            onClick={() => toggleAssetSelection(asset)}
                            disabled={submitting}
                          >
                            <span className="auction-create-modal__asset-title">{asset.title}</span>
                            <span className="auction-create-modal__asset-meta">
                              {t(`assets.types.${asset.assetType}`, { defaultValue: asset.assetType })}
                              {asset.location ? ` · ${asset.location}` : ''}
                            </span>
                            {valuation != null && (
                              <span className="auction-create-modal__asset-valuation">
                                {t('auctions.create.assetStep.valuation', {
                                  amount: Number(valuation).toLocaleString(),
                                })}
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })
                  )}
                </ul>
              )}

              {selectedLots.length > 0 && (
                <section className="auction-create-modal__selected-lots">
                  <h3 className="auction-create-modal__section-title">
                    {t('auctions.create.assetStep.selectedAssets', { count: selectedLots.length })}
                  </h3>

                  <ul className="auction-create-modal__lot-list">
                    {selectedLots.map((lot, index) => (
                      <li key={lot.assetId} className="auction-create-modal__lot-item">
                        <div className="auction-create-modal__lot-item-header">
                          <p className="auction-create-modal__lot-title">
                            {lot.asset?.title ?? t('auctions.create.assetStep.unnamedAsset')}
                          </p>
                          <button
                            type="button"
                            className="auction-create-modal__edit-link"
                            onClick={() => toggleAssetSelection(lot.asset)}
                            disabled={submitting}
                          >
                            {t('auctions.create.assetStep.removeAsset')}
                          </button>
                        </div>

                        <div className="auction-create-modal__lot-fields">
                          <Input
                            label={t('auctions.create.fields.lotLabel')}
                            value={lot.lotLabel}
                            onChange={(event) => updateLotField(lot.assetId, 'lotLabel', event.target.value)}
                            disabled={submitting}
                          />
                          <Input
                            label={t('auctions.create.fields.lotReservePrice')}
                            type="number"
                            min="1"
                            step="0.01"
                            value={lot.reservePrice}
                            onChange={(event) => updateLotField(lot.assetId, 'reservePrice', event.target.value)}
                            error={errors[`lotReserve_${lot.assetId}`]}
                            disabled={submitting}
                          />
                        </div>

                        <p className="auction-create-modal__lot-meta">
                          {t('auctions.create.assetStep.lotPosition', { index: index + 1 })}
                        </p>
                      </li>
                    ))}
                  </ul>

                  {isMultiMode && (
                    <p className="auction-create-modal__section-hint">
                      {t('auctions.create.assetStep.totalReserve', {
                        amount: lotsTotalReserve.toLocaleString(),
                      })}
                    </p>
                  )}
                </section>
              )}

              {selectedLots.length > 0 && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={clearAssetSelections}
                  disabled={submitting}
                >
                  {t('auctions.create.assetStep.clearSelection')}
                </Button>
              )}
            </div>
          )}

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
                  disabled={submitting || categoryLocked}
                  aria-invalid={errors.category ? 'true' : undefined}
                >
                  <option value="">{t('auctions.create.placeholders.selectCategory')}</option>
                  {AUCTION_CATEGORY_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {t(`category.${key}`)}
                    </option>
                  ))}
                </select>
                {categoryLocked && (
                  <span className="kyc-modal__hint">{t('auctions.create.assetStep.categoryLockedHint')}</span>
                )}
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
              {!isMultiMode ? (
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
              ) : (
                <div className="input-field">
                  <label className="input-field__label">
                    {t('auctions.create.fields.totalReservePrice')}
                  </label>
                  <p className="auction-create-modal__computed-value">
                    {lotsTotalReserve > 0
                      ? `${lotsTotalReserve.toLocaleString()} ETB`
                      : '—'}
                  </p>
                  <span className="kyc-modal__hint">
                    {t('auctions.create.assetStep.totalReserveHint')}
                  </span>
                  {errors.reservePrice && (
                    <span className="input-field__error" role="alert">
                      {errors.reservePrice}
                    </span>
                  )}
                </div>
              )}
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

                {(form.prefilledImageUrls.length > 0 || imagePreviews.length > 0) && (
                  <div className="auction-create-modal__image-grid">
                    {form.prefilledImageUrls.map((url, index) => (
                      <div key={`prefill-${url}-${index}`} className="auction-create-modal__image-card">
                        <img src={url} alt="" />
                        <button
                          type="button"
                          className="auction-create-modal__remove-btn"
                          onClick={() => removePrefilledImage(index)}
                          disabled={submitting}
                          aria-label={t('auctions.create.removeImage', { name: `image-${index + 1}` })}
                        >
                          ×
                        </button>
                      </div>
                    ))}
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

                {(form.prefilledDocuments.length > 0 || form.documents.length > 0) && (
                  <ul className="auction-create-modal__doc-list">
                    {form.prefilledDocuments.map((doc) => (
                      <li key={doc.id} className="auction-create-modal__doc-item">
                        <div>
                          <p className="auction-create-modal__doc-name">{doc.name}</p>
                          {doc.size > 0 && (
                            <p className="auction-create-modal__doc-size">
                              {formatFileSize(doc.size)}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          className="auction-create-modal__remove-btn"
                          onClick={() => removePrefilledDocument(doc.id)}
                          disabled={submitting}
                          aria-label={t('auctions.create.removeDocument', { name: doc.name })}
                        >
                          ×
                        </button>
                      </li>
                    ))}
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
              {isMultiMode && selectedLots.length > 0 && (
                <section className="auction-create-modal__review-lots">
                  <h3 className="auction-create-modal__section-title">
                    {t('auctions.create.review.lotsTitle')}
                  </h3>
                  <ul className="auction-create-modal__lot-list">
                    {selectedLots.map((lot, index) => (
                      <li key={lot.assetId} className="auction-create-modal__lot-item">
                        <p className="auction-create-modal__lot-title">
                          {lot.lotLabel || t('auctions.create.assetStep.lotPosition', { index: index + 1 })}
                          {' — '}
                          {lot.asset?.title}
                        </p>
                        <p className="auction-create-modal__lot-meta">
                          {Number(lot.reservePrice || 0).toLocaleString()} ETB
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

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
