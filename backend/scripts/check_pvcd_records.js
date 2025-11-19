/**
 * Kiểm tra pvcd_record có đúng không
 * So sánh total_point với tổng điểm từ attendance
 * 
 * Chạy: node scripts/check_pvcd_records.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Models
const PvcdRecord = require('../src/models/pvcd_record.model');
const Attendance = require('../src/models/attendance.model');
const StudentProfile = require('../src/models/student_profile.model');

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
async function checkPvcdRecords() {
  try {
    console.log('═════════════════════════════════════════════════════════════');
    console.log('🔍 KIỂM TRA PVCD_RECORD');
    console.log('═════════════════════════════════════════════════════════════\n');

    const pvcdRecords = await PvcdRecord.find().lean();
    console.log(`📊 Tổng số bản ghi pvcd_record: ${pvcdRecords.length}\n`);

    let hasError = false;
    const discrepancies = [];

    console.log('🔎 Kiểm tra từng bản ghi...\n');

    for (const pvcd of pvcdRecords) {
      // Tính tổng điểm từ attendance
      const attendanceData = await Attendance.find({
        student_id: pvcd.student_id,
        points: { $exists: true, $ne: null }
      }).lean();

      const year = typeof pvcd.year === 'number' ? pvcd.year : new Date(pvcd.year).getFullYear();
      let calculatedTotal = 0;

      for (const att of attendanceData) {
        if (new Date(att.scanned_at).getFullYear() === year) {
          calculatedTotal += att.points || 0;
        }
      }

      const currentTotal = pvcd.total_point;

      if (Math.abs(calculatedTotal - currentTotal) > 0.01) {
        hasError = true;
        const student = await StudentProfile.findById(pvcd.student_id).lean();
        
        discrepancies.push({
          student_id: pvcd.student_id,
          student_number: student?.student_number,
          full_name: student?.full_name,
          year,
          current_total: currentTotal,
          calculated_total: calculatedTotal,
          difference: calculatedTotal - currentTotal
        });
      }
    }

    if (discrepancies.length === 0) {
      console.log('✅ Tất cả pvcd_record đều chính xác!\n');
    } else {
      console.log(`❌ Tìm thấy ${discrepancies.length} bản ghi sai:\n`);
      discrepancies.forEach(disc => {
        console.log(`   📌 ${disc.student_number} - ${disc.full_name}`);
        console.log(`      Year: ${disc.year}`);
        console.log(`      Current: ${disc.current_total} | Calculated: ${disc.calculated_total}`);
        console.log(`      Difference: ${disc.difference}\n`);
      });
    }

    // Thống kê
    const attendanceRecords = await Attendance.find().lean();
    const uniqueStudents = new Set(attendanceRecords.map(a => a.student_id.toString()));

    console.log('═════════════════════════════════════════════════════════════');
    console.log('📊 THỐNG KÊ');
    console.log('═════════════════════════════════════════════════════════════\n');
    console.log(`   ✓ Pvcd_record: ${pvcdRecords.length}`);
    console.log(`   ✓ Sinh viên có attendance: ${uniqueStudents.size}`);
    console.log(`   ✓ Attendance records: ${attendanceRecords.length}`);
    console.log(`   ✓ Bản ghi sai: ${discrepancies.length}`);
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
connectDB().then(() => checkPvcdRecords());
