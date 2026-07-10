import { useEffect, useRef, type ComponentProps } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ImageGallery } from '@/components/shared/ImageGallery';
import { formatEtbAmount, getCategoryTheme } from '@/lib/auctionUtils';
import { useTheme } from '@/lib/appStore';
import { GLASS_RADIUS, glassElevation } from '@/lib/glassStyles';
import { Typography, Spacing } from '@/theme';
import type { AuctionLot } from '@/types/auctionParticipation';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GALLERY_WIDTH = SCREEN_WIDTH - Spacing.md * 2;
const GALLERY_HEIGHT = 240;

interface AuctionAssetDetailModalProps {
  visible: boolean;
  asset: AuctionLot | null;
  onClose: () => void;
}

export function AuctionAssetDetailModal({ visible, asset, onClose }: AuctionAssetDetailModalProps) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(0);
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  if (!asset) return null;

  const theme = getCategoryTheme(asset.category);
  const categoryLabel = t(`dashboard.categories.${asset.category}`, { defaultValue: asset.category });

  const translateY = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [48, 0] });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.overlay, { backgroundColor: colors.scrim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" />

        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.baseElevated,
              borderColor: colors.goldBorder,
              paddingBottom: Math.max(insets.bottom, Spacing.md),
              opacity: slideAnim,
              transform: [{ translateY }],
              ...glassElevation(isDark, 'floating'),
            },
          ]}
        >
          <View style={styles.handleRow}>
            <View style={[styles.handle, { backgroundColor: colors.divider }]} />
          </View>

          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={[Typography.microCaps, { color: colors.goldChampagne }]}>
                {asset.lotLabel}
              </Text>
              <Text style={[Typography.cardTitle, { color: colors.cream }]} numberOfLines={2}>
                {asset.title}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={[styles.closeBtn, { backgroundColor: colors.glassFill, borderColor: colors.goldBorder }]}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
            >
              <MaterialCommunityIcons name="close" size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.gallerySection}>
            <ImageGallery
              imageUrls={asset.imageUrls}
              width={GALLERY_WIDTH}
              height={GALLERY_HEIGHT}
              category={asset.category}
              mode="manual"
              showThumbnails
              borderRadius={14}
            />
            {asset.imageUrls.length > 1 ? (
              <Text style={[Typography.caption, styles.swipeHint, { color: colors.textMuted }]}>
                {t('auction.participation.swipePhotosHint')}
              </Text>
            ) : null}
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            style={styles.detailsScroll}
            contentContainerStyle={styles.detailsContent}
            nestedScrollEnabled
          >
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
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
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
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '92%',
    borderTopLeftRadius: GLASS_RADIUS.floating,
    borderTopRightRadius: GLASS_RADIUS.floating,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    paddingHorizontal: Spacing.md,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gallerySection: {
    marginBottom: Spacing.sm,
  },
  swipeHint: {
    textAlign: 'center',
    marginTop: 6,
    fontStyle: 'italic',
  },
  detailsScroll: {
    flexGrow: 0,
    maxHeight: 200,
  },
  detailsContent: {
    gap: Spacing.sm2,
    paddingBottom: Spacing.xs,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs2,
  },
  metaCell: {
    width: '47%',
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
