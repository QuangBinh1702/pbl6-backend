// Seed script để tạo dữ liệu mẫu cho notifications
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');

// Import models
const Notification = require('./src/models/notification.model');
const User = require('./src/models/user.model');

async function connectDBLocal() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }
  const dbName = process.env.MONGODB_NAME || 'Community_Activity_Management';
  await mongoose.connect(mongoUri, { dbName });
  console.log(`✅ Kết nối: ${dbName}\n`);
}

async function seedNotifications() {
  try {
    console.log('\n' + '='.repeat(70));
    console.log('🌱 SEED NOTIFICATIONS');
    console.log('='.repeat(70) + '\n');
    
    await connectDBLocal();
    const db = mongoose.connection.db;
    
    console.log('🗑️  Xóa dữ liệu notifications cũ...\n');
    await db.collection('notification').deleteMany({});
    await db.collection('notification_read').deleteMany({});
    console.log('   ✅ Đã xóa notifications và notification_read\n');
    
    console.log('='.repeat(70));
    console.log('📝 TẠO NOTIFICATIONS MẪU');
    console.log('='.repeat(70) + '\n');
    
    // Lấy admin user để làm created_by
    const adminUser = await User.findOne({ username: 'admin' });
    if (!adminUser) {
      console.error('❌ Không tìm thấy admin user. Vui lòng chạy seed_correct_structure.js trước!');
      return;
    }
    
    // Tạo các notifications mẫu
    const notifications = [
      {
        title: 'Thông báo lịch học tuần này',
        content: 'Các lớp học sẽ bắt đầu lúc 7h30 sáng thứ 2. Vui lòng có mặt đúng giờ và chuẩn bị đầy đủ tài liệu học tập.',
        published_date: new Date('2025-10-23T00:00:00.000Z'),
        icon_type: 'megaphone',
        notification_type: 'schedule',
        target_audience: 'all',
        target_user_ids: [],
        created_by: adminUser._id
      },
      {
        title: 'Cập nhật điểm rèn luyện',
        content: 'Điểm rèn luyện học kỳ vừa rồi đã được công bố. Sinh viên có thể xem chi tiết trong mục Kết quả học tập.',
        published_date: new Date('2025-10-22T00:00:00.000Z'),
        icon_type: 'megaphone',
        notification_type: 'score_update',
        target_audience: 'all',
        target_user_ids: [],
        created_by: adminUser._id
      },
      {
        title: 'Thông báo nghỉ học',
        content: 'Lớp Kiểm thử phần mềm ngày 25/10 tạm hoãn. Lịch học bù sẽ được thông báo sau.',
        published_date: new Date('2025-10-21T00:00:00.000Z'),
        icon_type: 'megaphone',
        notification_type: 'cancellation',
        target_audience: 'all',
        target_user_ids: [],
        created_by: adminUser._id
      },
      {
        title: 'Hướng dẫn đăng ký môn học',
        content: 'Thời gian đăng ký môn học học kỳ mới bắt đầu từ ngày 01/11. Sinh viên vui lòng hoàn thành trước ngày 15/11.',
        published_date: new Date('2025-10-20T00:00:00.000Z'),
        icon_type: 'megaphone',
        notification_type: 'registration_guide',
        target_audience: 'all',
        target_user_ids: [],
        created_by: adminUser._id
      },
      {
        title: 'Thông báo hoạt động tình nguyện',
        content: 'Hoạt động tình nguyện tại trung tâm bảo trợ xã hội sẽ diễn ra vào cuối tuần này. Sinh viên quan tâm vui lòng đăng ký.',
        published_date: new Date('2025-10-19T00:00:00.000Z'),
        icon_type: 'megaphone',
        notification_type: 'activity',
        target_audience: 'student',
        target_user_ids: [],
        created_by: adminUser._id
      },
      {
        title: 'Họp phòng CTSV',
        content: 'Thông báo họp phòng CTSV vào thứ 2 tuần sau lúc 8h00 sáng. Tất cả cán bộ vui lòng có mặt đúng giờ.',
        published_date: new Date('2025-10-18T00:00:00.000Z'),
        icon_type: 'megaphone',
        notification_type: 'announcement',
        target_audience: 'staff',
        target_user_ids: [],
        created_by: adminUser._id
      },
      {
        title: 'Thông báo về kỳ thi cuối kỳ',
        content: 'Lịch thi cuối kỳ đã được công bố. Sinh viên vui lòng kiểm tra lịch thi và chuẩn bị đầy đủ giấy tờ cần thiết.',
        published_date: new Date('2025-10-17T00:00:00.000Z'),
        icon_type: 'megaphone',
        notification_type: 'general',
        target_audience: 'student',
        target_user_ids: [],
        created_by: adminUser._id
      },
      {
        title: 'Cập nhật quy định học tập',
        content: 'Quy định học tập mới đã được cập nhật. Sinh viên vui lòng đọc kỹ và tuân thủ các quy định này.',
        published_date: new Date('2025-10-16T00:00:00.000Z'),
        icon_type: 'megaphone',
        notification_type: 'general',
        target_audience: 'all',
        target_user_ids: [],
        created_by: adminUser._id
      }
    ];
    
    // Insert notifications
    const insertedNotifications = await Notification.insertMany(notifications);
    console.log(`   ✅ Đã tạo ${insertedNotifications.length} notifications\n`);
    
    // Hiển thị thông tin các notifications đã tạo
    console.log('📋 Danh sách notifications đã tạo:');
    insertedNotifications.forEach((notif, index) => {
      console.log(`   ${index + 1}. ${notif.title} (${notif.notification_type}) - ${notif.target_audience}`);
    });
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ HOÀN THÀNH SEED NOTIFICATIONS');
    console.log('='.repeat(70) + '\n');
    
    console.log('💡 Lưu ý:');
    console.log('   - Notifications được tạo với target_audience: all, student, staff');
    console.log('   - Tất cả notifications đều chưa được đọc (chưa có record trong notification_read)');
    console.log('   - Bạn có thể test API để đánh dấu đã đọc và xem kết quả\n');
    
  } catch (error) {
    console.error('❌ Lỗi khi seed notifications:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedNotifications();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Đã đóng kết nối\n');
  }
}

main();

