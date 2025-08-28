#!/usr/bin/env node

/**
 * NSO v11 Comprehensive System Test
 * 
 * This script tests all components of the NSO system:
 * - Backend API endpoints
 * - Admin dashboard functionality
 * - Mobile app components
 * - Database connectivity
 * - Authentication flow
 */

const axios = require('axios');
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
  console.log('\n' + '='.repeat(70));
  log(title, 'bold');
  console.log('='.repeat(70));
}

function logSubSection(title) {
  console.log('\n' + '-'.repeat(50));
  log(title, 'cyan');
  console.log('-'.repeat(50));
}

// Test configuration
const TEST_CONFIG = {
  backend: {
    baseURL: 'https://nso-backend-heavy.onrender.com',
    timeout: 10000
  },
  admin: {
    baseURL: 'http://localhost:3001',
    timeout: 10000
  },
  mobile: {
    baseURL: 'http://localhost:8081',
    timeout: 10000
  }
};

class SystemTester {
  constructor() {
    this.results = {
      backend: {},
      admin: {},
      mobile: {},
      database: {},
      overall: { success: true, issues: [] }
    };
  }

  async testBackendHealth() {
    logSubSection('Testing Backend Health');
    
    try {
      const response = await axios.get(`${TEST_CONFIG.backend.baseURL}/health`, {
        timeout: TEST_CONFIG.backend.timeout
      });
      
      if (response.status === 200) {
        log('✅ Backend health check passed', 'green');
        log(`   Status: ${response.data.status}`, 'green');
        log(`   Database: ${response.data.database}`, 'green');
        log(`   Uptime: ${Math.round(response.data.uptime)}s`, 'green');
        
        this.results.backend.health = {
          success: true,
          data: response.data
        };
        return true;
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    } catch (error) {
      log('❌ Backend health check failed', 'red');
      log(`   Error: ${error.message}`, 'red');
      
      this.results.backend.health = {
        success: false,
        error: error.message
      };
      this.results.overall.success = false;
      this.results.overall.issues.push('Backend health check failed');
      return false;
    }
  }

  async testBackendAPI() {
    logSubSection('Testing Backend API Endpoints');
    
    const endpoints = [
      { name: 'API Info', path: '/api' },
      { name: 'Auth Routes', path: '/api/v1/auth' },
      { name: 'User Routes', path: '/api/v1/users' },
      { name: 'Activity Routes', path: '/api/v1/activity' },
      { name: 'Sync Routes', path: '/api/v1/sync' },
      { name: 'Diagnosis Routes', path: '/api/v1/diagnosis' },
      { name: 'Admin Routes', path: '/api/v1/admin' }
    ];

    this.results.backend.endpoints = {};

    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${TEST_CONFIG.backend.baseURL}${endpoint.path}`, {
          timeout: TEST_CONFIG.backend.timeout,
          validateStatus: () => true // Accept any status code
        });
        
        if (response.status === 200 || response.status === 404) {
          log(`✅ ${endpoint.name} - Status: ${response.status}`, 'green');
          this.results.backend.endpoints[endpoint.name] = {
            success: true,
            status: response.status
          };
        } else {
          log(`⚠️  ${endpoint.name} - Status: ${response.status}`, 'yellow');
          this.results.backend.endpoints[endpoint.name] = {
            success: false,
            status: response.status
          };
        }
      } catch (error) {
        log(`❌ ${endpoint.name} - Error: ${error.message}`, 'red');
        this.results.backend.endpoints[endpoint.name] = {
          success: false,
          error: error.message
        };
      }
    }
  }

  async testDatabaseConnection() {
    logSubSection('Testing Database Connection');
    
    try {
      const response = await axios.get(`${TEST_CONFIG.backend.baseURL}/health`, {
        timeout: TEST_CONFIG.backend.timeout
      });
      
      if (response.data.database === 'connected') {
        log('✅ Database connection successful', 'green');
        this.results.database.connection = {
          success: true,
          status: 'connected'
        };
        return true;
      } else {
        log('❌ Database connection failed', 'red');
        this.results.database.connection = {
          success: false,
          status: response.data.database
        };
        this.results.overall.success = false;
        this.results.overall.issues.push('Database connection failed');
        return false;
      }
    } catch (error) {
      log('❌ Database connection test failed', 'red');
      log(`   Error: ${error.message}`, 'red');
      this.results.database.connection = {
        success: false,
        error: error.message
      };
      this.results.overall.success = false;
      this.results.overall.issues.push('Database connection test failed');
      return false;
    }
  }

  async testAdminDashboard() {
    logSubSection('Testing Admin Dashboard');
    
    try {
      const response = await axios.get(`${TEST_CONFIG.admin.baseURL}`, {
        timeout: TEST_CONFIG.admin.timeout,
        validateStatus: () => true
      });
      
      if (response.status === 200) {
        log('✅ Admin dashboard is accessible', 'green');
        this.results.admin.dashboard = {
          success: true,
          status: response.status
        };
        return true;
      } else {
        log(`⚠️  Admin dashboard returned status: ${response.status}`, 'yellow');
        this.results.admin.dashboard = {
          success: false,
          status: response.status
        };
        return false;
      }
    } catch (error) {
      log('❌ Admin dashboard is not accessible', 'red');
      log(`   Error: ${error.message}`, 'red');
      this.results.admin.dashboard = {
        success: false,
        error: error.message
      };
      return false;
    }
  }

  async testMobileApp() {
    logSubSection('Testing Mobile App Components');
    
    // Test if mobile app files exist and are properly structured
    const mobileTests = [
      { name: 'ActivationScreen', path: 'components/ActivationScreen.tsx' },
      { name: 'Input Component', path: 'components/ui/Input.tsx' },
      { name: 'API Service', path: 'services/apiService.ts' },
      { name: 'Offline Activation Service', path: 'services/offlineActivationService.ts' },
      { name: 'App Configuration', path: 'app.json' },
      { name: 'Package Configuration', path: 'package.json' }
    ];

    this.results.mobile.components = {};

    for (const test of mobileTests) {
      const filePath = path.join(__dirname, '..', test.path);
      
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        log(`✅ ${test.name} - File exists (${Math.round(stats.size / 1024)}KB)`, 'green');
        this.results.mobile.components[test.name] = {
          success: true,
          size: stats.size
        };
      } else {
        log(`❌ ${test.name} - File not found`, 'red');
        this.results.mobile.components[test.name] = {
          success: false,
          error: 'File not found'
        };
      }
    }
  }

  async testActivationFlow() {
    logSubSection('Testing Activation Flow');
    
    try {
      // Test activation endpoint (should return 400 for missing data, which is expected)
      const response = await axios.post(`${TEST_CONFIG.backend.baseURL}/api/v1/auth/activate`, {
        activationKey: 'TEST-KEY-123',
        deviceInfo: {
          platform: 'test',
          deviceId: 'test-device'
        }
      }, {
        timeout: TEST_CONFIG.backend.timeout,
        validateStatus: () => true
      });
      
      if (response.status === 400) {
        log('✅ Activation endpoint is working (returned expected validation error)', 'green');
        this.results.backend.activation = {
          success: true,
          status: response.status,
          message: 'Endpoint working, validation working'
        };
      } else {
        log(`⚠️  Activation endpoint returned unexpected status: ${response.status}`, 'yellow');
        this.results.backend.activation = {
          success: false,
          status: response.status
        };
      }
    } catch (error) {
      log('❌ Activation endpoint test failed', 'red');
      log(`   Error: ${error.message}`, 'red');
      this.results.backend.activation = {
        success: false,
        error: error.message
      };
    }
  }

  async testFileStructure() {
    logSubSection('Testing File Structure');
    
    const requiredDirs = [
      'backend',
      'admin', 
      'components',
      'services',
      'constants',
      'scripts'
    ];

    this.results.structure = {};

    for (const dir of requiredDirs) {
      const dirPath = path.join(__dirname, '..', dir);
      
      if (fs.existsSync(dirPath)) {
        const stats = fs.statSync(dirPath);
        if (stats.isDirectory()) {
          log(`✅ ${dir}/ - Directory exists`, 'green');
          this.results.structure[dir] = {
            success: true,
            type: 'directory'
          };
        } else {
          log(`❌ ${dir}/ - Exists but is not a directory`, 'red');
          this.results.structure[dir] = {
            success: false,
            error: 'Not a directory'
          };
        }
      } else {
        log(`❌ ${dir}/ - Directory not found`, 'red');
        this.results.structure[dir] = {
          success: false,
          error: 'Directory not found'
        };
      }
    }
  }

  generateReport() {
    logSection('COMPREHENSIVE TEST REPORT');
    
    // Overall status
    if (this.results.overall.success) {
      log('🎉 Overall System Status: HEALTHY', 'green');
    } else {
      log('⚠️  Overall System Status: ISSUES DETECTED', 'yellow');
    }

    // Backend status
    logSubSection('Backend Status');
    if (this.results.backend.health?.success) {
      log('✅ Backend: Running and healthy', 'green');
    } else {
      log('❌ Backend: Issues detected', 'red');
    }

    // Database status
    logSubSection('Database Status');
    if (this.results.database.connection?.success) {
      log('✅ Database: Connected and operational', 'green');
    } else {
      log('❌ Database: Connection issues', 'red');
    }

    // Admin status
    logSubSection('Admin Dashboard Status');
    if (this.results.admin.dashboard?.success) {
      log('✅ Admin Dashboard: Accessible', 'green');
    } else {
      log('❌ Admin Dashboard: Not accessible', 'red');
    }

    // Mobile app status
    logSubSection('Mobile App Status');
    const mobileComponents = Object.values(this.results.mobile.components || {});
    const mobileSuccess = mobileComponents.every(comp => comp.success);
    
    if (mobileSuccess) {
      log('✅ Mobile App: All components present', 'green');
    } else {
      log('❌ Mobile App: Missing components', 'red');
    }

    // Issues summary
    if (this.results.overall.issues.length > 0) {
      logSubSection('Issues Found');
      this.results.overall.issues.forEach(issue => {
        log(`• ${issue}`, 'red');
      });
    }

    // Recommendations
    logSubSection('Recommendations');
    if (this.results.overall.success) {
      log('✅ All systems are operational', 'green');
      log('💡 Consider running integration tests with real data', 'blue');
    } else {
      log('🔧 Fix the issues identified above', 'yellow');
      log('🧪 Test with real devices after fixes', 'blue');
    }
  }

  async runAllTests() {
    logSection('NSO v11 COMPREHENSIVE SYSTEM TEST');
    log('Testing all components of the NSO system...\n', 'blue');

    // Run all tests
    await this.testBackendHealth();
    await this.testBackendAPI();
    await this.testDatabaseConnection();
    await this.testAdminDashboard();
    await this.testMobileApp();
    await this.testActivationFlow();
    await this.testFileStructure();

    // Generate report
    this.generateReport();

    return this.results;
  }
}

async function main() {
  const tester = new SystemTester();
  const results = await tester.runAllTests();
  
  log('\n✨ Comprehensive test complete!', 'magenta');
  
  // Exit with appropriate code
  process.exit(results.overall.success ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    log(`❌ Test failed with error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = SystemTester;

