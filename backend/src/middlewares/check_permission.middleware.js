const UserPermission = require('../models/user_permission.model');
const Permission = require('../models/permission.model');

/**
 * Middleware kiểm tra permission chi tiết
 * @param {string} permissionName - Tên permission (name_per)
 * @param {string} actionCode - Mã action cần kiểm tra (VD: 'CREATE', 'UPDATE', 'DELETE')
 * @returns {Function} Express middleware
 */
const checkPermission = (permissionName, actionCode) => {
  return async (req, res, next) => {
    try {
      // Kiểm tra user đã đăng nhập chưa (phải có auth middleware trước)
      if (!req.user || !req.user.id) {
        return res.status(401).json({ 
          success: false,
          message: 'Bạn cần đăng nhập để thực hiện hành động này' 
        });
      }

      const userId = req.user.id;
      
      // Tìm permission theo tên
      const permission = await Permission.findOne({ 
        name_per: permissionName,
        is_active: true 
      });
      
      if (!permission) {
        return res.status(404).json({ 
          success: false,
          message: `Permission "${permissionName}" không tồn tại hoặc đã bị vô hiệu hóa` 
        });
      }
      
      // Kiểm tra user có được gán permission này không
      const hasPermission = await UserPermission.hasPermission(userId, permission._id);
      
      if (!hasPermission) {
        return res.status(403).json({ 
          success: false,
          message: 'Bạn không có quyền truy cập tài nguyên này',
          required_permission: permissionName
        });
      }
      
      // Nếu có actionCode, kiểm tra action có được phép không
      if (actionCode) {
        const isActionAllowed = permission.isActionAllowed(actionCode);
        
        if (!isActionAllowed) {
          return res.status(403).json({ 
            success: false,
            message: `Bạn không có quyền thực hiện hành động "${actionCode}"`,
            required_permission: permissionName,
            required_action: actionCode
          });
        }
      }
      
      // Attach permission info vào request để sử dụng sau này
      req.permission = permission;
      req.permissionName = permissionName;
      req.actionCode = actionCode;
      
      // Cho phép tiếp tục
      next();
    } catch (error) {
      console.error('Error in checkPermission middleware:', error);
      res.status(500).json({ 
        success: false,
        message: 'Lỗi khi kiểm tra quyền truy cập' 
      });
    }
  };
};

/**
 * Middleware kiểm tra user có bất kỳ permission nào trong danh sách
 * @param {Array<{permission: string, action: string}>} permissionList
 * @returns {Function} Express middleware
 */
const checkAnyPermission = (permissionList) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ 
          success: false,
          message: 'Bạn cần đăng nhập để thực hiện hành động này' 
        });
      }

      const userId = req.user.id;
      
      // Kiểm tra từng permission trong danh sách
      for (const item of permissionList) {
        const permission = await Permission.findOne({ 
          name_per: item.permission,
          is_active: true 
        });
        
        if (!permission) continue;
        
        const hasPermission = await UserPermission.hasPermission(userId, permission._id);
        if (!hasPermission) continue;
        
        // Nếu có action code, kiểm tra action
        if (item.action) {
          const isActionAllowed = permission.isActionAllowed(item.action);
          if (isActionAllowed) {
            req.permission = permission;
            return next(); // Tìm thấy permission hợp lệ
          }
        } else {
          req.permission = permission;
          return next(); // Tìm thấy permission hợp lệ
        }
      }
      
      // Không tìm thấy permission nào hợp lệ
      return res.status(403).json({ 
        success: false,
        message: 'Bạn không có quyền truy cập tài nguyên này',
        required_permissions: permissionList
      });
    } catch (error) {
      console.error('Error in checkAnyPermission middleware:', error);
      res.status(500).json({ 
        success: false,
        message: 'Lỗi khi kiểm tra quyền truy cập' 
      });
    }
  };
};

/**
 * Middleware kiểm tra user có tất cả permissions trong danh sách
 * @param {Array<{permission: string, action: string}>} permissionList
 * @returns {Function} Express middleware
 */
const checkAllPermissions = (permissionList) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ 
          success: false,
          message: 'Bạn cần đăng nhập để thực hiện hành động này' 
        });
      }

      const userId = req.user.id;
      const grantedPermissions = [];
      
      // Kiểm tra tất cả permissions
      for (const item of permissionList) {
        const permission = await Permission.findOne({ 
          name_per: item.permission,
          is_active: true 
        });
        
        if (!permission) {
          return res.status(403).json({ 
            success: false,
            message: `Permission "${item.permission}" không tồn tại`,
            required_permissions: permissionList
          });
        }
        
        const hasPermission = await UserPermission.hasPermission(userId, permission._id);
        if (!hasPermission) {
          return res.status(403).json({ 
            success: false,
            message: `Bạn không có quyền "${item.permission}"`,
            required_permissions: permissionList
          });
        }
        
        // Kiểm tra action nếu có
        if (item.action) {
          const isActionAllowed = permission.isActionAllowed(item.action);
          if (!isActionAllowed) {
            return res.status(403).json({ 
              success: false,
              message: `Bạn không có quyền thực hiện action "${item.action}" trong "${item.permission}"`,
              required_permissions: permissionList
            });
          }
        }
        
        grantedPermissions.push(permission);
      }
      
      // Tất cả permissions đều hợp lệ
      req.permissions = grantedPermissions;
      next();
    } catch (error) {
      console.error('Error in checkAllPermissions middleware:', error);
      res.status(500).json({ 
        success: false,
        message: 'Lỗi khi kiểm tra quyền truy cập' 
      });
    }
  };
};

/**
 * Middleware kiểm tra user có permission dựa trên role (compatibility với hệ thống cũ)
 * @param {string} resource
 * @param {string} action
 * @returns {Function} Express middleware
 */
const checkPermissionByResourceAction = (resource, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ 
          success: false,
          message: 'Bạn cần đăng nhập để thực hiện hành động này' 
        });
      }

      const userId = req.user.id;
      
      // Tìm permission theo resource và action (hệ thống cũ)
      const permission = await Permission.findOne({ 
        resource,
        action,
        is_active: true 
      });
      
      if (!permission) {
        return res.status(404).json({ 
          success: false,
          message: `Permission "${resource}:${action}" không tồn tại` 
        });
      }
      
      const hasPermission = await UserPermission.hasPermission(userId, permission._id);
      
      if (!hasPermission) {
        return res.status(403).json({ 
          success: false,
          message: 'Bạn không có quyền truy cập tài nguyên này',
          required_permission: `${resource}:${action}`
        });
      }
      
      req.permission = permission;
      next();
    } catch (error) {
      console.error('Error in checkPermissionByResourceAction middleware:', error);
      res.status(500).json({ 
        success: false,
        message: 'Lỗi khi kiểm tra quyền truy cập' 
      });
    }
  };
};

module.exports = {
  checkPermission,
  checkAnyPermission,
  checkAllPermissions,
  checkPermissionByResourceAction
};


