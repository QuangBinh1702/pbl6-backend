const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const errorMiddleware = require('./middlewares/error.middleware');
const ensureDBConnection = require('./middlewares/db.middleware');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Serve static files (for test UI)
app.use(express.static(path.join(__dirname, '../public')));

// Ensure database connection for all API routes (important for Vercel serverless)
app.use('/api', ensureDBConnection);

// Import routes
app.get('/', (req, res) => {
  res.send('Hello, this is the homepage!');
});
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/activities', require('./routes/activity.routes'));
app.use('/api/points', require('./routes/point.routes'));
app.use('/api/feedback', require('./routes/feedback.routes'));
app.use('/api/statistics', require('./routes/statistic.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/chats', require('./routes/chat.routes'));
app.use('/api/evidences', require('./routes/evidence.routes'));
app.use('/api/permissions', require('./routes/permission.routes'));

// Error handler
app.use(errorMiddleware);

module.exports = app;
