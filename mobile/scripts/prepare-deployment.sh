#!/bin/bash

# NSO Mobile Deployment Preparation Script
# This script prepares all files needed for app store submission

set -e

echo "📦 NSO Mobile Deployment Preparation"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create deployment directory
DEPLOY_DIR="deployment-package"
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

print_status "Creating deployment package..."

# Create directory structure
mkdir -p "$DEPLOY_DIR/app-store-assets"
mkdir -p "$DEPLOY_DIR/screenshots"
mkdir -p "$DEPLOY_DIR/documentation"
mkdir -p "$DEPLOY_DIR/build-files"

# Copy app configuration files
print_status "Copying app configuration..."
cp app.json "$DEPLOY_DIR/build-files/"
cp eas.json "$DEPLOY_DIR/build-files/"
cp package.json "$DEPLOY_DIR/build-files/"

# Copy app icons and assets
print_status "Copying app assets..."
cp -r assets/images "$DEPLOY_DIR/app-store-assets/"

# Copy documentation
print_status "Copying documentation..."
cp ../APP_STORE_SUBMISSION_GUIDE.md "$DEPLOY_DIR/documentation/"
cp ../NAVIGATION_FIXES.md "$DEPLOY_DIR/documentation/" 2>/dev/null || true
cp ../ACTIVATION_KEY_FIXES.md "$DEPLOY_DIR/documentation/" 2>/dev/null || true

# Create app store descriptions
print_status "Creating app store descriptions..."

cat > "$DEPLOY_DIR/app-store-assets/app-description.txt" << 'EOF'
NSO Mobile - Smart Clinical Assistant for Healthcare Workers

NSO Mobile is a comprehensive healthcare management system designed for healthcare professionals working in field and clinical environments.

Key Features:
• Smart clinical decision support with evidence-based guidelines
• Offline-first design for low connectivity areas
• GPS-enabled facility tracking and location services
• Secure activation key system for authorized access
• Real-time data synchronization when online
• Administrative dashboard integration
• Clinical category management
• Patient diagnosis and record keeping
• Activity tracking and reporting

Perfect for:
• Community health workers
• Field medical professionals
• Rural healthcare providers
• Clinical supervisors
• Healthcare administrators
• Medical inspectors

The app works seamlessly offline and syncs data when connectivity is available, ensuring healthcare delivery is never interrupted by network issues. Built with security and reliability in mind, NSO Mobile helps healthcare professionals provide better care while maintaining proper documentation and oversight.

Technical Features:
• Offline data storage and sync
• Location-based services
• Encrypted data transmission
• Role-based access control
• Multi-language support ready
• Cross-platform compatibility
EOF

# Create keywords file
cat > "$DEPLOY_DIR/app-store-assets/keywords.txt" << 'EOF'
healthcare, medical, clinical, offline, field-work, diagnosis, nso, health-management, medical-records, clinical-decision-support, healthcare-workers, medical-app, health-data, patient-care, medical-diagnosis, healthcare-system, clinical-guidelines, medical-professionals, health-tracking, medical-documentation
EOF

# Create release notes
cat > "$DEPLOY_DIR/app-store-assets/release-notes.txt" << 'EOF'
NSO Mobile v1.0.1 - Initial Release

🎉 Welcome to NSO Mobile - Your Smart Clinical Assistant!

New Features:
✅ Smart clinical decision support system
✅ Offline functionality for remote areas
✅ Secure activation key validation
✅ GPS tracking and facility management
✅ Real-time data synchronization
✅ Evidence-based diagnostic tools
✅ Clinical category management
✅ User profile and settings management

Security & Performance:
🔒 Enhanced activation key validation
🔒 Improved authentication system
🚀 Optimized navigation and user experience
🚀 Better offline data handling
🚀 Improved error handling and logging

This initial release provides healthcare professionals with a comprehensive tool for clinical decision-making, patient management, and data collection in both connected and offline environments.

Perfect for healthcare workers in rural areas, community health programs, and field medical services.
EOF

# Create privacy policy template
cat > "$DEPLOY_DIR/documentation/privacy-policy-template.md" << 'EOF'
# NSO Mobile Privacy Policy

## Information We Collect
- Location data for facility tracking
- Usage analytics for app improvement
- User profile information
- Clinical activity data

## How We Use Information
- Provide healthcare services
- Improve app functionality
- Generate usage reports
- Ensure data security

## Data Security
- End-to-end encryption
- Secure data transmission
- Local data protection
- Regular security audits

## Your Rights
- Access your data
- Request data deletion
- Opt-out of analytics
- Contact support

