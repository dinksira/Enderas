import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AuthShell, GoldButton } from '@/components/auth';
import { useTheme } from '@/lib/appStore';

import { useAuthStyles } from '@/components/auth/authStyles';

export default function ResetSuccessScreen() {
  const authStyles = useAuthStyles();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const iconScale = useSharedValue(0.6);
  const iconOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const contentProgress = useSharedValue(0); // 0 → 1, drives translateY

  useEffect(() => {
    // Choreography: icon pops in (fade + spring), then content slides up.
    // Reanimated v3 runs both phases on the UI thread via `withSequence` /
    // `withDelay`, so the entrance stays smooth even if JS is busy mounting
    // the next route underneath.
    iconOpacity.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) });
    iconScale.value = withSpring(1, { damping: 6, stiffness: 80 });
    contentOpacity.value = withDelay(
      280,
      withTiming(1, { duration: 240, easing: Easing.out(Easing.cubic) }),
    );
    contentProgress.value = withDelay(
      280,
      withTiming(1, { duration: 240, easing: Easing.out(Easing.cubic) }),
    );
  }, [contentOpacity, contentProgress, iconOpacity, iconScale]);

  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: 12 * (1 - contentProgress.value) }],
  }));

  return (
    <AuthShell keyboardAware={false}>
      <View style={authStyles.titleAccent}>
        <View style={authStyles.titleAccentLine} />
        <View style={authStyles.titleAccentDiamond} />
        <View style={authStyles.titleAccentLine} />
      </View>

      <Animated.View
        style={[{ alignItems: 'center', marginBottom: 20 }, iconStyle]}
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
        style={[{ width: '100%', alignItems: 'center' }, contentStyle]}
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
