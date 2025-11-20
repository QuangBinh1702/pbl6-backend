const mongoose = require('mongoose');

console.log('Connecting to MongoDB...');
mongoose.connect('mongodb://localhost:27017/pbl6')
  .then(async () => {
    console.log('✓ Connected successfully');
    
    // Test query
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    // Check activity_registration
    const count = await db.collection('activity_registration').countDocuments({status: 'rejected'});
    console.log(`Records with status rejected: ${count}`);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection error:', err.message);
    console.error('Check if:');
    console.error('1. MongoDB is running');
    console.error('2. Connection URI is correct');
    process.exit(1);
  });
