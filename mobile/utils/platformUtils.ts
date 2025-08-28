// Platform detection utilities for cross-platform compatibility

export interface PlatformInfo {
  isWeb: boolean;
  isReactNative: boolean;
  isNode: boolean;
  isExpo: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  platform: 'web' | 'android' | 'ios' | 'unknown';
}

// Enhanced platform detection
export const getPlatformInfo = (): PlatformInfo => {
  const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';
  const isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';
  const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
  const isExpo = typeof global !== 'undefined' && (global as any).expo;
  
  let platform: 'web' | 'android' | 'ios' | 'unknown' = 'unknown';
  let isAndroid = false;
  let isIOS = false;

  if (isWeb) {
    platform = 'web';
  } else if (isReactNative) {
    // Try to detect platform from React Native
    try {
      const { Platform } = require('react-native');
      if (Platform.OS === 'android') {
        platform = 'android';
        isAndroid = true;
      } else if (Platform.OS === 'ios') {
        platform = 'ios';
        isIOS = true;
      }
    } catch (error) {
      // Platform detection failed, assume unknown
      console.warn('Failed to detect React Native platform:', error);
    }
  }

  return {
    isWeb,
    isReactNative,
    isNode,
    isExpo,
    isAndroid,
    isIOS,
    platform
  };
};

// Cached platform info
let _platformInfo: PlatformInfo | null = null;

export const platformInfo = (): PlatformInfo => {
  if (!_platformInfo) {
    _platformInfo = getPlatformInfo();
  }
  return _platformInfo;
};

// Convenience getters
export const isWeb = () => platformInfo().isWeb;
export const isReactNative = () => platformInfo().isReactNative;
export const isNode = () => platformInfo().isNode;
export const isExpo = () => platformInfo().isExpo;
export const isAndroid = () => platformInfo().isAndroid;
export const isIOS = () => platformInfo().isIOS;
export const getPlatform = () => platformInfo().platform;

// Storage type detection
export const getStorageType = (): 'localStorage' | 'asyncStorage' | 'memory' => {
  const info = platformInfo();
  
  if (info.isWeb) {
    return 'localStorage';
  } else if (info.isReactNative) {
    return 'asyncStorage';
  } else {
    return 'memory';
  }
};

// Network detection
export const isOnline = (): boolean => {
  if (isWeb()) {
    return typeof navigator !== 'undefined' && navigator.onLine;
  } else if (isReactNative()) {
    // For React Native, we'll need to use NetInfo
    try {
      const NetInfo = require('@react-native-community/netinfo');
      // This is a synchronous check, but NetInfo.fetch() is async
      // In practice, you'd want to use NetInfo.fetch() or NetInfo.addEventListener()
      return true; // Default to true for now
    } catch (error) {
      return true; // Default to true if NetInfo is not available
    }
  }
  return true; // Default to true for other environments
};

// Device capabilities detection
export const getDeviceCapabilities = () => {
  const info = platformInfo();
  
  return {
    hasGeolocation: isWeb() ? 'geolocation' in navigator : isReactNative(),
    hasCamera: isWeb() ? 'mediaDevices' in navigator : isReactNative(),
    hasLocalStorage: isWeb() || isReactNative(),
    hasAsyncStorage: isReactNative(),
    hasFileSystem: isReactNative(),
    hasPushNotifications: isReactNative(),
    hasBiometrics: isReactNative(),
  };
};

// Environment-specific configurations
export const getEnvironmentConfig = () => {
  const info = platformInfo();
  
  return {
    apiBaseUrl: 'https://nso-backend-heavy.onrender.com',
    storagePrefix: 'nso_app_',
    maxStorageSize: info.isWeb ? 5 * 1024 * 1024 : 50 * 1024 * 1024, // 5MB for web, 50MB for mobile
    requestTimeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
  };
};

export default {
  platformInfo,
  isWeb,
  isReactNative,
  isNode,
  isExpo,
  isAndroid,
  isIOS,
  getPlatform,
  getStorageType,
  isOnline,
  getDeviceCapabilities,
  getEnvironmentConfig,
};
