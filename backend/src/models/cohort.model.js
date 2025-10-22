const mongoose = require('mongoose');

const cohortSchema = new mongoose.Schema({
  year: Number
}, { timestamps: true });

// Index for faster queries
cohortSchema.index({ year: 1 });

module.exports = mongoose.model('Cohort', cohortSchema);