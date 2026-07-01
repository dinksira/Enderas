import { memo, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '@/lib/appStore';
import { Typography, Spacing, Radii } from '@/theme';

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  /** Optional accent — picks the trend color (green/red/neutral). */
  trend?: 'up' | 'down' | 'flat';
}

/**
 * Compact stat card used in dashboard / bids / assets summaries.
 *
 * Layout:
 *   [icon]   [label]
 *            [value] [trend arrow]
 *
 * Each card is a GlassCard without the entrance animation — the parent
 * grid drives the staggered entrance so individual cards don't double-
 * animate.
 *
 * Trend colors come from the theme's status palette so they auto-adjust
 * for WCAG contrast in light/dark mode (no per-component hex).
 */
function StatCardImpl({ label, value, icon, trend }: StatCardProps) {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const trendIcon =
    trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'minus';
  // Use semantic status colors — green/red from the theme so contrast
  // is correct in both light and dark mode.
  const trendColor =
    trend === 'up'
      ? colors.success.fg
      : trend === 'down'
        ? colors.danger.fg
        : colors.textMuted;

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: colors.glassFill,
          borderColor: colors.goldBorder,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: colors.glassFillActive, borderColor: colors.goldBorderActive },
        ]}
      >
        <MaterialCommunityIcons name={icon} size={18} color={colors.goldBright} />
      </View>
      <Text style={[Typography.microCaps, styles.label, { color: colors.textSecondary }]} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.valueRow}>
        <Text style={[Typography.statValue, { color: colors.cream }]} numberOfLines={1}>
          {value}
        </Text>
        {trend ? (
          <MaterialCommunityIcons name={trendIcon as any} size={14} color={trendColor} />
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: Radii.card,
    borderWidth: 1.5,
    padding: Spacing.sm,
    minHeight: 96,
    justifyContent: 'space-between',
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radii.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxs2,
  },
  label: {
    marginBottom: Spacing.xxs,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.xxs2,
  },
});

// `memo` with a shallow-equal comparator — props are all primitives so
// the default shallow check is sufficient and cheap.
export const StatCard = memo(StatCardImpl);
export default StatCard;
