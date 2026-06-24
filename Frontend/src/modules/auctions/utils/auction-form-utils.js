export const AUCTION_STEPS = Object.freeze({
  BASIC: 'basic',
  SCHEDULE: 'schedule',
  MEDIA: 'media',
  REVIEW: 'review',
});

export const AUCTION_STEP_ORDER = [
  AUCTION_STEPS.BASIC,
  AUCTION_STEPS.SCHEDULE,
  AUCTION_STEPS.MEDIA,
  AUCTION_STEPS.REVIEW,
];

export const AUCTION_CATEGORY_KEYS = Object.freeze([
  'vehicles',
  'machinery',
  'buildings',
  'land',
  'equipment',
  'salvage_assets',
  'other_assets',
]);

export const EMPTY_AUCTION_FORM = Object.freeze({
  title: '',
  category: '',
  description: '',
  auctionConditions: '',
  startDate: '',
  endDate: '',
  reservePrice: '',
  documentFee: '',
  cpoPercentage: '',
  images: [],
  documents: [],
});

/**
 * @param {string} step
 * @param {object} form
 * @param {(key: string) => string} t
 */
export function validateAuctionStep(step, form, t) {
  const errors = {};

  if (step === AUCTION_STEPS.BASIC) {
    if (!form.title?.trim()) {
      errors.title = t('auctions.create.errors.titleRequired');
    }
    if (!form.category) {
      errors.category = t('auctions.create.errors.categoryRequired');
    }
    if (!form.auctionConditions?.trim()) {
      errors.auctionConditions = t('auctions.create.errors.conditionsRequired');
    }
  }

  if (step === AUCTION_STEPS.SCHEDULE) {
    if (!form.startDate) {
      errors.startDate = t('auctions.create.errors.startDateRequired');
    }
    if (!form.endDate) {
      errors.endDate = t('auctions.create.errors.endDateRequired');
    }

    if (form.startDate && form.endDate) {
      const start = new Date(form.startDate);
      const end = new Date(form.endDate);
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end <= start) {
        errors.endDate = t('auctions.create.errors.endBeforeStart');
      }
    }

    const reserve = Number(form.reservePrice);
    if (!form.reservePrice || !Number.isFinite(reserve) || reserve <= 0) {
      errors.reservePrice = t('auctions.create.errors.reservePositive');
    }

    const docFee = Number(form.documentFee);
    if (form.documentFee === '' || !Number.isFinite(docFee) || docFee < 0) {
      errors.documentFee = t('auctions.create.errors.documentFeeInvalid');
    }

    const cpo = Number(form.cpoPercentage);
    if (!form.cpoPercentage || !Number.isFinite(cpo) || cpo < 1 || cpo > 100) {
      errors.cpoPercentage = t('auctions.create.errors.cpoRange');
    }
  }

  if (step === AUCTION_STEPS.MEDIA) {
    if (!form.documents?.length) {
      errors.documents = t('auctions.create.errors.documentsRequired');
    }
  }

  return errors;
}

/**
 * @param {number} bytes
 */
export function formatFileSize(bytes) {
  const size = Number(bytes);
  if (!Number.isFinite(size) || size <= 0) {
    return '0 B';
  }
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * @param {object} form
 */
export function buildAuctionPayload(form) {
  return {
    title: form.title.trim(),
    category: form.category,
    description: form.description?.trim() || null,
    auctionConditions: form.auctionConditions.trim(),
    startDate: new Date(form.startDate).toISOString(),
    endDate: new Date(form.endDate).toISOString(),
    reservePrice: Number(form.reservePrice),
    documentFee: Number(form.documentFee),
    cpoPercentage: Number(form.cpoPercentage),
    imageUrls: [],
    documents: [],
  };
}

export default {
  AUCTION_STEPS,
  AUCTION_STEP_ORDER,
  AUCTION_CATEGORY_KEYS,
  EMPTY_AUCTION_FORM,
  validateAuctionStep,
  formatFileSize,
  buildAuctionPayload,
};
