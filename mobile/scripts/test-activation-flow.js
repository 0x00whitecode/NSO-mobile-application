const axios = require('axios');
const crypto = require('crypto');

// Configuration
const API_BASE_URL = 'http://localhost:3000/api/v1';
const ADMIN_EMAIL = 'admin@nso.gov.ng';

// Test data
const testUser = {
  email: 'test.doctor@example.com',
  fullName: 'Dr. John Doe',
  role: 'doctor',
  facility: 'General Hospital Lagos',
  state: 'Lagos',
  contactInfo: '+2348012345678'
};

const testDevice = {
  deviceId: 'test-device-' + Date.now(),
  platform: 'android',
  model: 'Samsung Galaxy S21',
  osVersion: 'Android 12',
  appVersion: '1.0.0'
};

async function testActivationFlow() {
  console.log('🧪 Testing NSO Activation Flow\n');
  
  try {
    // Step 1: Admin creates activation key
    console.log('1️⃣ Creating activation key...');
    const createKeyResponse = await axios.post(`${API_BASE_URL}/admin/users`, {
      email: testUser.email,
      fullName: testUser.fullName,
      role: testUser.role,
      facility: testUser.facility,
      state: testUser.state,
      contactInfo: testUser.contactInfo,
      deviceId: testDevice.deviceId,
      validityMonths: 12,
      notes: 'Test activation key'
    }, {
      headers: {
        'x-admin-access': 'true',
        'x-admin-token': 'admin-access-token'
      }
    });

    if (!createKeyResponse.data.success) {
      throw new Error('Failed to create activation key: ' + createKeyResponse.data.error);
    }

    const activationKey = createKeyResponse.data.data.activationKey.activationKey;
    const shortCode = createKeyResponse.data.data.activationKey.shortCode;
    
    console.log('✅ Activation key created successfully');
    console.log(`   Key: ${activationKey}`);
    console.log(`   Short Code: ${shortCode}`);
    console.log(`   User ID: ${createKeyResponse.data.data.user.id}\n`);

    // Step 2: Mobile app activates device
    console.log('2️⃣ Activating device...');
    const activateResponse = await axios.post(`${API_BASE_URL}/auth/activate`, {
      activationKey: activationKey,
      userInfo: {
        fullName: testUser.fullName,
        role: testUser.role,
        facility: testUser.facility,
        state: testUser.state,
        contactInfo: testUser.contactInfo
      },
      deviceId: testDevice.deviceId,
      deviceInfo: {
        platform: testDevice.platform,
        model: testDevice.model,
        osVersion: testDevice.osVersion,
        appVersion: testDevice.appVersion
      },
      location: {
        latitude: 6.5244,
        longitude: 3.3792,
        address: 'Lagos, Nigeria'
      },
      sessionId: 'test-session-' + Date.now()
    });

    if (!activateResponse.data.success) {
      throw new Error('Failed to activate device: ' + activateResponse.data.error);
    }

    const userData = activateResponse.data.data.user;
    const token = activateResponse.data.data.token;
    
    console.log('✅ Device activated successfully');
    console.log(`   User: ${userData.firstName} ${userData.lastName}`);
    console.log(`   Role: ${userData.role}`);
    console.log(`   Facility: ${userData.facility}`);
    console.log(`   Token: ${token.substring(0, 20)}...`);
    console.log(`   Remaining Days: ${activateResponse.data.data.remainingDays}\n`);

    // Step 3: Verify user can login with activation key
    console.log('3️⃣ Testing login with activation key...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      activationKey: activationKey,
      deviceId: testDevice.deviceId,
      location: {
        latitude: 6.5244,
        longitude: 3.3792,
        address: 'Lagos, Nigeria'
      },
      sessionId: 'test-session-' + Date.now()
    });

    if (!loginResponse.data.success) {
      throw new Error('Failed to login: ' + loginResponse.data.error);
    }

    console.log('✅ Login successful');
    console.log(`   User: ${loginResponse.data.data.user.firstName} ${loginResponse.data.data.user.lastName}`);
    console.log(`   Token: ${loginResponse.data.data.token.substring(0, 20)}...\n`);

    // Step 4: Check activation key status in admin
    console.log('4️⃣ Checking activation key status in admin...');
    const keyStatusResponse = await axios.get(`${API_BASE_URL}/admin/activation-keys`, {
      headers: {
        'x-admin-access': 'true',
        'x-admin-token': 'admin-access-token'
      },
      params: {
        search: shortCode
      }
    });

    if (!keyStatusResponse.data.success) {
      throw new Error('Failed to get activation key status: ' + keyStatusResponse.data.error);
    }

    const keyData = keyStatusResponse.data.data.activationKeys[0];
    console.log('✅ Activation key status retrieved');
    console.log(`   Status: ${keyData.status}`);
    console.log(`   Usage Count: ${keyData.usageCount}`);
    console.log(`   Activated At: ${keyData.activatedAt}`);
    console.log(`   Device ID: ${keyData.deviceId}\n`);

    // Step 5: Check user status in admin
    console.log('5️⃣ Checking user status in admin...');
    const userStatusResponse = await axios.get(`${API_BASE_URL}/admin/users`, {
      headers: {
        'x-admin-access': 'true',
        'x-admin-token': 'admin-access-token'
      },
      params: {
        search: testUser.email
      }
    });

    if (!userStatusResponse.data.success) {
      throw new Error('Failed to get user status: ' + userStatusResponse.data.error);
    }

    const adminUserData = userStatusResponse.data.data.users[0];
    console.log('✅ User status retrieved');
    console.log(`   Status: ${adminUserData.status}`);
    console.log(`   Is Active: ${adminUserData.isActive}`);
    console.log(`   Is Verified: ${adminUserData.isVerified}`);
    console.log(`   Last Login: ${adminUserData.lastLogin}\n`);

    console.log('🎉 All activation flow tests passed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Admin can create activation keys');
    console.log('   ✅ Mobile app can activate devices');
    console.log('   ✅ Users can login with activation keys');
    console.log('   ✅ Admin can track activation status');
    console.log('   ✅ User data is properly synchronized');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testActivationFlow();
}

module.exports = { testActivationFlow };
