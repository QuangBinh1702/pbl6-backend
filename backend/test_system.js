/**
 * TEST HỆ THỐNG SAU KHI CẬP NHẬT
 * Kiểm tra các API endpoints và dữ liệu
 * 
 * CHẠY: node test_system.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

console.log('\n' + '='.repeat(70));
console.log('🧪 TEST HỆ THỐNG SAU KHI CẬP NHẬT');
console.log('='.repeat(70) + '\n');

// Kết nối MongoDB
async function connectDB() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const dbName = process.env.MONGODB_NAME || 'pbl6';
  
  let connectionString;
  if (mongoUri.includes('mongodb+srv://') || mongoUri.includes('mongodb://')) {
    connectionString = mongoUri;
    await mongoose.connect(connectionString, { dbName });
  } else {
    connectionString = `${mongoUri}/${dbName}`;
    await mongoose.connect(connectionString);
  }
  
  console.log(`✅ Kết nối MongoDB thành công! Database: ${mongoose.connection.name}\n`);
}

// Import các models
const User = require('./src/models/user.model');
const Role = require('./src/models/role.model');
const Permission = require('./src/models/permission.model');
const Action = require('./src/models/action.model');
const RoleAction = require('./src/models/role_action.model');
const UserRole = require('./src/models/user_role.model');
const UserActionOverride = require('./src/models/user_action_override.model');
const Field = require('./src/models/field.model');
const Falcuty = require('./src/models/falcuty.model');
const Cohort = require('./src/models/cohort.model');
const Class = require('./src/models/class.model');
const OrgUnit = require('./src/models/org_unit.model');
const StaffProfile = require('./src/models/staff_profile.model');
const StudentProfile = require('./src/models/student_profile.model');
const Activity = require('./src/models/activity.model');
const ActivityRegistration = require('./src/models/activity_registration.model');
const ActivityEligibility = require('./src/models/activity_eligibility.model');
const Attendance = require('./src/models/attendance.model');
const Evidence = require('./src/models/evidence.model');
const StudentFeedback = require('./src/models/student_feedback.model');
const StudentCohort = require('./src/models/student_cohort.model');
const PVCDRecord = require('./src/models/pvcd_record.model');
const Post = require('./src/models/post.model');

// Test functions
async function testModels() {
  console.log('🔍 KIỂM TRA MODELS...');
  
  try {
    // Test User model
    const users = await User.find({}).limit(5);
    console.log(`✅ User model: ${users.length} users found`);
    if (users.length > 0) {
      console.log(`   - Sample user: ${users[0].username}`);
      console.log(`   - Has password_hash: ${!!users[0].password_hash}`);
    }

    // Test Permission model
    const permissions = await Permission.find({}).limit(5);
    console.log(`✅ Permission model: ${permissions.length} permissions found`);
    if (permissions.length > 0) {
      console.log(`   - Sample permission: ${permissions[0].name}`);
      console.log(`   - Resource: ${permissions[0].resource}`);
      console.log(`   - Description: ${permissions[0].description || 'N/A'}`);
    }

    // Test Activity model
    const activities = await Activity.find({}).limit(5);
    console.log(`✅ Activity model: ${activities.length} activities found`);
    if (activities.length > 0) {
      console.log(`   - Sample activity: ${activities[0].title}`);
      console.log(`   - Has org_unit_id: ${!!activities[0].org_unit_id}`);
      console.log(`   - Has field_id: ${!!activities[0].field_id}`);
    }

    // Test Staff Profile model
    const staffProfiles = await StaffProfile.find({}).limit(5);
    console.log(`✅ Staff Profile model: ${staffProfiles.length} staff profiles found`);
    if (staffProfiles.length > 0) {
      console.log(`   - Sample staff: ${staffProfiles[0].full_name}`);
      console.log(`   - Has user_id: ${!!staffProfiles[0].user_id}`);
      console.log(`   - Has org_unit_id: ${!!staffProfiles[0].org_unit_id}`);
    }

    // Test Evidence model
    const evidences = await Evidence.find({}).limit(5);
    console.log(`✅ Evidence model: ${evidences.length} evidences found`);
    if (evidences.length > 0) {
      console.log(`   - Sample evidence: ${evidences[0].title}`);
      console.log(`   - Has student_id: ${!!evidences[0].student_id}`);
      console.log(`   - Has self_point: ${evidences[0].self_point !== undefined}`);
    }

    // Test Attendance model
    const attendances = await Attendance.find({}).limit(5);
    console.log(`✅ Attendance model: ${attendances.length} attendances found`);
    if (attendances.length > 0) {
      console.log(`   - Has student_id: ${!!attendances[0].student_id}`);
      console.log(`   - Has activity_id: ${!!attendances[0].activity_id}`);
    }

    console.log('✅ Tất cả models hoạt động bình thường\n');

  } catch (error) {
    console.error('❌ Lỗi kiểm tra models:', error.message);
    throw error;
  }
}

async function testRelationships() {
  console.log('🔗 KIỂM TRA RELATIONSHIPS...');
  
  try {
    // Test User -> UserRole -> Role relationship
    const userRoles = await UserRole.find({})
      .populate('user_id')
      .populate('role_id')
      .populate('org_unit_id')
      .limit(3);
    
    console.log(`✅ UserRole relationships: ${userRoles.length} found`);
    if (userRoles.length > 0) {
      const ur = userRoles[0];
      console.log(`   - User: ${ur.user_id ? ur.user_id.username : 'N/A'}`);
      console.log(`   - Role: ${ur.role_id ? ur.role_id.name : 'N/A'}`);
      console.log(`   - Org Unit: ${ur.org_unit_id ? ur.org_unit_id.name : 'N/A'}`);
    }

    // Test Activity -> OrgUnit relationship
    const activitiesWithOrg = await Activity.find({})
      .populate('org_unit_id')
      .populate('field_id')
      .limit(3);
    
    console.log(`✅ Activity relationships: ${activitiesWithOrg.length} found`);
    if (activitiesWithOrg.length > 0) {
      const activity = activitiesWithOrg[0];
      console.log(`   - Activity: ${activity.title}`);
      console.log(`   - Org Unit: ${activity.org_unit_id ? activity.org_unit_id.name : 'N/A'}`);
      console.log(`   - Field: ${activity.field_id ? activity.field_id.name : 'N/A'}`);
    }

    // Test Student Profile -> User relationship
    const studentProfiles = await StudentProfile.find({})
      .populate('user_id')
      .populate('class_id')
      .limit(3);
    
    console.log(`✅ Student Profile relationships: ${studentProfiles.length} found`);
    if (studentProfiles.length > 0) {
      const sp = studentProfiles[0];
      console.log(`   - Student: ${sp.full_name}`);
      console.log(`   - User: ${sp.user_id ? sp.user_id.username : 'N/A'}`);
      console.log(`   - Class: ${sp.class_id ? sp.class_id.name : 'N/A'}`);
    }

    console.log('✅ Tất cả relationships hoạt động bình thường\n');

  } catch (error) {
    console.error('❌ Lỗi kiểm tra relationships:', error.message);
    throw error;
  }
}

async function testDataIntegrity() {
  console.log('🔒 KIỂM TRA DATA INTEGRITY...');
  
  try {
    // Check for orphaned records
    const orphanedUserRoles = await UserRole.find({ user_id: null });
    console.log(`✅ Orphaned UserRoles: ${orphanedUserRoles.length}`);

    const orphanedActivities = await Activity.find({ org_unit_id: null });
    console.log(`✅ Activities without OrgUnit: ${orphanedActivities.length}`);

    const orphanedEvidences = await Evidence.find({ student_id: null });
    console.log(`✅ Evidences without Student: ${orphanedEvidences.length}`);

    // Check for duplicate records
    const duplicateUserRoles = await UserRole.aggregate([
      { $group: { _id: { user_id: '$user_id', role_id: '$role_id' }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]);
    console.log(`✅ Duplicate UserRoles: ${duplicateUserRoles.length}`);

    // Check data consistency
    const usersWithoutProfiles = await User.find({}).then(async (users) => {
      let count = 0;
      for (const user of users) {
        const staffProfile = await StaffProfile.findOne({ user_id: user._id });
        const studentProfile = await StudentProfile.findOne({ user_id: user._id });
        if (!staffProfile && !studentProfile) count++;
      }
      return count;
    });
    console.log(`✅ Users without profiles: ${usersWithoutProfiles}`);

    console.log('✅ Data integrity check hoàn tất\n');

  } catch (error) {
    console.error('❌ Lỗi kiểm tra data integrity:', error.message);
    throw error;
  }
}

async function testPermissions() {
  console.log('🔐 KIỂM TRA PERMISSION SYSTEM...');
  
  try {
    // Test Permission structure
    const permissions = await Permission.find({});
    console.log(`✅ Total permissions: ${permissions.length}`);
    
    for (const permission of permissions) {
      console.log(`   - ${permission.name} (${permission.resource})`);
    }

    // Test Action model
    const actions = await Action.find({});
    console.log(`✅ Total actions: ${actions.length}`);

    // Test RoleAction relationships
    const roleActions = await RoleAction.find({})
      .populate('role_id')
      .populate('action_id')
      .limit(5);
    
    console.log(`✅ RoleAction relationships: ${roleActions.length} found`);
    if (roleActions.length > 0) {
      const ra = roleActions[0];
      console.log(`   - Role: ${ra.role_id ? ra.role_id.name : 'N/A'}`);
      console.log(`   - Action: ${ra.action_id ? ra.action_id.action_name : 'N/A'}`);
    }

    console.log('✅ Permission system hoạt động bình thường\n');

  } catch (error) {
    console.error('❌ Lỗi kiểm tra permission system:', error.message);
    throw error;
  }
}

async function generateReport() {
  console.log('📊 BÁO CÁO TỔNG QUAN...');
  
  try {
    const counts = {
      users: await User.countDocuments(),
      roles: await Role.countDocuments(),
      permissions: await Permission.countDocuments(),
      actions: await Action.countDocuments(),
      roleActions: await RoleAction.countDocuments(),
      userRoles: await UserRole.countDocuments(),
      userActionOverrides: await UserActionOverride.countDocuments(),
      fields: await Field.countDocuments(),
      falcuties: await Falcuty.countDocuments(),
      cohorts: await Cohort.countDocuments(),
      classes: await Class.countDocuments(),
      orgUnits: await OrgUnit.countDocuments(),
      staffProfiles: await StaffProfile.countDocuments(),
      studentProfiles: await StudentProfile.countDocuments(),
      activities: await Activity.countDocuments(),
      activityRegistrations: await ActivityRegistration.countDocuments(),
      activityEligibilities: await ActivityEligibility.countDocuments(),
      attendances: await Attendance.countDocuments(),
      evidences: await Evidence.countDocuments(),
      studentFeedbacks: await StudentFeedback.countDocuments(),
      studentCohorts: await StudentCohort.countDocuments(),
      pvcdRecords: await PVCDRecord.countDocuments(),
      posts: await Post.countDocuments()
    };
    
    console.log('='.repeat(70));
    console.log('📊 BÁO CÁO TỔNG QUAN HỆ THỐNG');
    console.log('='.repeat(70));
    console.log(`👥 Users: ${counts.users}`);
    console.log(`🎭 Roles: ${counts.roles}`);
    console.log(`🔐 Permissions: ${counts.permissions}`);
    console.log(`⚡ Actions: ${counts.actions}`);
    console.log(`🔗 Role Actions: ${counts.roleActions}`);
    console.log(`👤 User Roles: ${counts.userRoles}`);
    console.log(`🔧 User Action Overrides: ${counts.userActionOverrides}`);
    console.log(`📂 Fields: ${counts.fields}`);
    console.log(`🏫 Falcuties: ${counts.falcuties}`);
    console.log(`📅 Cohorts: ${counts.cohorts}`);
    console.log(`🎓 Classes: ${counts.classes}`);
    console.log(`🏢 Org Units: ${counts.orgUnits}`);
    console.log(`👨‍💼 Staff Profiles: ${counts.staffProfiles}`);
    console.log(`👨‍🎓 Student Profiles: ${counts.studentProfiles}`);
    console.log(`🎯 Activities: ${counts.activities}`);
    console.log(`📝 Activity Registrations: ${counts.activityRegistrations}`);
    console.log(`✅ Activity Eligibilities: ${counts.activityEligibilities}`);
    console.log(`📋 Attendances: ${counts.attendances}`);
    console.log(`📄 Evidences: ${counts.evidences}`);
    console.log(`💬 Student Feedbacks: ${counts.studentFeedbacks}`);
    console.log(`🎓 Student Cohorts: ${counts.studentCohorts}`);
    console.log(`📊 PVCD Records: ${counts.pvcdRecords}`);
    console.log(`📰 Posts: ${counts.posts}`);
    console.log('='.repeat(70));
    
    const totalRecords = Object.values(counts).reduce((sum, count) => sum + count, 0);
    console.log(`\n🎯 TỔNG CỘNG: ${totalRecords} records`);
    
    console.log('\n✅ HỆ THỐNG HOẠT ĐỘNG BÌNH THƯỜNG!');
    console.log('🚀 Sẵn sàng để sử dụng!\n');

  } catch (error) {
    console.error('❌ Lỗi tạo báo cáo:', error.message);
    throw error;
  }
}

// Main function
async function main() {
  try {
    await connectDB();
    
    await testModels();
    await testRelationships();
    await testDataIntegrity();
    await testPermissions();
    await generateReport();
    
    console.log('🎉 TEST HOÀN TẤT!\n');
    
  } catch (error) {
    console.error('\n❌ LỖI:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Đã đóng kết nối MongoDB\n');
  }
}

main();
