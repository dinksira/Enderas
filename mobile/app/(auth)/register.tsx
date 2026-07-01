import { useRef, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AuthShell, FormField, GoldButton, UserTypeCard } from '@/components/auth';
import { register } from '@/services/authApi';
import { ApiError } from '@/services/api';
import { useAuthStore } from '@/lib/authStore';
import { isValidEthiopianMobile } from '@/utils/mobile-utils';

import { useAuthStyles } from '@/components/auth/authStyles';

type UserType = 'individual' | 'organization';

function splitFullName(fullName: string) {
  const trimmed = fullName.trim();
  const spaceIndex = trimmed.indexOf(' ');

  if (spaceIndex === -1) {
    return { firstName: trimmed, lastName: '' };
  }

  return {
    firstName: trimmed.slice(0, spaceIndex),
    lastName: trimmed.slice(spaceIndex + 1).trim(),
  };
}

function resolveRegisterError(err: unknown, t: (key: string) => string): string {
  if (err instanceof ApiError) {
    return err.message;
  }

  if (err instanceof Error) {
    if (err.message.includes('Ethiopian mobile')) {
      return t('auth.errors.invalidPhone');
    }
    return err.message;
  }

  return t('auth.errors.registerFailed');
}

export default function RegisterScreen() {
  const authStyles = useAuthStyles();
  const { t } = useTranslation();
  const setPendingOtpVerification = useAuthStore((s) => s.setPendingOtpVerification);

  const [userType, setUserType] = useState<UserType>('individual');
  const [fullName, setFullName] = useState('');
  const [nationalIdNumber, setNationalIdNumber] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [tinNumber, setTinNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});

  const fullNameRef = useRef<TextInput>(null);
  const nationalIdRef = useRef<TextInput>(null);
  const orgNameRef = useRef<TextInput>(null);
  const tinRef = useRef<TextInput>(null);
  const mobileRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const handleRegister = async () => {
    const nextErrors: Record<string, string | undefined> = {};
    const trimmedMobile = mobileNumber.trim();

    if (!trimmedMobile) {
      nextErrors.mobileNumber = t('auth.errors.phoneRequired');
    } else if (!isValidEthiopianMobile(trimmedMobile)) {
      nextErrors.mobileNumber = t('auth.errors.invalidPhone');
    }

    if (!password || password.length < 6) {
      nextErrors.password = t('auth.errors.passwordMinLength');
    }

    if (password !== confirmPassword) {
      nextErrors.confirmPassword = t('auth.errors.passwordMismatch');
    }

    if (userType === 'individual' && !fullName.trim()) {
      nextErrors.fullName = t('auth.errors.fullNameRequired');
    }

    if (userType === 'organization') {
      if (!organizationName.trim()) {
        nextErrors.organizationName = t('auth.errors.organizationRequired');
      }
      if (!tinNumber.trim()) {
        nextErrors.tinNumber = t('auth.errors.tinRequired');
      }
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
      const nameParts = splitFullName(fullName);

      await register({
        userType,
        mobileNumber: trimmedMobile,
        phoneNumber: trimmedMobile,
        password,
        email: email.trim() || undefined,
        firstName: userType === 'individual' ? nameParts.firstName : undefined,
        lastName: userType === 'individual' ? nameParts.lastName : undefined,
        organizationName: userType === 'organization' ? organizationName.trim() : undefined,
      });

      setPendingOtpVerification(trimmedMobile, {
        userType,
        tinNumber: userType === 'organization' ? tinNumber.trim() : null,
      });

      router.replace('/(auth)/verify-otp');
    } catch (err) {
      setFormError(resolveRegisterError(err, t));
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

      <Text style={authStyles.subtitle}>{t('auth.registerSubtitle')}</Text>
      <Text style={authStyles.title}>{t('auth.register')}</Text>
      <Text style={authStyles.bodyText}>{t('auth.registerBody')}</Text>

      {formError ? (
        <View style={authStyles.errorBanner}>
          <Text style={authStyles.errorBannerText}>{formError}</Text>
        </View>
      ) : null}

      <View style={authStyles.form}>
        <View style={authStyles.userTypeSection}>
          <View style={authStyles.userTypeRow}>
            <UserTypeCard
              title={t('auth.userTypeIndividual')}
              description={t('auth.userTypeIndividualDesc')}
              icon="👤"
              active={userType === 'individual'}
              onPress={() => setUserType('individual')}
            />
            <UserTypeCard
              title={t('auth.userTypeOrganization')}
              description={t('auth.userTypeOrganizationDesc')}
              icon="🏢"
              active={userType === 'organization'}
              onPress={() => setUserType('organization')}
            />
          </View>
        </View>

        {userType === 'individual' ? (
          <>
            <FormField
              ref={fullNameRef}
              label={t('auth.fullName')}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Abebe Kebede"
              autoCapitalize="words"
              textContentType="name"
              autoComplete="name"
              returnKeyType="next"
              error={fieldErrors.fullName}
              onSubmitEditing={() => nationalIdRef.current?.focus()}
              blurOnSubmit={false}
            />
            <FormField
              ref={nationalIdRef}
              label={t('auth.nationalIdNumber')}
              value={nationalIdNumber}
              onChangeText={setNationalIdNumber}
              placeholder="ID-123456"
              returnKeyType="next"
              onSubmitEditing={() => mobileRef.current?.focus()}
              blurOnSubmit={false}
            />
          </>
        ) : (
          <>
            <FormField
              ref={orgNameRef}
              label={t('auth.organizationName')}
              value={organizationName}
              onChangeText={setOrganizationName}
              placeholder="ABC Trading PLC"
              autoCapitalize="words"
              textContentType="organizationName"
              autoComplete="organization"
              returnKeyType="next"
              error={fieldErrors.organizationName}
              onSubmitEditing={() => tinRef.current?.focus()}
              blurOnSubmit={false}
            />
            <FormField
              ref={tinRef}
              label={t('auth.tinNumber')}
              value={tinNumber}
              onChangeText={setTinNumber}
              placeholder="TIN-123456"
              returnKeyType="next"
              error={fieldErrors.tinNumber}
              onSubmitEditing={() => mobileRef.current?.focus()}
              blurOnSubmit={false}
            />
          </>
        )}

        <FormField
          ref={mobileRef}
          label={t('auth.mobileNumber')}
          value={mobileNumber}
          onChangeText={setMobileNumber}
          placeholder={t('auth.mobilePlaceholder')}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          returnKeyType="next"
          error={fieldErrors.mobileNumber}
          onSubmitEditing={() => emailRef.current?.focus()}
          blurOnSubmit={false}
        />

        <FormField
          ref={emailRef}
          label={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          placeholder="email@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          textContentType="emailAddress"
          autoComplete="email"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          blurOnSubmit={false}
        />

        <FormField
          ref={passwordRef}
          label={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry={!showPassword}
          onToggleSecure={() => setShowPassword(!showPassword)}
          textContentType="newPassword"
          autoComplete="password-new"
          returnKeyType="next"
          error={fieldErrors.password}
          onSubmitEditing={() => confirmPasswordRef.current?.focus()}
          blurOnSubmit={false}
        />

        <FormField
          ref={confirmPasswordRef}
          label={t('auth.confirmPassword')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="••••••••"
          secureTextEntry={!showConfirmPassword}
          onToggleSecure={() => setShowConfirmPassword(!showConfirmPassword)}
          textContentType="newPassword"
          autoComplete="password-new"
          returnKeyType="go"
          error={fieldErrors.confirmPassword}
          onSubmitEditing={handleRegister}
        />
      </View>

      <GoldButton label={t('auth.register')} onPress={handleRegister} loading={loading} />

      <View style={authStyles.linkRow}>
        <TouchableOpacity
          onPress={() => router.replace('/(auth)/login')}
          activeOpacity={0.7}
        >
          <Text style={authStyles.linkAction}>{t('auth.hasAccount')}</Text>
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
