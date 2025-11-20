const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  falcuty_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Falcuty',
    required: true
  },
  cohort_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Cohort',
    required: true
  }
}, { timestamps: false });

// Composite unique index: same class name cannot exist in same faculty + cohort
classSchema.index({ name: 1, falcuty_id: 1, cohort_id: 1 }, { unique: true });

// Index for faster queries
classSchema.index({ falcuty_id: 1 });
classSchema.index({ cohort_id: 1 });

module.exports = mongoose.model('Class', classSchema, 'class');