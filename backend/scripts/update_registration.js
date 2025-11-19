/**
 * Script cập nhật registration hiện tại và thêm dữ liệu mới
 * 1. Update registration với student_id = 68f905f7585ae2c65d0e5503
 * 2. Thêm registration mới với student_id = 690336c9b1cc04c096153554
 */

require('dotenv').config();
const mongoose = require('mongoose');

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
    console.log('✓ MongoDB connected\n');
  } catch (err) {
    console.error('✗ MongoDB connection error:', err.message);
    process.exit(1);
  }
}

async function updateRegistration() {
  try {
    console.log('═══════════════════════════════════════════════════════════\n');

    // 1. Cập nhật registration cũ
    console.log('📝 Cập nhật registration cũ...\n');

    const existingReg = await ActivityRegistration.findOne({
      student_id: '68f905f7585ae2c65d0e5503'
    });

    if (!existingReg) {
      console.log('✗ Không tìm thấy registration với student_id = 68f905f7585ae2c65d0e5503');
      console.log('  Vui lòng kiểm tra student_id\n');
    } else {
      console.log(`✓ Tìm thấy registration: ${existingReg._id}`);
      console.log(`  Activity: ${existingReg.activity_id}`);
      console.log(`  Student: ${existingReg.student_id}`);
      console.log(`  Status hiện tại: ${existingReg.status || 'chưa có'}\n`);

      // Cập nhật status từ pending → approved
      if (existingReg.status === 'pending') {
        existingReg.status = 'approved';
        existingReg.approved_at = new Date();
        existingReg.changed_by = null;
        existingReg.change_reason = 'Auto approved - migrated from pending';

        await existingReg.save();
        console.log('✅ Đã cập nhật status: pending → approved\n');
      } else {
        console.log(`⚠️  Status đã là '${existingReg.status}', không cần cập nhật\n`);
      }
    }

    // 2. Thêm registration mới
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n📥 Thêm registration mới...\n');

    const newStudent = await StudentProfile.findById('690336c9b1cc04c096153554');
    if (!newStudent) {
      console.log('✗ Không tìm thấy student với ID = 690336c9b1cc04c096153554');
      console.log('  Vui lòng kiểm tra student_id\n');
    } else {
      console.log(`✓ Tìm thấy student: ${newStudent.full_name} (${newStudent.student_number})\n`);

      // Lấy activity để kiểm tra
      const activities = await Activity.find().limit(1);
      if (activities.length === 0) {
        console.log('✗ Không tìm thấy Activity nào trong database');
      } else {
        const activity = activities[0];
        console.log(`✓ Dùng Activity: ${activity.title}\n`);

        // Check xem đã đăng ký chưa
        const checkExisting = await ActivityRegistration.findOne({
          student_id: '690336c9b1cc04c096153554',
          activity_id: activity._id,
          status: { $ne: 'cancelled' }
        });

        if (checkExisting) {
          console.log(`⚠️  Student đã đăng ký activity này (status: ${checkExisting.status})`);
        } else {
          // Tạo registration mới
          const newReg = await ActivityRegistration.create({
            activity_id: activity._id,
            student_id: '690336c9b1cc04c096153554',
            registered_at: new Date(),
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
                changed_at: new Date(),
                changed_by: null,
                reason: 'Initial registration - waiting for approval'
              }
            ]
          });

          console.log(`✅ Đã thêm registration mới`);
          console.log(`   ID: ${newReg._id}`);
          console.log(`   Activity: ${activity.title}`);
          console.log(`   Student: ${newStudent.full_name}`);
          console.log(`   Status: ${newReg.status}\n`);
        }
      }
    }

    console.log('═══════════════════════════════════════════════════════════\n');

    // 3. Show tất cả registration hiện tại
    console.log('📋 Danh sách tất cả registration:\n');
    const allRegs = await ActivityRegistration.find()
      .populate('student_id', 'full_name student_number')
      .populate('activity_id', 'title');

    console.log(`Total: ${allRegs.length} registrations\n`);
    allRegs.forEach((reg, i) => {
      const student = reg.student_id;
      const activity = reg.activity_id;
      console.log(
        `${i + 1}. ${reg._id} | ${student?.full_name || 'N/A'} | ${activity?.title || 'N/A'} | Status: ${reg.status}`
      );
    });

    console.log('\n✅ Hoàn thành!\n');
  } catch (err) {
    console.error('✗ Lỗi:', err.message);
    console.error(err);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Kết nối MongoDB đã đóng\n');
    process.exit(0);
  }
}

// Run
connectDB().then(() => updateRegistration());
