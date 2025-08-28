import AsyncStorage from '../utils/storageAdapter';
import { Alert, PermissionsAndroid, Platform } from 'react-native';

// Mock Geolocation for web compatibility
const Geolocation = {
  getCurrentPosition: (
    success: (position: any) => void,
    error: (error: any) => void,
    options?: any
  ) => {
    // Use browser geolocation API if available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(success, error, options);
    } else {
      error({ code: 2, message: 'Geolocation not supported' });
    }
  },
  watchPosition: (
    success: (position: any) => void,
    error: (error: any) => void,
    options?: any
  ) => {
    if (navigator.geolocation) {
      return navigator.geolocation.watchPosition(success, error, options);
    }
    return -1;
  },
  clearWatch: (watchId: number) => {
    if (navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
  }
};

// Types
export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface LocationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: string;
}

export interface LocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

class LocationService {
  private static instance: LocationService;
  private watchId: number | null = null;
  private lastKnownLocation: LocationData | null = null;
  private locationListeners: ((location: LocationData) => void)[] = [];

  constructor() {
    this.loadCachedLocation();
  }

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Request location permissions
   */
  async requestLocationPermission(): Promise<LocationPermissionStatus> {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'NSO Location Permission',
            message: 'NSO needs access to your location to provide better healthcare services and track facility visits.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        return {
          granted: granted === PermissionsAndroid.RESULTS.GRANTED,
          canAskAgain: granted !== PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN,
          status: granted,
        };
      } else {
        // For iOS, permissions are handled automatically by the system
        return {
          granted: true,
          canAskAgain: true,
          status: 'granted',
        };
      }
    } catch (error) {
      console.error('Failed to request location permission:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'error',
      };
    }
  }

  /**
   * Get current location
   */
  async getCurrentLocation(options: LocationOptions = {}): Promise<LocationData | null> {
    return new Promise((resolve) => {
      const defaultOptions = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
        ...options,
      };

      Geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude || undefined,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined,
            timestamp: position.timestamp,
          };

          this.lastKnownLocation = locationData;
          this.cacheLocation(locationData);
          this.notifyListeners(locationData);
          resolve(locationData);
        },
        (error) => {
          console.error('Failed to get current location:', error);
          
          // Show user-friendly error messages
          switch (error.code) {
            case 1: // PERMISSION_DENIED
              Alert.alert(
                'Location Permission Required',
                'Please enable location permissions in your device settings to use this feature.'
              );
              break;
            case 2: // POSITION_UNAVAILABLE
              Alert.alert(
                'Location Unavailable',
                'Unable to determine your location. Please check your GPS settings.'
              );
              break;
            case 3: // TIMEOUT
              console.warn('Location request timed out, using cached location if available');
              break;
          }

          resolve(this.lastKnownLocation);
        },
        defaultOptions
      );
    });
  }

  /**
   * Start watching location changes
   */
  startWatchingLocation(options: LocationOptions = {}): void {
    if (this.watchId !== null) {
      this.stopWatchingLocation();
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 10000,
      distanceFilter: 10, // Update every 10 meters
      ...options,
    };

    this.watchId = Geolocation.watchPosition(
      (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude || undefined,
          heading: position.coords.heading || undefined,
          speed: position.coords.speed || undefined,
          timestamp: position.timestamp,
        };

        this.lastKnownLocation = locationData;
        this.cacheLocation(locationData);
        this.notifyListeners(locationData);
      },
      (error) => {
        console.error('Location watch error:', error);
      },
      defaultOptions
    );
  }

  /**
   * Stop watching location changes
   */
  stopWatchingLocation(): void {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Get cached location from storage
   */
  async getCachedLocation(): Promise<LocationData | null> {
    try {
      const cachedLocation = await AsyncStorage.getItem('cached_location');
      if (cachedLocation) {
        const location = JSON.parse(cachedLocation);
        // Check if location is less than 1 hour old
        const oneHour = 60 * 60 * 1000;
        if (Date.now() - location.timestamp < oneHour) {
          return location;
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to get cached location:', error);
      return null;
    }
  }

  /**
   * Cache location data
   */
  async cacheLocation(location: LocationData): Promise<void> {
    try {
      await AsyncStorage.setItem('cached_location', JSON.stringify(location));
    } catch (error) {
      console.error('Failed to cache location:', error);
    }
  }

  /**
   * Load cached location on service initialization
   */
  private async loadCachedLocation(): Promise<void> {
    try {
      this.lastKnownLocation = await this.getCachedLocation();
    } catch (error) {
      console.error('Failed to load cached location:', error);
    }
  }

  /**
   * Get location with fallback to cached
   */
  async getLocationWithFallback(options: LocationOptions = {}): Promise<LocationData | null> {
    try {
      // Try to get current location first
      const currentLocation = await this.getCurrentLocation(options);
      if (currentLocation) {
        return currentLocation;
      }

      // Fallback to cached location
      const cachedLocation = await this.getCachedLocation();
      if (cachedLocation) {
        console.log('Using cached location');
        return cachedLocation;
      }

      // Fallback to last known location
      if (this.lastKnownLocation) {
        console.log('Using last known location');
        return this.lastKnownLocation;
      }

      return null;
    } catch (error) {
      console.error('Failed to get location with fallback:', error);
      return null;
    }
  }

  /**
   * Add location listener
   */
  addLocationListener(listener: (location: LocationData) => void): () => void {
    this.locationListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.locationListeners = this.locationListeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners of location change
   */
  private notifyListeners(location: LocationData): void {
    this.locationListeners.forEach(listener => {
      try {
        listener(location);
      } catch (error) {
        console.error('Error in location listener:', error);
      }
    });
  }

  /**
   * Get last known location
   */
  getLastKnownLocation(): LocationData | null {
    return this.lastKnownLocation;
  }

  /**
   * Calculate distance between two coordinates (in meters)
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Check if location services are available
   */
  async isLocationAvailable(): Promise<boolean> {
    try {
      const permission = await this.requestLocationPermission();
      return permission.granted;
    } catch (error) {
      console.error('Failed to check location availability:', error);
      return false;
    }
  }

  /**
   * Get location accuracy description
   */
  getLocationAccuracyDescription(accuracy: number): string {
    if (accuracy <= 5) return 'Excellent';
    if (accuracy <= 10) return 'Good';
    if (accuracy <= 20) return 'Fair';
    if (accuracy <= 50) return 'Poor';
    return 'Very Poor';
  }

  /**
   * Format location for display
   */
  formatLocationForDisplay(location: LocationData): string {
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  }

  /**
   * Get location context for activity tracking
   */
  async getLocationContext(): Promise<{
    coordinates?: { latitude: number; longitude: number };
    accuracy?: number;
    timestamp?: number;
  }> {
    try {
      const location = await this.getLocationWithFallback();
      if (location) {
        return {
          coordinates: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
          accuracy: location.accuracy,
          timestamp: location.timestamp,
        };
      }
      return {};
    } catch (error) {
      console.error('Failed to get location context:', error);
      return {};
    }
  }
}

// Export singleton instance
export const locationService = LocationService.getInstance();
export default locationService;
