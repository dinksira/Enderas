import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AuthShell, AuthSuccessModal, GoldButton, OtpInput } from '@/components/auth';
import { forgotPassword, verifyResetOtp } from '@/services/authApi';
import { ApiError } from '@/services/api';
import { useAuthStore } from '@/lib/authStore';
import { useTheme } from '@/lib/appStore';
import { ensurePasswordResetMobile } from '@/lib/passwordResetNavigation';
import { useOtpTimer } from '@/hooks/useOtpTimer';
import { maskMobileNumber } from '@/utils/mobile-utils';

import { useAuthStyles } from '@/components/auth/authStyles';

function resolveOtpError(err: unknown, t: (key: string) => string): string {
  if (err instanceof ApiError) {
    return err.message;
  }

  if (err instanceof Error) {
    return err.message;
  }

  return t('auth.invalidOtp');
}

export default function VerifyResetOtpScreen() {
  const authStyles = useAuthStyles();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const pendingPasswordResetMobile = useAuthStore((s) => s.pendingPasswordResetMobile);
  const setVerifiedPasswordResetOtp = useAuthStore((s) => s.setVerifiedPasswordResetOtp);
  const { formatted, isExpired, reset } = useOtpTimer(60);

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showVerifiedModal, setShowVerifiedModal] = useState(false);
  const verifyingRef = useRef(false);
  const mountedRef = useRef(false);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    ensurePasswordResetMobile();
  }, []);

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  const showTransientSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }
    successTimeoutRef.current = setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  }, []);

  const handleVerify = useCallback(async (code: string) => {
    if (!pendingPasswordResetMobile || verifyingRef.current) return;

    if (code.length !== 6) {
      setFormError(t('auth.errors.otpIncomplete'));
      return;
    }

    verifyingRef.current = true;
    setLoading(true);
    setFormError(null);
    setSuccessMessage(null);

    try {
      await verifyResetOtp({
        mobileNumber: pendingPasswordResetMobile,
        phoneNumber: pendingPasswordResetMobile,
        otp: code,
      });

      setVerifiedPasswordResetOtp(code);
      setShowVerifiedModal(true);
    } catch (err) {
      setFormError(resolveOtpError(err, t));
    } finally {
      verifyingRef.current = false;
      setLoading(false);
    }
  }, [pendingPasswordResetMobile, setVerifiedPasswordResetOtp, t]);

  const handleVerifiedContinue = () => {
    setShowVerifiedModal(false);
    router.push('/(auth)/reset-password');
  };

  const handleOtpChange = useCallback((next: string) => {
    setOtp(next);
    if (formError) setFormError(null);
  }, [formError]);

  const handleResend = async () => {
    if (!pendingPasswordResetMobile || resending || !isExpired) return;

    setResending(true);
    setFormError(null);
    setSuccessMessage(null);

    try {
      await forgotPassword({
        mobileNumber: pendingPasswordResetMobile,
        phoneNumber: pendingPasswordResetMobile,
      });
      reset();
      setOtp('');
      showTransientSuccess(t('auth.otpResent'));
    } catch (err) {
      setFormError(resolveOtpError(err, t));
    } finally {
      setResending(false);
    }
  };

  if (!pendingPasswordResetMobile) {
    return null;
  }

  const maskedMobile = maskMobileNumber(pendingPasswordResetMobile);

  return (
    <AuthShell keyboardAware={false}>
      <View style={authStyles.titleAccent}>
        <View style={authStyles.titleAccentLine} />
        <View style={authStyles.titleAccentDiamond} />
        <View style={authStyles.titleAccentLine} />
      </View>

      <Text style={authStyles.subtitle}>{t('auth.verifyResetSubtitle')}</Text>
      <Text style={authStyles.title}>{t('auth.verifyResetTitle')}</Text>
      <Text style={authStyles.bodyText}>
        {t('auth.resetOtpDescription', { mobileNumber: maskedMobile })}
      </Text>

      <View style={authStyles.errorBannerSlot}>
        {formError ? (
          <View style={authStyles.errorBanner}>
            <Text style={authStyles.errorBannerText}>{formError}</Text>
          </View>
        ) : successMessage ? (
          <View style={authStyles.successBanner}>
            <MaterialCommunityIcons name="check-circle" size={16} color={colors.success.fg} />
            <Text style={authStyles.successBannerText}>{successMessage}</Text>
          </View>
        ) : null}
      </View>

      <View style={authStyles.form}>
        <OtpInput
          value={otp}
          onChange={handleOtpChange}
          onComplete={handleVerify}
          error={Boolean(formError)}
        />
      </View>

      <GoldButton
        label={loading ? t('auth.otpChecking') : t('auth.verifyResetCta')}
        onPress={() => handleVerify(otp)}
        loading={loading}
        disabled={otp.length !== 6 || loading}
      />

      <View style={authStyles.linkRow}>
        <Text style={authStyles.bodyText}>{t('auth.resendPrompt')} </Text>
        <TouchableOpacity
          onPress={handleResend}
          disabled={!isExpired || resending}
          activeOpacity={0.7}
        >
          <Text
            style={[
              authStyles.linkAction,
              { opacity: isExpired && !resending ? 1 : 0.45 },
            ]}
          >
            {resending ? t('auth.resending') : isExpired ? t('auth.resendOtp') : t('auth.resendIn', { time: formatted })}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={authStyles.backLink} onPress={() => router.back()} activeOpacity={0.7}>
        <Text style={authStyles.backLinkText}>{t('common.back')}</Text>
      </TouchableOpacity>

      <AuthSuccessModal
        visible={showVerifiedModal}
        title={t('auth.otpVerifiedTitle')}
        message={t('auth.otpVerifiedBody')}
        ctaLabel={t('common.continue')}
        onContinue={handleVerifiedContinue}
      />
    </AuthShell>
  );
}
