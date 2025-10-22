/**
 * SEED DỮ LIỆU - ĐÚNG CẤU TRÚC GỐC 100%
 * Chỉ thêm vào collections gốc, giữ nguyên fields
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

console.log('\n' + '='.repeat(70));
console.log('🌱 SEED - ĐÚNG CẤU TRÚC GỐC 100%');
console.log('='.repeat(70) + '\n');

async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;
  const dbName = 'Community_Activity_Management';
  
  await mongoose.connect(mongoUri, { dbName });
  console.log(`✅ Kết nối: ${dbName}\n`);
}

async function seedData() {
  try {
    const db = mongoose.connection.db;
    
    // XÓA CHỈ CÁC COLLECTIONS GỐC
    console.log('🗑️  Xóa dữ liệu cũ (chỉ collections gốc)...\n');
    
    const collectionsToClean = [
      'user', 'role', 'permission', 'action', 'role_action', 'user_role', 'user_action_override',
      'field', 'falcuty', 'cohort', 'class', 'org_unit',
      'staff_profile', 'student_profile',
      'activity', 'activity_registration', 'activity_eligiblity',
      'attendance', 'evidence', 'student_feedback', 'student_cohort',
      'pvcd_record', 'post'
    ];
    
    for (const collectionName of collectionsToClean) {
      await db.collection(collectionName).deleteMany({});
      console.log(`   ✅ Đã xóa: ${collectionName}`);
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('📝 THÊM DỮ LIỆU MỚI - ĐÚNG CẤU TRÚC GỐC');
    console.log('='.repeat(70) + '\n');
    
    // 1. FIELD (chỉ có field name)
    console.log('📝 Fields...');
    const fields = await db.collection('field').insertMany([
      { name: 'Artificial Intelligence' },
      { name: 'Machine Learning' },
      { name: 'Data Science' },
      { name: 'Web Development' },
      { name: 'Mobile Development' }
    ]);
    console.log(`   ✅ ${fields.insertedCount} fields`);
    
    // 2. FALCUTY (chỉ có name)
    console.log('📝 Faculties...');
    const faculties = await db.collection('falcuty').insertMany([
      { name: 'Information Technology' },
      { name: 'Computer Science' },
      { name: 'Software Engineering' }
    ]);
    console.log(`   ✅ ${faculties.insertedCount} faculties`);
    
    // 3. COHORT (chỉ có year)
    console.log('📝 Cohorts...');
    const cohorts = await db.collection('cohort').insertMany([
      { year: 2021 },
      { year: 2022 },
      { year: 2023 },
      { year: 2024 }
    ]);
    console.log(`   ✅ ${cohorts.insertedCount} cohorts`);
    
    // 4. CLASS (name, falcuty_id, cohort_id)
    console.log('📝 Classes...');
    const classes = await db.collection('class').insertMany([
      { name: 'IT2021A', falcuty_id: faculties.insertedIds[0], cohort_id: cohorts.insertedIds[0] },
      { name: 'IT2022A', falcuty_id: faculties.insertedIds[0], cohort_id: cohorts.insertedIds[1] },
      { name: 'IT2023A', falcuty_id: faculties.insertedIds[1], cohort_id: cohorts.insertedIds[2] }
    ]);
    console.log(`   ✅ ${classes.insertedCount} classes`);
    
    // 5. ORG_UNIT (name, type, leader_id)
    console.log('📝 Org Units...');
    const orgUnits = await db.collection('org_unit').insertMany([
      { name: 'Khoa Công Nghệ Thông Tin', type: 'faculty', leader_id: new mongoose.Types.ObjectId() },
      { name: 'Phòng Đào tạo', type: 'department', leader_id: new mongoose.Types.ObjectId() },
      { name: 'Đoàn trường', type: 'union', leader_id: new mongoose.Types.ObjectId() }
    ]);
    console.log(`   ✅ ${orgUnits.insertedCount} org units`);
    
    // 6. USER (ĐÚNG CẤU TRÚC: _id, username, password_hash, active, isLocked)
    console.log('📝 Users...');
    
    // Hash passwords before inserting
    const saltRounds = 10;
    const hashedPasswords = {
      admin123: await bcrypt.hash('admin123', saltRounds),
      staff123: await bcrypt.hash('staff123', saltRounds),
      teacher123: await bcrypt.hash('teacher123', saltRounds),
      student123: await bcrypt.hash('student123', saltRounds)
    };
    
    const users = await db.collection('user').insertMany([
      // ADMIN
      { username: 'admin', password_hash: hashedPasswords.admin123, active: true, isLocked: false },
      
      // STAFF
      { username: 'staff_ctsv', password_hash: hashedPasswords.staff123, active: true, isLocked: false },
      { username: 'staff_doan', password_hash: hashedPasswords.staff123, active: true, isLocked: false },
      { username: 'staff_khoa', password_hash: hashedPasswords.staff123, active: true, isLocked: false },
      
      // TEACHER
      { username: 'teacher1', password_hash: hashedPasswords.teacher123, active: true, isLocked: false },
      { username: 'teacher2', password_hash: hashedPasswords.teacher123, active: true, isLocked: false },
      
      // STUDENT
      { username: 'student1', password_hash: hashedPasswords.student123, active: true, isLocked: false },
      { username: 'student2_monitor', password_hash: hashedPasswords.student123, active: true, isLocked: false },
      { username: 'student3', password_hash: hashedPasswords.student123, active: true, isLocked: false },
      { username: 'student4', password_hash: hashedPasswords.student123, active: true, isLocked: false }
    ]);
    console.log(`   ✅ ${users.insertedCount} users`);
    
    // 7. ROLE (name, description)
    console.log('📝 Roles...');
    const roles = await db.collection('role').insertMany([
      { name: 'admin', description: 'Administrator role' },
      { name: 'teacher', description: 'Teacher role' },
      { name: 'student', description: 'Student role' },
      { name: 'staff', description: 'Staff role' }
    ]);
    console.log(`   ✅ ${roles.insertedCount} roles`);
    
    // 8. STAFF_PROFILE
    console.log('📝 Staff Profiles...');
    const staffProfiles = await db.collection('staff_profile').insertMany([
      {
        user_id: users.insertedIds[1], // staff_ctsv
        staff_number: 'CTSV001',
        full_name: 'Nguyễn Văn CTSV',
        date_of_birth: new Date('1985-01-15'),
        gender: 'male',
        email: 'ctsv@ptit.edu.vn',
        phone: '0912345001',
        org_unit_id: orgUnits.insertedIds[0], // Phòng CTSV
        staff_image: '',
        contact_address: 'Hanoi, Vietnam'
      },
      {
        user_id: users.insertedIds[2], // staff_doan
        staff_number: 'DOAN001',
        full_name: 'Trần Thị Đoàn',
        date_of_birth: new Date('1987-05-20'),
        gender: 'female',
        email: 'doan@ptit.edu.vn',
        phone: '0912345002',
        org_unit_id: orgUnits.insertedIds[2], // Đoàn trường
        staff_image: '',
        contact_address: 'Hanoi, Vietnam'
      },
      {
        user_id: users.insertedIds[3], // staff_khoa
        staff_number: 'KHOA001',
        full_name: 'Lê Văn Khoa',
        date_of_birth: new Date('1983-08-10'),
        gender: 'male',
        email: 'khoa@ptit.edu.vn',
        phone: '0912345003',
        org_unit_id: orgUnits.insertedIds[0], // Khoa CNTT
        staff_image: '',
        contact_address: 'Hanoi, Vietnam'
      },
      {
        user_id: users.insertedIds[4], // teacher1
        staff_number: 'GV001',
        full_name: 'Phạm Thị Giáo viên A',
        date_of_birth: new Date('1986-03-25'),
        gender: 'female',
        email: 'teachera@ptit.edu.vn',
        phone: '0912345004',
        org_unit_id: orgUnits.insertedIds[0],
        staff_image: '',
        contact_address: 'Hanoi, Vietnam'
      },
      {
        user_id: users.insertedIds[5], // teacher2
        staff_number: 'GV002',
        full_name: 'Hoàng Văn Giáo viên B',
        date_of_birth: new Date('1988-07-12'),
        gender: 'male',
        email: 'teacherb@ptit.edu.vn',
        phone: '0912345005',
        org_unit_id: orgUnits.insertedIds[0],
        staff_image: '',
        contact_address: 'Hanoi, Vietnam'
      }
    ]);
    console.log(`   ✅ ${staffProfiles.insertedCount} staff profiles`);
    
    // 9. STUDENT_PROFILE
    console.log('📝 Student Profiles...');
    const studentProfiles = await db.collection('student_profile').insertMany([
      {
        user_id: users.insertedIds[6], // student1
        student_number: '102220001',
        full_name: 'Nguyễn Văn An',
        date_of_birth: new Date('2004-01-15'),
        gender: 'male',
        email: 'student1@stu.ptit.edu.vn',
        phone: '0923456001',
        enrollment_year: 2022,
        class_id: classes.insertedIds[0], // IT2021A
        student_image: '',
        contact_address: 'Hanoi, Vietnam',
        isClassMonitor: false
      },
      {
        user_id: users.insertedIds[7], // student2_monitor - LỚP TRƯỞNG
        student_number: '102220002',
        full_name: 'Trần Thị Bình (Lớp trưởng)',
        date_of_birth: new Date('2004-05-20'),
        gender: 'female',
        email: 'student2@stu.ptit.edu.vn',
        phone: '0923456002',
        enrollment_year: 2022,
        class_id: classes.insertedIds[1], // IT2022A
        student_image: '',
        contact_address: 'Hanoi, Vietnam',
        isClassMonitor: true // LỚP TRƯỞNG
      },
      {
        user_id: users.insertedIds[8], // student3
        student_number: '102220003',
        full_name: 'Lê Văn Cường',
        date_of_birth: new Date('2004-08-10'),
        gender: 'male',
        email: 'student3@stu.ptit.edu.vn',
        phone: '0923456003',
        enrollment_year: 2022,
        class_id: classes.insertedIds[1], // IT2022A
        student_image: '',
        contact_address: 'Hanoi, Vietnam',
        isClassMonitor: false
      },
      {
        user_id: users.insertedIds[9], // student4
        student_number: '102220004',
        full_name: 'Phạm Thị Dung',
        date_of_birth: new Date('2004-12-25'),
        gender: 'female',
        email: 'student4@stu.ptit.edu.vn',
        phone: '0923456004',
        enrollment_year: 2022,
        class_id: classes.insertedIds[2], // IT2023A
        student_image: '',
        contact_address: 'Da Nang, Vietnam',
        isClassMonitor: false
      }
    ]);
    console.log(`   ✅ ${studentProfiles.insertedCount} student profiles`);
    
    // 10. PERMISSION (resource, name, description)
    console.log('📝 Permissions...');
    const permissions = await db.collection('permission').insertMany([
      { resource: 'student', name: 'Quản lý sinh viên', description: 'Các quyền liên quan đến sinh viên' },
      { resource: 'activity', name: 'manage_activities', description: 'Quản lý hoạt động' },
      { resource: 'user', name: 'manage_users', description: 'Quản lý người dùng' }
    ]);
    console.log(`   ✅ ${permissions.insertedCount} permissions`);
    
    // 11. ACTION (permission_id, action_code, action_name, description, is_active)
    console.log('📝 Actions...');
    const actions = await db.collection('action').insertMany([
      {
        permission_id: permissions.insertedIds[0],
        action_code: 'VIEW_ACTIVITY',
        action_name: 'Xem hoạt động',
        description: 'Cho phép xem danh sách hoạt động',
        is_active: true
      },
      {
        permission_id: permissions.insertedIds[1],
        action_code: 'CREATE_ACTIVITY',
        action_name: 'Tạo hoạt động',
        description: 'Cho phép tạo hoạt động mới',
        is_active: true
      },
      {
        permission_id: permissions.insertedIds[2],
        action_code: 'DELETE_USER',
        action_name: 'Xóa người dùng',
        description: 'Cho phép xóa người dùng',
        is_active: false
      }
    ]);
    console.log(`   ✅ ${actions.insertedCount} actions`);
    
    // 12. ROLE_ACTION (role_id, action_id, is_granted)
    console.log('📝 Role Actions...');
    const roleActions = await db.collection('role_action').insertMany([
      { role_id: roles.insertedIds[0], action_id: actions.insertedIds[0], is_granted: true },
      { role_id: roles.insertedIds[0], action_id: actions.insertedIds[1], is_granted: true },
      { role_id: roles.insertedIds[1], action_id: actions.insertedIds[0], is_granted: true }
    ]);
    console.log(`   ✅ ${roleActions.insertedCount} role actions`);
    
    // 13. USER_ROLE (user_id, role_id, org_unit_id)
    console.log('📝 User Roles...');
    const userRoles = await db.collection('user_role').insertMany([
      // ADMIN
      { user_id: users.insertedIds[0], role_id: roles.insertedIds[0], org_unit_id: null }, // admin
      
      // STAFF
      { user_id: users.insertedIds[1], role_id: roles.insertedIds[3], org_unit_id: orgUnits.insertedIds[0] }, // staff_ctsv -> CTSV
      { user_id: users.insertedIds[2], role_id: roles.insertedIds[3], org_unit_id: orgUnits.insertedIds[2] }, // staff_doan -> Đoàn
      { user_id: users.insertedIds[3], role_id: roles.insertedIds[3], org_unit_id: orgUnits.insertedIds[0] }, // staff_khoa -> Khoa CNTT
      
      // TEACHER
      { user_id: users.insertedIds[4], role_id: roles.insertedIds[1], org_unit_id: orgUnits.insertedIds[0] }, // teacher1
      { user_id: users.insertedIds[5], role_id: roles.insertedIds[1], org_unit_id: orgUnits.insertedIds[0] }, // teacher2
      
      // STUDENT
      { user_id: users.insertedIds[6], role_id: roles.insertedIds[2], org_unit_id: null }, // student1
      { user_id: users.insertedIds[7], role_id: roles.insertedIds[2], org_unit_id: null }, // student2_monitor (lớp trưởng)
      { user_id: users.insertedIds[8], role_id: roles.insertedIds[2], org_unit_id: null }, // student3
      { user_id: users.insertedIds[9], role_id: roles.insertedIds[2], org_unit_id: null }  // student4
    ]);
    console.log(`   ✅ ${userRoles.insertedCount} user roles`);
    
    // 14. USER_ACTION_OVERRIDE
    console.log('📝 User Action Overrides...');
    const userActionOverrides = await db.collection('user_action_override').insertMany([
      {
        user_id: users.insertedIds[1],
        user_role_id: userRoles.insertedIds[1],
        action_id: actions.insertedIds[2],
        is_granted: true,
        note: 'Chỉ cho phép xem và thêm',
        granted_by: users.insertedIds[0],
        granted_at: new Date()
      }
    ]);
    console.log(`   ✅ ${userActionOverrides.insertedCount} user action overrides`);
    
    // 15. ACTIVITY
    console.log('📝 Activities...');
    const activities = await db.collection('activity').insertMany([
      {
        org_unit_id: orgUnits.insertedIds[0],
        field_id: fields.insertedIds[0],
        title: 'AI Seminar',
        description: 'Introduction to Artificial Intelligence',
        location: 'Hall A',
        start_time: new Date('2025-10-01T09:00:00'),
        end_time: new Date('2025-10-01T11:00:00'),
        start_time_updated: new Date('2025-09-30T10:00:00'),
        end_time_updated: new Date('2025-09-30T10:30:00'),
        capacity: 200,
        qr_code: 'QRCODE123',
        registration_open: new Date('2025-09-20T00:00:00'),
        registration_close: new Date('2025-09-30T23:59:59'),
        activity_image: '',
        requires_approval: true
      },
      {
        org_unit_id: orgUnits.insertedIds[1],
        field_id: fields.insertedIds[1],
        title: 'Machine Learning Workshop',
        description: 'Hands-on ML workshop',
        location: 'Lab B',
        start_time: new Date('2025-11-05T14:00:00'),
        end_time: new Date('2025-11-05T17:00:00'),
        start_time_updated: new Date('2025-11-01T10:00:00'),
        end_time_updated: new Date('2025-11-01T10:30:00'),
        capacity: 50,
        qr_code: 'QRCODE456',
        registration_open: new Date('2025-10-15T00:00:00'),
        registration_close: new Date('2025-11-03T23:59:59'),
        activity_image: '',
        requires_approval: false
      }
    ]);
    console.log(`   ✅ ${activities.insertedCount} activities`);
    
    // 16. ACTIVITY_REGISTRATION
    console.log('📝 Activity Registrations...');
    const registrations = await db.collection('activity_registration').insertMany([
      {
        activity_id: activities.insertedIds[0],
        student_id: studentProfiles.insertedIds[0],
        registered_at: new Date('2025-09-25T08:00:00')
      },
      {
        activity_id: activities.insertedIds[1],
        student_id: studentProfiles.insertedIds[1],
        registered_at: new Date('2025-10-20T10:00:00')
      }
    ]);
    console.log(`   ✅ ${registrations.insertedCount} registrations`);
    
    // 17. ACTIVITY_ELIGIBLITY
    console.log('📝 Activity Eligibilities...');
    const eligibilities = await db.collection('activity_eligiblity').insertMany([
      { activity_id: activities.insertedIds[0], type: 'cohort', reference_id: cohorts.insertedIds[0] },
      { activity_id: activities.insertedIds[1], type: 'falcuty', reference_id: faculties.insertedIds[0] }
    ]);
    console.log(`   ✅ ${eligibilities.insertedCount} eligibilities`);
    
    // 18. ATTENDANCE
    console.log('📝 Attendances...');
    const attendances = await db.collection('attendance').insertMany([
      {
        student_id: studentProfiles.insertedIds[0],
        activity_id: activities.insertedIds[0],
        scanned_at: new Date('2025-10-01T09:10:00'),
        status: 'present',
        verified: true,
        verified_at: new Date('2025-10-01T09:30:00'),
        points: 10,
        feedback: 'Good activity',
        feedback_time: new Date('2025-10-01T10:00:00')
      },
      {
        student_id: studentProfiles.insertedIds[1],
        activity_id: activities.insertedIds[1],
        scanned_at: new Date('2025-11-05T14:15:00'),
        status: 'present',
        verified: true,
        verified_at: new Date('2025-11-05T14:30:00'),
        points: 8,
        feedback: 'Very informative',
        feedback_time: new Date('2025-11-05T16:00:00')
      }
    ]);
    console.log(`   ✅ ${attendances.insertedCount} attendances`);
    
    // 19. EVIDENCE
    console.log('📝 Evidences...');
    const evidences = await db.collection('evidence').insertMany([
      {
        student_id: studentProfiles.insertedIds[0],
        title: 'Research Report on AI',
        file_url: 'https://example.com/report.pdf',
        submitted_at: new Date('2025-09-20T12:00:00'),
        status: 'pending',
        verified_at: null,
        self_point: 5,
        class_point: 3,
        faculty_point: 2
      },
      {
        student_id: studentProfiles.insertedIds[1],
        title: 'ML Project Documentation',
        file_url: 'https://example.com/ml-project.pdf',
        submitted_at: new Date('2025-10-15T14:00:00'),
        status: 'approved',
        verified_at: new Date('2025-10-20T10:00:00'),
        self_point: 8,
        class_point: 7,
        faculty_point: 9
      }
    ]);
    console.log(`   ✅ ${evidences.insertedCount} evidences`);
    
    // 20. STUDENT_FEEDBACK
    console.log('📝 Student Feedbacks...');
    const feedbacks = await db.collection('student_feedback').insertMany([
      {
        activity_id: activities.insertedIds[0],
        student_id: studentProfiles.insertedIds[0],
        comment: 'Buổi hội thảo rất bổ ích, các kiến thức AI được trình bày dễ hiểu và có nhiều ví dụ thực tế.',
        rating: 5,
        submitted_at: new Date('2025-10-01T11:30:00')
      },
      {
        activity_id: activities.insertedIds[1],
        student_id: studentProfiles.insertedIds[1],
        comment: 'Workshop hay, nên tổ chức thêm nhiều buổi',
        rating: 4,
        submitted_at: new Date('2025-11-05T17:30:00')
      }
    ]);
    console.log(`   ✅ ${feedbacks.insertedCount} feedbacks`);
    
    // 21. STUDENT_COHORT
    console.log('📝 Student Cohorts...');
    const studentCohorts = await db.collection('student_cohort').insertMany([
      { student_id: studentProfiles.insertedIds[0], cohort_id: cohorts.insertedIds[0], type: 'official' },
      { student_id: studentProfiles.insertedIds[1], cohort_id: cohorts.insertedIds[1], type: 'official' },
      { student_id: studentProfiles.insertedIds[2], cohort_id: cohorts.insertedIds[2], type: 'official' }
    ]);
    console.log(`   ✅ ${studentCohorts.insertedCount} student cohorts`);
    
    // 22. PVCD_RECORD
    console.log('📝 PVCD Records...');
    const pvcdRecords = await db.collection('pvcd_record').insertMany([
      {
        student_id: studentProfiles.insertedIds[0],
        year: 2025,
        start_year: new Date('2021-09-01'),
        end_year: new Date('2025-06-30'),
        total_point: 89.5
      },
      {
        student_id: studentProfiles.insertedIds[1],
        year: 2025,
        start_year: new Date('2022-09-01'),
        end_year: new Date('2025-06-30'),
        total_point: 92.3
      }
    ]);
    console.log(`   ✅ ${pvcdRecords.insertedCount} PVCD records`);
    
    // 23. POST
    console.log('📝 Posts...');
    const posts = await db.collection('post').insertMany([
      {
        activity_id: activities.insertedIds[0],
        description: 'Summary of AI Seminar',
        created_at: new Date('2025-10-01T12:00:00')
      },
      {
        activity_id: activities.insertedIds[1],
        description: 'ML Workshop was a great success!',
        created_at: new Date('2025-11-05T18:00:00')
      }
    ]);
    console.log(`   ✅ ${posts.insertedCount} posts`);
    
    console.log('\n' + '='.repeat(70));
    console.log('🎉 HOÀN TẤT!');
    console.log('='.repeat(70));
    console.log('\n💡 DỮ LIỆU MẪU - 10 USERS CHO 4 ROLES:');
    console.log('\n👑 ADMIN (1):');
    console.log('   • admin / admin123');
    console.log('\n👔 STAFF (3):');
    console.log('   • staff_ctsv / staff123 (Phòng CTSV)');
    console.log('   • staff_doan / staff123 (Đoàn trường)');
    console.log('   • staff_khoa / staff123 (Khoa CNTT)');
    console.log('\n👨‍🏫 TEACHER (2):');
    console.log('   • teacher1 / teacher123');
    console.log('   • teacher2 / teacher123');
    console.log('\n👨‍🎓 STUDENT (4):');
    console.log('   • student1 / student123 (102220001)');
    console.log('   • student2_monitor / student123 (102220002 - LỚP TRƯỞNG ⭐)');
    console.log('   • student3 / student123 (102220003)');
    console.log('   • student4 / student123 (102220004)');
    console.log('\n📊 THỐNG KÊ:');
    console.log(`   • Users: 10`);
    console.log(`   • Roles: 4 (admin, staff, teacher, student)`);
    console.log(`   • Staff Profiles: 5`);
    console.log(`   • Student Profiles: 4 (1 lớp trưởng)`);
    console.log(`   • Classes: 3`);
    console.log(`   • Activities: 2`);
    console.log('\n✅ TIẾP THEO: Chạy node seed_permissions.js để tạo permissions!\n');
    
  } catch (error) {
    console.error('\n❌ LỖI:', error);
    throw error;
  }
}

async function main() {
  try {
    await connectDB();
    await seedData();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Đã đóng kết nối\n');
  }
}

main();


