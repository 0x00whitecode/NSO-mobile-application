import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '../../constants/theme';

interface DropdownOption {
  label: string;
  value: string;
  icon?: string;
}

interface DropdownProps {
  label?: string;
  placeholder?: string;
  options: DropdownOption[];
  value?: string;
  onSelect: (option: DropdownOption) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  containerStyle?: ViewStyle;
  dropdownStyle?: ViewStyle;
}

export default function Dropdown({
  label,
  placeholder = 'Select an option',
  options,
  value,
  onSelect,
  error,
  required,
  disabled = false,
  containerStyle,
  dropdownStyle,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(option => option.value === value);

  const handleSelect = (option: DropdownOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(option);
    setIsOpen(false);
  };

  const getBorderColor = () => {
    if (error) return Colors.border.error;
    if (isOpen) return Colors.border.focus;
    return Colors.border.light;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <TouchableOpacity
        style={[
          styles.dropdown,
          {
            borderColor: getBorderColor(),
            backgroundColor: disabled ? Colors.neutral.light : Colors.background.primary,
          },
          dropdownStyle,
        ]}
        onPress={() => {
          if (!disabled) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsOpen(true);
          }
        }}
        disabled={disabled}
      >
        <View style={styles.selectedContainer}>
          {selectedOption?.icon && (
            <Text style={styles.icon}>{selectedOption.icon}</Text>
          )}
          <Text style={[
            styles.selectedText,
            !selectedOption && styles.placeholderText
          ]}>
            {selectedOption?.label || placeholder}
          </Text>
        </View>
        
        <Text style={[
          styles.arrow,
          { transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }
        ]}>
          ▼
        </Text>
      </TouchableOpacity>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.optionsContainer}>
              <FlatList
                data={options}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.option,
                      item.value === value && styles.selectedOption
                    ]}
                    onPress={() => handleSelect(item)}
                  >
                    {item.icon && (
                      <Text style={styles.optionIcon}>{item.icon}</Text>
                    )}
                    <Text style={[
                      styles.optionText,
                      item.value === value && styles.selectedOptionText
                    ]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

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
  dropdown: {
    borderWidth: 2,
    borderRadius: BorderRadius.base,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    ...Shadows.sm,
  },
  selectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: Typography.fontSize.lg,
    marginRight: Spacing.sm,
  },
  selectedText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    flex: 1,
  },
  placeholderText: {
    color: Colors.text.disabled,
  },
  arrow: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginLeft: Spacing.sm,
  },
  errorText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.status.error,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    maxHeight: '60%',
  },
  optionsContainer: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    ...Shadows.lg,
    maxHeight: 300,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    minHeight: 48,
  },
  selectedOption: {
    backgroundColor: Colors.primary.lightest,
  },
  optionIcon: {
    fontSize: Typography.fontSize.lg,
    marginRight: Spacing.sm,
  },
  optionText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    flex: 1,
  },
  selectedOptionText: {
    color: Colors.primary.main,
    fontWeight: Typography.fontWeight.medium,
  },
});
