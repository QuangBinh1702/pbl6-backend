const mongoose = require('mongoose');

const pvcdRecordSchema = new mongoose.Schema({
  student_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'StudentProfile', 
    required: true 
  },
  year: { 
    type: Number, 
    required: true 
  },
  start_year: Date,
  end_year: Date,
  total_point: { 
    type: Number, 
    default: 0 
  }
}, { timestamps: true });

// Index for faster queries
pvcdRecordSchema.index({ student_id: 1 });
pvcdRecordSchema.index({ year: 1 });

module.exports = mongoose.model('PvcdRecord', pvcdRecordSchema);