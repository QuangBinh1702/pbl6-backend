/**
 * QUICK TEST - Test nhanh hệ thống phân quyền
 * Chạy: node quick_test.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

console.log('\n' + '='.repeat(60));
console.log('🚀 QUICK TEST - HỆ THỐNG PHÂN QUYỀN');
console.log('='.repeat(60) + '\n');

async function quickTest() {
  try {
    // Test 1: Kết nối MongoDB
    console.log(`${colors.cyan}⏳ Test 1: Kết nối MongoDB...${colors.reset}`);
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pbl6');
    console.log(`${colors.green}✅ Kết nối thành công!${colors.reset}\n`);
    
    // Test 2: Kiểm tra Models
    console.log(`${colors.cyan}⏳ Test 2: Load Models...${colors.reset}`);
    const Permission = require('./src/models/permission.model');
    const UserPermission = require('./src/models/user_permission.model');
    const User = require('./src/models/user.model');
    console.log(`${colors.green}✅ Models loaded!${colors.reset}\n`);
    
    // Test 3: Đếm Permissions
    console.log(`${colors.cyan}⏳ Test 3: Kiểm tra Permissions...${colors.reset}`);
    const permCount = await Permission.countDocuments();
    
    if (permCount === 0) {
      console.log(`${colors.yellow}⚠️  Chưa có permissions! Đang tạo...${colors.reset}`);
      
      // Tạo 1 permission mẫu
      const testPerm = await Permission.create({
        name_per: 'TEST_PERMISSION',
        description: 'Test permission',
        details: [
          {
            action_name: 'Test Action',
            action_code: 'TEST',
            check_action: true
          }
        ]
      });
      
      console.log(`${colors.green}✅ Đã tạo test permission: ${testPerm.name_per}${colors.reset}`);
    } else {
      console.log(`${colors.green}✅ Tìm thấy ${permCount} permissions${colors.reset}`);
      
      // Show sample permissions
      const perms = await Permission.find().limit(3).select('name_per details');
      perms.forEach(p => {
        console.log(`   - ${p.name_per}: ${p.details.length} actions`);
      });
    }
    console.log();
    
    // Test 4: Đếm Users
    console.log(`${colors.cyan}⏳ Test 4: Kiểm tra Users...${colors.reset}`);
    const userCount = await User.countDocuments();
    console.log(`${colors.green}✅ Tìm thấy ${userCount} users${colors.reset}`);
    
    if (userCount > 0) {
      const users = await User.find().limit(3).select('email role');
      users.forEach(u => {
        console.log(`   - ${u.email} (${u.role})`);
      });
    }
    console.log();
    
    // Test 5: Đếm User Permissions
    console.log(`${colors.cyan}⏳ Test 5: Kiểm tra User Permissions...${colors.reset}`);
    const upCount = await UserPermission.countDocuments();
    const activeCount = await UserPermission.countDocuments({ licensed: true });
    console.log(`${colors.green}✅ Total mappings: ${upCount}${colors.reset}`);
    console.log(`${colors.green}✅ Active permissions: ${activeCount}${colors.reset}\n`);
    
    // Test 6: Test Model Methods
    console.log(`${colors.cyan}⏳ Test 6: Test Model Methods...${colors.reset}`);
    const perm = await Permission.findOne({});
    if (perm) {
      const canTest = perm.isActionAllowed('TEST');
      const canCreate = perm.isActionAllowed('CREATE');
      console.log(`${colors.green}✅ isActionAllowed() works!${colors.reset}`);
      console.log(`   - TEST action: ${canTest ? 'Allowed' : 'Denied'}`);
      console.log(`   - CREATE action: ${canCreate ? 'Allowed' : 'Denied'}`);
    }
    console.log();
    
    // Summary
    console.log('='.repeat(60));
    console.log(`${colors.green}🎉 TẤT CẢ TESTS PASS!${colors.reset}`);
    console.log('='.repeat(60));
    
    console.log('\n📊 THỐNG KÊ:');
    console.log(`   - Permissions: ${permCount}`);
    console.log(`   - Users: ${userCount}`);
    console.log(`   - User-Permission mappings: ${upCount}`);
    console.log(`   - Active permissions: ${activeCount}`);
    
    console.log('\n💡 NEXT STEPS:');
    if (permCount === 0) {
      console.log(`   ${colors.yellow}⚠️  Chạy seed để tạo đầy đủ permissions:${colors.reset}`);
      console.log('   node src/seed_permission_system.js');
    } else {
      console.log(`   ${colors.green}✅ Data đã sẵn sàng!${colors.reset}`);
      console.log('   - Start server: npm run dev');
      console.log('   - Test UI: http://localhost:5000/test-permission.html');
      console.log('   - Full test: node test_permission_system.js');
    }
    
    console.log('\n👤 TEST USERS (nếu đã seed):');
    console.log('   - admin@test.com / password123');
    console.log('   - student@test.com / password123');
    console.log('   - teacher@test.com / password123');
    console.log();
    
  } catch (error) {
    console.error(`\n${colors.red}❌ LỖI: ${error.message}${colors.reset}`);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log(`${colors.blue}👋 Đã đóng kết nối MongoDB${colors.reset}\n`);
  }
}

quickTest();


