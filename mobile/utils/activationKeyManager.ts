/**
 * Activation Key Management Utilities
 * Helps manage valid activation keys for offline validation
 */

import AsyncStorage from './storageAdapter';

export interface StoredActivationKey {
  key: string;
  encryptedUserData: string;
  userDetails: {
    fullName: string;
    email: string;
    role: string;
    facility?: string;
    state?: string;
  };
  status: 'active' | 'used' | 'expired' | 'revoked';
  expiresAt: string;
  createdAt: string;
}

export class ActivationKeyManager {
  private static STORAGE_KEY = 'valid_activation_keys';

  /**
   * Add a valid activation key to local storage
   */
  static async addValidKey(keyData: StoredActivationKey): Promise<void> {
    try {
      const existingKeys = await this.getValidKeys();
      
      // Check if key already exists
      const existingIndex = existingKeys.findIndex(k => k.key === keyData.key);
      
      if (existingIndex >= 0) {
        // Update existing key
        existingKeys[existingIndex] = keyData;
      } else {
        // Add new key
        existingKeys.push(keyData);
      }

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingKeys));
      console.log(`Added/updated activation key: ${keyData.key}`);
    } catch (error) {
      console.error('Error adding activation key:', error);
      throw error;
    }
  }

  /**
   * Get all valid activation keys from storage
   */
  static async getValidKeys(): Promise<StoredActivationKey[]> {
    try {
      const storedData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (storedData) {
        return JSON.parse(storedData);
      }
      return [];
    } catch (error) {
      console.error('Error getting valid keys:', error);
      return [];
    }
  }

  /**
   * Check if a key exists and is valid
   */
  static async isKeyValid(key: string): Promise<boolean> {
    try {
      const validKeys = await this.getValidKeys();
      const keyData = validKeys.find(k => k.key === key);
      
      if (!keyData) {
        return false;
      }

      // Check if key is expired
      if (new Date(keyData.expiresAt) < new Date()) {
        return false;
      }

      // Check if key is active
      return keyData.status === 'active';
    } catch (error) {
      console.error('Error checking key validity:', error);
      return false;
    }
  }

  /**
   * Mark a key as used
   */
  static async markKeyAsUsed(key: string): Promise<void> {
    try {
      const validKeys = await this.getValidKeys();
      const keyIndex = validKeys.findIndex(k => k.key === key);
      
      if (keyIndex >= 0) {
        validKeys[keyIndex].status = 'used';
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(validKeys));
        console.log(`Marked key as used: ${key}`);
      }
    } catch (error) {
      console.error('Error marking key as used:', error);
      throw error;
    }
  }

  /**
   * Initialize with demo keys for testing
   */
  static async initializeDemoKeys(): Promise<void> {
    try {
      const existingKeys = await this.getValidKeys();
      
      // Only add demo keys if no keys exist
      if (existingKeys.length === 0) {
        const demoKeys: StoredActivationKey[] = [
          {
            key: '123456789012',
            encryptedUserData: Buffer.from(JSON.stringify({
              fullName: 'Dr. John Doe',
              email: 'john.doe@example.com',
              phone: '+2348012345678',
              role: 'doctor',
              facility: 'Central Hospital',
              state: 'Lagos',
              generatedAt: new Date().toISOString(),
              validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            })).toString('base64'),
            userDetails: {
              fullName: 'Dr. John Doe',
              email: 'john.doe@example.com',
              role: 'doctor',
              facility: 'Central Hospital',
              state: 'Lagos'
            },
            status: 'active',
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString()
          },
          {
            key: '987654321098',
            encryptedUserData: Buffer.from(JSON.stringify({
              fullName: 'Nurse Jane Smith',
              email: 'jane.smith@example.com',
              phone: '+2348087654321',
              role: 'nurse',
              facility: 'Community Clinic',
              state: 'Abuja',
              generatedAt: new Date().toISOString(),
              validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            })).toString('base64'),
            userDetails: {
              fullName: 'Nurse Jane Smith',
              email: 'jane.smith@example.com',
              role: 'nurse',
              facility: 'Community Clinic',
              state: 'Abuja'
            },
            status: 'active',
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString()
          },
          {
            key: '111111111111',
            encryptedUserData: Buffer.from(JSON.stringify({
              fullName: 'Admin User',
              email: 'admin@nso.gov.ng',
              phone: '+2348011111111',
              role: 'admin',
              facility: 'NSO Headquarters',
              state: 'FCT',
              generatedAt: new Date().toISOString(),
              validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
            })).toString('base64'),
            userDetails: {
              fullName: 'Admin User',
              email: 'admin@nso.gov.ng',
              role: 'admin',
              facility: 'NSO Headquarters',
              state: 'FCT'
            },
            status: 'active',
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString()
          }
        ];

        for (const key of demoKeys) {
          await this.addValidKey(key);
        }

        console.log('Demo activation keys initialized');
      }
    } catch (error) {
      console.error('Error initializing demo keys:', error);
      throw error;
    }
  }

  /**
   * Clear all stored keys (for testing)
   */
  static async clearAllKeys(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      console.log('All activation keys cleared');
    } catch (error) {
      console.error('Error clearing keys:', error);
      throw error;
    }
  }
}
