#!/bin/bash

# NSO Mobile APK Build Script
# This script builds the production APK for the NSO Mobile app

set -e  # Exit on any error

echo "🚀 NSO Mobile APK Build Script"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if we're in the mobile directory
if [ ! -f "app.json" ]; then
    print_error "app.json not found. Please run this script from the mobile directory."
    exit 1
fi

print_status "Checking prerequisites..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_success "Prerequisites check passed"

# Install dependencies
print_status "Installing dependencies..."
npm install

# Check if EAS CLI is available
print_status "Checking EAS CLI..."
if ! npx eas-cli --version &> /dev/null; then
    print_error "EAS CLI is not available. Installing..."
    npm install -g eas-cli
fi

print_success "EAS CLI is available"

# Clean previous builds
print_status "Cleaning previous builds..."
rm -rf dist/
rm -rf .expo/

# Build the APK
print_status "Building production APK..."
print_warning "This may take several minutes..."

# Build using EAS
npx eas-cli build --platform android --profile production --local

if [ $? -eq 0 ]; then
    print_success "APK build completed successfully!"
    
    # Find the generated APK
    APK_PATH=$(find . -name "*.apk" -type f -newer app.json 2>/dev/null | head -1)
    
    if [ -n "$APK_PATH" ]; then
        print_success "APK generated at: $APK_PATH"
        
        # Get APK info
        APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
        print_status "APK size: $APK_SIZE"
        
        # Create builds directory if it doesn't exist
        mkdir -p builds
        
        # Copy APK to builds directory with timestamp
        TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
        NEW_APK_NAME="nso-mobile-v1.0.1-$TIMESTAMP.apk"
        cp "$APK_PATH" "builds/$NEW_APK_NAME"
        
        print_success "APK copied to builds/$NEW_APK_NAME"
        
        echo ""
        echo "🎉 Build Summary:"
        echo "=================="
        echo "✅ APK built successfully"
        echo "📱 App: NSO Mobile v1.0.1"
        echo "📦 Package: com.nso.mobile.v11"
        echo "📄 File: builds/$NEW_APK_NAME"
        echo "💾 Size: $APK_SIZE"
        echo ""
        echo "📋 Next Steps:"
        echo "1. Test the APK on a physical device"
        echo "2. Upload to Google Play Console for distribution"
        echo "3. Submit for review"
        
    else
        print_warning "APK file not found in expected location"
        print_status "Please check the build output above for the APK location"
    fi
else
    print_error "APK build failed!"
    exit 1
fi
