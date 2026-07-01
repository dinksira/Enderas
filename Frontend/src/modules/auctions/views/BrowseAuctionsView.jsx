import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useRegisterPageSearch } from '@enderass/shared/contexts';
import { useBrowseAuctions } from '../hooks/use-browse-auctions.js';
import { BidderAuctionDetailDrawer } from '../components/BidderAuctionDetailDrawer.jsx';
import {
  formatEtbAmount,
  normalizeAuctionStatus,
  statusPillClass,
} from '@enderass/shared/utils';
import {
  getParticipationStatusVariant,
  resolveParticipationStatus,
} from '../utils/participation-utils.js';
import { StatusPill } from '@enderass/shared/ui-admin';

const STATUS_FILTERS = ['', 'ACTIVE', 'CLOSED', 'SUSPENDED'];

export function BrowseAuctionsView() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category') || '';

  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const { records, loading, error } = useBrowseAuctions({
    status: statusFilter || undefined,
    search: search.trim() || undefined,
  });

  const filteredRecords = useMemo(() => {
    if (!categoryFilter) {
      return records;
    }
    return records.filter(
      (record) =>
        record.category === categoryFilter || record.categoryKey === categoryFilter,
    );
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
    <section className="asset-page">
      <div className="dashboard-filters" role="search">
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
                  {t('bidder.browse.myStatus')}
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
                  const myStatus = resolveParticipationStatus(record.myParticipation);
                  const myStatusVariant = getParticipationStatusVariant(myStatus);
                  return (
                    <tr
                      key={record.id}
                      className="dashboard-table__row kyc-management-page__row"
                      onClick={() => setSelectedId(record.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedId(record.id);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={t('bidder.browse.openDetail', { title: record.title })}
                    >
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
                        <StatusPill
                          label={t(`bidder.participation.status.${myStatus}.label`, {
                            defaultValue: myStatus,
                          })}
                          variant={myStatusVariant}
                        />
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
    </section>
  );
}

export default BrowseAuctionsView;
