// Mongoose model cho Chatbot Message Logging
const mongoose = require('mongoose');

const chatbotMessageSchema = new mongoose.Schema({
  // User who asked question
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Multi-tenant support
  tenantId: {
    type: String,
    default: 'default',
    index: true,
    required: true
  },

  // The question asked
  query: {
    type: String,
    required: true,
    trim: true
  },

  // The answer provided
  answer: {
    type: String,
    required: true
  },

  // Source of answer: 'rule' | 'rag' | 'fallback'
  source: {
    type: String,
    enum: ['rule', 'rag', 'fallback'],
    default: 'fallback',
    index: true
  },

  // Confidence scores for debugging/tuning
  scores: {
    ruleScore: {
      type: Number,
      default: null
    },
    ragScore: {
      type: Number,
      default: null
    }
  },

  // Which rule matched (if source='rule')
  matchedRuleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatbotRule',
    default: null
  },

  // Which documents retrieved (if source='rag')
  retrievedDocIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatbotDocument'
  }],

  // Response time in milliseconds
  responseTime: {
    type: Number,
    default: 0
  },

  // User roles at time of query (for audit)
  userRoles: [{
    type: String
  }],

  // Phase 3: Feedback tracking
  hasFeedback: {
    type: Boolean,
    default: false,
    index: true
  },

  feedbackId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatbotFeedback',
    default: null
  },

  // Phase 3: Language detection
  detectedLanguage: {
    type: String,
    default: 'unknown'
  },

  languageConfidence: {
    type: Number,
    default: 0
  },

  // Phase 3: Was LLM used for synthesis?
  usedLLM: {
    type: Boolean,
    default: false
  },

  llmModel: {
    type: String,
    default: null
  },

  // Phase 4: A/B testing tracking
  experimentData: {
    experimentId: {
      type: String,
      default: null
    },
    variant: {
      type: String,
      enum: ['control', 'treatment'],
      default: null
    },
    feedback: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },

  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false,
  versionKey: false,
  collection: 'chatbot_message'
});

// Composite indexes for analytics
chatbotMessageSchema.index({ tenantId: 1, timestamp: -1 });
chatbotMessageSchema.index({ tenantId: 1, source: 1 });
chatbotMessageSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('ChatbotMessage', chatbotMessageSchema);
