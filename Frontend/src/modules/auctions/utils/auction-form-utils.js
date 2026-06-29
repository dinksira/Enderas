export const AUCTION_STEPS = Object.freeze({
  ASSET: 'asset',
  BASIC: 'basic',
  SCHEDULE: 'schedule',
  MEDIA: 'media',
  REVIEW: 'review',
});

export const AUCTION_STEP_ORDER = [
  AUCTION_STEPS.ASSET,
  AUCTION_STEPS.BASIC,
  AUCTION_STEPS.SCHEDULE,
  AUCTION_STEPS.MEDIA,
  AUCTION_STEPS.REVIEW,
];

export const AUCTION_MODES = Object.freeze({
  SINGLE: 'single',
  MULTI: 'multi',
});

export const MAX_LOTS_PER_AUCTION = 25;

export const AUCTION_CATEGORY_KEYS = Object.freeze([
  'vehicles',
  'machinery',
  'buildings',
  'land',
  'equipment',
  'salvage_assets',
  'other_assets',
]);

export const ASSET_TYPE_TO_AUCTION_CATEGORY = Object.freeze({
  vehicle: 'vehicles',
  land: 'land',
  building: 'buildings',
  machinery: 'machinery',
  equipment: 'equipment',
  salvage: 'salvage_assets',
  other: 'other_assets',
});

/**
 * @param {string} assetType
 */
export function mapAssetTypeToAuctionCategory(assetType) {
  return ASSET_TYPE_TO_AUCTION_CATEGORY[assetType] || 'other_assets';
}

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
  prefilledImageUrls: [],
  prefilledDocuments: [],
});

/**
 * @param {Array<{ reservePrice?: string|number }>} selectedLots
 */
export function computeLotsTotalReserve(selectedLots = []) {
  return selectedLots.reduce((sum, lot) => {
    const amount = Number(lot.reservePrice);
    return Number.isFinite(amount) && amount > 0 ? sum + amount : sum;
  }, 0);
}

/**
 * @param {object} asset
 * @param {number} [sortOrder]
 */
export function buildSelectedLotFromAsset(asset, sortOrder = 0) {
  const recommendedReserve = asset.evaluation?.reservePriceRecommendation
    ?? asset.desiredReservePrice
    ?? '';

  return {
    assetId: asset.id,
    asset,
    reservePrice: recommendedReserve !== '' ? String(recommendedReserve) : '',
    lotLabel: `Lot ${sortOrder + 1}`,
  };
}

/**
 * @param {string} step
 * @param {object} form
 * @param {(key: string) => string} t
 * @param {{ auctionMode?: string, selectedLots?: object[] }} [options]
 */
export function validateAuctionStep(step, form, t, options = {}) {
  const errors = {};
  const auctionMode = options.auctionMode || AUCTION_MODES.SINGLE;
  const selectedLots = options.selectedLots || [];

  if (step === AUCTION_STEPS.ASSET && auctionMode === AUCTION_MODES.MULTI) {
    if (selectedLots.length < 2) {
      errors.assets = t('auctions.create.errors.multiAssetsRequired');
    }

    if (selectedLots.length > MAX_LOTS_PER_AUCTION) {
      errors.assets = t('auctions.create.errors.lotLimitReached', { max: MAX_LOTS_PER_AUCTION });
    }

    selectedLots.forEach((lot) => {
      const reserve = Number(lot.reservePrice);
      if (!lot.reservePrice?.toString().trim() || !Number.isFinite(reserve) || reserve <= 0) {
        errors[`lotReserve_${lot.assetId}`] = t('auctions.create.errors.lotReserveRequired');
      }
    });
  }

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

    if (auctionMode !== AUCTION_MODES.MULTI) {
      const reserve = Number(form.reservePrice);
      if (!form.reservePrice || !Number.isFinite(reserve) || reserve <= 0) {
        errors.reservePrice = t('auctions.create.errors.reservePositive');
      }
    } else if (computeLotsTotalReserve(selectedLots) <= 0) {
      errors.reservePrice = t('auctions.create.errors.lotReserveRequired');
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
    const docCount = (form.documents?.length ?? 0) + (form.prefilledDocuments?.length ?? 0);
    if (!docCount) {
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
 * @param {{ auctionMode?: string, selectedLots?: object[] }} [options]
 */
export function buildAuctionPayload(form, options = {}) {
  const auctionMode = options.auctionMode || AUCTION_MODES.SINGLE;
  const selectedLots = options.selectedLots || [];
  const isMulti = auctionMode === AUCTION_MODES.MULTI;
  const lots = selectedLots.map((lot, index) => ({
    assetId: lot.assetId,
    reservePrice: Number(lot.reservePrice),
    sortOrder: index,
    lotLabel: lot.lotLabel?.trim() || `Lot ${index + 1}`,
  }));
  const totalReserve = isMulti
    ? computeLotsTotalReserve(selectedLots)
    : Number(form.reservePrice);

  return {
    auctionMode: isMulti ? AUCTION_MODES.MULTI : AUCTION_MODES.SINGLE,
    title: form.title.trim(),
    category: form.category,
    description: form.description?.trim() || null,
    auctionConditions: form.auctionConditions.trim(),
    startDate: new Date(form.startDate).toISOString(),
    endDate: new Date(form.endDate).toISOString(),
    reservePrice: totalReserve,
    documentFee: Number(form.documentFee),
    cpoPercentage: Number(form.cpoPercentage),
    imageUrls: [],
    documents: [],
    assetId: !isMulti && lots.length === 1 ? lots[0].assetId : null,
    assets: lots.length ? lots : undefined,
  };
}

/**
 * @param {object} asset
 * @param {(key: string) => string} t
 */
export function buildFormPrefillFromAsset(asset, t) {
  const photoUrls = [
    ...(asset.evaluation?.photoUrls ?? []),
    ...(asset.imageUrls ?? []),
  ].filter((url, index, list) => url && list.indexOf(url) === index);

  const prefilledDocuments = [];
  if (asset.evaluation?.reportUrl) {
    prefilledDocuments.push({
      id: 'prefill-eval-report',
      name: t('auctions.create.prefill.evaluationReport'),
      url: asset.evaluation.reportUrl,
      size: 0,
      isPrefilled: true,
    });
  }

  return {
    title: asset.title ?? '',
    category: asset.auctionCategory ?? mapAssetTypeToAuctionCategory(asset.assetType),
    description: asset.description ?? '',
    auctionConditions: asset.auctionConditions ?? '',
    reservePrice: String(
      asset.evaluation?.reservePriceRecommendation ?? asset.desiredReservePrice ?? '',
    ),
    prefilledImageUrls: photoUrls,
    prefilledDocuments,
  };
}

export default {
  AUCTION_STEPS,
  AUCTION_STEP_ORDER,
  AUCTION_MODES,
  MAX_LOTS_PER_AUCTION,
  AUCTION_CATEGORY_KEYS,
  ASSET_TYPE_TO_AUCTION_CATEGORY,
  EMPTY_AUCTION_FORM,
  buildSelectedLotFromAsset,
  computeLotsTotalReserve,
  mapAssetTypeToAuctionCategory,
  validateAuctionStep,
  formatFileSize,
  buildAuctionPayload,
  buildFormPrefillFromAsset,
};