## Contact Information
Email: support@nso.gov.ng
Website: https://nso.gov.ng/mobile
EOF

# Create terms of service template
cat > "$DEPLOY_DIR/documentation/terms-of-service-template.md" << 'EOF'
# NSO Mobile Terms of Service

## Acceptance of Terms
By using NSO Mobile, you agree to these terms.

## Professional Use
This app is designed for healthcare professionals only.

## Activation Keys
- Keys are provided by authorized administrators
- Keys are non-transferable
- Misuse may result in access revocation

## Data Responsibility
- Users are responsible for data accuracy
- Follow local healthcare regulations
- Maintain patient confidentiality

## Limitation of Liability
NSO Mobile is a tool to assist healthcare decisions, not replace professional judgment.

## Contact
For questions: support@nso.gov.ng
EOF

# Create build instructions
cat > "$DEPLOY_DIR/documentation/BUILD_INSTRUCTIONS.md" << 'EOF'
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
EOF

# Create submission checklist
cat > "$DEPLOY_DIR/documentation/SUBMISSION_CHECKLIST.md" << 'EOF'
# App Store Submission Checklist

## Pre-Submission
- [ ] App builds successfully
- [ ] All features tested
- [ ] Screenshots taken
- [ ] App description written
- [ ] Privacy policy created
- [ ] Terms of service created
- [ ] App icons prepared
- [ ] Release notes written

## Google Play Store
- [ ] Developer account created
- [ ] App listing created
- [ ] APK uploaded
- [ ] Store listing completed
- [ ] Content rating completed
- [ ] Pricing set (Free)
- [ ] Release submitted

## Apple App Store
- [ ] Developer account created
- [ ] App Store Connect setup
- [ ] iOS build uploaded
- [ ] App information completed
- [ ] Screenshots uploaded
- [ ] Review information provided
- [ ] App submitted

## Post-Submission
- [ ] Monitor review status
- [ ] Respond to reviewer feedback
- [ ] Plan marketing strategy
- [ ] Prepare user support
EOF

# Create demo credentials file
cat > "$DEPLOY_DIR/documentation/DEMO_CREDENTIALS.md" << 'EOF'
# Demo Credentials for App Store Review

## Activation Keys for Testing

### Doctor Account
- **Key**: 123456789012
- **User**: Dr. John Doe
- **Role**: Doctor
- **Facility**: Central Hospital

### Nurse Account
- **Key**: 987654321098
- **User**: Nurse Jane Smith
- **Role**: Nurse
- **Facility**: Community Clinic

### Admin Account
- **Key**: 111111111111
- **User**: Admin User
- **Role**: Admin
- **Facility**: NSO Headquarters

## Testing Instructions
1. Install the app
2. Use any of the above activation keys
3. Complete the registration process
4. Explore all features
5. Test offline functionality by turning off internet

## Features to Test
- Activation and registration
- Dashboard navigation
- Clinical categories
- Decision support tools
- Profile management
- Offline functionality
- Location services (if prompted)
EOF

print_success "Deployment package created successfully!"

echo ""
echo "📋 Deployment Package Contents:"
echo "==============================="
echo "📁 $DEPLOY_DIR/"
echo "  ├── 📁 app-store-assets/"
echo "  │   ├── 📄 app-description.txt"
echo "  │   ├── 📄 keywords.txt"
echo "  │   ├── 📄 release-notes.txt"
echo "  │   └── 📁 images/ (app icons and assets)"
echo "  ├── 📁 screenshots/ (empty - add your screenshots here)"
echo "  ├── 📁 documentation/"
echo "  │   ├── 📄 APP_STORE_SUBMISSION_GUIDE.md"
echo "  │   ├── 📄 BUILD_INSTRUCTIONS.md"
echo "  │   ├── 📄 SUBMISSION_CHECKLIST.md"
echo "  │   ├── 📄 DEMO_CREDENTIALS.md"
echo "  │   ├── 📄 privacy-policy-template.md"
echo "  │   └── 📄 terms-of-service-template.md"
echo "  └── 📁 build-files/"
echo "      ├── 📄 app.json"
echo "      ├── 📄 eas.json"
echo "      └── 📄 package.json"
echo ""

print_status "Next steps:"
echo "1. Take screenshots of the app and add them to screenshots/"
echo "2. Build the APK using: npx eas-cli build --platform android --profile production"
echo "3. Follow the submission guide in documentation/"
echo "4. Use demo credentials for app store review"

print_success "Deployment package ready at: $DEPLOY_DIR/"
