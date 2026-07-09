import { useEffect, useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AuthShell, AuthSuccessModal, FormField, GoldButton } from '@/components/auth';
import { resetPassword } from '@/services/authApi';
import { ApiError } from '@/services/api';
import { useAuthStore } from '@/lib/authStore';
import { ensureVerifiedResetOtp } from '@/lib/passwordResetNavigation';
import { maskMobileNumber } from '@/utils/mobile-utils';

import { useAuthStyles } from '@/components/auth/authStyles';

function resolveResetError(err: unknown, t: (key: string) => string): string {
  if (err instanceof ApiError) {
    return err.message;
  }

  if (err instanceof Error) {
    return err.message;
  }

  return t('auth.errors.resetFailed');
}

export default function ResetPasswordScreen() {
  const authStyles = useAuthStyles();
  const { t } = useTranslation();
  const pendingPasswordResetMobile = useAuthStore((s) => s.pendingPasswordResetMobile);
  const verifiedPasswordResetOtp = useAuthStore((s) => s.verifiedPasswordResetOtp);
  const passwordResetReturnTo = useAuthStore((s) => s.passwordResetReturnTo);
  const clearPasswordResetFlow = useAuthStore((s) => s.clearPasswordResetFlow);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [returnTo, setReturnTo] = useState<'login' | 'settings'>('login');
  const mountedRef = useRef(false);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    ensureVerifiedResetOtp();
  }, []);

  const handleSubmit = async () => {
    if (!pendingPasswordResetMobile || !verifiedPasswordResetOtp || loading) return;

    if (newPassword.length < 6) {
      setFormError(t('auth.errors.passwordMinLength'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError(t('auth.errors.passwordMismatch'));
      return;
    }

    setLoading(true);
    setFormError(null);

    try {
      await resetPassword({
        mobileNumber: pendingPasswordResetMobile,
        phoneNumber: pendingPasswordResetMobile,
        otp: verifiedPasswordResetOtp,
        newPassword,
      });

      const nextReturnTo = passwordResetReturnTo ?? 'login';
      setReturnTo(nextReturnTo);
      setShowSuccessModal(true);
    } catch (err) {
      setFormError(resolveResetError(err, t));
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessContinue = () => {
    setShowSuccessModal(false);
    clearPasswordResetFlow();

    if (returnTo === 'settings') {
      if (router.canDismiss()) {
        router.dismissAll();
      }
      router.replace({
        pathname: '/(tabs)/profile/settings',
        params: { passwordChanged: '1' },
      });
      return;
    }

    router.replace('/(auth)/reset-success');
  };

  if (!pendingPasswordResetMobile || !verifiedPasswordResetOtp) {
    return null;
  }

  const maskedMobile = maskMobileNumber(pendingPasswordResetMobile);

  return (
    <AuthShell keyboardAware>
      <View style={authStyles.titleAccent}>
        <View style={authStyles.titleAccentLine} />
        <View style={authStyles.titleAccentDiamond} />
        <View style={authStyles.titleAccentLine} />
      </View>

      <Text style={authStyles.subtitle}>{t('auth.resetSubtitle')}</Text>
      <Text style={authStyles.title}>{t('auth.setNewPasswordTitle')}</Text>
      <Text style={authStyles.bodyText}>
        {t('auth.setNewPasswordBody', { mobileNumber: maskedMobile })}
      </Text>

      <View style={authStyles.errorBannerSlot}>
        {formError ? (
          <View style={authStyles.errorBanner}>
            <Text style={authStyles.errorBannerText}>{formError}</Text>
          </View>
        ) : null}
      </View>

      <View style={authStyles.form}>
        <FormField
          label={t('auth.newPassword')}
          value={newPassword}
          onChangeText={(text) => {
            setNewPassword(text);
            if (formError) setFormError(null);
          }}
          placeholder="••••••••"
          secureTextEntry={!showPassword}
          onToggleSecure={() => setShowPassword((current) => !current)}
          textContentType="newPassword"
          autoComplete="password-new"
          returnKeyType="next"
        />

        <FormField
          label={t('auth.confirmPassword')}
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            if (formError) setFormError(null);
          }}
          placeholder="••••••••"
          secureTextEntry={!showConfirmPassword}
          onToggleSecure={() => setShowConfirmPassword((current) => !current)}
          textContentType="newPassword"
          autoComplete="password-new"
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
        />
      </View>

      <Text style={[authStyles.bodyText, { marginTop: -8, marginBottom: 20, fontSize: 12 }]}>
        {t('auth.passwordHint')}
      </Text>

      <GoldButton
        label={loading ? t('auth.resetting') : t('auth.updatePasswordCta')}
        onPress={handleSubmit}
        loading={loading}
        disabled={loading || !newPassword || !confirmPassword}
      />

      <TouchableOpacity
        style={authStyles.backLink}
        onPress={() => {
          useAuthStore.setState({ verifiedPasswordResetOtp: null });
          router.replace('/(auth)/verify-reset-otp');
        }}
        activeOpacity={0.7}
      >
        <Text style={authStyles.backLinkText}>{t('auth.backToResetCode')}</Text>
      </TouchableOpacity>

      <AuthSuccessModal
        visible={showSuccessModal}
        title={t('auth.passwordChangedTitle')}
        message={
          returnTo === 'settings'
            ? t('auth.passwordChangedBody')
            : t('auth.resetSuccessBody')
        }
        ctaLabel={returnTo === 'settings' ? t('auth.backToSettings') : t('common.continue')}
        onContinue={handleSuccessContinue}
      />
    </AuthShell>
  );
}
