import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppHeader } from '@/components/shell/AppHeader';
import { DocumentViewer } from '@/components/shared/DocumentViewer';
import { ParticipationStatusBanner } from '@/components/auction/ParticipationStatusBanner';
import { GlassCard } from '@/components/shell/GlassCard';
import { useAuctionParticipation } from '@/hooks/useAuctionParticipation';
import { resolveAuctionDocumentUrl } from '@/lib/auctionDocumentUtils';
import { useTheme } from '@/lib/appStore';
import { useAuthStore } from '@/lib/authStore';
import { Typography, Spacing } from '@/theme';

export default function AuctionDocumentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const auctionId = id ?? '';
  const accessToken = useAuthStore((s) => s.accessToken);
  const { auction, documentApproved, loading, error } = useAuctionParticipation(auctionId);

  const documentMeta = useMemo(() => auction?.documents?.[0] ?? null, [auction?.documents]);
  const documentUrl = useMemo(
    () => (id ? resolveAuctionDocumentUrl(id, auction?.documents, 0, accessToken) : undefined),
    [accessToken, auction?.documents, id],
  );

  if (loading && !auction) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.base }]}>
        <AppHeader title={t('auction.participation.viewDoc')} showBack onBack={() => router.back()} hideActions />
        <View style={styles.centered}>
          <ActivityIndicator color={colors.goldBright} />
        </View>
      </View>
    );
  }

  if (!auction || !id || error) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.base }]}>
        <AppHeader title={t('auction.participation.viewDoc')} showBack onBack={() => router.back()} hideActions />
        <View style={styles.content}>
          <GlassCard padding={Spacing.lg}>
            <Text style={[Typography.body, { color: colors.danger.fg }]}>
              {error ?? t('dashboard.browse.detailError')}
            </Text>
          </GlassCard>
        </View>
      </View>
    );
  }

  if (!documentUrl) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.base }]}>
        <AppHeader title={t('auction.participation.viewDoc')} showBack onBack={() => router.back()} hideActions />
        <View style={styles.content}>
          <GlassCard padding={Spacing.lg}>
            <Text style={[Typography.body, { color: colors.danger.fg }]}>
              {t('auction.participation.downloadErrorBody')}
            </Text>
          </GlassCard>
        </View>
      </View>
    );
  }

  if (!documentApproved) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.base }]}>
        <AppHeader title={t('auction.participation.viewDoc')} showBack onBack={() => router.back()} hideActions />
        <View style={styles.content}>
          <ParticipationStatusBanner
            tone="pending"
            icon="lock-outline"
            title={t('auction.participation.viewDocLockedTitle')}
            message={t('auction.participation.viewDocLocked')}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.base }]}>
      <AppHeader
        title={documentMeta?.name ?? auction.title}
        showBack
        onBack={() => router.back()}
        hideActions
      />
      <DocumentViewer documentUrl={documentUrl} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
    paddingTop: Spacing.sm,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
