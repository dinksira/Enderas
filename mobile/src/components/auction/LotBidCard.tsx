import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { GlassCard } from '@/components/shell/GlassCard';
import { PressableScale } from '@/components/ui';
import { formatEtbAmount, getCategoryTheme } from '@/lib/auctionUtils';
import { useTheme } from '@/lib/appStore';
import { Typography, Spacing, Radii } from '@/theme';
import type { AuctionLot } from '@/types/auctionParticipation';

interface LotBidCardProps {
  lot: AuctionLot;
  selected: boolean;
  bidAmount: number;
  locked: boolean;
  errorKey?: string | null;
  onToggle: () => void;
  onBidChange: (amount: number) => void;
}

export function LotBidCard({
  lot,
  selected,
  bidAmount,
  locked,
  errorKey,
  onToggle,
  onBidChange,
}: LotBidCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const theme = getCategoryTheme(lot.category);
  const thumbnailUri = lot.imageUrls[0];
  const categoryLabel = t(`dashboard.categories.${lot.category}`, { defaultValue: lot.category });

  const handleBidTextChange = (text: string) => {
    const digits = text.replace(/[^\d]/g, '');
    onBidChange(digits ? Number(digits) : 0);
  };

  return (
    <GlassCard
      padding={14}
      active={selected}
      style={styles.card}
      noAnimation
    >
      <PressableScale onPress={locked ? undefined : onToggle} disabled={locked} style={styles.topRow}>
        <View style={styles.thumb}>
          {thumbnailUri ? (
            <Image source={{ uri: thumbnailUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <LinearGradient colors={theme.colors} style={StyleSheet.absoluteFill} />
          )}
          {!thumbnailUri ? (
            <MaterialCommunityIcons name={theme.icon} size={22} color="rgba(255,250,240,0.45)" />
          ) : null}
        </View>

        <View style={styles.copy}>
          <Text style={[Typography.microCaps, { color: colors.goldChampagne }]}>{lot.lotLabel}</Text>
          <Text style={[Typography.cardTitle, { color: colors.cream }]} numberOfLines={2}>
            {lot.title}
          </Text>
          <Text style={[Typography.caption, { color: colors.textMuted }]} numberOfLines={2}>
            {lot.description}
          </Text>
          <Text style={[Typography.caption, { color: colors.textSecondary, marginTop: 4 }]}>
            {categoryLabel} · {t('auction.participation.reserve')}: {formatEtbAmount(lot.reservePrice)}
          </Text>
        </View>

        <View
          style={[
            styles.checkbox,
            {
              borderColor: selected ? colors.goldBright : colors.goldBorder,
              backgroundColor: selected ? colors.goldBright : 'transparent',
            },
          ]}
        >
          {selected ? (
            <MaterialCommunityIcons name="check" size={14} color={colors.textOnGold} />
          ) : null}
        </View>
      </PressableScale>

      {selected ? (
        <View style={styles.bidSection}>
          <Text style={[Typography.microCaps, { color: colors.goldChampagne }]}>
            {t('auction.participation.yourBid')}
          </Text>
          <View
            style={[
              styles.inputWrap,
              {
                borderColor: errorKey ? colors.danger.border : colors.goldBorder,
                backgroundColor: colors.glassFill,
              },
            ]}
          >
            <Text style={[Typography.bodyMedium, { color: colors.textMuted }]}>ETB</Text>
            <TextInput
              value={bidAmount > 0 ? String(bidAmount) : ''}
              onChangeText={handleBidTextChange}
              keyboardType="number-pad"
              editable={!locked}
              placeholder={String(lot.reservePrice)}
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { color: colors.cream }]}
            />
          </View>
          {errorKey ? (
            <Text style={[Typography.caption, { color: colors.danger.fg }]}>
              {t(`auction.participation.bidErrors.${errorKey}`, {
                reserve: formatEtbAmount(lot.reservePrice),
              })}
            </Text>
          ) : null}
        </View>
      ) : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: Radii.input,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  bidSection: {
    marginTop: 12,
    gap: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: Radii.input,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    padding: 0,
  },
});

export default LotBidCard;
