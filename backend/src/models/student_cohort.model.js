const mongoose = require('mongoose');

const studentCohortSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true },
  cohort: { type: mongoose.Schema.Types.ObjectId, ref: 'Cohort', required: true },
  type: { type: String, enum: ['official', 'actual'], default: 'official' }
});

module.exports = mongoose.model('StudentCohort', studentCohortSchema);