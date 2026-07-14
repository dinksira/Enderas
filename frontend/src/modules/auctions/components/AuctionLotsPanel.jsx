import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatEtbAmount } from '@enderass/shared/utils';
import {
  computeAggregateBidCoveragePercent,
  computeRequiredCpoFromBidAmounts,
  computeTotalBidAmountFromDrafts,
  computeTotalReserveForLots,
  isMultiLotAuction,
} from '../utils/auction-lot-utils.js';

function resolveAssetsByLot(lots) {
  if (!lots || !lots.length) return [];
  if (lots[0].assets) return lots;

  const grouped = new Map();
  for (const asset of lots) {
    const label = asset.lotLabel || asset.lot_label;
    const groupKey = label || asset.id;
    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, {
        id: groupKey,
        title: label || asset.assetTitle || asset.title || 'Lot',
        sortOrder: asset.sortOrder ?? asset.sort_order ?? 0,
        assets: []
      });
    }
    grouped.get(label).assets.push(asset);
  }

  return Array.from(grouped.values()).sort((a, b) => a.sortOrder - b.sortOrder);
}

function AssetTagPill({ tag }) {
  return (
    <span className="bidder-detail__tag-pill" style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 12,
      fontSize: 11,
      fontWeight: 600,
      background: '#e8f0fe',
      color: '#1a56db',
      marginRight: 4,
      marginBottom: 4,
      textTransform: 'uppercase',
      letterSpacing: '0.3px',
    }}>
      {tag}
    </span>
  );
}

