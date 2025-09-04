import { useCallback, useEffect, useState } from 'react';
import { activityService } from '../services/activityService';
import { apiService, UserProfile } from '../services/apiService';
import { LocationData } from '../services/locationService';
import { syncService, SyncStatus } from '../services/syncService';

export interface BackendState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  syncStatus: SyncStatus;
  isLoading: boolean;
  error: string | null;
}

export interface BackendActions {
  login: (activationKey: string) => Promise<boolean>;
  logout: () => Promise<void>;
  activateDevice: (activationKey: string, userInfo: any) => Promise<boolean>;
  syncNow: () => Promise<void>;
  trackActivity: (activity: any) => Promise<void>;
  trackScreen: (screenName: string, route?: string) => Promise<void>;
  trackError: (error: string, code: string, severity?: string) => Promise<void>;
  requestLocationPermission: () => Promise<boolean>;
  getCurrentLocation: () => Promise<LocationData | null>;
  trackLocationActivity: (activityType: string, screenName?: string, action?: string) => Promise<void>;
  trackFacilityVisit: (facilityName: string, facilityType: string, action: 'enter' | 'exit' | 'visit') => Promise<void>;
  clearError: () => void;
}

export function useBackendIntegration(): [BackendState, BackendActions] {
  const [state, setState] = useState<BackendState>({
    isAuthenticated: false,
    user: null,
    syncStatus: {
      isOnline: false,
      lastSync: null,
      pendingCount: 0,
      inProgress: false,
      errors: [],
    },
    isLoading: true,
    error: null,
  });

  // Initialize backend integration
  useEffect(() => {
    initializeBackend();
  }, []);

  // Setup sync status listener
  useEffect(() => {
    const unsubscribe = syncService.addSyncStatusListener((syncStatus) => {
      setState(prev => ({ ...prev, syncStatus }));
    });

    return unsubscribe;
  }, []);

  /**
   * Initialize backend services
   */
  const initializeBackend = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Check if user is already authenticated
      const isAuth = apiService.isAuthenticated();
      let user: UserProfile | null = null;

      if (isAuth) {
        try {
          // Verify token and get user data
          const response = await apiService.verifyToken();
          if (response.success && response.data?.valid) {
            user = response.data.user || await apiService.getStoredUserData();
          } else {
            // Token invalid, but don't automatically logout - user might be working offline
            console.warn('Backend token verification failed, but keeping user in offline mode');
            user = await apiService.getStoredUserData();
          }
        } catch (verifyError) {
          console.warn('Token verification failed, working in offline mode:', verifyError);
          // Try to get stored user data for offline mode
          user = await apiService.getStoredUserData();
        }
      }

      // Get initial sync status
      const syncStatus = await syncService.getSyncStatus();

      setState(prev => ({
        ...prev,
        isAuthenticated: isAuth && !!user,
        user,
        syncStatus,
        isLoading: false,
      }));

    } catch (error) {
      console.error('Failed to initialize backend:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Initialization failed',
      }));
    }
  };

  /**
   * Login with activation key
   */
  const login = useCallback(async (activationKey: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await apiService.login(activationKey);

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          user: response.data!.user,
          isLoading: false,
        }));

        // Track login activity
        await activityService.trackActivity({
          activityType: 'login',
          action: { name: 'user_login', target: 'auth_system', value: 'success' },
        });

        return true;
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: response.error || 'Login failed',
        }));
        return false;
      }

    } catch (error) {
      console.error('Login error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      }));
      return false;
    }
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Track logout activity
      await activityService.trackActivity({
        activityType: 'logout',
        action: { name: 'user_logout', target: 'auth_system' },
      });

      // End activity session
      await activityService.endSession();

      // Logout from API
      await apiService.logout();

      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
      }));

    } catch (error) {
      console.error('Logout error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Logout failed',
      }));
    }
  }, []);

  /**
   * Activate device and create account
   */
  const activateDevice = useCallback(async (
    activationKey: string,
    userInfo: {
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
  ): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await apiService.activateDevice(activationKey, userInfo);

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          user: response.data!.user,
          isLoading: false,
        }));

        // Track activation activity
        await activityService.trackActivity({
          activityType: 'login',
          action: { name: 'device_activation', target: 'auth_system', value: 'success' },
        });

        return true;
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: response.error || 'Device activation failed',
        }));
        return false;
      }

    } catch (error) {
      console.error('Device activation error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Device activation failed',
      }));
      return false;
    }
  }, []);

  /**
   * Force sync now
   */
  const syncNow = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, error: null }));

      // Track sync initiation
      await activityService.trackSync('initiated');

      const result = await syncService.forceSyncNow();

      if (result.success) {
        // Track successful sync
        await activityService.trackSync('completed', undefined, undefined, result.syncedCount);
      } else {
        // Track failed sync
        await activityService.trackSync('failed', undefined, undefined, undefined, result.errors.join(', '));
        
        setState(prev => ({
          ...prev,
          error: `Sync failed: ${result.errors.join(', ')}`,
        }));
      }

    } catch (error) {
      console.error('Sync error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));

      // Track sync error
      await activityService.trackSync('failed', undefined, undefined, undefined, errorMessage);
    }
  }, []);

  /**
   * Track user activity
   */
  const trackActivity = useCallback(async (activity: any): Promise<void> => {
    try {
      await activityService.trackActivity(activity);
    } catch (error) {
      console.error('Failed to track activity:', error);
    }
  }, []);

  /**
   * Track screen view
   */
  const trackScreen = useCallback(async (
    screenName: string,
    route?: string
  ): Promise<void> => {
    try {
      await activityService.trackScreenView(screenName, route);
    } catch (error) {
      console.error('Failed to track screen view:', error);
    }
  }, []);

  /**
   * Track error
   */
  const trackError = useCallback(async (
    message: string,
    code: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<void> => {
    try {
      await activityService.trackError(code, message, severity);
    } catch (error) {
      console.error('Failed to track error:', error);
    }
  }, []);

  /**
   * Request location permission
   */
  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    try {
      const permission = await locationService.requestLocationPermission();

      // Track permission request
      await activityService.trackLocationPermission(permission.granted, permission.canAskAgain);

      return permission.granted;
    } catch (error) {
      console.error('Location permission request failed:', error);
      await trackError(
        error instanceof Error ? error.message : 'Location permission failed',
        'LOCATION_PERMISSION_ERROR'
      );
      return false;
    }
  }, []);

  /**
   * Get current location
   */
  const getCurrentLocation = useCallback(async (): Promise<LocationData | null> => {
    try {
      const location = await locationService.getCurrentLocation();

      if (location) {
        // Track successful location retrieval
        await activityService.trackLocationActivity(
          'location_retrieved',
          undefined,
          'get_current_location',
          {
            accuracy: location.accuracy,
            timestamp: location.timestamp,
          }
        );
      }

      return location;
    } catch (error) {
      console.error('Get current location failed:', error);
      await trackError(
        error instanceof Error ? error.message : 'Location retrieval failed',
        'LOCATION_RETRIEVAL_ERROR'
      );
      return null;
    }
  }, []);

  /**
   * Track location-based activity
   */
  const trackLocationActivity = useCallback(async (
    activityType: string,
    screenName?: string,
    action?: string
  ): Promise<void> => {
    try {
      await activityService.trackLocationActivity(activityType, screenName, action);
    } catch (error) {
      console.error('Failed to track location activity:', error);
    }
  }, []);

  /**
   * Track facility visit
   */
  const trackFacilityVisit = useCallback(async (
    facilityName: string,
    facilityType: string,
    action: 'enter' | 'exit' | 'visit'
  ): Promise<void> => {
    try {
      await activityService.trackFacilityVisit(facilityName, facilityType, action);
    } catch (error) {
      console.error('Failed to track facility visit:', error);
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback((): void => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const actions: BackendActions = {
    login,
    logout,
    activateDevice,
    syncNow,
    trackActivity,
    trackScreen,
    trackError,
    requestLocationPermission,
    getCurrentLocation,
    trackLocationActivity,
    trackFacilityVisit,
    clearError,
  };

  return [state, actions];
}

export default useBackendIntegration;
