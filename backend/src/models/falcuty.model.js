const mongoose = require('mongoose');

const falcutySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    unique: true,
    trim: true
  }
}, { timestamps: false });

// Note: unique: true automatically creates an index, no need for falcutySchema.index({ name: 1 })

module.exports = mongoose.model('Falcuty', falcutySchema, 'falcuty');