const mongoose = require('mongoose');
require('dotenv').config();
const Attendance = require('../src/models/attendance.model');
const StudentProfile = require('../src/models/student_profile.model');
const Activity = require('../src/models/activity.model');
const connectDB = require('../src/config/db');

async function seedNoFeedbackAttendance() {
  try {
    await connectDB();
    console.log('Kết nối thành công!');

    // Lấy 2 sinh viên khác nhau
    const students = await StudentProfile.find().limit(2);
    if (students.length < 2) {
      console.log('❌ Không đủ sinh viên để tạo dữ liệu');
      process.exit(1);
    }

    // Lấy một hoạt động
    const activity = await Activity.findOne();
    if (!activity) {
      console.log('❌ Không tìm thấy hoạt động nào');
      process.exit(1);
    }


    for (let i = 0; i < 2; i++) {
      // Luôn tạo mới bản ghi attendance không có phản hồi
      const attendance = new Attendance({
        student_id: students[i]._id,
        activity_id: activity._id,
        status: 'present',
        verified: true,
        verified_at: new Date(),
        points: 7 + i, // điểm khác nhau
        scanned_at: new Date()
      });
      await attendance.save();
      console.log(`✅ Tạo mới attendance không phản hồi cho sinh viên ${students[i].full_name} (ID: ${students[i]._id})`);
    }

    console.log('\n✅ Hoàn tất tạo 2 sinh viên không có phản hồi!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
    process.exit(1);
  }
}

seedNoFeedbackAttendance();
