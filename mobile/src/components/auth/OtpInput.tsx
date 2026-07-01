import { useEffect, useRef } from 'react';
import { Text, TextInput, View } from 'react-native';

import { GLASS_RADIUS } from '@/lib/glassStyles';
import { GlassSurface } from '@/components/shell/GlassSurface';
import { useAuthStyles } from './authStyles';

const OTP_LENGTH = 6;

const otpInputStyle = {
  position: 'absolute' as const,
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
  color: 'transparent',
  backgroundColor: 'transparent',
};

export function OtpInput({
  value,
  onChange,
  onComplete,
  error,
  autoFocus = true,
}: {
  value: string;
  onChange: (next: string) => void;
  onComplete?: (next: string) => void;
  error?: boolean;
  autoFocus?: boolean;
}) {
  const authStyles = useAuthStyles();
  const digits = value.padEnd(OTP_LENGTH, ' ').slice(0, OTP_LENGTH).split('');
  const onCompleteRef = useRef(onComplete);
  const completedRef = useRef(false);

  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (value.length === OTP_LENGTH) {
      if (!completedRef.current) {
        completedRef.current = true;
        onCompleteRef.current?.(value);
      }
      return;
    }

    completedRef.current = false;
  }, [value]);

  const handleChange = (text: string) => {
    const sanitized = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
    onChange(sanitized);
  };

  return (
    <View style={authStyles.otpContainer}>
      <View style={authStyles.otpInputWrapper}>
        {digits.map((d, i) => {
          const isFilled = d !== ' ';
          const isActive = i === value.length;
          return (
            <GlassSurface
              key={i}
              flat
              borderRadius={GLASS_RADIUS.input}
              active={isActive && !error}
              padding={0}
              contentStyle={[
                authStyles.otpBox,
                !!error && authStyles.otpBoxError,
              ]}
            >
              <Text style={authStyles.otpBoxText}>{isFilled ? d : ''}</Text>
            </GlassSurface>
          );
        })}
        <TextInput
          style={otpInputStyle}
          value={value}
          onChangeText={handleChange}
          keyboardType="numeric"
          textContentType="oneTimeCode"
          autoFocus={autoFocus}
          maxLength={OTP_LENGTH}
          caretHidden
          autoComplete="sms-otp"
        />
      </View>
    </View>
  );
}

export default OtpInput;
