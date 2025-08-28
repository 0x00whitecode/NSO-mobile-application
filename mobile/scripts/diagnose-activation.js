#!/usr/bin/env node

/**
 * NSO v11 Activation Diagnostic Script
 * 
 * This script helps diagnose activation input issues on mobile devices
 * and provides solutions for common problems.
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bold');
  console.log('='.repeat(60));
}

function logSubSection(title) {
  console.log('\n' + '-'.repeat(40));
  log(title, 'cyan');
  console.log('-'.repeat(40));
}

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function readFileContent(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

function checkActivationKeyFormat(key) {
  const format = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return format.test(key);
}

function analyzeActivationScreen() {
  logSubSection('Analyzing ActivationScreen.tsx');
  
  const filePath = path.join(__dirname, '..', 'components', 'ActivationScreen.tsx');
  
  if (!checkFileExists(filePath)) {
    log('❌ ActivationScreen.tsx not found', 'red');
    return false;
  }
  
  const content = readFileContent(filePath);
  if (!content) {
    log('❌ Could not read ActivationScreen.tsx', 'red');
    return false;
  }
  
  const issues = [];
  const improvements = [];
  
  // Check for proper imports
  if (!content.includes('import { apiService }')) {
    issues.push('Missing apiService import for online activation');
  }
  
  if (!content.includes('import { offlineActivationService }')) {
    issues.push('Missing offlineActivationService import');
  }
  
  // Check for network connectivity check
  if (!content.includes('checkNetworkConnectivity')) {
    issues.push('No network connectivity check implemented');
  }
  
  // Check for proper error handling
  if (!content.includes('setInputError')) {
    issues.push('No inline error display for user feedback');
  }
  
  // Check for keyboard handling
  if (!content.includes('KeyboardAvoidingView')) {
    issues.push('No keyboard avoiding view for mobile input');
  }
  
  // Check for input validation
  if (!content.includes('keyFormat.test')) {
    issues.push('No activation key format validation');
  }
  
  // Check for proper input formatting
  if (!content.includes('formatActivationKey')) {
    issues.push('No activation key formatting function');
  }
  
  // Check for loading states
  if (!content.includes('isLoading')) {
    issues.push('No loading state management');
  }
  
  if (issues.length === 0) {
    log('✅ ActivationScreen.tsx looks good', 'green');
  } else {
    log('⚠️  Issues found in ActivationScreen.tsx:', 'yellow');
    issues.forEach(issue => log(`   • ${issue}`, 'yellow'));
  }
  
  return issues.length === 0;
}

function analyzeInputComponent() {
  logSubSection('Analyzing Input.tsx Component');
  
  const filePath = path.join(__dirname, '..', 'components', 'ui', 'Input.tsx');
  
  if (!checkFileExists(filePath)) {
    log('❌ Input.tsx not found', 'red');
    return false;
  }
  
  const content = readFileContent(filePath);
  if (!content) {
    log('❌ Could not read Input.tsx', 'red');
    return false;
  }
  
  const issues = [];
  
  // Check for proper mobile handling
  if (!content.includes('Platform.OS')) {
    issues.push('No platform-specific handling for mobile');
  }
  
  // Check for proper touch targets
  if (!content.includes('minHeight: 56')) {
    issues.push('Touch target may be too small for mobile');
  }
  
  // Check for proper error display
  if (!content.includes('errorText')) {
    issues.push('No error text styling');
  }
  
  // Check for proper focus handling
  if (!content.includes('onFocus')) {
    issues.push('No focus event handling');
  }
  
  if (issues.length === 0) {
    log('✅ Input.tsx component looks good', 'green');
  } else {
    log('⚠️  Issues found in Input.tsx:', 'yellow');
    issues.forEach(issue => log(`   • ${issue}`, 'yellow'));
  }
  
  return issues.length === 0;
}

function analyzeApiService() {
  logSubSection('Analyzing API Service');
  
  const filePath = path.join(__dirname, '..', 'services', 'apiService.ts');
  
  if (!checkFileExists(filePath)) {
    log('❌ apiService.ts not found', 'red');
    return false;
  }
  
  const content = readFileContent(filePath);
  if (!content) {
    log('❌ Could not read apiService.ts', 'red');
    return false;
  }
  
  const issues = [];
  
  // Check for proper error handling
  if (!content.includes('catch (error)')) {
    issues.push('No error handling in API calls');
  }
  
  // Check for retry logic
  if (!content.includes('retryCount')) {
    issues.push('No retry logic for failed requests');
  }
  
  // Check for network connectivity check
  if (!content.includes('NetInfo.fetch')) {
    issues.push('No network connectivity check');
  }
  
  // Check for proper timeout handling
  if (!content.includes('AbortController')) {
    issues.push('No request timeout handling');
  }
  
  if (issues.length === 0) {
    log('✅ API Service looks good', 'green');
  } else {
    log('⚠️  Issues found in API Service:', 'yellow');
    issues.forEach(issue => log(`   • ${issue}`, 'yellow'));
  }
  
  return issues.length === 0;
}

function analyzeOfflineActivationService() {
  logSubSection('Analyzing Offline Activation Service');
  
  const filePath = path.join(__dirname, '..', 'services', 'offlineActivationService.ts');
  
  if (!checkFileExists(filePath)) {
    log('❌ offlineActivationService.ts not found', 'red');
    return false;
  }
  
  const content = readFileContent(filePath);
  if (!content) {
    log('❌ Could not read offlineActivationService.ts', 'red');
    return false;
  }
  
  const issues = [];
  
  // Check for proper decryption
  if (!content.includes('decryptData')) {
    issues.push('No data decryption function');
  }
  
  // Check for validation
  if (!content.includes('validateActivationData')) {
    issues.push('No activation data validation');
  }
  
  // Check for device info
  if (!content.includes('getDeviceInfo')) {
    issues.push('No device information collection');
  }
  
  if (issues.length === 0) {
    log('✅ Offline Activation Service looks good', 'green');
  } else {
    log('⚠️  Issues found in Offline Activation Service:', 'yellow');
    issues.forEach(issue => log(`   • ${issue}`, 'yellow'));
  }
  
  return issues.length === 0;
}

function checkBackendConfiguration() {
  logSubSection('Checking Backend Configuration');
  
  const configPath = path.join(__dirname, '..', 'backend', 'config.js');
  
  if (!checkFileExists(configPath)) {
    log('❌ Backend config.js not found', 'red');
    return false;
  }
  
  const content = readFileContent(configPath);
  if (!content) {
    log('❌ Could not read backend config', 'red');
    return false;
  }
  
  const issues = [];
  
  // Check for proper API configuration
  if (!content.includes('API_VERSION')) {
    issues.push('No API version configuration');
  }
  
  // Check for proper timeout settings
  if (!content.includes('TIMEOUT')) {
    issues.push('No timeout configuration');
  }
  
  if (issues.length === 0) {
    log('✅ Backend configuration looks good', 'green');
  } else {
    log('⚠️  Issues found in backend configuration:', 'yellow');
    issues.forEach(issue => log(`   • ${issue}`, 'yellow'));
  }
  
  return issues.length === 0;
}

function provideSolutions() {
  logSection('SOLUTIONS FOR COMMON ACTIVATION ISSUES');
  
  logSubSection('1. Mobile Input Issues');
  log('• Ensure KeyboardAvoidingView is properly configured', 'green');
  log('• Add proper touch targets (minimum 44px height)', 'green');
  log('• Implement proper input formatting and validation', 'green');
  log('• Add visual feedback for errors and loading states', 'green');
  
  logSubSection('2. Network Communication Issues');
  log('• Implement network connectivity checks', 'green');
  log('• Add retry logic for failed requests', 'green');
  log('• Provide offline fallback activation', 'green');
  log('• Add proper error handling and user feedback', 'green');
  
  logSubSection('3. Backend Communication Issues');
  log('• Verify API endpoints are accessible', 'green');
  log('• Check CORS configuration for mobile apps', 'green');
  log('• Ensure proper authentication headers', 'green');
  log('• Add request timeout handling', 'green');
  
  logSubSection('4. Activation Key Validation');
  log('• Implement proper key format validation', 'green');
  log('• Add real-time input formatting', 'green');
  log('• Provide clear error messages', 'green');
  log('• Handle expired and revoked keys', 'green');
}

function runTests() {
  logSection('RUNNING ACTIVATION DIAGNOSTICS');
  
  const results = {
    activationScreen: analyzeActivationScreen(),
    inputComponent: analyzeInputComponent(),
    apiService: analyzeApiService(),
    offlineService: analyzeOfflineActivationService(),
    backendConfig: checkBackendConfiguration()
  };
  
  const allPassed = Object.values(results).every(result => result);
  
  logSection('DIAGNOSTIC RESULTS');
  
  if (allPassed) {
    log('🎉 All checks passed! Your activation system looks good.', 'green');
  } else {
    log('⚠️  Some issues were found. Please review the recommendations above.', 'yellow');
  }
  
  return allPassed;
}

function main() {
  log('🔍 NSO v11 Activation Diagnostic Tool', 'bold');
  log('This tool helps identify and fix activation input issues on mobile devices.\n', 'blue');
  
  const success = runTests();
  
  if (!success) {
    provideSolutions();
  }
  
  logSection('NEXT STEPS');
  if (success) {
    log('✅ Your activation system is properly configured.', 'green');
    log('💡 Consider testing with real devices to ensure everything works as expected.', 'blue');
  } else {
    log('🔧 Fix the issues identified above.', 'yellow');
    log('🧪 Test the activation flow on actual mobile devices.', 'blue');
    log('📱 Pay special attention to keyboard behavior and network connectivity.', 'blue');
  }
  
  log('\n✨ Diagnostic complete!', 'magenta');
}

if (require.main === module) {
  main();
}

module.exports = {
  runTests,
  analyzeActivationScreen,
  analyzeInputComponent,
  analyzeApiService,
  analyzeOfflineActivationService,
  checkBackendConfiguration
};
