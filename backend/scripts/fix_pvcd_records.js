/**
 * Sửa lại pvcd_record từ attendance
 * 1. Tạo pvcd_record mới cho sinh viên có attendance nhưng chưa có
 * 2. Sửa pvcd_record sai (cộng lại điểm từ attendance)
 * 
 * Chạy: node scripts/fix_pvcd_records.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Models
const PvcdRecord = require('../src/models/pvcd_record.model');
const Attendance = require('../src/models/attendance.model');
const StudentProfile = require('../src/models/student_profile.model');
const Activity = require('../src/models/activity.model'); // Đảm bảo Activity schema được register

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

// Main function
async function fixPvcdRecords() {
  try {
    console.log('═════════════════════════════════════════════════════════════');
    console.log('🔧 SỬA LẠI PVCD_RECORD TỪ ATTENDANCE');
    console.log('═════════════════════════════════════════════════════════════\n');

    // BƯỚC 1: Tạo pvcd_record mới cho sinh viên có attendance nhưng chưa có
    console.log('📝 BƯỚC 1: Tạo/cập nhật pvcd_record cho sinh viên có attendance...\n');

    // Lấy tất cả attendance, group by student_id và năm
    const attendanceRecords = await Attendance.find({ points: { $exists: true, $ne: null } })
      .lean();

    // Group by student_id và năm
    const attendanceByStudentYear = {};
    for (const att of attendanceRecords) {
      const year = new Date(att.scanned_at).getFullYear();
      const key = `${att.student_id}-${year}`;
      
      if (!attendanceByStudentYear[key]) {
        attendanceByStudentYear[key] = {
          student_id: att.student_id,
          year,
          total_points: 0
        };
      }
      attendanceByStudentYear[key].total_points += att.points || 0;
    }

    // Tìm những bản ghi cần tạo mới hoặc cập nhật
    let createdCount = 0;
    let updatedCount = 0;
    const createdRecords = [];

    for (const key in attendanceByStudentYear) {
      const { student_id, year, total_points } = attendanceByStudentYear[key];

      // Kiểm tra có bản ghi nào cho student này không (bất kể year)
      const existing = await PvcdRecord.findOne({
        student_id: student_id
      }).lean();

      // Lấy info sinh viên
      const student = await StudentProfile.findById(student_id).lean();
      
      if (student) {
        if (!existing) {
          console.log(`   📌 ${student.student_number} (${student.full_name}): ${year} - ${total_points} điểm [TẠO MỚI]`);
          
          // Tạo mới (lưu year là number)
          await PvcdRecord.collection.insertOne({
            student_id: new mongoose.Types.ObjectId(student_id),
            year: parseInt(year),
            total_point: total_points,
            createdAt: new Date(),
            updatedAt: new Date()
          });

          createdRecords.push({
            student_id,
            student_number: student.student_number,
            full_name: student.full_name,
            year,
            total_points
          });
          createdCount++;
        } else if (existing.year !== year) {
          console.log(`   📌 ${student.student_number} (${student.full_name}): ${existing.year} → ${year} [CẬP NHẬT YEAR]`);
          
          // Cập nhật year và points
          await PvcdRecord.collection.updateOne(
            { _id: existing._id },
            { $set: { year: parseInt(year), total_point: total_points, updatedAt: new Date() } }
          );
          updatedCount++;
        }
      }
    }

    if (createdCount === 0 && updatedCount === 0) {
      console.log('   ✓ Tất cả pvcd_record đã đúng!\n');
    } else {
      console.log(`\n   ✅ Đã tạo ${createdCount} pvcd_record mới, cập nhật ${updatedCount} bản ghi!\n`);
    }

    // BƯỚC 2: Sửa lại pvcd_record sai
    console.log('📝 BƯỚC 2: Sửa lại pvcd_record sai...\n');

    const pvcdRecords = await PvcdRecord.find().lean();
    let fixedCount = 0;
    const fixedRecords = [];

    for (const pvcd of pvcdRecords) {
      // Tính tổng điểm từ attendance
      const attendanceData = await Attendance.find({
        student_id: pvcd.student_id,
        points: { $exists: true, $ne: null }
      }).lean();

      const year = typeof pvcd.year === 'number' ? pvcd.year : new Date(pvcd.year).getFullYear();
      let calculatedTotal = 0;

      for (const att of attendanceData) {
        const attYear = typeof att.scanned_at === 'number' ? att.scanned_at : new Date(att.scanned_at).getFullYear();
        if (attYear === year) {
          calculatedTotal += att.points || 0;
        }
      }

      // Cap total_point at 100
      calculatedTotal = Math.min(calculatedTotal, 100);

      // Nếu có sai lệch, cập nhật (dùng updateOne trên collection để bypass pre hook)
      if (Math.abs(calculatedTotal - pvcd.total_point) > 0.01) {
        await PvcdRecord.collection.updateOne(
          { _id: pvcd._id },
          { $set: { total_point: calculatedTotal, updatedAt: new Date() } }
        );

        const student = await StudentProfile.findById(pvcd.student_id).lean();
        console.log(`   📌 ${student?.student_number}: ${pvcd.total_point} → ${calculatedTotal}`);

        fixedRecords.push({
          student_id: pvcd.student_id,
          year,
          old_total: pvcd.total_point,
          new_total: calculatedTotal
        });
        fixedCount++;
      }
    }

    if (fixedCount === 0) {
      console.log('   ✓ Không có bản ghi nào cần sửa!\n');
    } else {
      console.log(`\n   ✅ Đã sửa ${fixedCount} bản ghi!\n`);
    }

    // BƯỚC 3: Kiểm tra lại
    console.log('🔍 BƯỚC 3: Kiểm tra lại sau khi sửa...\n');

    let isValid = true;
    const pvcdCheckRecords = await PvcdRecord.find().lean();

    for (const pvcd of pvcdCheckRecords) {
      const attendanceData = await Attendance.find({
        student_id: pvcd.student_id,
        points: { $exists: true, $ne: null }
      }).lean();

      const year = new Date(pvcd.year).getFullYear();
      let calculatedTotal = 0;

      for (const att of attendanceData) {
        if (new Date(att.scanned_at).getFullYear() === year) {
          calculatedTotal += att.points || 0;
        }
      }

      if (Math.abs(calculatedTotal - pvcd.total_point) > 0.01) {
        isValid = false;
        break;
      }
    }

    if (isValid) {
      console.log('   ✅ Tất cả pvcd_record đều chính xác!\n');
    } else {
      console.log('   ⚠️  Vẫn còn bản ghi không đúng!\n');
    }

    // Summary
    console.log('═════════════════════════════════════════════════════════════');
    console.log('✅ HOÀN TẤT!');
    console.log('═════════════════════════════════════════════════════════════\n');

    console.log('📊 Thống kê:');
    console.log(`   ✓ Pvcd_record tạo mới: ${createdCount}`);
    console.log(`   ✓ Pvcd_record đã sửa: ${fixedCount}`);
    console.log(`   ✓ Trạng thái: ${isValid ? 'Hợp lệ ✅' : 'Có lỗi ⚠️'}`);
    console.log();

  } catch (err) {
    console.error('✗ Lỗi:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Kết nối MongoDB đã đóng');
    process.exit(0);
  }
}

// Run
connectDB().then(() => fixPvcdRecords());
