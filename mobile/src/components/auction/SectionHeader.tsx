import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/lib/appStore';

interface SectionHeaderProps {
  title: string;
  /** Optional "View All" link. */
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Section header used inside scrollable tab screens. Keeps title + action
 * vertically aligned with the same typographic scale across the app.
 */
export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.title, { color: colors.cream }]} numberOfLines={1}>
        {title}
      </Text>
      {actionLabel ? (
        <Pressable onPress={onAction} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
          <Text style={[styles.action, { color: colors.goldBright }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  action: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default SectionHeader;
