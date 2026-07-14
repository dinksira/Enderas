import { AdminDetailDrawer } from '@enderass/shared/ui-admin';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { auditService } from '@enderass/shared/services';
import { formatDate } from '../utils/audit-management-utils.js';

const ACTION_COLORS = Object.freeze({
  LOGIN: 'blue', CREATE: 'green', UPDATE: 'gold', DELETE: 'red',
  APPROVE: 'green', REJECT: 'red', ACCESS_DENIED: 'red',
  ROLE_CHANGE: 'purple', PUBLISH: 'blue', CLOSE: 'gray',
});

function MetaItem({ icon, label, value }) {
  return (
    <div className="audit-drawer__meta-item">
      <div className="audit-drawer__meta-icon">{icon}</div>
      <div className="audit-drawer__meta-content">
        <span className="audit-drawer__meta-label">{label}</span>
        <span className="audit-drawer__meta-value">{value || '—'}</span>
      </div>
    </div>
  );
}

function JsonDiffBlock({ label, value, t }) {
  const [expanded, setExpanded] = useState(true);
  const isEmpty = !value || (typeof value === 'object' && Object.keys(value).length === 0);

  return (
    <div className="audit-drawer__json-block">
      <button
        type="button"
        className="audit-drawer__json-toggle"
        onClick={() => setExpanded((p) => !p)}
      >
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"
          className={expanded ? 'audit-drawer__json-chevron--open' : ''}
        >
          <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>{label}</span>
        {isEmpty && <span className="audit-drawer__json-empty">{t('audit.trail.drawer.noValues')}</span>}
      </button>
      {expanded && !isEmpty && (
        <pre className="audit-drawer__json-pre">
          {JSON.stringify(value, null, 2)}
        </pre>
      )}
    </div>
  );
}

/**
 * @param {{
 *   auditLogId: string|null,
 *   open: boolean,
 *   onClose: () => void,
 * }} props
 */
export function AuditLogDetailDrawer({ auditLogId, open, onClose }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'am' ? 'am' : 'en';

  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !auditLogId) { setLog(null); setError(''); return undefined; }
    let cancelled = false;
    (async () => {
      setLoading(true); setError('');
      try {
        const detail = await auditService.getAuditLogById(auditLogId);
        if (!cancelled) setLog(detail);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : t('audit.trail.drawer.loadFailed'));
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [open, auditLogId, t]);

  const actionColor = log ? (ACTION_COLORS[log.action] || 'gray') : 'gray';

  const sections = log ? [
    {
      key: 'summary',
      title: t('audit.trail.drawer.summarySection'),
      children: (
        <div className="audit-drawer__meta-grid">
          <MetaItem
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}
            label={t('audit.trail.drawer.action')}
            value={<span className={`audit-badge audit-badge--${actionColor}`}>{log.action}</span>}
          />
          <MetaItem
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.8"/><path d="M9 9h6M9 12h6M9 15h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>}
            label={t('audit.trail.drawer.entityType')}
            value={log.entityType}
          />
          <MetaItem
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/></svg>}
            label={t('audit.trail.drawer.actor')}
            value={log.actorName}
          />
          <MetaItem
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            label={t('audit.trail.drawer.timestamp')}
            value={formatDate(log.createdAt, locale)}
          />
          <MetaItem
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>}
            label={t('audit.trail.drawer.ipAddress')}
            value={log.ipAddress}
          />
          <MetaItem
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>}
            label={t('audit.trail.drawer.userAgent')}
            value={log.userAgent}
          />
          {log.entityId && (
            <MetaItem
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="currentColor" strokeWidth="1.8"/><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              label={t('audit.trail.drawer.entityId')}
              value={<code className="audit-drawer__id">{log.entityId}</code>}
            />
          )}
        </div>
      ),
    },
    {
      key: 'changes',
      title: t('audit.trail.drawer.changesSection'),
      children: (
        <div className="audit-drawer__json-section">
          <JsonDiffBlock label={t('audit.trail.drawer.oldValues')} value={log.oldValues} t={t} />
          <JsonDiffBlock label={t('audit.trail.drawer.newValues')} value={log.newValues} t={t} />
          <JsonDiffBlock label={t('audit.trail.drawer.metadata')} value={log.metadata} t={t} />
        </div>
      ),
    },
  ] : [];

  return (
    <AdminDetailDrawer
      open={open}
      onClose={onClose}
      title={log?.action || t('audit.trail.drawer.title')}
      subtitle={log?.entityType}
      loading={loading}
      error={error}
      onRetry={() => { if (auditLogId) auditService.getAuditLogById(auditLogId).then(setLog); }}
      sections={sections}
      titleId="audit-log-detail-drawer-title"
      width={560}
      status={log ? <span className={`audit-badge audit-badge--${actionColor}`}>{log.action}</span> : undefined}
    />
  );
}

export default AuditLogDetailDrawer;
