import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, Modal, TouchableWithoutFeedback } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { useAppStore, useTheme } from '@/lib/appStore';
import { useAuthStore } from '@/lib/authStore';
import { useRefreshSession } from '@/hooks/useRefreshSession';
import { forgotPassword } from '@/services/authApi';
import { AuthSuccessModal } from '@/components/auth';
import { maskMobileNumber } from '@/utils/mobile-utils';

import { type ThemePreference } from '@/theme';
import { glassElevation } from '@/lib/glassStyles';
import { SUPPORTED_LANGUAGES, LANGUAGE_LABELS } from '@/lib/i18n';
import { ScreenShell } from '@/components/shell/ScreenShell';
import { GlassCard } from '@/components/shell/GlassCard';
import { Typography, Spacing } from '@/theme';

function Row({
  icon,
  label,
  description,
  right,
  isLast,
  onPress,
  danger,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  description?: string;
  right?: React.ReactNode;
  isLast?: boolean;
  onPress?: () => void;
  danger?: boolean;
}) {
  const { colors } = useTheme();
  // Pull the danger palette from the theme so contrast is correct in
  // both light and dark mode — no per-row hardcoded reds.
  const tone = danger ? colors.danger : null;
  const iconColor = tone ? tone.fg : colors.goldBright;
  const labelColor = tone ? tone.fg : colors.cream;
  const chipBg = tone ? tone.soft : colors.glassFillActive;
  const chipBorder = tone ? tone.border : colors.goldBorder;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: colors.divider, opacity: pressed ? 0.7 : 1 },
        isLast && { borderBottomWidth: 0 },
      ]}
    >
      <View
        style={[
          styles.rowIcon,
          {
            backgroundColor: chipBg,
            borderColor: chipBorder,
          },
        ]}
      >
        <MaterialCommunityIcons name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.rowBody}>
        <Text style={[Typography.bodyMedium, { color: labelColor, fontWeight: '600' }]}>{label}</Text>
        {description ? (
          <Text style={[Typography.caption, { color: colors.textMuted }]}>{description}</Text>
        ) : null}
      </View>
      {right ?? (onPress ? (
        <MaterialCommunityIcons name="chevron-right" size={18} color={tone ? tone.fg : colors.textMuted} />
      ) : null)}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { passwordChanged } = useLocalSearchParams<{ passwordChanged?: string }>();
  const themeMode = useAppStore((s) => s.themeMode);
  const setThemeMode = useAppStore((s) => s.setThemeMode);
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const [showLangModal, setShowLangModal] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);
  const [showOtpSentModal, setShowOtpSentModal] = useState(false);
  const [showPasswordChangedBanner, setShowPasswordChangedBanner] = useState(false);
  const passwordChangedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const passwordChangedShownRef = useRef(false);
  const { refreshing, refresh } = useRefreshSession();
  const userMobile = useAuthStore((s) => s.user?.mobileNumber);
  const setPendingPasswordReset = useAuthStore((s) => s.setPendingPasswordReset);

  useEffect(() => {
    if (passwordChanged !== '1' || passwordChangedShownRef.current) return;

    passwordChangedShownRef.current = true;
    setShowPasswordChangedBanner(true);

    if (passwordChangedTimeoutRef.current) {
      clearTimeout(passwordChangedTimeoutRef.current);
    }
    passwordChangedTimeoutRef.current = setTimeout(() => {
      setShowPasswordChangedBanner(false);
    }, 5000);
  }, [passwordChanged]);

  useEffect(() => {
    return () => {
      if (passwordChangedTimeoutRef.current) {
        clearTimeout(passwordChangedTimeoutRef.current);
      }
    };
  }, []);

  const handleChangePassword = async () => {
    if (changingPassword) return;

    setChangePasswordError(null);

    if (!userMobile) {
      router.push('/(auth)/forgot-password');
      return;
    }

    setChangingPassword(true);
    setPendingPasswordReset(userMobile, 'settings');

    try {
      await forgotPassword({ mobileNumber: userMobile, phoneNumber: userMobile });
      setShowOtpSentModal(true);
    } catch {
      setChangePasswordError(t('auth.errors.resetRequestFailed'));
    } finally {
      setChangingPassword(false);
    }
  };

  const handleOtpSentContinue = () => {
    setShowOtpSentModal(false);
    router.push('/(auth)/verify-reset-otp');
  };

  const THEME_OPTIONS: {
    value: ThemePreference;
    label: string;
    icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  }[] = [
    { value: 'system', label: t('settings.theme.automatic'), icon: 'theme-light-dark' },
    { value: 'dark', label: t('settings.theme.dark'), icon: 'weather-night' },
    { value: 'light', label: t('settings.theme.light'), icon: 'weather-sunny' },
  ];

  return (
    <ScreenShell
      title={t('settings.title')}
      showBack
      onBack={() => router.back()}
      bottomPadding={120}
      refreshing={refreshing}
      onRefresh={refresh}
    >
      {showPasswordChangedBanner ? (
        <View
          style={[
            styles.successBanner,
            {
              backgroundColor: colors.success.soft,
              borderColor: colors.success.border,
            },
          ]}
        >
          <MaterialCommunityIcons name="check-circle" size={16} color={colors.success.fg} />
          <Text style={[styles.successBannerText, { color: colors.success.fg }]}>
            {t('settings.account.passwordChanged')}
          </Text>
        </View>
      ) : null}

      {changePasswordError ? (
        <View
          style={[
            styles.errorBanner,
            {
              backgroundColor: colors.danger.soft,
              borderColor: colors.danger.border,
            },
          ]}
        >
          <Text style={[styles.errorBannerText, { color: colors.danger.fg }]}>{changePasswordError}</Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <GlassCard padding={4}>
          <View style={[styles.inlineSectionHeader, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.inlineSectionHeaderText, { color: colors.goldChampagne }]}>
              {t('settings.sections.appearance').toUpperCase()}
            </Text>
          </View>
          <Row
            icon="palette-outline"
            label={t('settings.theme.label')}
            description={t('settings.theme.description')}
            right={
              <View style={[styles.themeSegment, { borderColor: colors.goldBorder }]}>
                {THEME_OPTIONS.map((opt) => {
                  const isActive = themeMode === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => setThemeMode(opt.value)}
                      style={({ pressed }) => [
                        styles.themeSegmentBtn,
                        {
                          backgroundColor: isActive ? colors.goldBright : 'transparent',
                          opacity: pressed ? 0.85 : 1,
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={opt.icon}
                        size={13}
                        color={isActive ? colors.textOnGold : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.themeSegmentText,
                          { color: isActive ? colors.textOnGold : colors.textSecondary },
                        ]}
                        numberOfLines={1}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            }
          />

          <View style={[styles.inlineSectionHeader, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.inlineSectionHeaderText, { color: colors.goldChampagne }]}>
              {t('settings.sections.language').toUpperCase()}
            </Text>
          </View>
          <Row
            icon="translate"
            label={t('settings.language.label')}
            description={t('settings.language.description')}
            onPress={() => setShowLangModal(true)}
            right={
              <View style={[styles.langPill, { backgroundColor: colors.glassFillActive, borderColor: colors.goldBorder }]}>
                <Text style={[styles.langPillText, { color: colors.goldBright }]}>
                  {LANGUAGE_LABELS[language]}
                </Text>
                <MaterialCommunityIcons name="chevron-right" size={14} color={colors.textMuted} />
              </View>
            }
          />

          <View style={[styles.inlineSectionHeader, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.inlineSectionHeaderText, { color: colors.goldChampagne }]}>
              {t('settings.sections.account').toUpperCase()}
            </Text>
          </View>
          <Row
            icon="lock-reset"
            label={t('settings.account.changePassword')}
            description={t('settings.account.changePasswordDesc')}
            onPress={handleChangePassword}
            right={
              changingPassword ? (
                <ActivityIndicator size="small" color={colors.goldBright} />
              ) : undefined
            }
            isLast
          />
        </GlassCard>
      </View>

      <Modal visible={showLangModal} transparent animationType="fade" onRequestClose={() => setShowLangModal(false)}>
        <TouchableWithoutFeedback onPress={() => setShowLangModal(false)}>
          <View style={[styles.modalOverlay, { backgroundColor: colors.scrim }]}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.langModal,
                  {
                    backgroundColor: colors.baseElevated,
                    borderColor: colors.goldBorder,
                    ...glassElevation(isDark, 'floating'),
                  },
                ]}
              >
                <Text style={[Typography.eyebrow, styles.langModalTitle, { color: colors.goldBright, letterSpacing: 2 }]}>
                  {t('settings.language.label').toUpperCase()}
                </Text>
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const active = lang === language;
                  return (
                    <Pressable
                      key={lang}
                      onPress={() => {
                        setLanguage(lang);
                        setShowLangModal(false);
                      }}
                      style={({ pressed }) => [
                        styles.langRow,
                        {
                          backgroundColor: active ? colors.glassFillActive : 'transparent',
                          opacity: pressed ? 0.7 : 1,
                        },
                      ]}
                    >
                      <Text style={[Typography.bodyMedium, { color: active ? colors.goldBright : colors.cream, fontWeight: '600' }]}>
                        {LANGUAGE_LABELS[lang]}
                      </Text>
                      {active ? (
                        <MaterialCommunityIcons name="check-circle" size={18} color={colors.goldBright} />
                      ) : (
                        <MaterialCommunityIcons name="circle-outline" size={18} color={colors.textMuted} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {userMobile ? (
        <AuthSuccessModal
          visible={showOtpSentModal}
          title={t('auth.otpSentTitle')}
          message={t('auth.otpSentBody', { mobileNumber: maskMobileNumber(userMobile) })}
          ctaLabel={t('common.continue')}
          onContinue={handleOtpSentContinue}
        />
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 18,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  successBannerText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  errorBanner: {
    marginBottom: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  errorBannerText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    minHeight: 52,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  rowDesc: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.2,
    marginTop: 2,
    lineHeight: 15,
  },
  themeSegment: {
    flexDirection: 'row',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    padding: 3,
    gap: 2,
    flexShrink: 1,
    maxWidth: '58%',
  },
  themeSegmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 7,
    borderRadius: 11,
    flexShrink: 1,
  },
  themeSegmentText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
    flexShrink: 1,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  langPillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  inlineSectionHeader: {
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 6,
    borderBottomWidth: 1,
  },
  inlineSectionHeaderText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // Scrim color is bound at runtime to colors.scrim (theme-aware).
    padding: Spacing.xl2,
  },
  langModal: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  langModalTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  langRowText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