function AssetCard({ asset, reserve, tags, draft, bidDraftAmount, index, cpoPercentage, selectable, isSelected, onToggle, onOpenDetails, draftBidAmount, onBidAmountChange }) {
  const { t } = useTranslation();
  const tagList = useMemo(() => {
    const raw = asset.tags ?? asset.tagList ?? asset.tag_list ?? tags ?? [];
    if (typeof raw === 'string') {
      try { return JSON.parse(raw); } catch { return raw.trim() ? [raw.trim()] : []; }
    }
    return Array.isArray(raw) ? raw : [];
  }, [asset, tags]);

  const isLocked = Boolean(draft);

  return (
    <div
      className={['bidder-detail__asset-card', selectable && isSelected ? 'bidder-detail__lot-item--selected' : ''].filter(Boolean).join(' ')}
      style={{ cursor: 'pointer', transition: 'background 0.15s, box-shadow 0.15s', display: 'flex', flexDirection: 'column' }}
      onClick={(e) => {
        // Prevent click from toggling modal if clicking on the input
        if (e.target.tagName !== 'INPUT') {
          onOpenDetails?.(asset);
        }
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = ''; e.currentTarget.style.boxShadow = ''; }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenDetails?.(asset); } }}
    >
      <div style={{ display: 'flex', width: '100%' }}>
        {selectable ? (
          <label className="bidder-detail__lot-option" style={{ padding: 0, width: 'auto', flexShrink: 0, marginRight: 12 }} onClick={(e) => e.stopPropagation()}>
            <input 
              type="checkbox" 
              className="bidder-detail__lot-checkbox" 
              checked={isSelected} 
              disabled={isLocked} 
              onChange={() => onToggle?.(asset.id ?? asset.assetId ?? asset.auctionAssetId)} 
            />
          </label>
        ) : null}
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <h5 className="bidder-detail__asset-title" style={{ fontSize: 15, marginBottom: 4 }}>
            {asset.assetTitle || asset.title || asset.name || `${t('bidder.browse.lots.asset')} ${index + 1}`}
          </h5>
          
          {reserve > 0 && (
            <p className="bidder-detail__asset-reserve" style={{ margin: '0 0 4px', fontWeight: 500 }}>
              {t('bidder.browse.placeBid.reservePrice')}: {formatEtbAmount(reserve)}
            </p>
          )}
          
          {tagList.length > 0 && (
            <div className="bidder-detail__asset-tags" style={{ marginTop: 4 }}>
              {tagList.map((tag) => <AssetTagPill key={tag} tag={tag} />)}
            </div>
          )}
        </div>
        
        <div style={{ flexShrink: 0, marginLeft: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          {draft && (
            <span className="bidder-detail__lot-status bidder-detail__lot-status--saved" style={{ background: '#e8f5e9', color: '#2e7d32', padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
              {t('bidder.browse.lots.bidSaved', { amount: formatEtbAmount(bidDraftAmount || draft.amount) })}
            </span>
          )}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>

      {((selectable && isSelected) || (!selectable && onBidAmountChange)) && !isLocked && (
        <div style={{ marginTop: 16, marginLeft: selectable ? 32 : 0, padding: '12px 16px', background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', cursor: 'default' }} onClick={(e) => e.stopPropagation()}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {t('bidder.browse.placeBid.amount', 'Your Bid Amount (ETB)')}
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="number"
              className="input-field__control"
              style={{ flex: 1, maxWidth: 200, padding: '8px 12px', fontSize: 14, borderColor: draftBidAmount !== '' && Number(draftBidAmount) < reserve ? '#ef4444' : '#cbd5e1' }}
              placeholder={`Min: ${reserve}`}
              value={draftBidAmount ?? ''}
              onChange={(e) => onBidAmountChange?.(e.target.value)}
              min={reserve || 0}
              step="0.01"
            />
            {draftBidAmount !== '' && Number(draftBidAmount) < reserve && (
              <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 500 }}>
                {t('bidder.browse.placeBid.minBidError', 'Must be at least {{amount}}', { amount: formatEtbAmount(reserve) })}
              </span>
            )}
            {draftBidAmount !== '' && Number(draftBidAmount) >= reserve && (
              <span style={{ fontSize: 12, color: '#10b981', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                Valid Bid
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function LotSection({ lot, index, cpoPercentage, draftsByAsset, t, selectable, selectedLotIds, onToggleLot, onOpenDetails, draftBidAmounts, onBidAmountChange }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const assets = lot.assets || [];
  const label = lot.title || lot.lotTitle || lot.lotLabel || t('bidder.browse.lots.lotFallback', { index: index + 1 });

  const totalReserve = useMemo(() => {
    return assets.reduce((sum, asset) => sum + Number(asset.reservePrice ?? asset.reserve_price ?? 0), 0);
  }, [assets]);

  return (
    <div className="bidder-detail__lot-section" style={{ marginBottom: 16 }}>
      <button 
        type="button" 
        className="bidder-detail__lot-heading-btn"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <div className="bidder-detail__lot-heading-content">
          <h4 className="bidder-detail__lot-heading-title">
            <span className="bidder-detail__lot-icon">📍</span>
            {t('bidder.browse.lots.lotLabel', 'Lot {{n}}', { n: index + 1 })}: {label}
          </h4>
          <p className="bidder-detail__lot-heading-meta">
            {t('bidder.browse.lots.assetCount', '{{count}} Assets', { count: assets.length })}
            {totalReserve > 0 && ` · ${t('bidder.browse.placeBid.reservePrice')}: ${formatEtbAmount(totalReserve)}`}
          </p>
        </div>
        <svg 
          className={`bidder-detail__lot-chevron ${isExpanded ? 'bidder-detail__lot-chevron--expanded' : ''}`}
          width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      
      {isExpanded && (
        <div className="bidder-detail__lot-assets">
          {assets.length === 0 ? (
            <p className="bidder-detail__lot-empty" style={{ fontSize: 13, color: '#888', margin: 0 }}>
              {t('bidder.browse.lots.noAssets', 'No assets in this lot')}
            </p>
          ) : (
            assets.map((asset, ai) => {
              const reserve = Number(asset.reservePrice ?? asset.reserve_price ?? 0);
              const draft = draftsByAsset.get(asset.id ?? asset.assetId ?? asset.auctionAssetId);
              const assetId = asset.id ?? asset.assetId ?? asset.auctionAssetId;
              const isSelected = selectedLotIds.includes(assetId);
              const draftBidAmount = draftBidAmounts?.[assetId] ?? '';

              return (
                <AssetCard
                  key={assetId ?? ai}
                  asset={asset}
                  reserve={reserve}
                  tags={asset.tags}
                  draft={draft}
                  index={ai}
                  cpoPercentage={cpoPercentage}
                  selectable={selectable}
                  isSelected={isSelected}
                  onToggle={onToggleLot}
                  onOpenDetails={onOpenDetails}
                  draftBidAmount={draftBidAmount}
                  onBidAmountChange={onBidAmountChange ? (amount) => onBidAmountChange(assetId, amount) : undefined}
                />
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function AssetDetailModal({ asset, onClose }) {
  const { assetDescription, assetConditionNotes } = asset;
  const title = asset.assetTitle || asset.title || asset.name || 'Asset Details';
  const type = asset.assetType || asset.asset_type || null;
  const location = asset.assetLocation || asset.location || null;
  const reserve = Number(asset.reservePrice ?? asset.reserve_price ?? 0);

  // Normalize — these can arrive as JSON strings, arrays, or null
  const normalize = (val) => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return val.trim() ? [val.trim()] : []; }
    }
    return [];
  };
  const assetImages = normalize(asset.assetImages);
  const assetDocuments = normalize(asset.assetDocuments);
  const assetTags = normalize(asset.tags ?? asset.tagList ?? asset.tag_list ?? asset.tags);
  return (
    <div className="kyc-modal-overlay" style={{ zIndex: 3000 }} onClick={onClose}>
      <div
        className="kyc-modal kyc-modal--borderless"
        style={{ width: 'min(640px, 95vw)', maxHeight: '85vh', padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{title}</h3>
              <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                {type && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#6366f1', background: '#eef2ff', padding: '3px 10px', borderRadius: 12, textTransform: 'capitalize' }}>
                    {type}
                  </span>
                )}
                {location && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748b' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {location}
                  </span>
                )}
              </div>
            </div>
            <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', color: '#64748b', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '24px 28px 28px' }}>
          {/* Reserve price highlight */}
          {reserve > 0 && (
            <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)', border: '1px solid #bbf7d0', borderRadius: 10, padding: '14px 18px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#166534', textTransform: 'uppercase', letterSpacing: 0.5 }}>Reserve Price</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#15803d' }}>{formatEtbAmount(reserve)}</span>
            </div>
          )}

          {/* Image gallery */}
          {Array.isArray(assetImages) && assetImages.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.8 }}>Photos</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                {assetImages.map((img, i) => (
                  <img key={i} src={img} alt={`${title} photo ${i + 1}`} style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 10, border: '1px solid #e2e8f0' }} />
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {assetDescription && (
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.8 }}>Description</h4>
              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, fontSize: 14, color: '#334155', lineHeight: 1.7 }}>
                {assetDescription}
              </div>
            </div>
          )}

          {assetTags.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.8 }}>Tags</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {assetTags.map((tag, index) => (
                  <span
                    key={`${tag}-${index}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#eef2ff',
                      color: '#2563eb',
                      padding: '6px 10px',
                      borderRadius: 9999,
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Condition notes */}
          {assetConditionNotes && (
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.8 }}>Condition Notes</h4>
              <div style={{ background: '#fffbeb', padding: 16, borderRadius: 10, fontSize: 14, color: '#92400e', lineHeight: 1.7, border: '1px solid #fde68a' }}>
                {assetConditionNotes}
              </div>
            </div>
          )}

          {/* Documents */}
          {Array.isArray(assetDocuments) && assetDocuments.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.8 }}>Documents</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {assetDocuments.map((doc, i) => (
                  <a key={i} href={doc} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#f1f5f9', color: '#0369a1', borderRadius: 10, fontSize: 14, textDecoration: 'none', fontWeight: 500 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    Document {i + 1}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Fallback when no rich data */}
          {!assetDescription && !assetConditionNotes && (!Array.isArray(assetImages) || assetImages.length === 0) && (!Array.isArray(assetDocuments) || assetDocuments.length === 0) && (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: '#94a3b8' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12, opacity: 0.5 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <p style={{ margin: 0, fontSize: 14 }}>No additional details available for this asset.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AuctionLotsPanel({
  auction,
  lots: lotsProp,
  bidDrafts = [],
  compact = false,
  showSelectHint = false,
  selectable = false,
  selectedLotIds = [],
  onToggleLot,
  draftBidAmounts = {},
  onBidAmountChange,
}) {
  const [selectedAssetForModal, setSelectedAssetForModal] = useState(null);
  const { t } = useTranslation();
  const lots = lotsProp ?? auction?.lots ?? [];
  const cpoPercentage = Number(auction?.cpoPercentage ?? auction?.cpo_percentage ?? 0);
  const auctionReserve = Number(auction?.reservePrice ?? auction?.reserve_price ?? 0) || null;

  const hierarchicalLots = useMemo(() => resolveAssetsByLot(lots), [lots]);

  const draftByAssetId = useMemo(
    () => new Map(
      (bidDrafts || [])
        .filter((draft) => draft.auctionAssetId)
        .map((draft) => [draft.auctionAssetId, draft]),
    ),
    [bidDrafts],
  );

  const selectedSet = useMemo(() => new Set(selectedLotIds), [selectedLotIds]);

  if (!lots.length) return null;

  const isMulti = isMultiLotAuction({ ...auction, lots });
  const allReserve = auction?.totalReservePrice != null
    ? Number(auction.totalReservePrice)
    : computeTotalReserveForLots(lots, lots.map((lot) => lot.id));

  const selectedReserveTotal = computeTotalReserveForLots(lots, selectedLotIds);
  const selectedBidTotal = computeTotalBidAmountFromDrafts(bidDrafts, selectedLotIds);

  const selectedDraftBids = (bidDrafts || []).filter(
    (draft) => draft.auctionAssetId && selectedSet.has(draft.auctionAssetId),
  );
  const cpoFromDrafts = computeRequiredCpoFromBidAmounts(selectedDraftBids, cpoPercentage, lots, auctionReserve);
  const coverageFromDrafts = computeAggregateBidCoveragePercent(selectedDraftBids, lots, auctionReserve);

  const hasHierarchy = true; // Always use the modernized layout

  return (
    <section
      className={`bidder-detail__lots${compact ? ' bidder-detail__lots--compact' : ''}${selectable ? ' bidder-detail__lots--selectable' : ''}`}
      aria-label={t('bidder.browse.lots.title')}
    >
      <header className="bidder-detail__lots-header">
        <h3 className="bidder-detail__lots-title">
          {isMulti
            ? t('bidder.browse.lots.titleMulti', { count: lots.length })
            : t('bidder.browse.lots.title')}
        </h3>
        {!hasHierarchy && isMulti && !selectable && allReserve > 0 && (
          <p className="bidder-detail__lots-summary">
            {t('bidder.browse.lots.totalReserve')}: <strong>{formatEtbAmount(allReserve)}</strong>
            {cpoPercentage > 0 && (
              <>
                {' · '}
                {t('bidder.browse.lots.cpoRate')}: <strong>{cpoPercentage}%</strong>
              </>
            )}
          </p>
        )}
        {showSelectHint && isMulti && selectable && (
          <p className="bidder-detail__lots-hint">
            {t('bidder.browse.lots.selectHintCheckable', { percentage: cpoPercentage })}
          </p>
        )}
      </header>

      {hasHierarchy ? (
        <div className="bidder-detail__hierarchical-lots">
          {hierarchicalLots.map((lot, idx) => (
            <LotSection
              key={lot.id || idx}
              lot={lot}
              index={lot.sortOrder ? lot.sortOrder - 1 : idx}
              cpoPercentage={cpoPercentage}
              draftsByAsset={draftByAssetId}
              t={t}
              selectable={selectable}
              selectedLotIds={selectedLotIds}
              onToggleLot={onToggleLot}
              onOpenDetails={setSelectedAssetForModal}
              draftBidAmounts={draftBidAmounts}
              onBidAmountChange={onBidAmountChange}
            />
          ))}
        </div>
      ) : (
        <ul
          className={`auction-create-modal__lot-list bidder-detail__lots-list${selectable ? ' bidder-detail__lots-list--selectable' : ''}`}
          role={selectable ? 'group' : undefined}
          aria-label={selectable ? t('bidder.browse.lots.selectGroup') : undefined}
        >
          {lots.map((lot, index) => {
            const draft = draftByAssetId.get(lot.id);
            const label = lot.lotLabel || t('bidder.browse.lots.lotFallback', { index: index + 1 });
            const reserve = Number(lot.reservePrice ?? lot.reserve_price);
            const isSelected = selectedSet.has(lot.id);
            const isLocked = Boolean(draft);

            return (
              <li
                key={lot.id || lot.assetId || index}
                className={['auction-create-modal__lot-item', selectable && isSelected ? 'bidder-detail__lot-item--selected' : ''].filter(Boolean).join(' ')}
              >
                {selectable ? (
                  <label className="bidder-detail__lot-option">
                    <input type="checkbox" className="bidder-detail__lot-checkbox" checked={isSelected} disabled={isLocked} onChange={() => onToggleLot?.(lot.id)} />
                    <span className="bidder-detail__lot-option-body">
                      <span className="auction-create-modal__lot-title">
                        {label}{lot.assetTitle ? ` — ${lot.assetTitle}` : ''}
                      </span>
                      <span className="auction-create-modal__lot-meta">
                        {Number.isFinite(reserve) && reserve > 0 && <>{t('bidder.browse.lots.lotReserve')}: {formatEtbAmount(reserve)}</>}
                        {lot.assetLocation ? ` · ${lot.assetLocation}` : ''}
                      </span>
                      {draft && <span className="bidder-detail__lot-status bidder-detail__lot-status--saved">{t('bidder.browse.lots.bidSaved', { amount: formatEtbAmount(draft.amount) })}</span>}
                    </span>
                  </label>
                ) : (
                  <div className="bidder-detail__lot-row">
                    <div>
                      <p className="auction-create-modal__lot-title">{label}{lot.assetTitle ? ` — ${lot.assetTitle}` : ''}</p>
                      <p className="auction-create-modal__lot-meta">
                        {Number.isFinite(reserve) && reserve > 0 && <>{t('bidder.browse.lots.lotReserve')}: {formatEtbAmount(reserve)}</>}
                        {lot.assetLocation ? ` · ${lot.assetLocation}` : ''}
                      </p>
                    </div>
                    {draft && <span className="bidder-detail__lot-status bidder-detail__lot-status--saved">{t('bidder.browse.lots.bidSaved', { amount: formatEtbAmount(draft.amount) })}</span>}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {selectable && selectedLotIds.length > 0 && (
        <footer className="bidder-detail__lots-totals" aria-live="polite">
          <p className="bidder-detail__lots-totals-line">{t('bidder.browse.lots.selectedCount', { count: selectedLotIds.length })}</p>
          <p className="bidder-detail__lots-totals-line">{t('bidder.browse.lots.selectedTotalReserve', { amount: formatEtbAmount(selectedReserveTotal) })}</p>
          {selectedBidTotal > 0 && <p className="bidder-detail__lots-totals-line">{t('bidder.browse.lots.selectedTotalBids', { amount: formatEtbAmount(selectedBidTotal) })}</p>}
          {cpoPercentage > 0 && (
            <p className="bidder-detail__lots-totals-line bidder-detail__lots-totals-line--highlight">
              {cpoFromDrafts > 0
                ? t('bidder.browse.lots.selectedCpoFromBids', { amount: formatEtbAmount(cpoFromDrafts), coverage: coverageFromDrafts })
                : t('bidder.browse.lots.cpoFromBidsPending', { percentage: cpoPercentage })}
            </p>
          )}
        </footer>
      )}

      {selectable && selectedLotIds.length === 0 && (
        <p className="bidder-detail__lots-empty-selection" role="status">{t('bidder.browse.lots.noneSelected')}</p>
      )}

      {selectedAssetForModal && (
        <AssetDetailModal
          asset={selectedAssetForModal}
          onClose={() => setSelectedAssetForModal(null)}
        />
      )}
    </section>
  );
}

export default AuctionLotsPanel;
