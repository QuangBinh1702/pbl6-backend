/**
 * SEED PERMISSIONS - Tạo Permissions, Actions, Role Actions
 * Dựa trên file permissions.config.js và 4 roles có sẵn
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

console.log('\n' + '='.repeat(70));
console.log('🔐 SEED PERMISSIONS & ACTIONS');
console.log('='.repeat(70) + '\n');

async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;
  const dbName = 'Community_Activity_Management';
  
  await mongoose.connect(mongoUri, { dbName });
  console.log(`✅ Kết nối: ${dbName}\n`);
}

// Định nghĩa tất cả resources và actions
const RESOURCES_ACTIONS = {
  activity: {
    name: 'Quản lý hoạt động',
    description: 'Quản lý các hoạt động cộng đồng',
    actions: [
      { code: 'CREATE', name: 'Tạo hoạt động', description: 'Tạo hoạt động mới' },
      { code: 'SUGGEST', name: 'Đề xuất hoạt động', description: 'Đề xuất hoạt động (status = pending, chờ duyệt)' },
      { code: 'READ', name: 'Xem hoạt động', description: 'Xem danh sách và chi tiết hoạt động' },
      { code: 'UPDATE', name: 'Cập nhật hoạt động', description: 'Chỉnh sửa thông tin hoạt động' },
      { code: 'DELETE', name: 'Xóa hoạt động', description: 'Xóa hoạt động' },
      { code: 'APPROVE', name: 'Duyệt hoạt động', description: 'Duyệt hoạt động đã tạo' },
      { code: 'REJECT', name: 'Từ chối hoạt động', description: 'Từ chối hoạt động' },
      { code: 'COMPLETE', name: 'Hoàn thành hoạt động', description: 'Đánh dấu hoạt động hoàn thành' },
      { code: 'EXPORT', name: 'Xuất danh sách', description: 'Xuất danh sách hoạt động' }
    ]
  },
  user: {
    name: 'Quản lý người dùng',
    description: 'Quản lý tài khoản người dùng',
    actions: [
      { code: 'CREATE', name: 'Tạo người dùng', description: 'Tạo tài khoản mới' },
      { code: 'READ', name: 'Xem người dùng', description: 'Xem thông tin người dùng' },
      { code: 'UPDATE', name: 'Cập nhật người dùng', description: 'Chỉnh sửa thông tin người dùng' },
      { code: 'DELETE', name: 'Xóa người dùng', description: 'Xóa tài khoản người dùng' },
      { code: 'LOCK', name: 'Khóa tài khoản', description: 'Khóa tài khoản người dùng' },
      { code: 'UNLOCK', name: 'Mở khóa tài khoản', description: 'Mở khóa tài khoản' }
    ]
  },
  attendance: {
    name: 'Quản lý điểm danh',
    description: 'Quản lý điểm danh hoạt động',
    actions: [
      { code: 'SCAN', name: 'Quét QR điểm danh', description: 'Quét mã QR để điểm danh' },
      { code: 'READ', name: 'Xem điểm danh', description: 'Xem danh sách điểm danh' },
      { code: 'VERIFY', name: 'Xác nhận điểm danh', description: 'Xác nhận điểm danh hợp lệ' },
      { code: 'EXPORT', name: 'Xuất điểm danh', description: 'Xuất danh sách điểm danh' }
    ]
  },
  evidence: {
    name: 'Quản lý minh chứng',
    description: 'Quản lý minh chứng hoạt động',
    actions: [
      { code: 'SUBMIT', name: 'Nộp minh chứng', description: 'Nộp minh chứng hoạt động' },
      { code: 'READ', name: 'Xem minh chứng', description: 'Xem danh sách minh chứng' },
      { code: 'APPROVE', name: 'Duyệt minh chứng', description: 'Duyệt minh chứng hợp lệ' },
      { code: 'REJECT', name: 'Từ chối minh chứng', description: 'Từ chối minh chứng' },
      { code: 'DELETE', name: 'Xóa minh chứng', description: 'Xóa minh chứng' }
    ]
  },
  report: {
    name: 'Báo cáo thống kê',
    description: 'Xem và xuất báo cáo',
    actions: [
      { code: 'VIEW_OVERVIEW', name: 'Xem tổng quan', description: 'Xem báo cáo tổng quan' },
      { code: 'VIEW_DETAIL', name: 'Xem chi tiết', description: 'Xem báo cáo chi tiết' },
      { code: 'EXPORT', name: 'Xuất báo cáo', description: 'Xuất báo cáo ra file' }
    ]
  },
  class: {
    name: 'Quản lý lớp học',
    description: 'Quản lý thông tin lớp học',
    actions: [
      { code: 'CREATE', name: 'Tạo lớp', description: 'Tạo lớp học mới' },
      { code: 'READ', name: 'Xem lớp', description: 'Xem thông tin lớp học' },
      { code: 'UPDATE', name: 'Cập nhật lớp', description: 'Chỉnh sửa thông tin lớp' },
      { code: 'DELETE', name: 'Xóa lớp', description: 'Xóa lớp học' },
      { code: 'MANAGE_STUDENTS', name: 'Quản lý sinh viên', description: 'Quản lý sinh viên trong lớp' },
      { code: 'ATTENDANCE', name: 'Điểm danh lớp', description: 'Điểm danh lớp học' },
      { code: 'REPORT', name: 'Báo cáo lớp', description: 'Xem báo cáo lớp học' }
    ]
  },
  pvcd_record: {
    name: 'Quản lý điểm PVCD',
    description: 'Quản lý điểm rèn luyện sinh viên',
    actions: [
      { code: 'CREATE', name: 'Tạo bản ghi', description: 'Tạo bản ghi điểm PVCD' },
      { code: 'READ', name: 'Xem điểm', description: 'Xem điểm PVCD' },
      { code: 'UPDATE', name: 'Cập nhật điểm', description: 'Cập nhật điểm PVCD' },
      { code: 'DELETE', name: 'Xóa bản ghi', description: 'Xóa bản ghi điểm PVCD' },
      { code: 'ADJUST', name: 'Điều chỉnh điểm', description: 'Điều chỉnh điểm PVCD' }
    ]
  },
  role: {
    name: 'Quản lý vai trò',
    description: 'Quản lý vai trò người dùng',
    actions: [
      { code: 'CREATE', name: 'Tạo vai trò', description: 'Tạo vai trò mới' },
      { code: 'READ', name: 'Xem vai trò', description: 'Xem danh sách vai trò' },
      { code: 'UPDATE', name: 'Cập nhật vai trò', description: 'Chỉnh sửa vai trò' },
      { code: 'DELETE', name: 'Xóa vai trò', description: 'Xóa vai trò' }
    ]
  },
  permission: {
    name: 'Quản lý quyền',
    description: 'Quản lý phân quyền hệ thống',
    actions: [
      { code: 'CREATE', name: 'Tạo quyền', description: 'Tạo quyền mới' },
      { code: 'READ', name: 'Xem quyền', description: 'Xem danh sách quyền' },
      { code: 'UPDATE', name: 'Cập nhật quyền', description: 'Chỉnh sửa quyền' },
      { code: 'DELETE', name: 'Xóa quyền', description: 'Xóa quyền' }
    ]
  },
  activity_registration: {
    name: 'Quản lý đăng ký hoạt động',
    description: 'Quản lý đăng ký tham gia hoạt động',
    actions: [
      { code: 'CREATE', name: 'Đăng ký', description: 'Đăng ký tham gia hoạt động' },
      { code: 'READ', name: 'Xem đăng ký', description: 'Xem danh sách đăng ký' },
      { code: 'APPROVE', name: 'Duyệt đăng ký', description: 'Duyệt đăng ký tham gia' },
      { code: 'REJECT', name: 'Từ chối đăng ký', description: 'Từ chối đăng ký' },
      { code: 'CANCEL', name: 'Hủy đăng ký', description: 'Hủy đăng ký đã tạo' }
    ]
  },
  student_feedback: {
    name: 'Phản hồi sinh viên',
    description: 'Quản lý phản hồi của sinh viên',
    actions: [
      { code: 'SUBMIT', name: 'Gửi phản hồi', description: 'Gửi phản hồi về hoạt động' },
      { code: 'READ', name: 'Xem phản hồi', description: 'Xem danh sách phản hồi' },
      { code: 'DELETE', name: 'Xóa phản hồi', description: 'Xóa phản hồi' }
    ]
  },
  student_profile: {
    name: 'Hồ sơ sinh viên',
    description: 'Quản lý hồ sơ sinh viên',
    actions: [
      { code: 'CREATE', name: 'Tạo hồ sơ', description: 'Tạo hồ sơ sinh viên' },
      { code: 'READ', name: 'Xem hồ sơ', description: 'Xem hồ sơ sinh viên' },
      { code: 'UPDATE', name: 'Cập nhật hồ sơ', description: 'Chỉnh sửa hồ sơ sinh viên' },
      { code: 'DELETE', name: 'Xóa hồ sơ', description: 'Xóa hồ sơ sinh viên' }
    ]
  },
  staff_profile: {
    name: 'Hồ sơ cán bộ',
    description: 'Quản lý hồ sơ cán bộ',
    actions: [
      { code: 'CREATE', name: 'Tạo hồ sơ', description: 'Tạo hồ sơ cán bộ' },
      { code: 'READ', name: 'Xem hồ sơ', description: 'Xem hồ sơ cán bộ' },
      { code: 'UPDATE', name: 'Cập nhật hồ sơ', description: 'Chỉnh sửa hồ sơ cán bộ' },
      { code: 'DELETE', name: 'Xóa hồ sơ', description: 'Xóa hồ sơ cán bộ' }
    ]
  },
  student_cohort: {
    name: 'Sinh viên theo khóa',
    description: 'Quản lý sinh viên theo khóa học',
    actions: [
      { code: 'CREATE', name: 'Thêm sinh viên vào khóa', description: 'Thêm sinh viên vào khóa học' },
      { code: 'READ', name: 'Xem danh sách', description: 'Xem sinh viên theo khóa' },
      { code: 'DELETE', name: 'Xóa khỏi khóa', description: 'Xóa sinh viên khỏi khóa' }
    ]
  },
  cohort: {
    name: 'Quản lý khóa học',
    description: 'Quản lý thông tin khóa học',
    actions: [
      { code: 'CREATE', name: 'Tạo khóa', description: 'Tạo khóa học mới' },
      { code: 'READ', name: 'Xem khóa', description: 'Xem thông tin khóa học' },
      { code: 'UPDATE', name: 'Cập nhật khóa', description: 'Chỉnh sửa thông tin khóa' },
      { code: 'DELETE', name: 'Xóa khóa', description: 'Xóa khóa học' }
    ]
  },
  faculty: {
    name: 'Quản lý khoa',
    description: 'Quản lý thông tin khoa',
    actions: [
      { code: 'CREATE', name: 'Tạo khoa', description: 'Tạo khoa mới' },
      { code: 'READ', name: 'Xem khoa', description: 'Xem thông tin khoa' },
      { code: 'UPDATE', name: 'Cập nhật khoa', description: 'Chỉnh sửa thông tin khoa' },
      { code: 'DELETE', name: 'Xóa khoa', description: 'Xóa khoa' }
    ]
  },
  org_unit: {
    name: 'Đơn vị tổ chức',
    description: 'Quản lý đơn vị tổ chức',
    actions: [
      { code: 'CREATE', name: 'Tạo đơn vị', description: 'Tạo đơn vị tổ chức mới' },
      { code: 'READ', name: 'Xem đơn vị', description: 'Xem thông tin đơn vị' },
      { code: 'UPDATE', name: 'Cập nhật đơn vị', description: 'Chỉnh sửa thông tin đơn vị' },
      { code: 'DELETE', name: 'Xóa đơn vị', description: 'Xóa đơn vị tổ chức' }
    ]
  },
  field: {
    name: 'Lĩnh vực hoạt động',
    description: 'Quản lý lĩnh vực hoạt động',
    actions: [
      { code: 'CREATE', name: 'Tạo lĩnh vực', description: 'Tạo lĩnh vực mới' },
      { code: 'READ', name: 'Xem lĩnh vực', description: 'Xem danh sách lĩnh vực' },
      { code: 'UPDATE', name: 'Cập nhật lĩnh vực', description: 'Chỉnh sửa lĩnh vực' },
      { code: 'DELETE', name: 'Xóa lĩnh vực', description: 'Xóa lĩnh vực' }
    ]
  },
  post: {
    name: 'Quản lý bài đăng',
    description: 'Quản lý bài đăng về hoạt động',
    actions: [
      { code: 'CREATE', name: 'Tạo bài đăng', description: 'Tạo bài đăng mới' },
      { code: 'READ', name: 'Xem bài đăng', description: 'Xem danh sách bài đăng' },
      { code: 'UPDATE', name: 'Cập nhật bài đăng', description: 'Chỉnh sửa bài đăng' },
      { code: 'DELETE', name: 'Xóa bài đăng', description: 'Xóa bài đăng' }
    ]
  },
  activity_eligibility: {
    name: 'Điều kiện tham gia',
    description: 'Quản lý điều kiện tham gia hoạt động',
    actions: [
      { code: 'CREATE', name: 'Tạo điều kiện', description: 'Tạo điều kiện tham gia' },
      { code: 'READ', name: 'Xem điều kiện', description: 'Xem điều kiện tham gia' },
      { code: 'UPDATE', name: 'Cập nhật điều kiện', description: 'Chỉnh sửa điều kiện' },
      { code: 'DELETE', name: 'Xóa điều kiện', description: 'Xóa điều kiện tham gia' }
    ]
  },
  notification: {
    name: 'Quản lý thông báo',
    description: 'Quản lý thông báo hệ thống',
    actions: [
      { code: 'CREATE', name: 'Tạo thông báo', description: 'Tạo thông báo mới' },
      { code: 'READ', name: 'Xem thông báo', description: 'Xem danh sách thông báo' },
      { code: 'UPDATE', name: 'Cập nhật thông báo', description: 'Chỉnh sửa thông báo' },
      { code: 'DELETE', name: 'Xóa thông báo', description: 'Xóa thông báo' }
    ]
  }
};

async function seedPermissions() {
  try {
    const db = mongoose.connection.db;
    
    console.log('🗑️  Xóa dữ liệu cũ...\n');
    await db.collection('permission').deleteMany({});
    await db.collection('action').deleteMany({});
    await db.collection('role_action').deleteMany({});
    console.log('   ✅ Đã xóa permissions, actions, role_actions\n');
    
    console.log('='.repeat(70));
    console.log('📝 TẠO PERMISSIONS VÀ ACTIONS');
    console.log('='.repeat(70) + '\n');
    
    const permissionMap = {}; // Map resource -> permission_id
    const actionMap = {}; // Map "resource:action_code" -> action_id
    
    // Tạo Permissions và Actions
    for (const [resource, config] of Object.entries(RESOURCES_ACTIONS)) {
      console.log(`📋 ${resource.toUpperCase()}: ${config.name}`);
      
      // Tạo Permission
      const permission = await db.collection('permission').insertOne({
        resource: resource,
        name: config.name,
        description: config.description
      });
      permissionMap[resource] = permission.insertedId;
      console.log(`   ✅ Permission: ${config.name}`);
      
      // Tạo Actions cho permission này
      for (const action of config.actions) {
        const actionDoc = await db.collection('action').insertOne({
          permission_id: permission.insertedId,
          resource: resource,  // Thêm resource để query nhanh hơn
          action_code: action.code,
          action_name: action.name,
          description: action.description,
          is_active: true
        });
        actionMap[`${resource}:${action.code}`] = actionDoc.insertedId;
        console.log(`      → ${action.code}: ${action.name}`);
      }
      console.log();
    }
    
    console.log('='.repeat(70));
    console.log(`✅ Đã tạo ${Object.keys(permissionMap).length} permissions và ${Object.keys(actionMap).length} actions`);
    console.log('='.repeat(70) + '\n');
    
    // Lấy roles từ database
    console.log('📝 TẠO ROLE-ACTION MAPPING...\n');
    const roles = await db.collection('role').find({}).toArray();
    const roleMap = {};
    roles.forEach(role => {
      roleMap[role.name] = role._id;
    });
    
    console.log(`   Tìm thấy ${roles.length} roles: ${roles.map(r => r.name).join(', ')}\n`);
    
    // Import permissions config
    const permissionsConfig = require('./src/permissions.config');
    const staffPermissionsConfig = require('./src/staff_permissions.config');
    
    // Tạo role_action
    let totalRoleActions = 0;
    for (const [roleName, permissions] of Object.entries(permissionsConfig)) {
      if (!roleMap[roleName]) {
        console.log(`   ⚠️  Role "${roleName}" không tồn tại trong DB, bỏ qua`);
        continue;
      }
      
      // ⚠️ SPECIAL HANDLING cho STAFF role
      // Chỉ seed BASIC permissions (OPTIONAL không seed vào role_action)
      let permissionsToSeed = permissions;
      if (roleName === 'staff') {
        permissionsToSeed = staffPermissionsConfig.basic;
        console.log(`   🔐 ${roleName.toUpperCase()}: ${permissionsToSeed.length} BASIC permissions (tự động có)`);
        console.log(`   ℹ️  ${staffPermissionsConfig.optional.length} OPTIONAL permissions (admin grant thủ công)`);
      } else {
        console.log(`   🔐 ${roleName.toUpperCase()}: ${permissions.length} permissions`);
      }
      
      for (const permission of permissionsToSeed) {
        const [resource, action] = permission.split(':');
        const actionCode = action.toUpperCase().replace(/_/g, '_');
        const actionKey = `${resource}:${actionCode}`;
        
        if (!actionMap[actionKey]) {
          console.log(`      ⚠️  Action không tồn tại: ${actionKey}`);
          continue;
        }
        
        await db.collection('role_action').insertOne({
          role_id: roleMap[roleName],
          action_id: actionMap[actionKey],
          is_granted: true
        });
        totalRoleActions++;
      }
    }
    
    console.log(`\n✅ Đã tạo ${totalRoleActions} role-action mappings\n`);
    
    console.log('='.repeat(70));
    console.log('🎉 HOÀN TẤT!');
    console.log('='.repeat(70));
    console.log(`\n📊 TỔNG KẾT:`);
    console.log(`   • Permissions: ${Object.keys(permissionMap).length}`);
    console.log(`   • Actions: ${Object.keys(actionMap).length}`);
    console.log(`   • Role Actions: ${totalRoleActions}`);
    console.log(`   • Roles: ${roles.length} (${roles.map(r => r.name).join(', ')})`);
    console.log();
    
  } catch (error) {
    console.error('\n❌ LỖI:', error);
    throw error;
  }
}

async function main() {
  try {
    await connectDB();
    await seedPermissions();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Đã đóng kết nối\n');
  }
}

main();

