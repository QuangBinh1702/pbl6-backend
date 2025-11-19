require('dotenv').config();
const mongoose = require('mongoose');

async function migrate() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_NAME || 'Community_Activity_Management';
    console.log(`📍 Connecting to: ${dbName}\n`);
    await mongoose.connect(mongoUri, { dbName });

    const db = mongoose.connection.db;

    console.log('🔄 Adding missing fields...\n');

    // 0. Add activity_image to activity (nếu chưa có)
    console.log('0️⃣  Activity image field:');
    const imageResult = await db.collection('activity').updateMany(
      { activity_image: { $exists: false } },
      { $set: { activity_image: '' } }
    );
    console.log(`   ✓ Added activity_image to ${imageResult.modifiedCount} activities\n`);

    // 1. Add completed_at to activity (chỉ khi status = 'completed')
    console.log('1️⃣  Activity collection:');
    const activityResult = await db.collection('activity').updateMany(
      { status: 'completed', completed_at: { $exists: false } },
      { $set: { completed_at: new Date() } }
    );
    console.log(`   ✓ Added completed_at to ${activityResult.modifiedCount} completed activities`);

    // Add approved_at only if requires_approval = true and status = 'approved'
    const activityResult2 = await db.collection('activity').updateMany(
      { requires_approval: true, status: 'approved', approved_at: { $exists: false } },
      { $set: { approved_at: new Date() } }
    );
    console.log(`   ✓ Added approved_at to ${activityResult2.modifiedCount} approved activities\n`);

    // 2. Add feedback_status, feedback_verified_at to attendance
    console.log('2️⃣  Attendance collection:');
    const attendanceResult = await db.collection('attendance').updateMany(
      { feedback_status: { $exists: false } },
      { $set: { feedback_status: null } }
    );
    console.log(`   ✓ Added feedback_status to ${attendanceResult.modifiedCount} documents`);
    
    // Add feedback_verified_at only when feedback_status is 'accepted' or 'rejected'
    const attendanceResult2 = await db.collection('attendance').updateMany(
      { feedback_status: { $in: ['accepted', 'rejected'] }, feedback_verified_at: { $exists: false } },
      { $set: { feedback_verified_at: new Date() } }
    );
    console.log(`   ✓ Added feedback_verified_at to ${attendanceResult2.modifiedCount} verified feedbacks\n`);

    console.log('✅ Migration completed!');
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

migrate();
