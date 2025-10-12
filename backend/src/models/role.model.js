// Mongoose model cho Role (phân quyền động, nếu cần)
const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  permissions: [String], // Danh sách quyền
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);
