// Mongoose model cho Activity Rejection (Từ chối hoạt động)
const mongoose = require('mongoose');

const activityRejectionSchema = new mongoose.Schema({
  activity_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Activity',
    required: true,
    unique: true // Mỗi hoạt động chỉ có thể bị từ chối một lần (unique automatically creates index)
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  rejected_by: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  rejected_at: { 
    type: Date,
    default: Date.now
  }
}, { timestamps: false, collection: 'activity_rejection' });

// Index for faster queries (activity_id index is already created by unique: true)
activityRejectionSchema.index({ rejected_by: 1 });
activityRejectionSchema.index({ rejected_at: -1 });

module.exports = mongoose.model('ActivityRejection', activityRejectionSchema);

