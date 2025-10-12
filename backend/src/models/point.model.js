// Mongoose model cho điểm cộng đồng
const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  semester: String, // Học kỳ
  year: Number, // Năm học
  points: { type: Number, default: 0 },
  type: { type: String, enum: ['pvcd', 'rl'], default: 'pvcd' }, // Loại điểm: PVCD, rèn luyện...
  confirmed: { type: Boolean, default: false },
  confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  confirmedAt: Date,
  note: String,
  // ...other fields...
}, { timestamps: true });

module.exports = mongoose.model('Point', pointSchema);
