import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

const STATUS_FILTERS = ['all', 'pending_review', 'under_evaluation', 'approved', 'rejected'];

const TABLE_HEADERS = [
  'request_id',
  'asset',
  'category',
  'owner_bank',
  'submitted_date',
  'estimated_value',
  'status',
  'actions',
];

const DEMO_RECORDS = [
  {
    id: 'AR-2204',
    asset: 'Komatsu Excavator PC200',
    category: 'Machinery',
    owner: 'Commercial Bank of Ethiopia',
    submitted: '13 Jun 2026',
    value: 4200000,
    status: 'PENDING_REVIEW',
  },
  {
    id: 'AR-2203',
    asset: 'Apartment Unit — Bole, Block 4',
    category: 'Buildings',
    owner: 'Awash Bank',
    submitted: '12 Jun 2026',
    value: 8500000,
    status: 'PENDING_REVIEW',
  },
  {
    id: 'AR-2202',
    asset: 'Mitsubishi L200 Pickup',
    category: 'Vehicles',
    owner: 'Dashen Bank',
    submitted: '11 Jun 2026',
    value: 1450000,
    status: 'UNDER_EVALUATION',
  },
  {
    id: 'AR-2201',
    asset: 'Farmland — 12 hectares, Debre Birhan',
    category: 'Land',
    owner: 'Wegagen Bank',
    submitted: '10 Jun 2026',
    value: 6800000,
    status: 'APPROVED',
  },
  {
    id: 'AR-2200',
    asset: 'Office Equipment Bundle',
    category: 'Office Assets',
    owner: 'Abay Bank',
    submitted: '09 Jun 2026',
    value: 320000,
    status: 'REJECTED',
  },
  {
    id: 'AR-2199',
    asset: 'Toyota Hilux 2023',
    category: 'Vehicles',
    owner: 'Commercial Bank of Ethiopia',
    submitted: '08 Jun 2026',
    value: 3100000,
    status: 'APPROVED',
  },
];

function normalizeStatus(status) {
  return String(status || 'PENDING_REVIEW').toUpperCase();
}

function statusPillClass(status) {
  const key = normalizeStatus(status);
  const map = {
    PENDING_REVIEW: 'asset-status-pill--pending',
    UNDER_EVALUATION: 'asset-status-pill--evaluating',
    APPROVED: 'asset-status-pill--approved',
    REJECTED: 'asset-status-pill--rejected',
  };
  return map[key] || 'asset-status-pill--pending';
}

function formatCurrency(value) {
  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return '—';
  }
  return new Intl.NumberFormat('en-ET', { style: 'decimal', maximumFractionDigits: 0 }).format(amount);
}

export function AssetRequestsView() {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return DEMO_RECORDS.filter((record) => {
      const matchesFilter =
        activeFilter === 'all' || normalizeStatus(record.status) === activeFilter.toUpperCase();
      const matchesSearch =
        !query ||
        record.id.toLowerCase().includes(query) ||
        record.asset.toLowerCase().includes(query) ||
        record.category.toLowerCase().includes(query) ||
        record.owner.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, searchQuery]);

  const countByStatus = useMemo(() => {
    const counts = STATUS_FILTERS.reduce((acc, key) => ({ ...acc, [key]: 0 }), {});
    DEMO_RECORDS.forEach((r) => {
      const statusKey = normalizeStatus(r.status).toLowerCase();
      if (counts[statusKey] !== undefined) counts[statusKey]++;
      counts.all++;
    });
    return counts;
  }, []);

  return (
    <>
      <section className="asset-stats-grid" aria-label="Asset Request Statistics">
        {STATUS_FILTERS.filter((key) => key !== 'all').map((filterKey) => (
          <div key={filterKey} className="asset-stat-card">
            <div className="asset-stat-card__header">
              <span className="asset-stat-card__label">
                {filterKey.replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>
            <div className="asset-stat-card__value">{countByStatus[filterKey]}</div>
          </div>
        ))}
      </section>

      <section className="dashboard-filters" aria-label="Asset Request Filters">
        <div className="dashboard-filters__tabs" role="tablist" aria-label="Status filters">
          {STATUS_FILTERS.map((filterKey) => {
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
                {filterKey === 'all' ? 'All' : filterKey.replace(/_/g, ' ').toUpperCase()}
                {filterKey !== 'all' && ` (${countByStatus[filterKey]})`}
              </button>
            );
          })}
        </div>
        <div className="asset-filters__search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
            <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" />
          </svg>
          <input
            type="search"
            placeholder="Search by request ID, asset name, or owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </section>

      <section className="dashboard-table-panel" aria-live="polite">
        <div className="dashboard-table-scroll">
          <table className="dashboard-table">
            <thead>
              <tr className="dashboard-table__head-row">
                {TABLE_HEADERS.map((headerKey) => (
                  <th key={headerKey} scope="col" className="dashboard-table__head-cell">
                    {headerKey.replace(/_/g, ' ').toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr key={record.id} className="dashboard-table__row">
                  <td className="dashboard-table__cell dashboard-table__cell--strong">
                    {record.id}
                  </td>
                  <td className="dashboard-table__cell">{record.asset}</td>
                  <td className="dashboard-table__cell dashboard-table__cell--muted">
                    {record.category}
                  </td>
                  <td className="dashboard-table__cell">{record.owner}</td>
                  <td className="dashboard-table__cell">{record.submitted}</td>
                  <td className="dashboard-table__cell dashboard-table__cell--strong">
                    {formatCurrency(record.value)} ETB
                  </td>
                  <td className="dashboard-table__cell">
                    <span className={`asset-status-pill ${statusPillClass(record.status)}`}>
                      {record.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="dashboard-table__cell">
                    <div className="dashboard-actions">
                      <button
                        type="button"
                        className="dashboard-actions__btn"
                        aria-label={`View details for ${record.id}`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M12 5c4.632 0 8 5.878 8 7s-3.368 7-8 7-8-5.878-8-7 3.368-7 8-7z" stroke="currentColor" strokeWidth="1.8" />
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="dashboard-actions__btn dashboard-actions__btn--success"
                        aria-label={`Approve ${record.id}`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="dashboard-actions__btn dashboard-actions__btn--danger"
                        aria-label={`Reject ${record.id}`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={TABLE_HEADERS.length} className="dashboard-table__empty">
                    No asset requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="dashboard-table__footer">
          Showing {filteredRecords.length} of {DEMO_RECORDS.length} requests
        </div>
      </section>
    </>
  );
}

export default AssetRequestsView;
