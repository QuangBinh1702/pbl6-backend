require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// // For Vercel serverless functions
// if (process.env.NODE_ENV === 'production') {
//   // In production (Vercel), we don't start a server
//   // The app will be used as a serverless function
//   module.exports = app;
// } else {
//   // In development, start the server normally
//   connectDB().then(() => {
//     app.listen(PORT, () => {
//       console.log(`✅ Server running at: http://localhost:${PORT}`);
//     });
//   }).catch((error) => {
//     console.error('Failed to start server:', error);
//     process.exit(1);
//   });
// }

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server running at: http://localhost:${PORT}`);
  });
}).catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
