const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const multer = require('multer');
const errorMiddleware = require('./middlewares/error.middleware');
const ensureDBConnection = require('./middlewares/db.middleware');

const app = express();

// // CORS configuration for frontend connection
// const corsOptions = {
//   origin: [
//     'http://localhost:3000',  // React default
//     'http://localhost:3001',  // Alternative React port
//     'http://localhost:8080',  // Vue default
//     'http://localhost:4200',  // Angular default
//     'http://127.0.0.1:3000',
//     'http://127.0.0.1:3001',
//     'http://127.0.0.1:8080',
//     'http://127.0.0.1:4200'
//   ],
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
// };

const corsOptions = {
  origin: function (origin, callback) {
    // Cho phép tất cả origin - trả về origin của request
    // Nếu không có origin (như Postman), cho phép luôn
    callback(null, origin || true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(morgan('dev'));

// Serve static files (for test UI)
app.use(express.static(path.join(__dirname, '../public')));

// Ensure database connection for all API routes (important for Vercel serverless)
app.use('/api', ensureDBConnection);

// Health check endpoint (for UptimeRobot keep-alive)
app.get('/', (req, res) => {
  // res.send('Hello, this is the homepage!');
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    res.json({
      status: 'ok',
      message: 'Server and database are healthy',
      database: dbStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Authentication & Users
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));

// Profiles
app.use('/api/student-profiles', require('./routes/student_profile.routes'));
app.use('/api/staff-profiles', require('./routes/staff_profile.routes'));
app.use('/api/student-cohorts', require('./routes/student_cohort.routes'));
app.use('/api/pvcd-records', require('./routes/pvcd_record.routes'));

// Organization
app.use('/api/faculties', require('./routes/faculty.routes'));
app.use('/api/fields', require('./routes/field.routes'));
app.use('/api/cohorts', require('./routes/cohort.routes'));
app.use('/api/classes', require('./routes/class.routes'));
app.use('/api/org-units', require('./routes/org_unit.routes'));

// Activities
app.use('/api/activities', require('./routes/activity.routes'));
app.use('/api/registrations', require('./routes/registration.routes'));
app.use('/api/attendances', require('./routes/attendance.routes'));
app.use('/api/posts', require('./routes/post.routes'));

// Points & Feedback
// app.use('/api/points', require('./routes/point.routes'));
app.use('/api/feedback', require('./routes/feedback.routes'));
app.use('/api/evidences', require('./routes/evidence.routes'));

// Communication
app.use('/api/notifications', require('./routes/notification.routes'));

// Chatbot - Debug
app.use('/api/chatbot', (req, res, next) => {
  console.log('🟡 Request to /api/chatbot:', req.method, req.path, 'file:', req.file ? 'yes' : 'no');
  next();
});

// Use only enhanced route (new version)
// app.use('/api/chatbot', require('./routes/chatbot.route')); // OLD - disabled
app.use('/api/chatbot', require('./routes/chatbot.enhanced.route')); // NEW - active

// System
app.use('/api/permissions', require('./routes/permission.routes'));
app.use('/api/roles', require('./routes/role.routes'));
app.use('/api/statistics', require('./routes/statistic.routes'));

// Error handler
app.use(errorMiddleware);

module.exports = app;
