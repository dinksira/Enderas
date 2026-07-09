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
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ImageGallery } from '@/components/shared/ImageGallery';
import { formatEtbAmount, getCategoryTheme } from '@/lib/auctionUtils';
import { useTheme } from '@/lib/appStore';
import { GLASS_RADIUS, glassElevation } from '@/lib/glassStyles';
import { Typography, Spacing } from '@/theme';
import type { AuctionLot } from '@/types/auctionParticipation';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GALLERY_WIDTH = SCREEN_WIDTH - Spacing.md * 2 - Spacing.lg * 2;
const GALLERY_HEIGHT = 220;

interface AuctionAssetDetailModalProps {
  visible: boolean;
  asset: AuctionLot | null;
  onClose: () => void;
}

export function AuctionAssetDetailModal({ visible, asset, onClose }: AuctionAssetDetailModalProps) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, anim]);

  if (!asset) return null;

  const theme = getCategoryTheme(asset.category);
  const categoryLabel = t(`dashboard.categories.${asset.category}`, { defaultValue: asset.category });

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.overlay, { backgroundColor: colors.scrim }]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.card,
                {
                  backgroundColor: colors.baseElevated,
                  borderColor: colors.goldBorder,
                  opacity: anim,
                  transform: [{ scale }],
                  ...glassElevation(isDark, 'floating'),
                },
              ]}
            >
              <View style={styles.header}>
                <View style={styles.headerCopy}>
                  <Text style={[Typography.microCaps, { color: colors.goldChampagne }]}>
                    {asset.lotLabel}
                  </Text>
                  <Text style={[Typography.cardTitle, { color: colors.cream }]} numberOfLines={2}>
                    {asset.title}
                  </Text>
                </View>
                <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button">
                  <MaterialCommunityIcons name="close" size={22} color={colors.textMuted} />
                </Pressable>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                bounces={false}
                contentContainerStyle={styles.body}
              >
                <ImageGallery
                  imageUrls={asset.imageUrls}
                  width={GALLERY_WIDTH}
                  height={GALLERY_HEIGHT}
                  category={asset.category}
                  mode="manual"
                  showDots
                  showThumbnails
                  borderRadius={14}
                />

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
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
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
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  card: {
    maxHeight: '88%',
    borderRadius: GLASS_RADIUS.floating,
    borderWidth: 1.5,
    padding: Spacing.lg,
  },
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
  body: {
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
