const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  resource: { 
    type: String, 
    required: true,
    trim: true
  },
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  }
}, { timestamps: true });

// Index for faster queries
permissionSchema.index({ resource: 1 });
permissionSchema.index({ name: 1 });

module.exports = mongoose.model('Permission', permissionSchema);