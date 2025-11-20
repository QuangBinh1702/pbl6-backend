/**
 * Cập nhật các trường thiếu trong documents evidence
 * - title, file_url, self_point, description, v.v
 * 
 * Chạy: node scripts/update_missing_evidence_fields.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Models
const Evidence = require('../src/models/evidence.model');

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
async function updateMissingFields() {
  try {
    console.log('═════════════════════════════════════════════════════════════');
    console.log('🔧 CẬP NHẬT CÁC TRƯỜNG THIẾU TRONG MINH CHỨNG');
    console.log('═════════════════════════════════════════════════════════════\n');

    // Lấy tất cả evidence
    console.log('📝 Tìm các minh chứng cần cập nhật...');
    const evidences = await Evidence.find();
    console.log(`   ✓ Tìm thấy ${evidences.length} minh chứng\n`);

    let updated = 0;
    let skipped = 0;

    for (const evidence of evidences) {
      let needsUpdate = false;
      let updateData = {};

      // Kiểm tra và bổ sung các trường thiếu
      if (!evidence.title) {
        updateData.title = `Minh chứng #${evidence._id.toString().slice(-6).toUpperCase()}`;
        needsUpdate = true;
      }

      if (!evidence.file_url) {
        updateData.file_url = `https://example.com/certificates/${evidence._id}.pdf`;
        needsUpdate = true;
      }

      if (!evidence.self_point) {
        updateData.self_point = 5;
        needsUpdate = true;
      }

      if (!evidence.description) {
        updateData.description = 'Minh chứng hoạt động cá nhân';
        needsUpdate = true;
      }

      if (!evidence.class_point) {
        updateData.class_point = 0;
        needsUpdate = true;
      }

      if (!evidence.faculty_point) {
        updateData.faculty_point = 0;
        needsUpdate = true;
      }

      // Cập nhật nếu có trường thiếu
      if (needsUpdate) {
        await Evidence.findByIdAndUpdate(evidence._id, updateData, { new: true });
        updated++;

        // Progress indicator
        if (updated % 10 === 0) {
          console.log(`   ⏳ Đã cập nhật ${updated} minh chứng...`);
        }
      } else {
        skipped++;
      }
    }

    console.log();
    console.log('═════════════════════════════════════════════════════════════');
    console.log('✅ HOÀN TẤT!');
    console.log('═════════════════════════════════════════════════════════════\n');

    console.log('📊 Thống kê:');
    console.log(`   ✓ Tổng minh chứng: ${evidences.length}`);
    console.log(`   ✓ Đã cập nhật: ${updated}`);
    console.log(`   ✓ Không cần cập nhật: ${skipped}`);
    console.log();

    if (updated > 0) {
      console.log('✅ Các trường được thêm:');
      console.log('   - title: Minh chứng #[ID cuối cùng]');
      console.log('   - file_url: https://example.com/certificates/[ID].pdf');
      console.log('   - self_point: 5');
      console.log('   - description: Minh chứng hoạt động cá nhân');
      console.log('   - class_point: 0');
      console.log('   - faculty_point: 0');
      console.log();
    }

  } catch (error) {
    console.error('✗ Lỗi:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Kết nối MongoDB đã đóng');
    process.exit(0);
  }
}

// Run
connectDB().then(() => updateMissingFields());
