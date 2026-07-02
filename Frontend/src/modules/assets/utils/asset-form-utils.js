export const ASSET_TYPE_KEYS = Object.freeze([
  'vehicle',
  'machinery',
  'building',
  'land',
  'equipment',
  'salvage',
  'other',
]);

export const ASSET_TYPE_OWNERSHIP_DOC = Object.freeze({
  vehicle: 'vehicle_registration_book',
  land: 'title_deed',
  building: 'ownership_certificate',
  machinery: 'purchase_documents',
  equipment: 'purchase_documents',
  salvage: 'other',
  other: 'other',
});

export const OWNERSHIP_DOC_LABEL_KEYS = Object.freeze({
  vehicle_registration_book: 'vehicleRegistrationBook',
  title_deed: 'titleDeed',
  ownership_certificate: 'ownershipCertificate',
  purchase_documents: 'purchaseDocuments',
  other: 'other',
});

const FILTER_STATUS_MAP = Object.freeze({
  all: undefined,
  pending_review: 'PENDING_REVIEW',
  approved: 'APPROVED',
  rejected: 'REJECTED',
  under_evaluation: 'UNDER_EVALUATION',
  evaluated: 'EVALUATED',
  in_auction: 'IN_AUCTION',
});

export function resolveApiStatus(filterKey) {
  return FILTER_STATUS_MAP[filterKey];
}

export function statusPillClass(status) {
  const key = String(status || 'PENDING_REVIEW').toUpperCase();
  const map = {
    PENDING_REVIEW: 'asset-status-pill--pending',
    APPROVED: 'asset-status-pill--pending',
    UNDER_EVALUATION: 'asset-status-pill--evaluating',
    EVALUATED: 'asset-status-pill--approved',
    IN_AUCTION: 'asset-status-pill--approved',
    REJECTED: 'asset-status-pill--rejected',
    SOLD: 'asset-status-pill--approved',
  };
  return map[key] || 'asset-status-pill--pending';
}

export function normalizeAssetStatus(status) {
  return String(status || 'PENDING_REVIEW').toUpperCase();
}

export function getOwnershipDocType(assetType) {
  return ASSET_TYPE_OWNERSHIP_DOC[assetType] || 'other';
}

export function hasOwnershipDocument(form) {
  return Boolean(
    String(form?.ownershipDocumentUrl || '').trim()
    || form?.ownershipDocumentFile,
  );
}

/** Parse API JSON array fields that may arrive as strings from MySQL. */
export function toArray(val) {
  if (Array.isArray(val)) {
    return val;
  }

  if (typeof val === 'string' && val.trim()) {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

export function normalizeAssetDetail(asset) {
  if (!asset || typeof asset !== 'object') {
    return asset;
  }

  return {
    ...asset,
    imageUrls: toArray(asset.imageUrls ?? asset.image_urls),
    additionalDocuments: toArray(asset.additionalDocuments ?? asset.additional_document_urls),
  };
}

export function formatReserveAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    return '—';
  }
  return `${new Intl.NumberFormat('en-ET').format(amount)} ETB`;
}

const EMPTY_FORM = Object.freeze({
  title: '',
  assetType: '',
  description: '',
  conditionNotes: '',
  location: '',
  address: '',
  desiredReservePrice: '',
  auctionConditions: '',
  photoFiles: [],
  ownershipDocumentUrl: '',
  ownershipDocumentFile: null,
  additionalDocuments: [],
});

export function buildEmptyAssetForm() {
  return {
    ...EMPTY_FORM,
    photoFiles: [],
    ownershipDocumentFile: null,
    additionalDocuments: [],
  };
}

export const ASSET_REQUEST_STEPS = Object.freeze({
  DETAILS: 'details',
  LOCATION: 'location',
  PHOTOS: 'photos',
  DOCUMENTS: 'documents',
  BATCH_REVIEW: 'batchReview',
});

export const ASSET_REQUEST_STEP_ORDER = Object.freeze([
  ASSET_REQUEST_STEPS.DETAILS,
  ASSET_REQUEST_STEPS.LOCATION,
  ASSET_REQUEST_STEPS.PHOTOS,
  ASSET_REQUEST_STEPS.DOCUMENTS,
  ASSET_REQUEST_STEPS.BATCH_REVIEW,
]);

