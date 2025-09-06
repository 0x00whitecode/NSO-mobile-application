# NSO Mobile App Store Submission Guide

## Overview

This guide covers the complete process for submitting the NSO Mobile Healthcare Management System to both Google Play Store and Apple App Store.

## App Information

- **App Name**: NSO Mobile
- **Package ID**: com.nso.mobile.v11
- **Version**: 1.0.1
- **Category**: Medical
- **Target Audience**: Healthcare professionals
- **Content Rating**: Everyone (Medical app for professionals)

## Pre-Submission Checklist

### ✅ Technical Requirements
- [x] App builds successfully
- [x] All features tested and working
- [x] Activation key validation implemented
- [x] Navigation issues fixed
- [x] Offline functionality working
- [x] Location permissions properly configured
- [x] App icons and splash screens created
- [x] App signing configured

### ✅ Content Requirements
- [x] App description written
- [x] Screenshots prepared
- [x] Privacy policy created
- [x] Terms of service created
- [x] Feature list documented

## Building the APK

### Method 1: Using Build Script (Recommended)
```bash
cd mobile
./scripts/build-apk.sh
```

### Method 2: Manual Build
```bash
cd mobile
npm install
npx eas-cli build --platform android --profile production --local
```

## Google Play Store Submission

### 1. Create Developer Account
1. Go to [Google Play Console](https://play.google.com/console)
2. Pay the $25 one-time registration fee
3. Complete developer profile

### 2. Create App Listing
1. Click "Create app"
2. Fill in app details:
   - **App name**: NSO Mobile
   - **Default language**: English
   - **App or game**: App
   - **Free or paid**: Free
   - **Declarations**: Check all applicable boxes

### 3. App Content
Fill out the following sections:

#### App Access
- All functionality is available without special access
- No restrictions on usage

#### Ads
- Does not contain ads

#### Content Rating
- Complete the content rating questionnaire
- Select "Medical" category
- Answer questions about medical content

#### Target Audience
- Target age: 18+
- Primary audience: Healthcare professionals

#### News Apps
- Not applicable (not a news app)

### 4. Store Listing
#### Main Store Listing
- **App name**: NSO Mobile
- **Short description**: Smart Clinical Assistant for Healthcare Workers
- **Full description**: 
```
NSO Mobile is a comprehensive healthcare management system designed for healthcare professionals working in field and clinical environments. 

Key Features:
• Smart clinical decision support
• Offline-first design for low connectivity areas
• GPS-enabled facility tracking
• Secure activation key system
• Evidence-based diagnostic guidelines
• Real-time data synchronization
• Administrative dashboard integration

Perfect for:
• Community health workers
• Field medical professionals
• Rural healthcare providers
• Clinical supervisors
• Healthcare administrators

The app works seamlessly offline and syncs data when connectivity is available, ensuring healthcare delivery is never interrupted by network issues.
```

#### Graphics
- **App icon**: 512x512 PNG (already created)
- **Feature graphic**: 1024x500 PNG
- **Screenshots**: At least 2, up to 8 (phone screenshots)
- **Phone screenshots**: 16:9 or 9:16 aspect ratio

#### Categorization
- **Category**: Medical
- **Tags**: healthcare, medical, clinical, offline, field-work

### 5. Release Management
#### Production Release
1. Upload the signed APK
2. Set release name: "NSO Mobile v1.0.1"
3. Add release notes:
```
Initial release of NSO Mobile Healthcare Management System

Features:
• Smart clinical decision support
• Offline functionality for remote areas
• Secure activation system
• GPS tracking and facility management
• Real-time data synchronization
• Evidence-based diagnostic tools

This version includes enhanced security features and improved navigation.
```

## Apple App Store Submission

### 1. Apple Developer Account
1. Enroll in [Apple Developer Program](https://developer.apple.com/programs/) ($99/year)
2. Complete enrollment process

### 2. App Store Connect
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Create new app:
   - **Platform**: iOS
   - **Name**: NSO Mobile
   - **Primary Language**: English
   - **Bundle ID**: com.nso.mobile.v11
   - **SKU**: NSO-MOBILE-V11

### 3. App Information
- **Category**: Medical
- **Secondary Category**: Productivity
- **Content Rights**: Does not use third-party content
- **Age Rating**: 4+ (Medical/Treatment Information)

### 4. Pricing and Availability
- **Price**: Free
- **Availability**: All countries
- **App Store Distribution**: Available

### 5. App Store Listing
#### Version Information
- **Version**: 1.0.1
- **Copyright**: © 2024 National Statistics Office
- **Description**: (Same as Google Play description)
- **Keywords**: healthcare,medical,clinical,offline,field,diagnosis,nso
- **Support URL**: https://nso.gov.ng/support
- **Marketing URL**: https://nso.gov.ng/mobile

#### App Review Information
- **Contact Information**: Provide valid contact details
- **Demo Account**: Create demo account with valid activation key
- **Notes**: 
```
This is a healthcare management app for professional use. 
Demo credentials:
- Activation Key: 123456789012
- This will create a demo account for testing purposes.
The app requires location permissions for facility tracking.
```

## Required Assets

### App Icons
- **Android**: 512x512 PNG (adaptive icon)
- **iOS**: 1024x1024 PNG

### Screenshots
Create screenshots showing:
1. Onboarding/activation screen
2. Dashboard with key features
3. Clinical decision support
4. Category selection
5. Offline functionality indicator
6. Profile/settings screen

### Marketing Materials
- **Feature Graphic**: 1024x500 PNG for Google Play
- **App Preview Video**: 30-second demo (optional but recommended)

## Privacy Policy

Create a comprehensive privacy policy covering:
- Data collection (location, usage data)
- Data storage and security
- Third-party services
- User rights
- Contact information

Host at: https://nso.gov.ng/mobile/privacy

## Terms of Service

Create terms covering:
- Acceptable use
- Professional use requirements
- Activation key policies
- Liability limitations
- Termination conditions

Host at: https://nso.gov.ng/mobile/terms

## Testing Before Submission

### Internal Testing
1. Test all core features
2. Verify activation key validation
3. Test offline functionality
4. Verify location permissions
5. Test on multiple devices

### Beta Testing
1. **Google Play**: Use Internal Testing track
2. **Apple**: Use TestFlight
3. Recruit healthcare professionals for testing
4. Gather feedback and fix issues

## Submission Timeline

### Google Play Store
- **Review Time**: 1-3 days typically
- **Expedited Review**: Available for critical issues

### Apple App Store
- **Review Time**: 1-7 days typically
- **Expedited Review**: Available for critical issues (2 per year)

## Post-Submission

### After Approval
1. Monitor app performance
2. Respond to user reviews
3. Track download metrics
4. Plan updates and improvements

### Updates
- Regular security updates
- Feature enhancements
- Bug fixes
- New clinical guidelines

## Support and Maintenance

### User Support
- Create support documentation
- Set up user feedback system
- Monitor app store reviews
- Provide timely responses

### Analytics
- Track app usage
- Monitor crash reports
- Analyze user behavior
- Measure feature adoption

## Compliance

### Healthcare Regulations
- Ensure HIPAA compliance (if applicable)
- Follow local healthcare data regulations
- Implement proper data encryption
- Maintain audit trails

### App Store Policies
- Regular policy compliance reviews
- Update app as policies change
- Monitor for policy violations
- Maintain good standing

This guide provides a comprehensive roadmap for successfully submitting NSO Mobile to both major app stores.
