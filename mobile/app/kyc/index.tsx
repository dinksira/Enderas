import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { AuthRequired } from '@/components/auth';
import { FormField, GoldButton } from '@/components/auth';
import {
  KycDocumentTypeSelector,
  type IndividualDocumentType,
  type KycDocumentType,
  type OrganizationDocumentType,
} from '@/components/kyc/KycDocumentTypeSelector';
import { KycFileUpload } from '@/components/kyc/KycFileUpload';
import { GlassCard } from '@/components/shell/GlassCard';
import { ScreenShell } from '@/components/shell/ScreenShell';
import { useTheme } from '@/lib/appStore';
import { useAuthStore, useIsAuthenticated } from '@/lib/authStore';
import { ApiError } from '@/services/api';
import { getMyKYC, resubmitKYC, submitKYC, type KycRecord } from '@/services/kycApi';

interface KycFormState {
  documentType: KycDocumentType;
  documentNumber: string;
  tinNumber: string;
  documentFrontUrl: string;
  documentBackUrl: string;
  tradeLicenseUrl: string;
  tinCertificateUrl: string;
  businessRegistrationUrl: string;
}

function defaultDocumentType(userType: string): KycDocumentType {
  return userType === 'organization' ? 'trade_license' : 'national_id';
}

function emptyForm(userType: string): KycFormState {
  return {
    documentType: defaultDocumentType(userType),
    documentNumber: '',
    tinNumber: '',
    documentFrontUrl: '',
    documentBackUrl: '',
    tradeLicenseUrl: '',
    tinCertificateUrl: '',
    businessRegistrationUrl: '',
  };
}

function needsDocumentBack(documentType: KycDocumentType): boolean {
  return documentType === 'national_id' || documentType === 'driving_license';
}

function getDocumentNumberLabel(documentType: KycDocumentType, t: (key: string) => string): string {
  switch (documentType) {
    case 'national_id':
      return t('kyc.nationalIdNumber');
    case 'passport':
      return t('kyc.passportNumber');
    case 'driving_license':
      return t('kyc.licenseNumber');
    default:
      return t('kyc.tinNumber');
  }
}

function getOrgUploadValue(form: KycFormState, documentType: OrganizationDocumentType): string {
  switch (documentType) {
    case 'trade_license':
      return form.tradeLicenseUrl;
    case 'tin_certificate':
      return form.tinCertificateUrl;
    case 'business_registration':
      return form.businessRegistrationUrl;
    default:
      return '';
  }
}

function setOrgUploadValue(
  form: KycFormState,
  documentType: OrganizationDocumentType,
  url: string,
): KycFormState {
  return {
    ...form,
    tradeLicenseUrl: documentType === 'trade_license' ? url : '',
    tinCertificateUrl: documentType === 'tin_certificate' ? url : '',
    businessRegistrationUrl: documentType === 'business_registration' ? url : '',
  };
}

export default function KycScreen() {
  const { t } = useTranslation();
  const isAuthenticated = useIsAuthenticated();

  if (!isAuthenticated) {
    return (
      <AuthRequired
        title={t('kyc.title')}
        icon="shield-check-outline"
        message={t('kyc.loginRequired')}
        cta={t('authRequired.loginCta')}
        returnTo="/kyc"
      />
    );
  }

  return <AuthenticatedKycForm />;
}

