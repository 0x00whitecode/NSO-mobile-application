// Import polyfills first to handle web compatibility
import "../utils/polyfills";

import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, BackHandler, KeyboardAvoidingView, Platform, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CategoryMenuScreen from "../components/CategoryMenuScreen";
import ClinicalDecisionSupportScreen from "../components/ClinicalDecisionSupportScreen";
import ClinicalRecordsScreen from "../components/ClinicalRecordsScreen";
import DashboardScreen from "../components/DashboardScreen";
import EnhancedDiagnosisScreen from "../components/EnhancedDiagnosisScreen";
import HistoryScreen from "../components/HistoryScreen";
import OnboardingFlow from "../components/OnboardingFlow";
import ProfileScreen from "../components/ProfileScreen";
import { Colors } from "../constants/theme";
import { useBackendIntegration } from "../hooks/useBackendIntegration";
import { UserStorage } from "../utils/userStorage";
import { NavigationDebug } from "../utils/navigationDebug";

type Screen = 'onboarding' | 'dashboard' | 'diagnosis' | 'history' | 'clinical-records' | 'decision-support' | 'categories' | 'profile' | 'loading';

export default function Index() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('onboarding');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [navigationHistory, setNavigationHistory] = useState<Screen[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Backend integration
  const [backendState, backendActions] = useBackendIntegration();

  // Check authentication state on app load
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        console.log('Checking authentication state...');
        const isSetupComplete = await UserStorage.isUserSetupComplete();
        console.log('Setup complete:', isSetupComplete);

        if (isSetupComplete) {
          // User has completed activation and registration, go directly to dashboard
          console.log('User setup complete, setting authenticated state');
          setIsAuthenticated(true);
          setCurrentScreen('dashboard');

          // Track app launch (but don't let backend errors affect navigation)
          try {
            await backendActions.trackActivity({
              activityType: 'app_launch',
              screen: { name: 'dashboard', category: 'main' },
              action: { name: 'app_started', target: 'application' },
            });
          } catch (trackingError) {
            console.warn('Failed to track app launch, but continuing:', trackingError);
          }
        } else {
          // User needs to complete activation and/or registration
          console.log('User setup incomplete, showing onboarding');
          setIsAuthenticated(false);
          setCurrentScreen('onboarding');
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
        try {
          await backendActions.trackError(
            error instanceof Error ? error.message : 'Auth check failed',
            'AUTH_CHECK_ERROR'
          );
        } catch (trackingError) {
          console.warn('Failed to track auth error:', trackingError);
        }
        // Default to onboarding on error
        setIsAuthenticated(false);
        setCurrentScreen('onboarding');
      } finally {
        setIsLoading(false);
      }
    };

    // Check auth state immediately, don't wait for backend
    // Backend integration should not block local authentication
    checkAuthState();
  }, [backendActions]);

  // Handle Android back button
  useEffect(() => {
    const handleBackNavigation = () => {
      // Special case: clinical-records with selected category goes back to categories
      if (currentScreen === 'clinical-records' && selectedCategory) {
        setCurrentScreen('categories');
        return;
      }

      // If we have navigation history, go back to previous screen
      if (navigationHistory.length > 0) {
        const previousScreen = navigationHistory[navigationHistory.length - 1];
        setNavigationHistory(prev => prev.slice(0, -1));
        setCurrentScreen(previousScreen);
        return;
      }

      // Default behavior: go to dashboard (unless already there)
      if (currentScreen !== 'dashboard') {
        setCurrentScreen('dashboard');
        return;
      }

      // If on dashboard, do nothing (let default back behavior handle app exit)
    };

    const backAction = () => {
      if (!isAuthenticated) {
        // On onboarding screen, exit app
        BackHandler.exitApp();
        return true;
      }

      if (currentScreen === 'dashboard') {
        // On dashboard, show exit confirmation
        Alert.alert(
          'Exit App',
          'Are you sure you want to exit?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Exit', onPress: () => BackHandler.exitApp() },
          ]
        );
        return true;
      }

      // Navigate back to previous screen
      handleBackNavigation();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [currentScreen, isAuthenticated, navigationHistory, selectedCategory]);

  const mockUser = {
    name: "Dr. Sarah Johnson",
    role: "Community Health Worker",
    facility: "Central Health Clinic",
  };

  const handleOnboardingComplete = async (activationKey?: string, userInfo?: any) => {
    try {
      if (activationKey && userInfo) {
        // New user activation
        const success = await backendActions.activateDevice(activationKey, userInfo);
        if (success) {
          // Smooth transition: show a loading overlay briefly while switching screens
          setCurrentScreen('loading');
          setIsAuthenticated(true);
          setTimeout(async () => {
            setCurrentScreen('dashboard');
            await backendActions.trackScreen('dashboard', '/dashboard');
          }, 400);
        } else {
          // Handle activation failure
          Alert.alert('Activation Failed', backendState.error || 'Please check your activation key and try again.');
        }
      } else {
        // Existing user login
        setIsAuthenticated(true);
        setCurrentScreen('dashboard');
        await backendActions.trackScreen('dashboard', '/dashboard');
      }
    } catch (error) {
      console.error('Onboarding completion error:', error);
      Alert.alert('Error', 'Failed to complete setup. Please try again.');
    }
  };

  const handleNavigate = async (screen: string) => {
    console.log(`Navigate to: ${screen}, current: ${currentScreen}, authenticated: ${isAuthenticated}`);

    // Validate screen type
    const validScreens: Screen[] = [
      'onboarding', 'dashboard', 'diagnosis', 'history',
      'clinical-records', 'decision-support', 'categories', 'profile', 'loading'
    ];

    if (!validScreens.includes(screen as Screen)) {
      console.warn(`Invalid screen: ${screen}`);
      return;
    }

    // Ensure user is authenticated for protected screens
    if (screen !== 'onboarding' && !isAuthenticated) {
      console.warn(`Attempted to navigate to protected screen ${screen} while unauthenticated`);
      // Re-check authentication before blocking
      try {
        const isSetupComplete = await UserStorage.isUserSetupComplete();
        if (isSetupComplete) {
          console.log('User is actually authenticated locally, updating state');
          setIsAuthenticated(true);
        } else {
          console.log('User is not authenticated, redirecting to onboarding');
          setCurrentScreen('onboarding');
          return;
        }
      } catch (error) {
        console.error('Error checking auth during navigation:', error);
        setCurrentScreen('onboarding');
        return;
      }
    }

    // Track screen navigation (don't let tracking errors block navigation)
    try {
      await backendActions.trackScreen(screen, `/${screen}`);
    } catch (trackingError) {
      console.warn('Failed to track screen navigation:', trackingError);
    }

    // Add current screen to history before navigating (except for dashboard)
    if (currentScreen !== 'dashboard' && currentScreen !== screen) {
      setNavigationHistory(prev => [...prev, currentScreen]);
    }

    setCurrentScreen(screen as Screen);
  };

  const handleLogout = async () => {
    try {
      console.log("Logout pressed");

      // Logout from backend
      await backendActions.logout();

      // Clear local storage
      await UserStorage.clearUserData();

      // Update local state
      setIsAuthenticated(false);
      setCurrentScreen('onboarding');
      setNavigationHistory([]);
      setSelectedCategory(null);

      // Track logout
      await backendActions.trackScreen('onboarding', '/onboarding');
    } catch (error) {
      console.error('Error during logout:', error);
      await backendActions.trackError(
        error instanceof Error ? error.message : 'Logout failed',
        'LOGOUT_ERROR'
      );

      // Still proceed with logout even if backend logout fails
      setIsAuthenticated(false);
      setCurrentScreen('onboarding');
    }
  };

  const handleDiagnosisComplete = (diagnosisData: any) => {
    console.log("Diagnosis completed:", diagnosisData);
    setCurrentScreen('dashboard');
  };

  const handleCategorySelect = (category: any) => {
    NavigationDebug.logNavigationState(currentScreen, isAuthenticated, selectedCategory, navigationHistory);
    NavigationDebug.logScreenTransition(currentScreen, 'clinical-records', 'category_selection');

    console.log("Selected category:", category, "current screen:", currentScreen, "authenticated:", isAuthenticated);

    // Ensure user is still authenticated before proceeding
    if (!isAuthenticated) {
      console.warn("User not authenticated during category selection, re-checking...");
      UserStorage.isUserSetupComplete().then(isComplete => {
        if (isComplete) {
          console.log("User is authenticated locally, proceeding with category selection");
          NavigationDebug.logAuthStateChange(false, true, 'category_selection_reauth');
          setIsAuthenticated(true);
          setSelectedCategory(category);
          setCurrentScreen('clinical-records');
        } else {
          console.log("User is not authenticated, redirecting to onboarding");
          NavigationDebug.logScreenTransition(currentScreen, 'onboarding', 'auth_failure');
          setCurrentScreen('onboarding');
        }
      }).catch(error => {
        console.error("Error checking auth during category selection:", error);
        NavigationDebug.logScreenTransition(currentScreen, 'onboarding', 'auth_error');
        setCurrentScreen('onboarding');
      });
      return;
    }

    setSelectedCategory(category);
    setCurrentScreen('clinical-records');
  };

  const renderCurrentScreen = () => {
    // Show loading screen while checking authentication
    if (isLoading) {
      return (
        <SafeAreaView style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </SafeAreaView>
      );
    }

    // Show onboarding only when explicitly on onboarding screen
    if (currentScreen === 'onboarding') {
      return <OnboardingFlow onComplete={handleOnboardingComplete} />;
    }

    // If user is not authenticated but not on onboarding screen, re-check local auth
    if (!isAuthenticated) {
      console.log('User appears unauthenticated, checking local auth state...');
      // Re-check local authentication state
      UserStorage.isUserSetupComplete().then(isComplete => {
        if (isComplete) {
          console.log('Local auth is valid, restoring authenticated state');
          setIsAuthenticated(true);
          if (currentScreen === 'onboarding') {
            setCurrentScreen('dashboard');
          }
        } else {
          console.log('Local auth is invalid, redirecting to onboarding');
          setCurrentScreen('onboarding');
        }
      }).catch(error => {
        console.error('Error re-checking auth state:', error);
        setCurrentScreen('onboarding');
      });

      // Show loading while re-checking
      return (
        <SafeAreaView style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Checking authentication...</Text>
        </SafeAreaView>
      );
    }

    switch (currentScreen) {
      case 'dashboard':
        return (
          <DashboardScreen
            user={mockUser}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        );
      case 'decision-support':
        return (
          <ClinicalDecisionSupportScreen
            onBack={() => setCurrentScreen('dashboard')}
          />
        );
      case 'diagnosis':
        return (
          <EnhancedDiagnosisScreen
            onComplete={handleDiagnosisComplete}
            onCancel={() => setCurrentScreen('dashboard')}
          />
        );
      case 'history':
        return (
          <HistoryScreen
            onBack={() => setCurrentScreen('dashboard')}
            onViewDiagnosis={(id) => console.log('View diagnosis:', id)}
          />
        );
      case 'categories':
        return (
          <CategoryMenuScreen
            onCategorySelect={handleCategorySelect}
            onBack={() => {
              setSelectedCategory(null);
              setCurrentScreen('dashboard');
            }}
          />
        );
      case 'clinical-records':
        return (
          <ClinicalRecordsScreen
            onBack={() => {
              // Go back to categories if we came from there, otherwise go to dashboard
              if (selectedCategory) {
                setCurrentScreen('categories');
              } else {
                setCurrentScreen('dashboard');
              }
            }}
            selectedCategory={selectedCategory}
          />
        );
      case 'profile':
        return (
          <ProfileScreen
            onBack={() => setCurrentScreen('dashboard')}
            onLogout={handleLogout}
          />
        );
      default:
        return (
          <DashboardScreen
            user={mockUser}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        );
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false, title: "" }} />
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {renderCurrentScreen()}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
  },
  loadingText: {
    fontSize: 20,
    color: Colors.text.secondary,
  },
});


