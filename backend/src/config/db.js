const mongoose = require('mongoose');

// Cache the connection
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  try {
    // If already connected, return the existing connection
    if (cached.conn) {
      return cached.conn;
    }

    // If there's no connection promise, create one
    if (!cached.promise) {
      const mongoUri = process.env.MONGODB_URI;
      const dbName = process.env.MONGODB_NAME || 'pbl6';
      
      if (!mongoUri) {
        throw new Error('MONGODB_URI environment variable is not set');
      }

      const options = {
        dbName,
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        bufferCommands: false, // Disable mongoose buffering
      };

      cached.promise = mongoose.connect(mongoUri, options);
    }

    cached.conn = await cached.promise;
    console.log(`✅ MongoDB connected! Database: ${cached.conn.connection.name}`);
    return cached.conn;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
};

module.exports = connectDB;
