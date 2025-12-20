/**
 * Kiểm tra dữ liệu pvcd_record hiện tại
 * 
 * Chạy: node scripts/check_pvcd_data.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const PvcdRecord = require('../src/models/pvcd_record.model');

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

async function checkData() {
  try {
    console.log('🔍 KIỂM TRA PVCD_RECORD\n');

    // Tất cả record
    const allRecords = await PvcdRecord.find().lean();
    console.log(`📊 Tổng số record: ${allRecords.length}\n`);

    // Tìm duplicates
    const duplicates = await PvcdRecord.aggregate([
      {
        $group: {
          _id: { student_id: '$student_id', year: '$year' },
          count: { $sum: 1 },
          records: { $push: '$$ROOT' }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);

    console.log(`❌ Số nhóm duplicate: ${duplicates.length}`);

    if (duplicates.length > 0) {
      console.log('\n📌 Chi tiết duplicate:');
      duplicates.forEach(d => {
        console.log(`   Student: ${d._id.student_id}, Year: ${d._id.year}, Count: ${d.count}`);
        d.records.forEach((r, i) => {
          console.log(`      Record ${i + 1}: total_point = ${r.total_point}`);
        });
      });
    } else {
      console.log('\n✅ Không có duplicate!\n');
    }

    // Xem chi tiết từng record
    console.log('📋 Chi tiết tất cả record:\n');
    const recordsByStudent = {};
    allRecords.forEach(r => {
      const key = `${r.student_id}-${r.year}`;
      if (!recordsByStudent[key]) recordsByStudent[key] = [];
      recordsByStudent[key].push({
        id: r._id,
        total_point: r.total_point
      });
    });

    Object.entries(recordsByStudent).forEach(([key, recs]) => {
      const [studentId, year] = key.split('-');
      console.log(`   ${studentId} (${year}): ${recs.length} record`);
      recs.forEach((r, i) => {
        console.log(`      ${i + 1}. total_point = ${r.total_point}`);
      });
    });

    console.log('\n' + '='.repeat(50));
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Kết nối MongoDB đã đóng\n');
    process.exit(0);
  }
}

connectDB().then(() => checkData());
