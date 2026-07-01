import { ENV } from '@/lib/env';
import { api } from '@/services/api';
import type {
  AssetBatchCreateResponse,
  AssetCreatePayload,
  AssetListResponse,
  AssetRecord,
} from '@/types/asset';

const ASSETS_BASE = `${ENV.apiV1Prefix}/assets`;

export async function getMyAssets(): Promise<AssetListResponse> {
  return api.get<AssetListResponse>(`${ASSETS_BASE}/my`);
}

export async function getAssetById(id: string): Promise<{ asset: AssetRecord }> {
  return api.get<{ asset: AssetRecord }>(`${ASSETS_BASE}/${id}`);
}

export async function createAsset(payload: AssetCreatePayload): Promise<{ asset: AssetRecord }> {
  return api.post<{ asset: AssetRecord }>(ASSETS_BASE, payload);
}

export async function createAssetsBatch(
  assets: AssetCreatePayload[],
): Promise<AssetBatchCreateResponse> {
  return api.post<AssetBatchCreateResponse>(`${ASSETS_BASE}/batch`, { assets });
}

export const assetApi = Object.freeze({
  getMyAssets,
  getAssetById,
  createAsset,
  createAssetsBatch,
});

export default assetApi;