function AuthenticatedKycForm() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const updateUserStatus = useAuthStore((s) => s.updateUserStatus);

  const [checkingStatus, setCheckingStatus] = useState(true);
  const [kycData, setKycData] = useState<KycRecord | null>(null);
  const [form, setForm] = useState<KycFormState>(() => emptyForm(user?.userType || 'individual'));
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const userType = user?.userType || 'individual';
  const isOrganization = userType === 'organization';
  const isRejected = kycData?.status === 'rejected';
  const isUnderReview =
    user?.status === 'kyc_under_review' &&
    kycData?.status === 'pending' &&
    !isRejected;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await getMyKYC();
        if (cancelled) return;

        if (response.kyc) {
          setKycData(response.kyc);
          if (response.kyc.status === 'approved' || user?.status === 'active') {
            router.replace('/(tabs)/dashboard');
            return;
          }
        }
      } catch {
        // No existing record — show submission form.
      } finally {
        if (!cancelled) setCheckingStatus(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.status]);

  const updateField = (field: keyof KycFormState) => (value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormError(null);
  };

  const handleDocumentTypeChange = (documentType: KycDocumentType) => {
    setForm((current) => ({
      ...emptyForm(userType),
      documentType,
      documentNumber: current.documentNumber,
      tinNumber: current.tinNumber,
    }));
    setFormError(null);
  };

  const validateForm = (): string | null => {
    if (isOrganization) {
      if (!form.tinNumber.trim()) return t('auth.errors.tinRequired');
      const orgType = form.documentType as OrganizationDocumentType;
      const documentUrl = getOrgUploadValue(form, orgType);
      if (!documentUrl) {
        if (orgType === 'trade_license') return t('kyc.errors.tradeLicenseRequired');
        if (orgType === 'tin_certificate') return t('kyc.errors.tinCertificateRequired');
        return t('kyc.errors.businessRegistrationRequired');
      }
      return null;
    }

    if (!form.documentNumber.trim()) return t('kyc.errors.documentNumberRequired');
    if (!form.documentFrontUrl) return t('kyc.errors.documentFrontRequired');
    if (needsDocumentBack(form.documentType) && !form.documentBackUrl) {
      return t('kyc.errors.documentBackRequired');
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setLoading(true);
    setFormError(null);

    const payload = {
      userType,
      documentType: form.documentType,
      documentNumber: isOrganization ? undefined : form.documentNumber.trim(),
      tinNumber: isOrganization ? form.tinNumber.trim() : undefined,
      documentFrontUrl: !isOrganization ? form.documentFrontUrl : undefined,
      documentBackUrl:
        !isOrganization && needsDocumentBack(form.documentType)
          ? form.documentBackUrl
          : undefined,
      tradeLicenseUrl: isOrganization && form.documentType === 'trade_license'
        ? form.tradeLicenseUrl
        : undefined,
      tinCertificateUrl: isOrganization && form.documentType === 'tin_certificate'
        ? form.tinCertificateUrl
        : undefined,
      businessRegistrationUrl: isOrganization && form.documentType === 'business_registration'
        ? form.businessRegistrationUrl
        : undefined,
    };

    try {
      const submitFn = isRejected ? resubmitKYC : submitKYC;
      const result = await submitFn(payload);
      setKycData(result.kyc);
      updateUserStatus('kyc_under_review');
      router.replace('/(tabs)/dashboard');
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : t('kyc.submissionFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <ScreenShell title={t('kyc.title')} showBack onBack={() => router.back()} bottomPadding={40}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.goldBright} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>{t('common.loading')}</Text>
        </View>
      </ScreenShell>
    );
  }

  if (isUnderReview) {
    return (
      <ScreenShell title={t('kyc.title')} showBack onBack={() => router.back()} bottomPadding={40}>
        <GlassCard padding={20}>
          <View style={styles.statusIconWrap}>
            <MaterialCommunityIcons name="clock-outline" size={28} color={colors.goldBright} />
          </View>
          <Text style={[styles.statusTitle, { color: colors.cream }]}>{t('kyc.underReviewTitle')}</Text>
          <Text style={[styles.statusBody, { color: colors.textSecondary }]}>
            {t('kyc.underReviewBanner')}
          </Text>
          <Text style={[styles.statusHint, { color: colors.textMuted }]}>
            {t('kyc.underReviewNotificationInfo')}
          </Text>
          <View style={styles.submitSpacer} />
          <GoldButton label={t('kyc.goToDashboard')} onPress={() => router.replace('/(tabs)/dashboard')} />
        </GlassCard>
      </ScreenShell>
    );
  }

  const individualType = form.documentType as IndividualDocumentType;
  const organizationType = form.documentType as OrganizationDocumentType;

  return (
    <ScreenShell
      title={t('kyc.title')}
      showBack
      onBack={() => router.back()}
      bottomPadding={40}
      keyboardAware
      keyboardToolbar
    >
      <GlassCard padding={18}>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('kyc.verificationSubtitle')}</Text>

        <View style={[styles.accountBadge, { borderColor: colors.goldBorder, backgroundColor: colors.glassFill }]}>
          <MaterialCommunityIcons
            name={isOrganization ? 'domain' : 'account-outline'}
            size={16}
            color={colors.goldBright}
          />
          <Text style={[styles.accountBadgeText, { color: colors.cream }]}>
            {isOrganization ? t('kyc.accountTypeOrganization') : t('kyc.accountTypeIndividual')}
          </Text>
        </View>

        {isRejected ? (
          <View
            style={[
              styles.rejectedBanner,
              {
                backgroundColor: colors.danger.soft,
                borderColor: colors.danger.border,
              },
            ]}
          >
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.danger.fg} />
            <View style={styles.rejectedCopy}>
              <Text style={[styles.rejectedText, { color: colors.danger.fg }]}>
                {t('kyc.rejectedBanner')}
              </Text>
              {kycData?.rejection_reason ? (
                <Text style={[styles.rejectionReason, { color: colors.danger.fg }]}>
                  {kycData.rejection_reason}
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}

        {formError ? (
          <View
            style={[
              styles.errorBanner,
              {
                backgroundColor: colors.danger.soft,
                borderColor: colors.danger.border,
              },
            ]}
          >
            <Text style={[styles.errorBannerText, { color: colors.danger.fg }]}>{formError}</Text>
          </View>
        ) : null}

        <KycDocumentTypeSelector
          userType={userType as 'individual' | 'organization'}
          value={form.documentType}
          onChange={handleDocumentTypeChange}
          disabled={loading}
        />

        {isOrganization ? (
          <>
            <FormField
              label={t('kyc.tinNumber')}
              value={form.tinNumber}
              onChangeText={updateField('tinNumber')}
              keyboardType="default"
            />
            <KycFileUpload
              label={t(`kyc.documentTypes.${organizationType === 'trade_license' ? 'tradeLicense' : organizationType === 'tin_certificate' ? 'tinCertificate' : 'businessRegistration'}`)}
              value={getOrgUploadValue(form, organizationType)}
              onChange={(url) => setForm((current) => setOrgUploadValue(current, organizationType, url))}
              disabled={loading}
              acceptPdf
            />
          </>
        ) : (
          <>
            <FormField
              label={getDocumentNumberLabel(individualType, t)}
              value={form.documentNumber}
              onChangeText={updateField('documentNumber')}
              keyboardType="default"
            />
            <KycFileUpload
              label={
                individualType === 'passport'
                  ? t('kyc.passportBioPage')
                  : t('kyc.documentFront')
              }
              value={form.documentFrontUrl}
              onChange={updateField('documentFrontUrl')}
              disabled={loading}
            />
            {needsDocumentBack(individualType) ? (
              <KycFileUpload
                label={t('kyc.documentBack')}
                value={form.documentBackUrl}
                onChange={updateField('documentBackUrl')}
                disabled={loading}
              />
            ) : null}
          </>
        )}

        <GoldButton
          label={loading ? t('kyc.submitting') : isRejected ? t('kyc.resubmit') : t('kyc.submit')}
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
        />
      </GlassCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 14,
  },
  accountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 16,
  },
  accountBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  rejectedBanner: {
    flexDirection: 'row',
    gap: 10,
    // backgroundColor + borderColor are bound at runtime (theme-aware).
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  rejectedCopy: {
    flex: 1,
    gap: 4,
  },
  rejectedText: {
    fontSize: 13,
    // color bound at runtime (theme-aware).
    lineHeight: 18,
    fontWeight: '500',
  },
  rejectionReason: {
    fontSize: 12,
    // color bound at runtime (theme-aware).
    lineHeight: 17,
  },
  errorBanner: {
    // backgroundColor + borderColor are bound at runtime (theme-aware).
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  errorBannerText: {
    fontSize: 13,
    // color bound at runtime (theme-aware).
    lineHeight: 18,
    textAlign: 'center',
  },
  statusIconWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  statusBody: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 8,
  },
  statusHint: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    textAlign: 'center',
  },
  submitSpacer: {
    height: 16,
  },
});
