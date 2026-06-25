import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { settingService } from '../services/setting-service.js';

export function useSettings() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await settingService.getSettings();
      setSettings(response?.settings ?? {});
    } catch (err) {
      setError(err instanceof Error ? err.message : t('settings.loadFailed'));
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const saveSettings = useCallback(
    async (patch) => {
      setSaving(true);
      setSaveError('');

      try {
        const response = await settingService.updateSettings(patch);
        setSettings(response?.settings ?? patch);
        return true;
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : t('settings.saveFailed'));
        return false;
      } finally {
        setSaving(false);
      }
    },
    [t],
  );

  return {
    settings,
    loading,
    saving,
    error,
    saveError,
    reload: load,
    saveSettings,
  };
}

export default useSettings;
