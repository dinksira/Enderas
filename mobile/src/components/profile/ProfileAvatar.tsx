import { StyleSheet, Text, type ImageStyle, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
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
    // expo-image provides memory+disk caching, placeholder, and a fast
    // native decode path — noticeably smoother than the core Image on
    // the profile screen and avoids the flash on re-mount that the
    // core Image suffers whenever the parent re-renders.
    return (
      <Image
        source={{ uri: imageUri }}
        style={avatarStyle}
        contentFit="cover"
        cachePolicy="memory-disk"
        recyclingKey={imageUri}
        transition={180}
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
