// Mongoose model cho User
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    unique: true, 
    required: true, 
    trim: true 
  },
  password_hash: { 
    type: String, 
    required: true 
  },
  active: { 
    type: Boolean, 
    default: true 
  },
  isLocked: { 
    type: Boolean, 
    default: false 
  }
}, { 
  timestamps: false, 
  versionKey: false,
  collection: 'user' 
});

// Index for faster queries (username already has unique index)
userSchema.index({ active: 1 });

module.exports = mongoose.model('User', userSchema);
