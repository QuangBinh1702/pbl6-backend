const express = require('express');
const router = express.Router();
const fieldController = require('../controllers/field.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');

// Lấy tất cả ngành học
router.get('/', auth, fieldController.getAllFields);

// Lấy ngành học theo ID
router.get('/:id', auth, fieldController.getFieldById);

// Tạo ngành học mới
router.post('/', auth, role(['admin', 'ctsv']), fieldController.createField);

// Cập nhật ngành học
router.put('/:id', auth, role(['admin', 'ctsv']), fieldController.updateField);

// Xóa ngành học
router.delete('/:id', auth, role(['admin', 'ctsv']), fieldController.deleteField);

module.exports = router;


