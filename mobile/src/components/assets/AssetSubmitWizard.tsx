import { forwardRef, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { KeyboardToolbar } from 'react-native-keyboard-controller';

import { pickDocumentFile } from '@/lib/documentPickerUtils';

import { FormField, GoldButton } from '@/components/auth';
import { uploadAssetPhotos, AssetPhotoPicker } from '@/components/assets/AssetPhotoPicker';
import { AssetTypeSelector } from '@/components/assets/AssetTypeSelector';
import { KycFileUpload } from '@/components/kyc/KycFileUpload';
import { GlassCard } from '@/components/shell/GlassCard';
import { ScreenShell } from '@/components/shell/ScreenShell';
import { useTheme } from '@/lib/appStore';
import {
  ASSET_REQUEST_STEP_ORDER,
  ASSET_REQUEST_STEPS,
  buildAssetPayload,
  buildEmptyAssetForm,
  cloneAssetFormDraft,
  getOwnershipDocType,
  MAX_ASSETS_PER_BATCH,
  OWNERSHIP_DOC_LABEL_KEYS,
  summarizeAssetDraft,
  validateAssetForm,
  validateAssetStep,
  type AssetFormState,
  type AssetRequestStep,
  type QueuedAssetDraft,
} from '@/lib/assetFormUtils';
import { GLASS_RADIUS } from '@/lib/glassStyles';
import { GlassSurface } from '@/components/shell/GlassSurface';
import { ApiError } from '@/services/api';
import { createAssetsBatch } from '@/services/assetApi';
import { fileUploadApi } from '@/services/fileUploadApi';

const FORM_STEPS = ASSET_REQUEST_STEP_ORDER.filter(
  (stepKey) => stepKey !== ASSET_REQUEST_STEPS.BATCH_REVIEW,
);

function createClientId(): string {
  return `asset-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const FormTextArea = forwardRef<TextInput, {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  returnKeyType?: 'next' | 'done' | 'default';
  onSubmitEditing?: () => void;
  blurOnSubmit?: boolean;
}>(function FormTextArea(
  {
    label,
    value,
    onChangeText,
    placeholder,
    error,
    disabled,
    returnKeyType = 'default',
    onSubmitEditing,
    blurOnSubmit,
  },
  ref,
) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.textAreaHost}>
      <Text style={[styles.textAreaLabel, { color: colors.goldChampagne }]}>{label}</Text>
      <GlassSurface
        borderRadius={GLASS_RADIUS.input}
        active={focused && !error}
        padding={0}
        contentStyle={[
          styles.textAreaWrap,
          !!error && { borderColor: colors.danger.border },
        ]}
      >
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          editable={!disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          blurOnSubmit={blurOnSubmit}
          style={[styles.textAreaInput, { color: colors.cream }]}
        />
      </GlassSurface>
      {error ? <Text style={[styles.fieldError, { color: colors.danger.fg }]}>{error}</Text> : null}
    </View>
  );
});

export function AssetSubmitWizard() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [step, setStep] = useState<AssetRequestStep>(ASSET_REQUEST_STEPS.DETAILS);
  const [form, setForm] = useState<AssetFormState>(buildEmptyAssetForm);
  const [assetQueue, setAssetQueue] = useState<QueuedAssetDraft[]>([]);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAdditional, setUploadingAdditional] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [submittedCount, setSubmittedCount] = useState(0);

  const titleRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);
  const conditionNotesRef = useRef<TextInput>(null);
  const locationRef = useRef<TextInput>(null);
  const addressRef = useRef<TextInput>(null);
  const reserveRef = useRef<TextInput>(null);
  const auctionConditionsRef = useRef<TextInput>(null);

  const stepIndex = ASSET_REQUEST_STEP_ORDER.indexOf(step);
  const isTextInputStep =
    step === ASSET_REQUEST_STEPS.DETAILS || step === ASSET_REQUEST_STEPS.LOCATION;
  const formStepIndex = FORM_STEPS.indexOf(step as (typeof FORM_STEPS)[number]);
  const progressStep =
    step === ASSET_REQUEST_STEPS.BATCH_REVIEW ? FORM_STEPS.length : Math.max(formStepIndex + 1, 1);
  const ownershipDocType = form.assetType ? getOwnershipDocType(form.assetType) : '';
  const ownershipDocLabelKey = ownershipDocType
    ? OWNERSHIP_DOC_LABEL_KEYS[ownershipDocType]
    : null;
  const canAddAnother = assetQueue.length < MAX_ASSETS_PER_BATCH;

  const stepLabel = t(`assets.requestWizard.steps.${step}`);

  const updateField = <K extends keyof AssetFormState>(field: K, value: AssetFormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field as string];
      delete next.form;
      return next;
    });
    setSubmitError('');
  };

  const resetCurrentForm = () => {
    setForm(buildEmptyAssetForm());
    setEditingClientId(null);
  };

  const goToStep = (targetStep: AssetRequestStep) => {
    setStep(targetStep);
    setErrors({});
    setSubmitError('');
  };

  const commitCurrentToQueue = (): boolean => {
    const validationErrors = validateAssetForm(form, t);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return false;
    }

    if (!editingClientId && assetQueue.length >= MAX_ASSETS_PER_BATCH) {
      setSubmitError(
        t('assets.requestWizard.batchReview.limitReached', { max: MAX_ASSETS_PER_BATCH }),
      );
      return false;
    }

    const entry: QueuedAssetDraft = {
      clientId: editingClientId || createClientId(),
      form: cloneAssetFormDraft(form),
    };

    setAssetQueue((current) => {
      if (editingClientId) {
        return [...current.filter((item) => item.clientId !== editingClientId), entry];
      }
      return [...current, entry];
    });

    resetCurrentForm();
    return true;
  };

  const removeFromQueue = (clientId: string) => {
    setAssetQueue((current) => current.filter((item) => item.clientId !== clientId));
    if (editingClientId === clientId) {
      resetCurrentForm();
    }
  };

  const editQueueItem = (clientId: string) => {
    const item = assetQueue.find((entry) => entry.clientId === clientId);
    if (!item) return;

    setAssetQueue((current) => current.filter((entry) => entry.clientId !== clientId));
    setForm(cloneAssetFormDraft(item.form));
    setEditingClientId(clientId);
    goToStep(ASSET_REQUEST_STEPS.DETAILS);
  };

  const handleAddAdditionalDoc = async () => {
    if (submitting || uploadingAdditional) return;

    const picked = await pickDocumentFile(['application/pdf', 'image/*']);
    if (!picked) return;

    setUploadingAdditional(true);
    setErrors((current) => {
      const next = { ...current };
      delete next.additionalDocuments;
      return next;
    });

    try {
      const uploaded = await fileUploadApi.uploadFile(picked, 'assets/documents');
      updateField('additionalDocuments', [
        ...form.additionalDocuments,
        { name: picked.name, url: uploaded.fileUrl, size: uploaded.fileSize || 0 },
      ]);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('kyc.uploadFailed');
      setErrors((current) => ({ ...current, additionalDocuments: message }));
    } finally {
      setUploadingAdditional(false);
    }
  };

  const handleNext = () => {
    const stepErrors = validateAssetStep(step, form, t);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    if (step === ASSET_REQUEST_STEPS.DOCUMENTS) {
      if (commitCurrentToQueue()) {
        goToStep(ASSET_REQUEST_STEPS.BATCH_REVIEW);
      }
      return;
    }

    const nextStep = ASSET_REQUEST_STEP_ORDER[stepIndex + 1];
    if (nextStep) goToStep(nextStep);
  };

  const handleBack = () => {
    const prevStep = ASSET_REQUEST_STEP_ORDER[stepIndex - 1];
    if (prevStep) goToStep(prevStep);
  };

  const handleSubmit = async () => {
    if (!assetQueue.length) {
      setSubmitError(t('assets.requestWizard.errors.emptyQueue'));
      return;
    }

    for (const item of assetQueue) {
      const validationErrors = validateAssetForm(item.form, t);
      if (Object.keys(validationErrors).length > 0) {
        setSubmitError(t('assets.requestWizard.errors.fixBeforeSubmit'));
        editQueueItem(item.clientId);
        setErrors(validationErrors);
        return;
      }
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const payloads = [];

      for (const item of assetQueue) {
        const imageUrls = await uploadAssetPhotos(item.form.photoFiles);
        if (!imageUrls.length) {
          throw new Error(t('assets.form.errors.photosRequired'));
        }
        payloads.push(buildAssetPayload(item.form, imageUrls));
      }

      const result = await createAssetsBatch(payloads);
      setSubmittedCount(result.count || payloads.length);
      setCompleted(true);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : t('assets.form.submitFailed');
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const progress = useMemo(() => progressStep / FORM_STEPS.length, [progressStep]);

  if (completed) {
    return (
      <ScreenShell
        title={t('assets.requestWizard.title')}
        showBack
        onBack={() => router.replace('/(tabs)/assets')}
        bottomPadding={80}
      >
        <GlassCard>
          <View style={styles.successWrap}>
            <MaterialCommunityIcons name="check-circle-outline" size={48} color={colors.goldBright} />
            <Text style={[styles.successTitle, { color: colors.cream }]}>
              {t('assets.requestWizard.success.title')}
            </Text>
            <Text style={[styles.successBody, { color: colors.textSecondary }]}>
              {t('assets.requestWizard.success.body', { count: submittedCount })}
            </Text>
            <GoldButton
              label={t('assets.requestWizard.success.backToAssets')}
              onPress={() => router.replace('/(tabs)/assets')}
            />
          </View>
        </GlassCard>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      title={t('assets.requestWizard.title')}
      showBack
      onBack={() => router.back()}
      bottomPadding={80}
      keyboardAware={isTextInputStep}
      keyboardToolbar={isTextInputStep}
      keyboardToolbarArrows={isTextInputStep}
      keyboardBottomOffset={48}
    >
      {step !== ASSET_REQUEST_STEPS.BATCH_REVIEW ? (
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressStepLabel, { color: colors.cream }]}>{stepLabel}</Text>
            <Text style={[styles.progressStepCount, { color: colors.goldChampagne }]}>
              {t('assets.requestWizard.stepProgress', {
                current: progressStep,
                total: FORM_STEPS.length,
              })}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.round(progress * 100)}%`, backgroundColor: colors.goldBright },
              ]}
            />
          </View>
        </View>
      ) : (
        <View style={styles.reviewStepHeader}>
          <Text style={[styles.progressStepLabel, { color: colors.cream }]}>{stepLabel}</Text>
          <Text style={[styles.reviewStepHint, { color: colors.textSecondary }]}>
            {t('assets.requestWizard.batchReview.intro')}
          </Text>
        </View>
      )}

      {submitError ? (
        <Text style={[styles.submitError, { color: colors.danger.fg }]}>{submitError}</Text>
      ) : null}

      {step === ASSET_REQUEST_STEPS.BATCH_REVIEW ? (
        <GlassCard noAnimation>
          {assetQueue.length === 0 ? (
            <Text style={[styles.emptyQueue, { color: colors.textMuted }]}>
              {t('assets.requestWizard.batchReview.empty')}
            </Text>
          ) : (
            assetQueue.map((item, index) => {
              const summary = summarizeAssetDraft(item.form, t);
              return (
                <View
                  key={item.clientId}
                  style={[styles.queueItem, { borderColor: colors.goldBorder }]}
                >
                  <View style={styles.queueHeader}>
                    <Text style={[styles.queueTitle, { color: colors.cream }]}>
                      {t('assets.requestWizard.batchReview.assetLabel', { index: index + 1 })}
                    </Text>
                    <View style={styles.queueActions}>
                      <Pressable onPress={() => editQueueItem(item.clientId)} hitSlop={8}>
                        <Text style={[styles.queueAction, { color: colors.goldBright }]}>
                          {t('assets.requestWizard.actions.edit')}
                        </Text>
                      </Pressable>
                      <Pressable onPress={() => removeFromQueue(item.clientId)} hitSlop={8}>
                        <Text style={[styles.queueAction, { color: colors.danger.fg }]}>
                          {t('assets.requestWizard.actions.removeFromQueue')}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                  <Text style={[styles.queueMeta, { color: colors.textSecondary }]}>
                    {summary.title} · {summary.assetTypeLabel}
                  </Text>
                  <Text style={[styles.queueMeta, { color: colors.textMuted }]}>
                    {summary.location} · {summary.reserve}
                  </Text>
                  <Text style={[styles.queueMeta, { color: colors.textMuted }]}>
                    {t('assets.requestWizard.review.photoCount', { count: summary.photoCount })} ·{' '}
                    {t('assets.requestWizard.review.documentCount', { count: summary.documentCount })}
                  </Text>
                </View>
              );
            })
          )}

          {canAddAnother ? (
            <View style={styles.reviewActions}>
              <GoldButton
                label={t('assets.requestWizard.actions.addAnother')}
                variant="outline"
                onPress={() => goToStep(ASSET_REQUEST_STEPS.DETAILS)}
                disabled={submitting}
                compact
              />
              <GoldButton
                label={
                  assetQueue.length > 1
                    ? t('assets.requestWizard.actions.submitAll', { count: assetQueue.length })
                    : t('assets.requestWizard.actions.submit')
                }
                onPress={handleSubmit}
                loading={submitting}
                disabled={submitting || !assetQueue.length}
                compact
              />
            </View>
          ) : (
            <GoldButton
              label={
                assetQueue.length > 1
                  ? t('assets.requestWizard.actions.submitAll', { count: assetQueue.length })
                  : t('assets.requestWizard.actions.submit')
              }
              onPress={handleSubmit}
              loading={submitting}
              disabled={submitting || !assetQueue.length}
            />
          )}
        </GlassCard>
      ) : (
        <GlassCard noAnimation>
          {editingClientId ? (
            <Text style={[styles.editingHint, { color: colors.goldChampagne }]}>
              {t('assets.requestWizard.batchReview.editing')}
            </Text>
          ) : assetQueue.length > 0 ? (
            <Text style={[styles.editingHint, { color: colors.textMuted }]}>
              {t('assets.requestWizard.batchReview.queuedCount', { count: assetQueue.length })}
            </Text>
          ) : null}

          {step === ASSET_REQUEST_STEPS.DETAILS ? (
            <KeyboardToolbar.Group style={styles.formBlock}>
              <FormField
                ref={titleRef}
                  label={t('assets.form.fields.title')}
                  value={form.title}
                  onChangeText={(text) => updateField('title', text)}
                  error={errors.title}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => descriptionRef.current?.focus()}
                />
                <AssetTypeSelector
                  value={form.assetType}
                  onChange={(type) => updateField('assetType', type)}
                  error={errors.assetType}
                  disabled={submitting}
                />
                {ownershipDocLabelKey ? (
                  <Text style={[styles.hint, { color: colors.textMuted }]}>
                    {t('assets.form.hints.ownershipDoc', {
                      document: t(`assets.ownershipDocs.${ownershipDocLabelKey}`),
                    })}
                  </Text>
                ) : null}
                <FormTextArea
                  ref={descriptionRef}
                  label={t('assets.form.fields.description')}
                  value={form.description}
                  onChangeText={(text) => updateField('description', text)}
                  placeholder={t('assets.requestWizard.placeholders.description')}
                  error={errors.description}
                  disabled={submitting}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => conditionNotesRef.current?.focus()}
                />
                <FormTextArea
                  ref={conditionNotesRef}
                  label={t('assets.form.fields.conditionNotes')}
                  value={form.conditionNotes}
                  onChangeText={(text) => updateField('conditionNotes', text)}
                  placeholder={t('assets.requestWizard.placeholders.conditionNotes')}
                  error={errors.conditionNotes}
                  disabled={submitting}
                  returnKeyType="done"
              />
            </KeyboardToolbar.Group>
          ) : null}

          {step === ASSET_REQUEST_STEPS.LOCATION ? (
            <KeyboardToolbar.Group style={styles.formBlock}>
              <FormField
                ref={locationRef}
                  label={t('assets.form.fields.location')}
                  value={form.location}
                  onChangeText={(text) => updateField('location', text)}
                  placeholder={t('assets.requestWizard.placeholders.location')}
                  error={errors.location}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => addressRef.current?.focus()}
                />
                <FormField
                  ref={addressRef}
                  label={t('assets.form.fields.address')}
                  value={form.address}
                  onChangeText={(text) => updateField('address', text)}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => reserveRef.current?.focus()}
                />
                <FormField
                  ref={reserveRef}
                  label={t('assets.form.fields.desiredReservePrice')}
                  value={form.desiredReservePrice}
                  onChangeText={(text) => updateField('desiredReservePrice', text)}
                  placeholder={t('assets.requestWizard.placeholders.reservePrice')}
                  keyboardType="numeric"
                  error={errors.desiredReservePrice}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => auctionConditionsRef.current?.focus()}
                />
                <Text style={[styles.hint, { color: colors.textMuted }]}>
                  {t('assets.requestWizard.reserveHint')}
                </Text>
                <FormTextArea
                  ref={auctionConditionsRef}
                  label={t('assets.form.fields.auctionConditions')}
                  value={form.auctionConditions}
                  onChangeText={(text) => updateField('auctionConditions', text)}
                  placeholder={t('assets.requestWizard.placeholders.auctionConditions')}
                  error={errors.auctionConditions}
                  disabled={submitting}
                  returnKeyType="done"
              />
            </KeyboardToolbar.Group>
          ) : null}

          {step === ASSET_REQUEST_STEPS.PHOTOS ? (
            <AssetPhotoPicker
              photos={form.photoFiles}
              onChange={(photos) => updateField('photoFiles', photos)}
              error={errors.photos}
              disabled={submitting}
            />
          ) : null}

          {step === ASSET_REQUEST_STEPS.DOCUMENTS ? (
            <View style={styles.formBlock}>
              <KycFileUpload
                label={t('assets.form.fields.ownershipDocument')}
                value={form.ownershipDocumentUrl}
                onChange={(url) => updateField('ownershipDocumentUrl', url)}
                acceptPdf
                folder="assets/ownership"
                disabled={submitting}
                hint={
                  ownershipDocLabelKey
                    ? t(`assets.ownershipDocs.${ownershipDocLabelKey}`)
                    : undefined
                }
              />
              {errors.ownershipDocumentUrl ? (
                <Text style={[styles.fieldError, { color: colors.danger.fg }]}>{errors.ownershipDocumentUrl}</Text>
              ) : null}

              <Text style={[styles.label, { color: colors.goldChampagne }]}>
                {t('assets.form.fields.additionalDocuments')}
              </Text>
              <Text style={[styles.hint, { color: colors.textMuted }]}>
                {t('assets.form.hints.additionalDocumentsPdf')}
              </Text>

              {form.additionalDocuments.map((doc, index) => (
                <View
                  key={`${doc.url}-${index}`}
                  style={[styles.docRow, { borderColor: colors.goldBorder }]}
                >
                  <MaterialCommunityIcons name="file-pdf-box" size={20} color={colors.goldBright} />
                  <Text style={[styles.docName, { color: colors.cream }]} numberOfLines={1}>
                    {doc.name}
                  </Text>
                  <Pressable
                    onPress={() =>
                      updateField(
                        'additionalDocuments',
                        form.additionalDocuments.filter((_, i) => i !== index),
                      )
                    }
                    hitSlop={8}
                  >
                    <MaterialCommunityIcons name="close" size={18} color={colors.textMuted} />
                  </Pressable>
                </View>
              ))}

              <GoldButton
                label={t('assets.requestWizard.actions.addDocument')}
                variant="outline"
                onPress={handleAddAdditionalDoc}
                loading={uploadingAdditional}
                disabled={submitting || uploadingAdditional}
                compact
              />
              {errors.additionalDocuments ? (
                <Text style={[styles.fieldError, { color: colors.danger.fg }]}>{errors.additionalDocuments}</Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.navFooter}>
            <View style={styles.navRow}>
              {stepIndex > 0 ? (
                <View style={styles.navButtonWrap}>
                  <GoldButton
                    label={t('assets.requestWizard.actions.back')}
                    variant="outline"
                    onPress={handleBack}
                    disabled={submitting}
                    compact
                  />
                </View>
              ) : null}
              <View style={[styles.navButtonWrap, stepIndex === 0 && styles.navButtonWrapSingle]}>
                <GoldButton
                  label={
                    step === ASSET_REQUEST_STEPS.DOCUMENTS
                      ? t('assets.requestWizard.actions.addToQueue')
                      : t('assets.requestWizard.actions.next')
                  }
                  onPress={handleNext}
                  disabled={submitting}
                  compact
                />
              </View>
            </View>
          </View>
        </GlassCard>
      )}

    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  progressSection: {
    marginBottom: 16,
    gap: 10,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  progressStepLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  progressStepCount: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  reviewStepHeader: {
    marginBottom: 16,
    gap: 6,
  },
  reviewStepHint: {
    fontSize: 14,
    lineHeight: 20,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  submitError: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
  },
  formBlock: {
    gap: 14,
  },
  hint: {
    fontSize: 12,
    lineHeight: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  fieldError: {
    // color bound at runtime (theme-aware) — see JSX.
    fontSize: 12,
    fontWeight: '500',
  },
  textAreaHost: {
    gap: 8,
  },
  textAreaLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  textAreaWrap: {
    minHeight: 100,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  textAreaInput: {
    fontSize: 15,
    lineHeight: 22,
    minHeight: 80,
  },
  navFooter: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
  },
  navButtonWrap: {
    flex: 1,
    minWidth: 0,
  },
  navButtonWrapSingle: {
    flex: 1,
  },
  reviewActions: {
    gap: 12,
    marginTop: 4,
  },
  editingHint: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyQueue: {
    fontSize: 14,
    marginBottom: 14,
    textAlign: 'center',
  },
  queueItem: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 4,
    marginBottom: 10,
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    flexWrap: 'wrap',
  },
  queueTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  queueActions: {
    flexDirection: 'row',
    gap: 12,
  },
  queueAction: {
    fontSize: 12,
    fontWeight: '700',
  },
  queueMeta: {
    fontSize: 12,
    lineHeight: 16,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  docName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  successWrap: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  successBody: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 8,
  },
});

export default AssetSubmitWizard;
