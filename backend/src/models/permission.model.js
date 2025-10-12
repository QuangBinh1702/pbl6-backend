const mongoose = require('mongoose');

// Schema cho chi tiết action của permission (tương đương tbl_per_detail)
const permissionDetailSchema = new mongoose.Schema({
  action_name: {
    type: String,
    required: true,
    trim: true
  },
  action_code: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  check_action: {
    type: Boolean,
    default: false
  },
  description: {
    type: String,
    trim: true
  }
}, { _id: true });

// Schema chính cho Permission (tương đương tbl_permission)
const permissionSchema = new mongoose.Schema({
  name_per: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  // Nhúng các permission details vào
  details: [permissionDetailSchema],
  
  // Các trường bổ sung để tương thích với hệ thống cũ
  resource: {
    type: String,
    trim: true
  },
  action: {
    type: String,
    trim: true
  },
  
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'permissions'
});

// Index để tìm kiếm nhanh (name_per đã có unique index ở schema)
permissionSchema.index({ resource: 1, action: 1 });
permissionSchema.index({ 'details.action_code': 1 });

// Method để thêm detail vào permission
permissionSchema.methods.addDetail = function(detail) {
  this.details.push(detail);
  return this.save();
};

// Method để kiểm tra action có được phép không
permissionSchema.methods.isActionAllowed = function(actionCode) {
  const detail = this.details.find(d => d.action_code === actionCode.toUpperCase());
  return detail ? detail.check_action : false;
};

// Static method để lấy tất cả actions của một permission
permissionSchema.statics.getPermissionWithDetails = function(permissionId) {
  return this.findById(permissionId).select('name_per description details');
};

module.exports = mongoose.model('Permission', permissionSchema);