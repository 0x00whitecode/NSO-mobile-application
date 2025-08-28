import AsyncStorage from './storageAdapter';
import { apiService } from '../services/apiService';
import { syncService } from '../services/syncService';

// Storage keys
const STORAGE_KEYS = {
  HAS_COMPLETED_ONBOARDING: 'hasCompletedOnboarding',
  USER_PROFILE: 'userProfile',
  ACTIVATION_KEY: 'activationKey',
  APP_SETTINGS: 'appSettings',
  LAST_LOGIN: 'lastLogin',
  DEVICE_ID: 'deviceId',
  OFFLINE_DATA: 'offlineData',
  SYNC_STATUS: 'syncStatus',
} as const;

export interface UserProfile {
  id: string;
  fullName: string;
  role: string;
  facility: string;
  state: string;
  contactInfo: string;
  profilePicture?: string;
  createdAt: string;
  lastUpdated: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: {
    enabled: boolean;
    syncReminders: boolean;
    criticalAlerts: boolean;
  };
  offline: {
    autoSync: boolean;
    syncInterval: number; // in minutes
  };
  security: {
    biometricEnabled: boolean;
    autoLockTimeout: number; // in minutes
  };
}

export interface DeviceInfo {
  deviceId: string;
  activationKey: string;
  isActivated: boolean;
  activatedAt?: string;
  lastSyncAt?: string;
}

// User onboarding and profile management
export const UserStorage = {
  // Check if user has completed onboarding
  async hasCompletedOnboarding(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.HAS_COMPLETED_ONBOARDING);
      return value === 'true';
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  },

  // Mark onboarding as complete
  async setOnboardingComplete(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HAS_COMPLETED_ONBOARDING, 'true');
    } catch (error) {
      console.error('Error setting onboarding complete:', error);
      throw error;
    }
  },

  // Save user profile
  async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      const profileData = {
        ...profile,
        lastUpdated: new Date().toISOString(),
      };
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profileData));

      // Sync with backend if authenticated
      if (apiService.isAuthenticated()) {
        await syncService.addToSyncQueue('user_profile', profileData, 'medium');
      }
    } catch (error) {
      console.error('Error saving user profile:', error);
      throw error;
    }
  },

  // Get user profile
  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  },

  // Save device activation info
  async saveDeviceInfo(deviceInfo: DeviceInfo): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVATION_KEY, JSON.stringify(deviceInfo));

      // Sync with backend if authenticated
      if (apiService.isAuthenticated()) {
        await syncService.addToSyncQueue('device_info', deviceInfo, 'high');
      }
    } catch (error) {
      console.error('Error saving device info:', error);
      throw error;
    }
  },

  // Get device activation info
  async getDeviceInfo(): Promise<DeviceInfo | null> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVATION_KEY);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Error getting device info:', error);
      return null;
    }
  },

  // Check if device is activated
  async isDeviceActivated(): Promise<boolean> {
    try {
      const deviceInfo = await this.getDeviceInfo();
      return deviceInfo?.isActivated || false;
    } catch (error) {
      console.error('Error checking device activation:', error);
      return false;
    }
  },

  // Save app settings
  async saveAppSettings(settings: AppSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving app settings:', error);
      throw error;
    }
  },

  // Get app settings with defaults
  async getAppSettings(): Promise<AppSettings> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
      if (value) {
        return JSON.parse(value);
      }
      
      // Return default settings
      const defaultSettings: AppSettings = {
        theme: 'auto',
        language: 'en',
        notifications: {
          enabled: true,
          syncReminders: true,
          criticalAlerts: true,
        },
        offline: {
          autoSync: true,
          syncInterval: 30,
        },
        security: {
          biometricEnabled: false,
          autoLockTimeout: 15,
        },
      };
      
      await this.saveAppSettings(defaultSettings);
      return defaultSettings;
    } catch (error) {
      console.error('Error getting app settings:', error);
      // Return minimal default settings on error
      return {
        theme: 'light',
        language: 'en',
        notifications: { enabled: true, syncReminders: true, criticalAlerts: true },
        offline: { autoSync: true, syncInterval: 30 },
        security: { biometricEnabled: false, autoLockTimeout: 15 },
      };
    }
  },

  // Update last login timestamp
  async updateLastLogin(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_LOGIN, new Date().toISOString());
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  },

  // Get last login timestamp
  async getLastLogin(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.LAST_LOGIN);
    } catch (error) {
      console.error('Error getting last login:', error);
      return null;
    }
  },

  // Clear all user data (for logout/reset)
  async clearUserData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.HAS_COMPLETED_ONBOARDING,
        STORAGE_KEYS.USER_PROFILE,
        STORAGE_KEYS.ACTIVATION_KEY,
        STORAGE_KEYS.LAST_LOGIN,
      ]);
    } catch (error) {
      console.error('Error clearing user data:', error);
      throw error;
    }
  },

  // Check if user is first time user
  async isFirstTimeUser(): Promise<boolean> {
    try {
      const hasOnboarded = await this.hasCompletedOnboarding();
      const hasProfile = await this.getUserProfile();
      const isActivated = await this.isDeviceActivated();
      
      return !hasOnboarded || !hasProfile || !isActivated;
    } catch (error) {
      console.error('Error checking first time user:', error);
      return true; // Default to first time user on error
    }
  },
};

export default UserStorage;
