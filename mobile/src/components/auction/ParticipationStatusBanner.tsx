import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '@/lib/appStore';
import { Typography, Radii } from '@/theme';
import { toneToStatus, type UiTone } from '@/theme/statusTones';

interface ParticipationStatusBannerProps {
  tone: UiTone;
  title: string;
  message: string;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}

export function ParticipationStatusBanner({
  tone,
  title,
  message,
  icon = 'information-outline',
}: ParticipationStatusBannerProps) {
  const { colors } = useTheme();
  const status = toneToStatus(tone, colors);

  return (
    <View
      style={[
        styles.host,
        {
          backgroundColor: status.soft,
          borderColor: status.border,
        },
      ]}
    >
      <MaterialCommunityIcons name={icon} size={18} color={status.fg} />
      <View style={styles.copy}>
        <Text style={[Typography.microCaps, { color: status.fg }]}>{title}</Text>
        <Text style={[Typography.caption, { color: colors.textSecondary }]}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: Radii.input,
    borderWidth: 1,
    marginBottom: 14,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
});

export default ParticipationStatusBanner;
