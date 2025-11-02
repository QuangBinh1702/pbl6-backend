const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  activity_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Activity' 
  },
  description: String,
  created_at: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: false });

// Index for faster queries
postSchema.index({ activity_id: 1 });
postSchema.index({ created_at: -1 });

module.exports = mongoose.model('Post', postSchema, 'post');