/**
 * Script: Thêm max_points và total_qr_created vào các Activity chưa có
 * 
 * Mục đích:
 * - Tìm tất cả Activity chưa có max_points hoặc total_qr_created
 * - Lấy điểm từ bảng Attendance (nếu có) để gán vào max_points
 * - Nếu không có điểm, random 10-15 điểm
 * - Cập nhật total_qr_created = 0 (mặc định)
 * 
 * Usage:
 * node scripts/add_max_points_to_activities.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const Activity = require('../src/models/activity.model');
const Attendance = require('../src/models/attendance.model');

// Connect to MongoDB (giống với add_student_roles.js)
async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_NAME || 'Community_Activity_Management';
    console.log(`📍 Kết nối cơ sở dữ liệu: ${dbName}\n`);
    await mongoose.connect(mongoUri, { dbName });
    console.log('✓ MongoDB connected\n');
  } catch (err) {
    console.error('✗ MongoDB connection error:', err.message);
    process.exit(1);
  }
}

// Main script
const updateActivities = async () => {
  try {
    console.log('\n📋 Scanning Activities for missing max_points and total_qr_created...\n');

    // First, check total count
    const totalActivities = await Activity.countDocuments({});
    console.log(`📊 Total activities in database: ${totalActivities}\n`);

    // Find activities missing max_points
    const activitiesWithoutMaxPoints = await Activity.find({
      $or: [
        { max_points: { $exists: false } },
        { max_points: null }
      ]
    }).select('_id title max_points');

    // Find activities missing total_qr_created
    const activitiesWithoutQrCreated = await Activity.find({
      $or: [
        { total_qr_created: { $exists: false } },
        { total_qr_created: null }
      ]
    }).select('_id title total_qr_created');

    console.log(`Found ${activitiesWithoutMaxPoints.length} activities missing max_points`);
    console.log(`Found ${activitiesWithoutQrCreated.length} activities missing total_qr_created\n`);

    if (activitiesWithoutMaxPoints.length === 0 && activitiesWithoutQrCreated.length === 0) {
      console.log('✅ All activities already have max_points and total_qr_created!');
      return;
    }

    // Show details before update
    if (activitiesWithoutMaxPoints.length > 0) {
      console.log('📊 Activities missing max_points:');
      console.log('─'.repeat(80));
      activitiesWithoutMaxPoints.forEach((activity, idx) => {
        console.log(`${idx + 1}. "${activity.title}" (ID: ${activity._id})`);
      });
      console.log('─'.repeat(80) + '\n');
    }

    if (activitiesWithoutQrCreated.length > 0) {
      console.log('📊 Activities missing total_qr_created:');
      console.log('─'.repeat(80));
      activitiesWithoutQrCreated.forEach((activity, idx) => {
        console.log(`${idx + 1}. "${activity.title}" (ID: ${activity._id})`);
      });
      console.log('─'.repeat(80) + '\n');
    }

    // Update activities missing max_points
    if (activitiesWithoutMaxPoints.length > 0) {
      console.log('\n🔄 Processing max_points for each activity...\n');
      
      let updatedCount = 0;
      let fromAttendanceCount = 0;
      let randomCount = 0;

      for (const activity of activitiesWithoutMaxPoints) {
        let maxPoints = null;

        // Tìm điểm từ bảng Attendance
        // Lấy điểm cao nhất từ points hoặc points_earned
        const attendances = await Attendance.find({
          activity_id: activity._id,
          $or: [
            { points: { $exists: true, $ne: null } },
            { points_earned: { $exists: true, $ne: null } }
          ]
        }).select('points points_earned').lean();

        if (attendances.length > 0) {
          // Tìm điểm cao nhất
          let maxPoint = 0;
          attendances.forEach(att => {
            const point = att.points_earned || att.points || 0;
            if (point > maxPoint) {
              maxPoint = point;
            }
          });

          // Nếu có điểm, dùng điểm đó (nhưng phải >= 10 để hợp lý)
          if (maxPoint > 0) {
            maxPoints = Math.max(maxPoint, 10); // Ít nhất 10 điểm
            fromAttendanceCount++;
            console.log(`  ✓ "${activity.title}": ${maxPoints} điểm (từ Attendance)`);
          }
        }

        // Nếu không có điểm từ Attendance, random 10-15
        if (!maxPoints) {
          maxPoints = Math.floor(Math.random() * 6) + 10; // Random 10-15
          randomCount++;
          console.log(`  🎲 "${activity.title}": ${maxPoints} điểm (random)`);
        }

        // Update activity
        await Activity.findByIdAndUpdate(activity._id, {
          $set: { max_points: maxPoints }
        });

        updatedCount++;
      }

      console.log(`\n✅ Updated max_points for ${updatedCount} activities`);
      console.log(`   - ${fromAttendanceCount} activities: điểm từ Attendance`);
      console.log(`   - ${randomCount} activities: điểm random (10-15)`);
    }

    // Update activities missing total_qr_created
    if (activitiesWithoutQrCreated.length > 0) {
      const result2 = await Activity.updateMany(
        {
          $or: [
            { total_qr_created: { $exists: false } },
            { total_qr_created: null }
          ]
        },
        {
          $set: { total_qr_created: 0 }
        }
      );
      console.log(`✅ Updated total_qr_created for ${result2.modifiedCount} activities`);
    }

    console.log('\n─'.repeat(80));

    // Verify
    console.log('\n📋 Verification: Checking if all activities now have the fields...\n');
    const stillMissingMaxPoints = await Activity.countDocuments({
      $or: [
        { max_points: { $exists: false } },
        { max_points: null }
      ]
    });

    const stillMissingQrCreated = await Activity.countDocuments({
      $or: [
        { total_qr_created: { $exists: false } },
        { total_qr_created: null }
      ]
    });

    if (stillMissingMaxPoints === 0 && stillMissingQrCreated === 0) {
      console.log('✅ Verification passed! All activities have max_points and total_qr_created');
      
      // Show a sample to confirm
      const sample = await Activity.findOne().select('title max_points total_qr_created');
      if (sample) {
        console.log(`\n📝 Sample activity: "${sample.title}"`);
        console.log(`   max_points: ${sample.max_points}`);
        console.log(`   total_qr_created: ${sample.total_qr_created}`);
      }
    } else {
      console.log(`⚠️ Warning: ${stillMissingMaxPoints} activities still missing max_points`);
      console.log(`⚠️ Warning: ${stillMissingQrCreated} activities still missing total_qr_created`);
      
      if (stillMissingMaxPoints > 0) {
        const missing = await Activity.find({
          $or: [
            { max_points: { $exists: false } },
            { max_points: null }
          ]
        }).select('title max_points').limit(5);
        console.log('\n   Examples:');
        missing.forEach(activity => {
          console.log(`   - "${activity.title}": max_points=${activity.max_points}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error updating activities:', error.message);
    console.error(error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB\n');
    process.exit(0);
  }
}

// Run the script
async function main() {
  console.log('═'.repeat(80));
  console.log('  ✏️  Thêm max_points & total_qr_created vào Activities');
  console.log('═'.repeat(80));
  console.log();
  
  await connectDB();
  await updateActivities();
}

main();
