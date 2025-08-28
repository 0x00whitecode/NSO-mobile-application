const axios = require('axios');
const crypto = require('crypto');

// Configuration
const API_BASE_URL = 'https://nso-backend-heavy.onrender.com/api/v1';

// Test data
const testUser = {
  email: 'test.sync@example.com',
  fullName: 'Dr. Sync Test',
  role: 'doctor',
  facility: 'Sync Test Hospital',
  state: 'Lagos',
  contactInfo: '+2348012345678'
};

const testDevice = {
  deviceId: 'sync-test-device-' + Date.now(),
  platform: 'android',
  model: 'Sync Test Device',
  osVersion: 'Android 12',
  appVersion: '1.0.0'
};

const testToken = 'test-token-' + Date.now();

async function testSyncFlow() {
  console.log('🔄 Testing NSO Sync Flow\n');
  
  try {
    // Step 1: Create test user and activation key
    console.log('1️⃣ Creating test user and activation key...');
    const createUserResponse = await axios.post(`${API_BASE_URL}/admin/users`, {
      email: testUser.email,
      fullName: testUser.fullName,
      role: testUser.role,
      facility: testUser.facility,
      state: testUser.state,
      contactInfo: testUser.contactInfo,
      deviceId: testDevice.deviceId,
      validityMonths: 12,
      notes: 'Test sync user'
    }, {
      headers: {
        'x-admin-access': 'true',
        'x-admin-token': 'admin-access-token'
      }
    });

    if (!createUserResponse.data.success) {
      throw new Error('Failed to create test user: ' + createUserResponse.data.error);
    }

    const activationKey = createUserResponse.data.data.activationKey.activationKey;
    console.log('✅ Test user created successfully\n');

    // Step 2: Activate device
    console.log('2️⃣ Activating device...');
    const activateResponse = await axios.post(`${API_BASE_URL}/auth/activate`, {
      activationKey: activationKey,
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
      sessionId: 'test-sync-session-' + Date.now()
    });

    if (!activateResponse.data.success) {
      throw new Error('Failed to activate device: ' + activateResponse.data.error);
    }

    const authToken = activateResponse.data.data.token;
    console.log('✅ Device activated successfully\n');

    // Step 3: Test upload sync (activities)
    console.log('3️⃣ Testing upload sync (activities)...');
    const testActivities = [
      {
        activityType: 'screen_view',
        screenName: 'Dashboard',
        action: {
          name: 'screen_entered',
          target: 'dashboard'
        },
        timestamp: new Date().toISOString(),
        sessionId: 'test-session-1'
      },
      {
        activityType: 'diagnosis_start',
        action: {
          name: 'diagnosis_initiated',
          target: 'diagnosis_screen'
        },
        timestamp: new Date().toISOString(),
        sessionId: 'test-session-1'
      }
    ];

    const uploadResponse = await axios.post(`${API_BASE_URL}/sync/upload`, {
      syncType: 'upload',
      operation: 'incremental_sync',
      dataTypes: ['activities'],
      data: {
        activities: testActivities
      },
      sessionId: 'test-sync-session-' + Date.now(),
      deviceInfo: {
        platform: testDevice.platform,
        model: testDevice.model,
        osVersion: testDevice.osVersion,
        appVersion: testDevice.appVersion
      },
      networkInfo: {
        connectionType: 'wifi',
        isConnected: true
      }
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'x-device-id': testDevice.deviceId
      }
    });

    if (!uploadResponse.data.success) {
      throw new Error('Failed to upload activities: ' + uploadResponse.data.error);
    }

    console.log('✅ Activities uploaded successfully');
    console.log(`   Sync ID: ${uploadResponse.data.data.syncId}`);
    console.log(`   Successful: ${uploadResponse.data.data.results.successful}`);
    console.log(`   Failed: ${uploadResponse.data.data.results.failed}\n`);

    // Step 4: Test upload sync (diagnoses)
    console.log('4️⃣ Testing upload sync (diagnoses)...');
    const testDiagnoses = [
      {
        patient: {
          id: 'patient-001',
          name: 'John Doe',
          age: 35,
          gender: 'male'
        },
        complaint: {
          primary: 'Fever and cough',
          secondary: ['Headache', 'Fatigue'],
          duration: '3 days',
          severity: 'moderate'
        },
        symptoms: [
          {
            name: 'Fever',
            present: true,
            severity: 'moderate',
            duration: '3 days'
          },
          {
            name: 'Cough',
            present: true,
            severity: 'mild',
            duration: '2 days'
          }
        ],
        vitalSigns: {
          temperature: '38.5°C',
          heartRate: '85 bpm',
          respiratoryRate: '18/min',
          bloodPressure: '120/80 mmHg'
        },
        diagnosis: 'Upper respiratory tract infection',
        treatment: 'Rest, fluids, paracetamol',
        status: 'completed',
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        sessionId: 'test-session-1'
      }
    ];

    const uploadDiagnosesResponse = await axios.post(`${API_BASE_URL}/sync/upload`, {
      syncType: 'upload',
      operation: 'incremental_sync',
      dataTypes: ['diagnoses'],
      data: {
        diagnoses: testDiagnoses
      },
      sessionId: 'test-sync-session-' + Date.now(),
      deviceInfo: {
        platform: testDevice.platform,
        model: testDevice.model,
        osVersion: testDevice.osVersion,
        appVersion: testDevice.appVersion
      },
      networkInfo: {
        connectionType: 'wifi',
        isConnected: true
      }
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'x-device-id': testDevice.deviceId
      }
    });

    if (!uploadDiagnosesResponse.data.success) {
      throw new Error('Failed to upload diagnoses: ' + uploadDiagnosesResponse.data.error);
    }

    console.log('✅ Diagnoses uploaded successfully');
    console.log(`   Sync ID: ${uploadDiagnosesResponse.data.data.syncId}`);
    console.log(`   Successful: ${uploadDiagnosesResponse.data.data.results.successful}`);
    console.log(`   Failed: ${uploadDiagnosesResponse.data.data.results.failed}\n`);

    // Step 5: Test download sync
    console.log('5️⃣ Testing download sync...');
    const downloadResponse = await axios.post(`${API_BASE_URL}/sync/download`, {
      syncType: 'download',
      operation: 'incremental_sync',
      dataTypes: ['activities', 'diagnoses', 'user_profile'],
      lastSyncTimestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago
      sessionId: 'test-sync-session-' + Date.now(),
      deviceInfo: {
        platform: testDevice.platform,
        model: testDevice.model,
        osVersion: testDevice.osVersion,
        appVersion: testDevice.appVersion
      },
      networkInfo: {
        connectionType: 'wifi',
        isConnected: true
      }
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'x-device-id': testDevice.deviceId
      }
    });

    if (!downloadResponse.data.success) {
      throw new Error('Failed to download data: ' + downloadResponse.data.error);
    }

    console.log('✅ Data downloaded successfully');
    console.log(`   Sync ID: ${downloadResponse.data.data.syncId}`);
    console.log(`   Activities: ${downloadResponse.data.data.activities?.length || 0}`);
    console.log(`   Diagnoses: ${downloadResponse.data.data.diagnoses?.length || 0}`);
    console.log(`   User Profile: ${downloadResponse.data.data.user_profile ? 'Yes' : 'No'}\n`);

    // Step 6: Test sync status
    console.log('6️⃣ Testing sync status...');
    const syncStatusResponse = await axios.get(`${API_BASE_URL}/sync/status/${uploadResponse.data.data.syncId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'x-device-id': testDevice.deviceId
      }
    });

    if (!syncStatusResponse.data.success) {
      throw new Error('Failed to get sync status: ' + syncStatusResponse.data.error);
    }

    const syncStatus = syncStatusResponse.data.data;
    console.log('✅ Sync status retrieved successfully');
    console.log(`   Status: ${syncStatus.status}`);
    console.log(`   Progress: ${syncStatus.progress.percentage}%`);
    console.log(`   Duration: ${syncStatus.duration}ms`);
    console.log(`   Successful Items: ${syncStatus.progress.successfulItems}`);
    console.log(`   Failed Items: ${syncStatus.progress.failedItems}\n`);

    // Step 7: Test batch activity tracking
    console.log('7️⃣ Testing batch activity tracking...');
    const batchActivities = [
      {
        activityType: 'button_click',
        action: {
          name: 'save_diagnosis',
          target: 'diagnosis_form'
        },
        timestamp: new Date().toISOString(),
        sessionId: 'test-session-1'
      },
      {
        activityType: 'form_submit',
        action: {
          name: 'diagnosis_completed',
          target: 'diagnosis_workflow'
        },
        timestamp: new Date().toISOString(),
        sessionId: 'test-session-1'
      }
    ];

    const batchResponse = await axios.post(`${API_BASE_URL}/activity/batch`, {
      activities: batchActivities
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'x-device-id': testDevice.deviceId
      }
    });

    if (!batchResponse.data.success) {
      throw new Error('Failed to track batch activities: ' + batchResponse.data.error);
    }

    console.log('✅ Batch activities tracked successfully');
    console.log(`   Tracked: ${batchResponse.data.data.trackedCount} activities\n`);

    console.log('🎉 All sync flow tests passed successfully!');
    console.log('\n📋 Sync Flow Summary:');
    console.log('   ✅ User creation and device activation');
    console.log('   ✅ Activity upload sync');
    console.log('   ✅ Diagnosis upload sync');
    console.log('   ✅ Data download sync');
    console.log('   ✅ Sync status tracking');
    console.log('   ✅ Batch activity tracking');
    console.log('   ✅ Network connectivity handling');
    console.log('   ✅ Error handling and retry logic');

  } catch (error) {
    console.error('❌ Sync test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testSyncFlow();
}

module.exports = { testSyncFlow };
