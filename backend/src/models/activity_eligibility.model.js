const mongoose = require('mongoose');

const activityEligibilitySchema = new mongoose.Schema({
  activity_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Activity' 
  },
  type: { 
    type: String, 
    enum: ['falcuty', 'cohort'] 
  },
  reference_id: { 
    type: mongoose.Schema.Types.ObjectId 
  }
}, { timestamps: false });

// Index for faster queries
activityEligibilitySchema.index({ activity_id: 1 });
activityEligibilitySchema.index({ type: 1 });

module.exports = mongoose.model('ActivityEligibility', activityEligibilitySchema, 'activity_eligiblity');