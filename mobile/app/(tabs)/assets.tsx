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
import { useOwnedAuctions } from '@/hooks/useOwnedAuctions';
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
  const {
    auctions: ownedAuctions,
    loading: ownedLoading,
    refresh: refreshOwnedAuctions,
  } = useOwnedAuctions();
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

      {!ownedLoading && ownedAuctions.length > 0 ? (
        <View style={[styles.ownedSection, { borderColor: colors.goldBorder, backgroundColor: colors.glassFill }]}>
          <Text style={[styles.ownedTitle, { color: colors.goldChampagne }]}>
            {t('auction.owner.myAuctionsTitle')}
          </Text>
          <Text style={[Typography.caption, { color: colors.textSecondary, marginBottom: 10 }]}>
            {t('auction.owner.myAuctionsSubtitle')}
          </Text>
          {ownedAuctions.map((ownedAuction) => (
            <Pressable
              key={ownedAuction.id}
              onPress={() => router.push(`/auction/${ownedAuction.id}` as any)}
              style={[styles.ownedRow, { borderColor: colors.goldBorder }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[Typography.bodyMedium, { color: colors.cream, fontWeight: '700' }]}>
                  {ownedAuction.title}
                </Text>
                <Text style={[Typography.caption, { color: colors.textMuted }]}>
                  {ownedAuction.bidCount ?? 0} {t('auction.owner.bidCount').toLowerCase()}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.goldBright} />
            </Pressable>
          ))}
        </View>
      ) : null}
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
        onRefresh={() => {
          void refresh();
          void refreshOwnedAuctions();
        }}
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
  ownedSection: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginTop: Spacing.sm2,
  },
  ownedTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  ownedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 10,
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
