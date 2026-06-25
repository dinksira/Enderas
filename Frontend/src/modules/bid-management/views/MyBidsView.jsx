import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminDataTable } from '../../../components/admin/AdminDataTable.jsx';
import { StatusPill } from '../../../components/admin/StatusPill.jsx';
import { formatEtbAmount } from '../../auctions/utils/auction-drawer-utils.js';
import { BidDetailDrawer } from '../components/BidDetailDrawer.jsx';
import { useMyBids } from '../hooks/use-bids.js';
import {
  BID_PAGE_SIZE,
  formatDate,
  getBidStatusVariant,
  MY_BID_TABLE_COLUMNS,
} from '../utils/bid-management-utils.js';

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

export function MyBidsView() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'am' ? 'am' : 'en';
  const isAmharic = locale === 'am';

  const {
    page,
    items: bids,
    pagination,
    loading,
    error,
    refetch,
    goToPrevPage,
    goToNextPage,
  } = useMyBids();

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
      <AdminDataTable
        loading={loading}
        error={error}
        onRetry={refetch}
        columns={MY_BID_TABLE_COLUMNS}
        getColumnLabel={(key) => t(`bids.myBids.table.headers.${key}`)}
        emptyMessage={t('bids.myBids.empty')}
        footerSummary={footerSummary}
        page={page}
        pages={pagination.pages || 1}
        onPrevPage={goToPrevPage}
        onNextPage={goToNextPage}
        showPagination
      >
        {bids.map((row) => (
          <tr
            key={row.id}
            className="dashboard-table__row kyc-management-page__row"
            onClick={() => openDrawer(row.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openDrawer(row.id);
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={t('bids.myBids.openDetail', { name: row.auctionTitle })}
          >
            <td className="dashboard-table__cell dashboard-table__cell--strong">{row.auctionTitle || '—'}</td>
            <td className="dashboard-table__cell dashboard-table__cell--strong">
              {formatEtbAmount(row.amount)}
            </td>
            <td className="dashboard-table__cell">
              <StatusPill
                label={t(`bids.management.status.${row.status}`, { defaultValue: row.status })}
                variant={getBidStatusVariant(row.status)}
              />
            </td>
            <td className="dashboard-table__cell">{formatDate(row.submittedAt, locale)}</td>
            <td className="dashboard-table__cell">
              <div className="dashboard-actions">
                <ViewActionButton
                  label={t('bids.myBids.viewAction')}
                  onClick={(event) => {
                    event.stopPropagation();
                    openDrawer(row.id);
                  }}
                />
              </div>
            </td>
          </tr>
        ))}
      </AdminDataTable>

      <BidDetailDrawer bidId={selectedId} open={drawerOpen} onClose={closeDrawer} />
    </div>
  );
}

export default MyBidsView;
