// Middleware kiểm tra quyền truy cập động và phạm vi dữ liệu (scope)
// roles: mảng các vai trò được phép truy cập
// scopeCheck: hàm async kiểm tra phạm vi dữ liệu, trả về true/false
module.exports = (roles, scopeCheck) => async (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden: insufficient role' });
  }
  if (scopeCheck) {
    const ok = await scopeCheck(req);
    if (!ok) return res.status(403).json({ message: 'Forbidden: insufficient scope' });
  }
  next();
};
