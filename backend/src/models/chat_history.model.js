const mongoose = require('mongoose');

const chatHistorySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  question: String,
  extracted_text: {
    type: String,
    description: 'Text trích xuất từ ảnh (nếu có)'
  },
  response: String,
  related_regulation_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Regulation'
  }],
  related_activity_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity'
  }],
  image_url: String,
  image_type: {
    type: String,
    enum: ['document', 'poster', 'screenshot', 'photo', 'unknown'],
    default: 'unknown'
  },
  suggested_questions: [{
    type: String
  }],
  query_type: {
    type: String,
    enum: ['text', 'image', 'activity', 'attendance', 'info', 'registration', 'absence'],
    default: 'text'
  },
  query_context: {
    activity_id: mongoose.Schema.Types.ObjectId,
    student_id: mongoose.Schema.Types.ObjectId,
    class_id: mongoose.Schema.Types.ObjectId
  },
  user_feedback: {
    type: String,
    enum: ['helpful', 'not_helpful', 'partially_helpful', null],
    default: null
  },
  feedback_comment: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: false });

// Index để lấy lịch của user
chatHistorySchema.index({ user_id: 1, timestamp: -1 });
chatHistorySchema.index({ query_type: 1 });
chatHistorySchema.index({ user_feedback: 1 });

module.exports = mongoose.model('ChatHistory', chatHistorySchema, 'chat_history');
