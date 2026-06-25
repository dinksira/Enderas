import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getMyKYC } from '../../kyc/services/kyc.service.js';
import { userService } from '../services/user-service.js';
import { formatDate } from '../utils/user-management-utils.js';

export function useUserProfile() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [kyc, setKyc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [me, kycResponse] = await Promise.all([
        userService.getMe(),
        getMyKYC().catch(() => null),
      ]);

      setProfile(me);
      setKyc(kycResponse?.kyc ?? kycResponse ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('users.profile.loadFailed'));
      setProfile(null);
      setKyc(null);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, kyc, loading, error, refetch: fetchProfile };
}

export default useUserProfile;
