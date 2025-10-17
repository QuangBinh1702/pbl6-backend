/**
 * SEED TOÀN BỘ DATABASE
 * Chuyển đổi từ SQL (pbl6.sql) sang MongoDB
 * 
 * CHẠY: node SEED_ALL.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

console.log('\n' + '='.repeat(70));
console.log('🚀 SEED TOÀN BỘ DATABASE - SQL → MongoDB');
console.log('='.repeat(70) + '\n');

// Kết nối MongoDB
async function connectDB() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const dbName = process.env.MONGODB_NAME || 'pbl6';
  
  let connectionString;
  if (mongoUri.includes('mongodb+srv://') || mongoUri.includes('mongodb://')) {
    // For MongoDB Atlas or full connection strings, use dbName as option
    connectionString = mongoUri;
    await mongoose.connect(connectionString, { dbName });
  } else {
    // For local MongoDB, append dbName to URI
    connectionString = `${mongoUri}/${dbName}`;
    await mongoose.connect(connectionString);
  }
  
  console.log(`✅ Kết nối MongoDB thành công! Database: ${mongoose.connection.name}\n`);
}

// Định nghĩa inline schemas (tránh conflict)
function defineSchemas() {
  // 1. Permission System
  const permissionDetailSchema = new mongoose.Schema({
    action_name: String,
    action_code: { type: String, uppercase: true },
    check_action: { type: Boolean, default: false },
    description: String
  });

  const permissionSchema = new mongoose.Schema({
    name_per: { type: String, unique: true, required: true },
    description: String,
    resource: String,
    action: String,
    details: [permissionDetailSchema],
    is_active: { type: Boolean, default: true }
  }, { timestamps: true, collection: 'permissions' });

  const userPermissionSchema = new mongoose.Schema({
    id_user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    id_per: { type: mongoose.Schema.Types.ObjectId, ref: 'Permission' },
    licensed: { type: Boolean, default: true },
    granted_at: { type: Date, default: Date.now },
    granted_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    expires_at: Date,
    notes: String
  }, { timestamps: true, collection: 'user_permissions' });

  // 2. User System
  const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    name: String,
    email: { type: String, unique: true, sparse: true },
    role: { 
      type: String, 
      enum: ['admin', 'ctsv', 'doantruong', 'hoisv', 'khoa', 'clb', 'student', 'loptruong'],
      default: 'student'
    },
    phone: String,
    active: { type: Boolean, default: true },
    isLocked: { type: Boolean, default: false }
  }, { timestamps: true, collection: 'users' });

  // 3. Student Profile
  const studentProfileSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    student_number: { type: String, unique: true, required: true },
    full_name: String,
    date_of_birth: Date,
    gender: String,
    email: String,
    phone: String,
    enrollment_year: Number,
    class_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    contact_address: String,
    isClassMonitor: { type: Boolean, default: false }
  }, { timestamps: true, collection: 'student_profiles' });

  // 4. Staff Profile
  const staffProfileSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    staff_number: { type: String, unique: true, required: true },
    full_name: String,
    date_of_birth: Date,
    gender: String,
    email: String,
    phone: String,
    org_unit_id: { type: mongoose.Schema.Types.ObjectId, ref: 'OrgUnit' },
    contact_address: String
  }, { timestamps: true, collection: 'staff_profiles' });

  // 5. Org Unit
  const orgUnitSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, required: true },
    leader_id: { type: mongoose.Schema.Types.ObjectId, ref: 'StaffProfile' }
  }, { timestamps: true, collection: 'org_units' });

  // 6. Activity
  const activitySchema = new mongoose.Schema({
    org_unit_id: { type: mongoose.Schema.Types.ObjectId, ref: 'OrgUnit' },
    field_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Field' },
    title: { type: String, required: true },
    description: String,
    location: String,
    start_time: Date,
    end_time: Date,
    start_time_updated: Date,
    end_time_updated: Date,
    capacity: Number,
    qr_code: String,
    registration_open: Date,
    registration_close: Date,
    requires_approval: { type: Boolean, default: true }
  }, { timestamps: true, collection: 'activities' });

  // 7. Activity Registration
  const registrationSchema = new mongoose.Schema({
    activity_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity', required: true },
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    registered_at: { type: Date, default: Date.now }
  }, { timestamps: true, collection: 'activity_registrations' });

  // 8. Attendance
  const attendanceSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true },
    activity_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity', required: true },
    scanned_at: { type: Date, default: Date.now },
    status: { type: String, default: 'present' },
    verified: { type: Boolean, default: false },
    verified_at: Date,
    points: Number,
    feedback: String,
    feedback_time: Date
  }, { timestamps: true, collection: 'attendances' });

  // 9. Evidence
  const evidenceSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true },
    title: String,
    file_url: String,
    submitted_at: { type: Date, default: Date.now },
    status: { type: String, default: 'pending' },
    verified_at: Date,
    points: Number
  }, { timestamps: true, collection: 'evidences' });

  // 10. Field
  const fieldSchema = new mongoose.Schema({
    name: String
  }, { timestamps: true, collection: 'fields' });

  // 11. Class
  const classSchema = new mongoose.Schema({
    name: String,
    falcuty_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Falcuty' },
    cohort_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Cohort' }
  }, { timestamps: true, collection: 'classes' });

  // 12. Falcuty
  const falcutySchema = new mongoose.Schema({
    name: String
  }, { timestamps: true, collection: 'falcuties' });

  // 13. Cohort
  const cohortSchema = new mongoose.Schema({
    year: Number
  }, { timestamps: true, collection: 'cohorts' });

  // 14. Student Cohort
  const studentCohortSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true },
    cohort_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Cohort', required: true },
    type: { type: String, enum: ['official', 'actual'], default: 'official' }
  }, { timestamps: true, collection: 'student_cohorts' });

  // 15. PVCD Record
  const pvcdRecordSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true },
    year: { type: Number, required: true },
    total_point: { type: Number, default: 0 }
  }, { timestamps: true, collection: 'pvcd_records' });

  // 16. Post
  const postSchema = new mongoose.Schema({
    activity_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
    description: String,
    created_at: { type: Date, default: Date.now }
  }, { timestamps: true, collection: 'posts' });

  // 17. Activity Eligibility
  const activityEligibilitySchema = new mongoose.Schema({
    activity_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
    type: { type: String, enum: ['falcuty', 'cohort'] },
    reference_id: mongoose.Schema.Types.ObjectId
  }, { timestamps: true, collection: 'activity_eligibilities' });

  // Return models
  return {
    Permission: mongoose.models.Permission || mongoose.model('Permission', permissionSchema),
    UserPermission: mongoose.models.UserPermission || mongoose.model('UserPermission', userPermissionSchema),
    User: mongoose.models.User || mongoose.model('User', userSchema),
    StudentProfile: mongoose.models.StudentProfile || mongoose.model('StudentProfile', studentProfileSchema),
    StaffProfile: mongoose.models.StaffProfile || mongoose.model('StaffProfile', staffProfileSchema),
    OrgUnit: mongoose.models.OrgUnit || mongoose.model('OrgUnit', orgUnitSchema),
    Activity: mongoose.models.Activity || mongoose.model('Activity', activitySchema),
    Registration: mongoose.models.Registration || mongoose.model('Registration', registrationSchema),
    Attendance: mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema),
    Evidence: mongoose.models.Evidence || mongoose.model('Evidence', evidenceSchema),
    Field: mongoose.models.Field || mongoose.model('Field', fieldSchema),
    Class: mongoose.models.Class || mongoose.model('Class', classSchema),
    Falcuty: mongoose.models.Falcuty || mongoose.model('Falcuty', falcutySchema),
    Cohort: mongoose.models.Cohort || mongoose.model('Cohort', cohortSchema),
    StudentCohort: mongoose.models.StudentCohort || mongoose.model('StudentCohort', studentCohortSchema),
    PVCDRecord: mongoose.models.PVCDRecord || mongoose.model('PVCDRecord', pvcdRecordSchema),
    Post: mongoose.models.Post || mongoose.model('Post', postSchema),
    ActivityEligibility: mongoose.models.ActivityEligibility || mongoose.model('ActivityEligibility', activityEligibilitySchema)
  };
}

// SEED DATA
async function seedAll() {
  const models = defineSchemas();
  
  try {
    // 1. Xóa dữ liệu cũ
    console.log('🗑️  Xóa dữ liệu cũ...');
    await Promise.all([
      models.Permission.deleteMany({}),
      models.UserPermission.deleteMany({}),
      models.User.deleteMany({}),
      models.StudentProfile.deleteMany({}),
      models.StaffProfile.deleteMany({}),
      models.OrgUnit.deleteMany({}),
      models.Activity.deleteMany({}),
      models.Field.deleteMany({}),
      models.Class.deleteMany({}),
      models.Falcuty.deleteMany({}),
      models.Cohort.deleteMany({})
    ]);
    console.log('✅ Đã xóa\n');

    // 2. Tạo Permissions (8) - Dành cho Đại học Bách khoa Đà Nẵng
    console.log('📝 Tạo Permissions...');
    const permissions = await models.Permission.insertMany([
      {
        name_per: 'ACTIVITY_MANAGEMENT',
        description: 'Quản lý hoạt động ngoại khóa',
        resource: 'activity',
        action: 'manage',
        details: [
          { action_name: 'Tạo hoạt động', action_code: 'CREATE', check_action: true },
          { action_name: 'Xem danh sách', action_code: 'READ', check_action: true },
          { action_name: 'Chỉnh sửa', action_code: 'UPDATE', check_action: true },
          { action_name: 'Xóa hoạt động', action_code: 'DELETE', check_action: false },
          { action_name: 'Duyệt đăng ký', action_code: 'APPROVE', check_action: true }
        ]
      },
      {
        name_per: 'USER_MANAGEMENT',
        description: 'Quản lý tài khoản người dùng',
        resource: 'user',
        action: 'manage',
        details: [
          { action_name: 'Tạo tài khoản', action_code: 'CREATE', check_action: true },
          { action_name: 'Xem thông tin', action_code: 'READ', check_action: true },
          { action_name: 'Cập nhật thông tin', action_code: 'UPDATE', check_action: true },
          { action_name: 'Xóa tài khoản', action_code: 'DELETE', check_action: false },
          { action_name: 'Khóa/Mở khóa', action_code: 'LOCK', check_action: true }
        ]
      },
      {
        name_per: 'ATTENDANCE_MANAGEMENT',
        description: 'Quản lý điểm danh và tham gia',
        resource: 'attendance',
        action: 'manage',
        details: [
          { action_name: 'Quét mã QR', action_code: 'SCAN', check_action: true },
          { action_name: 'Xem danh sách', action_code: 'VIEW', check_action: true },
          { action_name: 'Xác nhận tham gia', action_code: 'VERIFY', check_action: true },
          { action_name: 'Xuất báo cáo', action_code: 'EXPORT', check_action: true }
        ]
      },
      {
        name_per: 'EVIDENCE_MANAGEMENT',
        description: 'Quản lý minh chứng và tài liệu',
        resource: 'evidence',
        action: 'manage',
        details: [
          { action_name: 'Nộp minh chứng', action_code: 'SUBMIT', check_action: true },
          { action_name: 'Xem danh sách', action_code: 'VIEW', check_action: true },
          { action_name: 'Duyệt minh chứng', action_code: 'APPROVE', check_action: true },
          { action_name: 'Từ chối', action_code: 'REJECT', check_action: true }
        ]
      },
      {
        name_per: 'REPORT_VIEW',
        description: 'Xem báo cáo và thống kê',
        resource: 'report',
        action: 'view',
        details: [
          { action_name: 'Báo cáo tổng quan', action_code: 'VIEW_OVERVIEW', check_action: true },
          { action_name: 'Báo cáo chi tiết', action_code: 'VIEW_DETAIL', check_action: true },
          { action_name: 'Xuất báo cáo', action_code: 'EXPORT', check_action: true }
        ]
      },
      {
        name_per: 'CLASS_MANAGEMENT',
        description: 'Quản lý lớp học và sinh viên',
        resource: 'class',
        action: 'manage',
        details: [
          { action_name: 'Xem danh sách lớp', action_code: 'VIEW', check_action: true },
          { action_name: 'Quản lý sinh viên', action_code: 'MANAGE_STUDENTS', check_action: true },
          { action_name: 'Điểm danh lớp', action_code: 'ATTENDANCE', check_action: true },
          { action_name: 'Báo cáo lớp', action_code: 'REPORT', check_action: true }
        ]
      },
      {
        name_per: 'POINT_MANAGEMENT',
        description: 'Quản lý điểm rèn luyện',
        resource: 'point',
        action: 'manage',
        details: [
          { action_name: 'Cấp điểm', action_code: 'AWARD', check_action: true },
          { action_name: 'Xem điểm', action_code: 'VIEW', check_action: true },
          { action_name: 'Điều chỉnh điểm', action_code: 'ADJUST', check_action: true },
          { action_name: 'Xuất bảng điểm', action_code: 'EXPORT', check_action: true }
        ]
      },
      {
        name_per: 'NOTIFICATION_MANAGEMENT',
        description: 'Quản lý thông báo',
        resource: 'notification',
        action: 'manage',
        details: [
          { action_name: 'Tạo thông báo', action_code: 'CREATE', check_action: true },
          { action_name: 'Gửi thông báo', action_code: 'SEND', check_action: true },
          { action_name: 'Xem lịch sử', action_code: 'VIEW', check_action: true },
          { action_name: 'Xóa thông báo', action_code: 'DELETE', check_action: true }
        ]
      }
    ]);
    console.log(`✅ ${permissions.length} permissions\n`);

    // 3. Tạo Fields (8) - Lĩnh vực hoạt động tại Đại học Bách khoa Đà Nẵng
    console.log('📝 Tạo Fields...');
    const fields = await models.Field.insertMany([
      { name: 'Văn hóa - Nghệ thuật' },
      { name: 'Thể thao - Sức khỏe' },
      { name: 'Học thuật - Nghiên cứu' },
      { name: 'Tình nguyện - Xã hội' },
      { name: 'Công nghệ - Sáng tạo' },
      { name: 'Khởi nghiệp - Kinh doanh' },
      { name: 'An toàn - Bảo vệ môi trường' },
      { name: 'Giao lưu - Hội nhập' }
    ]);
    console.log(`✅ ${fields.length} fields\n`);

    // 4. Tạo Falcuties (4) - Các khoa tại Đại học Bách khoa Đà Nẵng
    console.log('📝 Tạo Falcuties...');
    const falcuties = await models.Falcuty.insertMany([
      { name: 'Khoa Công nghệ thông tin' },
      { name: 'Khoa Cơ khí' },
      { name: 'Khoa Quản lý dự án' },
      { name: 'Khoa Hóa' }
    ]);
    console.log(`✅ ${falcuties.length} falcuties\n`);

    // 5. Tạo Cohorts (5) - Các khóa tại Đại học Bách khoa Đà Nẵng
    console.log('📝 Tạo Cohorts...');
    const cohorts = await models.Cohort.insertMany([
      { year: 21 }, // Khóa 21
      { year: 22 }, // Khóa 22
      { year: 23 }, // Khóa 23
      { year: 24 }, // Khóa 24
      { year: 25 }  // Khóa 25 (năm hiện tại)
    ]);
    console.log(`✅ ${cohorts.length} cohorts\n`);

    // 6. Tạo Classes (8) - Các lớp tại Khoa Công nghệ thông tin
    console.log('📝 Tạo Classes...');
    const classes = await models.Class.insertMany([
      // Khóa 21
      { name: '21TCLC_DT1', falcuty_id: falcuties[0]._id, cohort_id: cohorts[0]._id },
      { name: '21TCLC_DT2', falcuty_id: falcuties[0]._id, cohort_id: cohorts[0]._id },
      { name: '21TCLC_ATTT', falcuty_id: falcuties[0]._id, cohort_id: cohorts[0]._id },
      // Khóa 22
      { name: '22TCLC_DT1', falcuty_id: falcuties[0]._id, cohort_id: cohorts[1]._id },
      { name: '22TCLC_DT2', falcuty_id: falcuties[0]._id, cohort_id: cohorts[1]._id },
      // Khóa 23
      { name: '23TCLC_DT1', falcuty_id: falcuties[0]._id, cohort_id: cohorts[2]._id },
      { name: '23TCLC_DT2', falcuty_id: falcuties[0]._id, cohort_id: cohorts[2]._id },
      // Khóa 24
      { name: '24TCLC_DT1', falcuty_id: falcuties[0]._id, cohort_id: cohorts[3]._id }
    ]);
    console.log(`✅ ${classes.length} classes\n`);

    // 7. Tạo Org Units (6) - Các đơn vị tổ chức tại Đại học Bách khoa Đà Nẵng
    console.log('📝 Tạo Org Units...');
    const orgUnits = await models.OrgUnit.insertMany([
      { name: 'Phòng Công tác sinh viên', type: 'department' },
      { name: 'Đoàn trường Đại học Bách khoa', type: 'union' },
      { name: 'Hội sinh viên Đại học Bách khoa', type: 'union' },
      { name: 'Khoa Công nghệ thông tin', type: 'faculty' },
      { name: 'CLB Lập trình viên', type: 'club' },
      { name: 'CLB An toàn thông tin', type: 'club' }
    ]);
    console.log(`✅ ${orgUnits.length} org units\n`);

    // 8. Tạo Users (10) - Tài khoản tại Đại học Bách khoa Đà Nẵng
    console.log('📝 Tạo Users...');
    const users = await models.User.insertMany([
      {
        username: 'admin',
        password: await bcrypt.hash('admin123', 10),
        name: 'Quản trị hệ thống',
        email: 'admin@dut.edu.vn',
        role: 'admin',
        active: true
      },
      {
        username: 'ctsv001',
        password: await bcrypt.hash('ctsv123', 10),
        name: 'ThS. Nguyễn Thị Minh',
        email: 'minh.nt@dut.edu.vn',
        role: 'ctsv',
        active: true
      },
      {
        username: 'doantruong001',
        password: await bcrypt.hash('doantruong123', 10),
        name: 'ThS. Trần Văn Hùng',
        email: 'hung.tv@dut.edu.vn',
        role: 'doantruong',
        active: true
      },
      {
        username: 'hoisv001',
        password: await bcrypt.hash('hoisv123', 10),
        name: 'Lê Thị Lan',
        email: 'lan.lt@dut.edu.vn',
        role: 'hoisv',
        active: true
      },
      {
        username: 'khoa001',
        password: await bcrypt.hash('khoa123', 10),
        name: 'PGS.TS. Phạm Văn Đức',
        email: 'duc.pv@dut.edu.vn',
        role: 'khoa',
        active: true
      },
      {
        username: 'clb001',
        password: await bcrypt.hash('clb123', 10),
        name: 'Nguyễn Văn Nam',
        email: 'nam.nv@dut.edu.vn',
        role: 'clb',
        active: true
      },
      {
        username: '2151012345',
        password: await bcrypt.hash('student123', 10),
        name: 'Nguyễn Văn An',
        email: 'an.nv21@student.dut.edu.vn',
        role: 'student',
        active: true
      },
      {
        username: '2151012346',
        password: await bcrypt.hash('student123', 10),
        name: 'Trần Thị Bình',
        email: 'binh.tt21@student.dut.edu.vn',
        role: 'student',
        active: true
      },
      {
        username: '2251012347',
        password: await bcrypt.hash('student123', 10),
        name: 'Lê Văn Cường',
        email: 'cuong.lv22@student.dut.edu.vn',
        role: 'loptruong',
        active: true
      },
      {
        username: '2351012348',
        password: await bcrypt.hash('student123', 10),
        name: 'Phạm Thị Dung',
        email: 'dung.pt23@student.dut.edu.vn',
        role: 'student',
        active: true
      }
    ]);
    console.log(`✅ ${users.length} users\n`);

    // 9. Tạo Student Profiles (4) - Sinh viên Khoa Công nghệ thông tin
    console.log('📝 Tạo Student Profiles...');
    const studentProfiles = await models.StudentProfile.insertMany([
      {
        user_id: users[6]._id,
        student_number: '2151012345',
        full_name: 'Nguyễn Văn An',
        date_of_birth: new Date('2003-05-15'),
        gender: 'Nam',
        email: 'an.nv21@student.dut.edu.vn',
        phone: '0901234567',
        class_id: classes[0]._id,
        enrollment_year: 2021,
        contact_address: '123 Đường 2/9, Hải Châu, Đà Nẵng',
        isClassMonitor: false
      },
      {
        user_id: users[7]._id,
        student_number: '2151012346',
        full_name: 'Trần Thị Bình',
        date_of_birth: new Date('2003-08-20'),
        gender: 'Nữ',
        email: 'binh.tt21@student.dut.edu.vn',
        phone: '0901234568',
        class_id: classes[0]._id,
        enrollment_year: 2021,
        contact_address: '456 Đường Lê Duẩn, Thanh Khê, Đà Nẵng',
        isClassMonitor: false
      },
      {
        user_id: users[8]._id,
        student_number: '2251012347',
        full_name: 'Lê Văn Cường',
        date_of_birth: new Date('2004-03-10'),
        gender: 'Nam',
        email: 'cuong.lv22@student.dut.edu.vn',
        phone: '0901234569',
        class_id: classes[3]._id,
        enrollment_year: 2022,
        contact_address: '789 Đường Nguyễn Văn Linh, Liên Chiểu, Đà Nẵng',
        isClassMonitor: true
      },
      {
        user_id: users[9]._id,
        student_number: '2351012348',
        full_name: 'Phạm Thị Dung',
        date_of_birth: new Date('2005-11-25'),
        gender: 'Nữ',
        email: 'dung.pt23@student.dut.edu.vn',
        phone: '0901234570',
        class_id: classes[5]._id,
        enrollment_year: 2023,
        contact_address: '321 Đường Trần Phú, Hải Châu, Đà Nẵng',
        isClassMonitor: false
      }
    ]);
    console.log(`✅ ${studentProfiles.length} student profiles\n`);

    // 10. Tạo Staff Profiles (5) - Cán bộ tại Đại học Bách khoa Đà Nẵng
    console.log('📝 Tạo Staff Profiles...');
    const staffProfiles = await models.StaffProfile.insertMany([
      {
        user_id: users[1]._id,
        staff_number: 'CTSV001',
        full_name: 'ThS. Nguyễn Thị Minh',
        date_of_birth: new Date('1985-07-15'),
        gender: 'Nữ',
        email: 'minh.nt@dut.edu.vn',
        phone: '0901234501',
        org_unit_id: orgUnits[0]._id,
        contact_address: 'Số 1 Đường Phạm Văn Đồng, Hải Châu, Đà Nẵng'
      },
      {
        user_id: users[2]._id,
        staff_number: 'DT001',
        full_name: 'ThS. Trần Văn Hùng',
        date_of_birth: new Date('1988-03-20'),
        gender: 'Nam',
        email: 'hung.tv@dut.edu.vn',
        phone: '0901234502',
        org_unit_id: orgUnits[1]._id,
        contact_address: 'Số 2 Đường Lê Duẩn, Thanh Khê, Đà Nẵng'
      },
      {
        user_id: users[3]._id,
        staff_number: 'HSV001',
        full_name: 'Lê Thị Lan',
        date_of_birth: new Date('1990-09-10'),
        gender: 'Nữ',
        email: 'lan.lt@dut.edu.vn',
        phone: '0901234503',
        org_unit_id: orgUnits[2]._id,
        contact_address: 'Số 3 Đường Nguyễn Văn Linh, Liên Chiểu, Đà Nẵng'
      },
      {
        user_id: users[4]._id,
        staff_number: 'KH001',
        full_name: 'PGS.TS. Phạm Văn Đức',
        date_of_birth: new Date('1975-12-05'),
        gender: 'Nam',
        email: 'duc.pv@dut.edu.vn',
        phone: '0901234504',
        org_unit_id: orgUnits[3]._id,
        contact_address: 'Số 4 Đường Trần Phú, Hải Châu, Đà Nẵng'
      },
      {
        user_id: users[5]._id,
        staff_number: 'CLB001',
        full_name: 'Nguyễn Văn Nam',
        date_of_birth: new Date('1992-04-18'),
        gender: 'Nam',
        email: 'nam.nv@dut.edu.vn',
        phone: '0901234505',
        org_unit_id: orgUnits[4]._id,
        contact_address: 'Số 5 Đường 2/9, Hải Châu, Đà Nẵng'
      }
    ]);
    console.log(`✅ ${staffProfiles.length} staff profiles\n`);

    // 11. Tạo Activities (8) - Hoạt động tại Đại học Bách khoa Đà Nẵng
    console.log('📝 Tạo Activities...');
    const activities = await models.Activity.insertMany([
      {
        title: 'Hội thi Lập trình viên trẻ 2025',
        description: 'Cuộc thi lập trình dành cho sinh viên Khoa Công nghệ thông tin',
        location: 'Phòng máy tính A1 - Khoa CNTT',
        start_time: new Date('2025-03-15T08:00:00'),
        end_time: new Date('2025-03-15T17:00:00'),
        registration_open: new Date('2025-02-15T00:00:00'),
        registration_close: new Date('2025-03-10T23:59:59'),
        org_unit_id: orgUnits[4]._id,
        field_id: fields[4]._id,
        capacity: 80,
        requires_approval: true
      },
      {
        title: 'Ngày hội Tình nguyện Hè 2025',
        description: 'Hoạt động tình nguyện tại các vùng quê miền Trung',
        location: 'Hội trường lớn - Trường Đại học Bách khoa',
        start_time: new Date('2025-06-20T07:00:00'),
        end_time: new Date('2025-06-22T18:00:00'),
        registration_open: new Date('2025-05-01T00:00:00'),
        registration_close: new Date('2025-06-10T23:59:59'),
        org_unit_id: orgUnits[2]._id,
        field_id: fields[3]._id,
        capacity: 150,
        requires_approval: true
      },
      {
        title: 'Giải bóng đá sinh viên Bách khoa 2025',
        description: 'Giải bóng đá nam nữ sinh viên toàn trường',
        location: 'Sân vận động Đại học Bách khoa',
        start_time: new Date('2025-04-01T14:00:00'),
        end_time: new Date('2025-04-15T18:00:00'),
        registration_open: new Date('2025-03-01T00:00:00'),
        registration_close: new Date('2025-03-25T23:59:59'),
        org_unit_id: orgUnits[2]._id,
        field_id: fields[1]._id,
        capacity: 200,
        requires_approval: false
      },
      {
        title: 'Hội thảo Nghiên cứu khoa học sinh viên',
        description: 'Trình bày các đề tài nghiên cứu khoa học của sinh viên',
        location: 'Phòng hội thảo Khoa CNTT',
        start_time: new Date('2025-05-20T08:30:00'),
        end_time: new Date('2025-05-20T16:30:00'),
        registration_open: new Date('2025-04-01T00:00:00'),
        registration_close: new Date('2025-05-10T23:59:59'),
        org_unit_id: orgUnits[3]._id,
        field_id: fields[2]._id,
        capacity: 60,
        requires_approval: true
      },
      {
        title: 'Workshop An toàn thông tin',
        description: 'Chia sẻ kiến thức về bảo mật và an toàn thông tin',
        location: 'Phòng thực hành An toàn thông tin',
        start_time: new Date('2025-02-28T14:00:00'),
        end_time: new Date('2025-02-28T17:00:00'),
        registration_open: new Date('2025-02-01T00:00:00'),
        registration_close: new Date('2025-02-25T23:59:59'),
        org_unit_id: orgUnits[5]._id,
        field_id: fields[4]._id,
        capacity: 40,
        requires_approval: false
      },
      {
        title: 'Festival Văn hóa - Nghệ thuật 2025',
        description: 'Biểu diễn văn nghệ, triển lãm nghệ thuật sinh viên',
        location: 'Sân khấu ngoài trời - Khuôn viên trường',
        start_time: new Date('2025-03-26T18:00:00'),
        end_time: new Date('2025-03-26T22:00:00'),
        registration_open: new Date('2025-02-15T00:00:00'),
        registration_close: new Date('2025-03-20T23:59:59'),
        org_unit_id: orgUnits[2]._id,
        field_id: fields[0]._id,
        capacity: 300,
        requires_approval: false
      },
      {
        title: 'Chương trình Khởi nghiệp Đổi mới sáng tạo',
        description: 'Pitching ý tưởng khởi nghiệp công nghệ',
        location: 'Hội trường Khoa CNTT',
        start_time: new Date('2025-04-15T08:00:00'),
        end_time: new Date('2025-04-15T17:00:00'),
        registration_open: new Date('2025-03-01T00:00:00'),
        registration_close: new Date('2025-04-05T23:59:59'),
        org_unit_id: orgUnits[3]._id,
        field_id: fields[5]._id,
        capacity: 50,
        requires_approval: true
      },
      {
        title: 'Chiến dịch Bảo vệ môi trường xanh',
        description: 'Hoạt động dọn dẹp, trồng cây, bảo vệ môi trường',
        location: 'Công viên 29/3, Đà Nẵng',
        start_time: new Date('2025-04-22T07:00:00'),
        end_time: new Date('2025-04-22T11:00:00'),
        registration_open: new Date('2025-04-01T00:00:00'),
        registration_close: new Date('2025-04-18T23:59:59'),
        org_unit_id: orgUnits[1]._id,
        field_id: fields[6]._id,
        capacity: 100,
        requires_approval: false
      }
    ]);
    console.log(`✅ ${activities.length} activities\n`);

    // 12. Gán Permissions cho Users - Phân quyền theo vai trò thực tế
    console.log('📝 Gán Permissions...');
    const userPermissions = [];
    
    // Admin có tất cả permissions
    for (const perm of permissions) {
      userPermissions.push({
        id_user: users[0]._id,
        id_per: perm._id,
        licensed: true,
        granted_by: users[0]._id
      });
    }
    
    // CTSV (users[1]) - Công tác sinh viên
    userPermissions.push(
      { id_user: users[1]._id, id_per: permissions[0]._id, licensed: true, granted_by: users[0]._id }, // ACTIVITY_MANAGEMENT
      { id_user: users[1]._id, id_per: permissions[1]._id, licensed: true, granted_by: users[0]._id }, // USER_MANAGEMENT
      { id_user: users[1]._id, id_per: permissions[2]._id, licensed: true, granted_by: users[0]._id }, // ATTENDANCE_MANAGEMENT
      { id_user: users[1]._id, id_per: permissions[4]._id, licensed: true, granted_by: users[0]._id }, // REPORT_VIEW
      { id_user: users[1]._id, id_per: permissions[5]._id, licensed: true, granted_by: users[0]._id }, // CLASS_MANAGEMENT
      { id_user: users[1]._id, id_per: permissions[6]._id, licensed: true, granted_by: users[0]._id }  // POINT_MANAGEMENT
    );
    
    // Đoàn trường (users[2])
    userPermissions.push(
      { id_user: users[2]._id, id_per: permissions[0]._id, licensed: true, granted_by: users[0]._id }, // ACTIVITY_MANAGEMENT
      { id_user: users[2]._id, id_per: permissions[2]._id, licensed: true, granted_by: users[0]._id }, // ATTENDANCE_MANAGEMENT
      { id_user: users[2]._id, id_per: permissions[4]._id, licensed: true, granted_by: users[0]._id }, // REPORT_VIEW
      { id_user: users[2]._id, id_per: permissions[7]._id, licensed: true, granted_by: users[0]._id }  // NOTIFICATION_MANAGEMENT
    );
    
    // Hội sinh viên (users[3])
    userPermissions.push(
      { id_user: users[3]._id, id_per: permissions[0]._id, licensed: true, granted_by: users[0]._id }, // ACTIVITY_MANAGEMENT
      { id_user: users[3]._id, id_per: permissions[2]._id, licensed: true, granted_by: users[0]._id }, // ATTENDANCE_MANAGEMENT
      { id_user: users[3]._id, id_per: permissions[7]._id, licensed: true, granted_by: users[0]._id }  // NOTIFICATION_MANAGEMENT
    );
    
    // Khoa (users[4])
    userPermissions.push(
      { id_user: users[4]._id, id_per: permissions[0]._id, licensed: true, granted_by: users[0]._id }, // ACTIVITY_MANAGEMENT
      { id_user: users[4]._id, id_per: permissions[2]._id, licensed: true, granted_by: users[0]._id }, // ATTENDANCE_MANAGEMENT
      { id_user: users[4]._id, id_per: permissions[4]._id, licensed: true, granted_by: users[0]._id }, // REPORT_VIEW
      { id_user: users[4]._id, id_per: permissions[5]._id, licensed: true, granted_by: users[0]._id }  // CLASS_MANAGEMENT
    );
    
    // CLB (users[5])
    userPermissions.push(
      { id_user: users[5]._id, id_per: permissions[0]._id, licensed: true, granted_by: users[0]._id }, // ACTIVITY_MANAGEMENT
      { id_user: users[5]._id, id_per: permissions[2]._id, licensed: true, granted_by: users[0]._id }  // ATTENDANCE_MANAGEMENT
    );
    
    // Sinh viên (users[6], users[7], users[9])
    for (const studentId of [users[6]._id, users[7]._id, users[9]._id]) {
      userPermissions.push(
        { id_user: studentId, id_per: permissions[3]._id, licensed: true, granted_by: users[0]._id }, // EVIDENCE_MANAGEMENT
        { id_user: studentId, id_per: permissions[4]._id, licensed: true, granted_by: users[0]._id }  // REPORT_VIEW
      );
    }
    
    // Lớp trưởng (users[8]) - Có thêm quyền quản lý lớp
    userPermissions.push(
      { id_user: users[8]._id, id_per: permissions[3]._id, licensed: true, granted_by: users[0]._id }, // EVIDENCE_MANAGEMENT
      { id_user: users[8]._id, id_per: permissions[4]._id, licensed: true, granted_by: users[0]._id }, // REPORT_VIEW
      { id_user: users[8]._id, id_per: permissions[5]._id, licensed: true, granted_by: users[0]._id }  // CLASS_MANAGEMENT
    );
    
    await models.UserPermission.insertMany(userPermissions);
    console.log(`✅ ${userPermissions.length} user permissions\n`);

    // Summary
    console.log('='.repeat(70));
    console.log('📊 THỐNG KÊ - ĐẠI HỌC BÁCH KHOA ĐÀ NẴNG');
    console.log('='.repeat(70));
    console.log(`✅ Permissions: ${permissions.length} (8 loại quyền)`);
    console.log(`✅ Users: ${users.length} (10 tài khoản)`);
    console.log(`✅ Student Profiles: ${studentProfiles.length} (4 sinh viên)`);
    console.log(`✅ Staff Profiles: ${staffProfiles.length} (5 cán bộ)`);
    console.log(`✅ Org Units: ${orgUnits.length} (6 đơn vị tổ chức)`);
    console.log(`✅ Fields: ${fields.length} (8 lĩnh vực hoạt động)`);
    console.log(`✅ Falcuties: ${falcuties.length} (4 khoa)`);
    console.log(`✅ Cohorts: ${cohorts.length} (5 khóa học)`);
    console.log(`✅ Classes: ${classes.length} (8 lớp học)`);
    console.log(`✅ Activities: ${activities.length} (8 hoạt động)`);
    console.log(`✅ User Permissions: ${userPermissions.length} (phân quyền)`);
    console.log('='.repeat(70));
    
    console.log('\n🎉 SEED HOÀN TẤT!\n');
    
    console.log('💡 TÀI KHOẢN TEST - ĐẠI HỌC BÁCH KHOA ĐÀ NẴNG:');
    console.log('   🔑 admin / admin123 (Quản trị hệ thống - tất cả quyền)');
    console.log('   👩‍💼 ctsv001 / ctsv123 (ThS. Nguyễn Thị Minh - CTSV)');
    console.log('   👨‍🏫 doantruong001 / doantruong123 (ThS. Trần Văn Hùng - Đoàn trường)');
    console.log('   👩‍🎓 hoisv001 / hoisv123 (Lê Thị Lan - Hội sinh viên)');
    console.log('   👨‍🎓 khoa001 / khoa123 (PGS.TS. Phạm Văn Đức - Khoa CNTT)');
    console.log('   👨‍💻 clb001 / clb123 (Nguyễn Văn Nam - CLB Lập trình)');
    console.log('   👨‍🎓 2151012345 / student123 (Nguyễn Văn An - Sinh viên)');
    console.log('   👩‍🎓 2151012346 / student123 (Trần Thị Bình - Sinh viên)');
    console.log('   👨‍🎓 2251012347 / student123 (Lê Văn Cường - Lớp trưởng)');
    console.log('   👩‍🎓 2351012348 / student123 (Phạm Thị Dung - Sinh viên)\n');

  } catch (error) {
    console.error('\n❌ LỖI:', error);
    throw error;
  }
}

// Main
async function main() {
  try {
    await connectDB();
    await seedAll();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Đã đóng kết nối MongoDB\n');
  }
}

main();


