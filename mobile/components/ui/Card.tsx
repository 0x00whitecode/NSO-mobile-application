import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';

interface CardProps {
  variant?: 'standard' | 'elevated' | 'outlined';
  padding?: 'none' | 'small' | 'medium' | 'large';
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  disabled?: boolean;
}

export default function Card({
  variant = 'standard',
  padding = 'medium',
  children,
  style,
  onPress,
  disabled = false,
}: CardProps) {
  const cardStyles = getCardStyles(variant, padding);
  
  const Container = onPress ? TouchableOpacity : View;
  
  return (
    <Container
      style={[cardStyles, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={onPress ? 0.8 : 1}
    >
      {children}
    </Container>
  );
}

function getCardStyles(variant: string, padding: string) {
  const baseStyle: ViewStyle = {
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background.primary,
  };

  const paddingStyles = {
    none: {},
    small: { padding: Spacing.sm },
    medium: { padding: Spacing.base },
    large: { padding: Spacing.lg },
  };

  const variantStyles = {
    standard: {
      borderWidth: 1,
      borderColor: Colors.border.light,
      ...Shadows.sm,
    },
    elevated: {
      borderWidth: 0,
      ...Shadows.lg,
    },
    outlined: {
      borderWidth: 2,
      borderColor: Colors.border.medium,
    },
  };

  return {
    ...baseStyle,
    ...paddingStyles[padding as keyof typeof paddingStyles],
    ...variantStyles[variant as keyof typeof variantStyles],
  };
}

// Status Card Component
interface StatusCardProps {
  status: 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
  style?: ViewStyle;
}

export function StatusCard({ status, children, style }: StatusCardProps) {
  const statusStyles = {
    success: {
      backgroundColor: Colors.background.success,
      borderColor: Colors.secondary.light,
    },
    warning: {
      backgroundColor: Colors.background.warning,
      borderColor: '#FFE0B2',
    },
    error: {
      backgroundColor: Colors.background.error,
      borderColor: '#FFCDD2',
    },
    info: {
      backgroundColor: Colors.background.info,
      borderColor: Colors.primary.light,
    },
  };

  return (
    <View style={[
      styles.statusCard,
      statusStyles[status],
      style
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  statusCard: {
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    padding: Spacing.base,
    marginVertical: Spacing.sm,
  },
});
