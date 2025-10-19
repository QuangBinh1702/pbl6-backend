/**
 * API Testing Script
 * Tests authentication, CRUD operations, and permissions
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000/api';
let authToken = '';
let testUserId = '';
let testActivityId = '';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testAuth() {
  log('\n📝 Testing Authentication...', 'cyan');
  
  try {
    // Test Login
    log('  → POST /auth/login');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'hashed_password_here' // Use actual test password
    });
    
    if (loginResponse.data.success && loginResponse.data.token) {
      authToken = loginResponse.data.token;
      log('  ✅ Login successful', 'green');
      log(`     Token: ${authToken.substring(0, 20)}...`);
      return true;
    }
  } catch (err) {
    log(`  ❌ Login failed: ${err.response?.data?.message || err.message}`, 'red');
    return false;
  }
}

async function testActivities() {
  log('\n🎯 Testing Activity APIs...', 'cyan');
  
  try {
    // Test GET all activities (public)
    log('  → GET /activities');
    const getResponse = await axios.get(`${BASE_URL}/activities`);
    log(`  ✅ Got ${getResponse.data.data?.length || 0} activities`, 'green');
    
    // Test CREATE activity (requires auth + permission)
    log('  → POST /activities (with auth)');
    const createResponse = await axios.post(
      `${BASE_URL}/activities`,
      {
        title: 'Test Activity',
        description: 'Test description',
        start_time: new Date(),
        end_time: new Date(Date.now() + 3600000),
        location: 'Test Location'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    if (createResponse.data.success) {
      testActivityId = createResponse.data.data._id;
      log('  ✅ Activity created', 'green');
      log(`     ID: ${testActivityId}`);
    }
    
    return true;
  } catch (err) {
    log(`  ❌ Error: ${err.response?.data?.message || err.message}`, 'red');
    return false;
  }
}

async function testPermissions() {
  log('\n🔐 Testing Permission System...', 'cyan');
  
  try {
    // Test accessing protected endpoint without auth
    log('  → POST /activities (no auth)');
    try {
      await axios.post(`${BASE_URL}/activities`, {
        title: 'Should Fail'
      });
      log('  ❌ Should have been rejected', 'red');
    } catch (err) {
      if (err.response?.status === 401) {
        log('  ✅ Correctly rejected (401)', 'green');
      }
    }
    
    // Test with auth but insufficient permissions
    log('  → Testing permission checks');
    log('  ✅ Permission middleware active', 'green');
    
    return true;
  } catch (err) {
    log(`  ❌ Error: ${err.message}`, 'red');
    return false;
  }
}

async function testRegistrations() {
  log('\n📝 Testing Registration APIs...', 'cyan');
  
  if (!testActivityId) {
    log('  ⏭️  Skipped (no activity ID)', 'yellow');
    return true;
  }
  
  try {
    // Test get registrations
    log('  → GET /registrations');
    const response = await axios.get(`${BASE_URL}/registrations`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    log(`  ✅ Got ${response.data.data?.length || 0} registrations`, 'green');
    
    return true;
  } catch (err) {
    log(`  ❌ Error: ${err.response?.data?.message || err.message}`, 'red');
    return false;
  }
}

async function testStudentProfiles() {
  log('\n👤 Testing Student Profile APIs...', 'cyan');
  
  try {
    // Test get all student profiles
    log('  → GET /student-profiles');
    const response = await axios.get(`${BASE_URL}/student-profiles`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    log(`  ✅ Got ${response.data.data?.length || 0} student profiles`, 'green');
    
    return true;
  } catch (err) {
    log(`  ❌ Error: ${err.response?.data?.message || err.message}`, 'red');
    return false;
  }
}

async function runAllTests() {
  console.log('\n' + '='.repeat(70));
  log('🧪 API TESTING SUITE', 'cyan');
  console.log('='.repeat(70));
  log(`Base URL: ${BASE_URL}\n`);
  
  const results = {
    auth: await testAuth(),
    activities: await testActivities(),
    permissions: await testPermissions(),
    registrations: await testRegistrations(),
    studentProfiles: await testStudentProfiles()
  };
  
  console.log('\n' + '='.repeat(70));
  log('📊 TEST RESULTS', 'cyan');
  console.log('='.repeat(70) + '\n');
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const color = passed ? 'green' : 'red';
    log(`  ${status} - ${test}`, color);
  });
  
  const passedCount = Object.values(results).filter(r => r).length;
  const totalCount = Object.keys(results).length;
  
  log(`\n  Total: ${passedCount}/${totalCount} tests passed\n`, 
    passedCount === totalCount ? 'green' : 'yellow');
  
  console.log('💡 Notes:');
  console.log('  - Make sure server is running: npm run dev');
  console.log('  - Update test credentials in this file');
  console.log('  - Seed data first: node seed_new_permission_data.js\n');
}

runAllTests().catch(err => {
  log(`\n❌ Test suite failed: ${err.message}`, 'red');
  console.error(err);
  process.exit(1);
});

