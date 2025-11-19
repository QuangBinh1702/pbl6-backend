/**
 * Cập nhật role "student" cho tất cả users hiện tại
 * Không xóa dữ liệu, chỉ thêm role vào những user chưa có
 * 
 * Chạy: node scripts/add_student_roles.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Models
const User = require('../src/models/user.model');
const UserRole = require('../src/models/user_role.model');
const Role = require('../src/models/role.model');

// Connect to MongoDB
async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_NAME || 'Community_Activity_Management';
    console.log(`📍 Connecting to: ${dbName}\n`);
    await mongoose.connect(mongoUri, { dbName });
    console.log('✓ MongoDB connected\n');
  } catch (err) {
    console.error('✗ MongoDB connection error:', err.message);
    process.exit(1);
  }
}

// Main function
async function addStudentRoles() {
  try {
    console.log('═════════════════════════════════════════════════════════════');
    console.log('🔐 CẬP NHẬT ROLE STUDENT CHO TẤT CẢ USERS');
    console.log('═════════════════════════════════════════════════════════════\n');

    // Step 1: Lấy role "student"
    console.log('👤 Tìm role "student"...');
    const studentRole = await Role.findOne({ name: 'student' });
    
    if (!studentRole) {
      console.log('   ✗ Role "student" không tồn tại trong database');
      process.exit(1);
    }
    console.log(`   ✓ Role "student" found: ${studentRole._id}\n`);

    // Step 2: Lấy tất cả users
    console.log('👥 Tìm tất cả users...');
    const allUsers = await User.find();
    console.log(`   ✓ Tìm thấy ${allUsers.length} users\n`);

    // Step 3: Kiểm tra user nào chưa có role student
    console.log('🔍 Kiểm tra user nào chưa có role student...\n');

    let usersWithoutRole = 0;
    let usersWithRole = 0;
    let rolesAdded = 0;

    for (const user of allUsers) {
      const existingRole = await UserRole.findOne({
        user_id: user._id,
        role_id: studentRole._id
      });

      if (existingRole) {
        usersWithRole++;
      } else {
        // Thêm role student
        await UserRole.create({
          user_id: user._id,
          role_id: studentRole._id
        });
        usersWithoutRole++;
        rolesAdded++;
        
        // Progress indicator
        if (rolesAdded % 50 === 0) {
          console.log(`   ⏳ Đã cập nhật ${rolesAdded} users...`);
        }
      }
    }

    console.log();

    // Summary
    console.log('═════════════════════════════════════════════════════════════');
    console.log('✅ HOÀN TẤT!');
    console.log('═════════════════════════════════════════════════════════════\n');

    console.log('📊 Thống kê:');
    console.log(`   ✓ Tổng users: ${allUsers.length}`);
    console.log(`   ✓ Users đã có role student: ${usersWithRole}`);
    console.log(`   ✓ Users vừa được thêm role: ${rolesAdded}`);
    console.log();

  } catch (err) {
    console.error('✗ Lỗi:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Kết nối MongoDB đã đóng');
    process.exit(0);
  }
}

// Run
connectDB().then(() => addStudentRoles());
