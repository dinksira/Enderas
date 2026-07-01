import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Animated,
  Easing,
  Modal,
  TouchableWithoutFeedback,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/lib/appStore';
import { glassElevation } from '@/lib/glassStyles';
import { useNotifications } from '@/hooks/useNotifications';
import type { AppNotification } from '@/types/notification';

/**
 * Notification bell for the header. Shows an unread badge; tapping opens
 * a styled dropdown panel listing notifications with the same golden
 * glassmorphism treatment as the rest of the app.
 *
 * The dropdown is rendered in a Modal so it can overlay the rest of the
 * screen and dismiss on outside tap — same UX pattern as the language
 * selector, but full-width so the notification body is readable.
 */
export function NotificationBell() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
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
  const panelAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
      refresh();
      Animated.timing(panelAnim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      panelAnim.setValue(0);
    }
  }, [open, panelAnim, refresh]);

  const panelOpacity = panelAnim;
  const panelY = panelAnim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] });

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
          <Text style={[styles.notifTitle, { color: colors.cream }]} numberOfLines={1}>
            {item.title}
          </Text>
          {!item.read ? (
            <View style={[styles.unreadDot, { backgroundColor: colors.goldBright }]} />
          ) : null}
        </View>
        <Text style={[styles.notifText, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={[styles.notifTime, { color: colors.textMuted }]}>{item.timestamp}</Text>
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

      <Modal visible={open} transparent animationType="none" onRequestClose={() => setOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setOpen(false)}>
          <View style={[styles.modalOverlay, { paddingTop: insets.top + 60 }]}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.panel,
                  {
                    backgroundColor: colors.baseElevated,
                    borderColor: colors.goldBorder,
                    ...glassElevation(isDark, 'floating'),
                    opacity: panelOpacity,
                    transform: [{ translateY: panelY }],
                  },
                ]}
              >
                <View style={[styles.panelHeader, { borderBottomColor: colors.divider }]}>
                  <Text style={[styles.panelTitle, { color: colors.goldBright }]}>
                    {t('header.notifications').toUpperCase()}
                  </Text>
                  {unreadCount > 0 ? (
                    <Pressable onPress={markAllNotificationsRead} hitSlop={8}>
                      <Text style={[styles.panelAction, { color: colors.goldChampagne }]}>
                        {t('header.markAllRead')}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>

                {loading ? (
                  <View style={styles.empty}>
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                      {t('common.loading')}
                    </Text>
                  </View>
                ) : error ? (
                  <View style={styles.empty}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={32} color={colors.danger.fg} />
                    <Text style={[styles.emptyText, { color: colors.danger.fg }]}>{error}</Text>
                  </View>
                ) : notifications.length === 0 ? (
                  <View style={styles.empty}>
                    <MaterialCommunityIcons name="bell-off-outline" size={36} color={colors.textMuted} />
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>
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
                    contentContainerStyle={{ paddingVertical: 4 }}
                    showsVerticalScrollIndicator={false}
                  />
                )}
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingRight: 16,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  panel: {
    width: 340,
    maxWidth: '92%',
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    maxHeight: 460,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  panelTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
  panelAction: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  notifRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
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
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  notifText: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 4,
  },
  notifTime: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  separator: {
    height: 1,
    marginHorizontal: 14,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
  },
});

export default NotificationBell;
