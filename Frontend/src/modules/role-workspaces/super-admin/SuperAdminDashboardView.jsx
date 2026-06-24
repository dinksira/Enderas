import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuctions } from '../../auctions/hooks/use-auctions.js';

const FILTER_KEYS = ['all', 'active', 'pending', 'closed', 'suspended'];

const TABLE_HEADER_KEYS = [
  'id',
  'auction_title',
  'category',
  'status',
  'starting_date',
  'ending_date',
  'bids',
  'reserve_etb',
  'actions',
];

const DEMO_RECORDS = [
  {
    id: 'A-1042',
    title: 'Toyota Land Cruiser 2020',
    categoryKey: 'vehicles',
    status: 'ACTIVE',
    startingDate: '01 Jun 2026',
    endingDate: '15 Jun 2026',
    bids: 12,
    reserve: 500000,
  },
  {
    id: 'A-1043',
    title: 'Commercial Plot — Bole',
    categoryKey: 'real_estate',
    status: 'PENDING',
    startingDate: '05 Jun 2026',
    endingDate: '20 Jun 2026',
    bids: 0,
    reserve: 8500000,
  },
  {
    id: 'A-1044',
    title: 'Industrial Crane Set',
    categoryKey: 'equipment',
    status: 'SUSPENDED',
    startingDate: '10 May 2026',
    endingDate: '25 May 2026',
    bids: 11,
    reserve: 1200000,
  },
  {
    id: 'A-1045',
    title: 'Office Furniture Bundle',
    categoryKey: 'assets',
    status: 'CLOSED',
    startingDate: '01 Apr 2026',
    endingDate: '14 Apr 2026',
    bids: 8,
    reserve: 500000,
  },
];

function normalizeStatus(status) {
  return String(status || 'PENDING').toUpperCase();
}

function toCategoryKey(value) {
  return String(value || 'general')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

function statusPillClass(status) {
  const key = normalizeStatus(status);
  const map = {
    ACTIVE: 'dashboard-status-pill--active',
    PENDING: 'dashboard-status-pill--pending',
    SUSPENDED: 'dashboard-status-pill--suspended',
    CLOSED: 'dashboard-status-pill--closed',
  };
  return map[key] || 'dashboard-status-pill--pending';
}

function mapRecord(record, index) {
  const rawCategory = record.category ?? record.assetCategory ?? 'general';

  return {
    id: record.id ?? record.auctionId ?? `A-${String(index + 1).padStart(4, '0')}`,
    title: record.title ?? record.auction ?? record.name ?? 'Untitled Auction',
    categoryKey: record.categoryKey ?? toCategoryKey(rawCategory),
    status: normalizeStatus(record.status),
    startingDate: record.startingDate ?? record.startDate ?? '—',
    endingDate: record.endingDate ?? record.endDate ?? '—',
    bids: record.bids ?? record.bidCount ?? 0,
    reserve: record.reserve ?? record.reserveAmount ?? 0,
  };
}

function formatReserve(value) {
  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return '—';
  }
  return new Intl.NumberFormat('en-ET').format(amount);
}

export function SuperAdminDashboardView() {
  const { t } = useTranslation();
  const { records, loading, error } = useAuctions();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const normalizedRecords = useMemo(() => {
    const source = records.length > 0 ? records : DEMO_RECORDS;
    return source.map(mapRecord);
  }, [records]);

  const filteredRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return normalizedRecords.filter((record) => {
      const matchesFilter =
        activeFilter === 'all' || normalizeStatus(record.status) === activeFilter.toUpperCase();
      const localizedCategory = t(`category.${record.categoryKey}`).toLowerCase();
      const localizedStatus = t(`status.${record.status.toLowerCase()}`).toLowerCase();
      const matchesSearch =
        !query ||
        record.id.toLowerCase().includes(query) ||
        record.title.toLowerCase().includes(query) ||
        localizedCategory.includes(query) ||
        localizedStatus.includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [normalizedRecords, activeFilter, searchQuery, t]);

  return (
    <>
      <section className="dashboard-filters" aria-label={t('dashboard.a11y.auction_filters')}>
        <div className="dashboard-filters__tabs" role="tablist" aria-label={t('dashboard.a11y.status_filters')}>
          {FILTER_KEYS.map((filterKey) => {
            const isActive = activeFilter === filterKey;
            return (
              <button
                key={filterKey}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={[
                  'dashboard-filters__tab',
                  isActive ? 'dashboard-filters__tab--active' : '',
                  filterKey !== 'all' ? 'dashboard-filters__tab--uppercase' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => setActiveFilter(filterKey)}
              >
                {t(`dashboard.filters.${filterKey}`)}
              </button>
            );
          })}
        </div>
        <button type="button" className="dashboard-filters__cta">
          {t('dashboard.buttons.create_auction')}
        </button>
      </section>

      <section className="dashboard-table-panel" aria-live="polite">
        <div className="dashboard-table-scroll">
          <table className="dashboard-table">
            <thead>
              <tr className="dashboard-table__head-row">
                {TABLE_HEADER_KEYS.map((headerKey) => (
                  <th key={headerKey} scope="col" className="dashboard-table__head-cell">
                    {t(`dashboard.table.headers.${headerKey}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={TABLE_HEADER_KEYS.length} className="dashboard-table__empty">
                    {t('dashboard.table.loading')}
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td
                    colSpan={TABLE_HEADER_KEYS.length}
                    className="dashboard-table__empty"
                    role="alert"
                  >
                    {t('dashboard.table.error', { message: error })}
                  </td>
                </tr>
              )}

              {!loading && !error && filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={TABLE_HEADER_KEYS.length} className="dashboard-table__empty">
                    {t('dashboard.table.no_results')}
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                filteredRecords.map((record) => (
                  <tr key={record.id} className="dashboard-table__row">
                    <td className="dashboard-table__cell dashboard-table__cell--strong">
                      {record.id}
                    </td>
                    <td className="dashboard-table__cell">{record.title}</td>
                    <td className="dashboard-table__cell dashboard-table__cell--muted">
                      {t(`category.${record.categoryKey}`)}
                    </td>
                    <td className="dashboard-table__cell">
                      <span
                        className={`dashboard-status-pill ${statusPillClass(record.status)}`}
                      >
                        {t(`status.${record.status.toLowerCase()}`)}
                      </span>
                    </td>
                    <td className="dashboard-table__cell">{record.startingDate}</td>
                    <td className="dashboard-table__cell">{record.endingDate}</td>
                    <td className="dashboard-table__cell dashboard-table__cell--strong">
                      {record.bids}
                    </td>
                    <td className="dashboard-table__cell dashboard-table__cell--strong">
                      {formatReserve(record.reserve)}
                    </td>
                    <td className="dashboard-table__cell">
                      <div className="dashboard-actions">
                        <button
                          type="button"
                          className="dashboard-actions__btn"
                          aria-label={t('dashboard.actions.pause', { title: record.title })}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M9 7h2v10H9V7zm4 0h2v10h-2V7z" fill="currentColor" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="dashboard-actions__btn dashboard-actions__btn--danger"
                          aria-label={t('dashboard.actions.cancel', { title: record.title })}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" strokeWidth="2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {!loading && !error && (
          <div className="dashboard-table__footer">
            {t('dashboard.table.footer_displayed', { count: filteredRecords.length })}
            {records.length > 0
              ? t('dashboard.table.footer_total_loaded', { count: records.length })
              : t('dashboard.table.footer_preview')}
          </div>
        )}
      </section>
    </>
  );
}

export default SuperAdminDashboardView;
