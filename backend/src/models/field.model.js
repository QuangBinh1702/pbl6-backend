const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  name: String
}, { timestamps: false });

// Index for faster queries
fieldSchema.index({ name: 1 });

module.exports = mongoose.model('Field', fieldSchema, 'field');