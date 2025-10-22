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
    'activity_eligibility:update', 'activity_eligibility:delete'
  ],
  
  // ============================================
  // STAFF - Cán bộ (CTSV, Đoàn, Hội SV, Khoa, CLB)
  // Phân biệt qua org_unit_id trong user_role
  // ============================================
  staff: [
    // Activity - Quản lý hoạt động
    'activity:create', 'activity:read', 'activity:update', 
    'activity:approve', 'activity:reject', 'activity:export',
    
    // User - Quản lý người dùng sinh viên
    'user:create', 'user:read', 'user:update', 'user:lock', 'user:unlock',
    
    // Attendance - Quản lý điểm danh
    'attendance:scan', 'attendance:read', 'attendance:verify', 'attendance:export',
    
    // Evidence - Duyệt minh chứng
    'evidence:read', 'evidence:approve', 'evidence:reject',
    
    // Report - Báo cáo
    'report:view_overview', 'report:view_detail', 'report:export',
    
    // Class - Quản lý lớp
    'class:read', 'class:manage_students', 'class:attendance', 'class:report',
    
    // PVCD Record - Quản lý điểm rèn luyện
    'pvcd_record:create', 'pvcd_record:read', 'pvcd_record:update', 'pvcd_record:adjust',
    
    // Activity Registration - Duyệt đăng ký
    'activity_registration:read', 'activity_registration:approve', 
    'activity_registration:reject', 'activity_registration:cancel',
    
    // Student Feedback - Xem phản hồi
    'student_feedback:read',
    
    // Student Profile - Quản lý hồ sơ sinh viên
    'student_profile:create', 'student_profile:read', 'student_profile:update',
    
    // Staff Profile - Xem đồng nghiệp
    'staff_profile:read', 'staff_profile:update',
    
    // Student Cohort
    'student_cohort:create', 'student_cohort:read', 'student_cohort:delete',
    
    // Cohort, Faculty, Org Unit - Xem và cập nhật
    'cohort:read', 'cohort:update',
    'faculty:read', 'faculty:update',
    'org_unit:read', 'org_unit:update',
    'field:read',
    
    // Post - Quản lý bài đăng
    'post:create', 'post:read', 'post:update', 'post:delete',
    
    // Activity Eligibility
    'activity_eligibility:create', 'activity_eligibility:read', 
    'activity_eligibility:update', 'activity_eligibility:delete'
  ],
  
  // ============================================
  // TEACHER - Giảng viên
  // ============================================
  teacher: [
    // Activity - Tạo và quản lý hoạt động
    'activity:create', 'activity:read', 'activity:update', 'activity:approve',
    
    // User - Xem thông tin sinh viên
    'user:read',
    
    // Attendance - Điểm danh
    'attendance:scan', 'attendance:read', 'attendance:verify',
    
    // Evidence - Duyệt minh chứng
    'evidence:read', 'evidence:approve', 'evidence:reject',
    
    // Report - Xem báo cáo
    'report:view_overview', 'report:view_detail', 'report:export',
    
    // Class - Quản lý lớp
    'class:read', 'class:manage_students', 'class:attendance', 'class:report',
    
    // PVCD Record - Xem và chấm điểm
    'pvcd_record:read', 'pvcd_record:update',
    
    // Activity Registration - Duyệt đăng ký
    'activity_registration:read', 'activity_registration:approve', 
    'activity_registration:reject',
    
    // Student Feedback - Xem phản hồi
    'student_feedback:read',
    
    // Student Profile - Xem và cập nhật sinh viên
    'student_profile:read', 'student_profile:update',
    
    // Staff Profile - Xem đồng nghiệp
    'staff_profile:read',
    
    // Xem thông tin tổ chức
    'cohort:read', 'faculty:read', 'org_unit:read', 'field:read',
    
    // Post - Đọc và tạo bài đăng
    'post:read', 'post:create',
    
    // Activity Eligibility
    'activity_eligibility:read'
  ],
  
  // ============================================
  // STUDENT - Sinh viên
  // Lớp trưởng: isClassMonitor=true có thêm class:attendance và class:report
  // Sử dụng middleware checkClassMonitor() để kiểm tra 2 quyền đặc biệt này
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
    'class:read',
    // Lớp trưởng có thêm: class:attendance, class:report (cần middleware checkClassMonitor)
    'class:attendance', 'class:report',
    
    // PVCD Record - Xem điểm rèn luyện của mình
    'pvcd_record:read',
    
    // Activity Registration - Đăng ký hoạt động
    'activity_registration:create', 'activity_registration:read', 'activity_registration:cancel',
    
    // Student Feedback - Gửi phản hồi
    'student_feedback:submit', 'student_feedback:read',
    
    // Student Profile - Xem hồ sơ của mình
    'student_profile:read',
    
    // Xem thông tin tổ chức
    'cohort:read', 'faculty:read', 'field:read',
    
    // Post - Đọc bài đăng
    'post:read',
    
    // Activity Eligibility
    'activity_eligibility:read'
  ]
};


