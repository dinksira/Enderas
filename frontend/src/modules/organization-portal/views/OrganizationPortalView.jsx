import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@enderass/shared/auth';
import { BidderRecordCard, BidderRecordCardGrid } from '../../../components/bidder/BidderRecordCard.jsx';
import { useOrganizationPortal } from '../hooks/use-organization-portal.js';
import { statusPillClass } from '../../assets/utils/asset-form-utils.js';

function statusLabel(status, t) {
  const overrides = {
    pending_review: t('assets.status.pending_review', { defaultValue: 'Pending Review' }),
    approved: t('assets.status.approved', { defaultValue: 'Approved' }),
    rejected: t('assets.status.rejected', { defaultValue: 'Rejected' }),
    under_evaluation: t('assets.status.under_evaluation', { defaultValue: 'Under Evaluation' }),
    evaluated: t('assets.status.evaluated', { defaultValue: 'Evaluated' }),
    in_auction: t('assets.status.in_auction', { defaultValue: 'In Auction' }),
    sold: t('assets.status.sold', { defaultValue: 'Sold' }),
  };
  return overrides[status] || status.replace(/_/g, ' ');
}

function auctionStatusLabel(status, t) {
  const overrides = {
    draft: t('auctions.status.draft', { defaultValue: 'Draft' }),
    pending_approval: t('auctions.status.pending_approval', { defaultValue: 'Pending Approval' }),
    published: t('auctions.status.published', { defaultValue: 'Published' }),
    suspended: t('auctions.status.suspended', { defaultValue: 'Suspended' }),
    closed: t('auctions.status.closed', { defaultValue: 'Closed' }),
    cancelled: t('auctions.status.cancelled', { defaultValue: 'Cancelled' }),
  };
  return overrides[status] || status.replace(/_/g, ' ');
}

function auctionStatusVariant(status) {
  if (status === 'published') return 'active';
  if (status === 'closed' || status === 'cancelled') return 'closed';
  if (status === 'suspended') return 'suspended';
  return 'pending';
}

