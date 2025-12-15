/**
 * Comprehensive Chatbot Testing Script - All 4 Phases
 * Tests all features across Phase 1, 2, 3, and 4
 */

require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_NAME || 'pbl6';

// Test results storage
const testResults = {
  phase1: { passed: 0, failed: 0, errors: [] },
  phase2: { passed: 0, failed: 0, errors: [] },
  phase3: { passed: 0, failed: 0, errors: [] },
  phase4: { passed: 0, failed: 0, errors: [] }
};

let authToken = null;
let testUserId = null;

// Helper: Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: DB_NAME });
    console.log('✓ Connected to MongoDB\n');
  } catch (err) {
    console.error('✗ MongoDB connection error:', err.message);
    process.exit(1);
  }
}

// Helper: Login to get token
async function login() {
  try {
    // Try to login with a test user (adjust credentials as needed)
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      username: process.env.TEST_USERNAME || '102220095',
      password: process.env.TEST_PASSWORD || 'password123'
    });
    
    if (response.data.token) {
      authToken = response.data.token;
      testUserId = response.data.user?.id;
      console.log('✓ Authentication successful\n');
      return true;
    }
    throw new Error('No token received');
  } catch (err) {
    console.error('✗ Login failed:', err.response?.data?.message || err.message);
    console.log('⚠️  Continuing with database tests only...\n');
    return false;
  }
}

// Helper: Make authenticated API call
async function apiCall(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (err) {
    return {
      success: false,
      error: err.response?.data?.error || err.message,
      status: err.response?.status
    };
  }
}

// Helper: Test result tracking
function recordTest(phase, testName, passed, error = null) {
  if (passed) {
    testResults[phase].passed++;
    console.log(`  ✅ ${testName}`);
  } else {
    testResults[phase].failed++;
    testResults[phase].errors.push({ test: testName, error });
    console.log(`  ❌ ${testName}: ${error}`);
  }
}

// ============ PHASE 1 TESTS ============

async function testPhase1() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🔴 PHASE 1 TESTING: Rule Engine & Core Architecture');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Test 1.1: Models exist and can be loaded
  try {
    const ChatbotRule = require('../src/models/chatbot_rule.model');
    const ChatbotMessage = require('../src/models/chatbot_message.model');
    recordTest('phase1', 'Models loaded successfully', true);
  } catch (err) {
    recordTest('phase1', 'Models loaded successfully', false, err.message);
  }

  // Test 1.2: Services exist
  try {
    const ruleEngine = require('../src/services/ruleEngine.service');
    const chatbotService = require('../src/services/chatbot.service');
    const fallbackService = require('../src/services/fallback.service');
    recordTest('phase1', 'Services loaded successfully', true);
  } catch (err) {
    recordTest('phase1', 'Services loaded successfully', false, err.message);
  }

  // Test 1.3: Rules exist in database
  try {
    const ChatbotRule = require('../src/models/chatbot_rule.model');
    const count = await ChatbotRule.countDocuments({ tenantId: 'default', isActive: true });
    recordTest('phase1', `Rules in database (${count} found)`, count > 0);
  } catch (err) {
    recordTest('phase1', 'Rules in database', false, err.message);
  }

  // Test 1.4: Rule Engine matching
  if (authToken) {
    const result = await apiCall('POST', '/chatbot/test-query', {
      query: 'hoạt động sắp tới'
    });
    recordTest('phase1', 'Rule matching API', result.success, result.error);
    
    if (result.success && result.data?.data?.ruleMatch) {
      recordTest('phase1', 'Rule match found', result.data.data.ruleMatch.confidence > 0);
    }
  }

  // Test 1.5: Main chatbot endpoint
  if (authToken) {
    const result = await apiCall('POST', '/chatbot/ask-anything', {
      question: 'đăng ký hoạt động'
    });
    recordTest('phase1', 'Main chatbot endpoint', result.success, result.error);
    
    if (result.success) {
      const hasAnswer = result.data?.data?.answer && result.data.data.answer.length > 0;
      recordTest('phase1', 'Chatbot returns answer', hasAnswer);
    }
  }

  // Test 1.6: Chat history endpoint
  if (authToken) {
    const result = await apiCall('GET', '/chatbot/history');
    recordTest('phase1', 'Chat history endpoint', result.success, result.error);
  }

  // Test 1.7: Rules CRUD (if admin)
  if (authToken) {
    const result = await apiCall('GET', '/chatbot/rules');
    recordTest('phase1', 'List rules endpoint', result.success, result.error);
  }

  // Test 1.8: Analytics endpoint
  if (authToken) {
    const result = await apiCall('GET', '/chatbot/analytics');
    recordTest('phase1', 'Analytics endpoint', result.success, result.error);
  }

  // Test 1.9: Message logging
  try {
    const ChatbotMessage = require('../src/models/chatbot_message.model');
    const count = await ChatbotMessage.countDocuments({ tenantId: 'default' });
    recordTest('phase1', `Messages logged (${count} found)`, true);
  } catch (err) {
    recordTest('phase1', 'Messages logged', false, err.message);
  }

  // Test 1.10: Configuration
  try {
    const CONFIG = require('../src/config/chatbot.config');
    recordTest('phase1', 'Configuration loaded', CONFIG.ENABLE_RULES !== undefined);
    recordTest('phase1', 'Rules enabled', CONFIG.ENABLE_RULES === true);
  } catch (err) {
    recordTest('phase1', 'Configuration loaded', false, err.message);
  }
}

