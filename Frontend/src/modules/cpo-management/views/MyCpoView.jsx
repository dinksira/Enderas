import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRegisterPageSearch } from '@enderass/shared/contexts';
import { StatusPill } from '../../../components/admin/StatusPill.jsx';
import { BidderRecordCard, BidderRecordCardGrid } from '../../../components/bidder/BidderRecordCard.jsx';
import { CpoDetailDrawer } from '../../cpo-management/components/CpoDetailDrawer.jsx';
import { useCpoRecords } from '../../cpo-management/hooks/use-cpo-records.js';
import {
  CPO_PAGE_SIZE,
  formatDate,
  getCpoStatusVariant,
} from '../../cpo-management/utils/cpo-management-utils.js';

export function MyCpoView() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'am' ? 'am' : 'en';

  const {
    search,
    setSearch,
    page,
    items: cpos,
    pagination,
    loading,
    error,
    refetch,
    goToPrevPage,
    goToNextPage,
  } = useCpoRecords();

  useRegisterPageSearch({
    value: search,
    onChange: setSearch,
    placeholder: t('cpo.my.searchPlaceholder'),
  });

  const [selectedId, setSelectedId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDrawer = (id) => {
    setSelectedId(id);
    setDrawerOpen(true);
  };

  const footerSummary = t('cpo.my.table.footer', {
    from: cpos.length === 0 ? 0 : (page - 1) * CPO_PAGE_SIZE + 1,
    to: (page - 1) * CPO_PAGE_SIZE + cpos.length,
    total: pagination.total,
  });

  return (
    <div className="kyc-management-page">
      <BidderRecordCardGrid
        loading={loading}
        error={error}
        onRetry={refetch}
        emptyMessage={t('cpo.my.empty')}
        footerSummary={footerSummary}
        page={page}
        pages={pagination.pages || 1}
        onPrevPage={goToPrevPage}
        onNextPage={goToNextPage}
        showPagination
        loadingLabel={t('admin.loading')}
        errorLabel={error ? t('dashboard.table.error', { message: error }) : undefined}
      >
        {cpos.map((row) => (
          <BidderRecordCard
            key={row.id}
            title={row.auctionTitle || '—'}
            metrics={[
              {
                label: t('cpo.my.table.headers.created_at'),
                value: formatDate(row.createdAt, locale),
              },
            ]}
            status={(
              <StatusPill
                label={t(`cpo.management.status.${row.status}`, { defaultValue: row.status })}
                variant={getCpoStatusVariant(row.status)}
              />
            )}
            ctaLabel={t('cpo.my.viewAction')}
            onOpen={() => openDrawer(row.id)}
            ariaLabel={t('cpo.management.openDetail', { name: row.auctionTitle })}
          />
        ))}
      </BidderRecordCardGrid>

      <CpoDetailDrawer
        cpoId={selectedId}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onApprove={() => {}}
        onReject={() => {}}
        onRefresh={refetch}
      />
    </div>
  );
}

export default MyCpoView;
