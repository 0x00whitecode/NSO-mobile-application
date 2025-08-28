import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '../constants/theme';
import { UserProfile, UserStorage } from '../utils/userStorage';
import Button from './ui/Button';
import Card, { StatusCard } from './ui/Card';

const { width } = Dimensions.get('window');

interface DashboardScreenProps {
  user: {
    name: string;
    role: string;
    facility: string;
  };
  onNavigate: (screen: string) => void;
  onLogout: () => void;
}

interface NetworkStatus {
  isOnline: boolean;
  lastSync: string;
  pendingCount: number;
}

interface RecentDiagnosis {
  id: string;
  complaint: string;
  patient: string;
  location: string;
  time: string;
  status: 'synced' | 'pending' | 'failed';
}

export default function DashboardScreen({ user, onNavigate, onLogout }: DashboardScreenProps) {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: true,
    lastSync: '2 minutes ago',
    pendingCount: 0,
  });

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Load user profile and update time
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const profile = await UserStorage.getUserProfile();
        setUserProfile(profile);
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    };

    const updateDynamicStats = () => {
      const now = new Date();
      const hour = now.getHours();

      // Simulate dynamic stats based on time of day
      const baseStats = {
        todayDiagnoses: Math.floor(hour * 1.2) + Math.floor(Math.random() * 3),
        weekDiagnoses: 42 + Math.floor(Math.random() * 8),
        monthDiagnoses: 156 + Math.floor(Math.random() * 20),
        pendingSync: Math.floor(Math.random() * 5),
        criticalCases: Math.floor(Math.random() * 4),
        completedCases: 134 + Math.floor(hour * 0.8),
        totalPatients: 89 + Math.floor(hour * 0.5),
        syncedToday: Math.floor(hour * 0.3) + Math.floor(Math.random() * 2),
      };

      setStats(baseStats);
    };

    loadUserProfile();
    updateDynamicStats();

    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
      updateDynamicStats(); // Update stats when time updates
    }, 60000);

    return () => clearInterval(timeInterval);
  }, []);

  const [recentDiagnoses] = useState<RecentDiagnosis[]>([
    {
      id: '1',
      complaint: 'Fever & Cough',
      patient: 'Child, 5y',
      location: '2.3km',
      time: '1h ago',
      status: 'synced',
    },
    {
      id: '2',
      complaint: 'Headache & Nausea',
      patient: 'Adult, 32y',
      location: '1.8km',
      time: '3h ago',
      status: 'pending',
    },
    {
      id: '3',
      complaint: 'Respiratory Issues',
      patient: 'Elderly, 68y',
      location: '1.2km',
      time: '5h ago',
      status: 'synced',
    },
  ]);

  // Dashboard statistics
  const [stats, setStats] = useState({
    todayDiagnoses: 8,
    weekDiagnoses: 42,
    monthDiagnoses: 156,
    pendingSync: 3,
    criticalCases: 2,
    completedCases: 134,
    totalPatients: 89,
    syncedToday: 5,
  });

  const getCurrentGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getCurrentDate = () => {
    return currentTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDisplayName = () => {
    if (userProfile) {
      return userProfile.fullName;
    }
    return user?.name || 'Healthcare Professional';
  };

  const getUserRole = () => {
    if (userProfile) {
      return userProfile.role;
    }
    return user?.role || 'Medical Professional';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'synced': return '✅';
      case 'pending': return '⏳';
      case 'failed': return '❌';
      default: return '📝';
    }
  };

  const quickActions = [
    {
      id: 'decision-support',
      title: 'Decision Support',
      subtitle: 'NSO Guidelines-based assessment',
      icon: '🎯',
      color: Colors.primary.lightest,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onNavigate('decision-support');
      },
    },
    {
      id: 'new-diagnosis',
      title: 'Quick Diagnosis',
      subtitle: 'Start clinical assessment',
      icon: '🩺',
      color: Colors.secondary.lightest,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onNavigate('diagnosis');
      },
    },
    {
      id: 'clinical-records',
      title: 'Clinical Categories',
      subtitle: 'Browse medical guidelines by category',
      icon: '📚',
      color: Colors.background.medical,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onNavigate('categories');
      },
    },
    {
      id: 'view-history',
      title: 'View History',
      subtitle: 'Past diagnoses & records',
      icon: '📋',
      color: Colors.secondary.lightest,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onNavigate('history');
      },
    },
    {
      id: 'upload-logs',
      title: 'Upload Logs',
      subtitle: 'Sync pending data',
      icon: '📤',
      color: Colors.background.warning,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // TODO: Implement sync functionality
        Alert.alert('Sync', 'Data sync functionality coming soon!');
      },
    },
    {
      id: 'help-support',
      title: 'Help & Support',
      subtitle: 'Get assistance',
      icon: '❓',
      color: '#F3E5F5',
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // TODO: Implement help screen
        Alert.alert('Help', 'Help & support functionality coming soon!');
      },
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary.dark} />

      {/* Header */}
      <LinearGradient
        colors={Colors.background.gradient}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            <Text style={styles.greeting}>{getCurrentGreeting()},</Text>
            <Text style={styles.userName}>{getDisplayName()}</Text>
            <Text style={styles.userRole}>{getUserRole()}</Text>
            <Text style={styles.date}>📅 {getCurrentDate()}</Text>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                // Handle notification press
              }}
            >
              <Text style={styles.notificationIcon}>🔔</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onNavigate('profile');
              }}
            >
              <Text style={styles.profileIcon}>👤</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Network Status */}
        <StatusCard 
          status={networkStatus.isOnline ? 'success' : 'warning'}
          style={styles.statusCard}
        >
          <View style={styles.statusContent}>
            <Text style={styles.statusIcon}>
              {networkStatus.isOnline ? '🌐' : '📱'}
            </Text>
            <View style={styles.statusText}>
              <Text style={styles.statusTitle}>
                {networkStatus.isOnline ? 'Online' : 'Offline'}
              </Text>
              <Text style={styles.statusSubtitle}>
                {networkStatus.isOnline 
                  ? `Last sync: ${networkStatus.lastSync}`
                  : `${networkStatus.pendingCount} diagnoses pending sync`
                }
              </Text>
            </View>
          </View>
        </StatusCard>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📊 Today&apos;s Overview</Text>
            <Text style={styles.sectionSubtitle}>
              Last updated: {currentTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.todayDiagnoses}</Text>
              <Text style={styles.statLabel}>Diagnoses</Text>
              <Text style={styles.statSubtext}>Today</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.pendingSync}</Text>
              <Text style={styles.statLabel}>Pending</Text>
              <Text style={styles.statSubtext}>Sync</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.criticalCases}</Text>
              <Text style={styles.statLabel}>Critical</Text>
              <Text style={styles.statSubtext}>Cases</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.completedCases}</Text>
              <Text style={styles.statLabel}>Completed</Text>
              <Text style={styles.statSubtext}>This Month</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>🚀 Quick Actions</Text>
          <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[styles.actionCard, { backgroundColor: action.color }]}
              onPress={action.onPress}
              activeOpacity={0.8}
            >
              <Text style={styles.actionIcon}>{action.icon}</Text>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.sectionHeader}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onNavigate('history');
            }}
          >
            <Text style={styles.viewAllText}>View All →</Text>
          </TouchableOpacity>
        </View>

        {recentDiagnoses.map((diagnosis) => (
          <Card
            key={diagnosis.id}
            style={styles.diagnosisCard}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onNavigate('history');
            }}
          >
            <View style={styles.diagnosisContent}>
              <View style={styles.diagnosisMain}>
                <Text style={styles.diagnosisIcon}>🩺</Text>
                <View style={styles.diagnosisInfo}>
                  <Text style={styles.diagnosisComplaint}>{diagnosis.complaint}</Text>
                  <Text style={styles.diagnosisDetails}>
                    Patient: {diagnosis.patient}
                  </Text>
                  <Text style={styles.diagnosisMeta}>
                    📍 {diagnosis.location} • 🕐 {diagnosis.time}
                  </Text>
                </View>
              </View>
              <Text style={styles.diagnosisStatus}>
                {getStatusIcon(diagnosis.status)}
              </Text>
            </View>
          </Card>
        ))}

        {/* Logout Button */}
        <Button
          variant="secondary"
          size="large"
          onPress={onLogout}
          style={styles.logoutButton}
        >
          🚪 Logout
        </Button>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Monitored by NSO Admin Portal</Text>
          <Text style={styles.footerSecurity}>🔒 Secure • 🛡️ Encrypted</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.medical,
  },
  header: {
    paddingTop: Spacing.lg, // Reduced since SafeAreaView handles top padding
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg, // More padding for mobile
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: Typography.fontSize.lg,
    color: Colors.text.light,
    marginBottom: Spacing.xs,
  },
  userName: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.light,
    marginBottom: Spacing.xs,
  },
  userRole: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.muted,
    fontStyle: 'italic',
    marginBottom: Spacing.sm,
  },
  date: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.muted,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  notificationButton: {
    width: 44, // Larger touch target for mobile
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationIcon: {
    fontSize: Typography.fontSize.lg,
  },
  profileButton: {
    width: 44, // Larger touch target for mobile
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: Typography.fontSize.lg,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg, // More padding for mobile
  },
  statsContainer: {
    marginBottom: Spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: Spacing.base,
  },
  statCard: {
    width: (width - Spacing.lg * 3) / 2,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    alignItems: 'center',
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  statNumber: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.main,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  statSubtext: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
  },
  actionsContainer: {
    marginBottom: Spacing.xl,
  },
  statusCard: {
    marginTop: -Spacing.lg,
    marginBottom: Spacing.lg,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: Typography.fontSize['2xl'],
    marginRight: Spacing.base,
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  statusSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.base,
    marginTop: Spacing.base,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    fontStyle: 'italic',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.base,
  },
  viewAllText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary.main,
    fontWeight: Typography.fontWeight.medium,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.base,
  },
  actionCard: {
    width: (width - Spacing.lg * 3) / 2, // More responsive spacing
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginBottom: Spacing.base,
    minHeight: 120, // Ensure adequate touch target for mobile
    justifyContent: 'center',
    ...Shadows.sm,
  },
  actionIcon: {
    fontSize: Typography.fontSize['4xl'],
    marginBottom: Spacing.sm,
  },
  actionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  actionSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  diagnosisCard: {
    marginBottom: Spacing.sm,
  },
  diagnosisContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  diagnosisMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  diagnosisIcon: {
    fontSize: Typography.fontSize['2xl'],
    marginRight: Spacing.base,
  },
  diagnosisInfo: {
    flex: 1,
  },
  diagnosisComplaint: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  diagnosisDetails: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  diagnosisMeta: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
  },
  diagnosisStatus: {
    fontSize: Typography.fontSize.lg,
    marginLeft: Spacing.sm,
  },
  logoutButton: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  footerText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  footerSecurity: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});
