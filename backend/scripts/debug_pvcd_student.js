/**
 * Debug script để kiểm tra và tính lại điểm PVCD cho một sinh viên cụ thể
 * 
 * Usage: node scripts/debug_pvcd_student.js <student_number> <year>
 * Example: node scripts/debug_pvcd_student.js 102220095 2025
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

async function debugStudentPvcd(studentNumber, year) {
  try {
    console.log('═════════════════════════════════════════════════════════════');
    console.log(`🔍 DEBUG PVCD CHO SINH VIÊN: ${studentNumber} - NĂM: ${year}`);
    console.log('═════════════════════════════════════════════════════════════\n');

    // 1. Tìm Student Profile
    console.log('📋 Bước 1: Tìm Student Profile...');
    const student = await StudentProfile.findOne({ 
      student_number: studentNumber 
    }).lean();

    if (!student) {
      console.log(`❌ Không tìm thấy sinh viên với mã số: ${studentNumber}`);
      return;
    }

    console.log(`✅ Tìm thấy sinh viên:`);
    console.log(`   - ID: ${student._id}`);
    console.log(`   - Tên: ${student.full_name || 'N/A'}`);
    console.log(`   - Mã số: ${student.student_number}\n`);

    const studentId = student._id;

    // 2. Tìm PVCD Record hiện tại
    console.log('📋 Bước 2: Tìm PVCD Record hiện tại...');
    const pvcdRecord = await PvcdRecord.findOne({
      student_id: studentId,
      year: parseInt(year)
    }).lean();

    if (pvcdRecord) {
      console.log(`✅ Tìm thấy PVCD Record:`);
      console.log(`   - Year: ${pvcdRecord.year}`);
      console.log(`   - Total Point (hiện tại): ${pvcdRecord.total_point}`);
      console.log(`   - Start Year: ${pvcdRecord.start_year}`);
      console.log(`   - End Year: ${pvcdRecord.end_year}\n`);
    } else {
      console.log(`⚠️  Không tìm thấy PVCD Record cho năm ${year}\n`);
    }

    // 3. Tìm tất cả Attendance năm 2025
    console.log('📋 Bước 3: Tìm tất cả Attendance năm ' + year + '...');
    const attendances = await Attendance.find({
      student_id: studentId,
      scanned_at: { 
        $exists: true, 
        $ne: null,
        $gte: new Date(`${year}-01-01`),
        $lt: new Date(`${parseInt(year) + 1}-01-01`)
      }
    })
      .sort({ scanned_at: 1 })
      .lean();

    console.log(`📊 Tìm thấy ${attendances.length} attendance records\n`);

    let totalAttendancePoints = 0;
    if (attendances.length > 0) {
      console.log('📝 Chi tiết Attendance:');
      attendances.forEach((att, index) => {
        const points = parseFloat(att.points) || 0;
        totalAttendancePoints += points;
        const scannedDate = new Date(att.scanned_at);
        console.log(`   ${index + 1}. ${scannedDate.toLocaleDateString('vi-VN')} - Activity ID: ${att.activity_id || 'N/A'} - Points: ${points}`);
        console.log(`      - scanned_at: ${att.scanned_at}`);
        console.log(`      - points: ${att.points}`);
        console.log(`      - points_earned: ${att.points_earned || 'N/A'}`);
        console.log(`      - Attendance ID: ${att._id}`);
      });
    }
    console.log(`\n✅ Tổng điểm từ Attendance: ${totalAttendancePoints.toFixed(2)}\n`);

    // 4. Tìm tất cả Evidence đã approve năm 2025
    console.log('📋 Bước 4: Tìm tất cả Evidence đã approve năm ' + year + '...');
    const evidences = await Evidence.find({
      student_id: studentId,
      status: 'approved',
      submitted_at: { 
        $exists: true, 
        $ne: null,
        $gte: new Date(`${year}-01-01`),
        $lt: new Date(`${parseInt(year) + 1}-01-01`)
      }
    })
      .sort({ submitted_at: 1 })
      .lean();

    console.log(`📊 Tìm thấy ${evidences.length} evidence records (đã approve)\n`);

    let totalEvidencePoints = 0;
    if (evidences.length > 0) {
      console.log('📝 Chi tiết Evidence:');
      evidences.forEach((ev, index) => {
        const facultyPoint = parseFloat(ev.faculty_point) || 0;
        totalEvidencePoints += facultyPoint;
        const submittedDate = new Date(ev.submitted_at);
        console.log(`   ${index + 1}. ${submittedDate.toLocaleDateString('vi-VN')} - Activity ID: ${ev.activity_id || 'N/A'} - Faculty Point: ${facultyPoint}`);
        console.log(`      - submitted_at: ${ev.submitted_at}`);
        console.log(`      - faculty_point: ${ev.faculty_point}`);
        console.log(`      - status: ${ev.status}`);
        console.log(`      - Evidence ID: ${ev._id}`);
      });
    }
    console.log(`\n✅ Tổng điểm từ Evidence: ${totalEvidencePoints.toFixed(2)}\n`);

    // 5. Tính tổng điểm thực tế
    const calculatedTotal = totalAttendancePoints + totalEvidencePoints;

    console.log('═════════════════════════════════════════════════════════════');
    console.log('📊 TỔNG KẾT');
    console.log('═════════════════════════════════════════════════════════════\n');
    console.log(`   Điểm từ Attendance: ${totalAttendancePoints.toFixed(2)}`);
    console.log(`   Điểm từ Evidence:   ${totalEvidencePoints.toFixed(2)}`);
    console.log(`   ────────────────────────────────`);
    console.log(`   TỔNG ĐIỂM TÍNH LẠI: ${calculatedTotal.toFixed(2)}`);

    if (pvcdRecord) {
      console.log(`   TỔNG ĐIỂM TRONG DB:  ${pvcdRecord.total_point.toFixed(2)}`);
      const difference = calculatedTotal - pvcdRecord.total_point;
      console.log(`   ────────────────────────────────`);
      console.log(`   CHÊNH LỆCH:        ${difference.toFixed(2)}`);
      
      if (Math.abs(difference) > 0.01) {
        console.log(`\n⚠️  PHÁT HIỆN SAI LỆCH! Cần cập nhật lại điểm.\n`);
        
        // Hỏi có muốn cập nhật không
        console.log('💡 Để cập nhật lại điểm, chạy lệnh:');
        console.log(`   node scripts/update_pvcd_student.js ${studentNumber} ${year}\n`);
      } else {
        console.log(`\n✅ Điểm số khớp!\n`);
      }
    } else {
      console.log(`\n⚠️  Chưa có PVCD record trong database\n`);
    }

  } catch (err) {
    console.error('❌ Lỗi:', err);
    console.error(err);
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
  console.log('Usage: node scripts/debug_pvcd_student.js <student_number> <year>');
  console.log('Example: node scripts/debug_pvcd_student.js 102220095 2025');
  process.exit(1);
}

const studentNumber = args[0];
const year = parseInt(args[1]);

if (isNaN(year) || year < 1900 || year > 2100) {
  console.log('❌ Năm không hợp lệ! Năm phải từ 1900-2100');
  process.exit(1);
}

// Run
connectDB().then(() => debugStudentPvcd(studentNumber, year));

