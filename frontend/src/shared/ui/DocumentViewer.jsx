import { useTranslation } from 'react-i18next';
import { getDocumentKind } from '../utils/document-utils.js';
import { ImageViewer } from './ImageViewer.jsx';
import { ModalCloseButton } from './ModalCloseButton.jsx';

/**
 * @param {{
 *   url: string,
 *   title?: string,
 *   kind?: 'image' | 'pdf' | 'file',
 *   onClose: () => void,
 *   openInNewTabLabel?: string,
 *   previewUnavailableLabel?: string,
 * }} props
 */
export function DocumentViewer({
  url,
  title = 'Document',
  kind: kindOverride,
  onClose,
  openInNewTabLabel,
  previewUnavailableLabel,
}) {
  const { t } = useTranslation();
  const resolvedKind = kindOverride || getDocumentKind(url) || getDocumentKind(title);
  const kind = resolvedKind || (url.includes('/documents/') && url.includes('/stream') ? 'pdf' : 'file');

  if (kind === 'image') {
    return <ImageViewer src={url} alt={title} onClose={onClose} />;
  }

  if (kind === 'pdf') {
    return (
      <div className="kyc-modal-overlay kyc-modal-overlay--document-viewer" role="presentation" onClick={onClose}>
        <div className="kyc-pdf-viewer" onClick={(event) => event.stopPropagation()}>
          <header className="kyc-pdf-viewer__header">
            <p className="document-viewer__title">{title}</p>
            <ModalCloseButton onClick={onClose} />
          </header>
          <iframe title={title} src={url} className="kyc-pdf-viewer__frame" />
        </div>
      </div>
    );
  }

  return (
    <div className="kyc-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="kyc-modal document-viewer-fallback"
        role="dialog"
        aria-modal="true"
        aria-labelledby="document-viewer-fallback-title"
        onClick={(event) => event.stopPropagation()}
      >
        <ModalCloseButton onClick={onClose} />
        <h2 id="document-viewer-fallback-title" className="kyc-modal__title">
          {title}
        </h2>
        <p className="kyc-modal__body">
          {previewUnavailableLabel || t('bidder.participation.documentPreviewUnavailable')}
        </p>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="document-viewer-fallback__link"
        >
          {openInNewTabLabel || t('bidder.participation.openDocument')}
        </a>
      </div>
    </div>
  );
}

export default DocumentViewer;
