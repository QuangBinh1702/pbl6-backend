// Cấu hình quyền theo role: mỗi role có danh sách "resource:action"
module.exports = {
  admin: [
    'activity:create',
    'activity:update',
    'activity:delete',
    'activity:approve',
    'activity:register',
    'attendance:scan',
  ],
  ctsv: ['activity:create', 'activity:update', 'activity:delete', 'activity:approve', 'attendance:scan'],
  doantruong: ['activity:create', 'activity:update', 'activity:approve', 'attendance:scan'],
  khoa: ['activity:create', 'activity:update', 'attendance:scan'],
  clb: ['activity:create', 'activity:update'],
  loptruong: ['attendance:scan'],
  student: ['activity:register']
};


