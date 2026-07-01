import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/lib/appStore';
import { Typography, Spacing, Radii } from '@/theme';
import { toneToStatus, type UiTone } from '@/theme/statusTones';
import { PressableScale } from '@/components/ui';

interface AuctionCardProps {
  title: string;
  category: string;
  currentBid: string;
  bidsCount: number;
  timeLeft: string;
  /** Status pill — label + tone resolved by the caller. */
  status?: { label: string; tone: UiTone };
  /** Show "Your Bid" row instead of "Current Bid". */
  yourBid?: string;
  /** Cover gradient (kept deterministic — no remote images on this card). */
  coverColors: [string, string];
  /** MaterialCommunityIcons name for the category badge. */
  categoryIcon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  onPress?: () => void;
}

/**
 * Auction card — the primary content unit in dashboard / bids / assets.
 *
 * Cover is a 2-stop linear gradient (not a remote image) so the app
 * renders identically offline and there are no broken-image states.
 * Status pill colors come from the semantic `toneToStatus` helper so
 * contrast is automatic in light/dark mode.
 *
 * Wrapped in `memo` — props are primitives + a stable onPress callback.
 */
function AuctionCardImpl({
  title,
  category,
  currentBid,
  bidsCount,
  timeLeft,
  status,
  yourBid,
  coverColors,
  categoryIcon,
  onPress,
}: AuctionCardProps) {
  const { colors } = useTheme();
  const statusColors = status ? toneToStatus(status.tone, colors) : null;

  return (
    <PressableScale onPress={onPress} scaleTo={0.98}>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.glassFill, borderColor: colors.goldBorder },
        ]}
      >
        {/* Cover */}
        <View style={styles.cover}>
          <LinearGradient
            colors={coverColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Dark scrim so white text reads on top of any gradient. */}
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.45)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.coverTop}>
            <View style={styles.categoryChip}>
              <MaterialCommunityIcons name={categoryIcon} size={12} color={colors.cream} />
              <Text style={[Typography.microCaps, { color: colors.cream }]}>
                {category}
              </Text>
            </View>
            {status && statusColors ? (
              <View
                style={[
                  styles.statusChip,
                  {
                    backgroundColor: statusColors.soft,
                    borderColor: statusColors.border,
                  },
                ]}
              >
                <View style={[styles.statusDot, { backgroundColor: statusColors.fg }]} />
                <Text style={[Typography.microCaps, { color: statusColors.fg }]}>
                  {status.label}
                </Text>
              </View>
            ) : null}
          </View>
          <View style={styles.coverBottom}>
            <Text
              style={[Typography.cardTitle, styles.title, { color: colors.cream }]}
              numberOfLines={2}
            >
              {title}
            </Text>
          </View>
        </View>

        {/* Body */}
        <View style={styles.body}>
          <View style={styles.bidRow}>
            <View style={styles.bidCol}>
              <Text style={[Typography.microCaps, { color: colors.textMuted }]}>
                {yourBid ? 'YOUR BID' : 'CURRENT BID'}
              </Text>
              <Text style={[Typography.bodyMedium, { color: colors.goldBright, fontWeight: '800' }]}>
                {yourBid ?? currentBid}
              </Text>
            </View>
            <View style={[styles.bidCol, { alignItems: 'flex-end' }]}>
              <Text style={[Typography.microCaps, { color: colors.textMuted }]}>TIME LEFT</Text>
              <Text style={[Typography.bodyMedium, { color: colors.cream, fontWeight: '800' }]}>
                {timeLeft}
              </Text>
            </View>
          </View>
          <View style={[styles.footer, { borderTopColor: colors.divider }]}>
            <View style={styles.bidsChip}>
              <MaterialCommunityIcons name="gavel" size={12} color={colors.goldChampagne} />
              <Text style={[Typography.caption, { color: colors.textSecondary }]}>
                {bidsCount} bids
              </Text>
            </View>
            {yourBid ? (
              <View style={styles.bidsChip}>
                <MaterialCommunityIcons name="crown" size={12} color={colors.goldBright} />
                <Text style={[Typography.caption, { color: colors.goldBright, fontWeight: '700' }]}>
                  Current: {currentBid}
                </Text>
              </View>
            ) : (
              <View style={styles.bidsChip}>
                <MaterialCommunityIcons name="eye-outline" size={12} color={colors.textMuted} />
                <Text style={[Typography.caption, { color: colors.textMuted }]}>View Details</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radii.xl,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  cover: {
    height: 130,
    position: 'relative',
  },
  coverTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.xs2,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xxs,
    borderRadius: Radii.input,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderColor: 'rgba(255,250,240,0.3)',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xxs,
    borderRadius: Radii.input,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  coverBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.sm,
  },
  title: {
    fontSize: 15,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  body: {
    padding: Spacing.sm,
  },
  bidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs2,
  },
  bidCol: {
    gap: Spacing.xxs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: Spacing.xs2,
  },
  bidsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
  },
});

export const AuctionCard = memo(AuctionCardImpl);
export default AuctionCard;
