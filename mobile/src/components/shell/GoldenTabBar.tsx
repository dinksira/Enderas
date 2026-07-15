import { useCallback, useEffect } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/lib/appStore';
import { glassElevation } from '@/lib/glassStyles';
import { Duration } from '@/theme/motion';

interface TabConfig {
  /** Route name as registered in the tabs layout. */
  name: string;
  /** i18n key under `tabs.*`. */
  labelKey: string;
  /** MaterialCommunityIcons name (outline look preferred). */
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  /** Filled icon, used when the tab is active. */
  iconActive: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}

const TABS: TabConfig[] = [
  { name: 'dashboard', labelKey: 'tabs.dashboard', icon: 'view-dashboard-outline', iconActive: 'view-dashboard' },
  { name: 'bids', labelKey: 'tabs.bids', icon: 'gavel', iconActive: 'gavel' },
  { name: 'assets', labelKey: 'tabs.assets', icon: 'treasure-chest', iconActive: 'treasure-chest' },
  { name: 'profile', labelKey: 'tabs.profile', icon: 'account-circle-outline', iconActive: 'account-circle' },
];

interface GoldenTabBarProps {
  state: { index: number; routes: { name: string; key: string }[] };
  descriptors: Record<string, { options: { title?: string } }>;
  navigation: { emit: (e: any) => any; navigate: (name: string) => void };
}

/**
 * Custom minimal glass tab bar.
 *
 * Design language (modernized)
 * ----------------------------
 *   - Single frosted capsule, one translucent fill + hairline border.
 *     No gradient overlays, no top highlight strip — those added visual
 *     noise without aiding legibility.
 *   - Active tab: a soft rounded pill behind the icon+label, drawn with
 *     `glassFillActive` + a faint gold border. Bright gold icon +
 *     bright label. No radial glow — the pill alone is enough signal.
 *   - Inactive tab: muted icon + label at 0.65 opacity.
 *   - A tiny gold dot sits inside the active pill, just before the
 *     label — readable at a glance even when the pill is subtle.
 *
 * Motion
 * -----
 * Each tab press fires a quick scale-down (90ms → 120ms) on the inner
 * pill for tactile feedback. The active pill cross-fades between
 * inactive and active states using a 180ms spring — slower than the
 * press feedback so the active-state transition reads as deliberate.
 *
 * The active dot animates in via a short spring (scale up + a small
 * horizontal slide) inside a fixed-width slot so it feels like it
 * "lands" before the label without shifting the layout.
 *
 * Reanimated v3 implementation: each tab is driven by three
 * SharedValues on the UI thread (active, press, dot) so tab transitions
 * stay smooth even when the JS thread is busy loading data.
 *
 * Why not the default Tabs tab bar:
 *   - The default bar fills the bottom edge with a solid color, which
 *     breaks the floating-glass aesthetic. Custom drawing also lets us
 *     control the safe-area inset precisely and keep the bar pinned
 *     above the home indicator.
 */
