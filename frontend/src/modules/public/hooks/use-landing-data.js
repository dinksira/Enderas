import { useEffect, useState } from 'react';
import { publicLandingService } from '@enderass/shared/services';

const EMPTY_LANDING = {
  stats: null,
  featuredAuctions: [],
  heroLot: null,
  categories: [],
  contact: null,
};

/**
 * Single fetch for all public landing page data from the database.
 */
export function useLandingData() {
  const [data, setData] = useState(EMPTY_LANDING);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;

    publicLandingService
      .getLanding()
      .then((payload) => {
        if (cancelled) {
          return;
        }
        setData({
          stats: payload?.stats ?? null,
          featuredAuctions: payload?.featuredAuctions ?? [],
          heroLot: payload?.heroLot ?? null,
          categories: payload?.categories ?? [],
          contact: payload?.contact ?? null,
        });
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('error');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    ...data,
    status,
    statsStatus: status,
    auctionsStatus: status,
  };
}

export default useLandingData;
