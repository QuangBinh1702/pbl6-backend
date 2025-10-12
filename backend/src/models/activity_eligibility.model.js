const mongoose = require('mongoose');

const activityEligibilitySchema = new mongoose.Schema({
  activity: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
  type: { type: String, enum: ['falcuty', 'cohort'] },
  reference: { type: mongoose.Schema.Types.ObjectId }
});

module.exports = mongoose.model('ActivityEligibility', activityEligibilitySchema);