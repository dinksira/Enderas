import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../../config/routes.js';
import { AdminDataTable } from '../../../components/admin/AdminDataTable.jsx';
import { StatusPill } from '../../../components/admin/StatusPill.jsx';
import { formatEtbAmount } from '../../auctions/utils/auction-drawer-utils.js';
import { PaymentDetailDrawer } from '../components/PaymentDetailDrawer.jsx';
import { usePayments } from '../hooks/use-payments.js';
import {
  formatDate,
  getPaymentStatusVariant,
  PAYMENT_PAGE_SIZE,
} from '../utils/payment-management-utils.js';

const MY_PAYMENT_COLUMNS = Object.freeze(['auction_title', 'amount', 'status', 'created_at', 'actions']);

function ViewActionButton({ label, onClick }) {
  return (
    <button type="button" className="dashboard-actions__btn" aria-label={label} onClick={onClick}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 5c4.632 0 8 5.878 8 7s-3.368 7-8 7-8-5.878-8-7 3.368-7 8-7z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    </button>
  );
}

export function MyPaymentsView() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'am' ? 'am' : 'en';

  const {
    page,
    items: payments,
    pagination,
    loading,
    error,
    refetch,
    goToPrevPage,
    goToNextPage,
  } = usePayments();

  const [selectedId, setSelectedId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

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

      <AdminDataTable
        loading={loading}
        error={error}
        onRetry={refetch}
        columns={MY_PAYMENT_COLUMNS}
        getColumnLabel={(key) => t(`payments.my.table.headers.${key}`)}
        emptyMessage={t('payments.my.empty')}
        footerSummary={footerSummary}
        page={page}
        pages={pagination.pages || 1}
        onPrevPage={goToPrevPage}
        onNextPage={goToNextPage}
        showPagination
      >
        {payments.map((row) => (
          <tr
            key={row.id}
            className="dashboard-table__row kyc-management-page__row"
            onClick={() => {
              setSelectedId(row.id);
              setDrawerOpen(true);
            }}
            tabIndex={0}
            role="button"
          >
            <td className="dashboard-table__cell dashboard-table__cell--strong">{row.auctionTitle || '—'}</td>
            <td className="dashboard-table__cell">{formatEtbAmount(row.amount)}</td>
            <td className="dashboard-table__cell">
              <StatusPill
                label={t(`payments.management.status.${row.status}`, { defaultValue: row.status })}
                variant={getPaymentStatusVariant(row.status)}
              />
            </td>
            <td className="dashboard-table__cell">{formatDate(row.createdAt, locale)}</td>
            <td className="dashboard-table__cell">
              <ViewActionButton
                label={t('payments.my.viewAction')}
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedId(row.id);
                  setDrawerOpen(true);
                }}
              />
            </td>
          </tr>
        ))}
      </AdminDataTable>

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
