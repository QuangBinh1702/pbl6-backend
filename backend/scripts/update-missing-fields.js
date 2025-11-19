// Script cập nhật các trường bị thiếu cho documents cũ
const mongoose = require('mongoose');
const Activity = require('../src/models/activity.model');
const Attendance = require('../src/models/attendance.model');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pbl6';

async function updateMissingFields() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected');

    // Update Activity - thêm activity_image nếu thiếu
    console.log('\n📦 Updating Activity collection...');
    const activityResult = await Activity.updateMany(
      { activity_image: { $exists: false } },
      { $set: { activity_image: null } }
    );
    console.log(`✅ Updated ${activityResult.modifiedCount} activity documents`);

    // Update Attendance - thêm feedback_status và feedback_verified_at
    console.log('\n📦 Updating Attendance collection...');
    const attendanceResult = await Attendance.updateMany(
      { feedback_status: { $exists: false } },
      { 
        $set: { 
          feedback_status: null,
          feedback_verified_at: null 
        } 
      }
    );
    console.log(`✅ Updated ${attendanceResult.modifiedCount} attendance documents`);

    console.log('\n🎉 All updates completed!');
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateMissingFields();
