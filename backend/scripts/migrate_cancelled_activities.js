// Migration: Add cancellation fields to existing cancelled activities
require('dotenv').config();
const mongoose = require('mongoose');

const Activity = require('../src/models/activity.model');

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

async function migrateCancelledActivities() {
  try {
    console.log('═════════════════════════════════════════════════════════════');
    console.log('🔄 THÊM TRƯỜNG HỦY CHO CANCELLED ACTIVITIES');
    console.log('═════════════════════════════════════════════════════════════\n');

    // Find all cancelled activities
    const cancelledActivities = await Activity.find({ status: 'cancelled' });
    console.log(`📊 Found ${cancelledActivities.length} cancelled activities`);

    if (cancelledActivities.length === 0) {
      console.log('✓ No cancelled activities to update');
      await mongoose.connection.close();
      return;
    }

    // Update each cancelled activity
    let updatedCount = 0;
    for (const activity of cancelledActivities) {
      // Only update if fields don't exist
      if (!activity.cancelled_at || !activity.cancellation_reason) {
        // Set cancelled_at to activity's updatedAt if available, otherwise use current time
        const cancelledTime = activity.updatedAt || new Date();
        
        await Activity.findByIdAndUpdate(
          activity._id,
          {
            $set: {
              cancelled_at: !activity.cancelled_at ? cancelledTime : activity.cancelled_at,
              cancellation_reason: activity.cancellation_reason || 'Không có lý do được ghi lại'
            }
          }
        );
        updatedCount++;
        console.log(`✓ Updated: ${activity.title} (${activity._id})`);
      }
    }

    console.log();
    console.log('═════════════════════════════════════════════════════════════');
    console.log('✅ HOÀN TẤT!');
    console.log('═════════════════════════════════════════════════════════════\n');

    console.log('📊 Thống kê:');
    console.log(`   ✓ Tổng cancelled activities: ${cancelledActivities.length}`);
    console.log(`   ✓ Activities được cập nhật: ${updatedCount}`);
    console.log(`   ✓ cancelled_at được set từ updatedAt hoặc thời gian hiện tại`);
    console.log(`   ✓ cancellation_reason được set mặc định nếu chưa có\n`);

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
connectDB().then(() => migrateCancelledActivities());
