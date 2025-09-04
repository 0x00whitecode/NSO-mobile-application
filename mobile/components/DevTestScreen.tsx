import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { UserStorage } from '../utils/userStorage';
import Button from './ui/Button';
import { Colors, Spacing, Typography } from '../constants/theme';

interface DevTestScreenProps {
  onBack: () => void;
}

const DevTestScreen: React.FC<DevTestScreenProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);

  const checkUserStatus = async () => {
    try {
      setLoading(true);
      const isFirstTime = await UserStorage.isFirstTimeUser();
      const isSetupComplete = await UserStorage.isUserSetupComplete();
      const hasOnboarded = await UserStorage.hasCompletedOnboarding();
      const profile = await UserStorage.getUserProfile();
      const deviceInfo = await UserStorage.getDeviceInfo();
      const isActivated = await UserStorage.isDeviceActivated();

      setStatus({
        isFirstTime,
        isSetupComplete,
        hasOnboarded,
        hasProfile: !!profile,
        isActivated,
        profileData: profile,
        deviceData: deviceInfo,
      });
    } catch (error) {
      console.error('Status check failed:', error);
      Alert.alert('Error', 'Failed to check user status');
    } finally {
      setLoading(false);
    }
  };

  const resetApp = async () => {
    Alert.alert(
      'Reset App',
      'This will clear all data and reset the app to first-time user state. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await UserStorage.resetToFirstTimeUser();
              Alert.alert(
                'App Reset',
                'App has been reset. Please restart the app to see the onboarding flow.',
                [{ text: 'OK', onPress: onBack }]
              );
            } catch (error) {
              console.error('Reset failed:', error);
              Alert.alert('Error', 'Failed to reset app');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const clearUserData = async () => {
    Alert.alert(
      'Clear User Data',
      'This will clear user profile and activation data but keep app settings. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await UserStorage.clearUserData();
              Alert.alert('Data Cleared', 'User data has been cleared.');
              await checkUserStatus(); // Refresh status
            } catch (error) {
              console.error('Clear failed:', error);
              Alert.alert('Error', 'Failed to clear user data');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Developer Test Screen</Text>
        <Text style={styles.subtitle}>Test app state and reset functionality</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Status</Text>
        {status && (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>First Time User: {status.isFirstTime ? 'Yes' : 'No'}</Text>
            <Text style={styles.statusText}>Setup Complete: {status.isSetupComplete ? 'Yes' : 'No'}</Text>
            <Text style={styles.statusText}>Has Onboarded: {status.hasOnboarded ? 'Yes' : 'No'}</Text>
            <Text style={styles.statusText}>Has Profile: {status.hasProfile ? 'Yes' : 'No'}</Text>
            <Text style={styles.statusText}>Is Activated: {status.isActivated ? 'Yes' : 'No'}</Text>
            
            {status.profileData && (
              <View style={styles.dataContainer}>
                <Text style={styles.dataTitle}>Profile Data:</Text>
                <Text style={styles.dataText}>Name: {status.profileData.fullName}</Text>
                <Text style={styles.dataText}>Role: {status.profileData.role}</Text>
                <Text style={styles.dataText}>Facility: {status.profileData.facility}</Text>
                <Text style={styles.dataText}>State: {status.profileData.state}</Text>
              </View>
            )}
            
            {status.deviceData && (
              <View style={styles.dataContainer}>
                <Text style={styles.dataTitle}>Device Data:</Text>
                <Text style={styles.dataText}>Activated: {status.deviceData.isActivated ? 'Yes' : 'No'}</Text>
                <Text style={styles.dataText}>Device ID: {status.deviceData.deviceId}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.buttonSection}>
        <Button
          variant="primary"
          size="large"
          loading={loading}
          onPress={checkUserStatus}
          style={styles.button}
        >
          Check User Status
        </Button>

        <Button
          variant="secondary"
          size="large"
          loading={loading}
          onPress={clearUserData}
          style={styles.button}
        >
          Clear User Data
        </Button>

        <Button
          variant="outline"
          size="large"
          loading={loading}
          onPress={resetApp}
          style={styles.button}
        >
          Reset App (Full Reset)
        </Button>

        <Button
          variant="outline"
          size="large"
          onPress={onBack}
          style={styles.button}
        >
          Back
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  title: {
    ...Typography.heading.h2,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  section: {
    margin: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
  },
  sectionTitle: {
    ...Typography.heading.h4,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  statusContainer: {
    gap: Spacing.xs,
  },
  statusText: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
  },
  dataContainer: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderRadius: 8,
  },
  dataTitle: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  dataText: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    fontFamily: 'monospace',
  },
  buttonSection: {
    padding: Spacing.lg,
  },
  button: {
    marginBottom: Spacing.md,
  },
});

export default DevTestScreen;
