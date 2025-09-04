// Import polyfills first to handle web compatibility
import "../utils/polyfills";

import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import OnboardingFlow from "../components/OnboardingFlow";
import SplashScreenComponent from "../components/SplashScreen";
import { UserStorage } from "../utils/userStorage";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [showCustomSplash, setShowCustomSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(true);

  useEffect(() => {
    async function prepare() {
      try {
        // Check if user has completed the full setup (activation + registration)
        const isSetupComplete = await UserStorage.isUserSetupComplete();
        setIsFirstTimeUser(!isSetupComplete);
        setShowOnboarding(!isSetupComplete);

        // Update last login if user is returning
        if (isSetupComplete) {
          await UserStorage.updateLastLogin();
        }

        // Simulate loading time for splash screen
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.warn('Error during app initialization:', error);
        // Default to showing onboarding on error
        setShowOnboarding(true);
        setIsFirstTimeUser(true);
      } finally {
        // Tell the application to render
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  const handleSplashComplete = () => {
    setShowCustomSplash(false);
  };

  const handleOnboardingComplete = async () => {
    try {
      // Mark onboarding as complete in storage
      await UserStorage.setOnboardingComplete();
      setShowOnboarding(false);
      setIsFirstTimeUser(false);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Still allow user to proceed even if storage fails
      setShowOnboarding(false);
    }
  };

  if (!isReady || showCustomSplash) {
    return (
      <SplashScreenComponent
        onAnimationComplete={handleSplashComplete}
        duration={3000}
      />
    );
  }

  if (showOnboarding) {
    return (
      <SafeAreaProvider>
        <OnboardingFlow onComplete={handleOnboardingComplete} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{
            title: "NSO Healthcare",
            headerShown: false,
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
