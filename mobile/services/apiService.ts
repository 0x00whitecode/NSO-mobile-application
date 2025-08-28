import { Platform } from 'react-native';
import AsyncStorage from '../utils/storageAdapter';
import { LocationData, locationService } from './locationService';

// Mock NetInfo for web compatibility
const NetInfo = {
  fetch: () => Promise.resolve({ isConnected: true, type: 'wifi' }),
  addEventListener: (callback: any) => {
    // Mock network listener
    return () => {};
  }
};

// API Configuration
const API_CONFIG = {
  BASE_URL: __DEV__
    ? 'https://nso-backend-heavy.onrender.com/api/v1'  // Development - deployed backend
    : 'https://nso-backend-heavy.onrender.com/api/v1', // Production - same deployed backend
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

// Storage Keys
const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  DEVICE_ID: 'device_id',
  SESSION_ID: 'session_id',
  PENDING_SYNCS: 'pending_syncs',
  LAST_SYNC_TIME: 'last_sync_time',
};

// Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
  timestamp: string;
}

export interface SyncResponse {
  success: boolean;
  syncId: string;
  processedCount?: number;
  conflicts?: any[];
  message?: string;
  timestamp: string;
}

export interface UserProfile {
  userId: string;
  fullName: string;
  role: string;
  facility: string;
  state: string;
  deviceId: string;
  activatedAt?: string;
  lastLoginAt?: string;
}

export interface DeviceInfo {
  deviceId: string;
  platform: string;
  osVersion: string;
  appVersion: string;
  deviceModel: string;
}

export interface LocationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: string;
}

