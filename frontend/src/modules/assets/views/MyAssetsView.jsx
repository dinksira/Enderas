import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useRegisterPageSearch } from '@enderass/shared/contexts';
import { BidderRecordCard, BidderRecordCardGrid } from '../../../components/bidder/BidderRecordCard.jsx';
import { RequestAuctionWizardModal } from '../components/RequestAuctionWizardModal.jsx';
import { AssetDetailDrawer } from '../components/AssetDetailDrawer.jsx';
import { useMyAssets } from '../hooks/use-my-assets.js';
import { normalizeAssetStatus, statusPillClass } from '../utils/asset-form-utils.js';

export function MyAssetsView() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const { records, loading, error, refetch } = useMyAssets();
  const [selectedId, setSelectedId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setWizardOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useRegisterPageSearch({
    value: search,
    onChange: setSearch,
    placeholder: t('assets.my.searchPlaceholder'),
  });

  const sortedRecords = useMemo(
    () => [...records].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)),
    [records],
  );

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return sortedRecords;
    }

    return sortedRecords.filter((record) => {
      const haystack = [
        record.title,
        record.assetType,
        record.category,
        record.status,
        record.location,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [search, sortedRecords]);

  const openDrawer = (id) => {
    setSelectedId(id);
    setDrawerOpen(true);
  };

  const handleWizardSuccess = () => {
    setWizardOpen(false);
    refetch();
  };

  return (
    <section className="asset-page">
      <header className="asset-page__header asset-page__header--row">
        <div>
          <h1 className="asset-page__title">{t('assets.my.title')}</h1>
          <p className="asset-page__lead">{t('assets.my.subtitle')}</p>
        </div>
        <button
          type="button"
          className="dashboard-filters__cta"
          onClick={() => setWizardOpen(true)}
        >
          {t('assets.my.submitNew')}
        </button>
      </header>

      <BidderRecordCardGrid
        loading={loading}
        error={error}
        onRetry={refetch}
        emptyMessage={t('assets.my.empty')}
        footerSummary={t('dashboard.table.footer_displayed', { count: filteredRecords.length })}
        footerActions={(
          <button type="button" className="asset-page__refresh" onClick={refetch}>
            {t('assets.my.refresh')}
          </button>
        )}
        loadingLabel={t('dashboard.table.loading')}
        errorLabel={error ? t('dashboard.table.error', { message: error }) : undefined}
      >
        {filteredRecords.map((record) => {
          const displayStatus = normalizeAssetStatus(record.status);
          return (
            <BidderRecordCard
              key={record.id}
              title={record.title}
              eyebrow={t(`assets.types.${record.assetType}`, { defaultValue: record.assetType })}
              metrics={[
                {
                  label: t('assets.table.headers.submitted'),
                  value: record.submittedAtFormatted || '—',
                },
                {
                  label: t('assets.table.headers.type'),
                  value: t(`assets.types.${record.assetType}`, { defaultValue: record.assetType }),
                },
              ]}
              status={(
                <span className={`asset-status-pill ${statusPillClass(record.status)}`}>
                  {t(`assets.status.${displayStatus.toLowerCase()}`, {
                    defaultValue: displayStatus.replace(/_/g, ' '),
                  })}
                </span>
              )}
              footerExtra={
                displayStatus === 'REJECTED' && record.rejectionReason ? (
                  <p className="bidder-record-card__note" role="note">
                    {t('assets.my.rejectionReason', { reason: record.rejectionReason })}
                  </p>
                ) : null
              }
              ctaLabel={t('bidder.browse.view')}
              onOpen={() => openDrawer(record.id)}
              ariaLabel={`${t('assets.my.drawer.title')}: ${record.title}`}
            />
          );
        })}
      </BidderRecordCardGrid>

      <AssetDetailDrawer
        assetId={selectedId}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      <RequestAuctionWizardModal
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSuccess={handleWizardSuccess}
      />
    </section>
  );
}

export default MyAssetsView;
