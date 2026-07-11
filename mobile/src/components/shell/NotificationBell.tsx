import { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  FlatList,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/lib/appStore';
import { SheetDropdown } from '@/components/sheet';
import { useNotifications } from '@/hooks/useNotifications';
import { Spacing, Typography } from '@/theme';
import type { AppNotification } from '@/types/notification';

/**
 * Notification bell for the header. Shows an unread badge; tapping
 * opens a styled dropdown panel listing notifications.
 *
 * The dropdown is rendered via the shared `<SheetDropdown>` primitive —
 * same backdrop, motion language, and dismiss behavior as every other
 * overlay in the app. (Previously a hand-rolled RN `Modal` with its
 * own `Animated` translateY choreography.)
 */
export function NotificationBell() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    refresh,
    markNotificationRead,
    markAllNotificationsRead,
  } = useNotifications();

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  const iconForKind = (kind: AppNotification['kind']) => {
    switch (kind) {
      case 'bid': return 'gavel';
      case 'auction': return 'timer-sand';
      case 'asset': return 'diamond';
      case 'system': return 'cog';
      default: return 'bell';
    }
  };

  const renderItem = ({ item }: { item: AppNotification }) => (
    <Pressable
      onPress={() => markNotificationRead(item.id)}
      style={({ pressed }) => [
        styles.notifRow,
        {
          backgroundColor: item.read ? 'transparent' : colors.glassFillActive,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View style={[styles.notifIcon, { backgroundColor: colors.glassFill, borderColor: colors.goldBorder }]}>
        <MaterialCommunityIcons name={iconForKind(item.kind)} size={18} color={colors.goldBright} />
      </View>
      <View style={styles.notifBody}>
        <View style={styles.notifHeader}>
          <Text style={[Typography.bodyMedium, { color: colors.cream, fontWeight: '700' }]} numberOfLines={1}>
            {item.title}
          </Text>
          {!item.read ? (
            <View style={[styles.unreadDot, { backgroundColor: colors.goldBright }]} />
          ) : null}
        </View>
        <Text style={[Typography.caption, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={[Typography.microCaps, { color: colors.textMuted, fontSize: 10, letterSpacing: 0.3 }]}>
          {item.timestamp}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <View>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.trigger,
          {
            backgroundColor: colors.glassFill,
            borderColor: colors.goldBorder,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t('header.notifications')}
      >
        <MaterialCommunityIcons name="bell-outline" size={18} color={colors.goldBright} />
        {unreadCount > 0 ? (
          <View style={[styles.badge, { backgroundColor: colors.goldBright }]}>
            <Text style={[styles.badgeText, { color: colors.textOnGold }]}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </Text>
          </View>
        ) : null}
      </Pressable>

      <SheetDropdown visible={open} onDismiss={() => setOpen(false)} maxWidth={340}>
        <View style={[styles.panelHeader, { borderBottomColor: colors.divider }]}>
          <Text style={[Typography.eyebrow, { color: colors.goldBright }]}>
            {t('header.notifications')}
          </Text>
          {unreadCount > 0 ? (
            <Pressable onPress={markAllNotificationsRead} hitSlop={8}>
              <Text style={[Typography.caption, { color: colors.goldChampagne, fontWeight: '700' }]}>
                {t('header.markAllRead')}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {loading ? (
          <View style={styles.empty}>
            <Text style={[Typography.body, { color: colors.textMuted }]}>
              {t('common.loading')}
            </Text>
          </View>
        ) : error ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="alert-circle-outline" size={32} color={colors.danger.fg} />
            <Text style={[Typography.body, styles.centerText, { color: colors.danger.fg }]}>{error}</Text>
            <Pressable
              onPress={refresh}
              style={({ pressed }) => [
                styles.retryButton,
                {
                  borderColor: colors.goldBorder,
                  backgroundColor: colors.glassFill,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('common.retry')}
            >
              <Text style={[Typography.caption, { color: colors.goldChampagne, fontWeight: '800' }]}>
                {t('common.retry')}
              </Text>
            </Pressable>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="bell-off-outline" size={36} color={colors.textMuted} />
            <Text style={[Typography.body, { color: colors.textMuted }]}>
              {t('header.noNotifications')}
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ItemSeparatorComponent={() => (
              <View style={[styles.separator, { backgroundColor: colors.divider }]} />
            )}
            contentContainerStyle={{ paddingVertical: Spacing.xxs }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SheetDropdown>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm2,
    borderBottomWidth: 1,
  },
  notifRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.sm2,
    paddingVertical: Spacing.sm2,
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  notifIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBody: {
    flex: 1,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: Spacing.xs,
  },
  separator: {
    height: 1,
    marginHorizontal: Spacing.sm2,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  centerText: {
    textAlign: 'center',
  },
  retryButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
});

export default NotificationBell;
