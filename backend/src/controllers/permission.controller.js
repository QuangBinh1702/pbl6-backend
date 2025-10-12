const Permission = require('../models/permission.model');
const UserPermission = require('../models/user_permission.model');
const User = require('../models/user.model');

/**
 * Lấy tất cả permissions
 */
exports.getAllPermissions = async (req, res) => {
  try {
    const { is_active, search } = req.query;
    
    // Build query
    const query = {};
    if (is_active !== undefined) {
      query.is_active = is_active === 'true';
    }
    if (search) {
      query.$or = [
        { name_per: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const permissions = await Permission.find(query)
      .select('name_per description details resource action is_active createdAt')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: permissions.length,
      data: permissions
    });
  } catch (error) {
    console.error('Error in getAllPermissions:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách permissions',
      error: error.message
    });
  }
};

/**
 * Lấy chi tiết một permission
 */
exports.getPermissionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const permission = await Permission.findById(id);
    
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy permission'
      });
    }
    
    res.json({
      success: true,
      data: permission
    });
  } catch (error) {
    console.error('Error in getPermissionById:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin permission',
      error: error.message
    });
  }
};

/**
 * Tạo permission mới
 */
exports.createPermission = async (req, res) => {
  try {
    const { name_per, description, resource, action, details } = req.body;
    
    // Validate
    if (!name_per) {
      return res.status(400).json({
        success: false,
        message: 'Tên permission (name_per) là bắt buộc'
      });
    }
    
    // Kiểm tra trùng
    const existing = await Permission.findOne({ name_per });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Permission đã tồn tại'
      });
    }
    
    const permission = await Permission.create({
      name_per,
      description,
      resource,
      action,
      details: details || [],
      is_active: true
    });
    
    res.status(201).json({
      success: true,
      message: 'Tạo permission thành công',
      data: permission
    });
  } catch (error) {
    console.error('Error in createPermission:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo permission',
      error: error.message
    });
  }
};

/**
 * Cập nhật permission
 */
exports.updatePermission = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const permission = await Permission.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy permission'
      });
    }
    
    res.json({
      success: true,
      message: 'Cập nhật permission thành công',
      data: permission
    });
  } catch (error) {
    console.error('Error in updatePermission:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật permission',
      error: error.message
    });
  }
};

/**
 * Xóa permission (soft delete)
 */
exports.deletePermission = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Soft delete - chỉ set is_active = false
    const permission = await Permission.findByIdAndUpdate(
      id,
      { is_active: false },
      { new: true }
    );
    
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy permission'
      });
    }
    
    res.json({
      success: true,
      message: 'Xóa permission thành công',
      data: permission
    });
  } catch (error) {
    console.error('Error in deletePermission:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa permission',
      error: error.message
    });
  }
};

/**
 * Thêm action detail vào permission
 */
exports.addPermissionDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const { action_name, action_code, check_action, description } = req.body;
    
    // Validate
    if (!action_name || !action_code) {
      return res.status(400).json({
        success: false,
        message: 'action_name và action_code là bắt buộc'
      });
    }
    
    const permission = await Permission.findById(id);
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy permission'
      });
    }
    
    // Kiểm tra trùng action_code
    const exists = permission.details.some(
      d => d.action_code.toUpperCase() === action_code.toUpperCase()
    );
    
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Action code đã tồn tại trong permission này'
      });
    }
    
    await permission.addDetail({
      action_name,
      action_code: action_code.toUpperCase(),
      check_action: check_action !== undefined ? check_action : false,
      description
    });
    
    res.json({
      success: true,
      message: 'Thêm action detail thành công',
      data: permission
    });
  } catch (error) {
    console.error('Error in addPermissionDetail:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thêm action detail',
      error: error.message
    });
  }
};

/**
 * Gán permission cho user
 */
exports.grantPermissionToUser = async (req, res) => {
  try {
    const { userId, permissionId } = req.params;
    const { expires_at, notes } = req.body;
    const grantedBy = req.user?.id; // Người đang đăng nhập
    
    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy user'
      });
    }
    
    // Validate permission exists
    const permission = await Permission.findById(permissionId);
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy permission'
      });
    }
    
    const userPermission = await UserPermission.grantPermission(
      userId,
      permissionId,
      grantedBy,
      expires_at
    );
    
    // Update notes if provided
    if (notes) {
      userPermission.notes = notes;
      await userPermission.save();
    }
    
    await userPermission.populate('id_per', 'name_per description');
    
    res.json({
      success: true,
      message: 'Gán permission thành công',
      data: userPermission
    });
  } catch (error) {
    console.error('Error in grantPermissionToUser:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi gán permission',
      error: error.message
    });
  }
};

/**
 * Thu hồi permission của user
 */
exports.revokePermissionFromUser = async (req, res) => {
  try {
    const { userId, permissionId } = req.params;
    
    const userPermission = await UserPermission.revokePermission(userId, permissionId);
    
    if (!userPermission) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy user permission'
      });
    }
    
    res.json({
      success: true,
      message: 'Thu hồi permission thành công',
      data: userPermission
    });
  } catch (error) {
    console.error('Error in revokePermissionFromUser:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thu hồi permission',
      error: error.message
    });
  }
};

/**
 * Lấy tất cả permissions của user
 */
exports.getUserPermissions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { onlyValid } = req.query;
    
    const userPermissions = await UserPermission.getUserPermissions(
      userId,
      onlyValid !== 'false' // Mặc định là true
    );
    
    res.json({
      success: true,
      count: userPermissions.length,
      data: userPermissions
    });
  } catch (error) {
    console.error('Error in getUserPermissions:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy permissions của user',
      error: error.message
    });
  }
};

/**
 * Kiểm tra user có permission không
 */
exports.checkUserPermission = async (req, res) => {
  try {
    const { userId, permissionId } = req.params;
    
    const hasPermission = await UserPermission.hasPermission(userId, permissionId);
    
    res.json({
      success: true,
      has_permission: hasPermission,
      user_id: userId,
      permission_id: permissionId
    });
  } catch (error) {
    console.error('Error in checkUserPermission:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi kiểm tra permission',
      error: error.message
    });
  }
};

/**
 * Cleanup expired permissions
 */
exports.cleanupExpiredPermissions = async (req, res) => {
  try {
    const result = await UserPermission.cleanupExpired();
    
    res.json({
      success: true,
      message: 'Cleanup thành công',
      modified_count: result.modifiedCount
    });
  } catch (error) {
    console.error('Error in cleanupExpiredPermissions:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cleanup permissions',
      error: error.message
    });
  }
};


