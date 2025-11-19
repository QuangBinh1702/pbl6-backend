require('dotenv').config();
const mongoose = require('mongoose');

const Attendance = require('../src/models/attendance.model');
const StudentProfile = require('../src/models/student_profile.model');

async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_NAME || 'Community_Activity_Management';
    await mongoose.connect(mongoUri, { dbName });
    console.log('✓ MongoDB connected\n');
  } catch (err) {
    console.error('✗ Error:', err.message);
    process.exit(1);
  }
}

async function checkAttendance() {
  try {
    console.log('═════════════════════════════════════════════════════════════');
    console.log('🔍 KIỂM TRA ATTENDANCE RECORDS');
    console.log('═════════════════════════════════════════════════════════════\n');

    const allAttendance = await Attendance.find().lean();
    console.log(`Tổng attendance records: ${allAttendance.length}\n`);

    const withPoints = allAttendance.filter(a => a.points !== null && a.points !== undefined);
    console.log(`Attendance có points: ${withPoints.length}`);
    console.log(`Attendance không có points: ${allAttendance.length - withPoints.length}\n`);

    // Hiển thị một vài ví dụ
    console.log('📌 Ví dụ attendance records:');
    for (let i = 0; i < Math.min(5, allAttendance.length); i++) {
      const att = allAttendance[i];
      const student = await StudentProfile.findById(att.student_id).lean();
      console.log(`  - ${student?.student_number}: points=${att.points}, scanned_at=${att.scanned_at}`);
    }

  } catch (err) {
    console.error('✗ Error:', err.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

connectDB().then(() => checkAttendance());
