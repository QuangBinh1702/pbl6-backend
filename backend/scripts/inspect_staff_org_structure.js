/**
 * Kiểm tra cấu trúc dữ liệu staff và org_unit
 * 
 * Chạy: node scripts/inspect_staff_org_structure.js
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
async function inspectStructure() {
  try {
    console.log('═════════════════════════════════════════════════════════════');
    console.log('🔍 KIỂM TRA CẤU TRÚC DỮ LIỆU STAFF & ORG_UNIT');
    console.log('═════════════════════════════════════════════════════════════\n');

    // Step 1: Lấy 3 bản ghi staff
    console.log('📋 3 BẢN GHI STAFF:');
    console.log('─────────────────────────────────────────────────────────────');
    const staffs = await StaffProfile.find().limit(3);
    staffs.forEach((staff, idx) => {
      console.log(`\nStaff ${idx + 1}:`);
      console.log(JSON.stringify(staff.toObject(), null, 2));
    });

    // Step 2: Lấy tất cả org_unit
    console.log('\n\n📋 TẤT CẢ ORG_UNIT:');
    console.log('─────────────────────────────────────────────────────────────');
    const orgUnits = await OrgUnit.find();
    console.log(`Tổng: ${orgUnits.length} org_unit\n`);
    orgUnits.forEach((org, idx) => {
      console.log(`OrgUnit ${idx + 1}:`);
      console.log(JSON.stringify(org.toObject(), null, 2));
    });

    // Step 3: Thống kê
    console.log('\n\n📊 THỐNG KÊ:');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`Tổng staff: ${await StaffProfile.countDocuments()}`);
    console.log(`Tổng org_unit: ${await OrgUnit.countDocuments()}`);
    
    const orgTypes = await OrgUnit.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } }
    ]);
    console.log('\nPhân loại org_unit theo type:');
    orgTypes.forEach(type => {
      console.log(`  - ${type._id}: ${type.count}`);
    });

    console.log('\n');

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
connectDB().then(() => inspectStructure());
