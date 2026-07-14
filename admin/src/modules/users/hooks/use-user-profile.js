import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { userService } from '@enderass/shared/services';

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
      const me = await userService.getMe();
      setProfile(me);

      try {
        const kycResponse = await userService.getMe().catch(() => null);
        setKyc(kycResponse?.kyc ?? null);
      } catch {
        setKyc(null);
      }
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

  const updateProfile = useCallback(async (patch) => {
    const result = await userService.updateMe(patch);
    if (result?.user) {
      setProfile((prev) => ({
        ...prev,
        identity: {
          ...prev?.identity,
          displayName: [result.user.firstName, result.user.lastName].filter(Boolean).join(' ') || prev?.identity?.displayName,
          email: result.user.email ?? prev?.identity?.email,
        },
        avatarUrl: result.user.avatarUrl ?? prev?.avatarUrl,
      }));
    }
    return result;
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    return userService.changePassword({ currentPassword, newPassword });
  }, []);

  const updateAvatar = useCallback(async (file) => {
    const result = await userService.updateAvatar(file);
    if (result?.avatarUrl) {
      setProfile((prev) => ({
        ...prev,
        avatarUrl: result.avatarUrl,
      }));
    }
    return result;
  }, []);

  return { profile, kyc, loading, error, refetch: fetchProfile, updateProfile, changePassword, updateAvatar };
}

export default useUserProfile;
