const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');

// Lấy tất cả bài đăng
router.get('/', auth, postController.getAllPosts);

// Lấy bài đăng theo ID
router.get('/:id', auth, postController.getPostById);

// Lấy bài đăng theo hoạt động
router.get('/activity/:activityId', auth, postController.getPostsByActivity);

// Tạo bài đăng mới
router.post('/', auth, role(['admin', 'ctsv', 'teacher', 'union']), postController.createPost);

// Cập nhật bài đăng
router.put('/:id', auth, role(['admin', 'ctsv', 'teacher', 'union']), postController.updatePost);

// Xóa bài đăng
router.delete('/:id', auth, role(['admin', 'ctsv', 'teacher', 'union']), postController.deletePost);

module.exports = router;


