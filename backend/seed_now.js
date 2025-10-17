/**
 * Script seed đơn giản - Tạo permissions ngay
 */

require('dotenv').config();
const mongoose = require('mongoose');

console.log('\n==========================================================');
console.log('🌱 SEED PERMISSIONS - Tạo dữ liệu test');
console.log('==========================================================\n');

async function seed() {
  try {
    // 1. Kết nối MongoDB
    console.log('⏳ Đang kết nối MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pbl6');
    console.log('✅ Kết nối thành công!\n');
    
    // 2. Define schemas inline
    const permissionDetailSchema = new mongoose.Schema({
      action_name: { type: String, required: true },
      action_code: { type: String, required: true, uppercase: true },
      check_action: { type: Boolean, default: false },
      description: String
    }, { _id: true });
    
    const permissionSchema = new mongoose.Schema({
      name_per: { type: String, required: true, unique: true },
      description: String,
      details: [permissionDetailSchema],
      resource: String,
      action: String,
      is_active: { type: Boolean, default: true }
    }, { timestamps: true, collection: 'permissions' });
    
    const Permission = mongoose.models.Permission || mongoose.model('Permission', permissionSchema);
    
    // 3. Xóa permissions cũ
    console.log('🗑️  Xóa permissions cũ...');
    await Permission.deleteMany({});
    console.log('✅ Đã xóa\n');
    
    // 4. Tạo 5 permissions mẫu
    console.log('📝 Đang tạo permissions...\n');
    
    const permissions = [
      {
        name_per: 'ACTIVITY_MANAGEMENT',
        description: 'Quản lý hoạt động',
        resource: 'activity',
        action: 'manage',
        details: [
          { action_name: 'Tạo hoạt động', action_code: 'CREATE', check_action: true },
          { action_name: 'Xem hoạt động', action_code: 'READ', check_action: true },
          { action_name: 'Cập nhật hoạt động', action_code: 'UPDATE', check_action: true },
          { action_name: 'Xóa hoạt động', action_code: 'DELETE', check_action: false },
          { action_name: 'Phê duyệt hoạt động', action_code: 'APPROVE', check_action: true }
        ]
      },
      {
        name_per: 'USER_MANAGEMENT',
        description: 'Quản lý người dùng',
        resource: 'user',
        action: 'manage',
        details: [
          { action_name: 'Tạo người dùng', action_code: 'CREATE', check_action: true },
          { action_name: 'Xem người dùng', action_code: 'READ', check_action: true },
          { action_name: 'Cập nhật người dùng', action_code: 'UPDATE', check_action: true },
          { action_name: 'Xóa người dùng', action_code: 'DELETE', check_action: false },
          { action_name: 'Khóa/Mở khóa', action_code: 'LOCK', check_action: true }
        ]
      },
      {
        name_per: 'ATTENDANCE_MANAGEMENT',
        description: 'Quản lý điểm danh',
        resource: 'attendance',
        action: 'manage',
        details: [
          { action_name: 'Quét QR điểm danh', action_code: 'SCAN', check_action: true },
          { action_name: 'Xem điểm danh', action_code: 'VIEW', check_action: true },
          { action_name: 'Xác nhận điểm danh', action_code: 'VERIFY', check_action: true },
          { action_name: 'Xuất báo cáo', action_code: 'EXPORT', check_action: true }
        ]
      },
      {
        name_per: 'EVIDENCE_MANAGEMENT',
        description: 'Quản lý minh chứng',
        resource: 'evidence',
        action: 'manage',
        details: [
          { action_name: 'Nộp minh chứng', action_code: 'SUBMIT', check_action: true },
          { action_name: 'Xem minh chứng', action_code: 'VIEW', check_action: true },
          { action_name: 'Phê duyệt', action_code: 'APPROVE', check_action: true },
          { action_name: 'Từ chối', action_code: 'REJECT', check_action: true }
        ]
      },
      {
        name_per: 'REPORT_VIEW',
        description: 'Xem báo cáo thống kê',
        resource: 'report',
        action: 'view',
        details: [
          { action_name: 'Xem tổng quan', action_code: 'VIEW_OVERVIEW', check_action: true },
          { action_name: 'Xem chi tiết', action_code: 'VIEW_DETAIL', check_action: true },
          { action_name: 'Xuất báo cáo', action_code: 'EXPORT', check_action: true }
        ]
      }
    ];
    
    // Insert all permissions
    const created = await Permission.insertMany(permissions);
    
    console.log(`✅ Đã tạo ${created.length} permissions:\n`);
    created.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name_per} (${p.details.length} actions)`);
    });
    
    // 5. Thống kê
    console.log('\n📊 THỐNG KÊ:');
    const totalActions = created.reduce((sum, p) => sum + p.details.length, 0);
    console.log(`   - Total Permissions: ${created.length}`);
    console.log(`   - Total Actions: ${totalActions}`);
    
    console.log('\n🎉 SEED HOÀN TẤT!');
    console.log('\n💡 NEXT STEPS:');
    console.log('   1. Chạy test: node test_permission_system.js');
    console.log('   2. Start server: npm run dev');
    console.log('   3. Test UI: http://localhost:5000/test-permission.html');
    console.log();
    
  } catch (error) {
    console.error('\n❌ LỖI:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Đã đóng kết nối MongoDB\n');
  }
}

seed();



