import { useEffect } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ScreenShell } from '@/components/shell/ScreenShell';
import { GlassCard } from '@/components/shell/GlassCard';
import { Skeleton } from '@/components/ui';
import { useAssetDetail } from '@/hooks/useAssetDetail';
import { assetStatusTone, OWNERSHIP_DOC_LABEL_KEYS } from '@/lib/assetFormUtils';
import { formatEtbAmount, getCategoryTheme } from '@/lib/auctionUtils';
import { useTheme } from '@/lib/appStore';
import { resolveMediaUrl } from '@/lib/media-utils';
import { ImageGallery } from '@/components/shared/ImageGallery';
import { Typography, Spacing, Radii } from '@/theme';
import { toneToStatus } from '@/theme/statusTones';

const HERO_HEIGHT = 280;
const SCREEN_WIDTH = Dimensions.get('window').width;
const HERO_WIDTH = SCREEN_WIDTH - Spacing.md * 2;

export default function AssetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { asset, loading, error, refresh } = useAssetDetail(id);

  useEffect(() => {
    if (!asset?.imageUrls?.length) return;
    const urls = asset.imageUrls
      .slice(0, 4)
      .map((url) => resolveMediaUrl(url))
      .filter(Boolean) as string[];
    if (urls.length) {
      void Image.prefetch(urls);
    }
  }, [asset?.imageUrls]);

  if (loading) {
    return (
      <ScreenShell
        title={t('assets.detail.title')}
        showBack
        onBack={() => router.back()}
        bottomPadding={40}
      >
        <Skeleton style={{ height: HERO_HEIGHT, borderRadius: Radii.xl, marginBottom: Spacing.sm2 }} />
        <Skeleton style={{ height: 100, borderRadius: Radii.lg, marginBottom: Spacing.sm2 }} />
        <Skeleton style={{ height: 140, borderRadius: Radii.lg }} />
      </ScreenShell>
    );
  }

  if (!asset || error) {
    return (
      <ScreenShell
        title={t('assets.detail.title')}
        showBack
        onBack={() => router.back()}
        bottomPadding={40}
      >
        <GlassCard padding={Spacing.lg}>
          <View style={styles.errorWrap}>
            <MaterialCommunityIcons name="alert-circle-outline" size={32} color={colors.danger.fg} />
            <Text style={[Typography.body, { color: colors.danger.fg, textAlign: 'center' }]}>
              {error ?? t('assets.detail.notFound')}
            </Text>
            <Pressable onPress={refresh} hitSlop={8}>
              <Text style={[Typography.bodyMedium, { color: colors.goldBright, fontWeight: '700' }]}>
                {t('common.retry')}
              </Text>
            </Pressable>
          </View>
        </GlassCard>
      </ScreenShell>
    );
  }

  const theme = getCategoryTheme(asset.assetType);
  const tone = assetStatusTone(asset.status);
  const statusColors = toneToStatus(tone, colors);
  const statusLabel = t(`assets.status.${asset.status}`, {
    defaultValue: asset.status.replace(/_/g, ' '),
  });
  const categoryLabel = t(`dashboard.categories.${asset.assetType}`, {
    defaultValue: asset.assetType,
  });
  const ownershipDocKey = OWNERSHIP_DOC_LABEL_KEYS[asset.ownershipDocumentType];
  const ownershipDocLabel = ownershipDocKey
    ? t(`assets.ownershipDocs.${ownershipDocKey}`)
    : asset.ownershipDocumentType;

  const openDocument = (url: string, name?: string) => {
    const resolved = resolveMediaUrl(url);
    if (resolved) {
      router.push(`/document-viewer?url=${encodeURIComponent(resolved)}&title=${encodeURIComponent(name ?? 'Document')}`);
    }
  };

  return (
    <ScreenShell
      title={t('assets.detail.eyebrow')}
      pageTitle={asset.title}
      showBack
      onBack={() => router.back()}
      bottomPadding={40}
      noFade
    >
      {/* Image gallery hero */}
      <View style={styles.heroWrap}>
        <ImageGallery
          imageUrls={asset.imageUrls}
          width={HERO_WIDTH}
          height={HERO_HEIGHT}
          category={asset.assetType}
          mode="manual"
          showThumbnails={asset.imageUrls.length > 1}
          borderRadius={Radii.xl}
        />

        <View style={styles.heroOverlay}>
          <View style={styles.categoryChip}>
            <MaterialCommunityIcons name={theme.icon} size={12} color="#FFFAF0" />
            <Text style={[Typography.microCaps, styles.categoryChipText]} numberOfLines={1}>
              {categoryLabel}
            </Text>
          </View>
          <View style={styles.statusChip}>
            <View style={[styles.statusDot, { backgroundColor: statusColors.fg }]} />
            <Text style={styles.statusLabel}>{statusLabel}</Text>
          </View>
        </View>
      </View>

      {/* Key facts */}
      <GlassCard padding={Spacing.sm2} style={styles.sectionGap}>
        <View style={styles.factsGrid}>
          <FactCell
            icon="cash"
            label={t('assets.reservePrice')}
            value={formatEtbAmount(asset.desiredReservePrice)}
            valueColor={colors.goldBright}
            colors={colors}
          />
          <FactCell
            icon="calendar-clock"
            label={t('assets.submitted')}
            value={asset.submittedAtFormatted || '—'}
            colors={colors}
          />
          {asset.reviewedAtFormatted ? (
            <FactCell
              icon="check-decagram"
              label={t('assets.detail.reviewed')}
              value={asset.reviewedAtFormatted}
              colors={colors}
            />
          ) : null}
          {asset.auctionTitle ? (
            <FactCell
              icon="gavel"
              label={t('assets.detail.auction')}
              value={asset.auctionTitle}
              colors={colors}
            />
          ) : null}
        </View>
      </GlassCard>

      {/* Location */}
      {asset.location || asset.address ? (
        <GlassCard padding={Spacing.sm2} style={styles.sectionGap}>
          <Text style={[styles.sectionEyebrow, { color: colors.goldChampagne }]}>
            {t('assets.detail.location')}
          </Text>
          {asset.location ? (
            <InfoRow icon="map-marker-outline" label={t('assets.form.fields.location')} value={asset.location} colors={colors} />
          ) : null}
          {asset.address ? (
            <InfoRow icon="home-map-marker" label={t('assets.form.fields.address')} value={asset.address} colors={colors} />
          ) : null}
        </GlassCard>
      ) : null}

      {/* Description */}
      {asset.description ? (
        <GlassCard padding={Spacing.sm2} style={styles.sectionGap}>
          <Text style={[styles.sectionEyebrow, { color: colors.goldChampagne }]}>
            {t('assets.form.fields.description')}
          </Text>
          <Text style={[Typography.body, { color: colors.textSecondary, lineHeight: 23 }]}>
            {asset.description}
          </Text>
        </GlassCard>
      ) : null}

      {/* Condition */}
      {asset.conditionNotes ? (
        <GlassCard padding={Spacing.sm2} style={styles.sectionGap}>
          <Text style={[styles.sectionEyebrow, { color: colors.goldChampagne }]}>
            {t('assets.form.fields.conditionNotes')}
          </Text>
          <Text style={[Typography.body, { color: colors.textSecondary, lineHeight: 23 }]}>
            {asset.conditionNotes}
          </Text>
        </GlassCard>
      ) : null}

      {/* Auction conditions */}
      {asset.auctionConditions ? (
        <GlassCard padding={Spacing.sm2} style={styles.sectionGap}>
          <Text style={[styles.sectionEyebrow, { color: colors.goldChampagne }]}>
            {t('assets.form.fields.auctionConditions')}
          </Text>
          <Text style={[Typography.body, { color: colors.textSecondary, lineHeight: 23 }]}>
            {asset.auctionConditions}
          </Text>
        </GlassCard>
      ) : null}

      {/* Rejection */}
      {asset.rejectionReason ? (
        <GlassCard padding={Spacing.sm2} style={styles.sectionGap} tone="danger">
          <View style={styles.rejectionHeader}>
            <MaterialCommunityIcons name="alert-circle-outline" size={18} color={colors.danger.fg} />
            <Text style={[styles.sectionEyebrow, { color: colors.danger.fg, marginBottom: 0 }]}>
              {t('assets.detail.rejection')}
            </Text>
          </View>
          <Text style={[Typography.body, { color: colors.danger.fg, lineHeight: 23 }]}>
            {asset.rejectionReason}
          </Text>
        </GlassCard>
      ) : null}

      {/* Documents */}
      <GlassCard padding={Spacing.sm2} style={styles.sectionGap}>
        <Text style={[styles.sectionEyebrow, { color: colors.goldChampagne }]}>
          {t('assets.detail.documents')}
        </Text>

        {asset.ownershipDocumentUrl ? (
          <DocumentRow
            name={ownershipDocLabel}
            onPress={() => openDocument(asset.ownershipDocumentUrl!, ownershipDocLabel)}
            colors={colors}
          />
        ) : null}

        {asset.additionalDocuments?.map((doc, index) => (
          <DocumentRow
            key={`${doc.url}-${index}`}
            name={doc.name}
            onPress={() => openDocument(doc.url, doc.name)}
            colors={colors}
          />
        ))}

        {!asset.ownershipDocumentUrl && (!asset.additionalDocuments || asset.additionalDocuments.length === 0) ? (
          <Text style={[Typography.bodySmall, { color: colors.textMuted }]}>
            {t('assets.detail.noDocuments')}
          </Text>
        ) : null}
      </GlassCard>
    </ScreenShell>
  );
}

