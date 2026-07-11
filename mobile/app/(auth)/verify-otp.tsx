import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AuthShell, GoldButton, OtpInput } from '@/components/auth';
import { verifyOtp, resendOtp } from '@/services/authApi';
import { ApiError } from '@/services/api';
import { isMobileAllowedUser } from '@/lib/auth-utils';
import { useAuthStore, useIsAuthenticated, type AuthUser } from '@/lib/authStore';
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

export default function VerifyOtpScreen() {
  const authStyles = useAuthStyles();
  const { t } = useTranslation();
  const pendingOtpMobile = useAuthStore((s) => s.pendingOtpMobile);
  const isAuthenticated = useIsAuthenticated();
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clearSession);
  const clearPendingOtpVerification = useAuthStore((s) => s.clearPendingOtpVerification);
  const { formatted, isExpired, reset } = useOtpTimer(60);

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const verifyingRef = useRef(false);

  useEffect(() => {
    if (!pendingOtpMobile && !isAuthenticated) {
      router.replace('/(auth)/register');
    }
  }, [isAuthenticated, pendingOtpMobile]);

  const handleOtpChange = useCallback((next: string) => {
    setOtp(next);
    if (formError) {
      setFormError(null);
    }
  }, [formError]);

  const handleVerify = useCallback(async () => {
    if (!pendingOtpMobile || verifyingRef.current) return;

    if (otp.length !== 6) {
      setFormError(t('auth.errors.otpIncomplete'));
      return;
    }

    verifyingRef.current = true;
    setLoading(true);
    setFormError(null);

    try {
      const response = (await verifyOtp({
        mobileNumber: pendingOtpMobile,
        phoneNumber: pendingOtpMobile,
        otp,
      })) as {
        accessToken: string;
        identity?: Record<string, unknown>;
        authz?: Record<string, unknown>;
        user?: Record<string, unknown>;
      };

      const identity = (response.identity ?? {}) as Record<string, unknown>;
      const authz = (response.authz ?? {}) as Record<string, unknown>;
      const sessionUser: AuthUser = {
        id: String(identity.userId || identity.id || ''),
        roleCode: (authz.roleCode as string | null) ?? null,
        isStaff: Boolean(identity.isStaff),
        staffId: (identity.staffId as string | null) ?? null,
        employeeId: (identity.employeeId as string | null) ?? null,
        displayName: (identity.displayName as string) ?? '',
        mobileNumber: (identity.mobileNumber as string) ?? '',
        email: (identity.email as string) ?? '',
        status: (identity.status as string) ?? '',
        userType: (identity.userType as string) ?? '',
      };

      if (!isMobileAllowedUser(sessionUser)) {
        clearSession();
        setFormError(t('auth.staffLoginBlocked'));
        return;
      }

      setSession({
        accessToken: response.accessToken,
        identity: response.identity,
        authz: response.authz,
        user: response.user,
      });

      clearPendingOtpVerification();
      router.replace('/(tabs)/dashboard');
    } catch (err) {
      setFormError(resolveOtpError(err, t));
    } finally {
      verifyingRef.current = false;
      setLoading(false);
    }
  }, [
    clearPendingOtpVerification,
    clearSession,
    otp,
    pendingOtpMobile,
    setSession,
    t,
  ]);

  const handleResend = async () => {
    if (!pendingOtpMobile || !isExpired || resending) return;

    setResending(true);
    setFormError(null);

    try {
      await resendOtp({
        mobileNumber: pendingOtpMobile,
        phoneNumber: pendingOtpMobile,
      });
      reset();
      setOtp('');
    } catch (err) {
      setFormError(resolveOtpError(err, t));
    } finally {
      setResending(false);
    }
  };

  if (!pendingOtpMobile) {
    return null;
  }

  const maskedMobile = maskMobileNumber(pendingOtpMobile);

  return (
    <AuthShell keyboardAware={false}>
      <View style={authStyles.titleAccent}>
        <View style={authStyles.titleAccentLine} />
        <View style={authStyles.titleAccentDiamond} />
        <View style={authStyles.titleAccentLine} />
      </View>

      <Text style={authStyles.subtitle}>{t('auth.verifySubtitle')}</Text>
      <Text style={authStyles.title}>{t('auth.verifyOTP')}</Text>
      <Text style={authStyles.bodyText}>
        {t('auth.otpDescription', { mobileNumber: maskedMobile })}
      </Text>

      <View style={authStyles.errorBannerSlot}>
        {formError ? (
          <View style={authStyles.errorBanner}>
            <Text style={authStyles.errorBannerText}>{formError}</Text>
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
        label={t('auth.verifyCta')}
        onPress={handleVerify}
        loading={loading}
        disabled={otp.length !== 6}
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
            {isExpired ? t('auth.resendOtp') : t('auth.resendIn', { time: formatted })}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={authStyles.backLink}
        onPress={() => router.replace('/(auth)/login')}
        activeOpacity={0.7}
      >
        <Text style={authStyles.backLinkText}>{t('auth.backToLogin')}</Text>
      </TouchableOpacity>
    </AuthShell>
  );
}
