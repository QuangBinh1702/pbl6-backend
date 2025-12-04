const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadToCloudinary, isCloudinaryConfigured } = require('../utils/cloudinary.util');

// Tạo thư mục uploads nếu chưa có
const uploadsDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Config storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filter chỉ cho phép ảnh
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh (jpeg, png, gif, webp)'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

/**
 * Middleware để tự động upload lên Cloudinary sau khi multer lưu file local
 * Nếu có Cloudinary config, file sẽ được upload lên Cloudinary và xóa file local
 */
const uploadToCloudinaryMiddleware = async (req, res, next) => {
  // Nếu có file và có Cloudinary config, upload lên Cloudinary
  if (req.file && isCloudinaryConfigured()) {
    try {
      const filePath = req.file.path;
      const folder = 'uploads';
      
      const cloudinaryResult = await uploadToCloudinary(filePath, folder);

      if (cloudinaryResult) {
        // Lưu URL từ Cloudinary vào req.file
        req.file.cloudinaryUrl = cloudinaryResult.url;
        req.file.publicId = cloudinaryResult.public_id;
        // File local đã được xóa trong uploadToCloudinary
      }
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      // Không throw error, để fallback về local URL
      // File local vẫn còn, có thể dùng local URL
    }
  }

  next();
};

// Export multer instance và middleware
module.exports = upload;
module.exports.uploadToCloudinaryMiddleware = uploadToCloudinaryMiddleware;