function FactCell({
  icon,
  label,
  value,
  colors,
  valueColor,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>['colors'];
  valueColor?: string;
}) {
  return (
    <View style={styles.factCell}>
      <View style={[styles.factIcon, { backgroundColor: colors.glassFill, borderColor: colors.goldBorder }]}>
        <MaterialCommunityIcons name={icon} size={16} color={colors.goldBright} />
      </View>
      <View style={styles.factText}>
        <Text style={[Typography.microCaps, { color: colors.textMuted }]}>{label}</Text>
        <Text style={[Typography.bodyMedium, { color: valueColor ?? colors.cream, fontWeight: '700' }]} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  colors,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons name={icon} size={18} color={colors.goldBright} />
      <View style={styles.infoRowText}>
        <Text style={[Typography.microCaps, { color: colors.textMuted }]}>{label}</Text>
        <Text style={[Typography.bodyMedium, { color: colors.cream }]}>{value}</Text>
      </View>
    </View>
  );
}

function DocumentRow({
  name,
  size,
  onPress,
  colors,
}: {
  name: string;
  url?: string;
  size?: number;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const { t } = useTranslation();
  const sizeLabel = size ? ` · ${formatFileSize(size)}` : '';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.docRow,
        {
          backgroundColor: pressed ? colors.glassFillActive : colors.glassFill,
          borderColor: colors.goldBorder,
        },
      ]}
    >
      <View style={[styles.docIcon, { backgroundColor: colors.baseElevated }]}>
        <MaterialCommunityIcons name="file-document-outline" size={20} color={colors.goldBright} />
      </View>
      <View style={styles.docText}>
        <Text style={[Typography.bodyMedium, { color: colors.cream, fontWeight: '600' }]} numberOfLines={1}>
          {name}
        </Text>
        <Text style={[Typography.bodySmall, { color: colors.textMuted }]}>
          {t('assets.detail.tapToOpen')}
          {sizeLabel}
        </Text>
      </View>
      <MaterialCommunityIcons name="open-in-new" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const styles = StyleSheet.create({
  heroWrap: {
    marginBottom: Spacing.sm2,
    position: 'relative',
  },
  heroOverlay: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 3,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xxs,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,250,240,0.22)',
    maxWidth: 140,
  },
  categoryChipText: {
    color: '#FFFAF0',
    fontSize: 10,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xxs,
    borderRadius: Radii.full,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderColor: 'rgba(255,250,240,0.24)',
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#FFFAF0',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sectionGap: {
    marginBottom: Spacing.sm2,
  },
  sectionEyebrow: {
    ...Typography.microCaps,
    marginBottom: Spacing.xs,
    letterSpacing: 1.2,
  },
  factsGrid: {
    gap: Spacing.sm,
  },
  factCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  factIcon: {
    width: 36,
    height: 36,
    borderRadius: Radii.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  factText: {
    flex: 1,
    gap: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  infoRowText: {
    flex: 1,
    gap: 2,
  },
  rejectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radii.sm,
    borderWidth: 1,
    marginTop: Spacing.xs,
  },
  docIcon: {
    width: 40,
    height: 40,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docText: {
    flex: 1,
    gap: 2,
  },
  errorWrap: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
});
