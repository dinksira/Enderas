import { useMemo, useState } from 'react';
import { useAuctions } from '../hooks/use-auctions.js';
import { ADMIN_FONTS, ADMIN_PALETTE } from './auction-admin-tokens.js';

const FILTERS = ['All', 'ACTIVE', 'PENDING', 'CLOSED', 'SUSPENDED'];

const TABLE_COLUMNS = [
  'ID',
  'Auction Title',
  'Category',
  'Status',
  'Starting Date',
  'Ending Date',
  'Bids',
  'Reserve(ETB)',
  'Actions',
];

const DEMO_RECORDS = [
  {
    id: 'AUC-001',
    title: 'Toyota Land Cruiser 2020',
    category: 'Vehicles',
    status: 'ACTIVE',
    startingDate: '01/03/2026',
    endingDate: '15/03/2026',
    bids: 24,
    reserve: 2500000,
  },
  {
    id: 'AUC-002',
    title: 'Commercial Plot — Bole',
    category: 'Real Estate',
    status: 'PENDING',
    startingDate: '10/03/2026',
    endingDate: '25/03/2026',
    bids: 0,
    reserve: 8500000,
  },
  {
    id: 'AUC-003',
    title: 'Industrial Crane Set',
    category: 'Equipment',
    status: 'SUSPENDED',
    startingDate: '05/02/2026',
    endingDate: '20/02/2026',
    bids: 11,
    reserve: 1200000,
  },
  {
    id: 'AUC-004',
    title: 'Office Furniture Bundle',
    category: 'Assets',
    status: 'CLOSED',
    startingDate: '01/01/2026',
    endingDate: '14/01/2026',
    bids: 8,
    reserve: 500000,
  },
];

function formatReserve(value) {
  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return '—';
  }
  return new Intl.NumberFormat('en-ET').format(amount);
}

function normalizeStatus(status) {
  return String(status || 'PENDING').toUpperCase();
}

function getStatusStyle(status) {
  const key = normalizeStatus(status);
  const map = {
    ACTIVE: ADMIN_PALETTE.status.active,
    PENDING: ADMIN_PALETTE.status.pending,
    SUSPENDED: ADMIN_PALETTE.status.suspended,
    CLOSED: ADMIN_PALETTE.status.closed,
  };
  return map[key] || ADMIN_PALETTE.status.pending;
}

function mapRecord(record, index) {
  return {
    id: record.id ?? record.auctionId ?? `AUC-${String(index + 1).padStart(3, '0')}`,
    title: record.title ?? record.auction ?? record.name ?? 'Untitled Auction',
    category: record.category ?? record.assetCategory ?? 'General',
    status: normalizeStatus(record.status),
    startingDate: record.startingDate ?? record.startDate ?? record.closing ?? '—',
    endingDate: record.endingDate ?? record.endDate ?? record.closing ?? '—',
    bids: record.bids ?? record.bidCount ?? 0,
    reserve: record.reserve ?? record.reserveAmount ?? record.bidAmount ?? 0,
  };
}

/**
 * @param {Object} props
 * @param {string} props.searchQuery
 */
