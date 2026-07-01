import { useRef } from 'react';

const OTP_LENGTH = 6;

/**
 * @param {Object} props
 * @param {string[]} props.value
 * @param {function} props.onChange
 * @param {boolean} [props.disabled]
 */
export function OtpInputGrid({ value, onChange, disabled = false }) {
  const inputRefs = useRef([]);

  const focusInput = (index) => {
    inputRefs.current[index]?.focus();
  };

  const updateDigit = (index, digit) => {
    const next = [...value];
    next[index] = digit;
    onChange(next);
  };

  const handleChange = (index, event) => {
    const raw = event.target.value.replace(/\D/g, '');
    if (!raw) {
      updateDigit(index, '');
      return;
    }

    const digit = raw.slice(-1);
    updateDigit(index, digit);

    if (index < OTP_LENGTH - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace') {
      if (value[index]) {
        updateDigit(index, '');
        return;
      }
      if (index > 0) {
        updateDigit(index - 1, '');
        focusInput(index - 1);
      }
      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      focusInput(index - 1);
      return;
    }

    if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      focusInput(index + 1);
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) {
      return;
    }

    const next = Array.from({ length: OTP_LENGTH }, (_, index) => pasted[index] || '');
    onChange(next);

    const nextFocusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    focusInput(nextFocusIndex);
  };

  return (
    <div className="otp-input-grid" role="group" aria-label="One-time password verification code">
      {Array.from({ length: OTP_LENGTH }, (_, index) => (
        <input
          key={index}
          ref={(element) => {
            inputRefs.current[index] = element;
          }}
          className="otp-input-grid__cell"
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={value[index] || ''}
          onChange={(event) => handleChange(index, event)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          disabled={disabled}
          autoFocus={index === 0}
          aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
        />
      ))}
    </div>
  );
}

export default OtpInputGrid;
