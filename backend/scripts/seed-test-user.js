/**
 * Seed test user for chatbot testing
 * Run: node seed-test-user.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../src/models/user.model');

async function seedTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_NAME || 'pbl6'
    });

    console.log('📋 Creating test user...\n');

    // Create test user
    const existingUser = await User.findOne({ username: 'test' });
    
    if (existingUser) {
      console.log('✅ Test user already exists!');
      console.log(`  Username: test`);
      console.log(`  ID: ${existingUser._id}`);
    } else {
      // Hash password
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const testUser = new User({
        username: 'test',
        password_hash: hashedPassword,
        active: true
      });

      const savedUser = await testUser.save();
      console.log('✅ Test user created!');
      console.log(`  Username: test`);
      console.log(`  Password: password123`);
      console.log(`  ID: ${savedUser._id}`);
    }

    console.log('\n✅ Done!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedTestUser();