class ApiService {
  private baseURL: string;
  private authToken: string | null = null;
  private deviceId: string | null = null;
  private sessionId: string | null = null;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.initializeService();
  }

  /**
   * Initialize the API service
   */
  private async initializeService() {
    try {
      // Load stored auth data
      this.authToken = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      this.deviceId = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
      this.sessionId = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_ID);

      // Generate device ID if not exists
      if (!this.deviceId) {
        this.deviceId = await this.generateDeviceId();
        await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, this.deviceId);
      }

      // Generate new session ID
      this.sessionId = this.generateSessionId();
      await AsyncStorage.setItem(STORAGE_KEYS.SESSION_ID, this.sessionId);

    } catch (error) {
      console.error('Failed to initialize API service:', error);
    }
  }

  /**
   * Generate unique device ID
   */
  private async generateDeviceId(): Promise<string> {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const platform = Platform.OS;
    return `${platform}_${timestamp}_${random}`;
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get device information
   */
  private async getDeviceInfo(): Promise<DeviceInfo> {
    const { version } = require('../package.json');
    
    return {
      deviceId: this.deviceId!,
      platform: Platform.OS,
      osVersion: Platform.Version.toString(),
      appVersion: version || '1.0.0',
      deviceModel: Platform.OS === 'ios' ? 'iPhone' : 'Android Device'
    };
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<ApiResponse<T>> {
    try {
      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        throw new Error('No internet connection');
      }

      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Device-ID': this.deviceId || '',
        'X-Session-ID': this.sessionId || '',
        'X-App-Version': '1.0.0',
        'X-Platform': Platform.OS,
        ...options.headers as Record<string, string>,
      };

      // Add auth token if available
      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      // Make request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Parse response
      const data = await response.json();

      if (!response.ok) {
        // Handle specific HTTP errors
        if (response.status === 401) {
          throw new Error('Unauthorized access');
        } else if (response.status === 403) {
          throw new Error('Access forbidden');
        } else if (response.status === 404) {
          throw new Error('Resource not found');
        } else if (response.status >= 500) {
          throw new Error('Server error');
        } else {
          throw new Error(data.error || `HTTP ${response.status}`);
        }
      }

      return data;

    } catch (error) {
      console.error(`API request failed (attempt ${retryCount + 1}):`, error);

      // Handle specific error types
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        } else if (error.message.includes('Network request failed')) {
          throw new Error('Network connection failed');
        } else if (error.message.includes('No internet connection')) {
          throw new Error('No internet connection');
        }
      }

      // Retry logic for network errors
      if (retryCount < API_CONFIG.RETRY_ATTEMPTS && 
          (error instanceof Error && 
           (error.message.includes('Network') || 
            error.message.includes('timeout') || 
            error.message.includes('connection')))) {
        await new Promise(resolve => 
          setTimeout(resolve, API_CONFIG.RETRY_DELAY * (retryCount + 1))
        );
        return this.makeRequest<T>(endpoint, options, retryCount + 1);
      }

      // Return error response
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        code: 'REQUEST_FAILED',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Activate device with admin-generated activation key
   */
  async activateDevice(
    activationKey: string,
    overrideUserInfo?: Partial<{ fullName: string; role: string; facility: string; state: string; contactInfo: string; }>
  ): Promise<ApiResponse<{
    user: UserProfile;
    token: string;
    keyExpiresAt: string;
    remainingDays: number;
  }>> {
    try {
      // Ensure deviceId is available (avoid race with async constructor init)
      if (!this.deviceId) {
        this.deviceId = await this.generateDeviceId();
        await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, this.deviceId);
      }

      // Normalize activation key format to match backend validation (AAAA-BBBB-CCCC-DDDD)
      const normalizedKey = activationKey
        .toString()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .replace(/(.{4})/g, '$1-')
        .replace(/-$/, '');

      const deviceInfo = await this.getDeviceInfo();
      const location = await this.getCurrentLocation();

      const response = await this.makeRequest<{
        user: UserProfile;
        token: string;
        keyExpiresAt: string;
        remainingDays: number;
      }>(
        '/auth/activate',
        {
          method: 'POST',
          body: JSON.stringify({
            activationKey: normalizedKey,
            userInfo: {
              fullName: 'User', // Backend will override from key
              role: 'doctor',   // Backend will override from key
              facility: '',
              state: '',
              contactInfo: '',
              ...(overrideUserInfo || {})
            },
            deviceId: this.deviceId,
            deviceInfo,
            location,
            sessionId: this.generateSessionId()
          }),
        }
      );

      if (response.success && response.data) {
        // Store auth data
        this.authToken = response.data.token;
        this.sessionId = this.generateSessionId(); // Generate session ID locally

        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.data.token);
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.data.user));
        await AsyncStorage.setItem(STORAGE_KEYS.SESSION_ID, this.sessionId);
      }

      return response;
    } catch (error) {
      console.error('Activation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Activation failed',
        code: 'ACTIVATION_ERROR',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Login with device credentials
   */
  async login(activationKey: string): Promise<ApiResponse<{ user: UserProfile; token: string; sessionId: string }>> {
    const response = await this.makeRequest<{ user: UserProfile; token: string; sessionId: string }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({
          deviceId: this.deviceId,
          activationKey,
        }),
      }
    );

    if (response.success && response.data) {
      // Store auth data
      this.authToken = response.data.token;
      this.sessionId = response.data.sessionId;
      
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.data.token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.data.user));
      await AsyncStorage.setItem(STORAGE_KEYS.SESSION_ID, response.data.sessionId);
    }

    return response;
  }

  /**
   * Submit user profile after activation
   */
  async submitUserProfile(userProfile: {
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
  }): Promise<ApiResponse<{ profileId: string; syncStatus: string }>> {
    try {
      const deviceInfo = await this.getDeviceInfo();
      const currentLocation = await this.getCurrentLocation();

      const response = await this.makeRequest<{ profileId: string; syncStatus: string }>(
        '/users/profile',
        {
          method: 'POST',
          body: JSON.stringify({
            ...userProfile,
            deviceId: this.deviceId,
            deviceInfo,
            currentLocation,
            sessionId: this.sessionId,
            timestamp: new Date().toISOString()
          }),
        }
      );

      if (response.success && response.data) {
        // Store updated user profile
        const storedUserData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
        if (storedUserData) {
          const userData = JSON.parse(storedUserData);
          const updatedUserData = {
            ...userData,
            ...userProfile,
            lastUpdated: new Date().toISOString()
          };
          await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUserData));
        }
      }

      return response;
    } catch (error) {
      console.error('Profile submission error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Profile submission failed',
        code: 'PROFILE_SUBMISSION_ERROR',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<ApiResponse> {
    const response = await this.makeRequest('/auth/logout', {
      method: 'POST',
    });

    // Clear stored auth data
    this.authToken = null;
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.USER_DATA,
      STORAGE_KEYS.SESSION_ID,
    ]);

    return response;
  }

  /**
   * Verify auth token
   */
  async verifyToken(): Promise<ApiResponse<{ valid: boolean; user?: UserProfile }>> {
    if (!this.authToken) {
      return {
        success: false,
        error: 'No auth token',
        code: 'NO_TOKEN',
        timestamp: new Date().toISOString(),
      };
    }

    return this.makeRequest<{ valid: boolean; user?: UserProfile }>('/auth/verify');
  }

  /**
   * Upload data to server
   */
  async uploadData(
    dataType: string,
    data: any,
    syncMode: 'manual' | 'automatic' = 'automatic'
  ): Promise<SyncResponse> {
    const deviceInfo = await this.getDeviceInfo();
    const netInfo = await NetInfo.fetch();

    // Backend expects: syncType (upload/download/bidirectional),
    // operation (full_sync/incremental_sync/delta_sync/manual_sync/auto_sync),
    // dataTypes: string[], and data: object keyed by dataTypes
    const payload = {
      syncType: 'upload' as const,
      operation: syncMode === 'automatic' ? 'auto_sync' : 'manual_sync',
      dataTypes: [dataType],
      data: {
        [dataType]: Array.isArray(data) ? data : [data]
      },
      deviceInfo,
      networkInfo: {
        type: netInfo.type,
        isConnected: netInfo.isConnected,
      },
    };

    const response = await this.makeRequest<SyncResponse>('/sync/upload', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return response as SyncResponse;
  }

  /**
   * Download data from server
   */
  async downloadData(
    dataType?: string,
    lastSyncTime?: string,
    limit = 100
  ): Promise<ApiResponse<{ data: any; recordCount: number; hasMore: boolean }>> {
    const params = new URLSearchParams();
    if (dataType) params.append('dataType', dataType);
    if (lastSyncTime) params.append('lastSyncTime', lastSyncTime);
    params.append('limit', limit.toString());

    return this.makeRequest<{ data: any; recordCount: number; hasMore: boolean }>(
      `/sync/download?${params.toString()}`
    );
  }

  /**
   * Get sync status
   */
  async getSyncStatus(syncId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/sync/status/${syncId}`);
  }

  /**
   * Track user activity
   */
  async trackActivity(activity: {
    activityType: string;
    screen?: { name: string; route?: string; category?: string };
    action?: { name: string; target?: string; value?: any };
    performance?: { loadTime?: number; responseTime?: number };
    error?: { code: string; message: string; severity?: string };
    duration?: number;
  }): Promise<ApiResponse> {
    const deviceInfo = await this.getDeviceInfo();

    return this.makeRequest('/activity/track', {
      method: 'POST',
      body: JSON.stringify({
        ...activity,
        deviceContext: deviceInfo,
        timestamp: new Date().toISOString(),
      }),
    });
  }

  /**
   * Track multiple activities in batch
   */
  async trackActivitiesBatch(activities: any[]): Promise<ApiResponse> {
    return this.makeRequest('/activity/batch', {
      method: 'POST',
      body: JSON.stringify({
        activities,
      }),
    });
  }

  /**
   * Get user profile
   */
  async getUserProfile(): Promise<ApiResponse<UserProfile>> {
    return this.makeRequest<UserProfile>('/users/profile');
  }

  /**
   * Update user profile
   */
  async updateUserProfile(profileData: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    return this.makeRequest<UserProfile>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.authToken;
  }

  /**
   * Get stored user data
   */
  async getStoredUserData(): Promise<UserProfile | null> {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to get stored user data:', error);
      return null;
    }
  }

  /**
   * Request location permissions
   */
  async requestLocationPermission(): Promise<LocationPermissionStatus> {
    return await locationService.requestLocationPermission();
  }

  /**
   * Get current location
   */
  async getCurrentLocation(): Promise<LocationData | null> {
    return await locationService.getCurrentLocation();
  }

  /**
   * Get cached location from storage
   */
  async getCachedLocation(): Promise<LocationData | null> {
    return await locationService.getCachedLocation();
  }

  /**
   * Cache location data
   */
  async cacheLocation(location: LocationData): Promise<void> {
    return await locationService.cacheLocation(location);
  }

  /**
   * Get location with fallback to cached
   */
  async getLocationWithFallback(): Promise<LocationData | null> {
    return await locationService.getLocationWithFallback();
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
