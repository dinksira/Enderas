import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { File, Paths } from 'expo-file-system';
import * as WebBrowser from 'expo-web-browser';
import { WebView } from 'react-native-webview';

import { GoldButton } from '@/components/auth';
import { ParticipationStatusBanner } from '@/components/auction/ParticipationStatusBanner';
import { ScreenShell } from '@/components/shell/ScreenShell';
import { GlassCard } from '@/components/shell/GlassCard';
import { getMockDocumentForAuction } from '@/data/mockAuctionLots';
import { findMockAuctionById } from '@/data/mockAuctions';
import { useAuctionParticipation } from '@/hooks/useAuctionParticipation';
import { useTheme } from '@/lib/appStore';
import { Typography, Spacing, Radii } from '@/theme';

export default function AuctionDocumentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const auction = useMemo(() => (id ? findMockAuctionById(id) : undefined), [id]);
  const document = useMemo(() => (id ? getMockDocumentForAuction(id) : undefined), [id]);
  const { documentApproved } = useAuctionParticipation(id ?? '');
  const [downloading, setDownloading] = useState(false);
  const [webError, setWebError] = useState(false);

  if (!auction || !id) {
    return (
      <ScreenShell title={t('auction.participation.viewDoc')} showBack onBack={() => router.back()} bottomPadding={40}>
        <GlassCard padding={Spacing.lg}>
          <Text style={[Typography.body, { color: colors.danger.fg }]}>
            {t('dashboard.browse.detailError')}
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

  const handleDownload = async () => {
    if (!document?.url) return;
    setDownloading(true);
    try {
      const destination = new File(Paths.document, `${document.id}.pdf`);
      const downloaded = await File.downloadFileAsync(document.url, destination, { idempotent: true });
      Alert.alert(
        t('auction.participation.downloadCompleteTitle'),
        t('auction.participation.downloadCompleteBody', { path: downloaded.uri }),
      );
    } catch {
      Alert.alert(t('auction.participation.downloadErrorTitle'), t('auction.participation.downloadErrorBody'));
    } finally {
      setDownloading(false);
    }
  };

  const handleOpenExternal = () => {
    if (!document?.url) return;
    WebBrowser.openBrowserAsync(document.url).catch(() => {});
  };

  const viewerUrl =
    Platform.OS === 'web'
      ? document?.url
      : `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(document?.url ?? '')}`;

  return (
    <ScreenShell
      title={t('auction.participation.viewDoc')}
      pageTitle={document?.title ?? auction.title}
      showBack
      onBack={() => router.back()}
      bottomPadding={40}
    >
      <GlassCard padding={14} style={styles.metaCard}>
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="file-pdf-box" size={28} color={colors.danger.fg} />
          <View style={styles.metaCopy}>
            <Text style={[Typography.cardTitle, { color: colors.cream }]}>{document?.title}</Text>
            <Text style={[Typography.caption, { color: colors.textMuted }]}>
              {t('auction.participation.pdfDocument')}
            </Text>
          </View>
        </View>
      </GlassCard>

      <View style={[styles.viewer, { borderColor: colors.goldBorder, backgroundColor: colors.baseElevated }]}>
        {webError ? (
          <View style={styles.viewerFallback}>
            <MaterialCommunityIcons name="file-eye-outline" size={36} color={colors.textMuted} />
            <Text style={[Typography.bodySmall, { color: colors.textSecondary, textAlign: 'center' }]}>
              {t('auction.participation.viewerFallback')}
            </Text>
            <GoldButton label={t('auction.participation.openExternal')} onPress={handleOpenExternal} compact />
          </View>
        ) : (
          <WebView
            source={{ uri: viewerUrl ?? '' }}
            onError={() => setWebError(true)}
            onHttpError={() => setWebError(true)}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.loading}>
                <ActivityIndicator color={colors.goldBright} />
              </View>
            )}
            style={styles.webview}
          />
        )}
      </View>

      <View style={styles.actions}>
        <View style={styles.actionCol}>
          <GoldButton
            label={downloading ? '...' : t('auction.participation.downloadDoc')}
            onPress={handleDownload}
            disabled={downloading}
            compact
          />
        </View>
        <View style={styles.actionCol}>
          <GoldButton
            label={t('auction.participation.openExternal')}
            onPress={handleOpenExternal}
            variant="outline"
            compact
          />
        </View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  metaCard: {
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaCopy: {
    flex: 1,
    gap: 2,
  },
  viewer: {
    height: 420,
    borderRadius: Radii.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loading: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionCol: {
    flex: 1,
    minWidth: 0,
  },
});
