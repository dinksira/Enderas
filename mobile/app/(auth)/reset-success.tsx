import { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AuthShell, GoldButton } from '@/components/auth';
import { useTheme } from '@/lib/appStore';

import { useAuthStyles } from '@/components/auth/authStyles';

export default function ResetSuccessScreen() {
  const authStyles = useAuthStyles();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const iconScale = useRef(new Animated.Value(0.6)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslate = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(iconOpacity, {
          toValue: 1,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(iconScale, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(contentTranslate, {
          toValue: 0,
          duration: 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [contentOpacity, contentTranslate, iconOpacity, iconScale]);

  return (
    <AuthShell keyboardAware={false}>
      <View style={authStyles.titleAccent}>
        <View style={authStyles.titleAccentLine} />
        <View style={authStyles.titleAccentDiamond} />
        <View style={authStyles.titleAccentLine} />
      </View>

      <Animated.View
        style={{
          alignItems: 'center',
          marginBottom: 20,
          opacity: iconOpacity,
          transform: [{ scale: iconScale }],
        }}
      >
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.success.soft,
            borderWidth: 1,
            borderColor: colors.success.border,
          }}
        >
          <MaterialCommunityIcons name="check-circle-outline" size={44} color={colors.success.fg} />
        </View>
      </Animated.View>

      <Animated.View
        style={{
          width: '100%',
          alignItems: 'center',
          opacity: contentOpacity,
          transform: [{ translateY: contentTranslate }],
        }}
      >
        <Text style={authStyles.subtitle}>{t('auth.resetSuccessSubtitle')}</Text>
        <Text style={authStyles.title}>{t('auth.resetSuccessTitle')}</Text>
        <Text style={authStyles.bodyText}>{t('auth.resetSuccessBody')}</Text>

        <GoldButton
          label={t('auth.backToLogin')}
          onPress={() => router.replace('/(auth)/login')}
        />
      </Animated.View>
    </AuthShell>
  );
}
