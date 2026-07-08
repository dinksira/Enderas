import { useEffect, useRef, useState } from 'react';
import { resolveAuctionImageUrl } from '../utils/landing-utils.js';

/**
 * Auction lot photo with lazy loading and category fallback when missing/broken.
 * @param {{
 *   auction: object,
 *   className?: string,
 *   imageClassName?: string,
 *   tag?: import('react').ReactNode,
 * }} props
 */
export function AuctionCardMedia({
  auction,
  className = '',
  imageClassName = '',
  tag = null,
}) {
  const categoryKey = auction?.categoryKey || auction?.category || 'other_assets';
  const imageSrc = resolveAuctionImageUrl(auction);
  const imgRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [imageSrc]);

  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [imageSrc]);

  const showImage = Boolean(imageSrc) && !failed;
  const showFallback = !showImage;

  return (
    <div
      className={[
        'pub-auction-card__media',
        showFallback ? `pub-auction-card__media--${categoryKey}` : '',
        !loaded && showImage ? 'pub-auction-card__media--loading' : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      {showImage && (
        <img
          ref={imgRef}
          key={imageSrc}
          src={imageSrc}
          alt={auction?.title || ''}
          className={['pub-auction-card__image', imageClassName].filter(Boolean).join(' ')}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => {
            setFailed(true);
            setLoaded(false);
          }}
        />
      )}
      {tag}
    </div>
  );
}

export default AuctionCardMedia;
