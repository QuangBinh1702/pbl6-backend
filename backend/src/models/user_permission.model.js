const mongoose = require('mongoose');

// Schema cho bảng trung gian User-Permission (tương đương tbl_user_per)
const userPermissionSchema = new mongoose.Schema({
  id_user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  id_per: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission',
    required: true
  },
  licensed: {
    type: Boolean,
    default: true,
    required: true
  },
  // Các trường bổ sung
  granted_at: {
    type: Date,
    default: Date.now
  },
  granted_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  expires_at: {
    type: Date,
    default: null // null = không hết hạn
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'user_permissions'
});

// Composite index để đảm bảo không trùng lặp user-permission
userPermissionSchema.index({ id_user: 1, id_per: 1 }, { unique: true });

// Index riêng cho các trường thường query
userPermissionSchema.index({ id_user: 1, licensed: 1 });
userPermissionSchema.index({ id_per: 1 });
userPermissionSchema.index({ expires_at: 1 });

// Virtual để kiểm tra permission còn hiệu lực không
userPermissionSchema.virtual('is_valid').get(function() {
  if (!this.licensed) return false;
  if (!this.expires_at) return true;
  return new Date() < this.expires_at;
});

// Method để revoke permission
userPermissionSchema.methods.revoke = function() {
  this.licensed = false;
  return this.save();
};

// Method để grant lại permission
userPermissionSchema.methods.grant = function() {
  this.licensed = true;
  return this.save();
};

// Static method để lấy tất cả permissions của user
userPermissionSchema.statics.getUserPermissions = async function(userId, onlyValid = true) {
  const query = { id_user: userId };
  if (onlyValid) {
    query.licensed = true;
    query.$or = [
      { expires_at: null },
      { expires_at: { $gt: new Date() } }
    ];
  }
  
  return this.find(query)
    .populate('id_per')
    .sort({ granted_at: -1 });
};

// Static method để kiểm tra user có permission cụ thể không
userPermissionSchema.statics.hasPermission = async function(userId, permissionId) {
  const userPerm = await this.findOne({
    id_user: userId,
    id_per: permissionId,
    licensed: true,
    $or: [
      { expires_at: null },
      { expires_at: { $gt: new Date() } }
    ]
  });
  
  return !!userPerm;
};

// Static method để grant permission cho user
userPermissionSchema.statics.grantPermission = async function(userId, permissionId, grantedBy = null, expiresAt = null) {
  return this.findOneAndUpdate(
    { id_user: userId, id_per: permissionId },
    { 
      licensed: true,
      granted_by: grantedBy,
      expires_at: expiresAt,
      granted_at: new Date()
    },
    { 
      upsert: true, 
      new: true,
      setDefaultsOnInsert: true
    }
  );
};

// Static method để revoke permission của user
userPermissionSchema.statics.revokePermission = async function(userId, permissionId) {
  return this.findOneAndUpdate(
    { id_user: userId, id_per: permissionId },
    { licensed: false },
    { new: true }
  );
};

// Middleware để cleanup expired permissions (optional)
userPermissionSchema.statics.cleanupExpired = async function() {
  return this.updateMany(
    {
      licensed: true,
      expires_at: { $lte: new Date(), $ne: null }
    },
    { licensed: false }
  );
};

module.exports = mongoose.model('UserPermission', userPermissionSchema);


