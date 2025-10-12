const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const dbName = process.env.MONGODB_NAME || 'pbl6';
    
    let connectionString;
    if (mongoUri.includes('mongodb+srv://') || mongoUri.includes('mongodb://')) {
      // For MongoDB Atlas or full connection strings, use dbName as option
      connectionString = mongoUri;
      await mongoose.connect(connectionString, { dbName });
    } else {
      // For local MongoDB, append dbName to URI
      connectionString = `${mongoUri}/${dbName}`;
      await mongoose.connect(connectionString);
    }
    
    console.log(`Kết nối MongoDB thành công! Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('Kết nối MongoDB thất bại:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
