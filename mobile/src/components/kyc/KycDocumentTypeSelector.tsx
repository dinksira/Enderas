import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '@/lib/appStore';

export type IndividualDocumentType = 'national_id' | 'passport' | 'driving_license';
export type OrganizationDocumentType = 'trade_license' | 'tin_certificate' | 'business_registration';
export type KycDocumentType = IndividualDocumentType | OrganizationDocumentType;

interface DocumentOption {
  id: KycDocumentType;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  labelKey: string;
}

const INDIVIDUAL_OPTIONS: DocumentOption[] = [
  { id: 'national_id', icon: 'card-account-details-outline', labelKey: 'kyc.documentTypes.nationalId' },
  { id: 'passport', icon: 'passport', labelKey: 'kyc.documentTypes.passport' },
  { id: 'driving_license', icon: 'car-side', labelKey: 'kyc.documentTypes.drivingLicense' },
];

const ORGANIZATION_OPTIONS: DocumentOption[] = [
  { id: 'trade_license', icon: 'store-outline', labelKey: 'kyc.documentTypes.tradeLicense' },
  { id: 'tin_certificate', icon: 'file-certificate-outline', labelKey: 'kyc.documentTypes.tinCertificate' },
  { id: 'business_registration', icon: 'domain', labelKey: 'kyc.documentTypes.businessRegistration' },
];

interface KycDocumentTypeSelectorProps {
  userType: 'individual' | 'organization';
  value: KycDocumentType;
  onChange: (type: KycDocumentType) => void;
  disabled?: boolean;
}

export function KycDocumentTypeSelector({
  userType,
  value,
  onChange,
  disabled,
}: KycDocumentTypeSelectorProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const options = userType === 'organization' ? ORGANIZATION_OPTIONS : INDIVIDUAL_OPTIONS;

  return (
    <View style={styles.host}>
      <Text style={[styles.sectionLabel, { color: colors.goldChampagne }]}>
        {t('kyc.selectDocumentType')}
      </Text>
      <View style={styles.list}>
        {options.map((option) => {
          const active = value === option.id;
          return (
            <Pressable
              key={option.id}
              onPress={() => onChange(option.id)}
              disabled={disabled}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: active ? colors.glassFillActive : colors.glassFill,
                  borderColor: active ? colors.goldBorderActive : colors.goldBorder,
                  opacity: pressed ? 0.88 : disabled ? 0.6 : 1,
                },
              ]}
            >
              {active ? (
                <View style={[styles.topHighlight, { backgroundColor: colors.glassTopHighlight }]} />
              ) : null}
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: active ? colors.glassFillActive : colors.glassFill,
                    borderColor: active ? colors.goldBorderActive : colors.goldBorder,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={option.icon}
                  size={20}
                  color={active ? colors.goldBright : colors.textMuted}
                />
              </View>
              <Text
                style={[
                  styles.cardLabel,
                  { color: active ? colors.goldBright : colors.cream },
                ]}
              >
                {t(option.labelKey)}
              </Text>
              {active ? (
                <MaterialCommunityIcons name="check-circle" size={18} color={colors.goldBright} />
              ) : (
                <MaterialCommunityIcons name="circle-outline" size={18} color={colors.textMuted} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    gap: 8,
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  list: {
    gap: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 13,
    position: 'relative',
    overflow: 'hidden',
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 10,
    right: 10,
    height: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

export default KycDocumentTypeSelector;
