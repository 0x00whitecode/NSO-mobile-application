import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import Button from './ui/Button';
import Card from './ui/Card';
import { useBackendIntegration } from '../hooks/useBackendIntegration';

interface LocationPermissionScreenProps {
  onPermissionGranted: () => void;
  onSkip?: () => void;
  showSkipOption?: boolean;
}

export default function LocationPermissionScreen({
  onPermissionGranted,
  onSkip,
  showSkipOption = true,
}: LocationPermissionScreenProps) {
  const [backendState, backendActions] = useBackendIntegration();
  const [isRequesting, setIsRequesting] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied' | 'never_ask_again'>('unknown');

  useEffect(() => {
    // Track screen view
    backendActions.trackScreen('location_permission', '/location-permission');
  }, [backendActions]);

  /**
   * Request location permission
   */
  const handleRequestPermission = async () => {
    try {
      setIsRequesting(true);
      
      // Track permission request attempt
      await backendActions.trackActivity({
        activityType: 'button_click',
        screen: { name: 'location_permission' },
        action: { name: 'request_location_permission', target: 'permission_button' },
      });

      const granted = await backendActions.requestLocationPermission();
      
      if (granted) {
        setPermissionStatus('granted');
        
        // Get current location to test
        const location = await backendActions.getCurrentLocation();
        
        if (location) {
          Alert.alert(
            'Location Access Granted',
            `Your location has been successfully detected.\n\nLatitude: ${location.latitude.toFixed(6)}\nLongitude: ${location.longitude.toFixed(6)}\nAccuracy: ${location.accuracy.toFixed(0)}m`,
            [
              {
                text: 'Continue',
                onPress: onPermissionGranted,
              },
            ]
          );
        } else {
          onPermissionGranted();
        }
      } else {
        setPermissionStatus('denied');
        showPermissionDeniedAlert();
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      await backendActions.trackError(
        error instanceof Error ? error.message : 'Permission request failed',
        'PERMISSION_REQUEST_ERROR'
      );
      
      Alert.alert(
        'Error',
        'Failed to request location permission. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsRequesting(false);
    }
  };

  /**
   * Show permission denied alert
   */
  const showPermissionDeniedAlert = () => {
    Alert.alert(
      'Location Permission Required',
      'NSO needs location access to provide better healthcare services and track facility visits. You can enable this in your device settings.',
      [
        {
          text: 'Open Settings',
          onPress: () => {
            Linking.openSettings();
            // Track settings navigation
            backendActions.trackActivity({
              activityType: 'button_click',
              screen: { name: 'location_permission' },
              action: { name: 'open_settings', target: 'settings_button' },
            });
          },
        },
        {
          text: 'Skip for Now',
          style: 'cancel',
          onPress: handleSkip,
        },
      ]
    );
  };

  /**
   * Handle skip permission
   */
  const handleSkip = () => {
    // Track skip action
    backendActions.trackActivity({
      activityType: 'button_click',
      screen: { name: 'location_permission' },
      action: { name: 'skip_location_permission', target: 'skip_button' },
    });

    if (onSkip) {
      onSkip();
    } else {
      onPermissionGranted();
    }
  };

  /**
   * Get permission status color
   */
  const getStatusColor = () => {
    switch (permissionStatus) {
      case 'granted':
        return Colors.success.main;
      case 'denied':
      case 'never_ask_again':
        return Colors.error.main;
      default:
        return Colors.neutral.main;
    }
  };

  /**
   * Get permission status text
   */
  const getStatusText = () => {
    switch (permissionStatus) {
      case 'granted':
        return 'Location access granted ✓';
      case 'denied':
        return 'Location access denied';
      case 'never_ask_again':
        return 'Location access permanently denied';
      default:
        return 'Location access not requested';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>📍 Location Access</Text>
          <Text style={styles.subtitle}>
            Help us provide better healthcare services
          </Text>
        </View>

        {/* Main Card */}
        <Card style={styles.mainCard}>
          <View style={styles.iconContainer}>
            <Text style={styles.locationIcon}>🗺️</Text>
          </View>

          <Text style={styles.cardTitle}>Why do we need your location?</Text>
          
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🏥</Text>
              <Text style={styles.benefitText}>
                Track facility visits and healthcare service usage
              </Text>
            </View>
            
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>📊</Text>
              <Text style={styles.benefitText}>
                Provide location-based healthcare analytics
              </Text>
            </View>
            
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🚨</Text>
              <Text style={styles.benefitText}>
                Enable emergency location services when needed
              </Text>
            </View>
            
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>📱</Text>
              <Text style={styles.benefitText}>
                Improve app functionality and user experience
              </Text>
            </View>
          </View>

          {/* Permission Status */}
          {permissionStatus !== 'unknown' && (
            <View style={[styles.statusContainer, { borderColor: getStatusColor() }]}>
              <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {getStatusText()}
              </Text>
            </View>
          )}

          {/* Privacy Note */}
          <View style={styles.privacyNote}>
            <Text style={styles.privacyText}>
              🔒 Your location data is encrypted and only used for healthcare service improvement. 
              We never share your location with third parties.
            </Text>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title={isRequesting ? 'Requesting...' : 'Allow Location Access'}
            onPress={handleRequestPermission}
            disabled={isRequesting || permissionStatus === 'granted'}
            style={[
              styles.primaryButton,
              permissionStatus === 'granted' && styles.successButton
            ]}
          />

          {showSkipOption && (
            <Button
              title="Skip for Now"
              onPress={handleSkip}
              variant="outline"
              style={styles.skipButton}
            />
          )}
        </View>

        {/* Help Text */}
        <Text style={styles.helpText}>
          You can change location permissions anytime in your device settings.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  mainCard: {
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  locationIcon: {
    fontSize: 64,
  },
  cardTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  benefitsList: {
    marginBottom: Spacing.lg,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  benefitIcon: {
    fontSize: 20,
    marginRight: Spacing.md,
    marginTop: 2,
  },
  benefitText: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    lineHeight: 24,
  },
  statusContainer: {
    borderWidth: 2,
    borderRadius: BorderRadius.base,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.neutral.lightest,
  },
  statusText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
  },
  privacyNote: {
    backgroundColor: Colors.neutral.lightest,
    padding: Spacing.md,
    borderRadius: BorderRadius.base,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary.main,
  },
  privacyText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  buttonContainer: {
    marginBottom: Spacing.lg,
  },
  primaryButton: {
    marginBottom: Spacing.md,
  },
  successButton: {
    backgroundColor: Colors.success.main,
  },
  skipButton: {
    borderColor: Colors.neutral.main,
  },
  helpText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