// ============ PHASE 2 TESTS ============

async function testPhase2() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🟡 PHASE 2 TESTING: RAG & Knowledge Base');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Test 2.1: Document model exists
  try {
    const ChatbotDocument = require('../src/models/chatbot_document.model');
    recordTest('phase2', 'Document model loaded', true);
  } catch (err) {
    recordTest('phase2', 'Document model loaded', false, err.message);
  }

  // Test 2.2: RAG service exists
  try {
    const ragService = require('../src/services/rag.service');
    recordTest('phase2', 'RAG service loaded', true);
  } catch (err) {
    recordTest('phase2', 'RAG service loaded', false, err.message);
  }

  // Test 2.3: Embedding service exists
  try {
    const embeddingService = require('../src/services/embedding.service');
    recordTest('phase2', 'Embedding service loaded', true);
  } catch (err) {
    recordTest('phase2', 'Embedding service loaded', false, err.message);
  }

  // Test 2.4: Documents in database
  try {
    const ChatbotDocument = require('../src/models/chatbot_document.model');
    const count = await ChatbotDocument.countDocuments({ tenantId: 'default', isActive: true });
    recordTest('phase2', `Documents in database (${count} found)`, count > 0);
  } catch (err) {
    recordTest('phase2', 'Documents in database', false, err.message);
  }

  // Test 2.5: Documents have embeddings
  try {
    const ChatbotDocument = require('../src/models/chatbot_document.model');
    const docs = await ChatbotDocument.find({ tenantId: 'default' }).limit(1).lean();
    if (docs.length > 0) {
      const hasEmbedding = docs[0].embedding && docs[0].embedding.length > 0;
      recordTest('phase2', 'Documents have embeddings', hasEmbedding);
    } else {
      recordTest('phase2', 'Documents have embeddings', false, 'No documents found');
    }
  } catch (err) {
    recordTest('phase2', 'Documents have embeddings', false, err.message);
  }

  // Test 2.6: List documents endpoint
  if (authToken) {
    const result = await apiCall('GET', '/chatbot/documents');
    recordTest('phase2', 'List documents endpoint', result.success, result.error);
  }

  // Test 2.7: RAG enabled in config
  try {
    const CONFIG = require('../src/config/chatbot.config');
    recordTest('phase2', 'RAG config exists', CONFIG.ENABLE_RAG !== undefined);
  } catch (err) {
    recordTest('phase2', 'RAG config exists', false, err.message);
  }

  // Test 2.8: Test query with RAG
  if (authToken) {
    const result = await apiCall('POST', '/chatbot/test-query', {
      query: 'hướng dẫn đăng ký'
    });
    if (result.success && result.data?.data?.ragMatch) {
      recordTest('phase2', 'RAG matching works', result.data.data.ragMatch.confidence > 0);
    } else {
      recordTest('phase2', 'RAG matching works', false, 'RAG match not found or RAG disabled');
    }
  }
}

// ============ PHASE 3 TESTS ============

