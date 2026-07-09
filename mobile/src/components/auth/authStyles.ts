import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { useTheme } from '@/lib/appStore';
import type { ThemeColors } from '@/lib/theme';

function createAuthStyles(colors: ThemeColors, isDark: boolean) {
  const titleShadow = isDark
    ? { textShadowColor: 'rgba(212, 160, 23, 0.45)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 22 }
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
    keyboardAvoid: {
      flex: 1,
      width: '100%',
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 28,
      paddingVertical: 24,
    },
    scrollContentTop: {
      flexGrow: 1,
      justifyContent: 'flex-start',
      alignItems: 'center',
      paddingHorizontal: 28,
      paddingTop: 24,
      paddingBottom: 24,
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
    title: {
      fontSize: 30,
      fontWeight: '700',
      color: colors.cream,
      textAlign: 'center',
      marginBottom: 10,
      letterSpacing: 0.4,
      ...titleShadow,
    },
    subtitle: {
      fontSize: 12,
      color: colors.goldBright,
      textAlign: 'center',
      marginBottom: 10,
      letterSpacing: 3,
      lineHeight: 20,
      paddingHorizontal: 8,
      textTransform: 'uppercase',
      fontWeight: '700',
    },
    bodyText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 28,
      letterSpacing: 0.3,
      lineHeight: 22,
      paddingHorizontal: 8,
    },
    form: {
      width: '100%',
      marginBottom: 16,
    },
    fieldContainer: {
      width: '100%',
      marginBottom: 16,
    },
    fieldLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.goldChampagne,
      marginBottom: 8,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    },
    fieldInputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      minHeight: 52,
    },
    fieldInputWrapperError: {
      borderColor: colors.danger.border,
    },
    fieldInput: {
      flex: 1,
      fontSize: 15,
      color: colors.cream,
      paddingVertical: 14,
    },
    passwordToggle: {
      paddingLeft: 12,
      paddingVertical: 8,
    },
    passwordToggleText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.goldBright,
      letterSpacing: 1.5,
    },
    fieldError: {
      fontSize: 12,
      color: colors.danger.fg,
      marginTop: 6,
      marginLeft: 4,
    },
    errorBannerSlot: {
      width: '100%',
      minHeight: 48,
      marginBottom: 20,
      justifyContent: 'center',
    },
    errorBanner: {
      width: '100%',
      backgroundColor: colors.danger.soft,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.danger.border,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    errorBannerText: {
      fontSize: 13,
      color: colors.danger.fg,
      textAlign: 'center',
      lineHeight: 20,
    },
    successBanner: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.success.soft,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.success.border,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    successBannerText: {
      fontSize: 13,
      color: colors.success.fg,
      textAlign: 'center',
      lineHeight: 20,
      fontWeight: '600',
    },
    submitButton: {
      borderRadius: 14,
      overflow: 'hidden',
      minHeight: 52,
      width: '100%',
      marginBottom: 16,
    },
    submitButtonOutline: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.goldBorderActive,
    },
    submitButtonInner: {
      paddingVertical: 16,
      paddingHorizontal: 10,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      zIndex: 2,
    },
    submitButtonText: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textOnGold,
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
    submitButtonTextOutline: {
      color: colors.goldBright,
    },
    topHighlight: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 1,
      backgroundColor: colors.glassTopHighlight,
    },
    shimmerOverlay: {
      position: 'absolute',
      top: -10,
      bottom: -10,
      width: 70,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.55)',
    },
    linkRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
      marginTop: 8,
      marginBottom: 4,
    },
    linkText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    linkAction: {
      fontSize: 13,
      color: colors.goldBright,
      fontWeight: '700',
      textDecorationLine: 'underline',
      textDecorationColor: colors.gold,
    },
    backLink: {
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginTop: 4,
    },
    backLinkText: {
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: '600',
      letterSpacing: 0.5,
    },
    userTypeSection: {
      width: '100%',
      marginBottom: 16,
    },
    userTypeRow: {
      flexDirection: 'row',
      gap: 12,
      width: '100%',
    },
    userTypeCardShell: {
      flex: 1,
    },
    userTypeCardInner: {
      paddingVertical: 18,
      paddingHorizontal: 12,
      alignItems: 'center',
      minHeight: 130,
      position: 'relative',
    },
    userTypeCardIcon: {
      fontSize: 28,
      marginBottom: 10,
    },
    userTypeCardTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.cream,
      textAlign: 'center',
      marginBottom: 6,
      letterSpacing: 0.2,
    },
    userTypeCardTitleActive: {
      color: colors.goldBright,
    },
    userTypeCardDesc: {
      fontSize: 11,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 16,
      paddingHorizontal: 4,
    },
    userTypeCheckBadge: {
      position: 'absolute',
      top: 10,
      right: 10,
    },
    userTypeCheckBadgeCircle: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.goldBright,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.gold,
      shadowOpacity: isDark ? 0.8 : 0.35,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 0 },
    },
    userTypeCheckBadgeText: {
      color: colors.textOnGold,
      fontSize: 11,
      fontWeight: '900',
    },
    otpContainer: {
      width: '100%',
      marginBottom: 16,
    },
    otpHint: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: 'center',
      marginBottom: 16,
      letterSpacing: 0.3,
    },
    otpInputWrapper: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 10,
      width: '100%',
      marginBottom: 16,
    },
    otpBox: {
      width: 48,
      height: 56,
      alignItems: 'center',
      justifyContent: 'center',
    },
    otpBoxError: {
      borderColor: colors.danger.border,
    },
    otpBoxText: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.cream,
    },
    otpHiddenInput: {
      position: 'absolute',
      width: 1,
      height: 1,
      opacity: 0,
    },
    resendRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    resendText: {
      fontSize: 12,
      color: colors.textMuted,
      letterSpacing: 0.3,
    },
    resendAction: {
      fontSize: 12,
      color: colors.goldBright,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    resendActionDisabled: {
      color: colors.textMuted,
    },
  });
}

export function useAuthStyles() {
  const { colors, isDark } = useTheme();
  return useMemo(() => createAuthStyles(colors, isDark), [colors, isDark]);
}

export default useAuthStyles;
