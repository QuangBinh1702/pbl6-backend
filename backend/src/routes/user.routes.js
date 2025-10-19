const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

const auth = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/check_permission.middleware');

// Get all users (admin/ctsv only)
router.get('/', 
  auth, 
  checkPermission('user', 'VIEW'), 
  userController.getAllUsers
);

// Get user by ID
router.get('/:id', 
  auth, 
  userController.getUserById
);

// Create user (admin/ctsv only)
router.post('/', 
  auth, 
  checkPermission('user', 'CREATE'), 
  userController.createUser
);

// Update user
router.put('/:id', 
  auth, 
  checkPermission('user', 'UPDATE'), 
  userController.updateUser
);

// Delete user (admin/ctsv only)
router.delete('/:id', 
  auth, 
  checkPermission('user', 'DELETE'), 
  userController.deleteUser
);

// Lock user account (admin/ctsv only)
router.put('/:id/lock', 
  auth, 
  checkPermission('user', 'UPDATE'), 
  userController.lockUser
);

// Unlock user account (admin/ctsv only)
router.put('/:id/unlock', 
  auth, 
  checkPermission('user', 'UPDATE'), 
  userController.unlockUser
);

// Role management endpoints
router.get('/:id/roles', 
  auth, 
  checkPermission('user', 'VIEW'), 
  userController.getUserRoles
);

router.post('/:id/roles', 
  auth, 
  checkPermission('user', 'UPDATE'), 
  userController.assignRole
);

router.delete('/:id/roles/:roleId', 
  auth, 
  checkPermission('user', 'UPDATE'), 
  userController.removeRole
);

// Action override management
router.post('/:id/actions/override', 
  auth, 
  checkPermission('user', 'UPDATE'), 
  userController.addActionOverride
);

router.delete('/:id/actions/override/:actionId', 
  auth, 
  checkPermission('user', 'UPDATE'), 
  userController.removeActionOverride
);

module.exports = router;
