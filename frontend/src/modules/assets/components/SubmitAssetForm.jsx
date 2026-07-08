import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/Button.jsx';
import { Input } from '../../../components/Input.jsx';
import { FileUpload } from '../../../components/FileUpload.jsx';
import { ROUTES } from '../../../config/routes.js';
import { assetService } from '../services/asset-service.js';
import {
  ASSET_TYPE_KEYS,
  buildAssetPayload,
  buildEmptyAssetForm,
  getOwnershipDocType,
  OWNERSHIP_DOC_LABEL_KEYS,
  validateAssetForm,
} from '../utils/asset-form-utils.js';

const PDF_ACCEPT = 'application/pdf,image/jpeg,image/png,image/webp';

/**
 * @param {{ onSuccess?: () => void }} props
 */
export function SubmitAssetForm({ onSuccess }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const additionalInputRef = useRef(null);

  const [form, setForm] = useState(buildEmptyAssetForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploadingAdditional, setUploadingAdditional] = useState(false);

  const ownershipDocType = form.assetType ? getOwnershipDocType(form.assetType) : '';
  const ownershipDocLabelKey = ownershipDocType
    ? OWNERSHIP_DOC_LABEL_KEYS[ownershipDocType]
    : null;

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      delete next.form;
      return next;
    });
  };

  const handleAssetTypeChange = (event) => {
    const assetType = event.target.value;
    setForm((current) => ({
      ...current,
      assetType,
      ownershipDocumentUrl: current.ownershipDocumentUrl,
    }));
    setErrors((current) => {
      const next = { ...current };
      delete next.assetType;
      return next;
    });
  };

  const handleAdditionalFiles = async (event) => {
    const selected = Array.from(event.target.files || []);
    if (!selected.length) return;

    setUploadingAdditional(true);
    setErrors((current) => {
      const next = { ...current };
      delete next.additionalDocuments;
      return next;
    });

    try {
      const uploaded = await assetService.uploadFiles(selected, 'assets/documents');
      const docs = uploaded.map((entry, index) => ({
        name: selected[index]?.name || entry.fileName || entry.originalName || 'document',
        url: entry.fileUrl || entry.url || '',
        size: selected[index]?.size || entry.fileSize || 0,
      })).filter((doc) => doc.url);
      setForm((current) => ({
        ...current,
        additionalDocuments: [...current.additionalDocuments, ...docs],
      }));
    } catch (err) {
      setErrors((current) => ({
        ...current,
        additionalDocuments: err instanceof Error ? err.message : t('common.uploadFailed'),
      }));
    } finally {
      setUploadingAdditional(false);
      event.target.value = '';
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validateAssetForm(form, t);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const payload = buildAssetPayload(form);
      await assetService.create(payload);
      onSuccess?.();
      navigate(ROUTES.APP_MY_ASSETS, { replace: true });
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : t('assets.form.submitFailed') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="asset-submit-form" onSubmit={handleSubmit} noValidate>
      {errors.form && (
        <p className="kyc-drawer__error" role="alert">
          {errors.form}
        </p>
      )}

      <Input
        label={t('assets.form.fields.title')}
        value={form.title}
        onChange={(event) => updateField('title', event.target.value)}
        error={errors.title}
        disabled={loading}
      />

      <div className="input-field">
        <label className="input-field__label" htmlFor="asset-type">
          {t('assets.form.fields.assetType')}
        </label>
        <select
          id="asset-type"
          className={[
            'input-field__control',
            'auction-create-modal__select',
            errors.assetType ? 'input-field__control--error' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          value={form.assetType}
          onChange={handleAssetTypeChange}
          disabled={loading}
        >
          <option value="">{t('assets.form.placeholders.selectAssetType')}</option>
          {ASSET_TYPE_KEYS.map((key) => (
            <option key={key} value={key}>
              {t(`assets.types.${key}`)}
            </option>
          ))}
        </select>
        {errors.assetType && (
          <span className="input-field__error" role="alert">
            {errors.assetType}
          </span>
        )}
      </div>

      {ownershipDocLabelKey && (
        <p className="asset-submit-form__hint">
          {t('assets.form.hints.ownershipDoc', {
            document: t(`assets.ownershipDocs.${ownershipDocLabelKey}`),
          })}
        </p>
      )}

      <div className="input-field">
        <label className="input-field__label" htmlFor="asset-description">
          {t('assets.form.fields.description')}
        </label>
        <textarea
          id="asset-description"
          className="kyc-modal__textarea"
          rows={3}
          value={form.description}
          onChange={(event) => updateField('description', event.target.value)}
          disabled={loading}
        />
      </div>

      <Input
        label={t('assets.form.fields.location')}
        value={form.location ?? ''}
        onChange={(event) => updateField('location', event.target.value)}
        disabled={loading}
      />

      <Input
        label={t('assets.form.fields.address')}
        value={form.address ?? ''}
        onChange={(event) => updateField('address', event.target.value)}
        disabled={loading}
      />

      <FileUpload
        label={t('assets.form.fields.ownershipDocument')}
        folder="assets/ownership"
        accept={PDF_ACCEPT}
        disabled={loading || !form.assetType}
        onUpload={(result) => updateField(
          'ownershipDocumentUrl',
          result?.fileUrl || result?.url || '',
        )}
      />
      {errors.ownershipDocumentUrl && (
        <span className="input-field__error" role="alert">
          {errors.ownershipDocumentUrl}
        </span>
      )}

      <section className="asset-submit-form__section">
        <h3 className="kyc-drawer__section-title">{t('assets.form.fields.additionalDocuments')}</h3>
        <p className="asset-submit-form__hint">{t('assets.form.hints.additionalDocuments')}</p>
        <button
          type="button"
          className="auction-create-modal__browse-btn"
          onClick={() => additionalInputRef.current?.click()}
          disabled={loading || uploadingAdditional}
        >
          {uploadingAdditional ? t('common.uploading') : t('common.selectFile')}
        </button>
        <input
          ref={additionalInputRef}
          type="file"
          accept={PDF_ACCEPT}
          multiple
          hidden
          onChange={handleAdditionalFiles}
        />
        {form.additionalDocuments.length > 0 && (
          <ul className="auction-drawer__documents">
            {form.additionalDocuments.map((doc, index) => (
              <li key={`${doc.url}-${index}`} className="auction-drawer__document-item">
                <p className="auction-drawer__document-name">{doc.name}</p>
              </li>
            ))}
          </ul>
        )}
        {errors.additionalDocuments && (
          <span className="input-field__error" role="alert">
            {errors.additionalDocuments}
          </span>
        )}
      </section>

      <div className="asset-submit-form__actions">
        <Button type="submit" variant="primary" disabled={loading || uploadingAdditional}>
          {loading ? t('assets.form.submitting') : t('assets.form.submit')}
        </Button>
      </div>
    </form>
  );
}

export default SubmitAssetForm;
