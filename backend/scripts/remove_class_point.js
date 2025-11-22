require('dotenv').config();
const mongoose = require('mongoose');
const Evidence = require('../src/models/evidence.model');

async function removeFacultyPoint() {
  try {
    console.log('Connecting to database...');
    const mongoUri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_NAME || 'Community_Activity_Management';
    await mongoose.connect(mongoUri, { dbName });
    
    console.log('Removing class_point field from all evidences...');
    const result = await Evidence.updateMany(
      {},
      { $unset: { class_point: '' } }
    );
    
    console.log(`✅ Removed class_point from ${result.modifiedCount} documents`);
    console.log(`⏭️  Matched ${result.matchedCount} documents`);
    
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

removeFacultyPoint();
