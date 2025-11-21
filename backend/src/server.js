require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// For Vercel serverless functions
if (process.env.VERCEL) {
  // In Vercel, export app as a handler
  module.exports = app;
} else {
  // In development/other environments, start the server normally
  const HOST = process.env.HOST || '0.0.0.0';
  
  connectDB().then(() => {
    app.listen(PORT, HOST, () => {
      console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️  Database: ${process.env.MONGODB_NAME || 'Community_Activity_Management'}`);
      console.log(`✅ Server running at: http://localhost:${PORT}`);
    });
  }).catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });
}
