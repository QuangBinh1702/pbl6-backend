/**
 * Seed script for new permission system
 * Creates sample data: users, roles, actions, and relationships
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const User = require('./src/models/user.model');
const Role = require('./src/models/role.model');
const Action = require('./src/models/action.model');
const UserRole = require('./src/models/user_role.model');
const RoleAction = require('./src/models/role_action.model');
const UserActionOverride = require('./src/models/user_action_override.model');
const StudentProfile = require('./src/models/student_profile.model');
const StaffProfile = require('./src/models/staff_profile.model');
const OrgUnit = require('./src/models/org_unit.model');
const Class = require('./src/models/class.model');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

async function seedPermissionData() {
  try {
    console.log('\n' + '='.repeat(70));
    console.log('🌱 SEED NEW PERMISSION SYSTEM DATA');
    console.log('='.repeat(70) + '\n');

    // Connect to database
    console.log(`${colors.cyan}⏳ Connecting to MongoDB...${colors.reset}`);
    await mongoose.connect(process.env.MONGODB_URI, { 
      dbName: 'Community_Activity_Management' 
    });
    console.log(`${colors.green}✅ Connected!${colors.reset}\n`);

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log(`${colors.yellow}⚠️  Clearing existing permission data...${colors.reset}`);
    await UserActionOverride.deleteMany({});
    await RoleAction.deleteMany({});
    await UserRole.deleteMany({});
    await Action.deleteMany({});
    await Role.deleteMany({});
    // Don't delete users and profiles - they might be imported from JSON
    console.log(`${colors.green}✅ Cleared!${colors.reset}\n`);

    // Step 1: Create Roles
    console.log(`${colors.cyan}Step 1: Creating roles...${colors.reset}`);
    const roles = await Role.insertMany([
      { name: 'admin', description: 'Administrator - full system access' },
      { name: 'ctsv', description: 'Phòng Công tác Sinh viên' },
      { name: 'doantruong', description: 'Đoàn trường' },
      { name: 'khoa', description: 'Khoa/Liên chi đoàn' },
      { name: 'clb', description: 'Câu lạc bộ' },
      { name: 'student', description: 'Sinh viên' }
    ]);
    console.log(`  Created ${roles.length} roles`);
    
    const roleMap = {};
    roles.forEach(r => roleMap[r.name] = r);
    console.log();

    // Step 2: Create Actions
    console.log(`${colors.cyan}Step 2: Creating actions...${colors.reset}`);
    const actions = await Action.insertMany([
      // Activity actions
      { action_code: 'VIEW', action_name: 'Xem hoạt động', resource: 'activity', description: 'Xem danh sách và chi tiết hoạt động', is_active: true },
      { action_code: 'CREATE', action_name: 'Tạo hoạt động', resource: 'activity', description: 'Tạo hoạt động mới', is_active: true },
      { action_code: 'UPDATE', action_name: 'Cập nhật hoạt động', resource: 'activity', description: 'Chỉnh sửa thông tin hoạt động', is_active: true },
      { action_code: 'DELETE', action_name: 'Xóa hoạt động', resource: 'activity', description: 'Xóa hoạt động', is_active: true },
      { action_code: 'APPROVE', action_name: 'Duyệt hoạt động', resource: 'activity', description: 'Phê duyệt hoạt động', is_active: true },
      { action_code: 'REJECT', action_name: 'Từ chối hoạt động', resource: 'activity', description: 'Từ chối hoạt động', is_active: true },
      
      // Student actions
      { action_code: 'VIEW', action_name: 'Xem sinh viên', resource: 'student', description: 'Xem thông tin sinh viên', is_active: true },
      { action_code: 'CREATE', action_name: 'Thêm sinh viên', resource: 'student', description: 'Thêm sinh viên mới', is_active: true },
      { action_code: 'UPDATE', action_name: 'Cập nhật sinh viên', resource: 'student', description: 'Chỉnh sửa thông tin sinh viên', is_active: true },
      { action_code: 'DELETE', action_name: 'Xóa sinh viên', resource: 'student', description: 'Xóa sinh viên', is_active: true },
      
      // Registration actions
      { action_code: 'VIEW', action_name: 'Xem đăng ký', resource: 'registration', description: 'Xem danh sách đăng ký', is_active: true },
      { action_code: 'CREATE', action_name: 'Đăng ký hoạt động', resource: 'registration', description: 'Đăng ký tham gia hoạt động', is_active: true },
      { action_code: 'APPROVE', action_name: 'Duyệt đăng ký', resource: 'registration', description: 'Phê duyệt đăng ký', is_active: true },
      { action_code: 'REJECT', action_name: 'Từ chối đăng ký', resource: 'registration', description: 'Từ chối đăng ký', is_active: true },
      
      // Attendance actions
      { action_code: 'VIEW', action_name: 'Xem điểm danh', resource: 'attendance', description: 'Xem danh sách điểm danh', is_active: true },
      { action_code: 'UPDATE', action_name: 'Cập nhật điểm danh', resource: 'attendance', description: 'Điểm danh sinh viên', is_active: true },
      
      // Report actions
      { action_code: 'VIEW', action_name: 'Xem báo cáo', resource: 'report', description: 'Xem các báo cáo thống kê', is_active: true },
      { action_code: 'EXPORT', action_name: 'Xuất báo cáo', resource: 'report', description: 'Xuất file báo cáo', is_active: true }
    ]);
    console.log(`  Created ${actions.length} actions`);
    
    // Build action map for easy lookup
    const actionMap = {};
    actions.forEach(a => {
      if (!actionMap[a.resource]) actionMap[a.resource] = {};
      actionMap[a.resource][a.action_code] = a;
    });
    console.log();

    // Step 3: Create Role-Action mappings
    console.log(`${colors.cyan}Step 3: Creating role-action mappings...${colors.reset}`);
    
    const roleActionMappings = [];
    
    // Admin - full access to everything
    const adminActions = actions.filter(a => a.is_active);
    adminActions.forEach(action => {
      roleActionMappings.push({ role_id: roleMap.admin._id, action_id: action._id });
    });
    
    // CTSV - can manage activities, students, view reports
    const ctsvResources = ['activity', 'student', 'registration', 'attendance', 'report'];
    ctsvResources.forEach(resource => {
      if (actionMap[resource]) {
        Object.values(actionMap[resource]).forEach(action => {
          roleActionMappings.push({ role_id: roleMap.ctsv._id, action_id: action._id });
        });
      }
    });
    
    // Khoa - can create activities, view students, approve registrations
    if (actionMap.activity) {
      ['VIEW', 'CREATE', 'UPDATE', 'APPROVE', 'REJECT'].forEach(code => {
        if (actionMap.activity[code]) {
          roleActionMappings.push({ role_id: roleMap.khoa._id, action_id: actionMap.activity[code]._id });
        }
      });
    }
    if (actionMap.student && actionMap.student.VIEW) {
      roleActionMappings.push({ role_id: roleMap.khoa._id, action_id: actionMap.student.VIEW._id });
    }
    if (actionMap.registration) {
      ['VIEW', 'APPROVE', 'REJECT'].forEach(code => {
        if (actionMap.registration[code]) {
          roleActionMappings.push({ role_id: roleMap.khoa._id, action_id: actionMap.registration[code]._id });
        }
      });
    }
    
    // Student - can view activities, register, view own attendance
    if (actionMap.activity && actionMap.activity.VIEW) {
      roleActionMappings.push({ role_id: roleMap.student._id, action_id: actionMap.activity.VIEW._id });
    }
    if (actionMap.registration) {
      ['VIEW', 'CREATE'].forEach(code => {
        if (actionMap.registration[code]) {
          roleActionMappings.push({ role_id: roleMap.student._id, action_id: actionMap.registration[code]._id });
        }
      });
    }
    if (actionMap.attendance && actionMap.attendance.VIEW) {
      roleActionMappings.push({ role_id: roleMap.student._id, action_id: actionMap.attendance.VIEW._id });
    }
    
    await RoleAction.insertMany(roleActionMappings);
    console.log(`  Created ${roleActionMappings.length} role-action mappings`);
    console.log();

    // Step 4: Create sample users if they don't exist
    console.log(`${colors.cyan}Step 4: Checking/creating sample users...${colors.reset}`);
    let adminUser = await User.findOne({ username: 'admin' });
    if (!adminUser) {
      adminUser = await User.create({
        username: 'admin',
        password_hash: 'hashed_password_here', // In production, use bcrypt
        active: true,
        isLocked: false
      });
      console.log(`  Created admin user`);
    } else {
      console.log(`  Admin user already exists`);
    }
    
    let studentUser = await User.findOne({ username: 'student001' });
    if (!studentUser) {
      studentUser = await User.create({
        username: 'student001',
        password_hash: 'hashed_password_here',
        active: true,
        isLocked: false
      });
      console.log(`  Created student user`);
    } else {
      console.log(`  Student user already exists`);
    }
    
    let teacherUser = await User.findOne({ username: 'teacher001' });
    if (!teacherUser) {
      teacherUser = await User.create({
        username: 'teacher001',
        password_hash: 'hashed_password_here',
        active: true,
        isLocked: false
      });
      console.log(`  Created teacher user`);
    } else {
      console.log(`  Teacher user already exists`);
    }
    console.log();

    // Step 5: Create User-Role mappings
    console.log(`${colors.cyan}Step 5: Creating user-role mappings...${colors.reset}`);
    
    const existingAdminRole = await UserRole.findOne({ user_id: adminUser._id, role_id: roleMap.admin._id });
    if (!existingAdminRole) {
      await UserRole.create({ user_id: adminUser._id, role_id: roleMap.admin._id });
      console.log(`  Assigned admin role to admin user`);
    }
    
    const existingStudentRole = await UserRole.findOne({ user_id: studentUser._id, role_id: roleMap.student._id });
    if (!existingStudentRole) {
      await UserRole.create({ user_id: studentUser._id, role_id: roleMap.student._id });
      console.log(`  Assigned student role to student user`);
    }
    
    const existingTeacherRole = await UserRole.findOne({ user_id: teacherUser._id, role_id: roleMap.khoa._id });
    if (!existingTeacherRole) {
      await UserRole.create({ user_id: teacherUser._id, role_id: roleMap.khoa._id });
      console.log(`  Assigned khoa role to teacher user`);
    }
    console.log();

    // Step 6: Create student profile with class monitor
    console.log(`${colors.cyan}Step 6: Creating student profile...${colors.reset}`);
    let studentProfile = await StudentProfile.findOne({ user_id: studentUser._id });
    if (!studentProfile) {
      studentProfile = await StudentProfile.create({
        user_id: studentUser._id,
        student_number: 'STU001',
        full_name: 'Nguyen Van A',
        email: 'student001@example.com',
        phone: '0123456789',
        enrollment_year: 2021,
        isClassMonitor: true // Make this student a class monitor
      });
      console.log(`  Created student profile (class monitor)`);
    } else {
      console.log(`  Student profile already exists`);
    }
    console.log();

    // Step 7: Create a user action override example
    console.log(`${colors.cyan}Step 7: Creating sample override...${colors.reset}`);
    if (actionMap.activity && actionMap.activity.DELETE) {
      const existingOverride = await UserActionOverride.findOne({
        user_id: teacherUser._id,
        action_id: actionMap.activity.DELETE._id
      });
      
      if (!existingOverride) {
        await UserActionOverride.create({
          user_id: teacherUser._id,
          action_id: actionMap.activity.DELETE._id,
          is_granted: false // Revoke DELETE permission for this teacher
        });
        console.log(`  Created override: teacher001 CANNOT delete activities`);
      }
    }
    console.log();

    // Summary
    console.log('='.repeat(70));
    console.log(`${colors.green}✅ SEED COMPLETED SUCCESSFULLY!${colors.reset}`);
    console.log('='.repeat(70));
    
    console.log('\n📊 Summary:');
    console.log(`  Roles: ${await Role.countDocuments()}`);
    console.log(`  Actions: ${await Action.countDocuments()}`);
    console.log(`  Role-Action mappings: ${await RoleAction.countDocuments()}`);
    console.log(`  Users: ${await User.countDocuments()}`);
    console.log(`  User-Role mappings: ${await UserRole.countDocuments()}`);
    console.log(`  User overrides: ${await UserActionOverride.countDocuments()}`);
    console.log(`  Student profiles: ${await StudentProfile.countDocuments()}`);
    
    console.log('\n👤 Test users:');
    console.log('  - admin (role: admin)');
    console.log('  - student001 (role: student, isClassMonitor: true)');
    console.log('  - teacher001 (role: khoa, override: cannot delete activities)');
    
    console.log('\n🧪 Next step:');
    console.log('  Run: node test_new_permission_system.js');
    console.log();

  } catch (error) {
    console.error(`\n${colors.red}❌ ERROR: ${error.message}${colors.reset}`);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log(`${colors.cyan}👋 Connection closed${colors.reset}\n`);
  }
}

seedPermissionData();

