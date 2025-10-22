const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  falcuty_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Falcuty' 
  },
  cohort_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Cohort' 
  }
}, { timestamps: true });

// Index for faster queries
classSchema.index({ falcuty_id: 1 });
classSchema.index({ cohort_id: 1 });

module.exports = mongoose.model('Class', classSchema);