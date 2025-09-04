import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { locationService, LocationData } from '../services/locationService';
import Button from './ui/Button';
import { Colors, Spacing, Typography } from '../constants/theme';

interface LocationTestScreenProps {
  onBack: () => void;
}

const LocationTestScreen: React.FC<LocationTestScreenProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const [servicesEnabled, setServicesEnabled] = useState<boolean | null>(null);

  const checkPermissions = async () => {
    try {
      setLoading(true);
      const permission = await locationService.requestLocationPermission();
      setPermissionStatus(permission.status);
      
      Alert.alert(
        'Permission Status',
        `Status: ${permission.status}\nGranted: ${permission.granted}\nCan Ask Again: ${permission.canAskAgain}`
      );
    } catch (error) {
      console.error('Permission check failed:', error);
      Alert.alert('Error', 'Failed to check permissions');
    } finally {
      setLoading(false);
    }
  };

  const checkLocationServices = async () => {
    try {
      setLoading(true);
      const available = await locationService.isLocationAvailable();
      setServicesEnabled(available);
      
      Alert.alert(
        'Location Services',
        available ? 'Location services are available' : 'Location services are not available'
      );
    } catch (error) {
      console.error('Location services check failed:', error);
      Alert.alert('Error', 'Failed to check location services');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      const currentLocation = await locationService.getCurrentLocation();
      setLocation(currentLocation);
      
      if (currentLocation) {
        Alert.alert(
          'Location Retrieved',
          `Latitude: ${currentLocation.latitude.toFixed(6)}\nLongitude: ${currentLocation.longitude.toFixed(6)}\nAccuracy: ${currentLocation.accuracy.toFixed(0)}m`
        );
      } else {
        Alert.alert('No Location', 'Could not retrieve current location');
      }
    } catch (error) {
      console.error('Get location failed:', error);
      Alert.alert('Error', 'Failed to get current location');
    } finally {
      setLoading(false);
    }
  };

  const getLocationWithFallback = async () => {
    try {
      setLoading(true);
      const fallbackLocation = await locationService.getLocationWithFallback();
      setLocation(fallbackLocation);
      
      if (fallbackLocation) {
        Alert.alert(
          'Location Retrieved (with fallback)',
          `Latitude: ${fallbackLocation.latitude.toFixed(6)}\nLongitude: ${fallbackLocation.longitude.toFixed(6)}\nAccuracy: ${fallbackLocation.accuracy.toFixed(0)}m`
        );
      } else {
        Alert.alert('No Location', 'Could not retrieve location even with fallback');
      }
    } catch (error) {
      console.error('Get location with fallback failed:', error);
      Alert.alert('Error', 'Failed to get location with fallback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Location Service Test</Text>
        <Text style={styles.subtitle}>Test the location functionality</Text>
      </View>

      <View style={styles.statusSection}>
        <Text style={styles.sectionTitle}>Status</Text>
        <Text style={styles.statusText}>Permission: {permissionStatus}</Text>
        <Text style={styles.statusText}>
          Services: {servicesEnabled === null ? 'unknown' : servicesEnabled ? 'enabled' : 'disabled'}
        </Text>
        {location && (
          <View style={styles.locationInfo}>
            <Text style={styles.statusText}>Last Location:</Text>
            <Text style={styles.locationText}>
              Lat: {location.latitude.toFixed(6)}
            </Text>
            <Text style={styles.locationText}>
              Lng: {location.longitude.toFixed(6)}
            </Text>
            <Text style={styles.locationText}>
              Accuracy: {location.accuracy.toFixed(0)}m
            </Text>
            <Text style={styles.locationText}>
              Time: {new Date(location.timestamp).toLocaleTimeString()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.buttonSection}>
        <Button
          variant="primary"
          size="large"
          loading={loading}
          onPress={checkPermissions}
          style={styles.button}
        >
          Check Permissions
        </Button>

        <Button
          variant="secondary"
          size="large"
          loading={loading}
          onPress={checkLocationServices}
          style={styles.button}
        >
          Check Location Services
        </Button>

        <Button
          variant="primary"
          size="large"
          loading={loading}
          onPress={getCurrentLocation}
          style={styles.button}
        >
          Get Current Location
        </Button>

        <Button
          variant="secondary"
          size="large"
          loading={loading}
          onPress={getLocationWithFallback}
          style={styles.button}
        >
          Get Location (with fallback)
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
  statusSection: {
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
  statusText: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  locationInfo: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderRadius: 8,
  },
  locationText: {
    ...Typography.body.small,
    color: Colors.text.primary,
    fontFamily: 'monospace',
  },
  buttonSection: {
    padding: Spacing.lg,
  },
  button: {
    marginBottom: Spacing.md,
  },
});

export default LocationTestScreen;
