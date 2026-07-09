import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { FormField, GoldButton } from '@/components/auth';
import { GlassCard } from '@/components/shell/GlassCard';
import { ScreenShell } from '@/components/shell/ScreenShell';
import { useRefreshSession } from '@/hooks/useRefreshSession';
import { useAuthStore } from '@/lib/authStore';
import { useTheme } from '@/lib/appStore';
import { ApiError } from '@/services/api';
import { getMe, updateMyProfile } from '@/services/authApi';

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

function joinFullName(firstName?: string | null, lastName?: string | null): string {
  return [firstName, lastName].filter(Boolean).join(' ').trim();
}

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const updateUserFields = useAuthStore((s) => s.updateUserFields);
  const { refresh } = useRefreshSession();

  const isOrganization = user?.userType === 'organization';

  const [fullName, setFullName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const emailRef = useRef(null);
  const orgNameRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        const me = await getMe();
        if (cancelled) return;

        setFullName(joinFullName(me.identity.firstName, me.identity.lastName) || me.identity.displayName || '');
        setOrganizationName(me.identity.organizationName ?? '');
        setEmail(me.identity.email ?? '');
        setMobile(me.identity.mobileNumber ?? '');
      } catch {
        if (cancelled) return;
        setFullName(joinFullName(user?.firstName, user?.lastName) || user?.displayName || '');
        setOrganizationName(user?.organizationName ?? '');
        setEmail(user?.email ?? '');
        setMobile(user?.mobileNumber ?? '');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [accessToken, user?.displayName, user?.email, user?.firstName, user?.lastName, user?.mobileNumber, user?.organizationName]);

  const initials = useMemo(() => {
    const source = isOrganization ? organizationName : fullName;
    return source
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || '?';
  }, [fullName, isOrganization, organizationName]);

  const handleSave = async () => {
    if (saving) return;

    setFormError(null);
    setSaved(false);

    const trimmedEmail = email.trim();
    if (trimmedEmail && !trimmedEmail.includes('@')) {
      setFormError(t('profile.editProfileScreen.errors.invalidEmail'));
      return;
    }

    if (isOrganization) {
      if (!organizationName.trim()) {
        setFormError(t('profile.editProfileScreen.errors.organizationRequired'));
        return;
      }
    } else if (!fullName.trim()) {
      setFormError(t('profile.editProfileScreen.errors.fullNameRequired'));
      return;
    }

    setSaving(true);

    try {
      const { firstName, lastName } = splitFullName(fullName);
      const payload = isOrganization
        ? {
            organizationName: organizationName.trim(),
            email: trimmedEmail || undefined,
          }
        : {
            firstName,
            lastName: lastName || undefined,
            email: trimmedEmail || undefined,
          };

      const me = await updateMyProfile(payload);

      updateUserFields({
        displayName: me.identity.displayName,
        firstName: me.identity.firstName ?? null,
        lastName: me.identity.lastName ?? null,
        organizationName: me.identity.organizationName ?? null,
        email: me.identity.email,
        mobileNumber: me.identity.mobileNumber,
        preferredLanguage: me.identity.preferredLanguage ?? null,
      });

      await refresh();
      setSaved(true);
      setTimeout(() => router.back(), 600);
    } catch (err) {
      setFormError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : t('profile.editProfileScreen.errors.saveFailed'),
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ScreenShell title={t('profile.editProfile')} showBack onBack={() => router.back()} bottomPadding={120}>
        <ActivityIndicator color={colors.goldBright} />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      title={t('profile.editProfile')}
      showBack
      onBack={() => router.back()}
      bottomPadding={120}
      keyboardAware
      keyboardToolbar
    >
      <GlassCard padding={18}>
        <View style={styles.avatarSection}>
          <LinearGradient
            colors={[colors.gold, colors.goldDeep]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <Text style={[styles.avatarText, { color: colors.textOnGold }]}>{initials}</Text>
          </LinearGradient>
          <View style={styles.avatarMeta}>
            <Text style={[styles.avatarHint, { color: colors.cream }]}>
              {t('profile.editProfileScreen.photoHint')}
            </Text>
            <Text style={[styles.avatarSub, { color: colors.textMuted }]}>
              {t('profile.editProfileScreen.photoSub')}
            </Text>
          </View>
        </View>
      </GlassCard>

      <View style={styles.form}>
        <GlassCard padding={16}>
          <Text style={[styles.sectionLabel, { color: colors.goldChampagne }]}>
            {t('profile.editProfileScreen.personalInfo').toUpperCase()}
          </Text>

          {isOrganization ? (
            <FormField
              ref={orgNameRef}
              label={t('profile.editProfileScreen.organizationName')}
              value={organizationName}
              onChangeText={setOrganizationName}
              placeholder={t('profile.editProfileScreen.organizationNamePlaceholder')}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => (emailRef.current as { focus?: () => void } | null)?.focus?.()}
            />
          ) : (
            <FormField
              label={t('profile.editProfileScreen.fullName')}
              value={fullName}
              onChangeText={setFullName}
              placeholder={t('profile.editProfileScreen.fullNamePlaceholder')}
              autoCapitalize="words"
              textContentType="name"
              autoComplete="name"
              returnKeyType="next"
              onSubmitEditing={() => (emailRef.current as { focus?: () => void } | null)?.focus?.()}
            />
          )}

          <FormField
            ref={emailRef}
            label={t('profile.editProfileScreen.email')}
            value={email}
            onChangeText={setEmail}
            placeholder={t('profile.editProfileScreen.emailPlaceholder')}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            returnKeyType="done"
          />

          <FormField
            label={t('profile.editProfileScreen.mobile')}
            value={mobile}
            editable={false}
            placeholder={t('profile.editProfileScreen.mobilePlaceholder')}
          />
          <Text style={[styles.readOnlyHint, { color: colors.textMuted }]}>
            {t('profile.editProfileScreen.mobileReadOnly')}
          </Text>
        </GlassCard>
      </View>

      {formError ? (
        <View style={[styles.errorBanner, { backgroundColor: colors.danger.soft, borderColor: colors.danger.border }]}>
          <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.danger.fg} />
          <Text style={[styles.errorText, { color: colors.danger.fg }]}>{formError}</Text>
        </View>
      ) : null}

      {saved ? (
        <View style={[styles.savedBanner, { backgroundColor: colors.glassFillActive, borderColor: colors.goldBorder }]}>
          <MaterialCommunityIcons name="check-circle" size={16} color={colors.goldBright} />
          <Text style={[styles.savedText, { color: colors.goldBright }]}>
            {t('profile.editProfileScreen.saved')}
          </Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <GoldButton
          label={saving ? t('common.submitting') : t('profile.editProfileScreen.save')}
          onPress={handleSave}
          loading={saving}
          disabled={saving}
        />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },
  avatarMeta: {
    flex: 1,
  },
  avatarHint: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  avatarSub: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
  },
  form: {
    marginTop: 12,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  readOnlyHint: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: -4,
    marginBottom: 4,
  },
  actions: {
    marginTop: 16,
  },
  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  savedText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
});
