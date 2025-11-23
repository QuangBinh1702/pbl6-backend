/**
 * Thêm trường faculty_id vào bảng staff_profile
 * 
 * Chạy: node scripts/add_faculty_id_to_staff.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Models
const StaffProfile = require('../src/models/staff_profile.model');
const OrgUnit = require('../src/models/org_unit.model');

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
async function addFacultyIdToStaff() {
  try {
    console.log('═════════════════════════════════════════════════════════════');
    console.log('🏫 THÊM TRƯỜNG faculty_id VÀO BẢNG STAFF_PROFILE');
    console.log('═════════════════════════════════════════════════════════════\n');

    // Step 1: Kiểm tra nếu trường faculty_id đã tồn tại
    console.log('🔍 Kiểm tra schema staff_profile...');
    const staffCollection = mongoose.connection.collection('staff_profile');
    const sampleDoc = await staffCollection.findOne({});
    
    if (sampleDoc && sampleDoc.faculty_id !== undefined) {
      console.log('   ⚠️  Trường faculty_id đã tồn tại trong database\n');
    } else {
      console.log('   ✓ Trường faculty_id chưa tồn tại, sẽ được thêm vào\n');
    }

    // Step 2: Lấy tất cả staff
    console.log('👥 Tìm tất cả staff...');
    const allStaffs = await StaffProfile.find();
    console.log(`   ✓ Tìm thấy ${allStaffs.length} staff\n`);

    // Step 3: Cập nhật faculty_id cho staff chưa có
    const FACULTY_ID = '691d6303db9ec83878f1b66c'; // Khoa CNTT
    console.log(`📝 Cập nhật faculty_id cho staff chưa có...\n`);
    
    let updated = 0;
    let alreadyHas = 0;

    for (const staff of allStaffs) {
      if (!staff.faculty_id) {
        // Staff chưa có faculty_id → thêm vào
        await StaffProfile.findByIdAndUpdate(
          staff._id,
          { faculty_id: FACULTY_ID },
          { new: true }
        );
        updated++;
        console.log(`   ✓ ${staff.full_name}`);
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
    console.log(`   ✓ Staff vừa được thêm faculty_id: ${updated}`);
    console.log(`   ✓ Staff đã có faculty_id: ${alreadyHas}`);
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
connectDB().then(() => addFacultyIdToStaff());
