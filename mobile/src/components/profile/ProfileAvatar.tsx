import { Image, StyleSheet, Text, View, type ImageStyle, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/lib/appStore';
import { resolveMediaUrl } from '@/lib/media-utils';

interface ProfileAvatarProps {
  profilePicture?: string | null;
  initials: string;
  size?: number;
  style?: ViewStyle;
}

export function ProfileAvatar({
  profilePicture,
  initials,
  size = 64,
  style,
}: ProfileAvatarProps) {
  const { colors } = useTheme();
  const imageUri = profilePicture ? resolveMediaUrl(profilePicture) : null;
  const avatarStyle: ImageStyle[] = [
    styles.avatar as ImageStyle,
    { width: size, height: size, borderRadius: size / 2 },
    ...(style ? [style as ImageStyle] : []),
  ];

  if (imageUri) {
    return (
      <Image
        source={{ uri: imageUri }}
        style={avatarStyle}
        accessibilityIgnoresInvertColors
      />
    );
  }

  return (
    <LinearGradient
      colors={[colors.gold, colors.goldDeep]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={avatarStyle}
    >
      <Text style={[styles.initials, { color: colors.textOnGold, fontSize: size * 0.34 }]}>
        {initials}
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    fontWeight: '900',
    letterSpacing: 1,
  },
});

export default ProfileAvatar;
