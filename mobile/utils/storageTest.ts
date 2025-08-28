// Storage adapter test utility
// This file can be used to test the storage functionality across different platforms

import AsyncStorage from './storageAdapter';
import { platformInfo } from './platformUtils';

export interface StorageTestResult {
  platform: string;
  storageType: string;
  tests: {
    setItem: boolean;
    getItem: boolean;
    removeItem: boolean;
    clear: boolean;
    getAllKeys: boolean;
    multiGet?: boolean;
    multiSet?: boolean;
    multiRemove?: boolean;
  };
  errors: string[];
  performance: {
    setItemTime: number;
    getItemTime: number;
    getAllKeysTime: number;
  };
}

export const testStorageAdapter = async (): Promise<StorageTestResult> => {
  const result: StorageTestResult = {
    platform: platformInfo().platform,
    storageType: platformInfo().isWeb ? 'localStorage' : 'asyncStorage',
    tests: {
      setItem: false,
      getItem: false,
      removeItem: false,
      clear: false,
      getAllKeys: false,
    },
    errors: [],
    performance: {
      setItemTime: 0,
      getItemTime: 0,
      getAllKeysTime: 0,
    }
  };

  const testKey = 'storage_test_key';
  const testValue = 'storage_test_value_' + Date.now();

  try {
    // Test setItem
    const setStart = performance.now();
    await AsyncStorage.setItem(testKey, testValue);
    result.performance.setItemTime = performance.now() - setStart;
    result.tests.setItem = true;

    // Test getItem
    const getStart = performance.now();
    const retrievedValue = await AsyncStorage.getItem(testKey);
    result.performance.getItemTime = performance.now() - getStart;
    result.tests.getItem = retrievedValue === testValue;

    if (!result.tests.getItem) {
      result.errors.push(`getItem failed: expected "${testValue}", got "${retrievedValue}"`);
    }

    // Test getAllKeys
    const keysStart = performance.now();
    const keys = await AsyncStorage.getAllKeys();
    result.performance.getAllKeysTime = performance.now() - keysStart;
    result.tests.getAllKeys = Array.isArray(keys) && keys.includes(testKey);

    if (!result.tests.getAllKeys) {
      result.errors.push('getAllKeys failed: test key not found in keys array');
    }

    // Test multiGet if available
    if (AsyncStorage.multiGet) {
      try {
        const multiGetResult = await AsyncStorage.multiGet([testKey]);
        result.tests.multiGet = multiGetResult.length > 0 && multiGetResult[0][1] === testValue;
        if (!result.tests.multiGet) {
          result.errors.push('multiGet failed');
        }
      } catch (error) {
        result.errors.push(`multiGet error: ${error}`);
      }
    }

    // Test multiSet if available
    if (AsyncStorage.multiSet) {
      try {
        const multiSetKey = 'multi_set_test';
        const multiSetValue = 'multi_set_value';
        await AsyncStorage.multiSet([[multiSetKey, multiSetValue]]);
        const retrieved = await AsyncStorage.getItem(multiSetKey);
        result.tests.multiSet = retrieved === multiSetValue;
        if (!result.tests.multiSet) {
          result.errors.push('multiSet failed');
        }
        // Clean up
        await AsyncStorage.removeItem(multiSetKey);
      } catch (error) {
        result.errors.push(`multiSet error: ${error}`);
      }
    }

    // Test removeItem
    await AsyncStorage.removeItem(testKey);
    const afterRemove = await AsyncStorage.getItem(testKey);
    result.tests.removeItem = afterRemove === null;

    if (!result.tests.removeItem) {
      result.errors.push('removeItem failed: item still exists after removal');
    }

    // Test clear
    await AsyncStorage.setItem('clear_test', 'clear_value');
    await AsyncStorage.clear();
    const afterClear = await AsyncStorage.getItem('clear_test');
    result.tests.clear = afterClear === null;

    if (!result.tests.clear) {
      result.errors.push('clear failed: items still exist after clear');
    }

  } catch (error) {
    result.errors.push(`Test execution error: ${error}`);
  }

  return result;
};

export const logStorageTestResult = (result: StorageTestResult) => {
  console.log('=== Storage Adapter Test Results ===');
  console.log(`Platform: ${result.platform}`);
  console.log(`Storage Type: ${result.storageType}`);
  console.log('\nTest Results:');
  Object.entries(result.tests).forEach(([test, passed]) => {
    console.log(`  ${test}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  });
  
  console.log('\nPerformance:');
  console.log(`  setItem: ${result.performance.setItemTime.toFixed(2)}ms`);
  console.log(`  getItem: ${result.performance.getItemTime.toFixed(2)}ms`);
  console.log(`  getAllKeys: ${result.performance.getAllKeysTime.toFixed(2)}ms`);
  
  if (result.errors.length > 0) {
    console.log('\nErrors:');
    result.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  console.log('=====================================');
};

// Auto-run test if this file is executed directly
if (typeof window !== 'undefined' && (window as any).__STORAGE_TEST__) {
  testStorageAdapter().then(logStorageTestResult);
}

export default {
  testStorageAdapter,
  logStorageTestResult,
};
