/**
 * Seed test user directly via MongoDB
 * Run: node seed-test-user-simple.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');

async function seedTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_NAME || 'pbl6'
    });

    console.log('📋 Creating test user...\n');

    const db = mongoose.connection;
    const userCollection = db.collection('user');

    // Check if exists
    const existing = await userCollection.findOne({ username: 'test' });
    
    if (existing) {
      console.log('✅ Test user already exists!');
      console.log(`  Username: test`);
      console.log(`  ID: ${existing._id}`);
    } else {
      // Simple hash (for testing only - NOT for production)
      // Create a basic hash of password
      const simpleHash = crypto
        .createHash('sha256')
        .update('password123')
        .digest('hex');

      const result = await userCollection.insertOne({
        username: 'test',
        password_hash: simpleHash,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log('✅ Test user created!');
      console.log(`  Username: test`);
      console.log(`  Password: password123`);
      console.log(`  ID: ${result.insertedId}`);
    }

    console.log('\n✅ Done!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedTestUser();
