const mongoose = require('mongoose');
require('dotenv').config();
const Attendance = require('../src/models/attendance.model');
const StudentProfile = require('../src/models/student_profile.model');
const Activity = require('../src/models/activity.model');
const connectDB = require('../src/config/db');

async function seedAttendanceWithFeedback() {
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

    // Tạo mới attendance có phản hồi cho 2 sinh viên
    for (let i = 0; i < 2; i++) {
      const attendance = new Attendance({
        student_id: students[i]._id,
        activity_id: activity._id,
        status: 'present',
        verified: true,
        verified_at: new Date(),
        points: 8 + i,
        scanned_at: new Date(),
        feedback: `Em xin phản hồi về điểm số, em nghĩ mình xứng đáng hơn. (${i+1})`,
        feedback_time: new Date(),
        feedback_status: 'pending',
        feedback_verified_at: null
      });
      await attendance.save();
      console.log(`✅ Tạo mới attendance có phản hồi cho sinh viên ${students[i].full_name} (ID: ${students[i]._id})`);
    }

    console.log('\n✅ Hoàn tất tạo 2 sinh viên có phản hồi!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
    process.exit(1);
  }
}

seedAttendanceWithFeedback();
