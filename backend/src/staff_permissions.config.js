/**
 * STAFF PERMISSIONS CONFIGURATION
 * Phân loại permissions cho staff role thành 2 loại:
 * 
 * 1. BASIC: Tự động có khi user được cấp staff role (seed vào role_action)
 * 2. OPTIONAL: Admin phải grant thủ công cho từng staff (qua user_action_override)
 */

module.exports = {
  /**
   * BASIC PERMISSIONS
   * Tự động có khi có staff role - được seed vào role_action table
   */
  basic: [
    // Activity - Quản lý hoạt động cơ bản
    // 'activity:create',
    'activity:read',
    'activity:update',
    'activity:suggest',
    // User - Chỉ xem
    'user:read',
    
    // Attendance - Điểm danh
    'attendance:scan',
    'attendance:read',
    'attendance:verify',
    'attendance:export',
    
    // PVCD Record - Điểm rèn luyện
    'pvcd_record:create',
    'pvcd_record:read',
    'pvcd_record:update',
    'pvcd_record:adjust',
    
    // Activity Registration - Đăng ký hoạt động
    'activity_registration:read',
    'activity_registration:approve',
    'activity_registration:reject',
    'activity_registration:cancel',
    
    // Student Feedback
    'student_feedback:read',
    
    // Post - Bài đăng
    'post:create',
    'post:read',
    'post:update',
    'post:delete',
    
    // Activity Eligibility
    'activity_eligibility:create',
    'activity_eligibility:read',
    'activity_eligibility:update',
    'activity_eligibility:delete',
    
    // Notification
    'notification:create',
    'notification:read',
    'notification:update',
    'notification:delete'
  ],

  /**
   * OPTIONAL PERMISSIONS
   * Admin có thể grant thêm cho staff cụ thể (không seed vào role_action)
   * Chỉ có khi admin grant qua user_action_override
   */
  optional: [
    // Duyệt hoạt động (Phòng CTSV, Đoàn trường)
     'activity:create',
    'activity:approve',
    'activity:reject',
    'activity:export',
    
    // Quản lý User (Staff cấp cao)
    'user:update',
    
    // Duyệt minh chứng (Khoa, CLB)
    'evidence:read',
    'evidence:approve',
    'evidence:reject',
    
    // Báo cáo (Phòng CTSV, Đoàn trường)
    'report:view_overview',
    'report:view_detail',
    'report:export',
    
    // Quản lý lớp (Khoa)
    'class:read',
    'class:manage_students',
    'class:attendance',
    'class:report',
    
    // Quản lý hồ sơ sinh viên (Khoa, Phòng CTSV)
    'student_profile:read',
    'student_profile:update',
    
    // Quản lý hồ sơ cán bộ
    'staff_profile:read',
    'staff_profile:update',
    
    // Xem thông tin tổ chức
    'cohort:read',
    'faculty:read',
    'org_unit:read',
    'field:read'
  ]
};

