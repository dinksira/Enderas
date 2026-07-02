import type { AuctionDisplayStatus } from '@/types/auction';
import { getCategoryTheme, type CategoryTheme } from '@/theme/categoryColors';

// Re-export so existing imports (`@/lib/auctionUtils`) keep working.
// New code should import from `@/theme/categoryColors` directly.
export { getCategoryTheme, type CategoryTheme };

const ASSET_TYPE_TO_AUCTION_CATEGORY: Record<string, string> = {
  vehicle: 'vehicles',
  land: 'land',
  building: 'buildings',
  machinery: 'machinery',
  equipment: 'equipment',
  salvage: 'salvage_assets',
  other: 'other_assets',
};

/**
 * Translate an asset type (singular, e.g. "vehicle") into the matching
 * auction category key (plural, e.g. "vehicles"). Falls through to the
 * input unchanged when there's no mapping — the caller can then decide
 * whether to treat it as an unknown category.
 */
export function resolveAuctionCategoryFilter(assetTypeOrCategory: string): string {
  return ASSET_TYPE_TO_AUCTION_CATEGORY[assetTypeOrCategory] ?? assetTypeOrCategory;
}

function addThousandsSeparators(value: number): string {
  const [whole, fraction] = String(value).split('.');
  const groupedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return fraction ? `${groupedWhole}.${fraction}` : groupedWhole;
}

/**
 * Format an ETB amount with the en-ET locale grouping. Returns an em
 * dash for non-finite values so the layout doesn't shift to "NaN ETB".
 */
export function formatEtbAmount(value: number): string {
  if (typeof value !== 'number' || isNaN(value)) return '—';

  try {
    if (typeof Intl !== 'undefined' && typeof Intl.NumberFormat === 'function') {
      return `${new Intl.NumberFormat('en-ET').format(value)} ETB`;
    }
  } catch {
    // Fall back to manual grouping below.
  }

  return `${addThousandsSeparators(value)} ETB`;
}

/**
 * Map an auction display status to a UI tone used by chips, dots, and
 * labels. Each tone maps to a theme status color (success / warning /
 * danger / info) so contrast is automatic in light/dark mode.
 */
export function statusTone(
  status: AuctionDisplayStatus,
): 'live' | 'ending' | 'won' | 'lost' | 'pending' {
  switch (status) {
    case 'ACTIVE':
      return 'live';
    case 'SUSPENDED':
      return 'pending';
    case 'CLOSED':
      return 'lost';
    default:
      return 'pending';
  }
}
