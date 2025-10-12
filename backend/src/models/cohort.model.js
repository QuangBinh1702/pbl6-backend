const mongoose = require('mongoose');

const cohortSchema = new mongoose.Schema({
  year: Number
});

module.exports = mongoose.model('Cohort', cohortSchema);