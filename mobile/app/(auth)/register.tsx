import { useRef, useState } from 'react';
import { Keyboard, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AuthShell, FormField, GoldButton, UserTypeCard, ConfirmPhoneModal } from '@/components/auth';
import { register } from '@/services/authApi';
import { ApiError } from '@/services/api';
import { useAuthStore } from '@/lib/authStore';
import { isValidLocalPhone, isValidEmail, normalizeMobileNumber } from '@/utils/mobile-utils';

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

type RegisterFieldKey =
  | 'fullName'
  | 'nationalIdNumber'
  | 'organizationName'
  | 'tinNumber'
  | 'mobileNumber'
  | 'email'
  | 'password'
  | 'confirmPassword';

/**
 * Maps a failed registration into either a field-scoped error (rendered inline
 * on the offending input so it's discoverable on a long form) or a general
 * message shown in the banner above the submit button.
 */
function mapRegisterApiError(
  err: unknown,
  t: (key: string) => string,
): { field?: RegisterFieldKey; message: string } {
  if (err instanceof ApiError) {
    switch (err.code) {
      case 'DUPLICATE_MOBILE':
        return { field: 'mobileNumber', message: t('auth.errors.alreadyRegistered') };
      case 'INVALID_MOBILE_NUMBER':
        return { field: 'mobileNumber', message: t('auth.errors.invalidPhone') };
      case 'DUPLICATE_EMAIL':
        return { field: 'email', message: t('auth.errors.duplicateEmail') };
      case 'DUPLICATE_NATIONAL_ID':
        return { field: 'nationalIdNumber', message: t('auth.errors.duplicateNationalId') };
      case 'DUPLICATE_TIN':
        return { field: 'tinNumber', message: t('auth.errors.duplicateTin') };
      default:
        return { message: err.message };
    }
  }

  if (err instanceof Error) {
    if (err.message.includes('Ethiopian mobile')) {
      return { field: 'mobileNumber', message: t('auth.errors.invalidPhone') };
    }
    return { message: err.message };
  }

  return { message: t('auth.errors.registerFailed') };
}

