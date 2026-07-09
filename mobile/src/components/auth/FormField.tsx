import { forwardRef, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useTheme } from '@/lib/appStore';
import { GLASS_RADIUS } from '@/lib/glassStyles';
import { GlassSurface } from '@/components/shell/GlassSurface';
import { useAuthStyles } from './authStyles';

export type FormFieldKeyboardType = 'default' | 'email-address' | 'phone-pad' | 'numeric';

export interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  error?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: FormFieldKeyboardType;
  onToggleSecure?: () => void;
  returnKeyType?: 'next' | 'go' | 'done' | 'search' | 'send';
  onSubmitEditing?: () => void;
  textContentType?:
    | 'emailAddress'
    | 'password'
    | 'newPassword'
    | 'telephoneNumber'
    | 'name'
    | 'organizationName'
    | 'none';
  autoComplete?: 'off' | 'email' | 'password' | 'password-new' | 'tel' | 'name' | 'organization';
  blurOnSubmit?: boolean;
  editable?: boolean;
}

export const FormField = forwardRef<TextInput, FormFieldProps>(function FormField(
  {
    label,
    value,
    onChangeText,
    placeholder,
    secureTextEntry,
    error,
    autoCapitalize,
    keyboardType,
    onToggleSecure,
    returnKeyType,
    onSubmitEditing,
    textContentType,
    autoComplete,
    blurOnSubmit,
    editable = true,
  },
  ref,
) {
  const authStyles = useAuthStyles();
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={authStyles.fieldContainer}>
      <Text style={authStyles.fieldLabel}>{label}</Text>
      <GlassSurface
        borderRadius={GLASS_RADIUS.input}
        active={focused && !error}
        padding={0}
        contentStyle={[
          authStyles.fieldInputWrapper,
          !!error && authStyles.fieldInputWrapperError,
        ]}
      >
        <TextInput
          ref={ref}
          style={authStyles.fieldInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize ?? 'none'}
          autoCorrect={false}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          textContentType={textContentType}
          autoComplete={autoComplete}
          blurOnSubmit={blurOnSubmit}
          editable={editable}
        />
        {onToggleSecure && (
          <TouchableOpacity style={authStyles.passwordToggle} onPress={onToggleSecure} activeOpacity={0.7}>
            <Text style={authStyles.passwordToggleText}>{secureTextEntry ? 'SHOW' : 'HIDE'}</Text>
          </TouchableOpacity>
        )}
      </GlassSurface>
      {error ? <Text style={authStyles.fieldError}>{error}</Text> : null}
    </View>
  );
});

export default FormField;
