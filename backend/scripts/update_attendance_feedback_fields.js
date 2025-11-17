const mongoose = require('mongoose');
require('dotenv').config();
const Attendance = require('../src/models/attendance.model');
const connectDB = require('../src/config/db');

async function updateAttendanceFields() {
  try {
    console.log('Kết nối đến MongoDB...');
    await connectDB();

    console.log('Cập nhật các trường feedback_status và feedback_verified_at...');
    
    // Cập nhật tất cả bản ghi attendance
    // - Nếu có feedback, đặt feedback_status = 'pending' (chờ duyệt)
    // - Nếu không có feedback, đặt feedback_status = null
    const result = await Attendance.updateMany(
      {},
      [
        {
          $set: {
            feedback_status: {
              $cond: [
                { $ne: ['$feedback', null] },
                'pending',
                null
              ]
            },
            feedback_verified_at: null
          }
        }
      ]
    );

    console.log(`✅ Cập nhật ${result.modifiedCount} bản ghi`);

    // Lấy một số bản ghi để kiểm tra
    const samples = await Attendance.find().limit(3);
    console.log('\n📋 Dữ liệu mẫu sau cập nhật:');
    samples.forEach((att, idx) => {
      console.log(`\nBản ghi ${idx + 1}:`);
      console.log(`  - Student: ${att.student_id}`);
      console.log(`  - Activity: ${att.activity_id}`);
      console.log(`  - Points: ${att.points || 'N/A'}`);
      console.log(`  - Feedback: ${att.feedback || 'N/A'}`);
      console.log(`  - Feedback Status: ${att.feedback_status || 'N/A'}`);
      console.log(`  - Feedback Verified At: ${att.feedback_verified_at || 'N/A'}`);
    });

    console.log('\n✅ Hoàn tất cập nhật database!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
    process.exit(1);
  }
}

updateAttendanceFields();
