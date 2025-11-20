const mongoose = require('mongoose');

const falcutySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    unique: true,
    trim: true
  }
}, { timestamps: false });

// Index for faster queries
falcutySchema.index({ name: 1 });

module.exports = mongoose.model('Falcuty', falcutySchema, 'falcuty');