const FIELD_FOCUS_ORDER: RegisterFieldKey[] = [
  'fullName',
  'organizationName',
  'nationalIdNumber',
  'tinNumber',
  'mobileNumber',
  'email',
  'password',
  'confirmPassword',
];

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
  const [confirmVisible, setConfirmVisible] = useState(false);

  const fullNameRef = useRef<TextInput>(null);
  const nationalIdRef = useRef<TextInput>(null);
  const orgNameRef = useRef<TextInput>(null);
  const tinRef = useRef<TextInput>(null);
  const mobileRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  // Deferred until the confirm dialog finishes its close animation — running
  // submit/focus mid-dismiss interrupts the bottom-sheet transition and leaves
  // it unable to re-present (register press appears to "do nothing").
  const confirmActionRef = useRef<'submit' | 'edit' | null>(null);

  const fieldRefs: Record<RegisterFieldKey, React.RefObject<TextInput | null>> = {
    fullName: fullNameRef,
    nationalIdNumber: nationalIdRef,
    organizationName: orgNameRef,
    tinNumber: tinRef,
    mobileNumber: mobileRef,
    email: emailRef,
    password: passwordRef,
    confirmPassword: confirmPasswordRef,
  };

  // Focusing the offending field makes the KeyboardAwareScrollView bring it
  // into view, so errors are never stranded off-screen on the long form.
  const focusField = (field: RegisterFieldKey) => {
    setTimeout(() => fieldRefs[field]?.current?.focus(), 80);
  };

  const focusFirstError = (errors: Record<string, string | undefined>) => {
    const first = FIELD_FOCUS_ORDER.find((key) => errors[key]);
    if (first) {
      focusField(first);
    }
  };

  const submitRegistration = async () => {
    const trimmedMobile = mobileNumber.trim();
    const trimmedEmail = email.trim();

    setLoading(true);
    setFormError(null);
    setFieldErrors({});

    try {
      const nameParts = splitFullName(fullName);
      const normalizedMobile = normalizeMobileNumber(trimmedMobile);

      await register({
        userType,
        mobileNumber: normalizedMobile,
        phoneNumber: normalizedMobile,
        password,
        email: trimmedEmail || undefined,
        firstName: userType === 'individual' ? nameParts.firstName : undefined,
        lastName: userType === 'individual' ? nameParts.lastName : undefined,
        organizationName: userType === 'organization' ? organizationName.trim() : undefined,
        nationalIdNumber: userType === 'individual' ? nationalIdNumber.trim() : undefined,
        tinNumber: userType === 'organization' ? tinNumber.trim() : undefined,
      });

      setPendingOtpVerification(normalizedMobile, {
        userType,
        tinNumber: userType === 'organization' ? tinNumber.trim() : null,
      });

      router.push({
        pathname: '/(auth)/verify-otp',
        params: { from: 'register' },
      });
    } catch (err) {
      const mapped = mapRegisterApiError(err, t);
      if (mapped.field) {
        setFormError(null);
        setFieldErrors({ [mapped.field]: mapped.message });
        focusField(mapped.field);
      } else {
        setFieldErrors({});
        setFormError(mapped.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    const nextErrors: Record<string, string | undefined> = {};
    const trimmedMobile = mobileNumber.trim();
    const trimmedEmail = email.trim();

    if (!trimmedMobile) {
      nextErrors.mobileNumber = t('auth.errors.phoneRequired');
    } else if (!isValidLocalPhone(trimmedMobile)) {
      nextErrors.mobileNumber = t('auth.errors.invalidPhone');
    }

    if (trimmedEmail && !isValidEmail(trimmedEmail)) {
      nextErrors.email = t('auth.errors.emailInvalid');
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
      focusFirstError(nextErrors);
      return;
    }

    Keyboard.dismiss();
    setConfirmVisible(true);
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
              onChangeText={(value) => {
                setFullName(value);
                setFieldErrors((current) => ({ ...current, fullName: undefined }));
              }}
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
              onChangeText={(value) => {
                setNationalIdNumber(value);
                setFieldErrors((current) => ({ ...current, nationalIdNumber: undefined }));
              }}
              placeholder="ID-123456"
              returnKeyType="next"
              error={fieldErrors.nationalIdNumber}
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
              onChangeText={(value) => {
                setOrganizationName(value);
                setFieldErrors((current) => ({ ...current, organizationName: undefined }));
              }}
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
              onChangeText={(value) => {
                setTinNumber(value);
                setFieldErrors((current) => ({ ...current, tinNumber: undefined }));
              }}
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
          onChangeText={(value) => {
            setMobileNumber(value.replace(/\D/g, '').slice(0, 10));
            setFieldErrors((current) => ({ ...current, mobileNumber: undefined }));
          }}
          placeholder={t('auth.mobilePlaceholder')}
          prefix="+251"
          maxLength={10}
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
          onChangeText={(value) => {
            setEmail(value);
            setFieldErrors((current) => ({ ...current, email: undefined }));
          }}
          placeholder="email@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          textContentType="emailAddress"
          autoComplete="email"
          returnKeyType="next"
          error={fieldErrors.email}
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

      {formError ? (
        <View style={authStyles.formErrorBanner}>
          <View style={authStyles.formErrorBadge}>
            <Text style={authStyles.formErrorBadgeText}>!</Text>
          </View>
          <Text style={authStyles.formErrorBannerText}>{formError}</Text>
        </View>
      ) : null}

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

      <ConfirmPhoneModal
        visible={confirmVisible}
        mobileNumber={normalizeMobileNumber(mobileNumber.trim())}
        loading={loading}
        onConfirm={() => {
          confirmActionRef.current = 'submit';
          setConfirmVisible(false);
        }}
        onEdit={() => {
          confirmActionRef.current = 'edit';
          setConfirmVisible(false);
        }}
        onDismiss={() => {
          setConfirmVisible(false);
          const action = confirmActionRef.current;
          confirmActionRef.current = null;
          if (action === 'submit') {
            submitRegistration();
          } else if (action === 'edit') {
            focusField('mobileNumber');
          }
        }}
      />
    </AuthShell>
  );
}
