import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';

import { AuthRequired } from '@/components/auth';
import { AssetSubmitWizard } from '@/components/assets/AssetSubmitWizard';
import { KycRequiredModal } from '@/components/kyc/KycRequiredModal';
import { useTheme } from '@/lib/appStore';
import { isKycVerified } from '@/lib/auth-utils';
import { useAuthStore, useIsAuthenticated } from '@/lib/authStore';

export default function AssetSubmitScreen() {
  const { t } = useTranslation();
  const isAuthenticated = useIsAuthenticated();

  if (!isAuthenticated) {
    return (
      <AuthRequired
        title={t('assets.requestWizard.title')}
        icon="treasure-chest"
        message={t('authRequired.assetsMessage')}
        cta={t('authRequired.loginCta')}
        returnTo="/assets/submit"
      />
    );
  }

  return <KycGatedAssetSubmit />;
}

function KycGatedAssetSubmit() {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);

  if (!isKycVerified(user)) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.base }}>
        <KycRequiredModal
          visible
          onClose={() => router.replace('/(tabs)/assets')}
          onVerify={() => router.push('/kyc' as any)}
        />
      </View>
    );
  }

  return <AssetSubmitWizard />;
}
