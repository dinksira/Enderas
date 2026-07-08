import { useTranslation } from 'react-i18next';

/**
 * Top-section gallery — hero preview with prev/next and thumbnail filmstrip below.
 */
export function AuctionImageGallery({
  images,
  title,
  activeIndex,
  onActiveIndexChange,
  onOpenViewer,
}) {
  const { t } = useTranslation();
  const hasMultiple = images.length > 1;
  const safeIndex = Math.min(Math.max(activeIndex, 0), Math.max(images.length - 1, 0));
  const currentImage = images[safeIndex];

  const goPrev = () => {
    if (!hasMultiple) return;
    onActiveIndexChange((safeIndex - 1 + images.length) % images.length);
  };

  const goNext = () => {
    if (!hasMultiple) return;
    onActiveIndexChange((safeIndex + 1) % images.length);
  };

  if (!currentImage) {
    return null;
  }

  return (
    <section className="bidder-gallery bidder-gallery--top" aria-label={t('bidder.browse.photos')}>
      <div className="bidder-gallery__stage">
        <button
          type="button"
          className="bidder-gallery__stage-btn"
          onClick={() => onOpenViewer(safeIndex)}
          aria-label={t('bidder.browse.gallery.openImage', { index: safeIndex + 1, total: images.length })}
        >
          <img src={currentImage} alt={title} className="bidder-gallery__stage-image" />
          <span className="bidder-gallery__stage-shade" aria-hidden="true" />
          <span className="bidder-gallery__stage-hint">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
            {t('bidder.browse.gallery.expand')}
          </span>
        </button>

        {hasMultiple && (
          <>
            <button
              type="button"
              className="bidder-gallery__nav bidder-gallery__nav--prev"
              onClick={(event) => {
                event.stopPropagation();
                goPrev();
              }}
              aria-label={t('bidder.browse.gallery.previous')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              className="bidder-gallery__nav bidder-gallery__nav--next"
              onClick={(event) => {
                event.stopPropagation();
                goNext();
              }}
              aria-label={t('bidder.browse.gallery.next')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
            <span className="bidder-gallery__badge">
              {t('bidder.browse.gallery.imageCounter', { current: safeIndex + 1, total: images.length })}
            </span>
          </>
        )}
      </div>

      {hasMultiple && (
        <div className="bidder-gallery__filmstrip" role="list" aria-label={t('bidder.browse.photos')}>
          {images.map((imageUrl, index) => (
            <button
              key={`${imageUrl}-${index}`}
              type="button"
              role="listitem"
              className={`bidder-gallery__film-thumb${index === safeIndex ? ' bidder-gallery__film-thumb--active' : ''}`}
              onClick={() => onActiveIndexChange(index)}
              aria-label={t('bidder.browse.gallery.selectImage', { index: index + 1, total: images.length })}
              aria-current={index === safeIndex ? 'true' : undefined}
            >
              <img src={imageUrl} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export default AuctionImageGallery;
