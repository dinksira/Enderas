import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { GoldButton } from '@/components/auth';
import { LocalReceiptUpload } from '@/components/auction/LocalReceiptUpload';
import { ParticipationStatusBanner } from '@/components/auction/ParticipationStatusBanner';
import { KycRequiredModal } from '@/components/kyc/KycRequiredModal';
import { ScreenShell } from '@/components/shell/ScreenShell';
import { GlassCard } from '@/components/shell/GlassCard';
import { useAuctionActionGate } from '@/hooks/useAuctionActionGate';
import { useAuctionParticipation } from '@/hooks/useAuctionParticipation';
import { openAuctionDocumentInBrowser } from '@/lib/auctionDocumentUtils';
import { formatEtbAmount } from '@/lib/auctionUtils';
import { useTheme } from '@/lib/appStore';
import { useAuthStore } from '@/lib/authStore';
import { fileUploadApi } from '@/services/fileUploadApi';
import { paymentApi } from '@/services/paymentApi';
import { Typography, Spacing, Radii } from '@/theme';
import type { PaymentMethod } from '@/types/auctionParticipation';

const PAYMENT_METHODS: {
  id: PaymentMethod;
  labelKey: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}[] = [
  { id: 'manual', labelKey: 'auction.participation.manualTransfer', icon: 'bank-transfer' },
  { id: 'addis_pay', labelKey: 'auction.participation.addisPay', icon: 'cellphone' },
];

export default function BuyAuctionDocScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const auctionId = id ?? '';
  const { auction, participation, loading, refreshing, error, refresh, kycVerified } = useAuctionParticipation(auctionId);
  const { isAuthenticated } = useAuctionActionGate();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [kycModalVisible, setKycModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('manual');
  const [receipt, setReceipt] = useState<{ uri: string; name: string; mimeType?: string } | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!isAuthenticated) {
    return (
      <ScreenShell title={t('auction.participation.buyDoc')} showBack onBack={() => router.back()} bottomPadding={40}>
        <GlassCard padding={Spacing.lg}>
          <Text style={[Typography.body, { color: colors.textSecondary }]}>
            {t('auction.participation.loginRequired')}
          </Text>
          <GoldButton
            label={t('authRequired.loginCta')}
            onPress={() => router.push(`/(auth)/login?returnTo=${encodeURIComponent(`/auction/${auctionId}/buy-doc`)}` as any)}
          />
        </GlassCard>
      </ScreenShell>
    );
  }

  if (!kycVerified) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.base }}>
        <KycRequiredModal
          visible
          onClose={() => router.back()}
          onVerify={() => router.push('/kyc' as any)}
        />
      </View>
    );
  }

  if (loading && !auction) {
    return (
      <ScreenShell title={t('auction.participation.buyDoc')} showBack onBack={() => router.back()} bottomPadding={40}>
        <ActivityIndicator color={colors.goldBright} />
      </ScreenShell>
    );
  }

  if (!auction || !id || error) {
    return (
      <ScreenShell title={t('auction.participation.buyDoc')} showBack onBack={() => router.back()} bottomPadding={40}>
        <GlassCard padding={Spacing.lg}>
          <Text style={[Typography.body, { color: colors.danger.fg }]}>
            {error ?? t('dashboard.browse.detailError')}
          </Text>
        </GlassCard>
      </ScreenShell>
    );
  }

  const paymentStatus = participation?.payment?.status ?? 'none';
  const isPending = paymentStatus === 'pending';
  const isApproved = paymentStatus === 'approved';
  const isRejected = paymentStatus === 'rejected';
  const canSubmit = !isPending && !isApproved && receipt && !submitting;

  const handleSubmit = async () => {
    if (!receipt || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      let receiptUrl: string | undefined;
      if (paymentMethod === 'manual') {
        const uploaded = await fileUploadApi.uploadFile(
          {
            uri: receipt.uri,
            name: receipt.name,
            mimeType: receipt.mimeType ?? 'application/pdf',
          },
          'payments/receipts',
        );
        receiptUrl = uploaded.fileUrl;
      }

      await paymentApi.createPayment({
        auctionId: id,
        amount: auction.documentFee,
        paymentMethod,
        receiptUrl,
      });
      await refresh();
      router.back();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('auction.participation.submitPaymentFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenShell
      title={t('auction.participation.buyDoc')}
      pageTitle={auction.title}
      showBack
      onBack={() => router.back()}
      bottomPadding={40}
      refreshing={refreshing}
      onRefresh={refresh}
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
          message={participation?.payment?.rejectionReason ?? t('auction.participation.docRejectedBody')}
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
          {formatEtbAmount(auction.documentFee)}
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

      {submitError ? (
        <Text style={[Typography.caption, { color: colors.danger.fg, marginBottom: 10 }]}>
          {submitError}
        </Text>
      ) : null}

      {!isApproved ? (
        <GoldButton
          label={
            submitting
              ? t('common.submitting')
              : isPending
                ? t('auction.participation.docUnderReview')
                : t('auction.participation.submitPayment')
          }
          onPress={handleSubmit}
          disabled={!canSubmit || isPending}
        />
      ) : (
        <GoldButton
          label={t('auction.participation.openExternal')}
          onPress={() => {
            void openAuctionDocumentInBrowser(id, auction.documents, 0, accessToken).then((opened) => {
              if (!opened) {
                Alert.alert(
                  t('auction.participation.downloadErrorTitle'),
                  t('auction.participation.downloadErrorBody'),
                );
              }
            });
          }}
        />
      )}

      <KycRequiredModal
        visible={kycModalVisible}
        onClose={() => setKycModalVisible(false)}
        onVerify={() => {
          setKycModalVisible(false);
          router.push('/kyc' as any);
        }}
      />
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
});
