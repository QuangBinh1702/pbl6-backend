const mongoose = require('mongoose');

const pvcdRecordSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true },
  year: { type: Date, required: true },
  total_point: { type: Number, default: 0 }
});

module.exports = mongoose.model('PvcdRecord', pvcdRecordSchema);