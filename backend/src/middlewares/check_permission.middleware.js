const { 
  hasPermission, 
  getUserActions, 
  isClassMonitor: checkIsClassMonitor,
  hasAnyPermission: checkHasAnyPermission,
  hasAllPermissions: checkHasAllPermissions
} = require('../utils/permission.util');

/**
 * Middleware kiểm tra permission theo resource và action
 * Sử dụng hệ thống phân quyền mới: user_role → role_action + user_action_override
 * 
 * @param {string} resource - Resource name (e.g., 'activity', 'student')
 * @param {string} actionCode - Action code (e.g., 'VIEW', 'CREATE', 'UPDATE', 'DELETE')
 * @returns {Function} Express middleware
 */
const checkPermission = (resource, actionCode) => {
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
      const orgUnitId = req.body.org_unit_id || req.query.org_unit_id || null;
      
      // Kiểm tra permission sử dụng utility function
      const allowed = await hasPermission(userId, resource, actionCode, orgUnitId);
      
      if (!allowed) {
        return res.status(403).json({ 
          success: false,
          message: `Bạn không có quyền thực hiện hành động "${actionCode}" trên "${resource}"`,
          required_permission: `${resource}:${actionCode}`
        });
      }
      
      // Attach permission info vào request để sử dụng sau này
      req.resource = resource;
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
 * @param {Array<{resource: string, action: string}>} permissionList
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
      const orgUnitId = req.body.org_unit_id || req.query.org_unit_id || null;
      
      // Sử dụng utility function để kiểm tra
      const allowed = await checkHasAnyPermission(userId, permissionList, orgUnitId);
      
      if (!allowed) {
        return res.status(403).json({ 
          success: false,
          message: 'Bạn không có quyền truy cập tài nguyên này',
          required_permissions: permissionList
        });
      }
      
      next();
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
 * @param {Array<{resource: string, action: string}>} permissionList
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
      const orgUnitId = req.body.org_unit_id || req.query.org_unit_id || null;
      
      // Sử dụng utility function để kiểm tra
      const allowed = await checkHasAllPermissions(userId, permissionList, orgUnitId);
      
      if (!allowed) {
        return res.status(403).json({ 
          success: false,
          message: 'Bạn không có đầy đủ quyền để thực hiện hành động này',
          required_permissions: permissionList
        });
      }
      
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
 * Middleware kiểm tra xem user có phải là lớp trưởng không
 * Lớp trưởng KHÔNG phải là một role, chỉ là field boolean trong student_profile
 * 
 * @returns {Function} Express middleware
 */
const checkClassMonitor = () => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ 
          success: false,
          message: 'Bạn cần đăng nhập để thực hiện hành động này' 
        });
      }

      const userId = req.user.id;
      
      // Kiểm tra xem user có phải là lớp trưởng không
      const isMonitor = await checkIsClassMonitor(userId);
      
      if (!isMonitor) {
        return res.status(403).json({ 
          success: false,
          message: 'Chỉ lớp trưởng mới có quyền thực hiện hành động này'
        });
      }
      
      // Attach info vào request
      req.isClassMonitor = true;
      
      next();
    } catch (error) {
      console.error('Error in checkClassMonitor middleware:', error);
      res.status(500).json({ 
        success: false,
        message: 'Lỗi khi kiểm tra quyền lớp trưởng' 
      });
    }
  };
};

/**
 * Middleware lấy danh sách actions mà user có thể thực hiện trên resource
 * Hữu ích cho việc hiển thị UI động dựa trên quyền
 * 
 * @param {string} resource - Resource name
 * @returns {Function} Express middleware
 */
const attachUserActions = (resource) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        req.userActions = [];
        return next();
      }

      const userId = req.user.id;
      const orgUnitId = req.body.org_unit_id || req.query.org_unit_id || null;
      
      const actions = await getUserActions(userId, resource, orgUnitId);
      req.userActions = actions;
      
      next();
    } catch (error) {
      console.error('Error in attachUserActions middleware:', error);
      req.userActions = [];
      next();
    }
  };
};

module.exports = {
  checkPermission,
  checkAnyPermission,
  checkAllPermissions,
  checkClassMonitor,
  attachUserActions
};


