import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePaginatedResource } from '@enderass/shared/hooks';
import { useRegisterPageSearch } from '../../../contexts/PageSearchContext.jsx';
import { auditService } from '@enderass/shared/services';
import { AuditLogDetailDrawer } from '../components/AuditLogDetailDrawer.jsx';
import { formatDate } from '../utils/audit-management-utils.js';

const PAGE_SIZE = 20;

const ACTION_OPTIONS = Object.freeze([
  'LOGIN', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT',
  'ACCESS_DENIED', 'ROLE_CHANGE', 'PUBLISH', 'CLOSE',
]);

const ACTION_COLORS = Object.freeze({
  LOGIN: 'blue',
  CREATE: 'green',
  UPDATE: 'gold',
  DELETE: 'red',
  APPROVE: 'green',
  REJECT: 'red',
  ACCESS_DENIED: 'red',
  ROLE_CHANGE: 'purple',
  PUBLISH: 'blue',
  CLOSE: 'gray',
});

function ActionBadge({ action, t }) {
  const color = ACTION_COLORS[action] || 'gray';
  return (
    <span className={`audit-badge audit-badge--${color}`}>
      {t(`audit.trail.actions.${action}`, { defaultValue: action })}
    </span>
  );
}

function TimeAgo({ date, locale }) {
  if (!date) return <span className="audit-time">—</span>;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return <span className="audit-time">—</span>;

  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  let relative = '';
  if (diffMin < 1) relative = 'Just now';
  else if (diffMin < 60) relative = `${diffMin}m ago`;
  else if (diffHr < 24) relative = `${diffHr}h ago`;
  else if (diffDay < 7) relative = `${diffDay}d ago`;

  const absolute = new Intl.DateTimeFormat(locale === 'am' ? 'am-ET' : 'en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(d);

  return (
    <span className="audit-time" title={absolute}>
      {relative && <span className="audit-time__relative">{relative}</span>}
      <span className="audit-time__absolute">{absolute}</span>
    </span>
  );
}

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
    page, setPage, search, setSearch, items: logs,
    pagination, loading, error, refetch,
    goToPrevPage, goToNextPage,
  } = usePaginatedResource({ fetchFn, pageSize: PAGE_SIZE, itemsKey: 'items' });

  useRegisterPageSearch({
    value: search,
    onChange: setSearch,
    placeholder: t('audit.trail.searchPlaceholder'),
  });

  useEffect(() => { setPage(1); }, [actionFilter, setPage]);

  const openDrawer = (logId) => { setSelectedLogId(logId); setDrawerOpen(true); };
  const closeDrawer = () => { setDrawerOpen(false); setSelectedLogId(null); };

  const footerSummary = t('audit.trail.table.footer', {
    from: logs.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1,
    to: (page - 1) * PAGE_SIZE + logs.length,
    total: pagination.total,
  });

  return (
    <div className={`audit-page ${isAmharic ? 'audit-page--am' : ''}`}>
      <header className="audit-page__header">
        <div className="audit-page__header-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="audit-page__header-text">
          <h1 className="audit-page__title">{t('audit.trail.pageTitle')}</h1>
          <p className="audit-page__subtitle">{t('audit.trail.subtitle')}</p>
        </div>
      </header>

      <div className="audit-toolbar">
        <div className="audit-toolbar__pills">
          <button
            type="button"
            className={`audit-pill ${actionFilter === '' ? 'audit-pill--active' : ''}`}
            onClick={() => setActionFilter('')}
          >
            {t('audit.trail.allActions')}
          </button>
          {ACTION_OPTIONS.map((action) => (
            <button
              key={action}
              type="button"
              className={`audit-pill audit-pill--${ACTION_COLORS[action] || 'gray'} ${actionFilter === action ? 'audit-pill--active' : ''}`}
              onClick={() => setActionFilter(actionFilter === action ? '' : action)}
            >
              {t(`audit.trail.actions.${action}`, { defaultValue: action })}
            </button>
          ))}
        </div>
      </div>

      <div className="audit-card">
        {error && (
          <div className="audit-card__error" role="alert">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <span>{error}</span>
            <button type="button" className="audit-card__retry" onClick={refetch}>{t('admin.retry')}</button>
          </div>
        )}

        <div className="audit-table-wrap">
          <table className="audit-table">
            <thead>
              <tr>
                <th className="audit-table__th">{t('audit.trail.table.headers.action')}</th>
                <th className="audit-table__th">{t('audit.trail.table.headers.entity_type')}</th>
                <th className="audit-table__th">{t('audit.trail.table.headers.actor')}</th>
                <th className="audit-table__th">{t('audit.trail.table.headers.timestamp')}</th>
                <th className="audit-table__th audit-table__th--end">{t('audit.trail.table.headers.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="audit-table__loading">
                    <div className="audit-spinner" />
                  </td>
                </tr>
              )}

              {!loading && logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="audit-table__empty">
                    <div className="audit-empty">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M8 12h8M8 8h8M8 16h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                      <span>{t('audit.trail.empty')}</span>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && logs.map((log) => (
                <tr
                  key={log.id}
                  className="audit-table__row"
                  onClick={() => openDrawer(log.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrawer(log.id); } }}
                  tabIndex={0}
                  role="button"
                  aria-label={t('audit.trail.openDetail', { action: log.action })}
                >
                  <td className="audit-table__td">
                    <ActionBadge action={log.action} t={t} />
                  </td>
                  <td className="audit-table__td">
                    <span className="audit-entity">{log.entityType || '—'}</span>
                  </td>
                  <td className="audit-table__td">
                    <span className="audit-actor">{log.actorName || '—'}</span>
                  </td>
                  <td className="audit-table__td">
                    <TimeAgo date={log.createdAt} locale={locale} />
                  </td>
                  <td className="audit-table__td audit-table__td--end">
                    <button
                      type="button"
                      className="audit-view-btn"
                      aria-label={t('audit.trail.viewAction')}
                      onClick={(e) => { e.stopPropagation(); openDrawer(log.id); }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8"/>
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="audit-pagination">
          <span className="audit-pagination__summary">{footerSummary}</span>
          <div className="audit-pagination__controls">
            <button
              type="button"
              className="audit-pagination__btn"
              disabled={page <= 1}
              onClick={goToPrevPage}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <span className="audit-pagination__page">{page} / {pagination.pages || 1}</span>
            <button
              type="button"
              className="audit-pagination__btn"
              disabled={page >= (pagination.pages || 1)}
              onClick={goToNextPage}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>
      </div>

      <AuditLogDetailDrawer auditLogId={selectedLogId} open={drawerOpen} onClose={closeDrawer} />
    </div>
  );
}

export default AuditTrailView;
