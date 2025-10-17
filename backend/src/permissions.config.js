// Cấu hình quyền theo role cho Đại học Bách khoa Đà Nẵng
// Mỗi role có danh sách "resource:action" tương ứng với permissions trong database
module.exports = {
  admin: [
    // Tất cả quyền - Admin có toàn quyền
    'activity:create', 'activity:read', 'activity:update', 'activity:delete', 'activity:approve',
    'user:create', 'user:read', 'user:update', 'user:delete', 'user:lock',
    'attendance:scan', 'attendance:view', 'attendance:verify', 'attendance:export',
    'evidence:submit', 'evidence:view', 'evidence:approve', 'evidence:reject',
    'report:view_overview', 'report:view_detail', 'report:export',
    'class:view', 'class:manage_students', 'class:attendance', 'class:report',
    'point:award', 'point:view', 'point:adjust', 'point:export',
    'notification:create', 'notification:send', 'notification:view', 'notification:delete'
  ],
  
  ctsv: [
    // Công tác sinh viên - Quản lý toàn diện sinh viên
    'activity:create', 'activity:read', 'activity:update', 'activity:approve',
    'user:create', 'user:read', 'user:update', 'user:lock',
    'attendance:scan', 'attendance:view', 'attendance:verify', 'attendance:export',
    'report:view_overview', 'report:view_detail', 'report:export',
    'class:view', 'class:manage_students', 'class:attendance', 'class:report',
    'point:award', 'point:view', 'point:adjust', 'point:export'
  ],
  
  doantruong: [
    // Đoàn trường - Tổ chức hoạt động và thông báo
    'activity:create', 'activity:read', 'activity:update', 'activity:approve',
    'attendance:scan', 'attendance:view', 'attendance:verify', 'attendance:export',
    'report:view_overview', 'report:view_detail', 'report:export',
    'notification:create', 'notification:send', 'notification:view', 'notification:delete'
  ],
  
  hoisv: [
    // Hội sinh viên - Tổ chức hoạt động cho sinh viên
    'activity:create', 'activity:read', 'activity:update',
    'attendance:scan', 'attendance:view', 'attendance:verify',
    'notification:create', 'notification:send', 'notification:view'
  ],
  
  khoa: [
    // Khoa - Quản lý sinh viên trong khoa
    'activity:create', 'activity:read', 'activity:update',
    'attendance:scan', 'attendance:view', 'attendance:verify', 'attendance:export',
    'report:view_overview', 'report:view_detail', 'report:export',
    'class:view', 'class:manage_students', 'class:attendance', 'class:report'
  ],
  
  clb: [
    // Câu lạc bộ - Tổ chức hoạt động chuyên môn
    'activity:create', 'activity:read', 'activity:update',
    'attendance:scan', 'attendance:view', 'attendance:verify'
  ],
  
  loptruong: [
    // Lớp trưởng - Quản lý lớp và điểm danh
    'evidence:submit', 'evidence:view',
    'report:view_overview', 'report:view_detail',
    'class:view', 'class:attendance', 'class:report'
  ],
  
  student: [
    // Sinh viên - Tham gia hoạt động và nộp minh chứng
    'evidence:submit', 'evidence:view',
    'report:view_overview', 'report:view_detail'
  ]
};


