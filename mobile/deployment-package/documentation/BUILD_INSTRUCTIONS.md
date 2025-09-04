# NSO Mobile Build Instructions

## Prerequisites
- Node.js 18+ installed
- Expo CLI installed
- EAS CLI installed
- Android Studio (for Android builds)
- Xcode (for iOS builds)

## Building APK

### Method 1: EAS Build (Recommended)
```bash
cd mobile
npm install
npx eas-cli build --platform android --profile production
```

### Method 2: Local Build
```bash
cd mobile
npm install
npx expo build:android --type apk
```

## Building for iOS
```bash
cd mobile
npm install
npx eas-cli build --platform ios --profile production
```

## Testing
1. Install APK on test device
2. Test all core features
3. Verify activation key validation
4. Test offline functionality
5. Verify location permissions

## Deployment
1. Upload to Google Play Console
2. Upload to App Store Connect
3. Complete store listings
4. Submit for review
