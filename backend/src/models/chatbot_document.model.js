// Mongoose model for Chatbot Knowledge Base Documents (RAG)
const mongoose = require('mongoose');

const chatbotDocumentSchema = new mongoose.Schema({
  // Multi-tenant support
  tenantId: {
    type: String,
    default: 'default',
    index: true,
    required: true
  },

  // Document title/identifier
  title: {
    type: String,
    required: true,
    trim: true
  },

  // Document content (the actual knowledge)
  content: {
    type: String,
    required: true,
    trim: true
  },

  // Document source/category
  category: {
    type: String,
    enum: ['faq', 'guide', 'policy', 'regulation', 'procedure', 'other'],
    default: 'other'
  },

  // Embedding vector (768-dim for many models, configurable)
  embedding: [{
    type: Number
  }],

  // Metadata for retrieval and filtering
  tags: [{
    type: String,
    trim: true
  }],

  // Related rules (if applicable)
  relatedRuleIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatbotRule'
  }],

  // Priority for ranking during retrieval
  priority: {
    type: Number,
    default: 5,
    min: 1,
    max: 10
  },

  // RBAC: allowed roles
  allowedRoles: [{
    type: String
  }],

  // Active flag
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },

  // Document version (for tracking updates)
  version: {
    type: Number,
    default: 1
  },

  // Phase 3: Analytics tracking
  retrievalCount: {
    type: Number,
    default: 0
  },

  avgConfidenceScore: {
    type: Number,
    default: 0
  },

  feedbackCount: {
    type: Number,
    default: 0
  },

  avgFeedbackRating: {
    type: Number,
    default: 0
  },

  lastRetrievedAt: {
    type: Date,
    default: null
  },

  // Phase 4: Document duplicate/similarity tracking
  isDuplicate: {
    type: Boolean,
    default: false
  },

  duplicateOf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatbotDocument',
    default: null
  },

  similarityScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },

  // Phase 4: A/B testing variant
  abtestVariant: {
    type: String,
    enum: ['control', 'treatment', 'none'],
    default: 'none'
  },

  // Audit trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  updatedBy: {
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
  collection: 'chatbot_document'
});

// Composite indexes for efficient queries
chatbotDocumentSchema.index({ tenantId: 1, isActive: 1 });
chatbotDocumentSchema.index({ tenantId: 1, isActive: 1, priority: -1 });
chatbotDocumentSchema.index({ tenantId: 1, category: 1 });
chatbotDocumentSchema.index({ tags: 1 });

module.exports = mongoose.model('ChatbotDocument', chatbotDocumentSchema);
