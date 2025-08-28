import React, { forwardRef, useState } from 'react';
import {
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    TextStyle,
    View,
    ViewStyle,
} from 'react-native';
import { BorderRadius, Colors, Spacing, Typography } from '../../constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  success?: boolean;
  helperText?: string;
  required?: boolean;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
}

const Input = forwardRef<TextInput, InputProps>(({
  label,
  error,
  success,
  helperText,
  required,
  containerStyle,
  inputStyle,
  labelStyle,
  onFocus,
  onBlur,
  ...textInputProps
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const getBorderColor = () => {
    if (error) return Colors.border.error;
    if (success) return Colors.border.success;
    if (isFocused) return Colors.border.focus;
    return Colors.border.light;
  };

  const getBackgroundColor = () => {
    if (textInputProps.editable === false) return Colors.neutral.light;
    return Colors.background.primary;
  };

  // Platform-specific styles
  const getPlatformStyles = () => {
    if (Platform.OS === 'ios') {
      return {
        inputContainer: {
          shadowColor: Colors.shadow.light,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        },
        input: {
          lineHeight: Typography.fontSize.base * 1.2,
        }
      };
    } else if (Platform.OS === 'android') {
      return {
        inputContainer: {
          elevation: 1,
        },
        input: {
          textAlignVertical: 'center' as const,
        }
      };
    }
    return {};
  };

  const platformStyles = getPlatformStyles();

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, labelStyle]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <View style={[
        styles.inputContainer,
        platformStyles.inputContainer,
        {
          borderColor: getBorderColor(),
          backgroundColor: getBackgroundColor(),
          borderWidth: isFocused ? 2 : 1,
        }
      ]}>
        <TextInput
          ref={ref}
          style={[styles.input, platformStyles.input, inputStyle]}
          placeholderTextColor={Colors.text.disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoComplete="off"
          autoCorrect={false}
          spellCheck={false}
          {...textInputProps}
        />
        
        {success && !error && (
          <Text style={styles.successIcon}>✓</Text>
        )}
      </View>
      
      {(error || helperText) && (
        <Text style={[
          styles.helperText,
          error ? styles.errorText : styles.normalHelperText
        ]}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
});

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.base,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  required: {
    color: Colors.status.error,
  },
  inputContainer: {
    borderRadius: BorderRadius.base,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    minHeight: 56, // Increased for better mobile touch
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    paddingVertical: Spacing.base,
    paddingHorizontal: 0,
    minHeight: 20, // Ensure minimum height for text
  },
  successIcon: {
    fontSize: Typography.fontSize.lg,
    color: Colors.status.success,
    marginLeft: Spacing.sm,
  },
  helperText: {
    fontSize: Typography.fontSize.xs,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
    lineHeight: Typography.fontSize.xs * 1.4,
  },
  errorText: {
    color: Colors.status.error,
  },
  normalHelperText: {
    color: Colors.text.secondary,
  },
});

export default Input;
