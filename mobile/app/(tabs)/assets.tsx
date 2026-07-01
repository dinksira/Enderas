import { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { AuthRequired, GoldButton } from '@/components/auth';
import { AssetCard } from '@/components/assets/AssetCard';
import { KycRequiredModal } from '@/components/kyc/KycRequiredModal';
import { AppHeader } from '@/components/shell/AppHeader';
import { Skeleton } from '@/components/ui';
import { useTheme } from '@/lib/appStore';
import { isKycVerified } from '@/lib/auth-utils';
import { useAuthStore, useIsAuthenticated } from '@/lib/authStore';
import { useMyAssets } from '@/hooks/useMyAssets';
import { Typography, Spacing } from '@/theme';

export default function AssetsScreen() {
  const { t } = useTranslation();
  const isAuthenticated = useIsAuthenticated();

  if (!isAuthenticated) {
    return (
      <AuthRequired
        title={t('assets.title')}
        icon="treasure-chest"
        message={t('authRequired.assetsMessage')}
        cta={t('authRequired.loginCta')}
        returnTo="/(tabs)/assets"
      />
    );
  }

  return <AuthenticatedAssetsScreen />;
}

function AuthenticatedAssetsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const { assets, loading, refreshing, error, refresh } = useMyAssets();
  const [showKycModal, setShowKycModal] = useState(false);

  const handleAddAsset = () => {
    if (!isKycVerified(user)) {
      setShowKycModal(true);
      return;
    }
    router.push('/assets/submit' as any);
  };

  const handleAssetPress = useCallback(
    (assetId: string) => {
      router.push(`/assets/${assetId}` as any);
    },
    [],
  );

  const listHeader = (
    <View style={styles.headerBlock}>
      <Text style={[Typography.body, { color: colors.textSecondary }]}>
        {t('assets.subtitle')}
      </Text>
      <GoldButton label={t('assets.addAsset')} onPress={handleAddAsset} />
    </View>
  );

  return (
    <View style={[styles.host, { backgroundColor: colors.base }]}>
      <AppHeader title={t('assets.title')} />
      <FlatList
        data={assets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AssetCard asset={item} onPress={() => handleAssetPress(item.id)} />
        )}
        ListHeaderComponent={listHeader}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={refresh}
        ListEmptyComponent={
          loading ? (
            <View style={styles.skeletonCol}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} style={{ height: 220, borderRadius: 16 }} />
              ))}
            </View>
          ) : error ? (
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons name="alert-circle-outline" size={28} color={colors.danger.fg} />
              <Text style={[Typography.body, { color: colors.danger.fg }]}>{error}</Text>
              <Pressable onPress={refresh} hitSlop={8}>
                <Text style={[Typography.bodyMedium, { color: colors.goldBright, fontWeight: '700' }]}>
                  {t('common.retry')}
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons name="treasure-chest" size={36} color={colors.textMuted} />
              <Text style={[Typography.cardTitle, { color: colors.cream, fontSize: 17 }]}>
                {t('assets.emptyTitle')}
              </Text>
              <Text style={[Typography.body, { color: colors.textMuted }]}>
                {t('assets.emptyHint')}
              </Text>
            </View>
          )
        }
      />
      <KycRequiredModal
        visible={showKycModal}
        onClose={() => setShowKycModal(false)}
        onVerify={() => {
          setShowKycModal(false);
          router.push('/kyc' as any);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm2,
    paddingBottom: Spacing.tabBarClearance,
    flexGrow: 1,
  },
  headerBlock: {
    gap: Spacing.sm2,
    marginBottom: Spacing.md,
  },
  separator: {
    height: Spacing.sm2,
  },
  skeletonCol: {
    gap: Spacing.sm2,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.huge,
    gap: Spacing.xs2,
  },
});
