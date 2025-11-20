require('dotenv').config();
const mongoose = require('mongoose');
const ActivityRegistration = require('../src/models/activity_registration.model');

async function updateApprovedAt() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_NAME || 'pbl6';
    console.log(`📍 Connecting to: ${dbName}\n`);
    
    await mongoose.connect(mongoUri, { dbName });
    console.log('✓ MongoDB connected\n');
    
    // Tìm tất cả rejected record chưa có approved_at
    console.log('🔍 Tìm tất cả record có status "rejected" và approved_at = null...\n');
    const regs = await ActivityRegistration.find({
      status: 'rejected',
      approved_at: null
    });
    
    console.log(`✓ Tìm thấy ${regs.length} records cần cập nhật\n`);
    
    if (regs.length === 0) {
      console.log('Không có record nào cần cập nhật');
      return;
    }
    
    let updated = 0;
    for (const reg of regs) {
      console.log(`Updating ${updated + 1}/${regs.length}:`, {
        _id: reg._id,
        activity_id: reg.activity_id,
        approval_note: reg.approval_note,
        updatedAt: reg.updatedAt
      });
      
      // Set approved_at = updatedAt (thời gian từ chối)
      reg.approved_at = reg.updatedAt;
      await reg.save();
      updated++;
    }
    
    console.log(`\n✓ Cập nhật ${updated} records thành công!`);
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Kết nối MongoDB đã đóng');
    process.exit(0);
  }
}

updateApprovedAt();
