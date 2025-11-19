/**
 * Tạo 1 tài khoản sinh viên đầy đủ
 * Mã số: 102220095
 * Khoa: Công nghệ thông tin
 * Khoá: 22 (năm 2022)
 * Lớp: 22T_DT2
 * 
 * Chạy: node scripts/seed_single_student.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Models
const User = require('../src/models/user.model');
const StudentProfile = require('../src/models/student_profile.model');
const Falcuty = require('../src/models/falcuty.model');
const Cohort = require('../src/models/cohort.model');
const Class = require('../src/models/class.model');
const Activity = require('../src/models/activity.model');
const ActivityRegistration = require('../src/models/activity_registration.model');
const ActivityRejection = require('../src/models/activity_rejection.model');
const Attendance = require('../src/models/attendance.model');
const Evidence = require('../src/models/evidence.model');
const Notification = require('../src/models/notification.model');
const NotificationRead = require('../src/models/notification_read.model');
const PVCDRecord = require('../src/models/pvcd_record.model');

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

// Generate random phone number (Việt Nam format)
function generatePhone() {
  const operators = ['32', '33', '34', '35', '36', '37', '38', '39', '70', '71', '72', '73', '74', '75', '76', '77', '78', '79', '80', '81', '82', '83', '84', '85', '86', '87', '88', '89', '90', '91', '92', '93', '94', '96', '97', '98', '99'];
  const operator = operators[Math.floor(Math.random() * operators.length)];
  const remaining = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  return `0${operator}${remaining}`;
}

// Generate address
function generateAddress() {
  const cities = ['Đà Nẵng', 'Hà Nội', 'TP. Hồ Chí Minh', 'Hải Phòng', 'Cần Thơ', 'Huế', 'Quảng Ninh', 'Bắc Ninh', 'Hưng Yên', 'Hải Dương'];
  const streets = ['Đường Nguyễn Tất Thành', 'Đường Trần Hưng Đạo', 'Đường Lê Đại Hành', 'Đường Phạm Văn Đồng', 'Đường Hoàng Minh Giám', 'Đường Cách Mạng Tháng Tám', 'Đường Lý Thái Tổ', 'Đường Võ Văn Kiệt', 'Đường Bạch Đằng', 'Đường Hàng Bông'];
  const number = Math.floor(Math.random() * 500) + 1;
  const city = cities[Math.floor(Math.random() * cities.length)];
  const street = streets[Math.floor(Math.random() * streets.length)];
  return `${number} ${street}, ${city}`;
}

// Main seed function
async function seedSingleStudent() {
  try {
    console.log('═════════════════════════════════════════════════════════════');
    console.log('👤 TẠO TÀI KHOẢN SINH VIÊN ĐẦY ĐỦ');
    console.log('═════════════════════════════════════════════════════════════\n');

    const studentData = {
      student_number: '102220095',
      full_name: 'Nguyễn Quang Bình',
      email: '102220095@sv1.dut.udn.vn',
      phone: generatePhone(),
      gender: 'Nam',
      date_of_birth: new Date('2004-02-17'),
      contact_address: '82/123 Nguyễn Lương Bằng',
      class_name: '22T_DT2',
      faculty_name: 'Công nghệ thông tin',
      cohort_year: 2022
    };

    console.log('📋 Dữ liệu tài khoản:');
    console.log(`   Mã số: ${studentData.student_number}`);
    console.log(`   Họ tên: ${studentData.full_name}`);
    console.log(`   Email: ${studentData.email}`);
    console.log(`   Giới tính: ${studentData.gender}`);
    console.log(`   Lớp: ${studentData.class_name}`);
    console.log(`   Khoa: ${studentData.faculty_name}`);
    console.log(`   Khoá: ${studentData.cohort_year}\n`);

    // Step 1: Create or get Faculty
    console.log('🏫 Kiểm tra/tạo Khoa...');
    let faculty = await Falcuty.findOne({ name: studentData.faculty_name });
    if (!faculty) {
      faculty = await Falcuty.create({ name: studentData.faculty_name });
      console.log(`   ✓ Tạo khoa mới: ${faculty.name} (ID: ${faculty._id})`);
    } else {
      console.log(`   ✓ Khoa tồn tại: ${faculty.name} (ID: ${faculty._id})`);
    }

    // Step 2: Create or get Cohort
    console.log('\n📅 Kiểm tra/tạo Khoá...');
    let cohort = await Cohort.findOne({ year: studentData.cohort_year });
    if (!cohort) {
      cohort = await Cohort.create({ year: studentData.cohort_year });
      console.log(`   ✓ Tạo khoá mới: ${cohort.year} (ID: ${cohort._id})`);
    } else {
      console.log(`   ✓ Khoá tồn tại: ${cohort.year} (ID: ${cohort._id})`);
    }

    // Step 3: Create or get Class
    console.log('\n🎓 Kiểm tra/tạo Lớp...');
    let classDoc = await Class.findOne({ name: studentData.class_name });
    if (!classDoc) {
      classDoc = await Class.create({
        name: studentData.class_name,
        falcuty_id: faculty._id,
        cohort_id: cohort._id
      });
      console.log(`   ✓ Tạo lớp mới: ${classDoc.name} (ID: ${classDoc._id})`);
    } else {
      console.log(`   ✓ Lớp tồn tại: ${classDoc.name} (ID: ${classDoc._id})`);
    }

    // Step 4: Check if student already exists
    console.log('\n👥 Kiểm tra sinh viên tồn tại...');
    let student = await StudentProfile.findOne({ student_number: studentData.student_number });
    
    if (student) {
      console.log(`   ⚠️  Sinh viên đã tồn tại: ${student.full_name}`);
      console.log(`   ID: ${student._id}\n`);
    } else {
      // Step 5: Create User
      console.log('\n🔐 Tạo User...');
      let user = await User.findOne({ username: studentData.student_number });
      if (!user) {
        const hashedPassword = await bcrypt.hash(studentData.student_number, 10);
        user = await User.create({
          username: studentData.student_number,
          password_hash: hashedPassword,
          active: true,
          isLocked: false
        });
        console.log(`   ✓ Tạo User: ${user.username} (ID: ${user._id})`);
      } else {
        console.log(`   ✓ User tồn tại: ${user.username} (ID: ${user._id})`);
      }

      // Step 6: Create StudentProfile
      console.log('\n📝 Tạo StudentProfile...');
      student = await StudentProfile.create({
        user_id: user._id,
        student_number: studentData.student_number,
        full_name: studentData.full_name,
        email: studentData.email,
        phone: studentData.phone,
        gender: studentData.gender,
        date_of_birth: studentData.date_of_birth,
        contact_address: studentData.contact_address,
        class_id: classDoc._id,
        isClassMonitor: false
      });
      console.log(`   ✓ StudentProfile tạo thành công (ID: ${student._id})\n`);
    }

    // Step 7: Register for activities
    console.log('📋 Đăng ký tham gia hoạt động...');
    const activities = await Activity.find().limit(3);
    
    let registrationCount = 0;
    let rejectionCount = 0;
    let attendanceCount = 0;
    
    if (activities.length === 0) {
      console.log('   ⚠️  Không có activity nào để đăng ký\n');
    } else {
      for (let i = 0; i < activities.length; i++) {
        const activity = activities[i];
        const existing = await ActivityRegistration.findOne({
          activity_id: activity._id,
          student_id: student._id
        });

        if (!existing) {
          const registeredAt = new Date();
          const statuses = ['pending', 'approved', 'rejected'];
          const status = statuses[Math.floor(Math.random() * statuses.length)];
          
          const registration = await ActivityRegistration.create({
            activity_id: activity._id,
            student_id: student._id,
            registered_at: registeredAt,
            status: status,
            approval_note: status === 'rejected' ? 'Vượt quá số lượng đăng ký' : null,
            approved_by: null,
            approved_at: status === 'approved' ? new Date(registeredAt.getTime() + 3600000) : null,
            cancellation_reason: null,
            cancelled_at: null,
            cancelled_by: null,
            status_history: [
              {
                status: 'pending',
                changed_at: registeredAt,
                changed_by: null,
                reason: 'Initial registration'
              },
              ...(status === 'approved' ? [{
                status: 'approved',
                changed_at: new Date(registeredAt.getTime() + 3600000),
                changed_by: null,
                reason: 'Auto approved'
              }] : []),
              ...(status === 'rejected' ? [{
                status: 'rejected',
                changed_at: new Date(registeredAt.getTime() + 7200000),
                changed_by: null,
                reason: 'Vượt quá số lượng đăng ký'
              }] : [])
            ]
          });
          registrationCount++;

          // Tạo Activity Rejection nếu bị từ chối
          if (status === 'rejected') {
            await ActivityRejection.create({
              activity_id: activity._id,
              reason: 'Vượt quá số lượng đăng ký',
              rejected_by: student.user_id, // User ID của sinh viên bị từ chối
              rejected_at: new Date(registeredAt.getTime() + 7200000)
            });
            rejectionCount++;
          }

          // Tạo Attendance nếu được duyệt
          if (status === 'approved') {
            await Attendance.create({
              student_id: student._id,
              activity_id: activity._id,
              activity_registration_id: registration._id,
              check_in_time: new Date(activity.start_time.getTime() + 600000),
              check_out_time: new Date(activity.end_time.getTime() - 600000),
              attendance_status: 'attended',
              notes: 'Tham dự đầy đủ'
            });
            attendanceCount++;
          }
        }
      }
      console.log(`   ✓ Đăng ký ${registrationCount} hoạt động\n`);
    }

    // Step 8: Create Evidence (bằng chứng tham gia)
    console.log('📸 Tạo bằng chứng tham gia...');
    const evidenceActivities = await Activity.find().limit(2);
    let evidenceCount = 0;
    for (const activity of evidenceActivities) {
      const evidence = await Evidence.create({
        student_id: student._id,
        activity_id: activity._id,
        evidence_type: 'image',
        evidence_url: 'https://via.placeholder.com/300x200?text=Evidence',
        description: `Bằng chứng tham gia hoạt động: ${activity.title}`,
        uploaded_at: new Date()
      });
      evidenceCount++;
    }
    console.log(`   ✓ Tạo ${evidenceCount} bằng chứng\n`);

    // Step 9: Create Notifications
    console.log('🔔 Tạo thông báo...');
    let notificationCount = 0;
    const notification = await Notification.create({
      title: 'Đăng ký hoạt động thành công',
      content: 'Bạn đã được duyệt tham gia hoạt động',
      published_date: new Date()
    });
    notificationCount++;

    // Step 10: Create Notification Read (đánh dấu đã đọc 1 số)
    console.log('📖 Đánh dấu thông báo đã đọc...');
    let notificationReadCount = 0;
    if (notificationCount > 0) {
      await NotificationRead.create({
        user_id: student.user_id,
        notification_id: notification._id,
        read_at: new Date()
      });
      notificationReadCount++;
    }
    console.log(`   ✓ Đã đọc ${notificationReadCount} thông báo\n`);

    // Step 11: Create PVCD Record (hồ sơ rèn luyện)
    console.log('📄 Tạo hồ sơ rèn luyện...');
    let pvcdCount = 0;
    const pvcdRecord = await PVCDRecord.create({
      student_id: student._id,
      year: 2023
    });
    pvcdCount++;
    console.log(`   ✓ Tạo ${pvcdCount} hồ sơ rèn luyện\n`);

    // Summary
    console.log('═════════════════════════════════════════════════════════════');
    console.log('✅ TẠO TÀI KHOẢN THÀNH CÔNG!');
    console.log('═════════════════════════════════════════════════════════════\n');

    console.log('📊 Thông tin chi tiết:');
    console.log(`   Student Number: ${studentData.student_number}`);
    console.log(`   Full Name: ${studentData.full_name}`);
    console.log(`   Email: ${studentData.email}`);
    console.log(`   Phone: ${studentData.phone}`);
    console.log(`   Gender: ${studentData.gender}`);
    console.log(`   DOB: ${studentData.date_of_birth.toLocaleDateString('vi-VN')}`);
    console.log(`   Address: ${studentData.contact_address}`);
    console.log(`   Class: ${studentData.class_name}`);
    console.log(`   Faculty: ${studentData.faculty_name}`);
    console.log(`   Cohort: ${studentData.cohort_year}\n`);

    console.log('📈 Dữ liệu được tạo:');
    console.log(`   Activity Registrations: ${registrationCount}`);
    console.log(`   Activity Rejections: ${rejectionCount}`);
    console.log(`   Attendances: ${attendanceCount}`);
    console.log(`   Evidence: ${evidenceCount}`);
    console.log(`   Notifications: ${notificationCount}`);
    console.log(`   Notification Reads: ${notificationReadCount}`);
    console.log(`   PVCD Records: ${pvcdCount}\n`);

    console.log('🆔 IDs:');
    console.log(`   StudentProfile ID: ${student._id}`);
    console.log(`   User ID: ${student.user_id}`);
    console.log(`   Class ID: ${classDoc._id}`);
    console.log(`   Faculty ID: ${faculty._id}`);
    console.log(`   Cohort ID: ${cohort._id}\n`);

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
connectDB().then(() => seedSingleStudent());
