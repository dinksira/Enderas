import { useCallback, useEffect } from 'react';
import { ModalCloseButton } from './ModalCloseButton.jsx';

export function ImageViewer({
  src,
  images,
  index = 0,
  onIndexChange,
  onClose,
  alt = 'Preview',
  previousLabel = 'Previous image',
  nextLabel = 'Next image',
  closeLabel = 'Close',
}) {
  const gallery = Array.isArray(images) && images.length > 0;
  const resolvedImages = gallery ? images : src ? [src] : [];
  const safeIndex = resolvedImages.length
    ? Math.min(Math.max(index, 0), resolvedImages.length - 1)
    : 0;
  const currentSrc = resolvedImages[safeIndex];
  const hasMultiple = resolvedImages.length > 1;

  const goPrev = useCallback(() => {
    if (!hasMultiple) return;
    const nextIndex = (safeIndex - 1 + resolvedImages.length) % resolvedImages.length;
    onIndexChange?.(nextIndex);
  }, [hasMultiple, onIndexChange, resolvedImages.length, safeIndex]);

  const goNext = useCallback(() => {
    if (!hasMultiple) return;
    const nextIndex = (safeIndex + 1) % resolvedImages.length;
    onIndexChange?.(nextIndex);
  }, [hasMultiple, onIndexChange, resolvedImages.length, safeIndex]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key === 'ArrowLeft') {
        goPrev();
      }
      if (event.key === 'ArrowRight') {
        goNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [goNext, goPrev, onClose]);

  if (!currentSrc) {
    return null;
  }

  return (
    <div className="image-viewer-overlay" onClick={onClose}>
      <div
        className="image-viewer-container image-viewer-container--gallery"
        onClick={(event) => event.stopPropagation()}
      >
        <ModalCloseButton onClick={onClose} label={closeLabel} />
        {hasMultiple && (
          <span className="image-viewer-counter">
            {safeIndex + 1} / {resolvedImages.length}
          </span>
        )}

        <div className="image-viewer-stage">
          {hasMultiple && (
            <button
              type="button"
              className="image-viewer-nav image-viewer-nav--prev"
              onClick={goPrev}
              aria-label={previousLabel}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}

          <img src={currentSrc} alt={alt} className="image-viewer-image" />

          {hasMultiple && (
            <button
              type="button"
              className="image-viewer-nav image-viewer-nav--next"
              onClick={goNext}
              aria-label={nextLabel}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ImageViewer;
