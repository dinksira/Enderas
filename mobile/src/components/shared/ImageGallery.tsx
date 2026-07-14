import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
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
import Carousel from 'react-native-reanimated-carousel';
import type { ICarouselInstance } from 'react-native-reanimated-carousel';
import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { NativeViewGestureHandler, ScrollView as RNGHScrollView } from 'react-native-gesture-handler';

import { getCategoryTheme } from '@/lib/auctionUtils';
import { resolveMediaUrl } from '@/lib/media-utils';
import { useTheme } from '@/lib/appStore';
import { Radii } from '@/theme';

/** Fixed light tones for badges overlaid on photos (theme-independent). */
const ON_PHOTO_TEXT = '#FFFAF0';
const ON_PHOTO_TEXT_MUTED = 'rgba(255,250,240,0.7)';
const ON_PHOTO_SCRIM = 'rgba(0,0,0,0.75)';
const ON_PHOTO_BORDER = 'rgba(255,250,240,0.24)';

const THUMB_SIZE = 64;
const THUMB_GAP = 8;
/** Snap animation duration — kept short (200ms) for a snappy feel. */
const SNAP_ANIM_MS = 200;
/**
 * How many items on each side of the active item respond to pan gesture
 * events. Default is 0 (all items). Setting to 3 means the visible item
 * plus 3 on each side — significantly reduces per-frame computation.
 */
const WINDOW_SIZE = 3;

