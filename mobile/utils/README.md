# Cross-Platform Storage Solution

This directory contains utilities for handling cross-platform storage and platform detection in the NSO mobile app.

## Overview

The storage solution provides a unified interface for data persistence across different platforms:
- **Web**: Uses `localStorage` with fallback to in-memory storage
- **React Native**: Uses `@react-native-async-storage/async-storage` with fallback to web storage
- **Node.js/SSR**: Uses in-memory storage with proper polyfills

## Files

### `storageAdapter.ts`
The main storage adapter that provides a unified AsyncStorage interface.

**Features:**
- Automatic platform detection
- Lazy initialization
- Comprehensive error handling
- Fallback mechanisms
- Support for all AsyncStorage methods including `multiGet`, `multiSet`, `multiRemove`

**Usage:**
```typescript
import AsyncStorage from '../utils/storageAdapter';

// Basic operations
await AsyncStorage.setItem('key', 'value');
const value = await AsyncStorage.getItem('key');
await AsyncStorage.removeItem('key');
await AsyncStorage.clear();

// Batch operations (if supported by platform)
await AsyncStorage.multiGet(['key1', 'key2']);
await AsyncStorage.multiSet([['key1', 'value1'], ['key2', 'value2']]);
await AsyncStorage.multiRemove(['key1', 'key2']);

// Get all keys
const keys = await AsyncStorage.getAllKeys();
```

### `platformUtils.ts`
Platform detection utilities for consistent platform information across the app.

**Features:**
- Comprehensive platform detection
- Device capability detection
- Environment-specific configurations
- Network status detection

**Usage:**
```typescript
import { platformInfo, isWeb, isReactNative, getPlatform } from '../utils/platformUtils';

// Get full platform info
const info = platformInfo();
console.log(info.platform); // 'web', 'android', 'ios', or 'unknown'

// Convenience functions
if (isWeb()) {
  // Web-specific code
}

if (isReactNative()) {
  // React Native-specific code
}

// Get device capabilities
const capabilities = getDeviceCapabilities();
if (capabilities.hasGeolocation) {
  // Use geolocation
}

// Get environment config
const config = getEnvironmentConfig();
console.log(config.apiBaseUrl);
```

### `polyfills.ts`
Comprehensive polyfills for web compatibility.

**Features:**
- Window object polyfill for SSR/Node.js
- Document object polyfill
- Navigator object polyfill
- Location object polyfill
- Additional React Native compatibility polyfills

**Usage:**
```typescript
// Import early in your app entry point
import '../utils/polyfills';
```

### `storageTest.ts`
Test utility for verifying storage functionality.

**Usage:**
```typescript
import { testStorageAdapter, logStorageTestResult } from '../utils/storageTest';

// Run storage tests
const result = await testStorageAdapter();
logStorageTestResult(result);
```

## Integration

### 1. Import polyfills early
Add to your main entry point (e.g., `app/_layout.tsx`):
```typescript
import '../utils/polyfills';
```

### 2. Replace AsyncStorage imports
Replace all `@react-native-async-storage/async-storage` imports with:
```typescript
import AsyncStorage from '../utils/storageAdapter';
```

### 3. Use platform utilities
Use platform detection for platform-specific code:
```typescript
import { isWeb, isReactNative } from '../utils/platformUtils';

if (isWeb()) {
  // Web-specific implementation
} else if (isReactNative()) {
  // React Native-specific implementation
}
```

## Error Handling

The storage adapter includes comprehensive error handling:

- **Storage unavailable**: Falls back to in-memory storage
- **Platform detection failure**: Defaults to web storage
- **AsyncStorage loading failure**: Falls back to web storage
- **All operations**: Wrapped in try-catch with console warnings

## Performance Considerations

- **Lazy initialization**: Storage adapter is only created when first used
- **Cached platform info**: Platform detection results are cached
- **Batch operations**: Use `multiGet`, `multiSet`, `multiRemove` when possible
- **Error recovery**: Failed operations don't crash the app

## Testing

Run storage tests to verify functionality:
```typescript
import { testStorageAdapter } from '../utils/storageTest';

// In development
if (__DEV__) {
  testStorageAdapter().then(result => {
    console.log('Storage test result:', result);
  });
}
```

## Troubleshooting

### Common Issues

1. **"window is not defined" error**
   - Ensure `polyfills.ts` is imported early in your app
   - Check that polyfills are imported before any storage usage

2. **Storage not working on web**
   - Verify that `localStorage` is available in the browser
   - Check for browser privacy settings blocking storage

3. **Storage not working on mobile**
   - Ensure `@react-native-async-storage/async-storage` is installed
   - Check that the package is properly linked

4. **Performance issues**
   - Use batch operations (`multiGet`, `multiSet`) for multiple items
   - Avoid storing large objects (consider compression)
   - Implement cleanup for old data

### Debug Mode

Enable debug logging:
```typescript
// Add to your app initialization
if (__DEV__) {
  (window as any).__STORAGE_TEST__ = true;
  import('../utils/storageTest');
}
```

## Migration Guide

### From direct AsyncStorage usage:

**Before:**
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
```

**After:**
```typescript
import AsyncStorage from '../utils/storageAdapter';
```

### From platform-specific code:

**Before:**
```typescript
import { Platform } from 'react-native';

if (Platform.OS === 'web') {
  // Web code
} else {
  // Mobile code
}
```

**After:**
```typescript
import { isWeb, isReactNative } from '../utils/platformUtils';

if (isWeb()) {
  // Web code
} else if (isReactNative()) {
  // Mobile code
}
```

## Best Practices

1. **Import polyfills early**: Always import `polyfills.ts` before any other imports
2. **Use platform detection**: Use `platformUtils` for platform-specific code
3. **Handle errors gracefully**: Storage operations can fail, always handle errors
4. **Test across platforms**: Verify functionality on web, Android, and iOS
5. **Use batch operations**: Prefer `multiGet`/`multiSet` for multiple items
6. **Clean up old data**: Implement data cleanup strategies
7. **Monitor storage usage**: Be aware of storage limits on different platforms

## Platform Support

| Platform | Storage Type | Status | Notes |
|----------|-------------|--------|-------|
| Web (Browser) | localStorage | ✅ Full | Includes fallback to in-memory |
| React Native (Android) | AsyncStorage | ✅ Full | Native implementation |
| React Native (iOS) | AsyncStorage | ✅ Full | Native implementation |
| Node.js/SSR | In-memory | ✅ Full | Polyfilled environment |
| Expo | AsyncStorage | ✅ Full | Compatible with Expo managed workflow |

## Contributing

When adding new storage features:

1. Update the `StorageInterface` in `storageAdapter.ts`
2. Implement the feature in both `WebStorageAdapter` and `ReactNativeStorageAdapter`
3. Add tests to `storageTest.ts`
4. Update this README with usage examples
5. Test on all supported platforms
