import type { AssetCreatePayload, AssetDisplayStatus, AssetType } from '@/types/asset';
import { formatEtbAmount } from '@/lib/auctionUtils';
import type { PickedFile } from '@/services/fileUploadApi';

export const ASSET_TYPE_KEYS: AssetType[] = [
  'vehicle',
  'machinery',
  'building',
  'land',
  'equipment',
  'salvage',
  'other',
];

export const ASSET_TYPE_OWNERSHIP_DOC: Record<AssetType, string> = {
  vehicle: 'vehicle_registration_book',
  land: 'title_deed',
  building: 'ownership_certificate',
  machinery: 'purchase_documents',
  equipment: 'purchase_documents',
  salvage: 'other',
  other: 'other',
};

export const OWNERSHIP_DOC_LABEL_KEYS: Record<string, string> = {
  vehicle_registration_book: 'vehicleRegistrationBook',
  title_deed: 'titleDeed',
  ownership_certificate: 'ownershipCertificate',
  purchase_documents: 'purchaseDocuments',
  other: 'other',
};

export const ASSET_REQUEST_STEPS = {
  DETAILS: 'details',
  LOCATION: 'location',
  PHOTOS: 'photos',
  DOCUMENTS: 'documents',
  BATCH_REVIEW: 'batchReview',
} as const;

export type AssetRequestStep = (typeof ASSET_REQUEST_STEPS)[keyof typeof ASSET_REQUEST_STEPS];

export const ASSET_REQUEST_STEP_ORDER: AssetRequestStep[] = [
  ASSET_REQUEST_STEPS.DETAILS,
  ASSET_REQUEST_STEPS.LOCATION,
  ASSET_REQUEST_STEPS.PHOTOS,
  ASSET_REQUEST_STEPS.DOCUMENTS,
  ASSET_REQUEST_STEPS.BATCH_REVIEW,
];

export const MAX_ASSETS_PER_BATCH = 25;

export interface AssetFormState {
  title: string;
  assetType: AssetType | '';
  description: string;
  conditionNotes: string;
  location: string;
  address: string;
  desiredReservePrice: string;
  auctionConditions: string;
  photoFiles: PickedFile[];
  ownershipDocumentUrl: string;
  additionalDocuments: { name: string; url: string; size: number }[];
}

export interface QueuedAssetDraft {
  clientId: string;
  form: AssetFormState;
}

export function buildEmptyAssetForm(): AssetFormState {
  return {
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
    additionalDocuments: [],
  };
}

export function cloneAssetFormDraft(form: AssetFormState): AssetFormState {
  return {
    ...form,
    photoFiles: [...form.photoFiles],
    additionalDocuments: [...form.additionalDocuments],
  };
}

export function getOwnershipDocType(assetType: AssetType | ''): string {
  if (!assetType) return 'other';
  return ASSET_TYPE_OWNERSHIP_DOC[assetType] || 'other';
}

export function assetStatusTone(
  status: AssetDisplayStatus,
): 'live' | 'ending' | 'won' | 'lost' | 'pending' {
  switch (status) {
    case 'IN_AUCTION':
    case 'EVALUATED':
      return 'live';
    case 'APPROVED':
    case 'UNDER_EVALUATION':
      return 'pending';
    case 'REJECTED':
      return 'lost';
    default:
      return 'pending';
  }
}

export function summarizeAssetDraft(form: AssetFormState, t: (key: string) => string) {
  return {
    title: form.title.trim() || '—',
    assetTypeLabel: form.assetType ? t(`dashboard.categories.${form.assetType}`) : '—',
    location: form.location.trim() || '—',
    reserve: formatEtbAmount(Number(form.desiredReservePrice)),
    photoCount: form.photoFiles.length,
    documentCount: form.additionalDocuments.length + (form.ownershipDocumentUrl ? 1 : 0),
  };
}

export function validateAssetStep(
  step: AssetRequestStep,
  form: AssetFormState,
  t: (key: string) => string,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (step === ASSET_REQUEST_STEPS.DETAILS) {
    if (!form.title.trim()) errors.title = t('assets.form.errors.titleRequired');
    if (!form.assetType) errors.assetType = t('assets.form.errors.assetTypeRequired');
    if (!form.description.trim()) errors.description = t('assets.form.errors.descriptionRequired');
    if (!form.conditionNotes.trim()) {
      errors.conditionNotes = t('assets.form.errors.conditionNotesRequired');
    }
  }

  if (step === ASSET_REQUEST_STEPS.LOCATION) {
    if (!form.location.trim()) errors.location = t('assets.form.errors.locationRequired');
    const reserve = Number(form.desiredReservePrice);
    if (!form.desiredReservePrice.trim() || !Number.isFinite(reserve) || reserve <= 0) {
      errors.desiredReservePrice = t('assets.form.errors.reservePriceRequired');
    }
    if (!form.auctionConditions.trim()) {
      errors.auctionConditions = t('assets.form.errors.auctionConditionsRequired');
    }
  }

  if (step === ASSET_REQUEST_STEPS.PHOTOS) {
    if (!form.photoFiles.length) errors.photos = t('assets.form.errors.photosRequired');
  }

  if (step === ASSET_REQUEST_STEPS.DOCUMENTS) {
    if (!form.ownershipDocumentUrl.trim()) {
      errors.ownershipDocumentUrl = t('assets.form.errors.ownershipDocRequired');
    }
    if (!form.additionalDocuments.length) {
      errors.additionalDocuments = t('assets.form.errors.supportingDocsRequired');
    }
  }

  return errors;
}

export function validateAssetForm(
  form: AssetFormState,
  t: (key: string) => string,
): Record<string, string> {
  return ASSET_REQUEST_STEP_ORDER.reduce((errors, stepKey) => {
    if (stepKey === ASSET_REQUEST_STEPS.BATCH_REVIEW) return errors;
    return { ...errors, ...validateAssetStep(stepKey, form, t) };
  }, {});
}

export function buildAssetPayload(form: AssetFormState, imageUrls: string[]): AssetCreatePayload {
  const assetType = form.assetType as AssetType;
  return {
    title: form.title.trim(),
    assetType,
    description: form.description.trim(),
    conditionNotes: form.conditionNotes.trim(),
    location: form.location.trim(),
    address: form.address.trim() || undefined,
    imageUrls,
    desiredReservePrice: Number(form.desiredReservePrice),
    auctionConditions: form.auctionConditions.trim(),
    ownershipDocumentType: getOwnershipDocType(assetType),
    ownershipDocumentUrl: form.ownershipDocumentUrl,
    additionalDocuments: form.additionalDocuments,
  };
}
