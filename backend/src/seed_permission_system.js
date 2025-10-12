/**
 * Script để seed dữ liệu mẫu cho hệ thống phân quyền chi tiết
 * Chạy: node src/seed_permission_system.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Permission = require('./models/permission.model');
const UserPermission = require('./models/user_permission.model');
const User = require('./models/user.model');

// Kết nối MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pbl6');
    console.log('✅ Kết nối MongoDB thành công!');
  } catch (error) {
    console.error('❌ Kết nối MongoDB thất bại:', error);
    process.exit(1);
  }
};

// Dữ liệu mẫu cho Permissions với chi tiết actions
const samplePermissions = [
  {
    name_per: 'ACTIVITY_MANAGEMENT',
    description: 'Quản lý hoạt động',
    resource: 'activity',
    action: 'manage',
    details: [
      {
        action_name: 'Tạo hoạt động',
        action_code: 'CREATE',
        check_action: true,
        description: 'Cho phép tạo hoạt động mới'
      },
      {
        action_name: 'Xem hoạt động',
        action_code: 'READ',
        check_action: true,
        description: 'Cho phép xem thông tin hoạt động'
      },
      {
        action_name: 'Cập nhật hoạt động',
        action_code: 'UPDATE',
        check_action: true,
        description: 'Cho phép chỉnh sửa hoạt động'
      },
      {
        action_name: 'Xóa hoạt động',
        action_code: 'DELETE',
        check_action: false,
        description: 'Cho phép xóa hoạt động (mặc định không cho phép)'
      },
      {
        action_name: 'Phê duyệt hoạt động',
        action_code: 'APPROVE',
        check_action: true,
        description: 'Cho phép phê duyệt hoạt động'
      }
    ]
  },
  {
    name_per: 'USER_MANAGEMENT',
    description: 'Quản lý người dùng',
    resource: 'user',
    action: 'manage',
    details: [
      {
        action_name: 'Tạo người dùng',
        action_code: 'CREATE',
        check_action: true,
        description: 'Cho phép tạo tài khoản mới'
      },
      {
        action_name: 'Xem thông tin người dùng',
        action_code: 'READ',
        check_action: true,
        description: 'Cho phép xem thông tin người dùng'
      },
      {
        action_name: 'Cập nhật người dùng',
        action_code: 'UPDATE',
        check_action: true,
        description: 'Cho phép chỉnh sửa thông tin người dùng'
      },
      {
        action_name: 'Xóa người dùng',
        action_code: 'DELETE',
        check_action: false,
        description: 'Cho phép xóa người dùng (mặc định không cho phép)'
      },
      {
        action_name: 'Khóa/Mở khóa tài khoản',
        action_code: 'LOCK',
        check_action: true,
        description: 'Cho phép khóa hoặc mở khóa tài khoản'
      }
    ]
  },
  {
    name_per: 'ATTENDANCE_MANAGEMENT',
    description: 'Quản lý điểm danh',
    resource: 'attendance',
    action: 'manage',
    details: [
      {
        action_name: 'Quét QR điểm danh',
        action_code: 'SCAN',
        check_action: true,
        description: 'Cho phép quét QR code để điểm danh'
      },
      {
        action_name: 'Xem danh sách điểm danh',
        action_code: 'VIEW',
        check_action: true,
        description: 'Cho phép xem danh sách điểm danh'
      },
      {
        action_name: 'Xác nhận điểm danh',
        action_code: 'VERIFY',
        check_action: true,
        description: 'Cho phép xác nhận điểm danh'
      },
      {
        action_name: 'Xuất báo cáo điểm danh',
        action_code: 'EXPORT',
        check_action: true,
        description: 'Cho phép xuất báo cáo điểm danh'
      }
    ]
  },
  {
    name_per: 'EVIDENCE_MANAGEMENT',
    description: 'Quản lý minh chứng',
    resource: 'evidence',
    action: 'manage',
    details: [
      {
        action_name: 'Nộp minh chứng',
        action_code: 'SUBMIT',
        check_action: true,
        description: 'Cho phép nộp minh chứng'
      },
      {
        action_name: 'Xem minh chứng',
        action_code: 'VIEW',
        check_action: true,
        description: 'Cho phép xem minh chứng'
      },
      {
        action_name: 'Phê duyệt minh chứng',
        action_code: 'APPROVE',
        check_action: true,
        description: 'Cho phép phê duyệt minh chứng'
      },
      {
        action_name: 'Từ chối minh chứng',
        action_code: 'REJECT',
        check_action: true,
        description: 'Cho phép từ chối minh chứng'
      }
    ]
  },
  {
    name_per: 'REPORT_VIEW',
    description: 'Xem báo cáo thống kê',
    resource: 'report',
    action: 'view',
    details: [
      {
        action_name: 'Xem báo cáo tổng quan',
        action_code: 'VIEW_OVERVIEW',
        check_action: true,
        description: 'Cho phép xem báo cáo tổng quan'
      },
      {
        action_name: 'Xem báo cáo chi tiết',
        action_code: 'VIEW_DETAIL',
        check_action: true,
        description: 'Cho phép xem báo cáo chi tiết'
      },
      {
        action_name: 'Xuất báo cáo',
        action_code: 'EXPORT',
        check_action: true,
        description: 'Cho phép xuất file báo cáo'
      }
    ]
  }
];

// Hàm seed permissions
const seedPermissions = async () => {
  try {
    console.log('\n🌱 Bắt đầu seed permissions...');
    
    // Xóa dữ liệu cũ (nếu muốn)
    // await Permission.deleteMany({});
    // console.log('🗑️  Đã xóa permissions cũ');

    const createdPermissions = [];
    
    for (const permData of samplePermissions) {
      const permission = await Permission.findOneAndUpdate(
        { name_per: permData.name_per },
        permData,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      createdPermissions.push(permission);
      console.log(`✅ Đã tạo permission: ${permission.name_per}`);
    }

    console.log(`\n✅ Đã seed ${createdPermissions.length} permissions thành công!`);
    return createdPermissions;
  } catch (error) {
    console.error('❌ Lỗi khi seed permissions:', error);
    throw error;
  }
};

// Hàm seed user permissions (ví dụ)
const seedUserPermissions = async () => {
  try {
    console.log('\n🌱 Bắt đầu seed user permissions...');
    
    // Tìm user admin (hoặc tạo mới nếu chưa có)
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('⚠️  Không tìm thấy user admin, bỏ qua việc seed user permissions');
      console.log('💡 Hãy tạo user trước, sau đó chạy lại script này');
      return;
    }

    // Lấy tất cả permissions
    const permissions = await Permission.find({});
    
    console.log(`\n📋 Gán tất cả ${permissions.length} permissions cho admin user...`);
    
    const grantedPermissions = [];
    for (const permission of permissions) {
      const userPerm = await UserPermission.grantPermission(
        adminUser._id,
        permission._id,
        null, // granted_by
        null  // expires_at (không hết hạn)
      );
      grantedPermissions.push(userPerm);
      console.log(`✅ Đã gán permission: ${permission.name_per} cho user ${adminUser.email || adminUser.name}`);
    }

    console.log(`\n✅ Đã seed ${grantedPermissions.length} user permissions thành công!`);
  } catch (error) {
    console.error('❌ Lỗi khi seed user permissions:', error);
    throw error;
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    
    // Seed permissions
    await seedPermissions();
    
    // Seed user permissions (optional)
    await seedUserPermissions();
    
    console.log('\n🎉 Hoàn thành seed dữ liệu!');
    console.log('\n📚 Các bước tiếp theo:');
    console.log('   1. Kiểm tra dữ liệu trong MongoDB');
    console.log('   2. Sử dụng API để quản lý permissions');
    console.log('   3. Xem file PERMISSION_USAGE.md để biết cách sử dụng\n');
    
  } catch (error) {
    console.error('❌ Lỗi khi chạy seed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Đã đóng kết nối MongoDB');
  }
};

// Chạy script
if (require.main === module) {
  main();
}

module.exports = { seedPermissions, seedUserPermissions };

