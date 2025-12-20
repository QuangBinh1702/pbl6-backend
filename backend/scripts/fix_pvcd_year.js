/**
 * Script sửa lại year trong pvcd_record
 * Lấy year từ scanned_at của attendance records thay vì giá trị hiện tại
 * 
 * Chạy: node scripts/fix_pvcd_year.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Attendance = require('../src/models/attendance.model');
const PvcdRecord = require('../src/models/pvcd_record.model');

// Connect to database
async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_NAME || 'Community_Activity_Management';
    console.log(`📍 Connecting to: ${dbName}\n`);
    await mongoose.connect(mongoUri, { dbName });
    console.log('✓ MongoDB connected\n');
  } catch (err) {
    console.error('✗ Database connection error:', err.message);
    process.exit(1);
  }
}

async function fixPvcdYear() {
  try {
    console.log('🔧 SỬA LẠI YEAR TRONG PVCD_RECORD\n');

    // Bước 1: Lấy tất cả pvcd_record hiện tại
    const pvcdRecords = await PvcdRecord.find().lean();
    console.log(`📊 Tổng số pvcd_record: ${pvcdRecords.length}\n`);

    let fixedCount = 0;
    let noChangeCount = 0;
    let errorCount = 0;
    const errors = [];

    // Bước 2: Sửa lại year cho mỗi record
    for (const pvcdRecord of pvcdRecords) {
      try {
        // Lấy tất cả attendance của sinh viên này
        const attendances = await Attendance.find({
          student_id: pvcdRecord.student_id,
          points: { $exists: true, $ne: null }
        }).lean();

        if (attendances.length === 0) {
          console.log(`⚠️  Student ${pvcdRecord.student_id}: Không có attendance nào`);
          continue;
        }

        // Lấy year từ attendance (lấy year từ attendance gần nhất hoặc đầu tiên)
        const firstAttendance = attendances[0];
        const correctYear = new Date(firstAttendance.scanned_at).getFullYear();

        // Kiểm tra xem year có cần sửa không
        if (pvcdRecord.year === correctYear) {
          noChangeCount++;
          console.log(`✓ Student ${pvcdRecord.student_id}: Year đã đúng (${correctYear})`);
          continue;
        }

        // Cập nhật year
        await PvcdRecord.findByIdAndUpdate(
          pvcdRecord._id,
          { year: correctYear },
          { runValidators: true }
        );

        fixedCount++;
        console.log(`✅ Student ${pvcdRecord.student_id}: Sửa year ${pvcdRecord.year} → ${correctYear}`);
      } catch (err) {
        errorCount++;
        const errorMsg = `❌ Error for student ${pvcdRecord.student_id}: ${err.message}`;
        console.log(errorMsg);
        errors.push(errorMsg);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`\n📈 KẾT QUẢ:`);
    console.log(`   ✅ Sửa thành công: ${fixedCount} sinh viên`);
    console.log(`   ✓ Không cần sửa: ${noChangeCount} sinh viên`);
    console.log(`   ❌ Lỗi: ${errorCount} sinh viên\n`);

    if (errors.length > 0) {
      console.log('📋 Chi tiết lỗi:');
      errors.forEach(err => console.log(`   ${err}`));
    }

    // Kiểm tra lại dữ liệu
    console.log('\n' + '='.repeat(50));
    console.log('\n🔍 KIỂM TRA LẠI:\n');
    const updatedRecords = await PvcdRecord.find().lean();
    console.log(`   📊 Tổng số pvcd_record sau sửa: ${updatedRecords.length}`);

    // Kiểm tra year có hợp lệ không
    const invalidYears = updatedRecords.filter(
      r => !Number.isInteger(r.year) || r.year < 1900 || r.year > 2100
    );
    if (invalidYears.length > 0) {
      console.log(`   ⚠️  Year không hợp lệ: ${invalidYears.length}`);
    } else {
      console.log(`   ✅ Tất cả year đều hợp lệ!`);
    }

    // Kiểm tra total_point
    const invalidPoints = updatedRecords.filter(r => r.total_point < 0 || r.total_point > 100);
    if (invalidPoints.length > 0) {
      console.log(`   ⚠️  Total_point không hợp lệ: ${invalidPoints.length}`);
    } else {
      console.log(`   ✅ Tất cả total_point đều hợp lệ!`);
    }

    // Kiểm tra duplicate (student_id + year)
    const studentYearCombos = {};
    const duplicates = [];
    updatedRecords.forEach(r => {
      const key = `${r.student_id}-${r.year}`;
      if (studentYearCombos[key]) {
        duplicates.push(key);
      } else {
        studentYearCombos[key] = true;
      }
    });
    if (duplicates.length > 0) {
      console.log(`   ⚠️  Duplicate (student_id + year): ${duplicates.length}`);
    } else {
      console.log(`   ✅ Không có duplicate!\n`);
    }

    console.log('='.repeat(50));
    console.log('\n✨ Script hoàn thành!\n');
  } catch (err) {
    console.error('❌ Critical error:', err);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Kết nối MongoDB đã đóng');
    process.exit(0);
  }
}

// Run
connectDB().then(() => fixPvcdYear());
