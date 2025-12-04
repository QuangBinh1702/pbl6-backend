let cloudinary = null;
try {
  cloudinary = require('cloudinary').v2;
} catch (error) {
  console.warn('Cloudinary package not installed. Install with: npm install cloudinary');
}

const fs = require('fs');
const path = require('path');

// Cấu hình Cloudinary từ environment variables
if (cloudinary && process.env.CLOUDINARY_CLOUD_NAME && 
    process.env.CLOUDINARY_API_KEY && 
    process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

/**
 * Upload file lên Cloudinary
 * @param {string} filePath - Đường dẫn file local
 * @param {string} folder - Thư mục trên Cloudinary (optional)
 * @returns {Promise<Object>} - Kết quả upload với URL
 */
async function uploadToCloudinary(filePath, folder = 'uploads') {
  // Nếu không có cloudinary package hoặc không có config, return null để fallback về local
  if (!cloudinary || !process.env.CLOUDINARY_CLOUD_NAME || 
      !process.env.CLOUDINARY_API_KEY || 
      !process.env.CLOUDINARY_API_SECRET) {
    return null;
  }

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'auto', // Tự động detect image/video
      use_filename: true,
      unique_filename: true
    });

    // Xóa file local sau khi upload thành công
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return {
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}

/**
 * Upload buffer trực tiếp (không cần lưu file local trước)
 * @param {Buffer} buffer - File buffer
 * @param {string} folder - Thư mục trên Cloudinary
 * @param {string} filename - Tên file
 * @returns {Promise<Object>} - Kết quả upload với URL
 */
async function uploadBufferToCloudinary(buffer, folder = 'uploads', filename = 'file') {
  // Nếu không có cloudinary package hoặc không có config, return null để fallback về local
  if (!cloudinary || !process.env.CLOUDINARY_CLOUD_NAME || 
      !process.env.CLOUDINARY_API_KEY || 
      !process.env.CLOUDINARY_API_SECRET) {
    return null;
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'auto',
        use_filename: true,
        unique_filename: true,
        public_id: filename
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
            format: result.format
          });
        }
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Xóa file trên Cloudinary
 * @param {string} publicId - Public ID của file trên Cloudinary
 * @returns {Promise<Object>}
 */
async function deleteFromCloudinary(publicId) {
  if (!cloudinary || !process.env.CLOUDINARY_CLOUD_NAME) {
    return null;
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
}

/**
 * Lấy URL từ file đã upload (Cloudinary hoặc local)
 * @param {Object} file - File object từ multer
 * @param {Object} req - Express request object
 * @returns {string} - URL của file
 */
function getFileUrl(file, req) {
  // Nếu có Cloudinary URL, dùng nó
  if (file.cloudinaryUrl) {
    return file.cloudinaryUrl;
  }
  
  // Nếu không, tạo local URL
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}/uploads/${file.filename}`;
}

module.exports = {
  uploadToCloudinary,
  uploadBufferToCloudinary,
  deleteFromCloudinary,
  getFileUrl,
  isCloudinaryConfigured: () => {
    return !!(cloudinary && process.env.CLOUDINARY_CLOUD_NAME && 
              process.env.CLOUDINARY_API_KEY && 
              process.env.CLOUDINARY_API_SECRET);
  }
};

