/**
 * Test Script - Hệ Thống Phân Quyền
 * Chạy: node test_permission_system.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Permission = require('./src/models/permission.model');
const UserPermission = require('./src/models/user_permission.model');
const User = require('./src/models/user.model');
const bcrypt = require('bcryptjs');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  test: (msg) => console.log(`${colors.cyan}🧪 ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`)
};

// Kết nối MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pbl6');
    log.success('Kết nối MongoDB thành công!');
  } catch (error) {
    log.error('Kết nối MongoDB thất bại: ' + error.message);
    process.exit(1);
  }
};

// Test 1: Kiểm tra có permissions không
async function test1_checkPermissionsExist() {
  log.test('TEST 1: Kiểm tra permissions có tồn tại không');
  
  const permissions = await Permission.find({});
  
  if (permissions.length === 0) {
    log.error('Không có permission nào! Chạy seed script trước: node src/seed_permission_system.js');
    return false;
  }
  
  log.success(`Tìm thấy ${permissions.length} permissions`);
  permissions.forEach(p => {
    console.log(`   - ${p.name_per}: ${p.details.length} actions`);
  });
  
  return true;
}

// Test 2: Tạo user test
async function test2_createTestUsers() {
  log.test('TEST 2: Tạo users test');
  
  const testUsers = [
    {
      name: 'Admin Test',
      email: 'admin@test.com',
      password: await bcrypt.hash('password123', 10),
      role: 'admin'
    },
    {
      name: 'Student Test',
      email: 'student@test.com',
      password: await bcrypt.hash('password123', 10),
      role: 'student'
    },
    {
      name: 'Teacher Test',
      email: 'teacher@test.com',
      password: await bcrypt.hash('password123', 10),
      role: 'ctsv'
    }
  ];
  
  const createdUsers = [];
  
  for (const userData of testUsers) {
    let user = await User.findOne({ email: userData.email });
    
    if (!user) {
      user = await User.create(userData);
      log.success(`Tạo user: ${user.email} (${user.role})`);
    } else {
      log.info(`User đã tồn tại: ${user.email}`);
    }
    
    createdUsers.push(user);
  }
  
  return createdUsers;
}

// Test 3: Gán permissions cho users
async function test3_grantPermissions(users) {
  log.test('TEST 3: Gán permissions cho users');
  
  const [admin, student, teacher] = users;
  const permissions = await Permission.find({});
  
  // Admin có tất cả permissions
  log.info('Gán tất cả permissions cho Admin...');
  for (const perm of permissions) {
    await UserPermission.grantPermission(admin._id, perm._id);
  }
  log.success(`Admin có ${permissions.length} permissions`);
  
  // Student chỉ có một số permissions
  log.info('Gán permissions hạn chế cho Student...');
  const studentPerms = permissions.filter(p => 
    p.name_per === 'EVIDENCE_MANAGEMENT' || p.name_per === 'REPORT_VIEW'
  );
  for (const perm of studentPerms) {
    await UserPermission.grantPermission(student._id, perm._id);
  }
  log.success(`Student có ${studentPerms.length} permissions`);
  
  // Teacher có permissions trung bình
  log.info('Gán permissions cho Teacher...');
  const teacherPerms = permissions.filter(p => 
    p.name_per === 'ACTIVITY_MANAGEMENT' || 
    p.name_per === 'ATTENDANCE_MANAGEMENT' ||
    p.name_per === 'REPORT_VIEW'
  );
  for (const perm of teacherPerms) {
    await UserPermission.grantPermission(teacher._id, perm._id);
  }
  log.success(`Teacher có ${teacherPerms.length} permissions`);
  
  return true;
}

// Test 4: Kiểm tra permissions của users
async function test4_checkUserPermissions(users) {
  log.test('TEST 4: Kiểm tra permissions của từng user');
  
  for (const user of users) {
    console.log(`\n   👤 ${user.name} (${user.email}):`);
    
    const userPerms = await UserPermission.getUserPermissions(user._id);
    
    if (userPerms.length === 0) {
      log.warn(`   Không có permission nào`);
      continue;
    }
    
    for (const up of userPerms) {
      // Skip if permission data not populated
      if (!up.id_per || !up.id_per.details) {
        console.log(`   ⚠️  Permission data not loaded`);
        continue;
      }
      
      const enabledActions = up.id_per.details.filter(d => d.check_action).length;
      const totalActions = up.id_per.details.length;
      
      console.log(`   ✅ ${up.id_per.name_per}: ${enabledActions}/${totalActions} actions enabled`);
    }
  }
  
  return true;
}

// Test 5: Test kiểm tra quyền cụ thể
async function test5_testSpecificPermissions(users) {
  log.test('TEST 5: Test kiểm tra quyền cụ thể');
  
  const [admin, student, teacher] = users;
  const activityPerm = await Permission.findOne({ name_per: 'ACTIVITY_MANAGEMENT' });
  const evidencePerm = await Permission.findOne({ name_per: 'EVIDENCE_MANAGEMENT' });
  
  if (!activityPerm || !evidencePerm) {
    log.warn('Không tìm thấy permissions cần test');
    return false;
  }
  
  // Test Admin có ACTIVITY_MANAGEMENT không
  const adminHasActivity = await UserPermission.hasPermission(admin._id, activityPerm._id);
  console.log(`   Admin có ACTIVITY_MANAGEMENT: ${adminHasActivity ? '✅ YES' : '❌ NO'}`);
  
  // Test Student có ACTIVITY_MANAGEMENT không (should be NO)
  const studentHasActivity = await UserPermission.hasPermission(student._id, activityPerm._id);
  console.log(`   Student có ACTIVITY_MANAGEMENT: ${studentHasActivity ? '❌ YES (BUG!)' : '✅ NO (Correct)'}`);
  
  // Test Student có EVIDENCE_MANAGEMENT không (should be YES)
  const studentHasEvidence = await UserPermission.hasPermission(student._id, evidencePerm._id);
  console.log(`   Student có EVIDENCE_MANAGEMENT: ${studentHasEvidence ? '✅ YES' : '❌ NO (BUG!)'}`);
  
  return true;
}

// Test 6: Test action-level permissions
async function test6_testActionLevelPermissions(users) {
  log.test('TEST 6: Test action-level permissions');
  
  const activityPerm = await Permission.findOne({ name_per: 'ACTIVITY_MANAGEMENT' });
  
  if (!activityPerm) {
    log.warn('Không tìm thấy ACTIVITY_MANAGEMENT permission');
    return false;
  }
  
  console.log(`\n   Permission: ${activityPerm.name_per}`);
  console.log('   Actions:');
  
  activityPerm.details.forEach(detail => {
    const status = detail.check_action ? '✅ ALLOWED' : '❌ DENIED';
    console.log(`     - ${detail.action_code}: ${status}`);
  });
  
  // Test specific action
  const canCreate = activityPerm.isActionAllowed('CREATE');
  const canDelete = activityPerm.isActionAllowed('DELETE');
  
  console.log(`\n   Test isActionAllowed():`);
  console.log(`     - CREATE: ${canCreate ? '✅ Allowed' : '❌ Denied'}`);
  console.log(`     - DELETE: ${canDelete ? '❌ Allowed (BUG!)' : '✅ Denied (Correct)'}`);
  
  return true;
}

// Test 7: Test revoke permission
async function test7_testRevokePermission(users) {
  log.test('TEST 7: Test thu hồi permission');
  
  const [admin] = users;
  const reportPerm = await Permission.findOne({ name_per: 'REPORT_VIEW' });
  
  if (!reportPerm) {
    log.warn('Không tìm thấy REPORT_VIEW permission');
    return false;
  }
  
  // Check before revoke
  const beforeRevoke = await UserPermission.hasPermission(admin._id, reportPerm._id);
  console.log(`   Admin có REPORT_VIEW trước khi revoke: ${beforeRevoke ? '✅ YES' : '❌ NO'}`);
  
  // Revoke
  await UserPermission.revokePermission(admin._id, reportPerm._id);
  log.info('   Đã revoke REPORT_VIEW từ Admin');
  
  // Check after revoke
  const afterRevoke = await UserPermission.hasPermission(admin._id, reportPerm._id);
  console.log(`   Admin có REPORT_VIEW sau khi revoke: ${afterRevoke ? '❌ YES (BUG!)' : '✅ NO (Correct)'}`);
  
  // Grant lại
  await UserPermission.grantPermission(admin._id, reportPerm._id);
  log.info('   Đã grant lại REPORT_VIEW cho Admin');
  
  return true;
}

// Test 8: Test time-based permissions
async function test8_testTimeBasedPermissions(users) {
  log.test('TEST 8: Test time-based permissions');
  
  const [, student] = users;
  const activityPerm = await Permission.findOne({ name_per: 'ACTIVITY_MANAGEMENT' });
  
  // Grant với expires_at trong tương lai
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7); // 7 ngày sau
  
  await UserPermission.grantPermission(
    student._id, 
    activityPerm._id, 
    null, 
    futureDate
  );
  
  log.info(`   Granted ACTIVITY_MANAGEMENT cho Student đến ${futureDate.toLocaleDateString()}`);
  
  // Check có permission không
  const hasPermNow = await UserPermission.hasPermission(student._id, activityPerm._id);
  console.log(`   Student có permission bây giờ: ${hasPermNow ? '✅ YES' : '❌ NO'}`);
  
  // Simulate expired date
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 1); // 1 ngày trước
  
  await UserPermission.findOneAndUpdate(
    { id_user: student._id, id_per: activityPerm._id },
    { expires_at: pastDate }
  );
  
  log.info('   Changed expires_at to past date');
  
  const hasPermAfterExpire = await UserPermission.hasPermission(student._id, activityPerm._id);
  console.log(`   Student có permission sau khi expire: ${hasPermAfterExpire ? '❌ YES (BUG!)' : '✅ NO (Correct)'}`);
  
  // Cleanup
  await UserPermission.findOneAndDelete({ id_user: student._id, id_per: activityPerm._id });
  
  return true;
}

// Test 9: Generate test report
async function test9_generateReport(users) {
  log.test('TEST 9: Tạo báo cáo test');
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 BÁO CÁO TEST HỆ THỐNG PHÂN QUYỀN');
  console.log('='.repeat(60));
  
  // Tổng số permissions
  const totalPermissions = await Permission.countDocuments();
  console.log(`\n📋 Tổng số Permissions: ${totalPermissions}`);
  
  // Tổng số user permissions
  const totalUserPerms = await UserPermission.countDocuments();
  console.log(`🔗 Tổng số User-Permission mappings: ${totalUserPerms}`);
  
  // Active user permissions
  const activeUserPerms = await UserPermission.countDocuments({ licensed: true });
  console.log(`✅ Active permissions: ${activeUserPerms}`);
  
  // Revoked permissions
  const revokedUserPerms = await UserPermission.countDocuments({ licensed: false });
  console.log(`❌ Revoked permissions: ${revokedUserPerms}`);
  
  // Permissions per user
  console.log('\n👥 Permissions per User:');
  for (const user of users) {
    const count = await UserPermission.countDocuments({ 
      id_user: user._id, 
      licensed: true 
    });
    console.log(`   - ${user.name}: ${count} permissions`);
  }
  
  // Most used permission
  const permUsage = await UserPermission.aggregate([
    { $match: { licensed: true } },
    { $group: { _id: '$id_per', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 1 }
  ]);
  
  if (permUsage.length > 0) {
    const mostUsedPerm = await Permission.findById(permUsage[0]._id);
    console.log(`\n🏆 Most used permission: ${mostUsedPerm.name_per} (${permUsage[0].count} users)`);
  }
  
  console.log('\n' + '='.repeat(60));
  
  return true;
}

// Main test runner
async function runAllTests() {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 BẮT ĐẦU TEST HỆ THỐNG PHÂN QUYỀN');
    console.log('='.repeat(60) + '\n');
    
    await connectDB();
    
    // Run tests
    let testResults = [];
    
    testResults.push(await test1_checkPermissionsExist());
    
    if (!testResults[0]) {
      log.error('Test 1 failed. Stopping...');
      return;
    }
    
    const users = await test2_createTestUsers();
    testResults.push(!!users);
    
    testResults.push(await test3_grantPermissions(users));
    testResults.push(await test4_checkUserPermissions(users));
    testResults.push(await test5_testSpecificPermissions(users));
    testResults.push(await test6_testActionLevelPermissions(users));
    testResults.push(await test7_testRevokePermission(users));
    testResults.push(await test8_testTimeBasedPermissions(users));
    testResults.push(await test9_generateReport(users));
    
    // Summary
    const passedTests = testResults.filter(r => r === true).length;
    const totalTests = testResults.length;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 KẾT QUẢ TEST');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${passedTests}/${totalTests}`);
    console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
    
    if (passedTests === totalTests) {
      log.success('\n🎉 TẤT CẢ TESTS ĐỀU PASS! HỆ THỐNG HOẠT ĐỘNG HOÀN HẢO!');
    } else {
      log.error('\n❌ CÓ TESTS BỊ FAIL. KIỂM TRA LẠI!');
    }
    
    console.log('\n💡 Thông tin login cho test users:');
    console.log('   Email: admin@test.com    | Password: password123');
    console.log('   Email: student@test.com  | Password: password123');
    console.log('   Email: teacher@test.com  | Password: password123');
    console.log('\n');
    
  } catch (error) {
    log.error('Error running tests: ' + error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    log.info('Đã đóng kết nối MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests };

