import CryptoJS from 'crypto-js';
import { Platform } from 'react-native';
import AsyncStorage from '../utils/storageAdapter';

// Types for offline activation
export interface OfflineActivationData {
  userId: string;
  fullName: string;
  role: string;
  facility: string;
  state: string;
  contactInfo?: string;
  validUntil: string;
  maxUses: number;
  usageCount: number;
  status: 'active' | 'expired' | 'revoked';
  createdAt: string;
  assignedBy: string;
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
  private readonly ENCRYPTION_KEY = 'nso-offline-key-2024'; // This should be stored securely
  private readonly STORAGE_KEYS = {
    ACTIVATION_DATA: 'offline_activation_data',
    DEVICE_ID: 'device_id',
    USER_DATA: 'user_data',
    ACTIVATION_TIMESTAMP: 'activation_timestamp'
  };

  /**
   * Validate simple activation key format
   */
  async validateActivationKey(activationKey: string): Promise<DecodedActivationKey> {
    try {
      // Remove dashes and convert to uppercase
      const cleanKey = activationKey.replace(/-/g, '').toUpperCase();

      // Validate 12-character format
      if (cleanKey.length !== 12) {
        return {
          success: false,
          error: 'Invalid activation key length. Must be 12 characters.',
          code: 'INVALID_KEY_LENGTH'
        };
      }

      // Validate characters (alphanumeric only)
      if (!/^[A-Z0-9]{12}$/.test(cleanKey)) {
        return {
          success: false,
          error: 'Invalid activation key format. Only letters and numbers allowed.',
          code: 'INVALID_KEY_FORMAT'
        };
      }

      // For simple keys, we'll create mock user data
      // In a real implementation, this would be looked up from a database
      const mockUserData: OfflineActivationData = {
        userId: `user_${cleanKey.slice(0, 4)}`,
        fullName: 'User Name',
        role: 'doctor',
        facility: 'Health Facility',
        state: 'Lagos',
        contactInfo: 'user@example.com',
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
        maxUses: 1,
        usageCount: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
        assignedBy: 'admin@nso.gov.ng'
      };

      return {
        success: true,
        data: mockUserData
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
    const deviceId = await AsyncStorage.getItem(this.STORAGE_KEYS.DEVICE_ID) || 
                    `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store device ID if not exists
    if (!(await AsyncStorage.getItem(this.STORAGE_KEYS.DEVICE_ID))) {
      await AsyncStorage.setItem(this.STORAGE_KEYS.DEVICE_ID, deviceId);
    }

    return {
      deviceId,
      platform: Platform.OS,
      osVersion: Platform.Version.toString(),
      appVersion: '1.0.0', // This should come from app config
      deviceModel: Platform.OS === 'ios' ? 'iPhone' : 'Android Device'
    };
  }
}

export const offlineActivationService = new OfflineActivationService();