export const MAX_ASSETS_PER_BATCH = 25;

export function cloneAssetFormDraft(form) {
  return {
    ...form,
    photoFiles: [...(form.photoFiles || [])],
    additionalDocuments: [...(form.additionalDocuments || [])],
  };
}

/**
 * @param {object} form
 * @param {(key: string, options?: object) => string} t
 */
export function summarizeAssetDraft(form, t) {
  return {
    title: form.title?.trim() || '—',
    assetTypeLabel: form.assetType ? t(`assets.types.${form.assetType}`) : '—',
    location: form.location?.trim() || '—',
    reserve: formatReserveAmount(form.desiredReservePrice),
    photoCount: form.photoFiles?.length ?? 0,
    documentCount: (form.additionalDocuments?.length ?? 0) + (hasOwnershipDocument(form) ? 1 : 0),
  };
}

/**
 * @param {string} step
 * @param {object} form
 * @param {(key: string) => string} t
 */
export function validateAssetStep(step, form, t) {
  const errors = {};

  if (step === ASSET_REQUEST_STEPS.DETAILS) {
    if (!form.title?.trim()) {
      errors.title = t('assets.form.errors.titleRequired');
    }
    if (!form.assetType) {
      errors.assetType = t('assets.form.errors.assetTypeRequired');
    }
    if (!form.description?.trim()) {
      errors.description = t('assets.form.errors.descriptionRequired');
    }
    if (!form.conditionNotes?.trim()) {
      errors.conditionNotes = t('assets.form.errors.conditionNotesRequired');
    }
  }

  if (step === ASSET_REQUEST_STEPS.LOCATION) {
    if (!form.location?.trim()) {
      errors.location = t('assets.form.errors.locationRequired');
    }
    const reserve = Number(form.desiredReservePrice);
    if (!form.desiredReservePrice?.toString().trim() || !Number.isFinite(reserve) || reserve <= 0) {
      errors.desiredReservePrice = t('assets.form.errors.reservePriceRequired');
    }
    if (!form.auctionConditions?.trim()) {
      errors.auctionConditions = t('assets.form.errors.auctionConditionsRequired');
    }
  }

  if (step === ASSET_REQUEST_STEPS.PHOTOS) {
    if (!form.photoFiles?.length) {
      errors.photos = t('assets.form.errors.photosRequired');
    }
  }

  if (step === ASSET_REQUEST_STEPS.DOCUMENTS) {
    if (!hasOwnershipDocument(form)) {
      errors.ownershipDocumentUrl = t('assets.form.errors.ownershipDocRequired');
    }
  }

  return errors;
}

/**
 * @param {object} form
 * @param {(key: string) => string} t
 */
export function validateAssetForm(form, t) {
  return ASSET_REQUEST_STEP_ORDER.reduce((errors, stepKey) => {
    if (stepKey === ASSET_REQUEST_STEPS.BATCH_REVIEW) {
      return errors;
    }
    return { ...errors, ...validateAssetStep(stepKey, form, t) };
  }, {});
}

/**
 * @param {object} form
 * @param {string[]} imageUrls
 */
export function buildAssetPayload(form, imageUrls = []) {
  const assetType = form.assetType;
  return {
    title: form.title.trim(),
    assetType,
    description: form.description.trim(),
    conditionNotes: form.conditionNotes.trim(),
    location: form.location.trim(),
    imageUrls,
    desiredReservePrice: Number(form.desiredReservePrice),
    auctionConditions: form.auctionConditions.trim(),
    ownershipDocumentType: getOwnershipDocType(assetType),
    ownershipDocumentUrl: form.ownershipDocumentUrl,
    additionalDocuments: form.additionalDocuments || [],
  };
}

export default {
  ASSET_TYPE_KEYS,
  ASSET_REQUEST_STEPS,
  ASSET_REQUEST_STEP_ORDER,
  MAX_ASSETS_PER_BATCH,
  buildAssetPayload,
  buildEmptyAssetForm,
  cloneAssetFormDraft,
  formatReserveAmount,
  getOwnershipDocType,
  normalizeAssetDetail,
  normalizeAssetStatus,
  resolveApiStatus,
  statusPillClass,
  summarizeAssetDraft,
  toArray,
  validateAssetForm,
  validateAssetStep,
  hasOwnershipDocument,
};
