import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomSheetFlatList } from '@gorhom/bottom-sheet';

import { getCategoryTheme } from '@/lib/auctionUtils';
import { resolveMediaUrl } from '@/lib/media-utils';
import { useTheme } from '@/lib/appStore';
import { Radii } from '@/theme';

/** Fixed light tones for badges overlaid on photos (theme-independent). */
const ON_PHOTO_TEXT = '#FFFAF0';
const ON_PHOTO_TEXT_MUTED = 'rgba(255,250,240,0.7)';
const ON_PHOTO_SCRIM = 'rgba(0,0,0,0.75)';
const ON_PHOTO_BORDER = 'rgba(255,250,240,0.24)';

export interface ImageGalleryProps {
  imageUrls: string[];
  width: number;
  height: number;
  category?: string;
  /** Manual swipe (detail views) or timed auto-advance (compact cards). */
  mode?: 'manual' | 'auto';
  autoIntervalMs?: number;
  /** @deprecated Dots removed — use counter badge instead. Kept for API compat. */
  showDots?: boolean;
  showThumbnails?: boolean;
  /** Show "2 / 5" counter overlay when multiple images (manual mode). */
  showCounter?: boolean;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  /**
   * When rendered inside a `@gorhom/bottom-sheet`, a raw horizontal
   * `FlatList` does not receive swipe gestures (the sheet's pan handler
   * captures them). Set this to swap in `BottomSheetFlatList`, which
   * coordinates gestures with the sheet so swiping works.
   */
  insideBottomSheet?: boolean;
}

type GallerySlideProps = {
  uri: string;
  width: number;
  height: number;
  priority: 'low' | 'normal' | 'high';
};

const GallerySlide = memo(function GallerySlide({ uri, width, height, priority }: GallerySlideProps) {
  return (
    <View style={{ width, height }}>
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy="memory-disk"
        recyclingKey={uri}
        priority={priority}
        transition={0}
      />
    </View>
  );
});

