import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { getCategoryTheme } from '@/lib/auctionUtils';
import { resolveMediaUrl } from '@/lib/media-utils';
import { useTheme } from '@/lib/appStore';
import { Typography, Radii } from '@/theme';

export interface ImageGalleryProps {
  imageUrls: string[];
  width: number;
  height: number;
  category?: string;
  /** Manual swipe (asset detail) or timed auto-advance (bid card thumb). */
  mode?: 'manual' | 'auto';
  autoIntervalMs?: number;
  showDots?: boolean;
  showThumbnails?: boolean;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function ImageGallery({
  imageUrls,
  width,
  height,
  category = 'other_assets',
  mode = 'manual',
  autoIntervalMs = 3200,
  showDots = true,
  showThumbnails = false,
  borderRadius = Radii.input,
  style,
}: ImageGalleryProps) {
  const { colors } = useTheme();
  const theme = getCategoryTheme(category);
  const [activeIndex, setActiveIndex] = useState(0);
  const galleryRef = useRef<ScrollView>(null);
  const userInteractedRef = useRef(false);

  const resolvedUrls = useMemo(
    () => imageUrls.map((url) => resolveMediaUrl(url)).filter(Boolean) as string[],
    [imageUrls],
  );

  const scrollToIndex = useCallback(
    (index: number, animated = true) => {
      const clamped = Math.max(0, Math.min(index, resolvedUrls.length - 1));
      setActiveIndex(clamped);
      galleryRef.current?.scrollTo({ x: clamped * width, animated });
    },
    [resolvedUrls.length, width],
  );

  const handleGalleryScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / width);
      setActiveIndex(index);
    },
    [width],
  );

  const handleUserScrollBegin = useCallback(() => {
    userInteractedRef.current = true;
  }, []);

  useEffect(() => {
    setActiveIndex(0);
    galleryRef.current?.scrollTo({ x: 0, animated: false });
    userInteractedRef.current = false;
  }, [resolvedUrls]);

  useEffect(() => {
    if (mode !== 'auto' || resolvedUrls.length <= 1 || userInteractedRef.current) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % resolvedUrls.length;
        galleryRef.current?.scrollTo({ x: next * width, animated: true });
        return next;
      });
    }, autoIntervalMs);

    return () => clearInterval(timer);
  }, [autoIntervalMs, mode, resolvedUrls.length, width]);

  if (!resolvedUrls.length) {
    return (
      <View style={[styles.fallback, { width, height, borderRadius }, style]}>
        <LinearGradient
          colors={theme.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <MaterialCommunityIcons name={theme.icon} size={Math.min(width, height) * 0.35} color="rgba(255,250,240,0.4)" />
      </View>
    );
  }

  return (
    <View style={[{ width }, style]}>
      <View style={[styles.galleryWrap, { width, height, borderRadius }]}>
        <ScrollView
          ref={galleryRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleGalleryScroll}
          onScrollBeginDrag={handleUserScrollBegin}
          decelerationRate="fast"
          snapToInterval={width}
          snapToAlignment="start"
          scrollEnabled={mode === 'manual' || resolvedUrls.length > 1}
          style={styles.galleryScroll}
        >
          {resolvedUrls.map((uri, index) => (
            <View key={`${uri}-${index}`} style={{ width, height }}>
              <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
              <LinearGradient
                colors={['rgba(0,0,0,0.02)', 'rgba(0,0,0,0.35)']}
                style={StyleSheet.absoluteFill}
              />
            </View>
          ))}
        </ScrollView>

        {showDots && resolvedUrls.length > 1 ? (
          <View style={styles.dotsRow}>
            {resolvedUrls.map((_, index) => (
              <Pressable
                key={index}
                onPress={() => scrollToIndex(index)}
                hitSlop={6}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      index === activeIndex ? colors.goldBright : 'rgba(255,250,240,0.35)',
                    width: index === activeIndex ? (mode === 'auto' ? 10 : 16) : 5,
                  },
                ]}
              />
            ))}
          </View>
        ) : mode === 'manual' && resolvedUrls.length === 1 ? (
          <View style={styles.singleBadge}>
            <MaterialCommunityIcons name="image" size={11} color={colors.cream} />
            <Text style={[Typography.microCaps, { color: colors.cream, fontSize: 9 }]}>1</Text>
          </View>
        ) : null}
      </View>

      {showThumbnails && resolvedUrls.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbRow}
        >
          {resolvedUrls.map((uri, index) => (
            <Pressable
              key={`thumb-${index}`}
              onPress={() => scrollToIndex(index)}
              style={[
                styles.thumb,
                {
                  borderColor: index === activeIndex ? colors.goldBright : colors.goldBorder,
                  borderWidth: index === activeIndex ? 2 : 1,
                },
              ]}
            >
              <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  galleryWrap: {
    overflow: 'hidden',
    position: 'relative',
  },
  galleryScroll: {
    flex: 1,
  },
  fallback: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRow: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    height: 5,
    borderRadius: 3,
  },
  thumbRow: {
    gap: 8,
    paddingTop: 10,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: Radii.sm,
    overflow: 'hidden',
  },
  singleBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
});

export default ImageGallery;
