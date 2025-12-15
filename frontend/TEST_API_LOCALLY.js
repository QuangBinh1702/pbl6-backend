/**
 * Test API Locally - Validate Backend Before Frontend
 * Usage: node TEST_API_LOCALLY.js
 */

const http = require('http');

// Config
const API_BASE = 'http://localhost:3001/api/chatbot';
const TEST_TOKEN = process.env.TEST_TOKEN || 'test-token-12345'; // Set via ENV or use default

// Colors for console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  title: (msg) => console.log(`\n${colors.blue}${'='.repeat(50)}${colors.reset}\n${msg}\n${colors.blue}${'='.repeat(50)}${colors.reset}\n`)
};

// Test cases
const tests = [];

// Helper to make HTTP request
function makeRequest(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + endpoint);
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed
          });
        } catch {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// Test 1: Check Backend Connection
tests.push({
  name: 'Test 1: Backend Connection',
  run: async () => {
    try {
      log.info('Checking if backend is running...');
      const res = await makeRequest('GET', '');
      
      if (res.status !== 401 && res.status !== 403) {
        throw new Error(`Expected 401/403 (no token), got ${res.status}`);
      }
      
      log.success('Backend is running and responding');
      return true;
    } catch (err) {
      log.error(`Backend not responding: ${err.message}`);
      log.warn('Make sure backend is running: cd backend && npm run dev');
      return false;
    }
  }
});

// Test 2: Ask Question API
tests.push({
  name: 'Test 2: Ask Question (POST /ask-anything)',
  run: async () => {
    try {
      log.info('Sending question...');
      const res = await makeRequest('POST', '/ask-anything', {
        question: 'Hoạt động sắp tới là gì?'
      });

      if (res.status === 401) {
        log.warn('Token invalid or expired. Set TEST_TOKEN environment variable');
        return false;
      }

      if (res.status !== 200) {
        log.error(`Expected 200, got ${res.status}`);
        log.info(JSON.stringify(res.body, null, 2));
        return false;
      }

      if (!res.body.success) {
        log.error(`API returned success: false`);
        return false;
      }

      if (!res.body.data.answer) {
        log.warn('No answer in response (rules might be empty)');
      }

      log.success('Ask question working');
      log.info(`Answer: ${res.body.data.answer?.substring(0, 50)}...`);
      return true;
    } catch (err) {
      log.error(`Error: ${err.message}`);
      return false;
    }
  }
});

// Test 3: Get Chat History
tests.push({
  name: 'Test 3: Get Chat History (GET /history)',
  run: async () => {
    try {
      log.info('Fetching chat history...');
      const res = await makeRequest('GET', '/history?limit=5&page=1');

      if (res.status === 401) {
        log.warn('Token invalid');
        return false;
      }

      if (res.status !== 200) {
        log.error(`Expected 200, got ${res.status}`);
        return false;
      }

      if (!Array.isArray(res.body.data)) {
        log.warn('History not array (probably empty)');
      }

      log.success('Chat history API working');
      log.info(`Found ${res.body.data?.length || 0} messages`);
      return true;
    } catch (err) {
      log.error(`Error: ${err.message}`);
      return false;
    }
  }
});

// Test 4: Submit Feedback
tests.push({
  name: 'Test 4: Submit Feedback (POST /feedback)',
  run: async () => {
    try {
      log.info('Submitting feedback...');
      const res = await makeRequest('POST', '/feedback', {
        messageId: 'test-msg-123',
        rating: 5,
        issue: null,
        suggestion: 'Test suggestion',
        isHelpful: true
      });

      if (res.status === 401) {
        log.warn('Token invalid');
        return false;
      }

      if (![200, 201].includes(res.status)) {
        log.error(`Expected 200/201, got ${res.status}`);
        log.info(JSON.stringify(res.body, null, 2));
        return false;
      }

      log.success('Feedback API working');
      return true;
    } catch (err) {
      log.error(`Error: ${err.message}`);
      return false;
    }
  }
});

// Run all tests
async function runAllTests() {
  log.title('🧪 API LOCAL TESTING');

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log(`\n${test.name}`);
    console.log('-'.repeat(50));

    try {
      const result = await test.run();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (err) {
      log.error(`Unexpected error: ${err.message}`);
      failed++;
    }
  }

  // Summary
  log.title('📊 TEST SUMMARY');
  log.info(`Total: ${tests.length} tests`);
  log.success(`Passed: ${passed}`);
  if (failed > 0) log.error(`Failed: ${failed}`);

  if (failed === 0) {
    log.success('\n🎉 All tests passed! Frontend can now connect to backend.\n');
    process.exit(0);
  } else {
    log.warn('\n⚠️  Some tests failed. Check backend logs.\n');
    process.exit(1);
  }
}

// Start
console.clear();
log.info(`Testing API at: ${API_BASE}`);
log.info(`Token: ${TEST_TOKEN.substring(0, 10)}...`);
log.info(`\nStarting tests...\n`);

runAllTests().catch(err => {
  log.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
