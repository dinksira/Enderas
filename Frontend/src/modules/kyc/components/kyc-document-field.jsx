import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * @param {{ label: string, accept?: string, value?: string, onChange: (url: string) => void, error?: string }} props
 */
export function KYCDocumentField({ label, accept = 'image/*,.pdf', value, onChange, error }) {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const fieldId = `kyc-doc-${label.replace(/\s+/g, '-').toLowerCase()}`;

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      onChange('');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="kyc-doc-field">
      <label className="kyc-doc-field__label" htmlFor={fieldId}>
        {label}
      </label>
      <div className="kyc-doc-field__control">
        <input
          ref={inputRef}
          id={fieldId}
          type="file"
          accept={accept}
          className="kyc-doc-field__input"
          onChange={handleFileChange}
          aria-invalid={error ? 'true' : undefined}
        />
        <button
          type="button"
          className="kyc-doc-field__button"
          onClick={() => inputRef.current?.click()}
        >
          {value ? t('kyc.changeFile') : t('kyc.uploadFile')}
        </button>
        {value && (
          <span className="kyc-doc-field__status">{t('kyc.fileReady')}</span>
        )}
      </div>
      {error && (
        <span className="kyc-doc-field__error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

export default KYCDocumentField;
