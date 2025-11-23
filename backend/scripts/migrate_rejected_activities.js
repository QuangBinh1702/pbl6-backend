// Migration: Add missing activity_rejection records for rejected activities
require('dotenv').config();
const mongoose = require('mongoose');

const Activity = require('../src/models/activity.model');
const ActivityRejection = require('../src/models/activity_rejection.model');
const User = require('../src/models/user.model');

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

async function migrateRejectedActivities() {
  try {
    console.log('═════════════════════════════════════════════════════════════');
    console.log('🔄 THÊM RECORDS THIẾU VÀO ACTIVITY_REJECTION');
    console.log('═════════════════════════════════════════════════════════════\n');

    // Find all rejected activities
    const rejectedActivities = await Activity.find({ status: 'rejected' });
    console.log(`📊 Found ${rejectedActivities.length} rejected activities\n`);

    if (rejectedActivities.length === 0) {
      console.log('✓ No rejected activities to process');
      await mongoose.connection.close();
      return;
    }

    // Get admin user by ID
    const adminUserId = '691d5c6df46edc8ea94f09ff';
    const adminUser = await User.findById(adminUserId);
    if (!adminUser) {
      console.error(`✗ Admin user not found (ID: ${adminUserId})`);
      process.exit(1);
    }
    console.log(`👤 Using user for rejected_by: ${adminUser.name} (${adminUser._id})\n`);

    // Check which ones are missing in activity_rejection
    let missingCount = 0;
    const rejectedRecords = [];

    for (const activity of rejectedActivities) {
      const existingRejection = await ActivityRejection.findOne({
        activity_id: activity._id
      });

      if (!existingRejection) {
        missingCount++;
        rejectedRecords.push({
          activity_id: activity._id,
          reason: 'Không đáp ứng tiêu chí được đề ra',
          rejected_by: adminUser._id,
          rejected_at: activity.updatedAt || new Date()
        });
        console.log(`⚠️  Missing: ${activity.title} (${activity._id})`);
      } else {
        console.log(`✓ Already exists: ${activity.title}`);
      }
    }

    console.log();

    // Create missing records
    if (missingCount > 0) {
      console.log(`📝 Creating ${missingCount} missing records...\n`);
      const createdRecords = await ActivityRejection.insertMany(rejectedRecords);
      console.log(`✓ Created ${createdRecords.length} records\n`);
    } else {
      console.log('✓ All rejected activities already have rejection records\n');
    }

    console.log('═════════════════════════════════════════════════════════════');
    console.log('✅ HOÀN TẤT!');
    console.log('═════════════════════════════════════════════════════════════\n');

    console.log('📊 Thống kê:');
    console.log(`   ✓ Tổng rejected activities: ${rejectedActivities.length}`);
    console.log(`   ✓ Đã có record: ${rejectedActivities.length - missingCount}`);
    console.log(`   ✓ Records vừa được tạo: ${missingCount}`);
    console.log(`   ✓ Reason mặc định: "Không đáp ứng tiêu chí được đề ra"`);
    console.log(`   ✓ rejected_by: ${adminUser.name}\n`);

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
connectDB().then(() => migrateRejectedActivities());
