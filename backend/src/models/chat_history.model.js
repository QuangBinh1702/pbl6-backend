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
  image_url: String,
  query_type: {
    type: String,
    enum: ['text', 'image'],
    default: 'text'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: false });

// Index để lấy lịch của user
chatHistorySchema.index({ user_id: 1, timestamp: -1 });

module.exports = mongoose.model('ChatHistory', chatHistorySchema, 'chat_history');
