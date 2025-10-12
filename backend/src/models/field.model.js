const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  name: String
});

module.exports = mongoose.model('Field', fieldSchema);