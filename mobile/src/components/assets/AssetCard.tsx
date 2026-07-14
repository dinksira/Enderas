import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/lib/appStore';
import { assetStatusTone } from '@/lib/assetFormUtils';
import { formatEtbAmount, getCategoryTheme } from '@/lib/auctionUtils';
import { resolveMediaUrl } from '@/lib/media-utils';
import { Typography, Spacing, Radii } from '@/theme';
import { toneToStatus } from '@/theme/statusTones';
import { PressableScale } from '@/components/ui';
import type { AssetRecord } from '@/types/asset';

interface AssetCardProps {
  asset: AssetRecord;
  onPress?: () => void;
}

/**
 * Card for a single user-owned asset, shown in the "My Assets" list.
 * Styled to match the dashboard BrowseAuctionCard — glass surface,
 * category chip, status pill, and a real thumbnail from the backend.
 */
function AssetCardImpl({ asset, onPress }: AssetCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const theme = getCategoryTheme(asset.assetType);
  const tone = assetStatusTone(asset.status);
  const statusColors = toneToStatus(tone, colors);

  const statusLabel = t(`assets.status.${asset.status}`, {
    defaultValue: asset.status.replace(/_/g, ' '),
  });
  const categoryLabel = t(`dashboard.categories.${asset.assetType}`, {
    defaultValue: asset.assetType,
  });
  const thumbnailUri = resolveMediaUrl(asset.imageUrls[0]);

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.97}
      accessibilityRole="button"
      accessibilityLabel={t('assets.viewDetails')}
    >
      <View
        style={[
          styles.card,
          { backgroundColor: colors.glassFill, borderColor: colors.goldBorder },
        ]}
      >
        <View style={styles.thumbWrap}>
          {thumbnailUri ? (
            <Image
              source={{ uri: thumbnailUri }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={0}
            />
          ) : (
            <LinearGradient
              colors={theme.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          )}
          <LinearGradient
            colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.55)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.thumbTop}>
            <View style={styles.categoryChip}>
              <MaterialCommunityIcons name={theme.icon} size={12} color="#FFFAF0" />
              <Text style={[Typography.microCaps, styles.categoryChipText]} numberOfLines={1}>
                {categoryLabel}
              </Text>
            </View>
          </View>

          <View style={styles.thumbBottom}>
            <View
              style={[
                styles.statusChip,
                {
                  backgroundColor: colors.base,
                  borderColor: statusColors.border,
                },
              ]}
            >
              <View style={[styles.statusDot, { backgroundColor: statusColors.fg }]} />
              <Text style={[Typography.microCaps, { color: statusColors.fg, letterSpacing: 0.5 }]}>
                {statusLabel}
              </Text>
            </View>
          </View>

          {!thumbnailUri ? (
            <View style={styles.thumbIcon}>
              <MaterialCommunityIcons name={theme.icon} size={36} color="rgba(255,250,240,0.35)" />
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <Text style={[Typography.cardTitle, { color: colors.cream }]} numberOfLines={2}>
            {asset.title}
          </Text>

          {asset.description ? (
            <Text
              style={[Typography.bodySmall, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              {asset.description}
            </Text>
          ) : null}

          <View style={[styles.metaRow, { borderTopColor: colors.divider }]}>
            <View style={styles.metaCol}>
              <Text style={[Typography.microCaps, { color: colors.textMuted }]}>
                {t('assets.reservePrice')}
              </Text>
              <Text style={[Typography.bodyMedium, { color: colors.goldBright, fontWeight: '800' }]}>
                {formatEtbAmount(asset.desiredReservePrice)}
              </Text>
            </View>
            <View style={[styles.metaCol, { alignItems: 'flex-end' }]}>
              <Text style={[Typography.microCaps, { color: colors.textMuted }]}>
                {t('assets.submitted')}
              </Text>
              <Text style={[Typography.bodyMedium, { color: colors.cream, fontWeight: '800' }]}>
                {asset.submittedAtFormatted || '—'}
              </Text>
            </View>
          </View>

          {asset.location ? (
            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={14} color={colors.textMuted} />
              <Text
                style={[Typography.bodySmall, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {asset.location}
              </Text>
            </View>
          ) : null}

          {asset.rejectionReason ? (
            <Text
              style={[Typography.bodySmall, { color: colors.danger.fg }]}
              numberOfLines={2}
            >
              {t('assets.rejectionReason', { reason: asset.rejectionReason })}
            </Text>
          ) : null}
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  thumbWrap: {
    height: 140,
    position: 'relative',
  },
  thumbTop: {
    flexDirection: 'row',
    padding: Spacing.xs,
    zIndex: 2,
  },
  thumbBottom: {
    position: 'absolute',
    bottom: Spacing.xs,
    right: Spacing.xs,
    zIndex: 2,
  },
  thumbIcon: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xxs,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,250,240,0.3)',
    maxWidth: 140,
  },
  categoryChipText: {
    color: '#FFFAF0',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs2,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xxs,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  body: {
    padding: Spacing.sm2,
    gap: Spacing.xxs2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: Spacing.xs2,
    marginTop: Spacing.xxs,
    gap: Spacing.sm,
  },
  metaCol: {
    flex: 1,
    gap: Spacing.xxs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
    marginTop: Spacing.xxs,
  },
});

export const AssetCard = memo(AssetCardImpl);
export default AssetCard;
