const connectDB = require('../config/db');

// Middleware to ensure database connection for each request
const ensureDBConnection = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection error in middleware:', error);
    res.status(500).json({
      message: 'Database connection failed',
      error: error.message
    });
  }
};

module.exports = ensureDBConnection;
