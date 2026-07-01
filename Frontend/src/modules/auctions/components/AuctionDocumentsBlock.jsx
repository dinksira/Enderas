import { useTranslation } from 'react-i18next';

import { resolveAuctionDocumentHref } from '../utils/auction-document-utils.js';

function resolveDocument(doc, t) {
  if (typeof doc === 'string') {
    return { url: doc, name: t('bidder.participation.document') };
  }
  return {
    url: doc?.url || doc?.fileUrl || '',
    name: doc?.name || doc?.fileName || t('bidder.participation.document'),
  };
}

/**
 * @param {{
 *   auctionId?: string,
 *   documents?: Array<string|object>,
 *   unlocked?: boolean,
 *   compact?: boolean,
 * }} props
 */
export function AuctionDocumentsBlock({
  auctionId,
  documents = [],
  unlocked = false,
  compact = false,
}) {
  const { t } = useTranslation();
  const items = documents
    .map((doc) => resolveDocument(doc, t))
    .filter((doc) => Boolean(doc.url));

  if (!unlocked) {
    return (
      <section
        className={`auction-documents auction-documents--locked${compact ? ' auction-documents--compact' : ''}`}
        aria-label={t('bidder.participation.documents')}
      >
        <div className="auction-documents__lock-icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="5" y="11" width="14" height="10" stroke="currentColor" strokeWidth="1.8" />
            <path d="M8 11V8a4 4 0 118 0v3" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </div>
        <div>
          <h4 className="auction-documents__title">{t('bidder.participation.documentsLockedTitle')}</h4>
          <p className="auction-documents__copy">{t('bidder.participation.documentsLocked')}</p>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`auction-documents auction-documents--unlocked${compact ? ' auction-documents--compact' : ''}`}
      aria-label={t('bidder.participation.documents')}
    >
      <header className="auction-documents__header">
        <div className="auction-documents__unlock-icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M8 11V8a4 4 0 118 0" stroke="currentColor" strokeWidth="1.8" />
            <rect x="5" y="11" width="14" height="10" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </div>
        <div>
          <h4 className="auction-documents__title">{t('bidder.participation.documentsUnlockedTitle')}</h4>
          <p className="auction-documents__copy">{t('bidder.participation.documentsUnlockedCopy')}</p>
        </div>
      </header>

      {items.length === 0 ? (
        <p className="auction-documents__empty">{t('bidder.participation.documentsEmpty')}</p>
      ) : (
        <ul className="auction-documents__list">
          {items.map((doc, index) => {
            const href = resolveAuctionDocumentHref({
              auctionId,
              doc,
              docIndex: index,
              unlocked,
            });

            return (
              <li key={`${doc.url}-${index}`} className="auction-documents__item">
                <a href={href} target="_blank" rel="noreferrer" className="auction-documents__link">
                  <span className="auction-documents__link-icon" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M6 4h12v16H6zM9 8h6M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                  </span>
                  <span className="auction-documents__link-text">{doc.name}</span>
                  <span className="auction-documents__link-action">{t('bidder.participation.downloadDocument')}</span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default AuctionDocumentsBlock;
