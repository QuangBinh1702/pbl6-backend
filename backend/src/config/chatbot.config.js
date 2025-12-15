// Chatbot Configuration
// Environment variables with fallback defaults

const CONFIG = {
  // Feature flags
  ENABLE_RULES: process.env.CHATBOT_ENABLE_RULES !== 'false',
  ENABLE_RAG: process.env.CHATBOT_ENABLE_RAG === 'true',
  RULE_PRIORITY_OVER_RAG: process.env.CHATBOT_RULE_PRIORITY_OVER_RAG !== 'false',

  // Confidence thresholds (0-1)
  // If rule confidence >= threshold, use rule
  // If RAG confidence >= threshold, use RAG
  // Otherwise fallback
  RULE_MIN_CONFIDENCE: parseFloat(process.env.CHATBOT_RULE_MIN_CONFIDENCE || '0.35'),
  RAG_MIN_CONFIDENCE: parseFloat(process.env.CHATBOT_RAG_MIN_CONFIDENCE || '0.15'),

  // RAG settings (for Phase 2)
  RAG_TOP_K: parseInt(process.env.CHATBOT_RAG_TOP_K || '5'),
  RAG_TIMEOUT_MS: parseInt(process.env.CHATBOT_RAG_TIMEOUT_MS || '5000'),

  // Response settings
  MAX_RESPONSE_LENGTH: parseInt(process.env.CHATBOT_MAX_RESPONSE_LENGTH || '2000'),
  MAX_RETRIEVED_DOCS: parseInt(process.env.CHATBOT_MAX_RETRIEVED_DOCS || '10'),

  // Logging
  LOG_MESSAGES: process.env.CHATBOT_LOG_MESSAGES !== 'false',
  LOG_SCORES: process.env.CHATBOT_LOG_SCORES !== 'false',

  // Embedding settings (for Phase 2)
  EMBEDDING_DIMENSION: parseInt(process.env.CHATBOT_EMBEDDING_DIMENSION || '256'),
  EMBEDDING_MODEL: process.env.CHATBOT_EMBEDDING_MODEL || 'simple',

  // LLM settings (for Phase 3+)
  USE_LLM_FOR_RAG: process.env.CHATBOT_USE_LLM_FOR_RAG === 'true',
  LLM_MODEL: process.env.CHATBOT_LLM_MODEL || 'gpt-3.5-turbo',
  LLM_TEMPERATURE: parseFloat(process.env.CHATBOT_LLM_TEMPERATURE || '0.3'),
  LLM_MAX_TOKENS: parseInt(process.env.CHATBOT_LLM_MAX_TOKENS || '500'),

  // Phase 3: Advanced embeddings
  USE_HUGGINGFACE_EMBEDDINGS: process.env.CHATBOT_USE_HUGGINGFACE_EMBEDDINGS === 'true',

  // Phase 3: Language detection
  ENABLE_LANGUAGE_DETECTION: process.env.CHATBOT_ENABLE_LANGUAGE_DETECTION !== 'false',

  // Phase 3: Advanced analytics
  ENABLE_ANALYTICS: process.env.CHATBOT_ENABLE_ANALYTICS !== 'false',

  // Phase 3: Feedback collection
  ENABLE_FEEDBACK: process.env.CHATBOT_ENABLE_FEEDBACK !== 'false',

  // Phase 4: Feedback closure workflow
  ENABLE_FEEDBACK_CLOSURE: process.env.CHATBOT_ENABLE_FEEDBACK_CLOSURE !== 'false',

  // Phase 4: Auto-categorization
  ENABLE_AUTO_CATEGORY: process.env.CHATBOT_ENABLE_AUTO_CATEGORY === 'true',

  // Phase 4: Similarity detection
  ENABLE_SIMILARITY_DETECTION: process.env.CHATBOT_ENABLE_SIMILARITY_DETECTION === 'true',
  SIMILARITY_THRESHOLD: parseFloat(process.env.CHATBOT_SIMILARITY_THRESHOLD || '0.75'),

  // Phase 4: Real-time analytics
  ENABLE_REALTIME_ANALYTICS: process.env.CHATBOT_ENABLE_REALTIME_ANALYTICS === 'true',
  ANALYTICS_BUFFER_SIZE: parseInt(process.env.CHATBOT_ANALYTICS_BUFFER_SIZE || '10'),
  ANALYTICS_FLUSH_INTERVAL: parseInt(process.env.CHATBOT_ANALYTICS_FLUSH_INTERVAL || '5000'),

  // Phase 4: Embedding cache
  ENABLE_EMBEDDING_CACHE: process.env.CHATBOT_ENABLE_EMBEDDING_CACHE === 'true',
  EMBEDDING_CACHE_SIZE: parseInt(process.env.CHATBOT_EMBEDDING_CACHE_SIZE || '1000'),
  EMBEDDING_CACHE_TTL: parseInt(process.env.CHATBOT_EMBEDDING_CACHE_TTL || '86400000'),

  // Phase 4: A/B testing
  ENABLE_AB_TESTING: process.env.CHATBOT_ENABLE_AB_TESTING === 'true',

  // Placeholder for RAG service (will be set by app)
  USE_RAG_FALLBACK: null
};

/**
 * Validate configuration
 */
function validateConfig() {
  const errors = [];

  if (CONFIG.RULE_MIN_CONFIDENCE < 0 || CONFIG.RULE_MIN_CONFIDENCE > 1) {
    errors.push('RULE_MIN_CONFIDENCE must be between 0 and 1');
  }

  if (CONFIG.RAG_MIN_CONFIDENCE < 0 || CONFIG.RAG_MIN_CONFIDENCE > 1) {
    errors.push('RAG_MIN_CONFIDENCE must be between 0 and 1');
  }

  if (CONFIG.RAG_TOP_K < 1) {
    errors.push('RAG_TOP_K must be >= 1');
  }

  if (errors.length > 0) {
    console.error('Chatbot config validation errors:', errors);
    throw new Error('Invalid chatbot configuration: ' + errors.join(', '));
  }

  console.log('✓ Chatbot configuration loaded:', {
    ENABLE_RULES: CONFIG.ENABLE_RULES,
    ENABLE_RAG: CONFIG.ENABLE_RAG,
    RULE_MIN_CONFIDENCE: CONFIG.RULE_MIN_CONFIDENCE,
    RAG_MIN_CONFIDENCE: CONFIG.RAG_MIN_CONFIDENCE,
    RAG_TOP_K: CONFIG.RAG_TOP_K
  });
}

/**
 * Print config summary
 */
function printConfig() {
  console.log('\n=== CHATBOT CONFIGURATION ===');
  console.log(`Rules Engine: ${CONFIG.ENABLE_RULES ? '✓ ENABLED' : '✗ DISABLED'}`);
  console.log(`RAG System: ${CONFIG.ENABLE_RAG ? '✓ ENABLED' : '✗ DISABLED'}`);
  console.log(`Rule Min Confidence: ${CONFIG.RULE_MIN_CONFIDENCE}`);
  console.log(`RAG Min Confidence: ${CONFIG.RAG_MIN_CONFIDENCE}`);
  console.log(`Logging: ${CONFIG.LOG_MESSAGES ? '✓ ENABLED' : '✗ DISABLED'}`);
  console.log('==============================\n');
}

// Validate on load
validateConfig();

module.exports = CONFIG;
