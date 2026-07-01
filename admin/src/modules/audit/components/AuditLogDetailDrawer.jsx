import { AdminDetailDrawer } from '@enderass/shared/ui-admin';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { auditService } from '@enderass/shared/services';
import { formatDate } from '../utils/audit-management-utils.js';

function MetaField({ label, value }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value || '—'}</dd>
    </>
  );
}

function JsonBlock({ label, value }) {
  const { t } = useTranslation();

  return (
    <div className="audit-json-block">
      <h4 className="audit-json-block__title">{label}</h4>
      <pre className="audit-json-block__pre">
        {value ? JSON.stringify(value, null, 2) : t('audit.trail.drawer.noValues')}
      </pre>
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
    if (!open || !auditLogId) {
      setLog(null);
      setError('');
      return undefined;
    }

    let cancelled = false;

    const loadLog = async () => {
      setLoading(true);
      setError('');

      try {
        const detail = await auditService.getAuditLogById(auditLogId);
        if (!cancelled) {
          setLog(detail);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t('audit.trail.drawer.loadFailed'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadLog();

    return () => {
      cancelled = true;
    };
  }, [open, auditLogId, t]);

  const sections = log
    ? [
        {
          key: 'summary',
          title: t('audit.trail.drawer.summarySection'),
          children: (
            <dl className="kyc-drawer__meta">
              <MetaField label={t('audit.trail.drawer.action')} value={log.action} />
              <MetaField label={t('audit.trail.drawer.entityType')} value={log.entityType} />
              <MetaField label={t('audit.trail.drawer.entityId')} value={log.entityId} />
              <MetaField label={t('audit.trail.drawer.actor')} value={log.actorName} />
              <MetaField
                label={t('audit.trail.drawer.timestamp')}
                value={formatDate(log.createdAt, locale)}
              />
              <MetaField label={t('audit.trail.drawer.ipAddress')} value={log.ipAddress} />
              <MetaField label={t('audit.trail.drawer.userAgent')} value={log.userAgent} />
            </dl>
          ),
        },
        {
          key: 'changes',
          title: t('audit.trail.drawer.changesSection'),
          children: (
            <>
              <JsonBlock label={t('audit.trail.drawer.oldValues')} value={log.oldValues} />
              <JsonBlock label={t('audit.trail.drawer.newValues')} value={log.newValues} />
              <JsonBlock label={t('audit.trail.drawer.metadata')} value={log.metadata} />
            </>
          ),
        },
      ]
    : [];

  return (
    <AdminDetailDrawer
      open={open}
      onClose={onClose}
      title={log?.action || t('audit.trail.drawer.title')}
      subtitle={log?.entityType}
      loading={loading}
      error={error}
      onRetry={() => {
        if (auditLogId) {
          auditService.getAuditLogById(auditLogId).then(setLog);
        }
      }}
      sections={sections}
      titleId="audit-log-detail-drawer-title"
      width={560}
    />
  );
}

export default AuditLogDetailDrawer;
