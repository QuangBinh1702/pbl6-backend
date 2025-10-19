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

// name already has unique index, no need for additional index

module.exports = mongoose.model('Role', roleSchema);
