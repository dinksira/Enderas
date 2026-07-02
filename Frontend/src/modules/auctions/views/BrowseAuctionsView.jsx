import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useRegisterPageSearch } from '@enderass/shared/contexts';
import { useAuthStore } from '@enderass/shared/auth';
import { useBrowseAuctions } from '../hooks/use-browse-auctions.js';
import { BidderAuctionDetailDrawer } from '../components/BidderAuctionDetailDrawer.jsx';
import { BrowseAuctionCard, BrowseAuctionCardSkeleton } from '../components/BrowseAuctionCard.jsx';
import { KYCStatusBanner } from '../../../components/KYCStatusBanner.jsx';

export function BrowseAuctionsView() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category') || '';
  const canParticipate = useAuthStore((state) => state.canParticipateInAuctions());

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const { records, loading, error } = useBrowseAuctions({
    status: 'ACTIVE',
    search: search.trim() || undefined,
  });

  const filteredRecords = useMemo(() => {
    let next = records;

    if (categoryFilter) {
      next = next.filter(
        (record) =>
          record.category === categoryFilter || record.categoryKey === categoryFilter,
      );
    }

    return next.filter((record) => String(record.status || '').toUpperCase() === 'ACTIVE');
  }, [records, categoryFilter]);

  useRegisterPageSearch({
    value: search,
    onChange: setSearch,
    placeholder: t('bidder.browse.searchPlaceholder'),
  });

  const sortedRecords = useMemo(
    () => [...filteredRecords].sort((a, b) => new Date(b.startDate) - new Date(a.startDate)),
    [filteredRecords],
  );

  return (
    <section className="asset-page browse-auctions-page">
      <KYCStatusBanner />
      <section className="browse-auctions__grid-panel" aria-live="polite">
        {loading && (
          <div className="browse-auctions__grid" aria-busy="true">
            {Array.from({ length: 6 }, (_, index) => (
              <BrowseAuctionCardSkeleton key={index} />
            ))}
            <p className="visually-hidden">{t('dashboard.table.loading')}</p>
          </div>
        )}

        {!loading && error && (
          <p className="browse-auctions__message browse-auctions__message--error" role="alert">
            {t('dashboard.table.error', { message: error })}
          </p>
        )}

        {!loading && !error && sortedRecords.length === 0 && (
          <p className="browse-auctions__message" role="status">
            {t('bidder.browse.empty')}
          </p>
        )}

        {!loading && !error && sortedRecords.length > 0 && (
          <div className="browse-auctions__grid">
            {sortedRecords.map((record) => (
              <BrowseAuctionCard
                key={record.id}
                auction={record}
                onOpen={canParticipate ? setSelectedId : undefined}
                disabled={!canParticipate}
              />
            ))}
          </div>
        )}
      </section>

      {canParticipate && (
        <BidderAuctionDetailDrawer
          auctionId={selectedId}
          open={Boolean(selectedId)}
          onClose={() => setSelectedId(null)}
        />
      )}
    </section>
  );
}

export default BrowseAuctionsView;
