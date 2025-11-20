const mongoose = require('mongoose');

const cohortSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true,
    unique: true
  }
}, { timestamps: false });

// Index for faster queries
cohortSchema.index({ year: 1 });

module.exports = mongoose.model('Cohort', cohortSchema, 'cohort');