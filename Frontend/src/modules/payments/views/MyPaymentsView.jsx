import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useRegisterPageSearch } from '@enderass/shared/contexts';
import { ROUTES } from '../../../config/routes.js';
import { StatusPill } from '../../../components/admin/StatusPill.jsx';
import { BidderRecordCard, BidderRecordCardGrid } from '../../../components/bidder/BidderRecordCard.jsx';
import { formatEtbAmount } from '@enderass/shared/utils';
import { PaymentDetailDrawer } from '../components/PaymentDetailDrawer.jsx';
import { usePayments } from '../hooks/use-payments.js';
import {
  formatDate,
  getPaymentStatusVariant,
  PAYMENT_PAGE_SIZE,
} from '../utils/payment-management-utils.js';

export function MyPaymentsView() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'am' ? 'am' : 'en';

  const {
    search,
    setSearch,
    page,
    items: payments,
    pagination,
    loading,
    error,
    refetch,
    goToPrevPage,
    goToNextPage,
  } = usePayments();

  useRegisterPageSearch({
    value: search,
    onChange: setSearch,
    placeholder: t('payments.my.searchPlaceholder'),
  });

  const [selectedId, setSelectedId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDrawer = (id) => {
    setSelectedId(id);
    setDrawerOpen(true);
  };

  const footerSummary = t('payments.my.table.footer', {
    from: payments.length === 0 ? 0 : (page - 1) * PAYMENT_PAGE_SIZE + 1,
    to: (page - 1) * PAYMENT_PAGE_SIZE + payments.length,
    total: pagination.total,
  });

  return (
    <div className="kyc-management-page">
      <section className="browse-auctions__toolbar" aria-label={t('payments.my.payHintTitle')}>
        <div className="browse-auctions__toolbar-copy">
          <p className="browse-auctions__toolbar-title">{t('payments.my.payHintTitle')}</p>
          <p className="browse-auctions__toolbar-hint">{t('payments.my.payHintBody')}</p>
        </div>
        <Link to={ROUTES.APP_BROWSE_AUCTIONS} className="dashboard-filters__cta browse-auctions__request-btn">
          {t('payments.my.browseCta')}
        </Link>
      </section>

      <BidderRecordCardGrid
        loading={loading}
        error={error}
        onRetry={refetch}
        emptyMessage={t('payments.my.empty')}
        footerSummary={footerSummary}
        page={page}
        pages={pagination.pages || 1}
        onPrevPage={goToPrevPage}
        onNextPage={goToNextPage}
        showPagination
        loadingLabel={t('admin.loading')}
        errorLabel={error ? t('dashboard.table.error', { message: error }) : undefined}
      >
        {payments.map((row) => (
          <BidderRecordCard
            key={row.id}
            title={row.auctionTitle || '—'}
            metrics={[
              {
                label: t('payments.my.table.headers.amount'),
                value: formatEtbAmount(row.amount),
              },
              {
                label: t('payments.my.table.headers.created_at'),
                value: formatDate(row.createdAt, locale),
              },
            ]}
            status={(
              <StatusPill
                label={t(`payments.management.status.${row.status}`, { defaultValue: row.status })}
                variant={getPaymentStatusVariant(row.status)}
              />
            )}
            ctaLabel={t('payments.my.viewAction')}
            onOpen={() => openDrawer(row.id)}
            ariaLabel={t('payments.management.openDetail', { name: row.auctionTitle })}
          />
        ))}
      </BidderRecordCardGrid>

      <PaymentDetailDrawer
        paymentId={selectedId}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onApprove={() => {}}
        onReject={() => {}}
        onRefresh={refetch}
      />
    </div>
  );
}

export default MyPaymentsView;
