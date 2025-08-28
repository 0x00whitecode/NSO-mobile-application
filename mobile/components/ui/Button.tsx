import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    ViewStyle,
} from 'react-native';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '../../constants/theme';
import { ensureMinTouchTarget, getOptimalButtonHeight } from '../../utils/responsive';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'text';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  onPress: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  onPress,
  children,
  style,
  textStyle,
}: ButtonProps) {
  const buttonStyles = getButtonStyles(variant, size, fullWidth, disabled, loading);

  return (
    <TouchableOpacity
      style={[buttonStyles.container, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={buttonStyles.text.color}
          style={styles.loader}
        />
      )}
      <Text style={[buttonStyles.text, textStyle]}>{children}</Text>
    </TouchableOpacity>
  );
}

function getButtonStyles(
  variant: string,
  size: string,
  fullWidth: boolean,
  disabled: boolean,
  loading: boolean
) {
  const baseContainer: ViewStyle = {
    borderRadius: BorderRadius.base,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    width: fullWidth ? '100%' : undefined,
    opacity: disabled ? 0.6 : 1,
  };

  const baseText: TextStyle = {
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
  };

  // Size variations with mobile-optimized heights
  const sizeStyles = {
    small: {
      container: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.base,
        height: ensureMinTouchTarget(40),
      },
      text: {
        fontSize: Typography.fontSize.sm,
      },
    },
    medium: {
      container: {
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        height: getOptimalButtonHeight(),
      },
      text: {
        fontSize: Typography.fontSize.base,
      },
    },
    large: {
      container: {
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing.xl,
        height: ensureMinTouchTarget(56),
      },
      text: {
        fontSize: Typography.fontSize.lg,
      },
    },
  };

  // Variant styles
  const variantStyles = {
    primary: {
      container: {
        backgroundColor: Colors.primary.main,
        ...Shadows.base,
      },
      text: {
        color: Colors.text.light,
      },
    },
    secondary: {
      container: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: Colors.primary.main,
      },
      text: {
        color: Colors.primary.main,
      },
    },
    danger: {
      container: {
        backgroundColor: Colors.status.error,
        ...Shadows.base,
      },
      text: {
        color: Colors.text.light,
      },
    },
    text: {
      container: {
        backgroundColor: 'transparent',
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.sm,
      },
      text: {
        color: Colors.primary.main,
      },
    },
    outline: {
      container: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: Colors.primary.main,
      },
      text: {
        color: Colors.primary.main,
      },
    },
  };

  const currentSize = sizeStyles[size as keyof typeof sizeStyles] || sizeStyles.medium;
  const currentVariant = variantStyles[variant as keyof typeof variantStyles] || variantStyles.primary;

  return {
    container: {
      ...baseContainer,
      ...currentSize.container,
      ...currentVariant.container,
    },
    text: {
      ...baseText,
      ...currentSize.text,
      ...currentVariant.text,
    },
  };
}

const styles = StyleSheet.create({
  loader: {
    marginRight: Spacing.sm,
  },
});
