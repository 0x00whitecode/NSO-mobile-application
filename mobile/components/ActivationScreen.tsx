import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  ActivityIndicator
} from 'react-native';
import { Colors, Spacing, Typography } from '../constants/theme';
import { apiService } from '../services/apiService';
import Button from './ui/Button';
import { StatusCard } from './ui/Card';
import Input from './ui/Input';

interface ActivationScreenProps {
  onActivationComplete: (activationKey: string) => void;
}

export default function ActivationScreen({ onActivationComplete }: ActivationScreenProps) {
  const [activationKey, setActivationKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inputError, setInputError] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const inputRef = useRef<TextInput>(null);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Check network connectivity
    checkNetworkConnectivity();
  }, [fadeAnim, slideAnim]);

  const checkNetworkConnectivity = async () => {
    try {
      // Simple network check - try to fetch a small resource
      const response = await fetch('https://httpbin.org/status/200', {
        method: 'HEAD',
        timeout: 5000
      });
      setIsOnline(response.ok);
    } catch (error) {
      console.log('Network connectivity check failed:', error);
      setIsOnline(false);
    }
  };

  const handleActivation = async () => {
    if (!activationKey.trim()) {
      setInputError('Please enter an activation key');
      return;
    }

    // Clear any previous errors
    setInputError('');

    // Normalize key: strip non-numeric characters
    const normalizedKey = activationKey.replace(/\D/g, '');

    // Reflect normalization in the input field (format as XXXX-XXXX-XXXX for display)
    const displayKey = normalizedKey.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3'); // display only
    if (displayKey !== activationKey && normalizedKey.length === 12) {
      setActivationKey(displayKey);
    }

    // Validate key format - 12 digits
    if (normalizedKey.length !== 12 || !/^\d{12}$/.test(normalizedKey)) {
      setInputError('Invalid activation key format. Please enter a 12-digit numeric key.');
      return;
    }

    setIsLoading(true);

    try {
      let response;

      // Online activation via backend
      response = await apiService.activateDevice(normalizedKey);

      if (response.success && response.data) {
        onActivationComplete(normalizedKey);
        return;
      } else {
        let errorMessage = 'Activation failed. Please check your key and try again.';

        switch (response.code) {
          case 'KEY_EXPIRED':
            errorMessage = 'This activation key has expired. Please contact your administrator for a new key.';
            break;
          case 'KEY_REVOKED':
            errorMessage = 'This activation key has been revoked. Please contact your administrator for a new key.';
            break;
          case 'USAGE_LIMIT_EXCEEDED':
            errorMessage = 'This activation key usage limit has been exceeded. Please contact your administrator for a new key.';
            break;
          case 'DEVICE_ALREADY_ACTIVATED':
            errorMessage = 'This device is already activated. Please use the login screen instead.';
            break;
          case 'INVALID_KEY_FORMAT':
            errorMessage = 'Invalid activation key format. Please check your key and try again.';
            break;
          case 'DECRYPTION_FAILED':
            errorMessage = 'Failed to decrypt activation key. Please check your key and try again.';
            break;
          case 'NETWORK_ERROR':
            errorMessage = 'Network connection error. Please check your internet connection and try again.';
            break;
          case 'INVALID_ACTIVATION_KEY':
            errorMessage = 'Invalid activation key. Please check your key and try again.';
            break;
          case 'ACTIVATION_KEY_NOT_VALID':
            errorMessage = 'This activation key is not valid or has been used. Please contact your administrator.';
            break;
        }

        setInputError(errorMessage);
      }
    } catch (error) {
      console.error('Activation error:', error);
      setInputError('An error occurred during activation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatActivationKey = (text: string) => {
    // Remove any non-alphanumeric characters and convert to uppercase
    const cleaned = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    
    // Add dashes every 4 characters for better readability
    const formatted = cleaned.replace(/(.{4})/g, '$1-').replace(/-$/, '');
    
    return formatted;
  };

  const handleKeyChange = (text: string) => {
    // Clear error when user starts typing
    if (inputError) {
      setInputError('');
    }

    // Remove non-numeric characters
    const cleaned = text.replace(/\D/g, '');

    // Limit to 12 digits
    const limited = cleaned.substring(0, 12);

    // Format as XXXX-XXXX-XXXX for display
    let formatted = limited;
    if (limited.length > 4) {
      formatted = limited.substring(0, 4) + '-' + limited.substring(4);
    }
    if (limited.length > 8) {
      formatted = limited.substring(0, 4) + '-' + limited.substring(4, 8) + '-' + limited.substring(8);
    }

    setActivationKey(formatted);
  };

  const handleInputFocus = () => {
    setInputError('');
  };

  const handleInputBlur = () => {
    // Validate on blur
    if (activationKey && activationKey.length > 0) {
      const cleanKey = activationKey.replace(/\D/g, '');

      if (cleanKey.length !== 12) {
        setInputError('Invalid activation key format. Please enter a 12-digit numeric key.');
      }
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <StatusBar barStyle="light-content" backgroundColor={Colors.primary.dark} />
        <LinearGradient
          colors={Colors.background.gradient}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View
              style={[
                styles.content,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <View style={styles.logoWrapper}>
                    <Image
                      source={require('../assets/images/logo1.jpeg')}
                      style={styles.logo1}
                      resizeMode="contain"
                    />
                    <Image
                      source={require('../assets/images/logo2.jpeg')}
                      style={styles.logo2}
                      resizeMode="contain"
                    />
                  </View>
                </View>
              </View>

              {/* Activation Form */}
              <View style={styles.formContainer}>
                <Input
                  ref={inputRef}
                  label="Activation Key"
                  value={activationKey}
                  onChangeText={handleKeyChange}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  placeholder="123456789012"
                  keyboardType="numeric"
                  autoCorrect={false}
                  maxLength={14}
                  editable={!isLoading}
                  required
                  error={inputError}
                  containerStyle={styles.inputContainer}
                  inputStyle={styles.activationInput}
                />

                {/* Network Status */}
                {!isOnline && (
                  <StatusCard status="warning" style={styles.networkStatus}>
                    <Text style={styles.networkText}>
                      ⚠️ No internet connection. Activation requires internet. Please connect to proceed.
                    </Text>
                  </StatusCard>
                )}

                {/* Security Info */}
                <StatusCard status="info" style={styles.securityInfo}>
                  <Text style={styles.securityTitle}>Security Features:</Text>
                  <View style={styles.securityItem}>
                    <Text style={styles.securityBullet}>🔐</Text>
                    <Text style={styles.securityText}>One device per activation</Text>
                  </View>
                  <View style={styles.securityItem}>
                    <Text style={styles.securityBullet}>🔒</Text>
                    <Text style={styles.securityText}>Keys securely encrypted</Text>
                  </View>
                  <View style={styles.securityItem}>
                    <Text style={styles.securityBullet}>⏰</Text>
                    <Text style={styles.securityText}>Validity duration built-in</Text>
                  </View>
                  <View style={styles.securityItem}>
                    <Text style={styles.securityBullet}>📱</Text>
                    <Text style={styles.securityText}>Activation is performed online</Text>
                  </View>
                </StatusCard>

                {/* Activation Button */}
                <Button
                  variant="primary"
                  size="large"
                  loading={isLoading}
                  onPress={handleActivation}
                  fullWidth
                  style={styles.activateButton}
                  disabled={!activationKey.trim() || isLoading}
                >
                  {isLoading ? 'Activating...' : 'Activate'}
                </Button>

                {/* Help Text */}
                <Text style={styles.helpText}>
                  Don't have an activation key? Contact your administrator or supervisor 
                  for assistance.
                </Text>
              </View>
            </Animated.View>
          </ScrollView>

          {/* Decorative Elements */}
          <View style={styles.decorativeElements}>
            <View style={[styles.circle, styles.circle1]} />
            <View style={[styles.circle, styles.circle2]} />
          </View>
        </LinearGradient>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  iconContainer: {
    marginBottom: Spacing.lg,
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logo1: {
    width: 60,
    height: 60,
    marginRight: 8,
    borderRadius: 8,
  },
  logo2: {
    width: 60,
    height: 60,
    marginLeft: 8,
    borderRadius: 8,
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.light,
    textAlign: 'center',
    marginBottom: Spacing.base,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.normal * Typography.fontSize.base,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  activationInput: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: Typography.fontSize.lg,
    letterSpacing: 2,
    textAlign: 'center',
  },
  networkStatus: {
    marginBottom: Spacing.lg,
  },
  networkText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.warning.main,
    textAlign: 'center',
  },
  securityInfo: {
    marginBottom: Spacing.lg,
  },
  securityTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary.main,
    marginBottom: Spacing.sm,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  securityBullet: {
    fontSize: Typography.fontSize.base,
    marginRight: Spacing.sm,
  },
  securityText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
  },
  activateButton: {
    marginBottom: Spacing.lg,
  },
  helpText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.normal * Typography.fontSize.sm,
  },
  decorativeElements: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: -1,
  },
  circle: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  circle1: {
    width: 150,
    height: 150,
    top: -75,
    right: -75,
  },
  circle2: {
    width: 100,
    height: 100,
    bottom: -50,
    left: -50,
  },
});
