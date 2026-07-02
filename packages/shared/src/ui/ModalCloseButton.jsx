import { useTranslation } from 'react-i18next';

/**
 * @param {{
 *   onClick: () => void,
 *   label?: string,
 *   className?: string,
 *   disabled?: boolean,
 * }} props
 */
export function ModalCloseButton({ onClick, label, className = '', disabled = false }) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      className={['modal-close-btn', className].filter(Boolean).join(' ')}
      onClick={onClick}
      aria-label={label || t('common.close')}
      disabled={disabled}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  );
}

export default ModalCloseButton;
