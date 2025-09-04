import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import {
    Alert,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Colors, Spacing, Typography } from '../constants/theme';
import { locationService } from '../services/locationService';
import Button from './ui/Button';
import Dropdown from './ui/Dropdown';
import Input from './ui/Input';

interface RegistrationScreenProps {
  onRegistrationComplete: (userData: UserData) => void;
}

interface UserData {
  fullName: string;
  role: string;
  facility: string;
  state: string;
  contactInfo: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

const roles = [
  { label: 'Doctor', value: 'doctor', icon: '👨‍⚕️' },
  { label: 'Nurse', value: 'nurse', icon: '👩‍⚕️' },
  { label: 'Community Health Worker', value: 'chw', icon: '🏥' },
  { label: 'Midwife', value: 'midwife', icon: '🤱' },
  { label: 'Medical Assistant', value: 'assistant', icon: '🩺' },
  { label: 'Other Healthcare Worker', value: 'other', icon: '📋' },
];

const facilities = [
  { label: 'General Hospital', value: 'general_hospital', icon: '🏥' },
  { label: 'Primary Health Centre', value: 'primary_health_centre', icon: '🏥' },
  { label: 'Specialist Hospital', value: 'specialist_hospital', icon: '🏥' },
  { label: 'Teaching Hospital', value: 'teaching_hospital', icon: '🏥' },
  { label: 'Private Hospital', value: 'private_hospital', icon: '🏥' },
  { label: 'Clinic', value: 'clinic', icon: '🏥' },
  { label: 'Health Post', value: 'health_post', icon: '🏥' },
  { label: 'Maternity Centre', value: 'maternity_centre', icon: '🏥' },
  { label: 'Dental Clinic', value: 'dental_clinic', icon: '🦷' },
  { label: 'Eye Clinic', value: 'eye_clinic', icon: '👁️' },
  { label: 'Other', value: 'other', icon: '🏥' },
];

const states = [
  { label: 'Abia', value: 'abia', icon: '🇳🇬' },
  { label: 'Adamawa', value: 'adamawa', icon: '🇳🇬' },
  { label: 'Akwa Ibom', value: 'akwa_ibom', icon: '🇳🇬' },
  { label: 'Anambra', value: 'anambra', icon: '🇳🇬' },
  { label: 'Bauchi', value: 'bauchi', icon: '🇳🇬' },
  { label: 'Bayelsa', value: 'bayelsa', icon: '🇳🇬' },
  { label: 'Benue', value: 'benue', icon: '🇳🇬' },
  { label: 'Borno', value: 'borno', icon: '🇳🇬' },
  { label: 'Cross River', value: 'cross_river', icon: '🇳🇬' },
  { label: 'Delta', value: 'delta', icon: '🇳🇬' },
  { label: 'Ebonyi', value: 'ebonyi', icon: '🇳🇬' },
  { label: 'Edo', value: 'edo', icon: '🇳🇬' },
  { label: 'Ekiti', value: 'ekiti', icon: '🇳🇬' },
  { label: 'Enugu', value: 'enugu', icon: '🇳🇬' },
  { label: 'FCT - Abuja', value: 'fct', icon: '🇳🇬' },
  { label: 'Gombe', value: 'gombe', icon: '🇳🇬' },
  { label: 'Imo', value: 'imo', icon: '🇳🇬' },
  { label: 'Jigawa', value: 'jigawa', icon: '🇳🇬' },
  { label: 'Kaduna', value: 'kaduna', icon: '🇳🇬' },
  { label: 'Kano', value: 'kano', icon: '🇳🇬' },
  { label: 'Katsina', value: 'katsina', icon: '🇳🇬' },
  { label: 'Kebbi', value: 'kebbi', icon: '🇳🇬' },
  { label: 'Kogi', value: 'kogi', icon: '🇳🇬' },
  { label: 'Kwara', value: 'kwara', icon: '🇳🇬' },
  { label: 'Lagos', value: 'lagos', icon: '🇳🇬' },
  { label: 'Nasarawa', value: 'nasarawa', icon: '🇳🇬' },
  { label: 'Niger', value: 'niger', icon: '🇳🇬' },
  { label: 'Ogun', value: 'ogun', icon: '🇳🇬' },
  { label: 'Ondo', value: 'ondo', icon: '🇳🇬' },
  { label: 'Osun', value: 'osun', icon: '🇳🇬' },
  { label: 'Oyo', value: 'oyo', icon: '🇳🇬' },
  { label: 'Plateau', value: 'plateau', icon: '🇳🇬' },
  { label: 'Rivers', value: 'rivers', icon: '🇳🇬' },
  { label: 'Sokoto', value: 'sokoto', icon: '🇳🇬' },
  { label: 'Taraba', value: 'taraba', icon: '🇳🇬' },
  { label: 'Yobe', value: 'yobe', icon: '🇳🇬' },
  { label: 'Zamfara', value: 'zamfara', icon: '🇳🇬' },
];

export default function RegistrationScreen({ onRegistrationComplete }: RegistrationScreenProps) {
  const [formData, setFormData] = useState<UserData>({
    fullName: '',
    role: '',
    facility: '',
    state: '',
    contactInfo: '',
    location: {
      latitude: 0,
      longitude: 0,
      address: ''
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

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

    // Request location permission and get current location
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      setLocationLoading(true);
      const permissionStatus = await locationService.requestLocationPermission();
      setLocationPermission(permissionStatus.granted);
      
      if (permissionStatus.granted) {
        const location = await locationService.getCurrentLocation();
        if (location) {
          setFormData(prev => ({
            ...prev,
            location: {
              latitude: location.latitude,
              longitude: location.longitude,
              address: prev.location.address
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error getting location:', error);
    } finally {
      setLocationLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      const location = await locationService.getCurrentLocation();
      if (location) {
        setFormData(prev => ({
          ...prev,
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
            address: prev.location.address
          }
        }));
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Location Error', 'Failed to get current location. Please enter coordinates manually.');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleRegistration = async () => {
    // Validate form
    if (!formData.fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }
    if (!formData.role.trim()) {
      Alert.alert('Error', 'Please select your role');
      return;
    }
    if (!formData.facility.trim()) {
      Alert.alert('Error', 'Please select your facility type');
      return;
    }
    if (!formData.state.trim()) {
      Alert.alert('Error', 'Please select your state');
      return;
    }
    if (!formData.contactInfo.trim()) {
      Alert.alert('Error', 'Please enter your contact information');
      return;
    }

    if (!formData.location.latitude || !formData.location.longitude) {
      Alert.alert('Error', 'Please capture your location coordinates');
      return;
    }

    setIsLoading(true);

    // Simulate registration process
    setTimeout(() => {
      setIsLoading(false);
      onRegistrationComplete(formData);
    }, 2000);
  };

  const updateFormData = (field: keyof UserData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
                <View style={styles.icon}>
                  <Text style={styles.iconText}>👤</Text>
                </View>
              </View>
              
              <Text style={styles.title}>Create Your Profile</Text>
              <Text style={styles.subtitle}>
                Now let's set up your account. This information helps personalize 
                your experience and supports proper record-keeping.
              </Text>
            </View>

            {/* Registration Form */}
            <View style={styles.formContainer}>
              {/* Full Name */}
              <Input
                label="Full Name"
                value={formData.fullName}
                onChangeText={(text) => updateFormData('fullName', text)}
                placeholder="Enter your full name"
                autoCapitalize="words"
                editable={!isLoading}
                required
              />

              {/* Role */}
              <Dropdown
                label="Role"
                placeholder="Select your role"
                options={roles}
                value={formData.role}
                onSelect={(option) => updateFormData('role', option.value)}
                disabled={isLoading}
                required
              />

              {/* Facility */}
              <Dropdown
                label="Facility"
                placeholder="Select your facility type"
                options={facilities}
                value={formData.facility}
                onSelect={(option) => updateFormData('facility', option.value)}
                disabled={isLoading}
                required
              />

              {/* State */}
              <Dropdown
                label="State"
                placeholder="Select your state"
                options={states}
                value={formData.state}
                onSelect={(option) => updateFormData('state', option.value)}
                disabled={isLoading}
                required
              />

              {/* Contact Information */}
              <Input
                label="Contact Information"
                value={formData.contactInfo}
                onChangeText={(text) => updateFormData('contactInfo', text)}
                placeholder="Phone number or email"
                keyboardType="email-address"
                editable={!isLoading}
                required
              />

              {/* Location Section */}
              <View style={styles.locationSection}>
                <Text style={styles.sectionTitle}>Location Information</Text>
                <Text style={styles.sectionSubtitle}>
                  This helps us provide location-specific healthcare services
                </Text>
                
                {/* Location Button */}
                <Button
                  variant="secondary"
                  size="medium"
                  loading={locationLoading}
                  onPress={getCurrentLocation}
                  disabled={!locationPermission}
                  style={styles.locationButton}
                >
                  {locationPermission ? '📍 Get Current Location' : '📍 Enable Location Access'}
                </Button>

                {/* Location Coordinates */}
                <View style={styles.coordinatesContainer}>
                  <View style={styles.coordinateRow}>
                    <Text style={styles.coordinateLabel}>Latitude:</Text>
                    <Text style={styles.coordinateValue}>
                      {formData.location.latitude ? formData.location.latitude.toFixed(6) : 'Not set'}
                    </Text>
                  </View>
                  <View style={styles.coordinateRow}>
                    <Text style={styles.coordinateLabel}>Longitude:</Text>
                    <Text style={styles.coordinateValue}>
                      {formData.location.longitude ? formData.location.longitude.toFixed(6) : 'Not set'}
                    </Text>
                  </View>
                </View>

                {/* Address Input */}
                <Input
                  label="Address (Optional)"
                  value={formData.location.address}
                  onChangeText={(text) => updateFormData('location', { ...formData.location, address: text })}
                  placeholder="Enter your address"
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </View>

              {/* Registration Button */}
              <Button
                variant="primary"
                size="large"
                loading={isLoading}
                onPress={handleRegistration}
                fullWidth
                style={styles.registerButton}
              >
                Complete Registration
              </Button>

              {/* Privacy Note */}
              <Text style={styles.privacyText}>
                Your information is securely stored and will only be used for 
                healthcare service delivery and administrative purposes.
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
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  iconContainer: {
    marginBottom: Spacing.lg,
  },
  icon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  iconText: {
    fontSize: Typography.fontSize['4xl'],
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
  locationSection: {
    marginTop: Spacing.base,
    marginBottom: Spacing.base,
    padding: Spacing.base,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.light,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.muted,
    marginBottom: Spacing.base,
  },
  locationButton: {
    marginBottom: Spacing.base,
  },
  coordinatesContainer: {
    marginBottom: Spacing.base,
  },
  coordinateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  coordinateLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.muted,
    fontWeight: Typography.fontWeight.medium,
  },
  coordinateValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.light,
    fontFamily: 'monospace',
  },
  registerButton: {
    marginTop: Spacing.base,
    marginBottom: Spacing.lg,
  },
  privacyText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.normal * Typography.fontSize.xs,
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
