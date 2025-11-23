/**
 * Thêm chức vụ (position) cho staff chưa có
 * 
 * Chạy: node scripts/add_position_to_staff_v2.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Models
const StaffProfile = require('../src/models/staff_profile.model');

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
async function addPositionToStaff() {
  try {
    console.log('═════════════════════════════════════════════════════════════');
    console.log('💼 THÊM CHỨC VỤ CHO STAFF CHƯA CÓ');
    console.log('═════════════════════════════════════════════════════════════\n');

    // Lấy tất cả staff
    console.log('👥 Tìm tất cả staff...');
    const allStaffs = await StaffProfile.find();
    console.log(`   ✓ Tìm thấy ${allStaffs.length} staff\n`);

    console.log('📝 Cập nhật chức vụ cho staff chưa có...\n');
    let updated = 0;
    let alreadyHas = 0;

    for (const staff of allStaffs) {
      if (!staff.position || staff.position.trim() === '') {
        // Gán chức vụ mặc định
        const defaultPosition = 'Nhân viên'; // Giá trị mặc định
        
        await StaffProfile.findByIdAndUpdate(
          staff._id,
          { position: defaultPosition },
          { new: true }
        );
        updated++;
        console.log(`   ✓ ${staff.full_name} → ${defaultPosition}`);
      } else {
        alreadyHas++;
      }
    }

    console.log();

    // Summary
    console.log('═════════════════════════════════════════════════════════════');
    console.log('✅ HOÀN TẤT!');
    console.log('═════════════════════════════════════════════════════════════\n');

    console.log('📊 Thống kê:');
    console.log(`   ✓ Tổng staff: ${allStaffs.length}`);
    console.log(`   ✓ Staff vừa được thêm position: ${updated}`);
    console.log(`   ✓ Staff đã có position: ${alreadyHas}`);
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
connectDB().then(() => addPositionToStaff());
