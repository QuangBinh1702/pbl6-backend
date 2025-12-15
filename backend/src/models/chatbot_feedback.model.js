// Mongoose model for Chatbot Feedback (Phase 3)
const mongoose = require('mongoose');

const chatbotFeedbackSchema = new mongoose.Schema({
  // Reference to the message being rated
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatbotMessage',
    required: true,
    index: true
  },

  // User who provided feedback
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

  // Context from original message
  query: {
    type: String,
    required: true
  },

  answer: {
    type: String,
    required: true
  },

  source: {
    type: String,
    enum: ['rule', 'rag', 'fallback'],
    default: 'fallback'
  },

  // Rating (1-5 stars)
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    index: true
  },

  // Was the answer helpful?
  isHelpful: {
    type: Boolean,
    default: null
  },

  // What issue(s) with the answer? (optional)
  issue: {
    type: String,
    enum: [
      'incomplete',
      'inaccurate',
      'irrelevant',
      'unclear',
      'outdated',
      'too_long',
      'too_short',
      'wrong_language',
      'other'
    ],
    default: null,
    index: true
  },

  // User suggestion for improvement (optional)
  suggestion: {
    type: String,
    trim: true,
    default: null
  },

  // Admin notes
  adminNotes: {
    type: String,
    trim: true,
    default: null
  },

  // Whether this feedback has been reviewed by admin
  isReviewed: {
    type: Boolean,
    default: false,
    index: true
  },

  // Phase 4: Feedback closure workflow
  isClosed: {
    type: Boolean,
    default: false,
    index: true
  },

  closureReason: {
    type: String,
    enum: ['resolved', 'duplicate', 'invalid', 'working_as_intended', 'other'],
    default: null
  },

  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  reviewedAt: {
    type: Date,
    default: null
  },

  closedAt: {
    type: Date,
    default: null
  },

  adminResponse: {
    actionTaken: {
      type: String,
      default: null
    },
    tags: [{
      type: String
    }],
    timestamp: {
      type: Date,
      default: null
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
  collection: 'chatbot_feedback'
});

// Composite indexes
chatbotFeedbackSchema.index({ tenantId: 1, timestamp: -1 });
chatbotFeedbackSchema.index({ tenantId: 1, rating: 1 });
chatbotFeedbackSchema.index({ tenantId: 1, source: 1 });
chatbotFeedbackSchema.index({ tenantId: 1, isReviewed: 1 });

module.exports = mongoose.model('ChatbotFeedback', chatbotFeedbackSchema);
