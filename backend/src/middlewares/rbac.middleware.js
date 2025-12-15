// RBAC (Role-Based Access Control) Middleware
// Middleware kiểm tra quyền truy cập dựa trên role của user

/**
 * Middleware authorize - kiểm tra user có role được yêu cầu không
 * @param {string|string[]} roles - Role hoặc mảng các role được phép
 * @returns {Function} Express middleware function
 */
const authorize = (roles) => {
  // Chuyển đổi role đơn lẻ thành mảng để xử lý thống nhất
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    // Kiểm tra user đã được authenticate chưa (từ auth.middleware)
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized: User not authenticated' 
      });
    }

    // Kiểm tra role của user có trong danh sách role được phép không
    const userRole = req.user.role;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        success: false, 
        message: `Forbidden: Requires one of these roles: ${allowedRoles.join(', ')}` 
      });
    }

    // User có quyền truy cập, tiếp tục
    next();
  };
};

module.exports = {
  authorize
};


