const mongoose = require('mongoose');

const regulationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['attendance', 'submission', 'behavior', 'points', 'general'],
    required: true
  },
  keywords: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  image_urls: [{
    type: String
  }],
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, { timestamps: false });

// Index để tìm kiếm nhanh
regulationSchema.index({ category: 1 });
regulationSchema.index({ keywords: 1 });
regulationSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Regulation', regulationSchema, 'regulation');
