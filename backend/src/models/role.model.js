// Mongoose model cho Role (phân quyền động, nếu cần)
const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  }
}, { timestamps: true });

// Index for faster queries
roleSchema.index({ name: 1 });

module.exports = mongoose.model('Role', roleSchema);
