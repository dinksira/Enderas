import { Children } from 'react';
import { PaginationBar } from '@enderass/shared/ui-admin';
import { useTranslation } from 'react-i18next';

/**
 * @param {{
 *   title: string,
 *   eyebrow?: string,
 *   metrics?: Array<{ label: string, value: import('react').ReactNode }>,
 *   status?: import('react').ReactNode,
 *   ctaLabel?: string,
 *   onOpen: () => void,
 *   ariaLabel: string,
 *   footerExtra?: import('react').ReactNode,
 * }} props
 */
export function BidderRecordCard({
  title,
  eyebrow,
  metrics = [],
  status,
  ctaLabel = 'View',
  onOpen,
  ariaLabel,
  footerExtra,
}) {
  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpen();
    }
  }

  return (
    <article
      className="browse-auction-card bidder-record-card"
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={ariaLabel}
    >
      <div className="bidder-record-card__accent" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M6 4h12v16H6zM9 8h6M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      </div>

      <div className="browse-auction-card__body">
        {eyebrow && <span className="bidder-record-card__eyebrow">{eyebrow}</span>}

        <h3 className="browse-auction-card__title">{title}</h3>

        {metrics.length > 0 && (
          <div className="browse-auction-card__metrics">
            {metrics.map((metric) => (
              <div key={metric.label} className="browse-auction-card__metric">
                <span className="browse-auction-card__metric-label">{metric.label}</span>
                <span className="browse-auction-card__metric-value">{metric.value}</span>
              </div>
            ))}
          </div>
        )}

        {footerExtra}

        <div className="browse-auction-card__footer">
          {status ? <div className="browse-auction-card__participation">{status}</div> : <span />}
          <span className="browse-auction-card__cta">
            {ctaLabel}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </div>
    </article>
  );
}

export function BidderRecordCardSkeleton() {
  return (
    <div className="browse-auction-card bidder-record-card browse-auction-card--skeleton" aria-hidden="true">
      <div className="bidder-record-card__accent bidder-record-card__accent--skeleton" />
      <div className="browse-auction-card__body">
        <div className="browse-auction-card__skeleton-line browse-auction-card__skeleton-line--short" />
        <div className="browse-auction-card__skeleton-line browse-auction-card__skeleton-line--title" />
        <div className="browse-auction-card__skeleton-line" />
        <div className="browse-auction-card__skeleton-line browse-auction-card__skeleton-line--cta" />
      </div>
    </div>
  );
}

/**
 * @param {{
 *   loading?: boolean,
 *   error?: string,
 *   onRetry?: () => void,
 *   emptyMessage?: string,
 *   children?: import('react').ReactNode,
 *   footerSummary?: string,
 *   page?: number,
 *   pages?: number,
 *   onPrevPage?: () => void,
 *   onNextPage?: () => void,
 *   showPagination?: boolean,
 *   skeletonCount?: number,
 *   loadingLabel?: string,
 *   errorLabel?: string,
 *   footerActions?: import('react').ReactNode,
 * }} props
 */
export function BidderRecordCardGrid({
  loading = false,
  error = '',
  onRetry,
  emptyMessage,
  children,
  footerSummary,
  page = 1,
  pages = 1,
  onPrevPage,
  onNextPage,
  showPagination = false,
  skeletonCount = 6,
  loadingLabel = 'Loading...',
  errorLabel,
  footerActions,
}) {
  const { t } = useTranslation();
  const hasItems = Children.count(children) > 0;

  return (
    <section className="browse-auctions__grid-panel bidder-record-grid" aria-live="polite">
      {error && (
        <div className="browse-auctions__message browse-auctions__message--error" role="alert">
          <span>{errorLabel || error}</span>
          {onRetry && (
            <button type="button" className="admin-data-table__retry" onClick={onRetry}>
              {t('admin.retry')}
            </button>
          )}
        </div>
      )}

      {loading && (
        <div className="browse-auctions__grid" aria-busy="true">
          {Array.from({ length: skeletonCount }, (_, index) => (
            <BidderRecordCardSkeleton key={index} />
          ))}
          <p className="visually-hidden">{loadingLabel}</p>
        </div>
      )}

      {!loading && !error && !hasItems && emptyMessage && (
        <p className="browse-auctions__message" role="status">
          {emptyMessage}
        </p>
      )}

      {!loading && !error && hasItems && (
        <div className="browse-auctions__grid">{children}</div>
      )}

      {!loading && !error && (footerSummary || showPagination || footerActions) && (
        <div className="dashboard-table__footer bidder-record-grid__footer">
          {footerSummary && <span>{footerSummary}</span>}
          {footerActions}
          {showPagination && onPrevPage && onNextPage && (
            <PaginationBar
              page={page}
              pages={pages}
              loading={loading}
              onPrev={onPrevPage}
              onNext={onNextPage}
            />
          )}
        </div>
      )}
    </section>
  );
}

export default BidderRecordCard;
