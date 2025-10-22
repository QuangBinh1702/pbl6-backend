const mongoose = require('mongoose');

const falcutySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  }
}, { timestamps: true });

// Index for faster queries
falcutySchema.index({ name: 1 });

module.exports = mongoose.model('Falcuty', falcutySchema, 'falcuty');