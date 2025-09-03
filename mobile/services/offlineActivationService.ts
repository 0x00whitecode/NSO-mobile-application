import CryptoJS from 'crypto-js';
import { Platform } from 'react-native';
import AsyncStorage from '../utils/storageAdapter';

// Types for offline activation with 12-digit keys
export interface OfflineActivationData {
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  facility?: string;
  state?: string;
  contactInfo?: string;
  status: 'active' | 'revoked' | 'expired' | 'used';
  validUntil: string; // ISO date
  maxUses: number;
  usageCount: number;
  generatedAt: string;
  keyId: string;
}

export interface DecodedActivationKey {
  success: boolean;
  data?: OfflineActivationData;
  error?: string;
  code?: string;
}

export interface DeviceInfo {
  deviceId: string;
  platform: string;
  osVersion: string;
  appVersion: string;
  deviceModel: string;
}

class OfflineActivationService {

  private readonly STORAGE_KEYS = {
    ACTIVATION_DATA: 'offline_activation_data',
    DEVICE_ID: 'device_id',
    USER_DATA: 'user_data',
    ACTIVATION_TIMESTAMP: 'activation_timestamp'
  };

  private readonly ENCRYPTION_KEY = 'nso-activation-key-2024'; // Must match backend

  /**
   * Validate 12-digit activation key and decrypt user data
   */
  async validateActivationKey(activationKey: string): Promise<DecodedActivationKey> {
    try {
      // Remove any non-numeric characters
      const cleanKey = activationKey.replace(/\D/g, '');

      // Validate 12-digit numeric format
      if (cleanKey.length !== 12) {
        return {
          success: false,
          error: 'Invalid activation key length. Must be 12 digits.',
          code: 'INVALID_KEY_LENGTH'
        };
      }

      // Validate numeric only
      if (!/^\d{12}$/.test(cleanKey)) {
        return {
          success: false,
          error: 'Invalid activation key format. Only numbers allowed.',
          code: 'INVALID_KEY_FORMAT'
        };
      }

      // Offline-only validation: do not call backend

      // Try to decrypt embedded user data (offline validation)
      // This will use the key to derive mock user data for now
      try {
        const userData = this.decryptUserData(cleanKey);
        if (userData) {
          return {
            success: true,
            data: userData
          };
        }
      } catch (error) {
        console.log('Offline decryption failed:', error);
      }

      // If all validation methods fail
      return {
        success: false,
        error: 'Invalid activation key. Please check your key and try again.',
        code: 'INVALID_KEY'
      };

    } catch (error) {
      console.error('Activation key validation error:', error);
      return {
        success: false,
        error: 'Activation key validation failed',
        code: 'VALIDATION_ERROR'
      };
    }
  }

  /**
   * Validate key with backend (online validation)
   */
  // Backend validation removed for offline-only mode
  private async validateWithBackend(key: string): Promise<DecodedActivationKey> {
    return { success: false, error: 'Backend validation disabled', code: 'OFFLINE_ONLY' };
  }

  /**
   * Decrypt user data from key (offline validation)
   */
  private decryptUserData(key: string): OfflineActivationData | null {
    try {
      // This is a simplified example. In a real implementation,
      // the key would contain encrypted user data that can be decrypted offline
      // For now, we'll create mock data based on the key
      const expires = new Date();
      expires.setDate(expires.getDate() + 30);

      const mockUserData: OfflineActivationData = {
        fullName: `User ${key.slice(0, 4)}`,
        email: `user${key.slice(0, 4)}@example.com`,
        phone: `+234${key.slice(4, 8)}${key.slice(8, 12)}`,
        role: 'doctor',
        facility: 'Health Facility',
        state: 'Lagos',
        contactInfo: '',
        status: 'active',
        validUntil: expires.toISOString(),
        maxUses: 1,
        usageCount: 0,
        generatedAt: new Date().toISOString(),
        keyId: key
      };

      return mockUserData;
    } catch (error) {
      console.error('Error decrypting user data:', error);
      return null;
    }
  }

