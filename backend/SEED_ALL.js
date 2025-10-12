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

    // 2. Tạo Permissions (5)
    console.log('📝 Tạo Permissions...');
    const permissions = await models.Permission.insertMany([
      {
        name_per: 'ACTIVITY_MANAGEMENT',
        description: 'Quản lý hoạt động',
        resource: 'activity',
        action: 'manage',
        details: [
          { action_name: 'Tạo', action_code: 'CREATE', check_action: true },
          { action_name: 'Xem', action_code: 'READ', check_action: true },
          { action_name: 'Sửa', action_code: 'UPDATE', check_action: true },
          { action_name: 'Xóa', action_code: 'DELETE', check_action: false },
          { action_name: 'Duyệt', action_code: 'APPROVE', check_action: true }
        ]
      },
      {
        name_per: 'USER_MANAGEMENT',
        description: 'Quản lý người dùng',
        resource: 'user',
        action: 'manage',
        details: [
          { action_name: 'Tạo', action_code: 'CREATE', check_action: true },
          { action_name: 'Xem', action_code: 'READ', check_action: true },
          { action_name: 'Sửa', action_code: 'UPDATE', check_action: true },
          { action_name: 'Xóa', action_code: 'DELETE', check_action: false },
          { action_name: 'Khóa', action_code: 'LOCK', check_action: true }
        ]
      },
      {
        name_per: 'ATTENDANCE_MANAGEMENT',
        description: 'Quản lý điểm danh',
        resource: 'attendance',
        action: 'manage',
        details: [
          { action_name: 'Quét QR', action_code: 'SCAN', check_action: true },
          { action_name: 'Xem', action_code: 'VIEW', check_action: true },
          { action_name: 'Xác nhận', action_code: 'VERIFY', check_action: true },
          { action_name: 'Xuất', action_code: 'EXPORT', check_action: true }
        ]
      },
      {
        name_per: 'EVIDENCE_MANAGEMENT',
        description: 'Quản lý minh chứng',
        resource: 'evidence',
        action: 'manage',
        details: [
          { action_name: 'Nộp', action_code: 'SUBMIT', check_action: true },
          { action_name: 'Xem', action_code: 'VIEW', check_action: true },
          { action_name: 'Duyệt', action_code: 'APPROVE', check_action: true },
          { action_name: 'Từ chối', action_code: 'REJECT', check_action: true }
        ]
      },
      {
        name_per: 'REPORT_VIEW',
        description: 'Xem báo cáo',
        resource: 'report',
        action: 'view',
        details: [
          { action_name: 'Tổng quan', action_code: 'VIEW_OVERVIEW', check_action: true },
          { action_name: 'Chi tiết', action_code: 'VIEW_DETAIL', check_action: true },
          { action_name: 'Xuất', action_code: 'EXPORT', check_action: true }
        ]
      }
    ]);
    console.log(`✅ ${permissions.length} permissions\n`);

    // 3. Tạo Fields (5)
    console.log('📝 Tạo Fields...');
    const fields = await models.Field.insertMany([
      { name: 'Văn hóa' },
      { name: 'Thể thao' },
      { name: 'Học thuật' },
      { name: 'Tình nguyện' },
      { name: 'Nghệ thuật' }
    ]);
    console.log(`✅ ${fields.length} fields\n`);

    // 4. Tạo Falcuties (3)
    console.log('📝 Tạo Falcuties...');
    const falcuties = await models.Falcuty.insertMany([
      { name: 'Công nghệ thông tin' },
      { name: 'Kinh tế' },
      { name: 'Ngoại ngữ' }
    ]);
    console.log(`✅ ${falcuties.length} falcuties\n`);

    // 5. Tạo Cohorts (2)
    console.log('📝 Tạo Cohorts...');
    const cohorts = await models.Cohort.insertMany([
      { year: 2023 },
      { year: 2024 }
    ]);
    console.log(`✅ ${cohorts.length} cohorts\n`);

    // 6. Tạo Classes (3)
    console.log('📝 Tạo Classes...');
    const classes = await models.Class.insertMany([
      { name: '20TCLC_DT1', falcuty_id: falcuties[0]._id, cohort_id: cohorts[0]._id },
      { name: '20TCLC_DT2', falcuty_id: falcuties[0]._id, cohort_id: cohorts[0]._id },
      { name: '21TCLC_DT1', falcuty_id: falcuties[0]._id, cohort_id: cohorts[1]._id }
    ]);
    console.log(`✅ ${classes.length} classes\n`);

    // 7. Tạo Org Units (3)
    console.log('📝 Tạo Org Units...');
    const orgUnits = await models.OrgUnit.insertMany([
      { name: 'Phòng CTSV', type: 'department' },
      { name: 'Đoàn trường', type: 'union' },
      { name: 'Hội sinh viên', type: 'union' }
    ]);
    console.log(`✅ ${orgUnits.length} org units\n`);

    // 8. Tạo Users (5)
    console.log('📝 Tạo Users...');
    const users = await models.User.insertMany([
      {
        username: 'admin',
        password: await bcrypt.hash('password123', 10),
        name: 'Admin System',
        email: 'admin@test.com',
        role: 'admin',
        active: true
      },
      {
        username: 'sv001',
        password: await bcrypt.hash('password123', 10),
        name: 'Nguyễn Văn A',
        email: 'student@test.com',
        role: 'student',
        active: true
      },
      {
        username: 'gv001',
        password: await bcrypt.hash('password123', 10),
        name: 'Giáo viên CTSV',
        email: 'teacher@test.com',
        role: 'ctsv',
        active: true
      },
      {
        username: 'sv002',
        password: await bcrypt.hash('password123', 10),
        name: 'Trần Thị B',
        email: 'sv002@test.com',
        role: 'student',
        active: true
      },
      {
        username: 'loptruong',
        password: await bcrypt.hash('password123', 10),
        name: 'Lớp trưởng',
        email: 'monitor@test.com',
        role: 'loptruong',
        active: true
      }
    ]);
    console.log(`✅ ${users.length} users\n`);

    // 9. Tạo Student Profiles (3)
    console.log('📝 Tạo Student Profiles...');
    const studentProfiles = await models.StudentProfile.insertMany([
      {
        user_id: users[1]._id,
        student_number: '2051012345',
        full_name: 'Nguyễn Văn A',
        email: 'student@test.com',
        class_id: classes[0]._id,
        enrollment_year: 2020,
        isClassMonitor: false
      },
      {
        user_id: users[3]._id,
        student_number: '2051012346',
        full_name: 'Trần Thị B',
        email: 'sv002@test.com',
        class_id: classes[0]._id,
        enrollment_year: 2020,
        isClassMonitor: false
      },
      {
        user_id: users[4]._id,
        student_number: '2051012347',
        full_name: 'Lớp trưởng',
        email: 'monitor@test.com',
        class_id: classes[0]._id,
        enrollment_year: 2020,
        isClassMonitor: true
      }
    ]);
    console.log(`✅ ${studentProfiles.length} student profiles\n`);

    // 10. Tạo Staff Profiles (1)
    console.log('📝 Tạo Staff Profiles...');
    const staffProfiles = await models.StaffProfile.insertMany([
      {
        user_id: users[2]._id,
        staff_number: 'GV001',
        full_name: 'Giáo viên CTSV',
        email: 'teacher@test.com',
        org_unit_id: orgUnits[0]._id
      }
    ]);
    console.log(`✅ ${staffProfiles.length} staff profiles\n`);

    // 11. Tạo Activities (3)
    console.log('📝 Tạo Activities...');
    const activities = await models.Activity.insertMany([
      {
        title: 'Ngày hội tình nguyện 2024',
        description: 'Hoạt động tình nguyện hè',
        location: 'Hội trường A',
        start_time: new Date('2024-06-15'),
        end_time: new Date('2024-06-16'),
        org_unit_id: orgUnits[0]._id,
        field_id: fields[3]._id,
        capacity: 100,
        requires_approval: true
      },
      {
        title: 'Giải bóng đá sinh viên',
        description: 'Giải bóng đá tranh cúp',
        location: 'Sân vận động',
        start_time: new Date('2024-07-01'),
        end_time: new Date('2024-07-05'),
        org_unit_id: orgUnits[2]._id,
        field_id: fields[1]._id,
        capacity: 200
      },
      {
        title: 'Hội thảo khoa học',
        description: 'Hội thảo sinh viên nghiên cứu khoa học',
        location: 'Phòng hội thảo B',
        start_time: new Date('2024-08-10'),
        end_time: new Date('2024-08-10'),
        org_unit_id: orgUnits[1]._id,
        field_id: fields[2]._id,
        capacity: 50
      }
    ]);
    console.log(`✅ ${activities.length} activities\n`);

    // 12. Gán Permissions cho Users
    console.log('📝 Gán Permissions...');
    const userPermissions = [];
    // Admin có tất cả
    for (const perm of permissions) {
      userPermissions.push({
        id_user: users[0]._id,
        id_per: perm._id,
        licensed: true
      });
    }
    // Student có 2 permissions
    userPermissions.push(
      { id_user: users[1]._id, id_per: permissions[3]._id, licensed: true }, // EVIDENCE
      { id_user: users[1]._id, id_per: permissions[4]._id, licensed: true }  // REPORT
    );
    // Teacher có 3 permissions
    userPermissions.push(
      { id_user: users[2]._id, id_per: permissions[0]._id, licensed: true }, // ACTIVITY
      { id_user: users[2]._id, id_per: permissions[2]._id, licensed: true }, // ATTENDANCE
      { id_user: users[2]._id, id_per: permissions[4]._id, licensed: true }  // REPORT
    );
    await models.UserPermission.insertMany(userPermissions);
    console.log(`✅ ${userPermissions.length} user permissions\n`);

    // Summary
    console.log('='.repeat(70));
    console.log('📊 THỐNG KÊ');
    console.log('='.repeat(70));
    console.log(`✅ Permissions: ${permissions.length}`);
    console.log(`✅ Users: ${users.length}`);
    console.log(`✅ Student Profiles: ${studentProfiles.length}`);
    console.log(`✅ Staff Profiles: ${staffProfiles.length}`);
    console.log(`✅ Org Units: ${orgUnits.length}`);
    console.log(`✅ Fields: ${fields.length}`);
    console.log(`✅ Falcuties: ${falcuties.length}`);
    console.log(`✅ Cohorts: ${cohorts.length}`);
    console.log(`✅ Classes: ${classes.length}`);
    console.log(`✅ Activities: ${activities.length}`);
    console.log(`✅ User Permissions: ${userPermissions.length}`);
    console.log('='.repeat(70));
    
    console.log('\n🎉 SEED HOÀN TẤT!\n');
    
    console.log('💡 TEST USERS:');
    console.log('   - admin / password123 (Admin - tất cả quyền)');
    console.log('   - sv001 / password123 (Sinh viên)');
    console.log('   - gv001 / password123 (Giáo viên CTSV)');
    console.log('   - loptruong / password123 (Lớp trưởng)\n');

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


