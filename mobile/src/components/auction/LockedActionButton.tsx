import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { GoldButton } from '@/components/auth';
import { useTheme } from '@/lib/appStore';
import { Typography } from '@/theme';

interface LockedActionButtonProps {
  label: string;
  locked: boolean;
  lockedHint?: string;
  onPress: () => void;
  variant?: 'primary' | 'outline';
  disabled?: boolean;
}

/**
 * Primary/outline CTA that shows a lock icon and hint when gated.
 */
export function LockedActionButton({
  label,
  locked,
  lockedHint,
  onPress,
  variant = 'primary',
  disabled = false,
}: LockedActionButtonProps) {
  const { colors } = useTheme();
  const isDisabled = locked || disabled;

  return (
    <View style={styles.host}>
      <GoldButton
        label={label}
        onPress={onPress}
        variant={variant}
        disabled={isDisabled}
        compact
      />
      {locked && lockedHint ? (
        <View style={styles.hintRow}>
          <MaterialCommunityIcons name="lock-outline" size={13} color={colors.textMuted} />
          <Text style={[Typography.caption, { color: colors.textMuted, flex: 1 }]}>{lockedHint}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    gap: 6,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 2,
  },
});

export default LockedActionButton;