export function OrganizationPortalView() {
  const { t } = useTranslation();
  const { profile, stats, assets, linkedAuctions, loading, error, reload } = useOrganizationPortal();
  const user = useAuthStore((state) => state.user);

  const orgName = profile?.organizationName || user?.displayName || t('organizationPortal.fallback');
  const displayStatus = profile?.status || user?.status;

  const filteredAssets = useMemo(() => {
    if (!assets) return [];
    return [...assets].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [assets]);

  return (
    <section className="asset-page">
      <header className="asset-page__header asset-page__header--row">
        <div>
          <h1 className="asset-page__title">{t('organizationPortal.pageTitle')}</h1>
          <p className="asset-page__lead">{t('organizationPortal.subtitle')}</p>
        </div>
      </header>

      {profile && (
        <div className="asset-stats-grid" style={{ marginBottom: 'var(--core-space-4)' }}>
          <div className="asset-stat-card">
            <span className="asset-stat-card__label">{t('organizationPortal.orgName')}</span>
            <p style={{ margin: '4px 0 0', fontSize: 'var(--core-font-size-body)', fontWeight: 600 }}>
              {profile.organizationName}
            </p>
          </div>
          <div className="asset-stat-card">
            <span className="asset-stat-card__label">{t('organizationPortal.tinNumber')}</span>
            <p style={{ margin: '4px 0 0', fontSize: 'var(--core-font-size-body)', fontWeight: 600 }}>
              {profile.tinNumber || '\u2014'}
            </p>
          </div>
          <div className="asset-stat-card">
            <span className="asset-stat-card__label">{t('organizationPortal.contact')}</span>
            <p style={{ margin: '4px 0 0', fontSize: 'var(--core-font-size-body)', fontWeight: 600 }}>
              {profile.mobileNumber}
            </p>
            {profile.email && (
              <p style={{ margin: '2px 0 0', fontSize: 'var(--core-font-size-caption)', color: 'var(--semantic-color-text-secondary)' }}>
                {profile.email}
              </p>
            )}
          </div>
          <div className="asset-stat-card">
            <span className="asset-stat-card__label">{t('organizationPortal.status')}</span>
            <span
              className={`asset-status-pill ${displayStatus === 'active' ? 'asset-status-pill--approved' : displayStatus === 'suspended' ? 'asset-status-pill--rejected' : 'asset-status-pill--pending'}`}
              style={{ marginTop: '4px' }}
            >
              {displayStatus?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </span>
          </div>
        </div>
      )}

      {stats && (
        <div className="metrics-card-grid">
          <div className="metrics-card-grid__card">
            <span className="metrics-card-grid__label">{t('organizationPortal.stats.linkedAuctions')}</span>
            <span className="metrics-card-grid__value">{stats.linkedAuctions}</span>
          </div>
          <div className="metrics-card-grid__card">
            <span className="metrics-card-grid__label">{t('organizationPortal.stats.activeLinkedAuctions')}</span>
            <span className="metrics-card-grid__value">{stats.activeLinkedAuctions}</span>
          </div>
          <div className="metrics-card-grid__card">
            <span className="metrics-card-grid__label">{t('organizationPortal.stats.totalAssets')}</span>
            <span className="metrics-card-grid__value">{stats.totalAssets}</span>
          </div>
          <div className="metrics-card-grid__card">
            <span className="metrics-card-grid__label">{t('organizationPortal.stats.inAuction')}</span>
            <span className="metrics-card-grid__value">{stats.inAuction}</span>
          </div>
          <div className="metrics-card-grid__card">
            <span className="metrics-card-grid__label">{t('organizationPortal.stats.sold')}</span>
            <span className="metrics-card-grid__value">{stats.sold}</span>
          </div>
          <div className="metrics-card-grid__card">
            <span className="metrics-card-grid__label">{t('organizationPortal.stats.pending')}</span>
            <span className="metrics-card-grid__value">{stats.pendingReview}</span>
          </div>
        </div>
      )}

      {linkedAuctions.length > 0 && (
        <section style={{ marginBottom: 'var(--core-space-6)' }}>
          <h2 className="org-portal-section-title">{t('organizationPortal.linkedAuctionsTitle')}</h2>
          <div className="org-portal-auction-grid">
            {linkedAuctions.map((auction) => (
              <div key={auction.id} className="org-portal-auction-card">
                <div className="org-portal-auction-card__header">
                  <strong className="org-portal-auction-card__title">{auction.title}</strong>
                  <span
                    className={`dashboard-status-pill dashboard-status-pill--${auctionStatusVariant(auction.status)}`}
                  >
                    {auctionStatusLabel(auction.status, t)}
                  </span>
                </div>
                <div className="org-portal-auction-card__dates">
                  {t('organizationPortal.auctionDateRange', {
                    start: new Date(auction.startDate).toLocaleDateString(),
                    end: new Date(auction.endDate).toLocaleDateString(),
                  })}
                </div>
                <div className="org-portal-auction-card__footer">
                  <span className="org-portal-auction-card__meta">
                    {t('organizationPortal.linkedAt')}: {new Date(auction.linkedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <h2 className="org-portal-section-title">{t('bidder.myassets')}</h2>

      <BidderRecordCardGrid
        loading={loading}
        error={error}
        onRetry={reload}
        emptyMessage={t('organizationPortal.assetsEmpty')}
        footerSummary={t('dashboard.table.footer_displayed', { count: filteredAssets.length })}
        skeletonCount={4}
      >
        {filteredAssets.map((asset) => {
          const assetTypeLabel = t(`assets.types.${asset.assetType}`, { defaultValue: asset.assetType });
          const metrics = [
            { label: t('organizationPortal.assetType'), value: assetTypeLabel },
          ];

          if (asset.auction) {
            metrics.push(
              { label: t('organizationPortal.auctionStatus'), value: auctionStatusLabel(asset.auction.status, t) },
              { label: t('organizationPortal.auctionPeriod'), value: `${new Date(asset.auction.startDate).toLocaleDateString()} - ${new Date(asset.auction.endDate).toLocaleDateString()}` },
            );
          }

          if (asset.desiredReservePrice) {
            metrics.push({
              label: t('organizationPortal.reservePrice'),
              value: `${Number(asset.desiredReservePrice).toLocaleString()} ETB`,
            });
          }

          return (
            <BidderRecordCard
              key={asset.id}
              title={asset.title}
              eyebrow={assetTypeLabel}
              metrics={metrics}
              status={
                <span className={`asset-status-pill ${statusPillClass(asset.status)}`}>
                  {statusLabel(asset.status, t)}
                </span>
              }
              ctaLabel={t('bidder.browse.view')}
              onOpen={() => {}}
              ariaLabel={`${t('organizationPortal.assetDetail')}: ${asset.title}`}
            />
          );
        })}
      </BidderRecordCardGrid>
    </section>
  );
}

export default OrganizationPortalView;
