require('dotenv').config();
const mongoose = require('mongoose');

const Attendance = require('../src/models/attendance.model');
const StudentProfile = require('../src/models/student_profile.model');

async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_NAME || 'Community_Activity_Management';
    await mongoose.connect(mongoUri, { dbName });
  } catch (err) {
    console.error('✗ Error:', err.message);
    process.exit(1);
  }
}

async function findUndefined() {
  try {
    console.log('🔍 TÌM KIẾM ATTENDANCE UNDEFINED\n');

    const allAttendance = await Attendance.find().lean();

    // Tìm những attendance có student_id
    const undefinedRecords = [];
    for (const att of allAttendance) {
      const student = await StudentProfile.findById(att.student_id).lean();
      if (!student) {
        undefinedRecords.push({
          _id: att._id,
          student_id: att.student_id,
          scanned_at: att.scanned_at,
          points: att.points
        });
      }
    }

    if (undefinedRecords.length === 0) {
      console.log('✓ Không có attendance nào không tìm thấy student!');
    } else {
      console.log(`❌ Tìm thấy ${undefinedRecords.length} attendance không tìm thấy student:\n`);
      
      undefinedRecords.forEach((rec, idx) => {
        console.log(`${idx + 1}. Attendance ID: ${rec._id}`);
        console.log(`   Student ID: ${rec.student_id}`);
        console.log(`   Scanned at: ${rec.scanned_at}`);
        console.log(`   Points: ${rec.points}`);
        console.log('');
      });

      // Kiểm tra xem student_id có hợp lệ không
      console.log('\n🔎 KIỂM TRA STUDENT_ID:\n');
      for (const rec of undefinedRecords) {
        try {
          const student = await StudentProfile.findById(rec.student_id);
          console.log(`Student ${rec.student_id}: ${student ? 'Tồn tại' : 'Không tồn tại'}`);
        } catch (err) {
          console.log(`Student ${rec.student_id}: ObjectId không hợp lệ`);
        }
      }
    }

  } catch (err) {
    console.error('✗ Error:', err.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

connectDB().then(() => findUndefined());
