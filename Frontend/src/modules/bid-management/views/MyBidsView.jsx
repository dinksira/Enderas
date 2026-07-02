import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRegisterPageSearch } from '@enderass/shared/contexts';
import { StatusPill } from '../../../components/admin/StatusPill.jsx';
import { BidderRecordCard, BidderRecordCardGrid } from '../../../components/bidder/BidderRecordCard.jsx';
import { formatEtbAmount } from '@enderass/shared/utils';
import { BidDetailDrawer } from '../components/BidDetailDrawer.jsx';
import { useMyBids } from '../hooks/use-bids.js';
import {
  BID_PAGE_SIZE,
  formatDate,
  getBidStatusVariant,
} from '../utils/bid-management-utils.js';

export function MyBidsView() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'am' ? 'am' : 'en';
  const isAmharic = locale === 'am';

  const {
    search,
    setSearch,
    page,
    items: bids,
    pagination,
    loading,
    error,
    refetch,
    goToPrevPage,
    goToNextPage,
  } = useMyBids();

  useRegisterPageSearch({
    value: search,
    onChange: setSearch,
    placeholder: t('bids.myBids.searchPlaceholder'),
  });

  const [selectedId, setSelectedId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDrawer = (id) => {
    setSelectedId(id);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedId(null);
  };

  const footerSummary = t('bids.myBids.table.footer', {
    from: bids.length === 0 ? 0 : (page - 1) * BID_PAGE_SIZE + 1,
    to: (page - 1) * BID_PAGE_SIZE + bids.length,
    total: pagination.total,
  });

  return (
    <div className={`kyc-management-page ${isAmharic ? 'kyc-management-page--am' : ''}`}>
      <BidderRecordCardGrid
        loading={loading}
        error={error}
        onRetry={refetch}
        emptyMessage={t('bids.myBids.empty')}
        footerSummary={footerSummary}
        page={page}
        pages={pagination.pages || 1}
        onPrevPage={goToPrevPage}
        onNextPage={goToNextPage}
        showPagination
        loadingLabel={t('admin.loading')}
        errorLabel={error ? t('dashboard.table.error', { message: error }) : undefined}
      >
        {bids.map((row) => (
          <BidderRecordCard
            key={row.id}
            title={row.auctionTitle || '—'}
            metrics={[
              {
                label: t('bids.myBids.table.headers.amount'),
                value: formatEtbAmount(row.amount),
              },
              {
                label: t('bids.myBids.table.headers.submitted_at'),
                value: formatDate(row.submittedAt, locale),
              },
            ]}
            status={(
              <StatusPill
                label={t(`bids.management.status.${row.status}`, { defaultValue: row.status })}
                variant={getBidStatusVariant(row.status)}
              />
            )}
            ctaLabel={t('bids.myBids.viewAction')}
            onOpen={() => openDrawer(row.id)}
            ariaLabel={t('bids.myBids.openDetail', { name: row.auctionTitle })}
          />
        ))}
      </BidderRecordCardGrid>

      <BidDetailDrawer bidId={selectedId} open={drawerOpen} onClose={closeDrawer} />
    </div>
  );
}

export default MyBidsView;