async function testPhase3() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🟢 PHASE 3 TESTING: Advanced Features');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Test 3.1: Language detection service
  try {
    const languageService = require('../src/services/languageDetection.service');
    recordTest('phase3', 'Language detection service loaded', true);
  } catch (err) {
    recordTest('phase3', 'Language detection service loaded', false, err.message);
  }

  // Test 3.2: Analytics service
  try {
    const analyticsService = require('../src/services/analytics.service');
    recordTest('phase3', 'Analytics service loaded', true);
  } catch (err) {
    recordTest('phase3', 'Analytics service loaded', false, err.message);
  }

  // Test 3.3: Feedback service
  try {
    const feedbackService = require('../src/services/feedback.service');
    recordTest('phase3', 'Feedback service loaded', true);
  } catch (err) {
    recordTest('phase3', 'Feedback service loaded', false, err.message);
  }

  // Test 3.4: Feedback model
  try {
    const ChatbotFeedback = require('../src/models/chatbot_feedback.model');
    recordTest('phase3', 'Feedback model loaded', true);
  } catch (err) {
    recordTest('phase3', 'Feedback model loaded', false, err.message);
  }

  // Test 3.5: Advanced embedding service
  try {
    const advancedEmbedding = require('../src/services/advancedEmbedding.service');
    recordTest('phase3', 'Advanced embedding service loaded', true);
  } catch (err) {
    recordTest('phase3', 'Advanced embedding service loaded', false, err.message);
  }

  // Test 3.6: LLM synthesis service
  try {
    const llmSynthesis = require('../src/services/llmSynthesis.service');
    recordTest('phase3', 'LLM synthesis service loaded', true);
  } catch (err) {
    recordTest('phase3', 'LLM synthesis service loaded', false, err.message);
  }

  // Test 3.7: Dashboard endpoint
  if (authToken) {
    const result = await apiCall('GET', '/chatbot/analytics/dashboard');
    recordTest('phase3', 'Dashboard endpoint', result.success, result.error);
  }

  // Test 3.8: Trending topics endpoint
  if (authToken) {
    const result = await apiCall('GET', '/chatbot/analytics/trending-topics');
    recordTest('phase3', 'Trending topics endpoint', result.success, result.error);
  }

  // Test 3.9: Document performance endpoint
  if (authToken) {
    const result = await apiCall('GET', '/chatbot/analytics/document-performance');
    recordTest('phase3', 'Document performance endpoint', result.success, result.error);
  }

  // Test 3.10: Issues report endpoint
  if (authToken) {
    const result = await apiCall('GET', '/chatbot/analytics/issues-report');
    recordTest('phase3', 'Issues report endpoint', result.success, result.error);
  }

  // Test 3.11: Message has language detection fields
  try {
    const ChatbotMessage = require('../src/models/chatbot_message.model');
    const schema = ChatbotMessage.schema;
    const hasLanguageField = schema.paths.detectedLanguage !== undefined;
    recordTest('phase3', 'Message model has language fields', hasLanguageField);
  } catch (err) {
    recordTest('phase3', 'Message model has language fields', false, err.message);
  }

  // Test 3.12: Document has analytics fields
  try {
    const ChatbotDocument = require('../src/models/chatbot_document.model');
    const schema = ChatbotDocument.schema;
    const hasAnalyticsFields = schema.paths.retrievalCount !== undefined;
    recordTest('phase3', 'Document model has analytics fields', hasAnalyticsFields);
  } catch (err) {
    recordTest('phase3', 'Document model has analytics fields', false, err.message);
  }
}

// ============ PHASE 4 TESTS ============

