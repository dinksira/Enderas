import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';

import { FormField, GoldButton } from '@/components/auth';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { GlassCard } from '@/components/shell/GlassCard';
import { ScreenShell } from '@/components/shell/ScreenShell';
import { useRefreshSession } from '@/hooks/useRefreshSession';
import { useAuthStore } from '@/lib/authStore';
import { useTheme } from '@/lib/appStore';
import { ApiError } from '@/services/api';
import { getMe, updateMyProfile } from '@/services/authApi';
import { fileUploadApi, type PickedFile } from '@/services/fileUploadApi';

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
  const { refreshing, refresh } = useRefreshSession();

  const isOrganization = user?.userType === 'organization';

  const [fullName, setFullName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [localPreviewUri, setLocalPreviewUri] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
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
        setProfilePicture(me.identity.profilePicture ?? null);
      } catch {
        if (cancelled) return;
        setFullName(joinFullName(user?.firstName, user?.lastName) || user?.displayName || '');
        setOrganizationName(user?.organizationName ?? '');
        setEmail(user?.email ?? '');
        setMobile(user?.mobileNumber ?? '');
        setProfilePicture(user?.profilePicture ?? null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [accessToken, user?.displayName, user?.email, user?.firstName, user?.lastName, user?.mobileNumber, user?.organizationName, user?.profilePicture]);

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

  const pickProfilePhoto = useCallback(async () => {
    if (saving || uploadingPhoto) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        t('profile.editProfileScreen.photoHint'),
        t('profile.editProfileScreen.photoSub'),
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const extension = asset.uri.split('.').pop() || 'jpg';
    const fileName = asset.fileName || `profile-${Date.now()}.${extension}`;
    const picked: PickedFile = {
      uri: asset.uri,
      name: fileName,
      mimeType: asset.mimeType || (fileName.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg'),
    };

    setLocalPreviewUri(picked.uri);
    setUploadingPhoto(true);
    setFormError(null);

    try {
      const uploaded = await fileUploadApi.uploadFile(picked, 'users/profile');
      setProfilePicture(uploaded.fileUrl);
      setLocalPreviewUri(null);
    } catch (err) {
      setLocalPreviewUri(null);
      setFormError(
        err instanceof ApiError
          ? err.message
          : t('profile.editProfileScreen.errors.photoUploadFailed'),
      );
    } finally {
      setUploadingPhoto(false);
    }
  }, [saving, t, uploadingPhoto]);

  const removeProfilePhoto = useCallback(() => {
    if (saving || uploadingPhoto) return;
    setProfilePicture(null);
    setLocalPreviewUri(null);
  }, [saving, uploadingPhoto]);

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
            profilePicture,
          }
        : {
            firstName,
            lastName: lastName || undefined,
            email: trimmedEmail || undefined,
            profilePicture,
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
        profilePicture: me.identity.profilePicture ?? null,
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
      refreshing={refreshing}
      onRefresh={refresh}
    >
      <GlassCard padding={18}>
        <View style={styles.avatarSection}>
          <Pressable
            onPress={pickProfilePhoto}
            disabled={saving || uploadingPhoto}
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
          >
            <View style={styles.avatarWrap}>
              <ProfileAvatar
                profilePicture={localPreviewUri || profilePicture}
                initials={initials}
                size={64}
              />
              {uploadingPhoto ? (
                <View style={[styles.avatarOverlay, { backgroundColor: colors.scrim }]}>
                  <ActivityIndicator color={colors.goldBright} />
                </View>
              ) : (
                <View style={[styles.avatarBadge, { backgroundColor: colors.gold, borderColor: colors.base }]}>
                  <MaterialCommunityIcons name="camera" size={14} color={colors.textOnGold} />
                </View>
              )}
            </View>
          </Pressable>
          <View style={styles.avatarMeta}>
            <Text style={[styles.avatarHint, { color: colors.cream }]}>
              {t('profile.editProfileScreen.photoHint')}
            </Text>
            <Text style={[styles.avatarSub, { color: colors.textMuted }]}>
              {uploadingPhoto
                ? t('profile.editProfileScreen.uploadingPhoto')
                : t('profile.editProfileScreen.photoSub')}
            </Text>
            {profilePicture || localPreviewUri ? (
              <Pressable
                onPress={removeProfilePhoto}
                disabled={saving || uploadingPhoto}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, marginTop: 6 })}
              >
                <Text style={[styles.removePhoto, { color: colors.danger.fg }]}>
                  {t('profile.editProfileScreen.removePhoto')}
                </Text>
              </Pressable>
            ) : null}
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
  avatarWrap: {
    position: 'relative',
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFill,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
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
  removePhoto: {
    fontSize: 12,
    fontWeight: '600',
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
