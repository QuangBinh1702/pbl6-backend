// Mongoose model cho Chatbot Rules
const mongoose = require('mongoose');

const chatbotRuleSchema = new mongoose.Schema({
  // Multi-tenant support
  tenantId: {
    type: String,
    default: 'default',
    index: true,
    required: true
  },

  // Rule pattern
  pattern: {
    type: String,
    required: true,
    trim: true
  },

  // Alternative keywords for matching
  keywords: [{
    type: String,
    trim: true
  }],

  // Response template
  responseTemplate: {
    type: String,
    required: true
  },

  // Embedding vector (for similarity matching)
  embedding: [{
    type: Number
  }],

  // Priority: 1-10, higher = better match preference
  priority: {
    type: Number,
    default: 5,
    min: 1,
    max: 10
  },

  // RBAC: allowed roles
  // Empty array = public (accessible to all)
  // ['student', 'staff'] = only those roles can see
  allowedRoles: [{
    type: String
  }],

  // Rule type: 'faq', 'guide', 'rule'
  type: {
    type: String,
    enum: ['faq', 'guide', 'rule'],
    default: 'faq'
  },

  // Active flag
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },

  // Audit trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  versionKey: false,
  collection: 'chatbot_rule'
});

// Composite index for efficient queries
chatbotRuleSchema.index({ tenantId: 1, isActive: 1 });
chatbotRuleSchema.index({ tenantId: 1, isActive: 1, priority: -1 });

module.exports = mongoose.model('ChatbotRule', chatbotRuleSchema);
