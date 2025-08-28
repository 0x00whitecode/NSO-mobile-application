import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '../constants/theme';
import { UserStorage, UserProfile, DeviceInfo, AppSettings } from '../utils/userStorage';
import Button from './ui/Button';
import Card from './ui/Card';

interface ProfileScreenProps {
  onBack: () => void;
  onLogout: () => void;
}

export default function ProfileScreen({ onBack, onLogout }: ProfileScreenProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const [profile, device, settings] = await Promise.all([
        UserStorage.getUserProfile(),
        UserStorage.getDeviceInfo(),
        UserStorage.getAppSettings(),
      ]);
      
      setUserProfile(profile);
      setDeviceInfo(device);
      setAppSettings(settings);
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? This will clear all your data and require re-activation.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await UserStorage.clearUserData();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onLogout();
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Failed to logout properly');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primary.dark} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary.dark} />
      
      {/* Header */}
      <LinearGradient
        colors={Colors.background.gradient}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onBack();
          }} 
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Profile</Text>
          <Text style={styles.headerSubtitle}>User Information & Settings</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Profile Card */}
        {userProfile && (
          <Card style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {userProfile.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{userProfile.fullName}</Text>
                <Text style={styles.profileRole}>{userProfile.role}</Text>
                <Text style={styles.profileFacility}>{userProfile.facility}</Text>
              </View>
            </View>
            
            <View style={styles.profileDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>State:</Text>
                <Text style={styles.detailValue}>{userProfile.state}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Contact:</Text>
                <Text style={styles.detailValue}>{userProfile.contactInfo}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Member Since:</Text>
                <Text style={styles.detailValue}>{formatDate(userProfile.createdAt)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Last Updated:</Text>
                <Text style={styles.detailValue}>{formatDate(userProfile.lastUpdated)}</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Device Information Card */}
        {deviceInfo && (
          <Card style={styles.deviceCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>📱</Text>
              <Text style={styles.cardTitle}>Device Information</Text>
            </View>
            
            <View style={styles.deviceDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Device ID:</Text>
                <Text style={styles.detailValue}>{deviceInfo.deviceId}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Activation Key:</Text>
                <Text style={styles.detailValue}>
                  {deviceInfo.activationKey.replace(/./g, '*')}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <View style={styles.statusContainer}>
                  <View style={[styles.statusDot, { backgroundColor: Colors.success.main }]} />
                  <Text style={[styles.detailValue, { color: Colors.success.main }]}>
                    Activated
                  </Text>
                </View>
              </View>
              {deviceInfo.activatedAt && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Activated:</Text>
                  <Text style={styles.detailValue}>{formatDate(deviceInfo.activatedAt)}</Text>
                </View>
              )}
            </View>
          </Card>
        )}

        {/* App Settings Card */}
        {appSettings && (
          <Card style={styles.settingsCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>⚙️</Text>
              <Text style={styles.cardTitle}>App Settings</Text>
            </View>
            
            <View style={styles.settingsDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Theme:</Text>
                <Text style={styles.detailValue}>{appSettings.theme}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Language:</Text>
                <Text style={styles.detailValue}>{appSettings.language}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Notifications:</Text>
                <Text style={styles.detailValue}>
                  {appSettings.notifications.enabled ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Auto Sync:</Text>
                <Text style={styles.detailValue}>
                  {appSettings.offline.autoSync ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Logout Button */}
        <Button
          onPress={handleLogout}
          variant="secondary"
          style={styles.logoutButton}
        >
          🚪 Logout
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.text.secondary,
  },
  header: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    ...Shadows.lg,
  },
  backButton: {
    marginBottom: Spacing.lg,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: Colors.text.light,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  headerContent: {
    marginBottom: Spacing.base,
  },
  headerTitle: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.light,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.muted,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  profileCard: {
    marginBottom: Spacing.lg,
    ...Shadows.base,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
  },
  avatarText: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.light,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  profileRole: {
    fontSize: Typography.fontSize.base,
    color: Colors.primary.main,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.xs,
  },
  profileFacility: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  profileDetails: {
    marginTop: Spacing.base,
  },
  deviceCard: {
    marginBottom: Spacing.lg,
    ...Shadows.base,
  },
  settingsCard: {
    marginBottom: Spacing.lg,
    ...Shadows.base,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  cardIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  cardTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  deviceDetails: {
    marginTop: Spacing.base,
  },
  settingsDetails: {
    marginTop: Spacing.base,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  detailLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
  detailValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    flex: 1,
    textAlign: 'right',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  logoutButton: {
    marginTop: Spacing.xl,
    marginBottom: Spacing['2xl'],
  },
});
