import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DocumentViewer } from '@enderass/shared/ui';
import { getDocumentKind } from '@enderass/shared/utils';
import { toLoadableMediaUrl } from '../../public/utils/landing-utils.js';
import { resolveAuctionDocumentHref } from '../utils/auction-document-utils.js';

function FileTypeIcon({ kind }) {
  if (kind === 'pdf') {
    return (
      <svg width="28" height="32" viewBox="0 0 28 32" fill="none">
        <rect x="0.5" y="0.5" width="27" height="31" rx="3.5" fill="#FEF2F2" stroke="#FECACA" />
        <path d="M6 9h16M6 14h16M6 19h10" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="17" y="17" width="8" height="11" rx="2" fill="#EF4444" />
        <path d="M19 20.5h4M19 23.5h4M19 26.5h2" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === 'image') {
    return (
      <svg width="28" height="32" viewBox="0 0 28 32" fill="none">
        <rect x="0.5" y="0.5" width="27" height="31" rx="3.5" fill="#EFF6FF" stroke="#BFDBFE" />
        <circle cx="9.5" cy="11" r="2.5" fill="#3B82F6" />
        <path d="M27 18l-7-5-5 5-4-3-5 6" stroke="#3B82F6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="28" height="32" viewBox="0 0 28 32" fill="none">
      <rect x="0.5" y="0.5" width="27" height="31" rx="3.5" fill="#FAFAFA" stroke="#E5E5E5" />
      <path d="M6 9h16M6 14h16M6 19h12" stroke="#A3A3A3" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function resolveDocumentEntry(doc, docIndex, auctionId, unlocked, t) {
  const rawUrl = typeof doc === 'string' ? doc : doc?.url || doc?.fileUrl || '';
  const name = typeof doc === 'string'
    ? t('bidder.participation.document')
    : (doc?.name || doc?.fileName || t('bidder.participation.document'));

  const url = unlocked && auctionId
    ? resolveAuctionDocumentHref({
        auctionId,
        doc,
        docIndex,
        unlocked: true,
      })
    : (toLoadableMediaUrl(rawUrl) || rawUrl);

  const kind = getDocumentKind(name) || getDocumentKind(rawUrl) || (unlocked && auctionId ? 'pdf' : 'file');

  return { url, name, docIndex, kind };
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
  const [viewerDoc, setViewerDoc] = useState(null);

  const items = useMemo(
    () => documents
      .map((doc, index) => resolveDocumentEntry(doc, index, auctionId, unlocked, t))
      .filter((doc) => Boolean(doc.url)),
    [auctionId, documents, unlocked, t],
  );

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
    <>
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
          <div className="auction-documents__card-grid">
            {items.map((doc) => (
              <button
                key={`${doc.url}-${doc.docIndex}`}
                type="button"
                className="auction-documents__card"
                onClick={() => setViewerDoc(doc)}
                aria-label={t('bidder.participation.viewDocumentNamed', { name: doc.name })}
              >
                <div className="auction-documents__card-icon">
                  <FileTypeIcon kind={doc.kind} />
                </div>
                <div className="auction-documents__card-body">
                  <span className="auction-documents__card-name">{doc.name}</span>
                  <span className="auction-documents__card-action">
                    {t('bidder.participation.viewDocument')}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="auction-documents__card-arrow">
                      <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {viewerDoc && (
        <DocumentViewer
          url={viewerDoc.url}
          title={viewerDoc.name}
          kind={viewerDoc.kind}
          onClose={() => setViewerDoc(null)}
        />
      )}
    </>
  );
}

export default AuctionDocumentsBlock;
