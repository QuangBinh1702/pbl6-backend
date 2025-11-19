require('dotenv').config();
const mongoose = require('mongoose');

const Attendance = require('../src/models/attendance.model');
const StudentProfile = require('../src/models/student_profile.model');
const Activity = require('../src/models/activity.model');

async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_NAME || 'Community_Activity_Management';
    await mongoose.connect(mongoUri, { dbName });
    console.log('✓ MongoDB connected\n');
  } catch (err) {
    console.error('✗ Error:', err.message);
    process.exit(1);
  }
}

async function addMissingPoints() {
  try {
    console.log('═════════════════════════════════════════════════════════════');
    console.log('➕ THÊM ĐIỂM CHO ATTENDANCE KHÔNG CÓ POINTS');
    console.log('═════════════════════════════════════════════════════════════\n');

    // Lấy tất cả attendance không có points
    const missingPoints = await Attendance.find({
      $or: [
        { points: null },
        { points: undefined },
        { points: { $exists: false } }
      ]
    }).lean();

    console.log(`Tìm thấy ${missingPoints.length} attendance cần thêm điểm\n`);

    // Ánh xạ điểm: ID -> Điểm
    const pointsMap = {
      '691d6e8d1ba6c1fa028f25c9': 7,  // Nguyễn Quang Bình - AI Seminar
      '691d6e8d1ba6c1fa028f25d1': 8,  // Unknown - Machine Learning Workshop
      '691d6f95e1c1f629df3cbd62': 9   // Nguyễn Quang Bình - Hoạt động từ thiện
    };

    let updatedCount = 0;

    for (const att of missingPoints) {
      const attId = att._id.toString();
      const points = pointsMap[attId];

      if (points !== undefined) {
        const student = await StudentProfile.findById(att.student_id).lean();
        const activity = await Activity.findById(att.activity_id).lean();

        console.log(`📌 Update ID: ${attId}`);
        console.log(`   Student: ${student?.student_number || 'N/A'} - ${student?.full_name || 'N/A'}`);
        console.log(`   Activity: ${activity?.title || 'N/A'}`);
        console.log(`   Points: ${points}`);

        // Update attendance
        await Attendance.updateOne(
          { _id: att._id },
          { $set: { points: points } }
        );

        updatedCount++;
        console.log('   ✓ Cập nhật thành công\n');
      }
    }

    console.log('═════════════════════════════════════════════════════════════');
    console.log(`✅ Đã cập nhật ${updatedCount}/${missingPoints.length} attendance\n`);

  } catch (err) {
    console.error('✗ Error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

connectDB().then(() => addMissingPoints());
