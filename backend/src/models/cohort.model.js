const mongoose = require('mongoose');

const cohortSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true,
    unique: true
  }
}, { timestamps: false });

// Note: unique: true automatically creates an index, no need for cohortSchema.index({ year: 1 })

module.exports = mongoose.model('Cohort', cohortSchema, 'cohort');