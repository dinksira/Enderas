import { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { FormField, GoldButton } from '@/components/auth';
import { GlassCard } from '@/components/shell/GlassCard';
import { ScreenShell } from '@/components/shell/ScreenShell';
import { useTheme } from '@/lib/appStore';

const MOCK_PROFILE = {
  fullName: 'Abebe Kebede',
  email: 'abebe.kebede@example.com',
  mobile: '+251 91 234 5678',
  city: 'Addis Ababa',
  bio: 'Passionate collector of vintage watches and fine art.',
};

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [fullName, setFullName] = useState(MOCK_PROFILE.fullName);
  const [email, setEmail] = useState(MOCK_PROFILE.email);
  const [mobile, setMobile] = useState(MOCK_PROFILE.mobile);
  const [city, setCity] = useState(MOCK_PROFILE.city);
  const [bio, setBio] = useState(MOCK_PROFILE.bio);
  const [saved, setSaved] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const mobileRef = useRef<TextInput>(null);
  const cityRef = useRef<TextInput>(null);
  const bioRef = useRef<TextInput>(null);

  const initials = fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => router.back(), 600);
  };

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
          <View style={[styles.cameraBtn, { backgroundColor: colors.glassFillActive, borderColor: colors.goldBorder }]}>
            <MaterialCommunityIcons name="camera-outline" size={18} color={colors.goldBright} />
          </View>
        </View>
      </GlassCard>

      <View style={styles.form}>
        <GlassCard padding={16}>
          <Text style={[styles.sectionLabel, { color: colors.goldChampagne }]}>
            {t('profile.editProfileScreen.personalInfo').toUpperCase()}
          </Text>

          <FormField
            label={t('profile.editProfileScreen.fullName')}
            value={fullName}
            onChangeText={setFullName}
            placeholder={t('profile.editProfileScreen.fullNamePlaceholder')}
            autoCapitalize="words"
            textContentType="name"
            autoComplete="name"
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
          />
          <FormField
            ref={emailRef}
            label={t('profile.editProfileScreen.email')}
            value={email}
            onChangeText={setEmail}
            placeholder={t('profile.editProfileScreen.emailPlaceholder')}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            returnKeyType="next"
            onSubmitEditing={() => mobileRef.current?.focus()}
          />
          <FormField
            ref={mobileRef}
            label={t('profile.editProfileScreen.mobile')}
            value={mobile}
            onChangeText={setMobile}
            placeholder={t('profile.editProfileScreen.mobilePlaceholder')}
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            autoComplete="tel"
            returnKeyType="next"
            onSubmitEditing={() => cityRef.current?.focus()}
          />
          <FormField
            ref={cityRef}
            label={t('profile.editProfileScreen.city')}
            value={city}
            onChangeText={setCity}
            placeholder={t('profile.editProfileScreen.cityPlaceholder')}
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => bioRef.current?.focus()}
          />
          <FormField
            ref={bioRef}
            label={t('profile.editProfileScreen.bio')}
            value={bio}
            onChangeText={setBio}
            placeholder={t('profile.editProfileScreen.bioPlaceholder')}
            autoCapitalize="sentences"
            returnKeyType="done"
          />
        </GlassCard>
      </View>

      {saved ? (
        <View style={[styles.savedBanner, { backgroundColor: colors.glassFillActive, borderColor: colors.goldBorder }]}>
          <MaterialCommunityIcons name="check-circle" size={16} color={colors.goldBright} />
          <Text style={[styles.savedText, { color: colors.goldBright }]}>
            {t('profile.editProfileScreen.saved')}
          </Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <GoldButton label={t('profile.editProfileScreen.save')} onPress={handleSave} />
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
  cameraBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
});
