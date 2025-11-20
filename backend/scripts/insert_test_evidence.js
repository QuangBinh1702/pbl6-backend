/**
 * Thêm dữ liệu minh chứng cá nhân test vào database
 * 
 * Chạy: node scripts/insert_test_evidence.js
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
async function insertTestEvidence() {
  try {
    console.log('═════════════════════════════════════════════════════════════');
    console.log('📄 THÊM DỮ LIỆU MINH CHỨNG CÁ NHÂN TEST');
    console.log('═════════════════════════════════════════════════════════════\n');

    const testEvidence = [
      {
        student_id: '691d6f94e1c1f629df3cbd4b',
        title: 'Chứng chỉ tình nguyện GDQP',
        description: 'Tham gia hoạt động giáo dục quốc phòng tại trường',
        file_url: 'https://example.com/certificates/gdqp_2024.pdf',
        self_point: 5,
        status: 'pending',
        submitted_at: new Date('2024-01-15T10:30:00Z')
      },
      {
        student_id: '691d6f94e1c1f629df3cbd4b',
        title: 'Chứng chỉ tham gia hội khoa học kỹ thuật',
        description: 'Đạt giải ba cuộc thi thiết kế phần mềm',
        file_url: 'https://example.com/certificates/khkt_2024.pdf',
        self_point: 8,
        status: 'approved',
        submitted_at: new Date('2024-01-10T09:15:00Z'),
        verified_at: new Date('2024-01-12T14:30:00Z'),
        feedback: 'Hoạt động chất lượng, rất tốt!'
      },
      {
        student_id: '691d6f94e1c1f629df3cbd4b',
        title: 'Bằng tham gia CLB Lập trình',
        description: 'Thành viên hoạt động của CLB Lập trình',
        file_url: 'https://example.com/certificates/club_2024.pdf',
        self_point: 3,
        status: 'rejected',
        submitted_at: new Date('2024-01-05T08:00:00Z'),
        rejection_reason: 'Chứng chỉ không rõ ràng, cần nộp lại'
      }
    ];

    console.log('📝 Tạo dữ liệu minh chứng...\n');
    const result = await Evidence.insertMany(testEvidence);
    
    console.log('═════════════════════════════════════════════════════════════');
    console.log('✅ HOÀN TẤT!');
    console.log('═════════════════════════════════════════════════════════════\n');

    console.log('📊 Kết quả:');
    console.log(`   ✓ Inserted ${result.length} test evidence documents\n`);
    
    result.forEach((doc, i) => {
      console.log(`   [${i + 1}] ${doc._id}`);
      console.log(`       Tiêu đề: ${doc.title}`);
      console.log(`       Trạng thái: ${doc.status}`);
      console.log(`       Self point: ${doc.self_point}`);
      console.log();
    });

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
connectDB().then(() => insertTestEvidence());
