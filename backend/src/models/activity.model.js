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
  
  // ← NEW: Attendance Sessions Configuration
  attendance_sessions: [{
    _id: mongoose.Schema.Types.ObjectId,
    session_number: Number,
    name: String,
    description: String,
    start_time: Date,
    end_time: Date,
    qr_code: String,
    required: { type: Boolean, default: true }
  }],
  
  // ← NEW: How to calculate attendance
  attendance_config: {
    enabled: { type: Boolean, default: true },
    
    total_sessions_required: {
      type: Number,
      default: 1
    },
    
    calculation_method: {
      type: String,
      enum: ['all', 'partial', 'first_match'],
      default: 'partial'
      // all: phải quét tất cả để tính là "present"
      // partial: quét >= threshold tính là "present"
      // first_match: chỉ cần quét 1 lần
    },
    
    attendance_threshold: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5  // >= 50%
    },
    
    points_config: {
      points_per_session: {
        type: Number,
        default: 5
      },
      
      partial_points: {
        type: Boolean,
        default: true  // Quét 1/2 được 50% điểm?
      },
      
      max_points: {
        type: Number,
        default: 5
      }
    }
  },
  
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
