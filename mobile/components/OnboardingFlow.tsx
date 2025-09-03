import React, { useEffect, useState } from 'react';
import { DeviceInfo, UserProfile, UserStorage } from '../utils/userStorage';
import ActivationScreen from './ActivationScreen';
import CategoryMenuScreen from './CategoryMenuScreen';
import OnboardingScreen from './OnboardingScreen';
import RegistrationScreen from './RegistrationScreen';

interface OnboardingFlowProps {
  onComplete: () => void;
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

interface CategoryItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  ageGroup: string;
  color: string;
  recordCount: number;
}

type OnboardingStep = 'onboarding' | 'activation' | 'registration' | 'menu' | 'complete';

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('onboarding');
  const [activationKey, setActivationKey] = useState<string>('');
  const [userData, setUserData] = useState<UserData | null>(null);

  // On mount, decide whether to skip activation/profile if already completed
  useEffect(() => {
    (async () => {
      try {
        const device = await UserStorage.getDeviceInfo();
        const profile = await UserStorage.getUserProfile();

        if (device?.isActivated) {
          if (profile) {
            await UserStorage.setOnboardingComplete();
            onComplete();
            return;
          }
          // Device activated but no profile yet: go to registration
          setCurrentStep('registration');
          return;
        }
        // Not activated yet: proceed to activation step
        setCurrentStep('activation');
      } catch (e) {
        // Fallback to activation on any error
        setCurrentStep('activation');
      }
    })();
  }, []);

  const handleOnboardingComplete = () => {
    setCurrentStep('activation');
  };

  const handleActivationComplete = async (key: string) => {
    try {
      setActivationKey(key);

      // Save device activation info
      const deviceInfo: DeviceInfo = {
        deviceId: `device_${Date.now()}`, // Generate unique device ID
        activationKey: key,
        isActivated: true,
        activatedAt: new Date().toISOString(),
      };

      await UserStorage.saveDeviceInfo(deviceInfo);
      setCurrentStep('registration');
    } catch (error) {
      console.error('Error saving activation data:', error);
      // Still proceed to registration even if storage fails
      setCurrentStep('registration');
    }
  };

  const handleRegistrationComplete = async (data: UserData) => {
    try {
      setUserData(data);

      // Create and save user profile locally
      const userProfile: UserProfile = {
        id: `user_${Date.now()}`, // Generate unique user ID
        fullName: data.fullName,
        role: data.role,
        facility: data.facility,
        state: data.state,
        contactInfo: data.contactInfo,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      };

      await UserStorage.saveUserProfile(userProfile);
      await UserStorage.setOnboardingComplete();

      // Submit profile to backend
      try {
        const { apiService } = await import('../services/apiService');
        const response = await apiService.submitUserProfile(data);
        
        if (response.success) {
          console.log('Profile submitted to backend successfully');
          // Add profile data to sync queue for future updates
          const { syncService } = await import('../services/syncService');
          await syncService.addToSyncQueue('user_profile', data, 'high');
        } else {
          console.warn('Profile submission failed, will retry on next sync:', response.error);
          // Still add to sync queue for retry
          const { syncService } = await import('../services/syncService');
          await syncService.addToSyncQueue('user_profile', data, 'high');
        }
      } catch (backendError) {
        console.error('Backend profile submission error:', backendError);
        // Add to sync queue for retry when online
        const { syncService } = await import('../services/syncService');
        await syncService.addToSyncQueue('user_profile', data, 'high');
      }

      setCurrentStep('menu');
    } catch (error) {
      console.error('Error saving user profile:', error);
      // Still proceed to menu even if storage fails
      setCurrentStep('menu');
    }
  };

  const handleCategorySelect = (category: CategoryItem) => {
    // Handle category selection - navigate to category details
    console.log('Selected category:', category);
    // For now, complete the onboarding flow
    onComplete();
  };

  switch (currentStep) {
    case 'onboarding':
      return <OnboardingScreen onComplete={handleOnboardingComplete} />;

    case 'activation':
      return <ActivationScreen onActivationComplete={handleActivationComplete} />;

    case 'registration':
      return <RegistrationScreen onRegistrationComplete={handleRegistrationComplete} />;

    case 'menu':
      return <CategoryMenuScreen onCategorySelect={handleCategorySelect} />;

    case 'complete':
    default:
      return null; // This will trigger the onComplete callback
  }
}

export type { CategoryItem, OnboardingStep, UserData };

