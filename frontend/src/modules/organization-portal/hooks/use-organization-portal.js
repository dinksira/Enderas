import { useState, useEffect, useCallback } from 'react';
import { organizationPortalService } from '../services/organization-portal-service.js';

export function useOrganizationPortal() {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [assets, setAssets] = useState([]);
  const [linkedAuctions, setLinkedAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await organizationPortalService.getPortal();
      setProfile(data.profile);
      setStats(data.stats);
      setAssets(data.assets || []);
      setLinkedAuctions(data.linkedAuctions || []);
    } catch (err) {
      setError(err.message || 'Failed to load organization portal');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { profile, stats, assets, linkedAuctions, loading, error, reload: load };
}

export default useOrganizationPortal;
