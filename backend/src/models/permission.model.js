const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  resource: String,
  action: String,
  name: String,
  description: String
});

module.exports = mongoose.model('Permission', permissionSchema);