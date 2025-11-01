const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/check_permission.middleware');

router.post('/login', authController.login);
router.post('/register', 
  authMiddleware, 
  checkPermission('user', 'CREATE'), 
  authController.register
);
router.post('/create-user', 
  authMiddleware, 
  checkPermission('user', 'CREATE'), 
  authController.createUser
);
router.get('/profile', authMiddleware, authController.getProfile);
router.get('/roles', authController.getAvailableRoles);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