function ImageGalleryImpl({
  imageUrls,
  width,
  height,
  category = 'other_assets',
  mode = 'manual',
  autoIntervalMs = 4000,
  showThumbnails = false,
  showCounter = true,
  borderRadius = Radii.input,
  style,
  insideBottomSheet = false,
}: ImageGalleryProps) {
  const { colors } = useTheme();
  const theme = getCategoryTheme(category);
  const PagerList = (insideBottomSheet ? BottomSheetFlatList : FlatList) as typeof FlatList;
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<string>>(null);
  const activeIndexRef = useRef(0);
  const userInteractedRef = useRef(false);

  const resolvedUrls = useMemo(
    () => imageUrls.map((url) => resolveMediaUrl(url)).filter(Boolean) as string[],
    [imageUrls],
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<string> | null | undefined, index: number) => ({
      length: width,
      offset: width * index,
      index,
    }),
    [width],
  );

  const scrollToIndex = useCallback(
    (index: number, animated = true) => {
      const clamped = Math.max(0, Math.min(index, resolvedUrls.length - 1));
      activeIndexRef.current = clamped;
      setActiveIndex(clamped);
      listRef.current?.scrollToIndex({ index: clamped, animated });
    },
    [resolvedUrls.length],
  );

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / width);
      if (index === activeIndexRef.current) return;
      activeIndexRef.current = index;
      setActiveIndex(index);
    },
    [width],
  );

  const handleUserScrollBegin = useCallback(() => {
    userInteractedRef.current = true;
  }, []);

  useEffect(() => {
    activeIndexRef.current = 0;
    setActiveIndex(0);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
    userInteractedRef.current = false;
  }, [resolvedUrls]);

  useEffect(() => {
    if (mode !== 'auto' || resolvedUrls.length <= 1 || userInteractedRef.current) return;

    const timer = setInterval(() => {
      const next = (activeIndexRef.current + 1) % resolvedUrls.length;
      scrollToIndex(next, true);
    }, autoIntervalMs);

    return () => clearInterval(timer);
  }, [autoIntervalMs, mode, resolvedUrls.length, scrollToIndex]);

  useEffect(() => {
    const neighbors = [activeIndex, activeIndex + 1, activeIndex - 1]
      .filter((i) => i >= 0 && i < resolvedUrls.length)
      .map((i) => resolvedUrls[i]);
    if (neighbors.length) {
      void Image.prefetch(neighbors);
    }
  }, [activeIndex, resolvedUrls]);

  const renderItem = useCallback(
    ({ item, index }: { item: string; index: number }) => (
      <GallerySlide
        uri={item}
        width={width}
        height={height}
        priority={Math.abs(index - activeIndexRef.current) <= 1 ? 'high' : 'low'}
      />
    ),
    [height, width],
  );

  const keyExtractor = useCallback((item: string, index: number) => `${item}-${index}`, []);

  if (!resolvedUrls.length) {
    return (
      <View style={[styles.fallback, { width, height, borderRadius }, style]}>
        <LinearGradient
          colors={theme.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <MaterialCommunityIcons
          name={theme.icon}
          size={Math.min(width, height) * 0.35}
          color="rgba(255,250,240,0.4)"
        />
      </View>
    );
  }

  const showCounterBadge =
    showCounter && resolvedUrls.length > 1 && (mode === 'manual' || mode === 'auto');
  const canSwipe = mode === 'manual' && resolvedUrls.length > 1;

  return (
    <View style={[{ width }, style]}>
      <View style={[styles.galleryWrap, { width, height, borderRadius }]}>
        <PagerList
          ref={listRef}
          data={resolvedUrls}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={handleScroll}
          onScrollBeginDrag={handleUserScrollBegin}
          decelerationRate="fast"
          snapToInterval={width}
          snapToAlignment="start"
          disableIntervalMomentum
          scrollEnabled={canSwipe}
          getItemLayout={getItemLayout}
          style={styles.galleryList}
          bounces={canSwipe}
          overScrollMode="never"
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          windowSize={3}
          removeClippedSubviews
          onScrollToIndexFailed={(info) => {
            requestAnimationFrame(() => {
              listRef.current?.scrollToOffset({
                offset: info.averageItemLength * info.index,
                animated: false,
              });
            });
          }}
        />

        {showCounterBadge ? (
          <View style={styles.counterBadge} pointerEvents="none">
            <Text style={styles.counterText}>{activeIndex + 1}</Text>
            <Text style={styles.counterDivider}>/</Text>
            <Text style={styles.counterTotal}>{resolvedUrls.length}</Text>
          </View>
        ) : null}
      </View>

      {showThumbnails && resolvedUrls.length > 1 ? (
        <PagerList
          data={resolvedUrls}
          keyExtractor={(item, index) => `thumb-${item}-${index}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbRow}
          renderItem={({ item, index }) => (
            <Pressable
              onPress={() => scrollToIndex(index)}
              style={[
                styles.thumb,
                {
                  borderColor: index === activeIndex ? colors.goldBright : colors.goldBorder,
                  borderWidth: index === activeIndex ? 2 : 1,
                  opacity: index === activeIndex ? 1 : 0.75,
                },
              ]}
            >
              <Image
                source={{ uri: item }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={0}
              />
            </Pressable>
          )}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  galleryWrap: {
    overflow: 'hidden',
    position: 'relative',
  },
  galleryList: {
    flex: 1,
  },
  fallback: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.full,
    backgroundColor: ON_PHOTO_SCRIM,
    borderWidth: 1,
    borderColor: ON_PHOTO_BORDER,
  },
  counterText: {
    fontSize: 11,
    fontWeight: '800',
    color: ON_PHOTO_TEXT,
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.2,
  },
  counterDivider: {
    fontSize: 10,
    fontWeight: '600',
    color: ON_PHOTO_TEXT_MUTED,
  },
  counterTotal: {
    fontSize: 11,
    fontWeight: '700',
    color: ON_PHOTO_TEXT_MUTED,
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.2,
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
});

export const ImageGallery = memo(ImageGalleryImpl);
export default ImageGallery;