export function AuctionList({ searchQuery = '' }) {
  const { records, loading, error } = useAuctions();
  const [activeFilter, setActiveFilter] = useState('All');

  const normalizedRecords = useMemo(() => {
    const source = records.length > 0 ? records : DEMO_RECORDS;
    return source.map(mapRecord);
  }, [records]);

  const filteredRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return normalizedRecords.filter((record) => {
      const matchesFilter =
        activeFilter === 'All' || normalizeStatus(record.status) === activeFilter;
      const matchesSearch =
        !query ||
        record.id.toLowerCase().includes(query) ||
        record.title.toLowerCase().includes(query) ||
        record.category.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [normalizedRecords, activeFilter, searchQuery]);

  return (
    <section aria-live="polite" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: '4px 0',
                  cursor: 'pointer',
                  fontFamily: ADMIN_FONTS.montserrat,
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  textTransform: filter === 'All' ? 'none' : 'uppercase',
                  color: isActive ? ADMIN_PALETTE.accent : ADMIN_PALETTE.textSubtle,
                  borderBottom: isActive ? `2px solid ${ADMIN_PALETTE.accent}` : '2px solid transparent',
                  borderRadius: 0,
                }}
              >
                {filter}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          style={{
            border: 'none',
            background: ADMIN_PALETTE.accent,
            color: ADMIN_PALETTE.textWhite,
            padding: '12px 24px',
            fontFamily: ADMIN_FONTS.montserrat,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            borderRadius: 0,
          }}
        >
          + Create Auction
        </button>
      </div>

      <div
        style={{
          background: ADMIN_PALETTE.textWhite,
          border: `1px solid ${ADMIN_PALETTE.border}`,
          borderRadius: 0,
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: 960,
            }}
          >
            <thead>
              <tr style={{ background: ADMIN_PALETTE.accent }}>
                {TABLE_COLUMNS.map((column) => (
                  <th
                    key={column}
                    scope="col"
                    style={{
                      padding: '14px 16px',
                      textAlign: 'left',
                      fontFamily: ADMIN_FONTS.montserrat,
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      color: ADMIN_PALETTE.textWhite,
                      whiteSpace: 'nowrap',
                      borderRadius: 0,
                    }}
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={TABLE_COLUMNS.length}
                    style={{
                      padding: 32,
                      textAlign: 'center',
                      fontFamily: ADMIN_FONTS.roboto,
                      fontSize: 14,
                      color: ADMIN_PALETTE.textSubtle,
                      background: ADMIN_PALETTE.textWhite,
                    }}
                  >
                    Loading records...
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td
                    colSpan={TABLE_COLUMNS.length}
                    style={{
                      padding: 32,
                      textAlign: 'center',
                      fontFamily: ADMIN_FONTS.roboto,
                      fontSize: 14,
                      color: ADMIN_PALETTE.status.suspended.bg,
                      background: ADMIN_PALETTE.textWhite,
                    }}
                    role="alert"
                  >
                    Error: {error}
                  </td>
                </tr>
              )}

              {!loading && !error && filteredRecords.length === 0 && (
                <tr>
                  <td
                    colSpan={TABLE_COLUMNS.length}
                    style={{
                      padding: 32,
                      textAlign: 'center',
                      fontFamily: ADMIN_FONTS.roboto,
                      fontSize: 14,
                      color: ADMIN_PALETTE.textSubtle,
                      background: ADMIN_PALETTE.textWhite,
                    }}
                  >
                    No auction records match the current filters.
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                filteredRecords.map((record, index) => {
                  const statusStyle = getStatusStyle(record.status);
                  return (
                    <tr
                      key={record.id}
                      style={{
                        background: index % 2 === 0 ? ADMIN_PALETTE.textWhite : ADMIN_PALETTE.canvas,
                        borderBottom: `1px solid ${ADMIN_PALETTE.border}`,
                      }}
                    >
                      <td
                        style={{
                          padding: '14px 16px',
                          fontFamily: ADMIN_FONTS.montserrat,
                          fontSize: 14,
                          color: ADMIN_PALETTE.textPrimary,
                        }}
                      >
                        {record.id}
                      </td>
                      <td
                        style={{
                          padding: '14px 16px',
                          fontFamily: ADMIN_FONTS.roboto,
                          fontSize: 14,
                          color: ADMIN_PALETTE.textPrimary,
                        }}
                      >
                        {record.title}
                      </td>
                      <td
                        style={{
                          padding: '14px 16px',
                          fontFamily: ADMIN_FONTS.roboto,
                          fontSize: 14,
                          color: ADMIN_PALETTE.textSubtle,
                        }}
                      >
                        {record.category}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: 4,
                            fontFamily: ADMIN_FONTS.montserrat,
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                            background: statusStyle.bg,
                            color: statusStyle.text,
                          }}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: '14px 16px',
                          fontFamily: ADMIN_FONTS.roboto,
                          fontSize: 14,
                          color: ADMIN_PALETTE.textPrimary,
                        }}
                      >
                        {record.startingDate}
                      </td>
                      <td
                        style={{
                          padding: '14px 16px',
                          fontFamily: ADMIN_FONTS.roboto,
                          fontSize: 14,
                          color: ADMIN_PALETTE.textPrimary,
                        }}
                      >
                        {record.endingDate}
                      </td>
                      <td
                        style={{
                          padding: '14px 16px',
                          fontFamily: ADMIN_FONTS.montserrat,
                          fontSize: 14,
                          fontWeight: 600,
                          color: ADMIN_PALETTE.textPrimary,
                        }}
                      >
                        {record.bids}
                      </td>
                      <td
                        style={{
                          padding: '14px 16px',
                          fontFamily: ADMIN_FONTS.montserrat,
                          fontSize: 14,
                          fontWeight: 600,
                          color: ADMIN_PALETTE.textPrimary,
                        }}
                      >
                        {formatReserve(record.reserve)}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button
                            type="button"
                            aria-label={`Pause ${record.title}`}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              border: `1px solid ${ADMIN_PALETTE.border}`,
                              background: ADMIN_PALETTE.textWhite,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              color: ADMIN_PALETTE.accent,
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                              <path d="M9 7h2v10H9V7zm4 0h2v10h-2V7z" fill="currentColor" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            aria-label={`Remove ${record.title}`}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              border: `1px solid ${ADMIN_PALETTE.border}`,
                              background: ADMIN_PALETTE.textWhite,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              color: ADMIN_PALETTE.status.suspended.bg,
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                              <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" strokeWidth="2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {!loading && !error && (
          <div
            style={{
              padding: '12px 16px',
              borderTop: `1px solid ${ADMIN_PALETTE.border}`,
              fontFamily: ADMIN_FONTS.roboto,
              fontSize: 13,
              color: ADMIN_PALETTE.textSubtle,
              background: ADMIN_PALETTE.textWhite,
            }}
          >
            {filteredRecords.length} record(s) displayed
            {records.length > 0 ? ` · ${records.length} total loaded` : ' · showing preview data'}
          </div>
        )}
      </div>
    </section>
  );
}

export default AuctionList;
