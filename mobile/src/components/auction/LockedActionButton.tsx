import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { GoldButton } from '@/components/auth';
import { useTheme } from '@/lib/appStore';
import { Radii, Spacing, Typography } from '@/theme';

interface LockedActionButtonProps {
  label: string;
  locked: boolean;
  lockedHint?: string;
  onPress: () => void;
  variant?: 'primary' | 'outline';
  disabled?: boolean;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  helperText?: string;
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
  icon = 'arrow-top-right',
  helperText,
}: LockedActionButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled;
  const isPrimary = variant === 'primary';
  const iconColor = isPrimary ? colors.textOnGold : colors.goldBright;
  const helperColor = isPrimary ? colors.goldChampagne : colors.textMuted;
  const iconBadgeBackground = isPrimary
    ? isDisabled
      ? colors.goldBorder
      : colors.goldBright
    : colors.glassFillActive;
  const iconBadgeBorder = isPrimary ? colors.goldBorderActive : colors.goldBorder;

  return (
    <View style={styles.host}>
      <View
        style={[
          styles.buttonWrap,
          {
            backgroundColor: isPrimary ? colors.glassFillActive : colors.glassFill,
            borderColor: isPrimary ? colors.goldBorderActive : colors.goldBorder,
          },
        ]}
      >
        <View style={styles.buttonHeader}>
          <View style={styles.labelWrap}>
            <Text style={[Typography.microCaps, { color: helperColor }]}>
              {helperText ?? (variant === 'primary' ? 'Primary action' : 'Quick action')}
            </Text>
            <Text style={[Typography.bodyMedium, styles.previewLabel, { color: colors.cream }]}>
              {label}
            </Text>
          </View>
          <View
            style={[
              styles.iconBadge,
              {
                backgroundColor: iconBadgeBackground,
                borderColor: iconBadgeBorder,
                opacity: isDisabled ? 0.55 : 1,
              },
            ]}
          >
            <MaterialCommunityIcons name={icon} size={16} color={iconColor} />
          </View>
        </View>
        <View style={styles.buttonSlot}>
          <GoldButton
            label={label}
            onPress={onPress}
            variant={variant}
            disabled={isDisabled}
            compact
          />
        </View>
      </View>
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
    gap: Spacing.xs2,
  },
  buttonWrap: {
    gap: Spacing.xs2,
    borderWidth: 1,
    borderRadius: Radii.xl,
    padding: Spacing.sm,
  },
  buttonSlot: {
    paddingTop: 2,
  },
  buttonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  labelWrap: {
    flex: 1,
    gap: 2,
  },
  previewLabel: {
    fontWeight: '800',
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xxs2,
    paddingHorizontal: 2,
  },
});

export default LockedActionButton;
