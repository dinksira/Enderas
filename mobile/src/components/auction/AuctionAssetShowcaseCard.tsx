import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ImageGallery } from '@/components/shared/ImageGallery';
import { GlassCard } from '@/components/shell/GlassCard';
import { formatEtbAmount } from '@/lib/auctionUtils';
import { useTheme } from '@/lib/appStore';
import { Typography, Spacing } from '@/theme';
import type { AuctionLot } from '@/types/auctionParticipation';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GALLERY_WIDTH = SCREEN_WIDTH - Spacing.md * 2 - 32;
const GALLERY_HEIGHT = 200;

interface AuctionAssetShowcaseCardProps {
  asset: AuctionLot;
}

/**
 * Full asset card for auction detail — manual image slider with thumbnails,
 * matching the asset detail screen experience.
 */
export function AuctionAssetShowcaseCard({ asset }: AuctionAssetShowcaseCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const categoryLabel = t(`dashboard.categories.${asset.category}`, { defaultValue: asset.category });

  return (
    <GlassCard padding={16} style={styles.card} noAnimation>
      <View style={styles.header}>
        <Text style={[Typography.microCaps, { color: colors.goldChampagne }]}>{asset.lotLabel}</Text>
        <Text style={[Typography.cardTitle, { color: colors.cream }]} numberOfLines={2}>
          {asset.title}
        </Text>
      </View>

      <ImageGallery
        imageUrls={asset.imageUrls}
        width={GALLERY_WIDTH}
        height={GALLERY_HEIGHT}
        category={asset.category}
        mode="manual"
        showThumbnails
        borderRadius={14}
      />

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <MaterialCommunityIcons name="tag-outline" size={14} color={colors.textMuted} />
          <Text style={[Typography.caption, { color: colors.textSecondary }]}>{categoryLabel}</Text>
        </View>
        <View style={styles.metaItem}>
          <MaterialCommunityIcons name="cash" size={14} color={colors.textMuted} />
          <Text style={[Typography.caption, { color: colors.textSecondary }]}>
            {t('auction.participation.reserve')}: {formatEtbAmount(asset.reservePrice)}
          </Text>
        </View>
      </View>

      {asset.description ? (
        <View style={styles.locationRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={14} color={colors.textMuted} />
          <Text style={[Typography.bodySmall, { color: colors.textMuted, flex: 1 }]}>{asset.description}</Text>
        </View>
      ) : null}

      {asset.tags?.length ? (
        <Text style={[Typography.caption, { color: colors.goldChampagne }]}>
          {asset.tags.join(' · ')}
        </Text>
      ) : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.sm,
  },
  header: {
    gap: 4,
    marginBottom: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: Spacing.xs,
  },
});

export default AuctionAssetShowcaseCard;
