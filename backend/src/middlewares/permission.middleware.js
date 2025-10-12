// Middleware kiểm tra permission dựa vào role của user
// permission: chuỗi dạng "resource:action" ví dụ "activity:create"
module.exports = (permission) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const userRole = req.user.role;
  const config = require('../permissions.config');
  const allowed = (config[userRole] || []).includes(permission);
  if (!allowed) return res.status(403).json({ message: 'Forbidden: insufficient permission' });
  next();
};


