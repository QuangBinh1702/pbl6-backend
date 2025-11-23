// Mongoose model cho Activity
const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  org_unit_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'OrgUnit'
  },
  field_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Field'
  },
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  location: String,
  start_time: { 
    type: Date,
    required: true
  },
  end_time: { 
    type: Date,
    required: true
  },
  start_time_updated: Date,
  end_time_updated: Date,
  capacity: { 
    type: Number,
    min: 0
  },
  qr_code: String,
  registration_open: Date,
  registration_close: Date,
  activity_image: String,
  requires_approval: { 
    type: Boolean, 
    default: false 
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'in_progress', 'completed', 'rejected', 'cancelled'],
    default: 'pending'
  },
  completed_at: Date,
  approved_at: Date,
  cancelled_at: Date,
  cancellation_reason: {
    type: String,
    trim: true
  }
}, { timestamps: false, collection: 'activity' });

// Index for faster queries
activitySchema.index({ org_unit_id: 1 });
activitySchema.index({ field_id: 1 });
activitySchema.index({ start_time: 1 });
activitySchema.index({ registration_open: 1, registration_close: 1 });
activitySchema.index({ status: 1 });

module.exports = mongoose.model('Activity', activitySchema);
