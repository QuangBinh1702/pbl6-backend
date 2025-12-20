// Cấu hình quyền theo role cho Đại học Bách khoa Đà Nẵng
// Mỗi role có danh sách "resource:action" tương ứng với permissions trong database
module.exports = {
  // ============================================
  // ADMIN - Quản trị viên hệ thống (Full Access)
  // ============================================
  admin: [
    // Activity - Quản lý hoạt động
    'activity:create', 'activity:read', 'activity:update', 'activity:delete', 
    'activity:approve', 'activity:reject', 'activity:complete', 'activity:export',
    
    // User - Quản lý người dùng
    'user:create', 'user:read', 'user:update', 'user:delete', 
    'user:lock', 'user:unlock',
    
    // Attendance - Quản lý điểm danh
    'attendance:scan', 'attendance:read', 'attendance:verify', 'attendance:export',
    
    // Evidence - Quản lý minh chứng
    'evidence:submit', 'evidence:read', 'evidence:approve', 
    'evidence:reject', 'evidence:delete',
    
    // Report - Báo cáo thống kê
    'report:view_overview', 'report:view_detail', 'report:export',
    
    // Class - Quản lý lớp học
    'class:create', 'class:read', 'class:update', 'class:delete', 'class:manage_students',
    'class:attendance', 'class:report',
    
    // PVCD Record - Quản lý điểm rèn luyện
    'pvcd_record:create', 'pvcd_record:read', 'pvcd_record:update', 
    'pvcd_record:delete', 'pvcd_record:adjust',
    
    // Role & Permission - Quản lý phân quyền
    'role:create', 'role:read', 'role:update', 'role:delete',
    'permission:create', 'permission:read', 'permission:update', 'permission:delete',
    
    // Activity Registration - Đăng ký hoạt động
    'activity_registration:create', 'activity_registration:read', 
    'activity_registration:approve', 'activity_registration:reject', 'activity_registration:cancel',
    
    // Student Feedback - Phản hồi sinh viên
    'student_feedback:submit', 'student_feedback:read', 'student_feedback:delete',
    
    // Student Profile - Hồ sơ sinh viên
    'student_profile:create', 'student_profile:read', 
    'student_profile:update', 'student_profile:delete',
    
    // Staff Profile - Hồ sơ cán bộ
    'staff_profile:create', 'staff_profile:read', 
    'staff_profile:update', 'staff_profile:delete',
    
    // Student Cohort - Sinh viên theo khóa
    'student_cohort:create', 'student_cohort:read', 'student_cohort:delete',
    
    // Cohort - Khóa học
    'cohort:create', 'cohort:read', 'cohort:update', 'cohort:delete',
    
    // Faculty - Khoa
    'faculty:create', 'faculty:read', 'faculty:update', 'faculty:delete',
    
    // Org Unit - Đơn vị tổ chức
    'org_unit:create', 'org_unit:read', 'org_unit:update', 'org_unit:delete',
    
    // Field - Lĩnh vực
    'field:create', 'field:read', 'field:update', 'field:delete',
    
    // Post - Bài đăng
    'post:create', 'post:read', 'post:update', 'post:delete',
    
    // Activity Eligibility - Điều kiện tham gia
    'activity_eligibility:create', 'activity_eligibility:read', 
    'activity_eligibility:update', 'activity_eligibility:delete',
    
    // Notification - Quản lý thông báo
    'notification:create', 'notification:read', 'notification:update', 'notification:delete'
  ],
  
  // ============================================
  // STAFF - Cán bộ/giảng viên/sinh viên tham gia tổ chức
  // Phân biệt qua org_unit_id trong user_role
  // 
  // ⚠️ QUAN TRỌNG: Đây là BASIC permissions (tự động có khi có staff role)
  // ⚠️ OPTIONAL permissions (admin grant thủ công) → xem backend/src/staff_permissions.config.js
  // 
  // PHÂN LOẠI TỔ CHỨC:
  // - Phòng CTSV: Duyệt hoạt động, quản lý PVCD, xem thống kê (grant thêm optional)
  // - Đoàn trường: Duyệt hoạt động, quản lý PVCD, xem thống kê (grant thêm optional)
  // - Khoa: Duyệt minh chứng, quản lý lớp và sinh viên (grant thêm optional)
  // - CLB, Hội SV, Liên chi đoàn: Đề xuất hoạt động, quản lý đăng ký (basic only)
  // ============================================
  staff: [
    // Activity - BASIC: Quản lý hoạt động cơ bản
    'activity:create', 'activity:read', 'activity:update', 
    // OPTIONAL (admin grant): 'activity:approve', 'activity:reject', 'activity:export',
    
    // User - BASIC: Chỉ xem
    'user:read', 
    // OPTIONAL (admin grant): 'user:update',
    // ADMIN-ONLY: 'user:create', 'user:delete', 'user:lock', 'user:unlock',
    
    // Attendance - BASIC: Điểm danh
    'attendance:scan', 'attendance:read', 'attendance:verify', 'attendance:export',
    
    // Evidence - OPTIONAL (admin grant cho Khoa/CLB):
    // 'evidence:read', 'evidence:approve', 'evidence:reject',
    
    // Report - OPTIONAL (admin grant cho Phòng CTSV/Đoàn trường):
    // 'report:view_overview', 'report:view_detail', 'report:export',
    
    // Class - OPTIONAL (admin grant cho Khoa):
    // 'class:read', 'class:manage_students', 'class:attendance', 'class:report',
    
    // PVCD Record - Quản lý điểm rèn luyện
    'pvcd_record:create', 'pvcd_record:read', 'pvcd_record:update', 'pvcd_record:adjust',
    
    // Activity Registration - Duyệt đăng ký
    'activity_registration:read', 'activity_registration:approve', 
    'activity_registration:reject', 'activity_registration:cancel',
    
    // Student Feedback - Xem phản hồi
    'student_feedback:read',
    
    // Student Profile - OPTIONAL (admin grant cho Khoa/Phòng CTSV):
    // 'student_profile:read', 'student_profile:update',
    // ADMIN-ONLY: 'student_profile:create', 'student_profile:delete',
    
    // Staff Profile - OPTIONAL (admin grant):
    // 'staff_profile:read', 'staff_profile:update',
    // ADMIN-ONLY: 'staff_profile:create', 'staff_profile:delete',
    
    // Student Cohort - ADMIN-ONLY:
    // 'student_cohort:create', 'student_cohort:read', 'student_cohort:delete',
    
    // Cohort, Faculty, Org Unit, Field - OPTIONAL (admin grant):
    // 'cohort:read', 'faculty:read', 'org_unit:read', 'field:read',
    // ADMIN-ONLY: create/update/delete
    
    // Post - Quản lý bài đăng
    'post:create', 'post:read', 'post:update', 'post:delete',
    
    // Activity Eligibility
    'activity_eligibility:create', 'activity_eligibility:read', 
    'activity_eligibility:update', 'activity_eligibility:delete',
    
    // Notification - Quản lý thông báo
    'notification:create', 'notification:read', 'notification:update', 'notification:delete'
  ],
  
  // ============================================
  // TEACHER - Giảng viên
  // ============================================
  // teacher: [
  //   // Activity - Tạo và quản lý hoạt động
  //   'activity:create', 'activity:read', 'activity:update', 'activity:approve',
    
  //   // User - Xem thông tin sinh viên
  //   'user:read',
    
  //   // Attendance - Điểm danh
  //   'attendance:scan', 'attendance:read', 'attendance:verify',
    
  //   // Evidence - Duyệt minh chứng
  //   'evidence:read', 'evidence:approve', 'evidence:reject',
    
  //   // Report - Xem báo cáo
  //   'report:view_overview', 'report:view_detail', 'report:export',
    
  //   // Class - Quản lý lớp
  //   'class:read', 'class:manage_students', 'class:attendance', 'class:report',
    
  //   // PVCD Record - Xem và chấm điểm
  //   'pvcd_record:read', 'pvcd_record:update',
    
  //   // Activity Registration - Duyệt đăng ký
  //   'activity_registration:read', 'activity_registration:approve', 
  //   'activity_registration:reject',
    
  //   // Student Feedback - Xem phản hồi
  //   'student_feedback:read',
    
  //   // Student Profile - Xem và cập nhật sinh viên
  //   'student_profile:read', 'student_profile:update',
    
  //   // Staff Profile - Xem đồng nghiệp
  //   'staff_profile:read',
    
  //   // Xem thông tin tổ chức
  //   'cohort:read', 'faculty:read', 'org_unit:read', 'field:read',
    
  //   // Post - Đọc và tạo bài đăng
  //   'post:read', 'post:create',
    
  //   // Activity Eligibility
  //   'activity_eligibility:read'
  // ],
  
  // ============================================
  // STUDENT - Sinh viên
  // Lớp trưởng (isClassMonitor=true) có thêm:
  // - class:attendance, class:report (dùng middleware checkClassMonitor())
  // - evidence:approve, evidence:reject (dùng middleware checkPermissionOrClassMonitor())
  //   → Xác nhận minh chứng hoạt động ngoài trường của sinh viên trong lớp
  // ============================================
  student: [
    // Activity - Xem hoạt động
    'activity:read',
    
    // Attendance - Xem điểm danh của mình
    'attendance:read',
    
    // Evidence - Nộp minh chứng
    'evidence:submit', 'evidence:read',
    
    // Report - Xem điểm của mình
    'report:view_overview',
    
    // Class - Xem lớp
    // 'class:read',
    // Lớp trưởng có thêm: class:attendance, class:report (cần middleware checkClassMonitor)
    
    // PVCD Record - Xem điểm rèn luyện của mình
    'pvcd_record:read',
    
    // Activity Registration - Đăng ký hoạt động
    'activity_registration:create', 'activity_registration:read', 'activity_registration:cancel',
    
    // Student Feedback - Gửi đánh giá hoạt động đã tham gia, phản hồi điểm PVCD
    'student_feedback:submit', 'student_feedback:read',
    
    // Student Profile - Xem hồ sơ của mình
    'student_profile:read', 'student_profile:update',
    
    // Xem thông tin tổ chức
    // 'cohort:read',
    // 'faculty:read', 
    'field:read',
    
    // Post - Đọc bài đăng
    'post:read',
    
    // Activity Eligibility
    'activity_eligibility:read'
  ]
};


