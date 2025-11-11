// Mongoose model cho NotificationRead - Lưu trạng thái đọc của từng user
const mongoose = require('mongoose');

const notificationReadSchema = new mongoose.Schema({
  notification_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification',
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  read_at: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: false, 
  versionKey: false,
  collection: 'notification_read' 
});

// Compound index để đảm bảo mỗi user chỉ có 1 record đọc cho 1 notification
notificationReadSchema.index({ notification_id: 1, user_id: 1 }, { unique: true });
notificationReadSchema.index({ user_id: 1 });
notificationReadSchema.index({ read_at: -1 });

module.exports = mongoose.model('NotificationRead', notificationReadSchema);


