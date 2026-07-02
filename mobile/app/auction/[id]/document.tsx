import { useMemo } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { GoldButton } from '@/components/auth';
import { ParticipationStatusBanner } from '@/components/auction/ParticipationStatusBanner';
import { ScreenShell } from '@/components/shell/ScreenShell';
import { GlassCard } from '@/components/shell/GlassCard';
import { useAuctionParticipation } from '@/hooks/useAuctionParticipation';
import { openAuctionDocumentInBrowser } from '@/lib/auctionDocumentUtils';
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

  const handleOpenInBrowser = async () => {
    if (!id) return;
    const opened = await openAuctionDocumentInBrowser(id, auction?.documents, 0, accessToken);
    if (!opened) {
      Alert.alert(t('auction.participation.downloadErrorTitle'), t('auction.participation.downloadErrorBody'));
    }
  };

  if (loading && !auction) {
    return (
      <ScreenShell title={t('auction.participation.viewDoc')} showBack onBack={() => router.back()} bottomPadding={40}>
        <ActivityIndicator color={colors.goldBright} />
      </ScreenShell>
    );
  }

  if (!auction || !id || error) {
    return (
      <ScreenShell title={t('auction.participation.viewDoc')} showBack onBack={() => router.back()} bottomPadding={40}>
        <GlassCard padding={Spacing.lg}>
          <Text style={[Typography.body, { color: colors.danger.fg }]}>
            {error ?? t('dashboard.browse.detailError')}
          </Text>
        </GlassCard>
      </ScreenShell>
    );
  }

  if (!documentApproved) {
    return (
      <ScreenShell
        title={t('auction.participation.viewDoc')}
        pageTitle={auction.title}
        showBack
        onBack={() => router.back()}
        bottomPadding={40}
      >
        <ParticipationStatusBanner
          tone="pending"
          icon="lock-outline"
          title={t('auction.participation.viewDocLockedTitle')}
          message={t('auction.participation.viewDocLocked')}
        />
        <GoldButton
          label={t('auction.participation.buyDoc')}
          onPress={() => router.push(`/auction/${id}/buy-doc`)}
        />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      title={t('auction.participation.viewDoc')}
      pageTitle={documentMeta?.name ?? auction.title}
      showBack
      onBack={() => router.back()}
      bottomPadding={40}
    >
      <GlassCard padding={16}>
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="file-pdf-box" size={32} color={colors.danger.fg} />
          <View style={styles.metaCopy}>
            <Text style={[Typography.cardTitle, { color: colors.cream }]}>
              {documentMeta?.name ?? t('auction.participation.pdfDocument')}
            </Text>
            <Text style={[Typography.caption, { color: colors.textMuted }]}>
              {t('auction.participation.browserViewerHint')}
            </Text>
          </View>
        </View>
      </GlassCard>

      <GoldButton
        label={t('auction.participation.openExternal')}
        onPress={() => {
          void handleOpenInBrowser();
        }}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaCopy: {
    flex: 1,
    gap: 4,
  },
});
