import { AdminDataTable } from '@enderass/shared/ui-admin';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePaginatedResource } from '@enderass/shared/hooks';
import { useRegisterPageSearch } from '../../../contexts/PageSearchContext.jsx';
import { auditService } from '@enderass/shared/services';
import { AuditLogDetailDrawer } from '../components/AuditLogDetailDrawer.jsx';
import { formatDate } from '../utils/audit-management-utils.js';

const PAGE_SIZE = 20;

const TABLE_COLUMNS = Object.freeze([
  'action',
  'entity_type',
  'actor',
  'timestamp',
  'actions',
]);

const ACTION_FILTER_OPTIONS = Object.freeze([
  '',
  'LOGIN',
  'CREATE',
  'UPDATE',
  'DELETE',
  'APPROVE',
  'REJECT',
  'ACCESS_DENIED',
  'ROLE_CHANGE',
  'PUBLISH',
  'CLOSE',
]);

export function AuditTrailView() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'am' ? 'am' : 'en';
  const isAmharic = locale === 'am';

  const [actionFilter, setActionFilter] = useState('');
  const [selectedLogId, setSelectedLogId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchFn = useCallback(
    async (params) => {
      const response = await auditService.listAuditLogs({
        ...params,
        action: actionFilter || undefined,
      });
      return {
        items: response?.auditLogs ?? [],
        pagination: response?.pagination,
      };
    },
    [actionFilter],
  );

  const {
    page,
    setPage,
    search,
    setSearch,
    items: logs,
    pagination,
    loading,
    error,
    refetch,
    goToPrevPage,
    goToNextPage,
  } = usePaginatedResource({
    fetchFn,
    pageSize: PAGE_SIZE,
    itemsKey: 'items',
  });

  useRegisterPageSearch({
    value: search,
    onChange: setSearch,
    placeholder: t('audit.trail.searchPlaceholder'),
  });

  useEffect(() => {
    setPage(1);
  }, [actionFilter, setPage]);

  const actionFilterControl = useMemo(
    () => (
      <label className="admin-data-table__filter">
        <span className="admin-data-table__filter-label">{t('audit.trail.actionFilter')}</span>
        <select
          className="input-field__control"
          value={actionFilter}
          onChange={(event) => setActionFilter(event.target.value)}
        >
          <option value="">{t('audit.trail.allActions')}</option>
          {ACTION_FILTER_OPTIONS.filter(Boolean).map((action) => (
            <option key={action} value={action}>
              {t(`audit.trail.actions.${action}`, { defaultValue: action })}
            </option>
          ))}
        </select>
      </label>
    ),
    [actionFilter, t],
  );

  const openDrawer = (logId) => {
    setSelectedLogId(logId);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedLogId(null);
  };

  const footerSummary = t('audit.trail.table.footer', {
    from: logs.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1,
    to: (page - 1) * PAGE_SIZE + logs.length,
    total: pagination.total,
  });

  return (
    <div className={`kyc-management-page ${isAmharic ? 'kyc-management-page--am' : ''}`}>
      <AdminDataTable
        toolbarExtra={actionFilterControl}
        loading={loading}
        error={error}
        onRetry={refetch}
        columns={TABLE_COLUMNS}
        getColumnLabel={(key) => t(`audit.trail.table.headers.${key}`)}
        emptyMessage={t('audit.trail.empty')}
        footerSummary={footerSummary}
        page={page}
        pages={pagination.pages || 1}
        onPrevPage={goToPrevPage}
        onNextPage={goToNextPage}
      >
        {logs.map((log) => (
          <tr
            key={log.id}
            className="dashboard-table__row kyc-management-page__row"
            onClick={() => openDrawer(log.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openDrawer(log.id);
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={t('audit.trail.openDetail', { action: log.action })}
          >
            <td className="dashboard-table__cell dashboard-table__cell--strong">{log.action}</td>
            <td className="dashboard-table__cell">{log.entityType || '—'}</td>
            <td className="dashboard-table__cell">{log.actorName || '—'}</td>
            <td className="dashboard-table__cell">{formatDate(log.createdAt, locale)}</td>
            <td className="dashboard-table__cell">
              <div className="dashboard-actions">
                <button
                  type="button"
                  className="dashboard-actions__btn"
                  aria-label={t('audit.trail.viewAction')}
                  onClick={(event) => {
                    event.stopPropagation();
                    openDrawer(log.id);
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M12 5c4.632 0 8 5.878 8 7s-3.368 7-8 7-8-5.878-8-7 3.368-7 8-7z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        ))}
      </AdminDataTable>

      <AuditLogDetailDrawer auditLogId={selectedLogId} open={drawerOpen} onClose={closeDrawer} />
    </div>
  );
}

export default AuditTrailView;
