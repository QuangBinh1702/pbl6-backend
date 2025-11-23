/**
 * Kiểm tra dữ liệu sau khi update
 * 
 * Chạy: node scripts/check_updated_data.js
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
async function checkData() {
  try {
    console.log('═════════════════════════════════════════════════════════════');
    console.log('🔍 KIỂM TRA DỮ LIỆU SAU KHI UPDATE');
    console.log('═════════════════════════════════════════════════════════════\n');

    // Check Staff
    console.log('📋 STAFF DATA:');
    console.log('─────────────────────────────────────────────────────────────');
    const staffs = await StaffProfile.find().limit(2);
    staffs.forEach((staff, idx) => {
      console.log(`\nStaff ${idx + 1}:`);
      console.log(`  _id: ${staff._id}`);
      console.log(`  full_name: ${staff.full_name}`);
      console.log(`  faculty_id: ${staff.faculty_id || 'CHƯA CÓ'}`);
    });

    // Check Org Units
    console.log('\n\n📋 ORG_UNIT DATA:');
    console.log('─────────────────────────────────────────────────────────────');
    const orgUnits = await OrgUnit.find();
    orgUnits.forEach((org, idx) => {
      console.log(`\nOrgUnit ${idx + 1}:`);
      console.log(`  _id: ${org._id}`);
      console.log(`  name: ${org.name}`);
      console.log(`  founded_date: ${org.founded_date || 'CHƯA CÓ'}`);
      console.log(`  achievements: ${org.achievements ? org.achievements.length + ' items' : 'CHƯA CÓ'}`);
      console.log(`  description: ${org.description ? org.description.substring(0, 50) + '...' : 'CHƯA CÓ'}`);
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
connectDB().then(() => checkData());
