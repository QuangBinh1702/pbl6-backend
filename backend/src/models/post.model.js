const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  activity: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
  description: String,
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);