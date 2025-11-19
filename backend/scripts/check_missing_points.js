require('dotenv').config();
const mongoose = require('mongoose');

const Attendance = require('../src/models/attendance.model');
const Activity = require('../src/models/activity.model');
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

async function checkMissingPoints() {
  try {
    console.log('═════════════════════════════════════════════════════════════');
    console.log('🔍 KIỂM TRA ATTENDANCE KHÔNG CÓ POINTS');
    console.log('═════════════════════════════════════════════════════════════\n');

    // Lấy tất cả attendance không có points
    const missingPoints = await Attendance.find({
      $or: [
        { points: null },
        { points: undefined },
        { points: { $exists: false } }
      ]
    }).lean();

    console.log(`Attendance không có points: ${missingPoints.length}\n`);

    if (missingPoints.length === 0) {
      console.log('✓ Tất cả attendance đều có points!\n');
    } else {
      console.log('📋 CHI TIẾT ATTENDANCE THIẾU POINTS:\n');
      
      for (const att of missingPoints) {
        const student = await StudentProfile.findById(att.student_id).lean();
        const activity = await Activity.findById(att.activity_id).lean();
        
        console.log(`ID: ${att._id}`);
        console.log(`  Student: ${student?.student_number || 'N/A'} - ${student?.full_name || 'N/A'}`);
        console.log(`  Activity: ${activity?.title || 'N/A'}`);
        console.log(`  Scanned at: ${att.scanned_at}`);
        console.log(`  Status: ${att.status}`);
        console.log('');
      }
    }

  } catch (err) {
    console.error('✗ Error:', err.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

connectDB().then(() => checkMissingPoints());
