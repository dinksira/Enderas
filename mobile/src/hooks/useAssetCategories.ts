import { ASSET_TYPE_KEYS } from '@/lib/assetFormUtils';
import type { AssetType } from '@/types/asset';

interface UseAssetCategoriesResult {
  categories: AssetType[];
  loading: boolean;
  error: string | null;
}

/** Asset categories are defined server-side as a fixed enum — no API fetch needed. */
export function useAssetCategories(): UseAssetCategoriesResult {
  return {
    categories: ASSET_TYPE_KEYS,
    loading: false,
    error: null,
  };
}

export default useAssetCategories;
