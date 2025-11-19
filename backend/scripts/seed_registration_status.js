/**
 * Script seed dữ liệu cho Activity Registration Status
 * Tạo 2 dữ liệu mẫu với activity_id và student_id thực tế
 * Chạy: node seed_registration_status.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Models
const Activity = require('../src/models/activity.model');
const StudentProfile = require('../src/models/student_profile.model');
const ActivityRegistration = require('../src/models/activity_registration.model');

// Connect to MongoDB
async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_NAME || 'Community_Activity_Management';
    
    console.log(`📍 Connecting to: ${dbName}\n`);
    
    await mongoose.connect(mongoUri, { dbName });
    console.log('✓ MongoDB connected');
  } catch (err) {
    console.error('✗ MongoDB connection error:', err.message);
    process.exit(1);
  }
}

// Main seed function
async function seedRegistrationStatus() {
  try {
    console.log('\n📝 Bắt đầu seed dữ liệu Activity Registration Status...\n');

    // 1. Lấy activity thực tế từ database
    const activities = await Activity.find().limit(2);
    if (activities.length < 1) {
      console.error('✗ Không tìm thấy Activity nào trong database');
      process.exit(1);
    }
    console.log(`✓ Tìm thấy ${activities.length} activity`);

    // 2. Lấy student thực tế từ database
    const students = await StudentProfile.find().limit(2);
    if (students.length < 1) {
      console.error('✗ Không tìm thấy Student nào trong database');
      process.exit(1);
    }
    console.log(`✓ Tìm thấy ${students.length} student\n`);

    // 3. Tạo 2 dữ liệu mẫu
    const sampleData = [
      {
        activity_id: activities[0]._id,
        student_id: students[0]._id,
        registered_at: new Date('2024-01-15'),
        status: 'approved',
        approval_note: null,
        approved_by: null,
        approved_at: new Date('2024-01-16'),
        cancellation_reason: null,
        cancelled_at: null,
        cancelled_by: null,
        status_history: [
          {
            status: 'pending',
            changed_at: new Date('2024-01-15'),
            changed_by: null,
            reason: 'Initial registration'
          },
          {
            status: 'approved',
            changed_at: new Date('2024-01-16'),
            changed_by: null,
            reason: 'Auto approved - no approval required'
          }
        ]
      },
      {
        activity_id: activities[activities.length - 1]._id,
        student_id: students[students.length - 1]._id,
        registered_at: new Date('2024-01-20'),
        status: 'pending',
        approval_note: null,
        approved_by: null,
        approved_at: null,
        cancellation_reason: null,
        cancelled_at: null,
        cancelled_by: null,
        status_history: [
          {
            status: 'pending',
            changed_at: new Date('2024-01-20'),
            changed_by: null,
            reason: 'Initial registration - waiting for approval'
          }
        ]
      }
    ];

    // 4. Check registration đã tồn tại chưa
    console.log('📋 Kiểm tra dữ liệu hiện tại...');
    const existingCount = await ActivityRegistration.countDocuments();
    console.log(`   Số registration hiện có: ${existingCount}`);

    // 5. Delete existing sample data nếu có (optional)
    const deleteResult = await ActivityRegistration.deleteMany({
      activity_id: { $in: [activities[0]._id, activities[activities.length - 1]._id] },
      student_id: { $in: [students[0]._id, students[students.length - 1]._id] }
    });
    console.log(`✓ Xóa ${deleteResult.deletedCount} registration cũ\n`);

    // 6. Insert dữ liệu mẫu
    console.log('📥 Thêm dữ liệu mẫu...');
    const registrations = await ActivityRegistration.insertMany(sampleData);

    console.log(`✓ Đã thêm ${registrations.length} registration mẫu\n`);

    // 7. Display kết quả
    console.log('═════════════════════════════════════════════════════════════');
    console.log('📊 DỮ LIỆU MẪU ĐÃ THÊM:');
    console.log('═════════════════════════════════════════════════════════════\n');

    for (let i = 0; i < registrations.length; i++) {
      const reg = registrations[i];
      const activity = activities[i % activities.length];
      const student = students[i % students.length];

      console.log(`${i + 1}. Registration #${reg._id}`);
      console.log(`   Activity: ${activity.title}`);
      console.log(`   Student: ${student.full_name} (${student.student_number})`);
      console.log(`   Status: ${reg.status}`);
      console.log(`   Registered: ${reg.registered_at.toLocaleString('vi-VN')}`);
      console.log(`   Status History: ${reg.status_history.length} entries`);
      console.log('');
    }

    console.log('═════════════════════════════════════════════════════════════');
    console.log('\n✅ Seed dữ liệu thành công!\n');

    // 8. Show thêm thông tin hữu ích
    console.log('💡 Thông tin hữu ích:');
    console.log(`   - Activity ID (mẫu 1): ${activities[0]._id}`);
    console.log(`   - Activity ID (mẫu 2): ${activities[activities.length - 1]._id}`);
    console.log(`   - Student ID (mẫu 1): ${students[0]._id}`);
    console.log(`   - Student ID (mẫu 2): ${students[students.length - 1]._id}`);
    console.log('\n');

  } catch (err) {
    console.error('✗ Lỗi seed dữ liệu:', err.message);
    console.error(err);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('✓ Kết nối MongoDB đã đóng');
    process.exit(0);
  }
}

// Run
connectDB().then(() => seedRegistrationStatus());
