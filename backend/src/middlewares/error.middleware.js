// Middleware xử lý lỗi
module.exports = (err, req, res, next) => {
  // Don't send response if headers already sent
  if (res.headersSent) {
    return next(err);
  }
  
  // Ensure response is always valid JSON with consistent format
  res.status(500).json({ 
    success: false, 
    message: err.message || 'Internal server error' 
  });
};
