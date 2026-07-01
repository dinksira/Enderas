import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { GoldButton } from '@/components/auth';
import { LocalReceiptUpload } from '@/components/auction/LocalReceiptUpload';
import { ParticipationStatusBanner } from '@/components/auction/ParticipationStatusBanner';
import { ScreenShell } from '@/components/shell/ScreenShell';
import { GlassCard } from '@/components/shell/GlassCard';
import { findMockAuctionById } from '@/data/mockAuctions';
import { useAuctionParticipation } from '@/hooks/useAuctionParticipation';
import { formatEtbAmount } from '@/lib/auctionUtils';
import { useTheme } from '@/lib/appStore';
import { Typography, Spacing, Radii } from '@/theme';
import type { PaymentMethod } from '@/types/auctionParticipation';

const PAYMENT_METHODS: { id: PaymentMethod; labelKey: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'] }[] = [
  { id: 'manual', labelKey: 'auction.participation.manualTransfer', icon: 'bank-transfer' },
  { id: 'addis_pay', labelKey: 'auction.participation.addisPay', icon: 'cellphone' },
];

export default function BuyAuctionDocScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const auction = useMemo(() => (id ? findMockAuctionById(id) : undefined), [id]);
  const { record, actions } = useAuctionParticipation(id ?? '');

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    record.documentPayment.paymentMethod ?? 'manual',
  );
  const [receipt, setReceipt] = useState<{ uri: string; name: string } | undefined>(
    record.documentPayment.receiptUri && record.documentPayment.receiptName
      ? { uri: record.documentPayment.receiptUri, name: record.documentPayment.receiptName }
      : undefined,
  );

  if (!auction || !id) {
    return (
      <ScreenShell title={t('auction.participation.buyDoc')} showBack onBack={() => router.back()} bottomPadding={40}>
        <GlassCard padding={Spacing.lg}>
          <Text style={[Typography.body, { color: colors.danger.fg }]}>
            {t('dashboard.browse.detailError')}
          </Text>
        </GlassCard>
      </ScreenShell>
    );
  }

  const paymentStatus = record.documentPayment.status;
  const isPending = paymentStatus === 'pending';
  const isApproved = paymentStatus === 'approved';
  const isRejected = paymentStatus === 'rejected';
  const canSubmit = !isPending && !isApproved && receipt;

  const handleSubmit = () => {
    if (!receipt) return;
    actions.submitDocumentPayment(id, {
      paymentMethod,
      receiptUri: receipt.uri,
      receiptName: receipt.name,
    });
  };

  return (
    <ScreenShell
      title={t('auction.participation.buyDoc')}
      pageTitle={auction.title}
      showBack
      onBack={() => router.back()}
      bottomPadding={40}
    >
      {isPending ? (
        <ParticipationStatusBanner
          tone="pending"
          icon="clock-outline"
          title={t('auction.participation.docPendingTitle')}
          message={t('auction.participation.docPendingBody')}
        />
      ) : null}

      {isRejected ? (
        <ParticipationStatusBanner
          tone="lost"
          icon="close-circle-outline"
          title={t('auction.participation.docRejectedTitle')}
          message={t('auction.participation.docRejectedBody')}
        />
      ) : null}

      {isApproved ? (
        <ParticipationStatusBanner
          tone="won"
          icon="check-decagram-outline"
          title={t('auction.participation.docApprovedTitle')}
          message={t('auction.participation.docApprovedBody')}
        />
      ) : null}

      <GlassCard padding={16} style={styles.card}>
        <Text style={[Typography.microCaps, { color: colors.goldChampagne }]}>
          {t('auction.participation.documentFee')}
        </Text>
        <Text style={[Typography.h1, { color: colors.cream, fontSize: 28, marginTop: 4 }]}>
          {formatEtbAmount(auction.documentPrice)}
        </Text>
        <Text style={[Typography.caption, { color: colors.textMuted, marginTop: 8 }]}>
          {t('auction.participation.buyDocHint')}
        </Text>
      </GlassCard>

      <GlassCard padding={16} style={styles.card}>
        <Text style={[styles.sectionTitle, { color: colors.goldChampagne }]}>
          {t('auction.participation.paymentMethod')}
        </Text>
        <View style={styles.methodList}>
          {PAYMENT_METHODS.map((method) => {
            const active = paymentMethod === method.id;
            return (
              <Pressable
                key={method.id}
                onPress={() => !isPending && !isApproved && setPaymentMethod(method.id)}
                disabled={isPending || isApproved}
                style={({ pressed }) => [
                  styles.methodRow,
                  {
                    borderColor: active ? colors.goldBright : colors.goldBorder,
                    backgroundColor: active ? colors.glassFillActive : colors.glassFill,
                    opacity: pressed ? 0.9 : isPending || isApproved ? 0.7 : 1,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={method.icon}
                  size={20}
                  color={active ? colors.goldBright : colors.textMuted}
                />
                <Text style={[Typography.bodySmall, { color: colors.cream, flex: 1 }]}>
                  {t(method.labelKey)}
                </Text>
                {active ? (
                  <MaterialCommunityIcons name="check-circle" size={18} color={colors.goldBright} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </GlassCard>

      <GlassCard padding={16} style={styles.card}>
        <LocalReceiptUpload
          label={t('auction.participation.paymentReceipt')}
          hint={t('auction.participation.paymentReceiptHint')}
          value={receipt}
          onChange={setReceipt}
          onClear={() => setReceipt(undefined)}
          disabled={isPending || isApproved}
        />
      </GlassCard>

      {!isApproved ? (
        <GoldButton
          label={isPending ? t('auction.participation.docUnderReview') : t('auction.participation.submitPayment')}
          onPress={handleSubmit}
          disabled={!canSubmit || isPending}
        />
      ) : (
        <GoldButton
          label={t('auction.participation.viewDoc')}
          onPress={() => router.push(`/auction/${id}/document`)}
        />
      )}

      {isPending ? (
        <View style={styles.simRow}>
          <Text style={[Typography.caption, { color: colors.textMuted, flex: 1 }]}>
            {t('auction.participation.simulateHint')}
          </Text>
          <Pressable onPress={() => actions.simulateApproveDocumentPayment(id)}>
            <Text style={[Typography.caption, { color: colors.goldBright, fontWeight: '700' }]}>
              {t('auction.participation.simulateApprove')}
            </Text>
          </Pressable>
        </View>
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
    marginBottom: 12,
  },
  methodList: {
    gap: 8,
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: Radii.input,
    borderWidth: 1,
  },
  simRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    paddingHorizontal: 4,
  },
});
