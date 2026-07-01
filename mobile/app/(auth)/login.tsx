import { useRef, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AuthShell, FormField, GoldButton } from '@/components/auth';
import { login } from '@/services/authApi';
import { ApiError } from '@/services/api';
import { isMobileAllowedUser } from '@/lib/auth-utils';
import { useAuthStore, type AuthUser } from '@/lib/authStore';
import { isValidEthiopianMobile } from '@/utils/mobile-utils';

import { useAuthStyles } from '@/components/auth/authStyles';

function resolveLoginError(err: unknown, t: (key: string) => string): string {
  if (err instanceof ApiError) {
    if (err.code === 'INVALID_CREDENTIALS') {
      return t('auth.errors.invalidCredentials');
    }
    if (err.code === 'NETWORK_ERROR') {
      return err.message;
    }
    return err.message;
  }

  if (err instanceof Error) {
    if (err.message.includes('Ethiopian mobile')) {
      return t('auth.errors.invalidPhone');
    }
    return err.message;
  }

  return t('auth.errors.loginFailed');
}

export default function LoginScreen() {
  const authStyles = useAuthStyles();
  const { t } = useTranslation();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clearSession);
  const setPendingOtpVerification = useAuthStore((s) => s.setPendingOtpVerification);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ phoneNumber?: string; password?: string }>({});

  const passwordRef = useRef<TextInput>(null);

  const navigateAfterAuth = () => {
    const destination =
      typeof returnTo === 'string' && returnTo.startsWith('/')
        ? returnTo
        : '/(tabs)/dashboard';
    router.replace(destination as any);
  };

  const handleLogin = async () => {
    const nextErrors: { phoneNumber?: string; password?: string } = {};
    const trimmedPhone = phoneNumber.trim();

    if (!trimmedPhone) {
      nextErrors.phoneNumber = t('auth.errors.phoneRequired');
    } else if (!isValidEthiopianMobile(trimmedPhone)) {
      nextErrors.phoneNumber = t('auth.errors.invalidPhone');
    }

    if (!password) {
      nextErrors.password = t('auth.errors.passwordRequired');
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setFormError(null);
      return;
    }

    setLoading(true);
    setFormError(null);
    setFieldErrors({});

    try {
      const session = await login({ phoneNumber: trimmedPhone, password });
      const sessionUser: AuthUser = {
        id: String(session.identity?.userId || session.identity?.id || ''),
        roleCode: session.authz?.roleCode ?? null,
        isStaff: session.identity?.isStaff,
        staffId: session.identity?.staffId ?? null,
        employeeId: session.identity?.employeeId ?? null,
        displayName: session.identity?.displayName,
        mobileNumber: session.identity?.mobileNumber,
        email: session.identity?.email,
        status: session.identity?.status,
        userType: session.identity?.userType,
      };

      if (!isMobileAllowedUser(sessionUser)) {
        clearSession();
        setFormError(t('auth.staffLoginBlocked'));
        return;
      }

      if (session.identity?.isMobileVerified === false) {
        setPendingOtpVerification(trimmedPhone);
        router.replace('/(auth)/verify-otp');
        return;
      }

      setSession({
        accessToken: session.accessToken,
        identity: session.identity,
        authz: session.authz,
        user: session.user,
      });

      navigateAfterAuth();
    } catch (err) {
      setFormError(resolveLoginError(err, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <View style={authStyles.titleAccent}>
        <View style={authStyles.titleAccentLine} />
        <View style={authStyles.titleAccentDiamond} />
        <View style={authStyles.titleAccentLine} />
      </View>

      <Text style={authStyles.subtitle}>{t('auth.loginSubtitle')}</Text>
      <Text style={authStyles.title}>{t('auth.login')}</Text>
      <Text style={authStyles.bodyText}>{t('auth.loginBody')}</Text>

      {formError ? (
        <View style={authStyles.errorBanner}>
          <Text style={authStyles.errorBannerText}>{formError}</Text>
        </View>
      ) : null}

      <View style={authStyles.form}>
        <FormField
          label={t('auth.mobileNumber')}
          value={phoneNumber}
          onChangeText={(value) => {
            setPhoneNumber(value);
            setFieldErrors((current) => ({ ...current, phoneNumber: undefined }));
          }}
          placeholder={t('auth.mobilePlaceholder')}
          autoCapitalize="none"
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          returnKeyType="next"
          error={fieldErrors.phoneNumber}
          onSubmitEditing={() => passwordRef.current?.focus()}
          blurOnSubmit={false}
        />

        <FormField
          ref={passwordRef}
          label={t('auth.password')}
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            setFieldErrors((current) => ({ ...current, password: undefined }));
          }}
          placeholder="••••••••"
          secureTextEntry={!showPassword}
          onToggleSecure={() => setShowPassword(!showPassword)}
          textContentType="password"
          autoComplete="password"
          returnKeyType="go"
          error={fieldErrors.password}
          onSubmitEditing={handleLogin}
        />
      </View>

      <GoldButton label={t('auth.login')} onPress={handleLogin} loading={loading} />

      <TouchableOpacity style={authStyles.backLink} onPress={() => {}} activeOpacity={0.7}>
        <Text style={[authStyles.linkAction, { textDecorationLine: 'none' }]}>
          {t('auth.forgotPassword')}
        </Text>
      </TouchableOpacity>

      <View style={authStyles.linkRow}>
        <TouchableOpacity
          onPress={() => router.replace('/(auth)/register')}
          activeOpacity={0.7}
        >
          <Text style={authStyles.linkAction}>{t('auth.noAccount')}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={authStyles.backLink}
        onPress={() => router.replace('/(tabs)/dashboard')}
        activeOpacity={0.7}
      >
        <Text style={authStyles.backLinkText}>{t('auth.continueAsGuest')}</Text>
      </TouchableOpacity>
    </AuthShell>
  );
}
