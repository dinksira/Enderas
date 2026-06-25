import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminDataTable } from '../../../components/admin/AdminDataTable.jsx';
import { StatusPill } from '../../../components/admin/StatusPill.jsx';
import { CpoDetailDrawer } from '../../cpo-management/components/CpoDetailDrawer.jsx';
import { useCpoRecords } from '../../cpo-management/hooks/use-cpo-records.js';
import {
  CPO_PAGE_SIZE,
  formatDate,
  getCpoStatusVariant,
} from '../../cpo-management/utils/cpo-management-utils.js';

const MY_CPO_COLUMNS = Object.freeze(['auction_title', 'status', 'created_at', 'actions']);

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

export function MyCpoView() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'am' ? 'am' : 'en';

  const {
    page,
    items: cpos,
    pagination,
    loading,
    error,
    refetch,
    goToPrevPage,
    goToNextPage,
  } = useCpoRecords();

  const [selectedId, setSelectedId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const footerSummary = t('cpo.my.table.footer', {
    from: cpos.length === 0 ? 0 : (page - 1) * CPO_PAGE_SIZE + 1,
    to: (page - 1) * CPO_PAGE_SIZE + cpos.length,
    total: pagination.total,
  });

  return (
    <div className="kyc-management-page">
      <AdminDataTable
        loading={loading}
        error={error}
        onRetry={refetch}
        columns={MY_CPO_COLUMNS}
        getColumnLabel={(key) => t(`cpo.my.table.headers.${key}`)}
        emptyMessage={t('cpo.my.empty')}
        footerSummary={footerSummary}
        page={page}
        pages={pagination.pages || 1}
        onPrevPage={goToPrevPage}
        onNextPage={goToNextPage}
        showPagination
      >
        {cpos.map((row) => (
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
            <td className="dashboard-table__cell">
              <StatusPill
                label={t(`cpo.management.status.${row.status}`, { defaultValue: row.status })}
                variant={getCpoStatusVariant(row.status)}
              />
            </td>
            <td className="dashboard-table__cell">{formatDate(row.createdAt, locale)}</td>
            <td className="dashboard-table__cell">
              <ViewActionButton
                label={t('cpo.my.viewAction')}
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
