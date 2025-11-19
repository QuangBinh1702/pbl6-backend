/**
 * Tạo thêm hoạt động và attendance cho sinh viên 102220095
 * Hoạt động có đầy đủ các trạng thái: pending, approved, in_progress, completed, rejected, cancelled
 * 
 * Chạy: node scripts/seed_activities_attendance.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Models
const Activity = require('../src/models/activity.model');
const ActivityRegistration = require('../src/models/activity_registration.model');
const StudentProfile = require('../src/models/student_profile.model');
const OrgUnit = require('../src/models/org_unit.model');
const Field = require('../src/models/field.model');
const Attendance = require('../src/models/attendance.model');

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
async function seedActivitiesAndAttendance() {
  try {
    console.log('═════════════════════════════════════════════════════════════');
    console.log('📝 TẠO HOẠT ĐỘNG VÀ ATTENDANCE CHO SINH VIÊN 102220095');
    console.log('═════════════════════════════════════════════════════════════\n');

    // Step 1: Lấy sinh viên 102220095
    console.log('👤 Tìm sinh viên 102220095...');
    const student = await StudentProfile.findOne({ student_number: '102220095' });
    
    if (!student) {
      console.log('   ✗ Sinh viên 102220095 không tồn tại');
      process.exit(1);
    }
    console.log(`   ✓ Tìm thấy: ${student.full_name} (ID: ${student._id})\n`);

    // Step 2: Ensure org units and fields
    console.log('🏢 Kiểm tra OrgUnit và Field...');
    let orgUnit = await OrgUnit.findOne({ name: 'Đoàn trường' });
    if (!orgUnit) {
      orgUnit = await OrgUnit.create({ name: 'Đoàn trường' });
    }

    let field = await Field.findOne({ name: 'Lễ tết' });
    if (!field) {
      field = await Field.create({ name: 'Lễ tết' });
    }
    console.log(`   ✓ OrgUnit: ${orgUnit.name}`);
    console.log(`   ✓ Field: ${field.name}\n`);

    // Step 3: Tạo hoạt động với các trạng thái khác nhau
    console.log('📋 Tạo hoạt động với các trạng thái...\n');

    const now = new Date();
    const baseDate = new Date(now.getFullYear(), 0, 1); // 1 tháng 1 năm hiện tại

    const activitiesToCreate = [
      {
        title: 'Hội thảo Khoa học Công nghệ',
        description: 'Hội thảo về công nghệ AI và Machine Learning',
        status: 'completed',
        location: 'A101',
        start_time: new Date(baseDate.getTime() + 86400000 * 10),  // 11 ngày sau
        end_time: new Date(baseDate.getTime() + 86400000 * 10 + 10800000), // 3 giờ sau
        registration_open: new Date(baseDate.getTime()),
        registration_close: new Date(baseDate.getTime() + 86400000 * 9),
        capacity: 100,
        requires_approval: false,
        has_attendance: true,
        points: 5
      },
      {
        title: 'Tuyên truyền An toàn thông tin',
        description: 'Hướng dẫn an toàn thông tin cho sinh viên',
        status: 'completed',
        location: 'B202',
        start_time: new Date(baseDate.getTime() + 86400000 * 20),
        end_time: new Date(baseDate.getTime() + 86400000 * 20 + 7200000), // 2 giờ
        registration_open: new Date(baseDate.getTime()),
        registration_close: new Date(baseDate.getTime() + 86400000 * 19),
        capacity: 150,
        requires_approval: false,
        has_attendance: true,
        points: 3
      },
      {
        title: 'Chương trình Tình nguyện Tháng Ba',
        description: 'Chương trình tình nguyện cộng đồng',
        status: 'in_progress',
        location: 'C303',
        start_time: new Date(now.getTime() + 3600000), // 1 giờ sau
        end_time: new Date(now.getTime() + 7200000), // 2 giờ sau
        registration_open: new Date(baseDate.getTime()),
        registration_close: new Date(now.getTime()),
        capacity: 200,
        requires_approval: false,
        has_attendance: true,
        points: 4
      },
      {
        title: 'Đại hội Đoàn thanh niên 2024',
        description: 'Đại hội đoàn và bầu cử cán bộ',
        status: 'approved',
        location: 'Sân vận động',
        start_time: new Date(now.getTime() + 86400000 * 30), // 30 ngày sau
        end_time: new Date(now.getTime() + 86400000 * 30 + 14400000), // 4 giờ
        registration_open: new Date(now.getTime()),
        registration_close: new Date(now.getTime() + 86400000 * 25),
        capacity: 500,
        requires_approval: true,
        has_attendance: false,
        points: 0
      },
      {
        title: 'Cuộc thi Khởi nghiệp sinh viên',
        description: 'Cuộc thi ý tưởng khởi nghiệp',
        status: 'pending',
        location: 'D404',
        start_time: new Date(now.getTime() + 86400000 * 45),
        end_time: new Date(now.getTime() + 86400000 * 45 + 10800000), // 3 giờ
        registration_open: new Date(now.getTime()),
        registration_close: new Date(now.getTime() + 86400000 * 40),
        capacity: 80,
        requires_approval: true,
        has_attendance: false,
        points: 0
      },
      {
        title: 'Hội thảo về Kế hoạch sắp hủy',
        description: 'Hội thảo bị hủy do lý do bất khả kháng',
        status: 'cancelled',
        location: 'E505',
        start_time: new Date(now.getTime() + 86400000 * 5),
        end_time: new Date(now.getTime() + 86400000 * 5 + 5400000),
        registration_open: new Date(baseDate.getTime()),
        registration_close: new Date(now.getTime() + 86400000 * 3),
        capacity: 60,
        requires_approval: false,
        has_attendance: false,
        points: 0
      },
      {
        title: 'Khóa học lập trình bị từ chối',
        description: 'Khóa học lập trình web',
        status: 'rejected',
        location: 'F606',
        start_time: new Date(now.getTime() - 86400000 * 10), // đã qua
        end_time: new Date(now.getTime() - 86400000 * 10 + 21600000), // 6 giờ
        registration_open: new Date(baseDate.getTime()),
        registration_close: new Date(baseDate.getTime() + 86400000 * 5),
        capacity: 40,
        requires_approval: true,
        has_attendance: false,
        points: 0
      }
    ];

    const createdActivities = [];

    for (let i = 0; i < activitiesToCreate.length; i++) {
      const activityData = activitiesToCreate[i];
      const { has_attendance, points, ...createData } = activityData;
      
      createData.org_unit_id = orgUnit._id;
      createData.field_id = field._id;

      let activity = await Activity.findOne({ title: activityData.title });
      
      if (!activity) {
        activity = await Activity.create(createData);
        console.log(`   ✓ ${(i+1)}. ${activity.title} - Status: ${activity.status}`);
      } else {
        console.log(`   ⚠️  ${(i+1)}. ${activity.title} - Already exists`);
      }

      createdActivities.push({
        activity,
        has_attendance,
        points
      });
    }

    console.log();

    // Step 4: Tạo Activity Registrations
    console.log('📝 Tạo Activity Registrations...\n');
    
    let registrationCount = 0;
    for (let i = 0; i < createdActivities.length; i++) {
      const { activity, has_attendance, points } = createdActivities[i];
      
      const existing = await ActivityRegistration.findOne({
        activity_id: activity._id,
        student_id: student._id
      });

      if (!existing) {
        // Quyết định status đăng ký dựa trên trạng thái hoạt động
        let regStatus = 'pending';
        if (activity.status === 'completed' || activity.status === 'in_progress') {
          regStatus = 'approved';
        } else if (activity.status === 'cancelled') {
          regStatus = 'cancelled';
        } else if (activity.status === 'rejected') {
          regStatus = 'rejected';
        }

        const registeredAt = new Date(activity.registration_open.getTime() + 86400000 * 2);

        const registration = await ActivityRegistration.create({
          activity_id: activity._id,
          student_id: student._id,
          registered_at: registeredAt,
          status: regStatus,
          approval_note: regStatus === 'rejected' ? 'Hoạt động không được duyệt' : null,
          approved_by: null,
          approved_at: regStatus === 'approved' ? new Date(registeredAt.getTime() + 3600000) : null,
          cancellation_reason: null,
          cancelled_at: null,
          cancelled_by: null,
          status_history: [
            {
              status: 'pending',
              changed_at: registeredAt,
              changed_by: null,
              reason: 'Initial registration'
            }
          ]
        });

        if (regStatus === 'approved') {
          registration.status_history.push({
            status: 'approved',
            changed_at: new Date(registeredAt.getTime() + 3600000),
            changed_by: null,
            reason: 'Auto approved'
          });
        }

        await registration.save();
        registrationCount++;
        console.log(`   ✓ Đăng ký: ${activity.title}`);
      }
    }

    console.log(`\n   ✓ Tổng: ${registrationCount} đăng ký\n`);

    // Step 5: Tạo Attendance Records
    console.log('✅ Tạo Attendance Records...\n');
    
    let attendanceCount = 0;
    for (const { activity, has_attendance, points } of createdActivities) {
      if (!has_attendance) continue;

      const registration = await ActivityRegistration.findOne({
        activity_id: activity._id,
        student_id: student._id,
        status: 'approved'
      });

      if (registration) {
        const existingAttendance = await Attendance.findOne({
          student_id: student._id,
          activity_id: activity._id
        });

        if (!existingAttendance) {
          const checkInTime = new Date(activity.start_time.getTime() + 600000); // 10 phút sau bắt đầu
          const checkOutTime = new Date(activity.end_time.getTime() - 600000); // 10 phút trước kết thúc

          await Attendance.create({
            student_id: student._id,
            activity_id: activity._id,
            activity_registration_id: registration._id,
            check_in_time: checkInTime,
            check_out_time: checkOutTime,
            attendance_status: 'attended',
            notes: 'Tham dự đầy đủ hoạt động',
            points: points
          });

          attendanceCount++;
          console.log(`   ✓ ${activity.title} - ${points} điểm`);
        }
      }
    }

    console.log();

    // Summary
    console.log('═════════════════════════════════════════════════════════════');
    console.log('✅ HOÀN TẤT!');
    console.log('═════════════════════════════════════════════════════════════\n');

    console.log('📊 Thống kê:');
    console.log(`   ✓ Hoạt động tạo: ${createdActivities.length}`);
    console.log(`   ✓ Đăng ký: ${registrationCount}`);
    console.log(`   ✓ Attendance: ${attendanceCount}`);
    console.log(`   ✓ Tổng điểm: ${createdActivities.reduce((sum, a) => sum + (a.points || 0), 0)}\n`);

    console.log('📋 Các trạng thái hoạt động:');
    console.log('   • pending - Chờ duyệt');
    console.log('   • approved - Chưa tổ chức');
    console.log('   • in_progress - Đang tổ chức');
    console.log('   • completed - Đã tổ chức (có attendance & điểm)');
    console.log('   • cancelled - Hủy hoạt động');
    console.log('   • rejected - Từ chối');
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
connectDB().then(() => seedActivitiesAndAttendance());
