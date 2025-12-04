const { uploadBufferToCloudinary, isCloudinaryConfigured } = require('../utils/cloudinary.util');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Filter chỉ cho phép ảnh
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh (jpeg, png, gif, webp)'));
  }
};

// Nếu có Cloudinary config, dùng memory storage (không lưu local)
// Nếu không, dùng disk storage (fallback về local)
let storage;

if (isCloudinaryConfigured()) {
  // Memory storage - upload trực tiếp lên Cloudinary
  storage = multer.memoryStorage();
} else {
  // Disk storage - lưu local (cho development)
  const uploadsDir = path.join(__dirname, '../../public/uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

/**
 * Middleware để tự động upload lên Cloudinary sau khi multer xử lý xong
 */
const uploadToCloudinaryMiddleware = async (req, res, next) => {
  // Nếu có file và có Cloudinary config, upload lên Cloudinary
  if (req.file && isCloudinaryConfigured()) {
    try {
      const folder = 'uploads'; // Thư mục trên Cloudinary
      const filename = `${req.file.fieldname || 'file'}-${Date.now()}-${Math.round(Math.random() * 1E9)}`;
      
      // Nếu là memory storage (buffer), upload buffer
      if (req.file.buffer) {
        const cloudinaryResult = await uploadBufferToCloudinary(
          req.file.buffer,
          folder,
          filename
        );

        if (cloudinaryResult) {
          // Lưu URL từ Cloudinary vào req.file
          req.file.cloudinaryUrl = cloudinaryResult.url;
          req.file.publicId = cloudinaryResult.public_id;
          // Xóa buffer để tiết kiệm memory
          req.file.buffer = null;
        }
      }
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Lỗi khi upload file lên Cloudinary: ' + error.message 
      });
    }
  }

  next();
};

module.exports = {
  upload,
  uploadToCloudinaryMiddleware,
  single: (fieldName) => [
    upload.single(fieldName),
    uploadToCloudinaryMiddleware
  ]
};

