import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

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

  // Press feedback — one Animated.Value per tab.
  const pressScales = useRef(TABS.map(() => new Animated.Value(1))).current;
  // Active-state cross-fade — 0 (inactive) → 1 (active).
  const activeValues = useRef(TABS.map(() => new Animated.Value(0))).current;
  // Active dot — drop-in spring per tab.
  const dotValues = useRef(TABS.map(() => new Animated.Value(0))).current;

  // Drive the active pill + dot when state.index changes.
  // `useNativeDriver: false` is required because we interpolate to
  // colors (backgroundColor, borderColor) — native driver only supports
  // transform & opacity. The handful of small Animated.Values is cheap.
  useEffect(() => {
    activeValues.forEach((v, i) => {
      Animated.spring(v, {
        toValue: i === state.index ? 1 : 0,
        friction: 9,
        tension: 100,
        useNativeDriver: false,
      }).start();
    });
    dotValues.forEach((v, i) => {
      Animated.spring(v, {
        toValue: i === state.index ? 1 : 0,
        friction: 7,
        tension: 120,
        useNativeDriver: false,
      }).start();
    });
  }, [state.index, activeValues, dotValues]);

  const handlePress = (i: number, name: string) => {
    // Tactile feedback: quick scale-down then back.
    Animated.sequence([
      Animated.timing(pressScales[i], { toValue: 0.88, duration: Duration.instant, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.spring(pressScales[i], { toValue: 1, friction: 6, tension: 200, useNativeDriver: false }),
    ]).start();

    const event = navigation.emit({
      type: 'tabPress',
      target: state.routes[i].key,
      canPreventDefault: true,
    });
    if (!event.defaultPrevented) {
      navigation.navigate(name);
    }
  };

  // Bar background — single translucent fill per theme.
  const barBg = isDark ? 'rgba(18, 18, 26, 0.78)' : 'rgba(255, 252, 245, 0.92)';

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
            {TABS.map((tab, i) => {
              const isActive = state.index === i;
              const label = t(tab.labelKey);
              const activeBg = activeValues[i].interpolate({
                inputRange: [0, 1],
                outputRange: ['transparent', colors.glassFillActive],
              });
              const activeBorder = activeValues[i].interpolate({
                inputRange: [0, 1],
                outputRange: ['transparent', colors.goldBorderActive],
              });
              // Icon color is static (MaterialCommunityIcons doesn't
              // accept an animated color). The pill background + label
              // color cross-fade, which is enough active-state signal.
              const iconColor = isActive ? colors.goldBright : colors.textMuted;
              const labelOpacity = activeValues[i].interpolate({
                inputRange: [0, 1],
                outputRange: [0.65, 1],
              });
              const labelColor = activeValues[i].interpolate({
                inputRange: [0, 1],
                outputRange: [colors.textMuted, colors.goldBright],
              });
              // Dot fades and scales in inside a fixed-width slot.
              const dotScale = dotValues[i].interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
              const dotX = dotValues[i].interpolate({ inputRange: [0, 1], outputRange: [-4, 0] });
              const dotOpacity = dotValues[i];

              return (
                <Pressable
                  key={tab.name}
                  onPress={() => handlePress(i, tab.name)}
                  style={styles.tab}
                  hitSlop={{ top: 6, bottom: 6, left: 2, right: 2 }}
                >
                  <Animated.View
                    style={[
                      styles.tabInner,
                      {
                        backgroundColor: activeBg,
                        borderColor: activeBorder,
                        transform: [{ scale: pressScales[i] }],
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={isActive ? tab.iconActive : tab.icon}
                      size={20}
                      color={iconColor}
                    />
                    <View style={styles.labelRow}>
                      <View style={styles.labelAnchor}>
                        <Animated.View
                          style={[
                            styles.dot,
                            {
                              backgroundColor: colors.goldBright,
                              opacity: dotOpacity,
                              transform: [{ translateX: dotX }, { scale: dotScale }],
                              position: 'absolute',
                              right: '100%',
                              marginRight: 3,
                            },
                          ]}
                        />
                        <Animated.Text
                        style={[
                          styles.label,
                          { color: labelColor, opacity: labelOpacity },
                        ]}
                        numberOfLines={1}
                      >
                        {label}
                      </Animated.Text>
                      </View>
                    </View>
                  </Animated.View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </View>
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
    borderWidth: 1,
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
