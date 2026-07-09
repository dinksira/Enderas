import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AuthShell, AuthSuccessModal, FormField, GoldButton } from '@/components/auth';
import { forgotPassword } from '@/services/authApi';
import { ApiError } from '@/services/api';
import { useAuthStore } from '@/lib/authStore';
import { isValidEthiopianMobile, maskMobileNumber } from '@/utils/mobile-utils';

import { useAuthStyles } from '@/components/auth/authStyles';

function resolveForgotPasswordError(err: unknown, t: (key: string) => string): string {
  if (err instanceof ApiError) {
    return err.message;
  }

  if (err instanceof Error) {
    if (err.message.includes('Ethiopian mobile')) {
      return t('auth.errors.invalidPhone');
    }
    return err.message;
  }

  return t('auth.errors.resetRequestFailed');
}

export default function ForgotPasswordScreen() {
  const authStyles = useAuthStyles();
  const { t } = useTranslation();
  const setPendingPasswordReset = useAuthStore((s) => s.setPendingPasswordReset);
  const userMobile = useAuthStore((s) => s.user?.mobileNumber);

  const [mobileNumber, setMobileNumber] = useState(userMobile ?? '');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showOtpSentModal, setShowOtpSentModal] = useState(false);
  const [sentToMobile, setSentToMobile] = useState('');

  const handleSubmit = async () => {
    const trimmed = mobileNumber.trim();

    if (!trimmed) {
      setFormError(t('auth.errors.phoneRequired'));
      return;
    }

    if (!isValidEthiopianMobile(trimmed)) {
      setFormError(t('auth.errors.invalidPhone'));
      return;
    }

    setLoading(true);
    setFormError(null);

    try {
      await forgotPassword({ mobileNumber: trimmed, phoneNumber: trimmed });
      setPendingPasswordReset(trimmed, 'login');
      setSentToMobile(trimmed);
      setShowOtpSentModal(true);
    } catch (err) {
      setFormError(resolveForgotPasswordError(err, t));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSentContinue = () => {
    setShowOtpSentModal(false);
    router.push('/(auth)/verify-reset-otp');
  };

  return (
    <AuthShell>
      <View style={authStyles.titleAccent}>
        <View style={authStyles.titleAccentLine} />
        <View style={authStyles.titleAccentDiamond} />
        <View style={authStyles.titleAccentLine} />
      </View>

      <Text style={authStyles.subtitle}>{t('auth.forgotSubtitle')}</Text>
      <Text style={authStyles.title}>{t('auth.resetPassword')}</Text>
      <Text style={authStyles.bodyText}>{t('auth.forgotDescription')}</Text>

      <View style={authStyles.errorBannerSlot}>
        {formError ? (
          <View style={authStyles.errorBanner}>
            <Text style={authStyles.errorBannerText}>{formError}</Text>
          </View>
        ) : null}
      </View>

      <View style={authStyles.form}>
        <FormField
          label={t('auth.mobileNumber')}
          value={mobileNumber}
          onChangeText={(text) => {
            setMobileNumber(text);
            if (formError) setFormError(null);
          }}
          placeholder={t('auth.mobilePlaceholder')}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
          editable={!userMobile}
        />
      </View>

      <GoldButton label={t('auth.sendResetCode')} onPress={handleSubmit} loading={loading} />

      <TouchableOpacity
        style={authStyles.backLink}
        onPress={() => (userMobile ? router.back() : router.replace('/(auth)/login'))}
        activeOpacity={0.7}
      >
        <Text style={authStyles.backLinkText}>
          {userMobile ? t('common.back') : t('auth.backToLogin')}
        </Text>
      </TouchableOpacity>

      <AuthSuccessModal
        visible={showOtpSentModal}
        title={t('auth.otpSentTitle')}
        message={t('auth.otpSentBody', { mobileNumber: maskMobileNumber(sentToMobile) })}
        ctaLabel={t('common.continue')}
        onContinue={handleOtpSentContinue}
      />
    </AuthShell>
  );
}
