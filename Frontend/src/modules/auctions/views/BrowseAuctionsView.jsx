import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MODULES } from '../../../config/navigation.config.js';
import { usePermission } from '../../../core/auth/usePermission.js';
import { RequestAuctionWizardModal } from '../../assets/components/RequestAuctionWizardModal.jsx';
import { useBrowseAuctions } from '../hooks/use-browse-auctions.js';
import { BidderAuctionDetailDrawer } from '../components/BidderAuctionDetailDrawer.jsx';
import {
  formatEtbAmount,
  normalizeAuctionStatus,
  statusPillClass,
} from '../utils/auction-drawer-utils.js';

const STATUS_FILTERS = ['', 'ACTIVE', 'CLOSED', 'SUSPENDED'];

export function BrowseAuctionsView() {
  const { t } = useTranslation();
  const { canCreate } = usePermission();
  const canRequestAuction = canCreate(MODULES.ASSETS);

  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  const { records, loading, error } = useBrowseAuctions({
    status: statusFilter || undefined,
    search: search.trim() || undefined,
  });

  const sortedRecords = useMemo(
    () => [...records].sort((a, b) => new Date(b.startDate) - new Date(a.startDate)),
    [records],
  );

  return (
    <section className="asset-page">
      <header className="asset-page__header">
        <h1 className="asset-page__title">{t('bidder.browse.title')}</h1>
        <p className="asset-page__lead">{t('bidder.browse.subtitle')}</p>
      </header>

      <div className="dashboard-filters" role="search">
        <input
          type="search"
          className="dashboard-filters__search"
          placeholder={t('bidder.browse.searchPlaceholder')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label={t('bidder.browse.searchPlaceholder')}
        />
        <div className="dashboard-filters__pills" role="group" aria-label={t('dashboard.a11y.status_filters')}>
          {STATUS_FILTERS.map((filter) => {
            const label = filter
              ? t(`dashboard.filters.${filter.toLowerCase()}`, filter)
              : t('dashboard.filters.all');
            const isActive = statusFilter === filter;
            return (
              <button
                key={filter || 'all'}
                type="button"
                className={`dashboard-filters__pill${isActive ? ' dashboard-filters__pill--active' : ''}`}
                onClick={() => setStatusFilter(filter)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {canRequestAuction && (
        <section className="browse-auctions__toolbar" aria-label={t('assets.requestWizard.toolbar.ariaLabel')}>
          <div className="browse-auctions__toolbar-copy">
            <p className="browse-auctions__toolbar-title">{t('assets.requestWizard.toolbar.title')}</p>
            <p className="browse-auctions__toolbar-hint">{t('assets.requestWizard.toolbar.hint')}</p>
          </div>
          <button
            type="button"
            className="dashboard-filters__cta browse-auctions__request-btn"
            onClick={() => setWizardOpen(true)}
          >
            {t('assets.requestWizard.toolbar.cta')}
          </button>
        </section>
      )}

      <section className="dashboard-table-panel" aria-live="polite">
        <div className="dashboard-table-scroll">
          <table className="dashboard-table">
            <thead>
              <tr className="dashboard-table__head-row">
                <th scope="col" className="dashboard-table__head-cell">
                  {t('dashboard.table.headers.auction_title')}
                </th>
                <th scope="col" className="dashboard-table__head-cell">
                  {t('dashboard.table.headers.category')}
                </th>
                <th scope="col" className="dashboard-table__head-cell">
                  {t('dashboard.table.headers.status')}
                </th>
                <th scope="col" className="dashboard-table__head-cell">
                  {t('dashboard.table.headers.ending_date')}
                </th>
                <th scope="col" className="dashboard-table__head-cell">
                  {t('dashboard.table.headers.reserve_etb')}
                </th>
                <th scope="col" className="dashboard-table__head-cell">
                  {t('dashboard.table.headers.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="dashboard-table__empty">
                    {t('dashboard.table.loading')}
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan={6} className="dashboard-table__empty" role="alert">
                    {t('dashboard.table.error', { message: error })}
                  </td>
                </tr>
              )}

              {!loading && !error && sortedRecords.length === 0 && (
                <tr>
                  <td colSpan={6} className="dashboard-table__empty">
                    {t('bidder.browse.empty')}
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                sortedRecords.map((record) => {
                  const displayStatus = normalizeAuctionStatus(record.status);
                  return (
                    <tr key={record.id} className="dashboard-table__row">
                      <td className="dashboard-table__cell dashboard-table__cell--strong">
                        {record.title}
                      </td>
                      <td className="dashboard-table__cell">{record.category}</td>
                      <td className="dashboard-table__cell">
                        <span className={`dashboard-status-pill ${statusPillClass(displayStatus)}`}>
                          {t(`dashboard.filters.${displayStatus.toLowerCase()}`, displayStatus)}
                        </span>
                      </td>
                      <td className="dashboard-table__cell">
                        {record.endingDate || record.endDateFormatted || '—'}
                      </td>
                      <td className="dashboard-table__cell">
                        {formatEtbAmount(record.reservePrice ?? record.reserve)}
                      </td>
                      <td className="dashboard-table__cell">
                        <button
                          type="button"
                          className="dashboard-filters__cta"
                          onClick={() => setSelectedId(record.id)}
                        >
                          {t('bidder.browse.view')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>

      <BidderAuctionDetailDrawer
        auctionId={selectedId}
        open={Boolean(selectedId)}
        onClose={() => setSelectedId(null)}
      />

      <RequestAuctionWizardModal
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
      />
    </section>
  );
}

export default BrowseAuctionsView;
