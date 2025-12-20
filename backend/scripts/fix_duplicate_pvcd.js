/**
 * Script xóa duplicate pvcd_record (cùng student_id + year)
 * Giữ lại record có total_point cao nhất
 * 
 * Chạy: node scripts/fix_duplicate_pvcd.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
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

async function fixDuplicates() {
  try {
    console.log('🔧 TÌM VÀ XÓA DUPLICATE PVCD_RECORD\n');

    // Bước 1: Tìm tất cả duplicate (student_id + year)
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

    console.log(`📊 Tìm thấy ${duplicates.length} nhóm duplicate\n`);

    let deletedCount = 0;
    let keptCount = 0;

    // Bước 2: Xóa duplicate, giữ 1 record và recalculate từ attendance
    for (const group of duplicates) {
      const { _id: { student_id, year }, records } = group;

      const keepRecord = records[0];
      const deleteRecords = records.slice(1);

      console.log(
        `📌 Student ${student_id}, Year ${year}: ${records.length} record`
      );
      records.forEach((r, i) => {
        console.log(`   Record ${i + 1}: total_point = ${r.total_point}`);
      });
      console.log(`   ➜ Giữ record 1, xóa ${deleteRecords.length} record khác`);

      // Xóa các record khác
      for (const delRecord of deleteRecords) {
        await PvcdRecord.findByIdAndDelete(delRecord._id);
        deletedCount++;
      }

      // ✅ Save lại record giữ để trigger pre-save hook (tính lại từ attendance)
      const recordToKeep = await PvcdRecord.findById(keepRecord._id);
      const oldTotal = recordToKeep.total_point;
      await recordToKeep.save(); // Trigger pre-save hook → recalculate từ attendance
      const newTotal = recordToKeep.total_point;

      console.log(`   ✅ Total_point: ${oldTotal} → ${newTotal} (recalculated từ attendance)\n`);

      keptCount++;
    }

    console.log('\n' + '='.repeat(50));
    console.log(`\n📈 KẾT QUẢ:`);
    console.log(`   ✅ Xóa thành công: ${deletedCount} record`);
    console.log(`   ✓ Giữ lại: ${keptCount} record\n`);

    // Kiểm tra lại
    console.log('🔍 KIỂM TRA LẠI:\n');
    const allRecords = await PvcdRecord.find().lean();
    console.log(`   📊 Tổng pvcd_record: ${allRecords.length}`);

    const stillDuplicates = await PvcdRecord.aggregate([
      {
        $group: {
          _id: { student_id: '$student_id', year: '$year' },
          count: { $sum: 1 }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);

    if (stillDuplicates.length > 0) {
      console.log(`   ⚠️  Vẫn còn duplicate: ${stillDuplicates.length}`);
    } else {
      console.log(`   ✅ Không còn duplicate!\n`);
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
connectDB().then(() => fixDuplicates());
