import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { useTheme } from '@/lib/appStore';
import type { ThemeColors } from '@/lib/theme';

function createOnboardingStyles(colors: ThemeColors, isDark: boolean) {
  const titleShadow = isDark
    ? { textShadowColor: colors.goldGlow, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 18 }
    : { textShadowColor: 'transparent', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 0 };

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.base,
    },
    container: {
      flex: 1,
      backgroundColor: colors.base,
      overflow: 'hidden',
    },
    bgOrb: {
      position: 'absolute',
      borderRadius: 9999,
    },
    topBar: {
      flexShrink: 0,
      minHeight: 52,
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 4,
      paddingBottom: 4,
      zIndex: 10,
    },
    skipButton: {
      paddingVertical: 8,
      paddingHorizontal: 18,
      borderRadius: 22,
      backgroundColor: colors.chipFill,
      borderWidth: 1,
      borderColor: colors.goldBorder,
      overflow: 'hidden',
    },
    skipText: {
      color: colors.goldChampagne,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
    slide: {
      flex: 1,
      paddingHorizontal: 28,
      paddingTop: 12,
      paddingBottom: 8,
    },
    slideScroll: {
      flex: 1,
    },
    slideScrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: 12,
    },
    slideContent: {
      width: '100%',
      alignItems: 'center',
    },
    titleAccent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 18,
      gap: 8,
    },
    titleAccentLine: {
      width: 32,
      height: 1,
      backgroundColor: colors.gold,
      opacity: 0.7,
    },
    titleAccentDiamond: {
      width: 6,
      height: 6,
      backgroundColor: colors.goldBright,
      transform: [{ rotate: '45deg' }],
      shadowColor: colors.gold,
      shadowOpacity: isDark ? 0.9 : 0.35,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 0 },
    },
    illustrationArea: {
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
      alignSelf: 'center',
    },
    illustrationGlow: {
      position: 'absolute',
      borderRadius: 9999,
      backgroundColor: colors.chipFill,
      alignSelf: 'center',
    },
    gavelGlow: {
      position: 'absolute',
      borderRadius: 9999,
      backgroundColor: colors.goldGlow,
      alignSelf: 'center',
    },
    gavelIconWrapper: {
      flex: 1,
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2,
    },
    textArea: {
      alignItems: 'center',
      paddingHorizontal: 4,
      width: '100%',
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.cream,
      textAlign: 'center',
      marginBottom: 14,
      letterSpacing: 0.3,
      ...titleShadow,
    },
    subtitle: {
      fontSize: 12,
      color: colors.goldBright,
      textAlign: 'center',
      marginBottom: 14,
      fontWeight: '700',
      letterSpacing: 3,
      textTransform: 'uppercase',
    },
    bodyText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      paddingHorizontal: 8,
    },
    languageSlide: {
      flex: 1,
      paddingHorizontal: 28,
      paddingTop: 12,
      paddingBottom: 8,
    },
    languageScrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingBottom: 12,
    },
    languageTitle: {
      fontSize: 30,
      fontWeight: '700',
      color: colors.cream,
      textAlign: 'center',
      marginBottom: 10,
      letterSpacing: 0.4,
      ...titleShadow,
      textShadowRadius: 22,
    },
    languageSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 36,
      letterSpacing: 0.3,
    },
    languageCardShell: {
      marginBottom: 14,
    },
    languageCardInner: {
      paddingVertical: 22,
      paddingHorizontal: 24,
      alignItems: 'center',
      position: 'relative',
    },
    languageCardText: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.cream,
      letterSpacing: 0.3,
    },
    languageCardTextActive: {
      color: colors.goldBright,
    },
    languageCheckBadge: {
      position: 'absolute',
      right: 18,
      top: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    languageCheckBadgeCircle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.goldBright,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.gold,
      shadowOpacity: isDark ? 0.8 : 0.35,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 0 },
    },
    languageCheckBadgeText: {
      color: colors.textOnGold,
      fontSize: 13,
      fontWeight: '900',
    },
    stepCardShell: {
      marginBottom: 10,
      width: '100%',
    },
    stepCardInner: {
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
    },
    stepNumber: {
      width: 38,
      height: 38,
      borderRadius: 19,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
      borderWidth: 1,
      borderColor: colors.goldBorderActive,
      overflow: 'hidden',
    },
    stepNumberText: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.textOnGold,
      letterSpacing: 0.5,
    },
    stepTextArea: {
      flex: 1,
    },
    stepTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.cream,
      marginBottom: 3,
      letterSpacing: 0.2,
    },
    stepDesc: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 18,
      width: '100%',
    },
    featureBulletOuter: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 1,
      borderColor: colors.goldBorderActive,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 1,
      marginRight: 14,
      backgroundColor: colors.chipFill,
    },
    featureBullet: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: colors.goldBright,
      shadowColor: colors.gold,
      shadowOpacity: isDark ? 0.9 : 0.4,
      shadowRadius: 5,
      shadowOffset: { width: 0, height: 0 },
    },
    featureText: {
      fontSize: 14,
      color: colors.cream,
      lineHeight: 22,
      flex: 1,
    },
    loginLink: {
      alignItems: 'center',
      marginTop: 20,
      paddingVertical: 10,
      paddingHorizontal: 16,
    },
    loginLinkText: {
      fontSize: 13,
      color: colors.goldBright,
      fontWeight: '600',
      letterSpacing: 0.3,
      textDecorationLine: 'underline',
      textDecorationColor: colors.gold,
    },
    footer: {
      paddingHorizontal: 28,
      paddingTop: 4,
      paddingBottom: 12,
      alignItems: 'center',
      flexShrink: 0,
    },
    pagination: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 22,
      gap: 8,
    },
    dot: {
      height: 6,
      width: 6,
      borderRadius: 3,
      backgroundColor: colors.chipFill,
    },
    dotActive: {
      backgroundColor: colors.goldBright,
      width: 26,
      borderRadius: 3,
      shadowColor: colors.gold,
      shadowOpacity: isDark ? 0.85 : 0.4,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 0 },
    },
    navRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
      width: '100%',
      gap: 12,
    },
    navRowSlot: {
      flex: 1,
      alignSelf: 'stretch',
    },
  });
}

export function useOnboardingStyles() {
  const { colors, isDark } = useTheme();
  return useMemo(() => createOnboardingStyles(colors, isDark), [colors, isDark]);
}

export default useOnboardingStyles;
