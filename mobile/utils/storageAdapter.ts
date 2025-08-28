// Enhanced storage adapter for cross-platform compatibility
// Handles both React Native and web environments with better error handling

interface StorageInterface {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
  getAllKeys(): Promise<string[]>;
  multiGet?(keys: string[]): Promise<Array<[string, string | null]>>;
  multiSet?(keyValuePairs: Array<[string, string]>): Promise<void>;
  multiRemove?(keys: string[]): Promise<void>;
}

// Import platform utilities
import { isWeb, isReactNative, isNode } from './platformUtils';

class WebStorageAdapter implements StorageInterface {
  private storage: Storage | null = null;

  constructor() {
    // Initialize storage when needed
    this.initializeStorage();
  }

  private initializeStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        this.storage = window.localStorage;
      } else {
        this.storage = null;
      }
    } catch (error) {
      console.warn('Failed to initialize web storage:', error);
      this.storage = null;
    }
  }

  private getStorage(): Storage {
    if (!this.storage) {
      this.initializeStorage();
    }
    return this.storage || {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0
    };
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const storage = this.getStorage();
      return storage.getItem(key);
    } catch (error) {
      console.warn('Web storage getItem failed:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      const storage = this.getStorage();
      storage.setItem(key, value);
    } catch (error) {
      console.warn('Web storage setItem failed:', error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      const storage = this.getStorage();
      storage.removeItem(key);
    } catch (error) {
      console.warn('Web storage removeItem failed:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const storage = this.getStorage();
      storage.clear();
    } catch (error) {
      console.warn('Web storage clear failed:', error);
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      const storage = this.getStorage();
      const keys: string[] = [];
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key) keys.push(key);
      }
      return keys;
    } catch (error) {
      console.warn('Web storage getAllKeys failed:', error);
      return [];
    }
  }

  // Additional methods for React Native compatibility
  async multiGet(keys: string[]): Promise<Array<[string, string | null]>> {
    try {
      const storage = this.getStorage();
      return keys.map(key => [key, storage.getItem(key)]);
    } catch (error) {
      console.warn('Web storage multiGet failed:', error);
      return keys.map(key => [key, null]);
    }
  }

  async multiSet(keyValuePairs: Array<[string, string]>): Promise<void> {
    try {
      const storage = this.getStorage();
      keyValuePairs.forEach(([key, value]) => {
        storage.setItem(key, value);
      });
    } catch (error) {
      console.warn('Web storage multiSet failed:', error);
    }
  }

  async multiRemove(keys: string[]): Promise<void> {
    try {
      const storage = this.getStorage();
      keys.forEach(key => {
        storage.removeItem(key);
      });
    } catch (error) {
      console.warn('Web storage multiRemove failed:', error);
    }
  }
}

class ReactNativeStorageAdapter implements StorageInterface {
  private asyncStorage: any;

  constructor() {
    try {
      this.asyncStorage = require('@react-native-async-storage/async-storage');
    } catch (error) {
      console.warn('AsyncStorage not available, falling back to web storage');
      this.asyncStorage = null;
    }
  }

