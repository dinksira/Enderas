import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useTheme } from '@/lib/appStore';
import { glassElevation } from '@/lib/glassStyles';
import { LanguageSelector } from './LanguageSelector';
import { NotificationBell } from './NotificationBell';

interface AppHeaderProps {
  /** Screen title shown centered. */
  title: string;
  /** Optional smaller eyebrow above the title (e.g. greeting). */
  eyebrow?: string;
  /** Show back button instead of leading spacer. */
  showBack?: boolean;
  /** Optional leading action (overrides default back behavior). */
  onBack?: () => void;
  /** Hide the right-side controls (notifications + language). Default false. */
  hideActions?: boolean;
  /** Skip the title entrance animation (e.g. auth-gate tab screens). */
  instantTitle?: boolean;
}

export type { AppHeaderProps };

/**
 * Fixed top header shared by every tab screen and sub-screen.
 *
 * Layout
 * -----
 *  [back?]  [eyebrow / title block]  [bell] [lang]
 *
 * - Anchored to the safe area top inset so it never collides with the
 *   status bar on notched devices.
 * - Glass background: a translucent dark fill + gold border + top
 *   highlight strip — the same recipe used by the auth glass cards,
 *   so the header reads as part of the same design system.
 * - Title fades/slides in on mount so route transitions feel animated
 *   rather than snapping.
 */
export function AppHeader({
  title,
  eyebrow,
  showBack,
  onBack,
  hideActions,
  instantTitle = false,
}: AppHeaderProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const titleAnim = useRef(new Animated.Value(instantTitle ? 1 : 0)).current;

  useEffect(() => {
    if (instantTitle) {
      titleAnim.setValue(1);
      return;
    }
    // Reset on title change so the entrance replays for each screen.
    titleAnim.setValue(0);
    Animated.timing(titleAnim, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [instantTitle, title, titleAnim]);

  const titleOpacity = titleAnim;
  const titleY = titleAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] });

  const handleBack = () => {
    if (onBack) onBack();
    else if (router.canGoBack()) router.back();
  };

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: colors.glassFill,
          borderBottomColor: colors.goldBorder,
          paddingTop: insets.top + 6,
          ...glassElevation(isDark, 'header'),
        },
      ]}
    >
      <View style={styles.row}>
        {/* Leading: back button only when needed. */}
        {showBack ? (
          <Pressable
            onPress={handleBack}
            hitSlop={12}
            style={({ pressed }) => [
              styles.iconButton,
              {
                backgroundColor: colors.glassFill,
                borderColor: colors.goldBorder,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <MaterialCommunityIcons name="chevron-left" size={20} color={colors.goldBright} />
          </Pressable>
        ) : null}

        {/* Center: title (and optional eyebrow). */}
        <Animated.View
          style={[styles.titleWrap, { opacity: titleOpacity, transform: [{ translateY: titleY }] }]}
        >
          {eyebrow ? (
            <Text style={[styles.eyebrow, { color: colors.goldChampagne }]} numberOfLines={1}>
              {eyebrow}
            </Text>
          ) : null}
          <Text style={[styles.title, { color: colors.cream }]} numberOfLines={1}>
            {title}
          </Text>
        </Animated.View>

        {/* Trailing: notifications + language selector. */}
        {hideActions ? null : (
          <View style={styles.actions}>
            <NotificationBell />
            <LanguageSelector />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'relative',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 10,
    zIndex: 50,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 40,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

export default AppHeader;