  /**
   * Activate device offline using simple activation key
   */
  async activateDeviceOffline(activationKey: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
    code?: string;
  }> {
    try {
      // Validate the activation key
      const validationResult = await this.validateActivationKey(activationKey);

      if (!validationResult.success || !validationResult.data) {
        return {
          success: false,
          error: validationResult.error,
          code: validationResult.code
        };
      }

      const activationData = validationResult.data;

      // Get device information
      const deviceInfo = await this.getDeviceInfo();

      // Check if device is already activated
      const existingActivation = await AsyncStorage.getItem(this.STORAGE_KEYS.ACTIVATION_DATA);
      if (existingActivation) {
        return {
          success: false,
          error: 'Device is already activated',
          code: 'DEVICE_ALREADY_ACTIVATED'
        };
      }

      // Store activation data locally
      const activationRecord = {
        activationKey,
        activationData,
        deviceInfo,
        activatedAt: new Date().toISOString(),
        deviceId: deviceInfo.deviceId
      };

      await AsyncStorage.setItem(this.STORAGE_KEYS.ACTIVATION_DATA, JSON.stringify(activationRecord));
      await AsyncStorage.setItem(this.STORAGE_KEYS.USER_DATA, JSON.stringify(activationData));
      await AsyncStorage.setItem(this.STORAGE_KEYS.ACTIVATION_TIMESTAMP, Date.now().toString());

      // Return success with user data
      return {
        success: true,
        data: {
          user: {
            fullName: activationData.fullName,
            role: activationData.role,
            facility: activationData.facility,
            state: activationData.state,
            contactInfo: activationData.contactInfo
          },
          deviceInfo,
          activationData: {
            validUntil: activationData.validUntil,
            remainingDays: this.calculateRemainingDays(activationData.validUntil),
            maxUses: activationData.maxUses,
            usageCount: activationData.usageCount
          }
        }
      };

    } catch (error) {
      console.error('Offline activation error:', error);
      return {
        success: false,
        error: 'Offline activation failed',
        code: 'ACTIVATION_ERROR'
      };
    }
  }

  /**
   * Get stored activation data
   */
  async getStoredActivationData(): Promise<OfflineActivationData | null> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEYS.USER_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting stored activation data:', error);
      return null;
    }
  }

  /**
   * Check if device is activated
   */
  async isDeviceActivated(): Promise<boolean> {
    try {
      const activationData = await AsyncStorage.getItem(this.STORAGE_KEYS.ACTIVATION_DATA);
      if (!activationData) return false;

      const activation = JSON.parse(activationData);
      const activationDataObj = activation.activationData;

      // Check if activation is still valid
      if (activationDataObj.status !== 'active') return false;
      
      const validUntil = new Date(activationDataObj.validUntil);
      if (validUntil < new Date()) return false;

      return true;
    } catch (error) {
      console.error('Error checking device activation:', error);
      return false;
    }
  }

  /**
   * Clear activation data (for logout/reset)
   */
  async clearActivationData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.STORAGE_KEYS.ACTIVATION_DATA,
        this.STORAGE_KEYS.USER_DATA,
        this.STORAGE_KEYS.ACTIVATION_TIMESTAMP
      ]);
    } catch (error) {
      console.error('Error clearing activation data:', error);
    }
  }

  /**
   * Decrypt data using AES
   */
  private decryptData(encryptedData: string): string | null {
    try {
      // Extract IV (first 32 characters) and encrypted data
      const iv = encryptedData.slice(0, 32);
      const encrypted = encryptedData.slice(32);
      
      // Decrypt using CryptoJS with IV
      const key = CryptoJS.enc.Utf8.parse(this.ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
      const ivBytes = CryptoJS.enc.Hex.parse(iv);
      const encryptedBytes = CryptoJS.enc.Hex.parse(encrypted);
      
      const decrypted = CryptoJS.AES.decrypt(
        { ciphertext: encryptedBytes },
        key,
        { iv: ivBytes, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
      );
      
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption error:', error);
      return null;
    }
  }

  /**
   * Validate activation data
   */
  private validateActivationData(data: OfflineActivationData): {
    isValid: boolean;
    error?: string;
    code?: string;
  } {
    // Check if activation is expired
    const validUntil = new Date(data.validUntil);
    if (validUntil < new Date()) {
      return {
        isValid: false,
        error: 'Activation key has expired',
        code: 'KEY_EXPIRED'
      };
    }

    // Check if activation is revoked
    if (data.status === 'revoked') {
      return {
        isValid: false,
        error: 'Activation key has been revoked',
        code: 'KEY_REVOKED'
      };
    }

    // Check if usage limit exceeded
    if (data.usageCount >= data.maxUses) {
      return {
        isValid: false,
        error: 'Activation key usage limit exceeded',
        code: 'USAGE_LIMIT_EXCEEDED'
      };
    }

    return { isValid: true };
  }

  /**
   * Calculate remaining days until expiration
   */
  private calculateRemainingDays(validUntil: string): number {
    const expirationDate = new Date(validUntil);
    const now = new Date();
    const diffTime = expirationDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  /**
   * Get device information
   */
  private async getDeviceInfo(): Promise<DeviceInfo> {
    const existingId = await AsyncStorage.getItem(this.STORAGE_KEYS.DEVICE_ID);
    const deviceId = existingId || `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (!existingId) {
      await AsyncStorage.setItem(this.STORAGE_KEYS.DEVICE_ID, deviceId);
    }

    const versionAny: any = (Platform as any)?.Version;
    const osVersion = versionAny != null ? String(versionAny) : 'unknown';

    return {
      deviceId,
      platform: Platform.OS,
      osVersion,
      appVersion: '1.0.0', // TODO: read from app config/build
      deviceModel: Platform.OS === 'ios' ? 'iPhone' : (Platform.OS === 'android' ? 'Android Device' : 'Web')
    };
  }
}

export const offlineActivationService = new OfflineActivationService();
