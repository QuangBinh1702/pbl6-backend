const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const auth = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/check_permission.middleware');
const upload = require('../middlewares/upload.middleware');
const { uploadToCloudinaryMiddleware } = require('../middlewares/upload.middleware');

// Lấy tất cả bài đăng (all users can view)
router.get('/', 
  auth, 
  checkPermission('post', 'READ'),
  postController.getAllPosts
);

// Lấy bài đăng theo ID
router.get('/:id', 
  auth, 
  checkPermission('post', 'READ'),
  postController.getPostById
);

// Lấy bài đăng theo hoạt động
router.get('/activity/:activityId', 
  auth, 
  checkPermission('post', 'READ'),
  postController.getPostsByActivity
);

// Tạo bài đăng mới (admin/staff) - với file upload
router.post('/', 
  auth, 
  checkPermission('post', 'CREATE'),
  upload.single('activity_image'), // Middleware để upload file ảnh
  uploadToCloudinaryMiddleware, // Tự động upload lên Cloudinary nếu có config
  postController.createPost
);

// Cập nhật bài đăng
router.put('/:id', 
  auth, 
  checkPermission('post', 'UPDATE'),
  postController.updatePost
);

// Xóa bài đăng
router.delete('/:id', 
  auth, 
  checkPermission('post', 'DELETE'),
  postController.deletePost
);

module.exports = router;