export function GoldenTabBar({ state, navigation }: GoldenTabBarProps) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Bar background — single translucent fill per theme.
  const barBg = isDark ? 'rgba(18, 18, 26, 0.78)' : 'rgba(255, 252, 245, 0.92)';

  const handlePress = useCallback(
    (i: number, name: string) => {
      const event = navigation.emit({
        type: 'tabPress',
        target: state.routes[i].key,
        canPreventDefault: true,
      });
      if (!event.defaultPrevented) {
        navigation.navigate(name);
      }
    },
    [navigation, state.routes],
  );

  return (
    <View
      pointerEvents="box-none"
      style={[styles.shell, { paddingBottom: Math.max(insets.bottom, 10) }]}
    >
      <View style={[styles.barShadow, glassElevation(isDark, 'floating')]}>
        <View
          style={[
            styles.bar,
            {
              backgroundColor: barBg,
              borderColor: colors.goldBorder,
            },
          ]}
        >
          <View style={styles.row}>
            {TABS.map((tab, i) => (
              <TabCell
                key={tab.name}
                label={t(tab.labelKey)}
                icon={state.index === i ? tab.iconActive : tab.icon}
                iconColor={state.index === i ? colors.goldBright : colors.textMuted}
                isActive={state.index === i}
                colors={colors}
                onPress={() => handlePress(i, tab.name)}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

/**
 * Single tab cell. Lifted into its own component so the animated styles
 * can call `useAnimatedStyle` at the top level (not inside a map), per
 * the rules of hooks for Reanimated v3.
 */
function TabCell({
  label,
  icon,
  iconColor,
  isActive,
  colors,
  onPress,
}: {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  iconColor: string;
  isActive: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
  onPress: () => void;
}) {
  // 0 (inactive) → 1 (active) — drives the active pill background, border,
  // and label opacity + color cross-fade.
  const active = useSharedValue(isActive ? 1 : 0);
  // 0 (rest) → 0.88 → back to 1 — quick scale-down press feedback.
  const press = useSharedValue(1);
  // 0 (hidden) → 1 (visible) — drives the active dot's scale + opacity.
  const dot = useSharedValue(isActive ? 1 : 0);

  // Drive the active pill + dot when isActive changes. Springs run on
  // the UI thread so transitions stay smooth even when JS is busy.
  useEffect(() => {
    const target = isActive ? 1 : 0;
    active.value = withSpring(target, { damping: 18, stiffness: 220 });
    dot.value = withSpring(target, { damping: 14, stiffness: 260 });
  }, [isActive, active, dot]);

  const handlePressInternal = () => {
    // Tactile feedback: quick scale-down then back, fully on the UI thread.
    press.value = withSequence(
      withTiming(0.88, { duration: Duration.instant, easing: Easing.out(Easing.cubic) }),
      withSpring(1, { damping: 12, stiffness: 320 }),
    );
    onPress();
  };

  // Inner pill scale (press feedback).
  const innerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: press.value }],
  }));

  // Active tint overlay — fades in when the tab becomes active.
  const activeOverlayStyle = useAnimatedStyle(() => ({
    opacity: active.value,
  }));

  // Active border overlay — fades in alongside the tint.
  const activeBorderStyle = useAnimatedStyle(() => ({
    opacity: active.value,
  }));

  // Label cross-fade. MaterialCommunityIcons color can't be animated, so
  // we cross-fade two stacked <Text> elements instead.
  const labelInactiveStyle = useAnimatedStyle(() => ({
    opacity: 1 - active.value * 0.35,
  }));
  const labelActiveStyle = useAnimatedStyle(() => ({
    opacity: active.value,
  }));

  // Active dot: scales in and slides 4px → 0.
  const dotStyle = useAnimatedStyle(() => ({
    opacity: dot.value,
    transform: [
      { translateX: -4 * (1 - dot.value) },
      { scale: dot.value },
    ],
  }));

  return (
    <Pressable
      onPress={handlePressInternal}
      style={styles.tab}
      hitSlop={{ top: 6, bottom: 6, left: 2, right: 2 }}
    >
      <Animated.View style={[styles.tabInner, innerStyle]}>
        {/* Inactive base layer (transparent border + transparent bg) */}
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: 18,
              borderWidth: 1,
              borderColor: 'transparent',
              backgroundColor: 'transparent',
            },
          ]}
        />
        {/* Active tint overlay */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: 18,
              backgroundColor: colors.glassFillActive,
            },
            activeOverlayStyle,
          ]}
          pointerEvents="none"
        />
        {/* Active border overlay */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: 18,
              borderWidth: 1,
              borderColor: colors.goldBorderActive,
            },
            activeBorderStyle,
          ]}
          pointerEvents="none"
        />

        <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
        <View style={styles.labelRow}>
          <View style={styles.labelAnchor}>
            <Animated.View
              style={[
                styles.dot,
                { backgroundColor: colors.goldBright },
                dotStyle,
                { position: 'absolute', right: '100%', marginRight: 3 },
              ]}
              pointerEvents="none"
            />
            {/* Inactive label (muted color, slightly faded) */}
            <Animated.Text
              style={[
                styles.label,
                { color: colors.textMuted, position: 'absolute' },
                labelInactiveStyle,
              ]}
              numberOfLines={1}
            >
              {label}
            </Animated.Text>
            {/* Active label (goldBright color, faded in) */}
            <Animated.Text
              style={[styles.label, { color: colors.goldBright }, labelActiveStyle]}
              numberOfLines={1}
            >
              {label}
            </Animated.Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  barShadow: {
    width: '100%',
    borderRadius: 24,
  },
  bar: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  tab: {
    flex: 1,
    position: 'relative',
  },
  labelAnchor: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 18,
    gap: 3,
    minHeight: 46,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '100%',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default GoldenTabBar;
