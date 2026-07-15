import { useState } from 'react';
import { Dimensions, LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { ImageGallery } from '@/components/shared/ImageGallery';
import { Sheet } from '@/components/sheet';
import { formatEtbAmount, getCategoryTheme } from '@/lib/auctionUtils';
import { useTheme } from '@/lib/appStore';
import { Spacing, Typography } from '@/theme';
import type { AuctionLot } from '@/types/auctionParticipation';

const GALLERY_HEIGHT = 260;
/** Fallback until the sheet body measures its real width (screen − sheet padding). */
const INITIAL_GALLERY_WIDTH = Dimensions.get('window').width - Spacing.md * 2;

interface AuctionAssetDetailModalProps {
  visible: boolean;
  asset: AuctionLot | null;
  onClose: () => void;
}

/**
 * Asset detail sheet — image gallery + meta grid + tags.
 *
 * Was previously a hand-rolled RN `Modal` with its own `Animated`
 * translateY + opacity choreography, `statusBarTranslucent`, and an
 * absolute-positioned press catcher. Now built on `<Sheet>` so it
 * shares backdrop, handle, gesture-dismiss, and keyboard-aware
 * behavior with every other overlay in the app.
 *
 * Image gallery width is calculated from the sheet body width (which
 * equals screen width minus the sheet's horizontal padding) — it no
 * longer relies on `Dimensions.get('window')`.
 */
export function AuctionAssetDetailModal({ visible, asset, onClose }: AuctionAssetDetailModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [galleryWidth, setGalleryWidth] = useState(INITIAL_GALLERY_WIDTH);

  // ⚠️ Do NOT early-return before the Sheet mounts. Returning `null` when
  // `asset` is null would unmount the <Sheet> entirely, so the next time
  // `asset` becomes non-null the Sheet pops in with NO entrance animation
  // (and the prior dismiss was also yanked without an exit animation).
  // Instead, keep the Sheet mounted with `visible={visible}` and gate the
  // *body* on `asset` — that way the Sheet's enter/exit animations run
  // normally and the body just renders nothing during the gap.

  const theme = asset ? getCategoryTheme(asset.category) : null;
  const categoryLabel = asset
    ? t(`dashboard.categories.${asset.category}`, { defaultValue: asset.category })
    : '';

  const handleGalleryLayout = (event: LayoutChangeEvent) => {
    const measured = event.nativeEvent.layout.width;
    if (measured > 0 && Math.abs(measured - galleryWidth) > 1) {
      setGalleryWidth(measured);
    }
  };

  return (
    <Sheet
      visible={visible}
      snapPoints={['90%']}
      onDismiss={onClose}
      contentPadding={Spacing.md}
    >
      {asset && theme ? (
        <>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={[Typography.microCaps, { color: colors.goldChampagne }]}>
                {asset.lotLabel}
              </Text>
              <Text style={[Typography.cardTitle, { color: colors.cream }]} numberOfLines={2}>
                {asset.title}
              </Text>
            </View>
          </View>

          <View style={styles.gallerySection} onLayout={handleGalleryLayout}>
            <ImageGallery
              imageUrls={asset.imageUrls}
              width={galleryWidth}
              height={GALLERY_HEIGHT}
              category={asset.category}
              mode="manual"
              showThumbnails
              borderRadius={16}
            />
            {asset.imageUrls.length > 1 ? (
              <View style={styles.swipeHintRow}>
                <MaterialCommunityIcons name="gesture-swipe-horizontal" size={13} color={colors.textMuted} />
                <Text style={[Typography.caption, { color: colors.textMuted }]}>
                  {t('auction.participation.swipePhotosHint')}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.metaGrid}>
            <MetaCell
              icon={theme.icon}
              label={t('dashboard.browse.category')}
              value={categoryLabel}
              colors={colors}
            />
            <MetaCell
              icon="cash"
              label={t('auction.participation.reserve')}
              value={formatEtbAmount(asset.reservePrice)}
              colors={colors}
            />
            {asset.description ? (
              <MetaCell
                icon="map-marker-outline"
                label={t('assets.detail.location')}
                value={asset.description}
                colors={colors}
                fullWidth
              />
            ) : null}
          </View>

          {asset.tags?.length ? (
            <View style={styles.tagsRow}>
              {asset.tags.map((tag) => (
                <View
                  key={tag}
                  style={[styles.tag, { backgroundColor: colors.glassFill, borderColor: colors.goldBorder }]}
                >
                  <Text style={[Typography.caption, { color: colors.goldChampagne }]}>{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </>
      ) : null}
    </Sheet>
  );
}

function MetaCell({
  icon,
  label,
  value,
  colors,
  fullWidth,
}: {
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>['colors'];
  fullWidth?: boolean;
}) {
  return (
    <View
      style={[
        styles.metaCell,
        fullWidth && styles.metaCellFull,
        { backgroundColor: colors.glassFill, borderColor: colors.goldBorder },
      ]}
    >
      <MaterialCommunityIcons name={icon} size={16} color={colors.goldChampagne} />
      <View style={styles.metaText}>
        <Text style={[Typography.microCaps, { color: colors.textMuted, fontSize: 9 }]}>{label}</Text>
        <Text style={[Typography.bodyMedium, { color: colors.cream, fontWeight: '700' }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm2,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  gallerySection: {
    marginBottom: Spacing.md,
  },
  swipeHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 8,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs2,
    marginBottom: Spacing.md,
  },
  metaCell: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
  },
  metaCellFull: {
    width: '100%',
  },
  metaText: {
    flex: 1,
    gap: 2,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: 999,
    borderWidth: 1,
  },
});

export default AuctionAssetDetailModal;
