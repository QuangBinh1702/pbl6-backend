/**
 * Script để cập nhật lại điểm PVCD cho một sinh viên cụ thể
 * 
 * Usage: node scripts/update_pvcd_student.js <student_number> <year>
 * Example: node scripts/update_pvcd_student.js 102220095 2025
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Models
const PvcdRecord = require('../src/models/pvcd_record.model');
const Evidence = require('../src/models/evidence.model');
const Attendance = require('../src/models/attendance.model');
const StudentProfile = require('../src/models/student_profile.model');

// Connect to MongoDB
async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_NAME || 'Community_Activity_Management';
    console.log(`📍 Connecting to: ${dbName}\n`);
    await mongoose.connect(mongoUri, { dbName });
    console.log('✅ MongoDB connected\n');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
}

async function updateStudentPvcd(studentNumber, year) {
  try {
    console.log('═════════════════════════════════════════════════════════════');
    console.log(`🔄 CẬP NHẬT PVCD CHO SINH VIÊN: ${studentNumber} - NĂM: ${year}`);
    console.log('═════════════════════════════════════════════════════════════\n');

    // 1. Tìm Student Profile
    const student = await StudentProfile.findOne({ 
      student_number: studentNumber 
    }).lean();

    if (!student) {
      console.log(`❌ Không tìm thấy sinh viên với mã số: ${studentNumber}`);
      return;
    }

    console.log(`✅ Tìm thấy sinh viên: ${student.full_name || 'N/A'} (${student.student_number})\n`);
    const studentId = student._id;

    // 2. Tính điểm từ Attendance
    console.log('📋 Tính điểm từ Attendance...');
    const attendances = await Attendance.find({
      student_id: studentId,
      scanned_at: { 
        $exists: true, 
        $ne: null,
        $gte: new Date(`${year}-01-01`),
        $lt: new Date(`${parseInt(year) + 1}-01-01`)
      }
    }).lean();

    let totalAttendancePoints = 0;
    attendances.forEach(att => {
      const points = parseFloat(att.points) || 0;
      totalAttendancePoints += points;
    });

    console.log(`   - Tìm thấy ${attendances.length} attendance records`);
    console.log(`   - Tổng điểm Attendance: ${totalAttendancePoints.toFixed(2)}\n`);

    // 3. Tính điểm từ Evidence
    console.log('📋 Tính điểm từ Evidence (đã approve)...');
    const evidences = await Evidence.find({
      student_id: studentId,
      status: 'approved',
      submitted_at: { 
        $exists: true, 
        $ne: null,
        $gte: new Date(`${year}-01-01`),
        $lt: new Date(`${parseInt(year) + 1}-01-01`)
      }
    }).lean();

    let totalEvidencePoints = 0;
    evidences.forEach(ev => {
      const facultyPoint = parseFloat(ev.faculty_point) || 0;
      totalEvidencePoints += facultyPoint;
    });

    console.log(`   - Tìm thấy ${evidences.length} evidence records (đã approve)`);
    console.log(`   - Tổng điểm Evidence: ${totalEvidencePoints.toFixed(2)}\n`);

    // 4. Tính tổng điểm
    const newTotalPoint = totalAttendancePoints + totalEvidencePoints;
    console.log(`📊 Tổng điểm mới: ${newTotalPoint.toFixed(2)}`);
    console.log(`   = ${totalAttendancePoints.toFixed(2)} (Attendance) + ${totalEvidencePoints.toFixed(2)} (Evidence)\n`);

    // 5. Cập nhật hoặc tạo PVCD record
    const pvcdRecord = await PvcdRecord.findOneAndUpdate(
      {
        student_id: studentId,
        year: parseInt(year)
      },
      {
        student_id: studentId,
        year: parseInt(year),
        total_point: newTotalPoint,
        start_year: new Date(`${year}-01-01`),
        end_year: new Date(`${year}-12-31`)
      },
      { upsert: true, new: true }
    );

    console.log('═════════════════════════════════════════════════════════════');
    console.log('✅ CẬP NHẬT THÀNH CÔNG!');
    console.log('═════════════════════════════════════════════════════════════\n');
    console.log(`   Sinh viên: ${student.full_name || 'N/A'} (${student.student_number})`);
    console.log(`   Năm: ${year}`);
    console.log(`   Điểm cũ: ${pvcdRecord.total_point !== newTotalPoint ? 'Đã thay đổi' : newTotalPoint.toFixed(2)}`);
    console.log(`   Điểm mới: ${newTotalPoint.toFixed(2)}`);
    console.log(`   PVCD Record ID: ${pvcdRecord._id}\n`);

  } catch (err) {
    console.error('❌ Lỗi:', err);
    console.error(err);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Kết nối MongoDB đã đóng');
    process.exit(0);
  }
}

// Get arguments from command line
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('❌ Thiếu tham số!');
  console.log('Usage: node scripts/update_pvcd_student.js <student_number> <year>');
  console.log('Example: node scripts/update_pvcd_student.js 102220095 2025');
  process.exit(1);
}

const studentNumber = args[0];
const year = parseInt(args[1]);

if (isNaN(year) || year < 1900 || year > 2100) {
  console.log('❌ Năm không hợp lệ! Năm phải từ 1900-2100');
  process.exit(1);
}

// Run
connectDB().then(() => updateStudentPvcd(studentNumber, year));




