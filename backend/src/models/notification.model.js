// Mongoose model cho Notification
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  published_date: { 
    type: Date,
    required: true,
    default: Date.now
  },
  icon_type: {
    type: String,
    default: 'megaphone', // Default icon type
    trim: true
  },
  notification_type: {
    type: String,
    enum: ['schedule', 'score_update', 'cancellation', 'registration_guide', 'general', 'activity', 'announcement'],
    default: 'general'
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  target_audience: {
    type: String,
    enum: ['all', 'student', 'staff', 'specific'],
    default: 'all'
  },
  target_user_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { 
  timestamps: false, 
  versionKey: false,
  collection: 'notification' 
});

// Index for faster queries
notificationSchema.index({ published_date: -1 });
notificationSchema.index({ notification_type: 1 });
notificationSchema.index({ target_audience: 1 });
notificationSchema.index({ created_by: 1 });

module.exports = mongoose.model('Notification', notificationSchema);


