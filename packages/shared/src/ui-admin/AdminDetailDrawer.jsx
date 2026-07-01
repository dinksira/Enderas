import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button.jsx';

/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   title?: string,
 *   subtitle?: string,
 *   status?: import('react').ReactNode,
 *   sections?: Array<{ key?: string, title?: string, children: import('react').ReactNode }>,
 *   footer?: import('react').ReactNode,
 *   loading?: boolean,
 *   error?: string,
 *   onRetry?: () => void,
 *   titleId?: string,
 *   width?: number,
 *   headerActions?: import('react').ReactNode,
 * }} props
 */
export function AdminDetailDrawer({
  open,
  onClose,
  title,
  subtitle,
  status,
  sections = [],
  footer,
  loading = false,
  error = '',
  onRetry,
  titleId = 'admin-detail-drawer-title',
  width = 480,
  headerActions,
}) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className={`admin-drawer-overlay${visible ? ' admin-drawer-overlay--visible' : ''}`}
      role="presentation"
      onClick={onClose}
    >
      <aside
        className={`admin-drawer${visible ? ' admin-drawer--visible' : ''}`}
        style={{ width: `min(${width}px, 100vw)` }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="admin-drawer__header">
          <div className="admin-drawer__header-main">
            <h2 id={titleId} className="admin-drawer__title">
              {loading ? t('admin.loading') : title || t('common.empty')}
            </h2>
            {subtitle && <p className="admin-drawer__subtitle">{subtitle}</p>}
            {status && <div className="admin-drawer__status">{status}</div>}
          </div>
          {headerActions && (
            <div className="admin-drawer__header-actions">{headerActions}</div>
          )}
          <button
            type="button"
            className="admin-drawer__close"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            ×
          </button>
        </header>

        <div className={`admin-drawer__body${footer ? ' admin-drawer__body--with-footer' : ''}`}>
          {loading && (
            <div className="admin-drawer-skeleton" aria-hidden="true">
              <div className="admin-drawer-skeleton__line admin-drawer-skeleton__line--title" />
              <div className="admin-drawer-skeleton__line" />
              <div className="admin-drawer-skeleton__line admin-drawer-skeleton__line--short" />
              <div className="admin-drawer-skeleton__grid">
                <div className="admin-drawer-skeleton__cell" />
                <div className="admin-drawer-skeleton__cell" />
              </div>
              <div className="admin-drawer-skeleton__line admin-drawer-skeleton__line--block" />
            </div>
          )}

          {!loading && error && (
            <div className="admin-drawer__error" role="alert">
              <p>{error}</p>
              {onRetry && (
                <Button variant="secondary" onClick={onRetry}>
                  {t('admin.retry')}
                </Button>
              )}
            </div>
          )}

          {!loading && !error &&
            sections.map((section, index) => (
              <section
                key={section.key || section.title || `section-${index}`}
                className="admin-drawer__section"
              >
                {section.title && (
                  <h3 className="admin-drawer__section-title">{section.title}</h3>
                )}
                {section.children}
              </section>
            ))}
        </div>

        {footer && <footer className="admin-drawer__footer">{footer}</footer>}
      </aside>
    </div>
  );
}

export default AdminDetailDrawer;
