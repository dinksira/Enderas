import { formatEtbAmount, normalizeAuctionStatus, statusPillClass } from '@enderass/shared/utils';
import { AUCTION_CATEGORY_KEYS } from './auction-form-utils.js';

export { formatEtbAmount, normalizeAuctionStatus, statusPillClass };

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

export function toDatetimeLocalValue(iso) {
  if (!iso) {
    return '';
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function canEditAuction(status) {
  const key = normalizeAuctionStatus(status);
  return key === 'PENDING' || key === 'SUSPENDED';
}

export function isImagesOnlyAuctionEdit(status) {
  return normalizeAuctionStatus(status) === 'ACTIVE';
}

/**
 * @param {object} auction
 */
export function buildEditFormFromAuction(auction) {
  return {
    title: auction?.title || '',
    category: auction?.category || auction?.categoryKey || '',
    description: auction?.description || '',
    auctionConditions: auction?.auctionConditions || '',
    startDate: toDatetimeLocalValue(auction?.startDate),
    endDate: toDatetimeLocalValue(auction?.endDate),
    reservePrice: auction?.reservePrice != null ? String(auction.reservePrice) : '',
    documentFee: auction?.documentFee != null ? String(auction.documentFee) : '',
    cpoPercentage: auction?.cpoPercentage != null ? String(auction.cpoPercentage) : '',
    existingImageUrls: Array.isArray(auction?.imageUrls) ? [...auction.imageUrls] : [],
    existingDocuments: Array.isArray(auction?.documents) ? [...auction.documents] : [],
    newImages: [],
    newDocuments: [],
  };
}

export function buildUpdatePayload(form) {
  const newImageUrls = form.newImages.map((entry) => entry.url).filter(Boolean);
  const allImageUrls = [...form.existingImageUrls, ...newImageUrls];

  const allDocuments = [
    ...form.existingDocuments,
    ...form.newDocuments.map((entry) => ({
      name: entry.name,
      url: entry.url,
      size: entry.size,
    })),
  ];

  return {
    title: form.title.trim(),
    category: form.category,
    description: form.description?.trim() || null,
    auctionConditions: form.auctionConditions?.trim() || null,
    startDate: new Date(form.startDate).toISOString(),
    endDate: new Date(form.endDate).toISOString(),
    reservePrice: Number(form.reservePrice),
    documentFee: Number(form.documentFee),
    cpoPercentage: Number(form.cpoPercentage),
    imageUrls: allImageUrls,
    documents: allDocuments,
  };
}

export { AUCTION_CATEGORY_KEYS };

export function buildImagesOnlyUpdatePayload(form) {
  const newImageUrls = form.newImages.map((entry) => entry.url).filter(Boolean);
  return {
    imageUrls: [...form.existingImageUrls, ...newImageUrls],
  };
}

export default {
  normalizeAuctionStatus,
  statusPillClass,
  formatEtbAmount,
  formatFileSize,
  toDatetimeLocalValue,
  canEditAuction,
  isImagesOnlyAuctionEdit,
  buildEditFormFromAuction,
  buildUpdatePayload,
  buildImagesOnlyUpdatePayload,
  AUCTION_CATEGORY_KEYS,
};
