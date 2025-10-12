const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: { type: String, required: true },
  falcuty: { type: mongoose.Schema.Types.ObjectId, ref: 'Falcuty' },
  cohort: { type: mongoose.Schema.Types.ObjectId, ref: 'Cohort' }
});

module.exports = mongoose.model('Class', classSchema);