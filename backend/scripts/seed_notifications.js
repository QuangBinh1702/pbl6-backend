/**
 * Seed Notifications - Xóa dữ liệu cũ và tạo notification mới
 * Ưu tiên gửi notification tới user của sinh viên 102220095
 * 
 * Chạy: node scripts/seed_notifications.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Models
const Notification = require('../src/models/notification.model');
const NotificationRead = require('../src/models/notification_read.model');
const StudentProfile = require('../src/models/student_profile.model');
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

// Main seed function
async function seedNotifications() {
  try {
    console.log('═════════════════════════════════════════════════════════════');
    console.log('📢 SEED NOTIFICATIONS');
    console.log('═════════════════════════════════════════════════════════════\n');

    // Step 1: Lấy user của sinh viên 102220095
    console.log('👤 Tìm user của sinh viên 102220095...');
    const student = await StudentProfile.findOne({ student_number: '102220095' });
    
    if (!student) {
      console.log('   ✗ Sinh viên 102220095 không tồn tại');
      process.exit(1);
    }

    const userStudent = await User.findById(student.user_id);
    if (!userStudent) {
      console.log('   ✗ User không tồn tại');
      process.exit(1);
    }
    console.log(`   ✓ User: ${userStudent.username} (ID: ${userStudent._id})\n`);

    // Step 2: Xóa dữ liệu cũ
    console.log('🗑️  Xóa dữ liệu notification cũ...');
    await NotificationRead.deleteMany({});
    await Notification.deleteMany({});
    console.log('   ✓ Đã xóa notification và notification_read\n');

    // Step 3: Tạo notifications mới
    console.log('📝 Tạo notifications mới...\n');

    const notificationsToCreate = [
      {
        title: 'Đăng ký hoạt động thành công',
        content: 'Bạn đã được duyệt tham gia hoạt động "Hội thảo Khoa học Công nghệ"',
        notification_type: 'activity',
        target_audience: 'specific',
        target_user_ids: [userStudent._id]
      },
      {
        title: 'Nhận xét về hoạt động',
        content: 'Bạn vừa nhận xét đánh giá về hoạt động "Tuyên truyền An toàn thông tin"',
        notification_type: 'registration_guide',
        target_audience: 'specific',
        target_user_ids: [userStudent._id]
      },
      {
        title: 'Cập nhật lịch tham gia hoạt động',
        content: 'Lịch tham gia hoạt động "Chương trình Tình nguyện Tháng Ba" đã được cập nhật',
        notification_type: 'schedule',
        target_audience: 'specific',
        target_user_ids: [userStudent._id]
      },
      {
        title: 'Thông báo chung cho tất cả sinh viên',
        content: 'Hạn đăng ký tham gia các hoạt động trong học kỳ này sẽ kết thúc vào ngày 31/05/2024',
        notification_type: 'announcement',
        target_audience: 'student'
      },
      {
        title: 'Hướng dẫn nộp minh chứng hoạt động',
        content: 'Vui lòng nộp minh chứng hoạt động trước hết hạn 10 ngày kể từ khi kết thúc hoạt động',
        notification_type: 'registration_guide',
        target_audience: 'all'
      },
      {
        title: 'Cập nhật điểm rèn luyện',
        content: 'Điểm rèn luyện của bạn đã được cập nhật sau hoạt động vừa rồi',
        notification_type: 'score_update',
        target_audience: 'specific',
        target_user_ids: [userStudent._id]
      },
      {
        title: 'Thông báo: Hoạt động bị hủy',
        content: 'Hoạt động "Hội thảo về Kế hoạch sắp hủy" đã bị hủy do lý do bất khả kháng',
        notification_type: 'cancellation',
        target_audience: 'all'
      }
    ];

    const createdNotifications = [];

    for (let i = 0; i < notificationsToCreate.length; i++) {
      const notifData = notificationsToCreate[i];
      
      const notification = await Notification.create({
        ...notifData,
        published_date: new Date(),
        icon_type: 'megaphone'
      });

      createdNotifications.push(notification);
      console.log(`   ✓ ${(i+1)}. ${notification.title}`);
      console.log(`      - Type: ${notification.notification_type}`);
      console.log(`      - Target: ${notification.target_audience}\n`);
    }

    // Step 4: Tạo notification_read records
    console.log('📖 Tạo notification_read records...\n');

    let notificationReadCount = 0;

    for (const notification of createdNotifications) {
      // Xác định ai sẽ đánh dấu đã đọc
      let userIdsToRead = [];

      if (notification.target_audience === 'specific' && notification.target_user_ids.length > 0) {
        // Nếu target là specific, chỉ user trong target_user_ids mới đánh dấu đã đọc
        userIdsToRead = notification.target_user_ids;
      } else if (notification.target_audience === 'student') {
        // Nếu target là student, tạo notification_read cho sinh viên 102220095
        userIdsToRead = [userStudent._id];
      } else if (notification.target_audience === 'all') {
        // Nếu target là all, tạo notification_read cho sinh viên 102220095
        userIdsToRead = [userStudent._id];
      }

      // Tạo notification_read records
      for (const userId of userIdsToRead) {
        const existing = await NotificationRead.findOne({
          notification_id: notification._id,
          user_id: userId
        });

        if (!existing) {
          await NotificationRead.create({
            notification_id: notification._id,
            user_id: userId,
            read_at: new Date()
          });
          notificationReadCount++;
        }
      }
    }

    console.log(`   ✓ Tạo ${notificationReadCount} notification_read records\n`);

    // Summary
    console.log('═════════════════════════════════════════════════════════════');
    console.log('✅ HOÀN TẤT!');
    console.log('═════════════════════════════════════════════════════════════\n');

    console.log('📊 Thống kê:');
    console.log(`   ✓ Notifications: ${createdNotifications.length}`);
    console.log(`   ✓ Notification Reads: ${notificationReadCount}`);
    console.log(`   ✓ Target user: ${userStudent.username} (102220095)\n`);

    console.log('📋 Notification Types:');
    console.log('   • activity - Thông báo hoạt động');
    console.log('   • schedule - Cập nhật lịch trình');
    console.log('   • score_update - Cập nhật điểm');
    console.log('   • cancellation - Hủy bỏ');
    console.log('   • registration_guide - Hướng dẫn đăng ký');
    console.log('   • general - Thông báo chung');
    console.log('   • announcement - Thông báo công khai');
    console.log();

  } catch (err) {
    console.error('✗ Lỗi:', err.message);
    console.error(err);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Kết nối MongoDB đã đóng');
    process.exit(0);
  }
}

// Run
connectDB().then(() => seedNotifications());
