const mongoose = require('mongoose');
require('dotenv').config();
const Attendance = require('../src/models/attendance.model');
const StudentProfile = require('../src/models/student_profile.model');
const Activity = require('../src/models/activity.model');
const User = require('../src/models/user.model');
const connectDB = require('../src/config/db');

async function seedAttendanceFeedback() {
  try {
    console.log('Kết nối đến MongoDB...');
    await connectDB();

    console.log('Lấy dữ liệu mẫu từ database...');
    
    // Lấy một sinh viên
    const student = await StudentProfile.findOne().populate('user_id');
    if (!student) {
      console.log('❌ Không tìm thấy sinh viên nào');
      process.exit(1);
    }

    // Lấy một hoạt động
    const activity = await Activity.findOne();
    if (!activity) {
      console.log('❌ Không tìm thấy hoạt động nào');
      process.exit(1);
    }

    console.log(`\n📝 Dữ liệu mẫu:`);
    console.log(`  - Student: ${student.full_name} (ID: ${student._id})`);
    console.log(`  - Activity: ${activity.title}`);

    // Kiểm tra xem đã có attendance cho sinh viên này và hoạt động này chưa
    let attendance = await Attendance.findOne({
      student_id: student._id,
      activity_id: activity._id
    });

    if (!attendance) {
      // Tạo attendance mới nếu chưa có
      console.log('\n📌 Tạo bản ghi điểm danh mẫu...');
      attendance = new Attendance({
        student_id: student._id,
        activity_id: activity._id,
        status: 'present',
        verified: true,
        verified_at: new Date(),
        points: 8, // Điểm ban đầu
        scanned_at: new Date()
      });
      await attendance.save();
      console.log(`✅ Tạo bản ghi điểm danh thành công`);
    } else {
      console.log(`\n✏️  Đã có bản ghi điểm danh, sẽ thêm dữ liệu mẫu vào đó`);
    }

    // Thêm feedback mẫu (trạng thái pending - chờ duyệt)
    console.log('\n🎯 Thêm feedback mẫu (trạng thái: pending)...');
    attendance.feedback = 'Em xin khiếu nại điểm. Em đã hoàn thành tất cả các yêu cầu và tham gia đầy đủ hoạt động. Điểm 8 không phù hợp với nỗ lực của em.';
    attendance.feedback_time = new Date();
    attendance.feedback_status = 'pending';
    attendance.feedback_verified_at = null;
    await attendance.save();

    console.log(`✅ Thêm feedback chờ duyệt thành công`);
    console.log(`\nThông tin feedback mẫu:`);
    console.log(`  - Trạng thái: ${attendance.feedback_status}`);
    console.log(`  - Thời gian gửi: ${attendance.feedback_time}`);
    console.log(`  - Nội dung: "${attendance.feedback}"`);
    console.log(`  - Điểm hiện tại: ${attendance.points}`);

    // Tạo thêm một ví dụ feedback đã được chấp nhận
    const student2 = await StudentProfile.findOne({ _id: { $ne: student._id } }).populate('user_id');
    if (student2 && activity) {
      console.log('\n\n📝 Tạo ví dụ thứ 2 (feedback đã được chấp nhận)...');
      console.log(`  - Student: ${student2.full_name} (ID: ${student2._id})`);
      
      let attendance2 = await Attendance.findOne({
        student_id: student2._id,
        activity_id: activity._id
      });

      if (!attendance2) {
        attendance2 = new Attendance({
          student_id: student2._id,
          activity_id: activity._id,
          status: 'present',
          verified: true,
          verified_at: new Date(),
          points: 9,
          scanned_at: new Date()
        });
        await attendance2.save();
      }

      attendance2.feedback = 'Em khiếu nại về cách tính điểm, vì em đã hoàn thành tất cả yêu cầu';
      attendance2.feedback_time = new Date(Date.now() - 86400000); // 1 ngày trước
      attendance2.feedback_status = 'accepted';
      attendance2.feedback_verified_at = new Date();
      attendance2.points = 10; // Điểm được cập nhật
      await attendance2.save();

      console.log(`✅ Tạo feedback đã chấp nhận thành công`);
      console.log(`  - Trạng thái: ${attendance2.feedback_status}`);
      console.log(`  - Điểm mới: ${attendance2.points}`);
      console.log(`  - Xác nhận lúc: ${attendance2.feedback_verified_at}`);
    }

    console.log('\n\n✅ Hoàn tất thêm dữ liệu mẫu!');
    console.log('\n📌 Hướng dẫn test:');
    console.log('  1. Sinh viên gửi phản hồi: POST /api/attendances/:attendanceId/submit-feedback');
    console.log('  2. Staff duyệt phản hồi: PUT /api/attendances/:attendanceId/approve-feedback');
    console.log('  3. Xem phản hồi chờ duyệt: GET /api/attendances/faculty/:facultyId/pending-feedbacks');

    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
    process.exit(1);
  }
}

seedAttendanceFeedback();