async function testPhase4() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🔵 PHASE 4 TESTING: Advanced Features (10 Features)');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Test 4.1: Feedback closure service
  try {
    const feedbackClosure = require('../src/services/feedbackClosure.service');
    recordTest('phase4', 'Feedback closure service loaded', true);
  } catch (err) {
    recordTest('phase4', 'Feedback closure service loaded', false, err.message);
  }

  // Test 4.2: Auto-category service
  try {
    const autoCategory = require('../src/services/autoCategory.service');
    recordTest('phase4', 'Auto-category service loaded', true);
  } catch (err) {
    recordTest('phase4', 'Auto-category service loaded', false, err.message);
  }

  // Test 4.3: Similarity service
  try {
    const similarity = require('../src/services/similarity.service');
    recordTest('phase4', 'Similarity service loaded', true);
  } catch (err) {
    recordTest('phase4', 'Similarity service loaded', false, err.message);
  }

  // Test 4.4: Bulk import service
  try {
    const bulkImport = require('../src/services/bulkImport.service');
    recordTest('phase4', 'Bulk import service loaded', true);
  } catch (err) {
    recordTest('phase4', 'Bulk import service loaded', false, err.message);
  }

  // Test 4.5: Realtime service
  try {
    const realtime = require('../src/services/realtime.service');
    recordTest('phase4', 'Realtime service loaded', true);
  } catch (err) {
    recordTest('phase4', 'Realtime service loaded', false, err.message);
  }

  // Test 4.6: Embedding cache service
  try {
    const embeddingCache = require('../src/services/embeddingCache.service');
    recordTest('phase4', 'Embedding cache service loaded', true);
  } catch (err) {
    recordTest('phase4', 'Embedding cache service loaded', false, err.message);
  }

  // Test 4.7: A/B testing service
  try {
    const abTesting = require('../src/services/abTesting.service');
    recordTest('phase4', 'A/B testing service loaded', true);
  } catch (err) {
    recordTest('phase4', 'A/B testing service loaded', false, err.message);
  }

  // Test 4.8: Dashboard service
  try {
    const dashboard = require('../src/services/dashboard.service');
    recordTest('phase4', 'Dashboard service loaded', true);
  } catch (err) {
    recordTest('phase4', 'Dashboard service loaded', false, err.message);
  }

  // Test 4.9: Fine-tuning service
  try {
    const fineTuning = require('../src/services/fineTuning.service');
    recordTest('phase4', 'Fine-tuning service loaded', true);
  } catch (err) {
    recordTest('phase4', 'Fine-tuning service loaded', false, err.message);
  }

  // Test 4.10: Phase 4 controller
  try {
    const phase4Controller = require('../src/controllers/chatbot.phase4.controller');
    recordTest('phase4', 'Phase 4 controller loaded', true);
  } catch (err) {
    recordTest('phase4', 'Phase 4 controller loaded', false, err.message);
  }

  // Test 4.11: Phase 4 routes
  try {
    const phase4Routes = require('../src/routes/chatbot.phase4.routes');
    recordTest('phase4', 'Phase 4 routes loaded', true);
  } catch (err) {
    recordTest('phase4', 'Phase 4 routes loaded', false, err.message);
  }

  // Test 4.12: Document has Phase 4 fields
  try {
    const ChatbotDocument = require('../src/models/chatbot_document.model');
    const schema = ChatbotDocument.schema;
    const hasDupFields = schema.paths.isDuplicate !== undefined;
    recordTest('phase4', 'Document model has Phase 4 fields', hasDupFields);
  } catch (err) {
    recordTest('phase4', 'Document model has Phase 4 fields', false, err.message);
  }

  // Test 4.13: Message has Phase 4 fields
  try {
    const ChatbotMessage = require('../src/models/chatbot_message.model');
    const schema = ChatbotMessage.schema;
    // Check for experimentData field (nested schema)
    const hasExperimentFields = schema.paths.experimentData !== undefined || 
                                schema.tree.experimentData !== undefined;
    recordTest('phase4', 'Message model has Phase 4 fields', hasExperimentFields);
  } catch (err) {
    recordTest('phase4', 'Message model has Phase 4 fields', false, err.message);
  }

  // Test 4.14: Config has Phase 4 flags
  try {
    const CONFIG = require('../src/config/chatbot.config');
    const hasPhase4Flags = CONFIG.ENABLE_FEEDBACK_CLOSURE !== undefined;
    recordTest('phase4', 'Config has Phase 4 flags', hasPhase4Flags);
  } catch (err) {
    recordTest('phase4', 'Config has Phase 4 flags', false, err.message);
  }
}

// ============ MAIN TEST RUNNER ============

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 COMPREHENSIVE CHATBOT TESTING - ALL 4 PHASES');
  console.log('═══════════════════════════════════════════════════════════');
  
  await connectDB();
  await login();
  
  await testPhase1();
  await testPhase2();
  await testPhase3();
  await testPhase4();
  
  // Print summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const phases = ['phase1', 'phase2', 'phase3', 'phase4'];
  const phaseNames = {
    phase1: 'Phase 1: Rule Engine',
    phase2: 'Phase 2: RAG System',
    phase3: 'Phase 3: Advanced Features',
    phase4: 'Phase 4: Enterprise Features'
  };
  
  let totalPassed = 0;
  let totalFailed = 0;
  
  phases.forEach(phase => {
    const result = testResults[phase];
    const total = result.passed + result.failed;
    const percentage = total > 0 ? ((result.passed / total) * 100).toFixed(1) : 0;
    
    console.log(`${phaseNames[phase]}:`);
    console.log(`  ✅ Passed: ${result.passed}`);
    console.log(`  ❌ Failed: ${result.failed}`);
    console.log(`  📈 Success Rate: ${percentage}%`);
    
    if (result.errors.length > 0) {
      console.log(`  ⚠️  Errors:`);
      result.errors.forEach(err => {
        console.log(`     - ${err.test}: ${err.error}`);
      });
    }
    console.log();
    
    totalPassed += result.passed;
    totalFailed += result.failed;
  });
  
  const grandTotal = totalPassed + totalFailed;
  const grandPercentage = grandTotal > 0 ? ((totalPassed / grandTotal) * 100).toFixed(1) : 0;
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`TOTAL: ${totalPassed} passed, ${totalFailed} failed (${grandPercentage}% success rate)`);
  console.log('═══════════════════════════════════════════════════════════\n');
  
  await mongoose.connection.close();
  process.exit(totalFailed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

