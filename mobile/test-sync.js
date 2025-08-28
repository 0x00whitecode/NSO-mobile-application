#!/usr/bin/env node

/**
 * Test script to verify mobile app backend integration and sync functionality
 */

const axios = require('axios');

const API_BASE_URL = 'https://nso-backend-heavy.onrender.com/api/v1';

// Test configuration
const TEST_CONFIG = {
  activationKey: 'TEST-KEY-123',
  deviceId: 'test-device-001',
  userInfo: {
    fullName: 'Test User',
    role: 'Healthcare Worker',
    facility: 'Test Hospital',
    state: 'Test State',
    contactInfo: 'test@example.com'
  }
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testHealthCheck() {
  log('\n🏥 Testing Backend Health Check...', 'blue');
  try {
    const response = await axios.get(`${API_BASE_URL.replace('/api/v1', '')}/health`);
    log(`✅ Health Check: ${response.data.status}`, 'green');
    log(`   Database: ${response.data.database}`, 'green');
    log(`   Environment: ${response.data.environment}`, 'green');
    return true;
  } catch (error) {
    log(`❌ Health Check Failed: ${error.message}`, 'red');
    return false;
  }
}

async function testAPIInfo() {
  log('\n📋 Testing API Info...', 'blue');
  try {
    const response = await axios.get(`${API_BASE_URL.replace('/api/v1', '')}/api`);
    log(`✅ API Info: ${response.data.name} v${response.data.version}`, 'green');
    log(`   Available endpoints:`, 'green');
    Object.entries(response.data.endpoints).forEach(([key, value]) => {
      log(`   - ${key}: ${value}`, 'green');
    });
    return true;
  } catch (error) {
    log(`❌ API Info Failed: ${error.message}`, 'red');
    return false;
  }
}

async function testDeviceActivation() {
  log('\n🔐 Testing Device Activation...', 'blue');
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/activate`, {
      activationKey: TEST_CONFIG.activationKey,
      deviceId: TEST_CONFIG.deviceId,
      userInfo: TEST_CONFIG.userInfo
    });

    if (response.data.success) {
      log(`✅ Device Activation: Success`, 'green');
      log(`   User ID: ${response.data.data.user.id}`, 'green');
      log(`   Token: ${response.data.data.token ? 'Generated' : 'Missing'}`, 'green');
      return { success: true, token: response.data.data.token, user: response.data.data.user };
    } else {
      log(`❌ Device Activation Failed: ${response.data.error}`, 'red');
      return { success: false };
    }
  } catch (error) {
    log(`❌ Device Activation Error: ${error.response?.data?.error || error.message}`, 'red');
    return { success: false };
  }
}

async function testLogin() {
  log('\n🔑 Testing Login...', 'blue');
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      deviceId: TEST_CONFIG.deviceId,
      activationKey: TEST_CONFIG.activationKey
    });

    if (response.data.success) {
      log(`✅ Login: Success`, 'green');
      log(`   User: ${response.data.data.user.fullName}`, 'green');
      log(`   Token: ${response.data.data.token ? 'Valid' : 'Missing'}`, 'green');
      return { success: true, token: response.data.data.token, user: response.data.data.user };
    } else {
      log(`❌ Login Failed: ${response.data.error}`, 'red');
      return { success: false };
    }
  } catch (error) {
    log(`❌ Login Error: ${error.response?.data?.error || error.message}`, 'red');
    return { success: false };
  }
}

async function testTokenVerification(token) {
  log('\n🔍 Testing Token Verification...', 'blue');
  try {
    const response = await axios.get(`${API_BASE_URL}/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-device-id': TEST_CONFIG.deviceId
      }
    });

    if (response.data.success && response.data.data.valid) {
      log(`✅ Token Verification: Valid`, 'green');
      log(`   User: ${response.data.data.user?.fullName || 'Unknown'}`, 'green');
      return true;
    } else {
      log(`❌ Token Verification: Invalid`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Token Verification Error: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

async function testSyncUpload(token) {
  log('\n⬆️ Testing Sync Upload...', 'blue');
  try {
    const testData = {
      syncType: 'manual',
      operation: 'upload',
      dataTypes: ['activity', 'diagnosis'],
      sessionId: 'test-session-001',
      data: {
        activity: [
          {
            id: 'activity-001',
            type: 'screen_view',
            screenName: 'dashboard',
            timestamp: new Date().toISOString(),
            metadata: { test: true }
          }
        ],
        diagnosis: [
          {
            id: 'diagnosis-001',
            patientId: 'patient-001',
            complaint: 'Test complaint',
            diagnosis: 'Test diagnosis',
            timestamp: new Date().toISOString(),
            metadata: { test: true }
          }
        ]
      },
      deviceInfo: {
        platform: 'test',
        version: '1.0.0'
      },
      networkInfo: {
        type: 'wifi',
        isConnected: true
      }
    };

    const response = await axios.post(`${API_BASE_URL}/sync/upload`, testData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-device-id': TEST_CONFIG.deviceId,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      log(`✅ Sync Upload: Success`, 'green');
      log(`   Synced: ${response.data.data.results.successful.length} items`, 'green');
      log(`   Failed: ${response.data.data.results.failed.length} items`, 'green');
      return true;
    } else {
      log(`❌ Sync Upload Failed: ${response.data.error}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Sync Upload Error: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

async function testSyncDownload(token) {
  log('\n⬇️ Testing Sync Download...', 'blue');
  try {
    const testData = {
      syncType: 'manual',
      operation: 'download',
      dataTypes: ['activity', 'diagnosis'],
      lastSyncTimestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago
      sessionId: 'test-session-001',
      deviceInfo: {
        platform: 'test',
        version: '1.0.0'
      },
      networkInfo: {
        type: 'wifi',
        isConnected: true
      }
    };

    const response = await axios.post(`${API_BASE_URL}/sync/download`, testData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-device-id': TEST_CONFIG.deviceId,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      log(`✅ Sync Download: Success`, 'green');
      const data = response.data.data.data;
      log(`   Activities: ${data.activity?.length || 0} items`, 'green');
      log(`   Diagnoses: ${data.diagnosis?.length || 0} items`, 'green');
      return true;
    } else {
      log(`❌ Sync Download Failed: ${response.data.error}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Sync Download Error: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

async function runTests() {
  log('🧪 NSO Mobile App Backend Integration Test', 'blue');
  log('=' * 50, 'blue');

  const results = {
    healthCheck: false,
    apiInfo: false,
    activation: false,
    login: false,
    tokenVerification: false,
    syncUpload: false,
    syncDownload: false
  };

  // Test 1: Health Check
  results.healthCheck = await testHealthCheck();
  if (!results.healthCheck) {
    log('\n❌ Backend is not running or not accessible. Please start the backend server.', 'red');
    return;
  }

  // Test 2: API Info
  results.apiInfo = await testAPIInfo();

  // Test 3: Device Activation
  const activationResult = await testDeviceActivation();
  results.activation = activationResult.success;

  // Test 4: Login
  const loginResult = await testLogin();
  results.login = loginResult.success;

  let token = null;
  if (loginResult.success) {
    token = loginResult.token;
  } else if (activationResult.success) {
    token = activationResult.token;
  }

  if (token) {
    // Test 5: Token Verification
    results.tokenVerification = await testTokenVerification(token);

    // Test 6: Sync Upload
    results.syncUpload = await testSyncUpload(token);

    // Test 7: Sync Download
    results.syncDownload = await testSyncDownload(token);
  } else {
    log('\n⚠️ No valid token available. Skipping authenticated tests.', 'yellow');
  }

  // Summary
  log('\n📊 Test Results Summary:', 'blue');
  log('=' * 30, 'blue');
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const color = passed ? 'green' : 'red';
    log(`${status} ${test}`, color);
  });

  log(`\n🎯 Overall: ${passed}/${total} tests passed`, passed === total ? 'green' : 'yellow');

  if (passed === total) {
    log('\n🎉 All tests passed! Mobile app backend integration is working properly.', 'green');
  } else {
    log('\n⚠️ Some tests failed. Please check the backend configuration and try again.', 'yellow');
  }
}

// Run the tests
runTests().catch(error => {
  log(`\n💥 Test runner error: ${error.message}`, 'red');
  process.exit(1);
});
