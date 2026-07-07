import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { GoldButton } from '@/components/auth';
import { ScreenShell } from '@/components/shell/ScreenShell';
import { GlassCard } from '@/components/shell/GlassCard';
import { useAuctionParticipation } from '@/hooks/useAuctionParticipation';
import { useSubmitBidWithCpo } from '@/hooks/useSubmitBidWithCpo';
import { fileUploadApi } from '@/services/fileUploadApi';
import { formatEtbAmount } from '@/lib/auctionUtils';
import { useTheme } from '@/lib/appStore';
import { Typography, Spacing, Radii } from '@/theme';

const wizardSchema = z.object({
  transactionReference: z.string().trim().optional(),
});

type WizardForm = z.infer<typeof wizardSchema>;

type Receipt = {
  uri: string;
  name: string;
  mimeType: string;
};

function parseAmount(value: string): number {
  const normalized = value.replace(/[^\d.]/g, '');
  return normalized ? Number(normalized) : 0;
}

export default function MobileCpoWizardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const auctionId = id ?? '';
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { auction, lots, loading, error, refresh } = useAuctionParticipation(auctionId);
  const submitBidWithCpo = useSubmitBidWithCpo();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [uploading, setUploading] = useState(false);

  const { control, handleSubmit } = useForm<WizardForm>({
    resolver: zodResolver(wizardSchema),
    defaultValues: { transactionReference: '' },
  });

  const selectedBids = useMemo(
    () => Object.entries(amounts)
      .map(([auctionAssetId, raw]) => ({ auctionAssetId, amount: parseAmount(raw) }))
      .filter((bid) => bid.amount > 0),
    [amounts],
  );

  const hasInvalidBid = lots.some((lot) => {
    const raw = amounts[lot.id];
    if (!raw) return false;
    return parseAmount(raw) < Number(lot.reservePrice);
  });

  const canContinue = selectedBids.length > 0 && !hasInvalidBid;

  const totalDeposit = selectedBids.reduce((sum, bid) => {
    const lot = lots.find((item) => item.id === bid.auctionAssetId);
    const reserve = Number(lot?.reservePrice ?? 0);
    const pct = Number(auction?.cpoPercentage ?? 0);
    return reserve > 0 && pct > 0 ? sum + (reserve * pct) / 100 : sum;
  }, 0);

  const pickReceipt = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('auction.participation.uploadErrorTitle'), t('auction.participation.uploadErrorBody'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setReceipt({
      uri: asset.uri,
      name: asset.fileName ?? `cpo-receipt-${Date.now()}.jpg`,
      mimeType: asset.mimeType ?? 'image/jpeg',
    });
  };

  const submit = async (values: WizardForm) => {
    if (!auction || !receipt || uploading || submitBidWithCpo.isPending) return;
    setUploading(true);
    try {
      const uploaded = await fileUploadApi.uploadFile(receipt, 'cpo/documents');
      await submitBidWithCpo.mutateAsync({
        auctionId: auction.id,
        bids: selectedBids,
        cpoDocumentUrl: uploaded.fileUrl,
        transactionReference: values.transactionReference,
      });
      await refresh();
      setStep(3);
    } catch (err) {
      Alert.alert(
        t('auction.participation.uploadErrorTitle'),
        err instanceof Error ? err.message : t('auction.participation.uploadErrorBody'),
      );
    } finally {
      setUploading(false);
    }
  };

  if (loading && !auction) {
    return (
      <ScreenShell title={t('auction.participation.uploadCpo')} showBack onBack={() => router.back()} bottomPadding={40}>
        <ActivityIndicator color={colors.goldBright} />
      </ScreenShell>
    );
  }

  if (!auction || error) {
    return (
      <ScreenShell title={t('auction.participation.uploadCpo')} showBack onBack={() => router.back()} bottomPadding={40}>
        <GlassCard padding={Spacing.lg}>
          <Text style={[Typography.body, { color: colors.danger.fg }]}>
            {error ?? t('dashboard.browse.detailError')}
          </Text>
        </GlassCard>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      title={t('auction.participation.uploadCpo')}
      pageTitle={auction.title}
      showBack
      onBack={() => router.back()}
      bottomPadding={120}
      keyboardAware
    >
      {step === 1 ? (
        <>
          <GlassCard padding={16} style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.goldChampagne }]}>
              {t('auction.participation.placeBids')}
            </Text>
            <Text style={[Typography.caption, { color: colors.textMuted, marginBottom: 12 }]}>
              {t('auction.participation.selectLotsHint')}
            </Text>
            {lots.map((lot) => {
              const amount = amounts[lot.id] ?? '';
              const reserve = Number(lot.reservePrice);
              const invalid = amount.length > 0 && parseAmount(amount) < reserve;
              return (
                <View key={lot.id} style={[styles.lotRow, { borderColor: invalid ? colors.danger.fg : colors.goldBorder }]}>
                  <View style={styles.lotCopy}>
                    <Text style={[Typography.bodyMedium, { color: colors.cream }]}>
                      {lot.assetTitle ?? lot.lotLabel}
                    </Text>
                    <Text style={[Typography.caption, { color: colors.textMuted }]}>
                      {t('auction.participation.reservePrice', { defaultValue: 'Reserve' })}: {formatEtbAmount(reserve)}
                    </Text>
                  </View>
                  <TextInput
                    value={amount}
                    onChangeText={(text) => setAmounts((current) => ({ ...current, [lot.id]: text }))}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    style={[styles.amountInput, { color: colors.cream, borderColor: invalid ? colors.danger.fg : colors.goldBorder }]}
                  />
                </View>
              );
            })}
          </GlassCard>
          <GoldButton label={t('common.next')} onPress={() => setStep(2)} disabled={!canContinue} />
        </>
      ) : null}

      {step === 2 ? (
        <>
          <GlassCard padding={16} style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.goldChampagne }]}>
              {t('auction.participation.uploadCpoTitle')}
            </Text>
            <Text style={[Typography.bodyMedium, { color: colors.goldBright, marginBottom: 14 }]}>
              {t('auction.participation.uploadCpoBody', { amount: formatEtbAmount(totalDeposit) })}
            </Text>

            <Pressable
              onPress={pickReceipt}
              style={[styles.receiptBox, { borderColor: colors.goldBorder, backgroundColor: colors.glassFill }]}
            >
              <MaterialCommunityIcons
                name={receipt ? 'file-check-outline' : 'image-plus'}
                size={24}
                color={receipt ? colors.success.fg : colors.goldBright}
              />
              <Text style={[Typography.bodySmall, { color: colors.cream }]}>
                {receipt?.name ?? t('auction.participation.uploadReceipt')}
              </Text>
            </Pressable>

            <Controller
              control={control}
              name="transactionReference"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder={t('auction.participation.transactionReference', { defaultValue: 'Transaction reference' })}
                  placeholderTextColor={colors.textMuted}
                  style={[styles.transactionInput, { color: colors.cream, borderColor: colors.goldBorder }]}
                />
              )}
            />
          </GlassCard>

          <View style={styles.actions}>
            <View style={styles.action}>
              <GoldButton label={t('common.back')} variant="outline" onPress={() => setStep(1)} disabled={uploading} />
            </View>
            <View style={styles.action}>
              <GoldButton
                label={uploading || submitBidWithCpo.isPending ? t('common.submitting') : t('auction.participation.submitCpo')}
                onPress={handleSubmit(submit)}
                disabled={!receipt || uploading || submitBidWithCpo.isPending}
              />
            </View>
          </View>
        </>
      ) : null}

      {step === 3 ? (
        <GlassCard padding={Spacing.lg} style={styles.successCard}>
          <MaterialCommunityIcons name="check-decagram-outline" size={42} color={colors.success.fg} />
          <Text style={[Typography.cardTitle, { color: colors.cream, textAlign: 'center' }]}>
            {t('auction.participation.cpoPendingTitle')}
          </Text>
          <Text style={[Typography.body, { color: colors.textSecondary, textAlign: 'center' }]}>
            {t('auction.participation.cpoPendingBodyDetailed')}
          </Text>
          <GoldButton label={t('common.done', { defaultValue: 'Done' })} onPress={() => router.replace(`/auction/${auction.id}` as any)} />
        </GlassCard>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  lotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: Radii.input,
    padding: 12,
    marginBottom: 10,
  },
  lotCopy: {
    flex: 1,
    gap: 4,
  },
  amountInput: {
    minWidth: 104,
    borderWidth: 1,
    borderRadius: Radii.input,
    paddingHorizontal: 12,
    paddingVertical: 8,
    textAlign: 'right',
    fontWeight: '800',
  },
  receiptBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Radii.input,
    padding: 18,
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  transactionInput: {
    borderWidth: 1,
    borderRadius: Radii.input,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  action: {
    flex: 1,
  },
  successCard: {
    alignItems: 'center',
    gap: 12,
  },
});
