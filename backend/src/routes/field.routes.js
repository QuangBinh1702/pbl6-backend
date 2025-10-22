const express = require('express');
const router = express.Router();
const fieldController = require('../controllers/field.controller');
const auth = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/check_permission.middleware');

// Lấy tất cả ngành học (all users can view)
router.get('/', 
  auth, 
  checkPermission('field', 'READ'),
  fieldController.getAllFields
);

// Lấy ngành học theo ID
router.get('/:id', 
  auth, 
  checkPermission('field', 'READ'),
  fieldController.getFieldById
);

// Tạo ngành học mới (admin/staff)
router.post('/', 
  auth, 
  checkPermission('field', 'CREATE'),
  fieldController.createField
);

// Cập nhật ngành học (admin/staff)
router.put('/:id', 
  auth, 
  checkPermission('field', 'UPDATE'),
  fieldController.updateField
);

// Xóa ngành học (admin only)
router.delete('/:id', 
  auth, 
  checkPermission('field', 'DELETE'),
  fieldController.deleteField
);

module.exports = router;