export interface ImageGalleryProps {
  imageUrls: string[];
  width: number;
  height: number;
  category?: string;
  mode?: 'manual' | 'auto';
  autoIntervalMs?: number;
  showDots?: boolean;
  showThumbnails?: boolean;
  showCounter?: boolean;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Gallery slide — the main carousel item. Kept intentionally minimal:
 * just a sized View with an expo-image filling it. No `isActive` prop,
 * no `priority` prop — those caused the carousel to re-render all items
 * on every snap because the `renderItem` callback depended on
 * `activeIndexJs` (JS state). Now `renderItem` is fully stable (deps
 * are only `width` + `height`) so the carousel never re-renders items
 * during a swipe.
 */
const GallerySlide = memo(function GallerySlide({
  uri,
  width,
  height,
}: {
  uri: string;
  width: number;
  height: number;
}) {
  return (
    <View style={{ width, height }}>
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy="memory-disk"
        recyclingKey={uri}
        transition={0}
      />
    </View>
  );
});

/**
 * Thumbnail cell. Reads the carousel's *live* progress (a SharedValue
 * that the carousel writes to on the UI thread via `onProgressChange`)
 * and computes `Math.round(progress.value)` inside the worklet to
 * determine the active state. This means the active border + opacity
 * cross-fade updates in REAL-TIME during the swipe — no delay, no JS
 * bridging, no "it takes a long time to set the active image in the
 * small horizontal slider".
 */
const ThumbnailCell = memo(function ThumbnailCell({
  uri,
  index,
  progress,
  colors,
  onPress,
}: {
  uri: string;
  index: number;
  progress: SharedValue<number>;
  colors: ReturnType<typeof useTheme>['colors'];
  onPress: (index: number) => void;
}) {
  const style = useAnimatedStyle(() => {
    const isActive = Math.round(progress.value) === index;
    return {
      borderColor: isActive ? colors.goldBright : colors.goldBorder,
      borderWidth: isActive ? 2 : 1,
      opacity: withTiming(isActive ? 1 : 0.75, { duration: 120 }),
    };
  });

  return (
    <Pressable
      onPress={() => onPress(index)}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={`Image ${index + 1}`}
    >
      <Animated.View style={[styles.thumb, style]}>
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
          recyclingKey={uri}
          transition={0}
        />
      </Animated.View>
    </Pressable>
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
}: ImageGalleryProps) {
  const { colors } = useTheme();
  const theme = getCategoryTheme(category);

  // ── State ──────────────────────────────────────────────────────────
  //
  // `progress` is the single source of truth for the carousel's current
  // position. The carousel writes `absoluteProgress` (a fractional page
  // index, e.g. 1.5 = halfway between page 1 and 2) directly into this
  // SharedValue on the UI thread via `onProgressChange={progress}`.
  // Reading it from `useAnimatedStyle` in ThumbnailCell runs entirely
  // on the UI thread — zero JS bridging during swipes.
  //
  // `activeIndexJs` is the JS mirror, updated only on `onSnapToItem`
  // (fires once per settled page). It drives the counter badge ("2 / 5")
  // and the prefetch effect — both cheap operations that don't affect
  // the carousel's render.
  const progress = useSharedValue(0);
  const [activeIndexJs, setActiveIndexJs] = useState(0);
  const activeIndexRef = useRef(0);

  const mainRef = useRef<ICarouselInstance>(null);
  const thumbStripRef = useRef<RNGHScrollView>(null);

  const resolvedUrls = useMemo(
    () => imageUrls.map((url) => resolveMediaUrl(url)).filter(Boolean) as string[],
    [imageUrls],
  );

  const canSwipe = mode === 'manual' && resolvedUrls.length > 1;
  const showThumbStrip = showThumbnails && resolvedUrls.length > 1;
  const showCounterBadge =
    showCounter && resolvedUrls.length > 1 && (mode === 'manual' || mode === 'auto');

  // ── Stable carousel props ──────────────────────────────────────────
  //
  // ALL of these are memoised so the carousel never sees a new reference
  // on a parent re-render. If any of these change identity, the carousel
  // may re-render all its items — which was the #1 cause of the sluggish
  // swipe performance in the previous version.

  const carouselStyle = useMemo(
    () => ({ width, height }),
    [width, height],
  );

  const renderMainItem = useCallback(
    ({ item }: { item: string }) => (
      <GallerySlide uri={item} width={width} height={height} />
    ),
    [width, height],
  );

  const handleSnapToItem = useCallback((index: number) => {
    activeIndexRef.current = index;
    setActiveIndexJs(index);
  }, []);

  const handleThumbPress = useCallback((index: number) => {
    mainRef.current?.scrollTo({ index, animated: true });
  }, []);

  const configurePanGesture = useCallback((gesture: any) => {
    gesture.activeOffsetX([-10, 10]);
    gesture.failOffsetY([-5, 5]);
  }, []);

  // ── Effects ────────────────────────────────────────────────────────

  // Reset to first image when the URL set changes.
  useEffect(() => {
    progress.value = 0;
    activeIndexRef.current = 0;
    setActiveIndexJs(0);
    requestAnimationFrame(() => {
      mainRef.current?.scrollTo({ index: 0, animated: false });
    });
  }, [progress, resolvedUrls]);

  // Auto-advance for `mode === 'auto'`.
  useEffect(() => {
    if (mode !== 'auto' || resolvedUrls.length <= 1) return;
    const timer = setInterval(() => {
      const next = (activeIndexRef.current + 1) % resolvedUrls.length;
      mainRef.current?.scrollTo({ index: next, animated: true });
    }, autoIntervalMs);
    return () => clearInterval(timer);
  }, [autoIntervalMs, mode, resolvedUrls.length]);

  // Prefetch neighbors — runs only on snap (once per page), not per frame.
  useEffect(() => {
    if (!resolvedUrls.length) return;
    const neighbors = [activeIndexJs, activeIndexJs + 1, activeIndexJs - 1]
      .filter((i) => i >= 0 && i < resolvedUrls.length)
      .map((i) => resolvedUrls[i]);
    if (neighbors.length) {
      void Image.prefetch(neighbors);
    }
  }, [activeIndexJs, resolvedUrls]);

  // Auto-scroll the thumbnail strip to center the active thumb.
  // Runs on snap (not during swipe) so it doesn't fight the carousel.
  useEffect(() => {
    if (!showThumbStrip || resolvedUrls.length <= 1) return;
    const thumbStride = THUMB_SIZE + THUMB_GAP;
    const targetX = activeIndexJs * thumbStride - (width - THUMB_SIZE) / 2;
    const clampedX = Math.max(0, targetX);
    requestAnimationFrame(() => {
      thumbStripRef.current?.scrollTo({ x: clampedX, y: 0, animated: true });
    });
  }, [activeIndexJs, showThumbStrip, resolvedUrls.length, width]);

  // ── Render ─────────────────────────────────────────────────────────

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

  return (
    <View style={[{ width }, style]}>
      <View style={[styles.galleryWrap, { width, height, borderRadius }]}>
        <Carousel
          ref={mainRef}
          style={carouselStyle}
          data={resolvedUrls}
          renderItem={renderMainItem}
          defaultIndex={0}
          loop={false}
          autoPlay={false}
          enabled={canSwipe}
          scrollAnimationDuration={SNAP_ANIM_MS}
          overscrollEnabled={false}
          snapEnabled
          windowSize={WINDOW_SIZE}
          onProgressChange={progress}
          onSnapToItem={handleSnapToItem}
          onConfigurePanGesture={configurePanGesture}
        />

        {showCounterBadge ? (
          <View style={styles.counterBadge} pointerEvents="none">
            <Text style={styles.counterText}>{activeIndexJs + 1}</Text>
            <Text style={styles.counterDivider}>/</Text>
            <Text style={styles.counterTotal}>{resolvedUrls.length}</Text>
          </View>
        ) : null}
      </View>

      {showThumbStrip ? (
        <NativeViewGestureHandler disallowInterruption>
          <RNGHScrollView
            ref={thumbStripRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbRow}
            directionalLockEnabled
            alwaysBounceHorizontal={false}
            bounces={false}
            overScrollMode="never"
          >
            {resolvedUrls.map((uri, index) => (
              <ThumbnailCell
                key={`thumb-${uri}-${index}`}
                uri={uri}
                index={index}
                progress={progress}
                colors={colors}
                onPress={handleThumbPress}
              />
            ))}
          </RNGHScrollView>
        </NativeViewGestureHandler>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  galleryWrap: {
    overflow: 'hidden',
    position: 'relative',
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
    flexDirection: 'row',
    gap: THUMB_GAP,
    paddingTop: 10,
    paddingHorizontal: 2,
    alignItems: 'center',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: Radii.sm,
    overflow: 'hidden',
    borderWidth: 1,
  },
});

export const ImageGallery = memo(ImageGalleryImpl);
export default ImageGallery;