  private getAsyncStorage(): any {
    if (!this.asyncStorage) {
      try {
        this.asyncStorage = require('@react-native-async-storage/async-storage');
      } catch (error) {
        console.warn('AsyncStorage still not available');
        return null;
      }
    }
    return this.asyncStorage;
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const storage = this.getAsyncStorage();
      if (storage) {
        return await storage.getItem(key);
      }
      return null;
    } catch (error) {
      console.warn('React Native storage getItem failed:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      const storage = this.getAsyncStorage();
      if (storage) {
        await storage.setItem(key, value);
      }
    } catch (error) {
      console.warn('React Native storage setItem failed:', error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      const storage = this.getAsyncStorage();
      if (storage) {
        await storage.removeItem(key);
      }
    } catch (error) {
      console.warn('React Native storage removeItem failed:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const storage = this.getAsyncStorage();
      if (storage) {
        await storage.clear();
      }
    } catch (error) {
      console.warn('React Native storage clear failed:', error);
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      const storage = this.getAsyncStorage();
      if (storage) {
        return await storage.getAllKeys();
      }
      return [];
    } catch (error) {
      console.warn('React Native storage getAllKeys failed:', error);
      return [];
    }
  }

  // Additional methods for React Native compatibility
  async multiGet(keys: string[]): Promise<Array<[string, string | null]>> {
    try {
      const storage = this.getAsyncStorage();
      if (storage && storage.multiGet) {
        return await storage.multiGet(keys);
      }
      // Fallback to individual gets
      const results: Array<[string, string | null]> = [];
      for (const key of keys) {
        const value = await this.getItem(key);
        results.push([key, value]);
      }
      return results;
    } catch (error) {
      console.warn('React Native storage multiGet failed:', error);
      return keys.map(key => [key, null]);
    }
  }

  async multiSet(keyValuePairs: Array<[string, string]>): Promise<void> {
    try {
      const storage = this.getAsyncStorage();
      if (storage && storage.multiSet) {
        await storage.multiSet(keyValuePairs);
      } else {
        // Fallback to individual sets
        for (const [key, value] of keyValuePairs) {
          await this.setItem(key, value);
        }
      }
    } catch (error) {
      console.warn('React Native storage multiSet failed:', error);
    }
  }

  async multiRemove(keys: string[]): Promise<void> {
    try {
      const storage = this.getAsyncStorage();
      if (storage && storage.multiRemove) {
        await storage.multiRemove(keys);
      } else {
        // Fallback to individual removes
        for (const key of keys) {
          await this.removeItem(key);
        }
      }
    } catch (error) {
      console.warn('React Native storage multiRemove failed:', error);
    }
  }
}

// Platform detection and storage adapter creation moved to lazy initialization

// Create a lazy-initialized storage adapter
let _storageAdapter: StorageInterface | null = null;

function getStorageAdapter(): StorageInterface {
  if (!_storageAdapter) {
    // Enhanced platform detection with fallbacks
    let adapter: StorageInterface;

    // Try React Native first if we're in a React Native environment
    if (isReactNative()) {
      try {
        adapter = new ReactNativeStorageAdapter();
        // Test if the adapter works
        adapter.getItem('test').catch(() => {
          console.warn('React Native storage failed, falling back to web storage');
          adapter = new WebStorageAdapter();
        });
      } catch (error) {
        console.warn('React Native storage initialization failed, using web storage');
        adapter = new WebStorageAdapter();
      }
    } else if (isWeb() || typeof window === 'undefined') {
      // Use web storage for web environments or when window is undefined
      adapter = new WebStorageAdapter();
    } else {
      // Fallback to web storage for other environments
      adapter = new WebStorageAdapter();
    }

    _storageAdapter = adapter;
  }
  return _storageAdapter;
}

// Export the storage adapter as AsyncStorage for compatibility
export default {
  getItem: (key: string) => getStorageAdapter().getItem(key),
  setItem: (key: string, value: string) => getStorageAdapter().setItem(key, value),
  removeItem: (key: string) => getStorageAdapter().removeItem(key),
  clear: () => getStorageAdapter().clear(),
  getAllKeys: () => getStorageAdapter().getAllKeys(),
  multiGet: (keys: string[]) => getStorageAdapter().multiGet?.(keys) || Promise.resolve(keys.map(key => [key, null])),
  multiSet: (keyValuePairs: Array<[string, string]>) => getStorageAdapter().multiSet?.(keyValuePairs) || Promise.resolve(),
  multiRemove: (keys: string[]) => getStorageAdapter().multiRemove?.(keys) || Promise.resolve(),
};

// Also export individual methods for direct use
export const getItem = (key: string) => getStorageAdapter().getItem(key);
export const setItem = (key: string, value: string) => getStorageAdapter().setItem(key, value);
export const removeItem = (key: string) => getStorageAdapter().removeItem(key);
export const clear = () => getStorageAdapter().clear();
export const getAllKeys = () => getStorageAdapter().getAllKeys();
export const multiGet = (keys: string[]) => getStorageAdapter().multiGet?.(keys) || Promise.resolve(keys.map(key => [key, null]));
export const multiSet = (keyValuePairs: Array<[string, string]>) => getStorageAdapter().multiSet?.(keyValuePairs) || Promise.resolve();
export const multiRemove = (keys: string[]) => getStorageAdapter().multiRemove?.(keys) || Promise.resolve();
