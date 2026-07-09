/**
 * Hierarchical lot grouping: parent `lots` rows with nested `auction_assets`.
 */

/**
 * @param {unknown} value
 * @returns {string[]}
 */
export function normalizeTags(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value
      .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }
    if (trimmed.startsWith('[')) {
      try {
        return normalizeTags(JSON.parse(trimmed));
      } catch {
        return trimmed.split(',').map((tag) => tag.trim()).filter(Boolean);
      }
    }
    return trimmed.split(',').map((tag) => tag.trim()).filter(Boolean);
  }
  return [];
}

/**
 * @param {object[]} assets
 */
function normalizeFlatAssetInputs(assets) {
  if (!Array.isArray(assets)) {
    return [];
  }

  return assets
    .map((entry, index) => ({
      assetId: entry?.assetId ?? entry?.asset_id,
      reservePrice: Number(entry?.reservePrice ?? entry?.reserve_price),
      sortOrder: Number.isFinite(Number(entry?.sortOrder)) ? Number(entry.sortOrder) : index,
      lotLabel: entry?.lotLabel?.trim() || entry?.lot_label?.trim() || `Lot ${index + 1}`,
      tags: normalizeTags(entry?.tags),
    }))
    .filter((entry) => entry.assetId);
}

/**
 * Normalize create/update payload into parent lot groups with nested assets.
 * @param {{ lots?: object[], assets?: object[] }} payload
 */
export function normalizeLotGroupInputs(payload = {}) {
  const nestedLots = payload.lots;

  if (Array.isArray(nestedLots) && nestedLots.length > 0) {
    const hasNestedAssets = nestedLots.some(
      (lot) => Array.isArray(lot?.assets) && lot.assets.length > 0,
    );

    if (hasNestedAssets) {
      return nestedLots
        .map((lot, lotIndex) => ({
          id: lot?.id?.trim() || null,
          title: lot?.title?.trim() || lot?.lotTitle?.trim() || `Lot ${lotIndex + 1}`,
          description: lot?.description?.trim() || null,
          sortOrder: Number.isFinite(Number(lot?.sortOrder)) ? Number(lot.sortOrder) : lotIndex,
          assets: (Array.isArray(lot?.assets) ? lot.assets : [])
            .map((asset, assetIndex) => ({
              id: asset?.id?.trim() || null,
              assetId: asset?.assetId ?? asset?.asset_id,
              reservePrice: Number(asset?.reservePrice ?? asset?.reserve_price),
              sortOrder: Number.isFinite(Number(asset?.sortOrder)) ? Number(asset.sortOrder) : assetIndex,
              tags: normalizeTags(asset?.tags),
            }))
            .filter((asset) => asset.assetId),
        }))
        .filter((lot) => lot.assets.length > 0);
    }
  }

  const flatAssets = normalizeFlatAssetInputs(payload.assets);
  if (!flatAssets.length) {
    return [];
  }

  const grouped = new Map();
  for (const asset of flatAssets) {
    const key = asset.lotLabel || asset.assetId;
    if (!grouped.has(key)) {
      grouped.set(key, {
        id: null,
        title: asset.lotLabel || 'Lot 1',
        description: null,
        sortOrder: grouped.size,
        assets: [],
      });
    }
    grouped.get(key).assets.push({
      id: null,
      assetId: asset.assetId,
      reservePrice: asset.reservePrice,
      sortOrder: asset.sortOrder,
      tags: asset.tags,
    });
  }

  return Array.from(grouped.values());
}

/**
 * @param {object} row
 * @param {(urls: unknown) => string[]} formatImages
 */
export function serializeAuctionAssetRow(row, formatImages) {
  const plain = row.get ? row.get({ plain: true }) : row;
  const asset = plain.asset;
  const images = formatImages(asset?.image_urls);

  return {
    id: plain.id,
    auctionId: plain.auction_id,
    lotId: plain.lot_id ?? null,
    assetId: plain.asset_id,
    reservePrice: Number(plain.reserve_price),
    sortOrder: plain.sort_order,
    lotLabel: plain.lot_label,
    tags: normalizeTags(plain.tags),
    outcomeStatus: plain.outcome_status,
    assetTitle: asset?.title ?? null,
    assetType: asset?.asset_type ?? null,
    assetLocation: asset?.location ?? null,
    assetDescription: asset?.description ?? null,
    assetConditionNotes: asset?.condition_notes ?? null,
    assetImages: images,
    imageUrls: images,
    assetDocuments: asset?.additional_document_urls ?? null,
  };
}

/**
 * @param {object[]} parentLots
 * @param {object[]} auctionAssetRows
 * @param {(urls: unknown) => string[]} formatImages
 */
export function buildNestedLotGroups(parentLots, auctionAssetRows, formatImages) {
  const serialize = (row) => serializeAuctionAssetRow(row, formatImages);

  if (Array.isArray(parentLots) && parentLots.length > 0) {
    const assetsByLotId = new Map();
    for (const row of auctionAssetRows) {
      const plain = row.get ? row.get({ plain: true }) : row;
      const lotId = plain.lot_id;
      if (!lotId) {
        continue;
      }
      if (!assetsByLotId.has(lotId)) {
        assetsByLotId.set(lotId, []);
      }
      assetsByLotId.get(lotId).push(serialize(row));
    }

    const grouped = parentLots.map((lot) => {
      const plain = lot.get ? lot.get({ plain: true }) : lot;
      const assets = (assetsByLotId.get(plain.id) || [])
        .sort((a, b) => a.sortOrder - b.sortOrder);
      return {
        id: plain.id,
        title: plain.title,
        description: plain.description ?? null,
        sortOrder: plain.sort_order,
        assets,
      };
    });

    const assignedAssetIds = new Set(
      grouped.flatMap((lot) => lot.assets.map((asset) => asset.id)),
    );
    const orphans = auctionAssetRows
      .filter((row) => {
        const plain = row.get ? row.get({ plain: true }) : row;
        return !assignedAssetIds.has(plain.id);
      })
      .map(serialize);

    if (orphans.length > 0) {
      grouped.push({
        id: `legacy-${orphans[0]?.auctionId || 'orphan'}`,
        title: orphans[0]?.lotLabel || 'Other Assets',
        description: null,
        sortOrder: grouped.length,
        assets: orphans,
      });
    }

    return grouped.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  const labelGroups = new Map();
  for (const row of auctionAssetRows) {
    const asset = serialize(row);
    const key = asset.lotLabel || asset.id;
    if (!labelGroups.has(key)) {
      labelGroups.set(key, {
        id: key,
        title: asset.lotLabel || 'Lot',
        description: null,
        sortOrder: labelGroups.size,
        assets: [],
      });
    }
    labelGroups.get(key).assets.push(asset);
  }

  return Array.from(labelGroups.values()).sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * @param {Array<{ assets?: object[] }>} lotGroups
 */
export function flattenNestedLotGroups(lotGroups) {
  if (!Array.isArray(lotGroups)) {
    return [];
  }

  if (lotGroups.length > 0 && Array.isArray(lotGroups[0]?.assets)) {
    return lotGroups.flatMap((lot) => (Array.isArray(lot.assets) ? lot.assets : []));
  }

  return lotGroups;
}

/**
 * @param {Array<{ assets?: object[] }>} lotGroups
 */
export function countNestedAssets(lotGroups) {
  return flattenNestedLotGroups(lotGroups).length;
}

export default {
  normalizeTags,
  normalizeLotGroupInputs,
  serializeAuctionAssetRow,
  buildNestedLotGroups,
  flattenNestedLotGroups,
  countNestedAssets,
};
