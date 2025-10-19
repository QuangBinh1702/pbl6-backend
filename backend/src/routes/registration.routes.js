const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registration.controller');
const auth = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/check_permission.middleware');

// Get my registrations (no permission check needed - own data)
router.get('/my-registrations', auth, registrationController.getMyRegistrations);

// Get all registrations (admin/staff only)
router.get('/', 
  auth, 
  checkPermission('registration', 'VIEW'), 
  registrationController.getAllRegistrations
);

// Get registrations by activity
router.get('/activity/:activityId', 
  auth, 
  checkPermission('registration', 'VIEW'), 
  registrationController.getRegistrationsByActivity
);

// Get registrations by student
router.get('/student/:studentId', 
  auth, 
  checkPermission('registration', 'VIEW'), 
  registrationController.getRegistrationsByStudent
);

// Get registration by ID
router.get('/:id', 
  auth, 
  checkPermission('registration', 'VIEW'), 
  registrationController.getRegistrationById
);

// Create registration
router.post('/', 
  auth, 
  checkPermission('registration', 'CREATE'), 
  registrationController.createRegistration
);

// Update registration
router.put('/:id', 
  auth, 
  checkPermission('registration', 'UPDATE'), 
  registrationController.updateRegistration
);

// Delete registration
router.delete('/:id', 
  auth, 
  checkPermission('registration', 'DELETE'), 
  registrationController.deleteRegistration
);

// Approve registration
router.put('/:id/approve', 
  auth, 
  checkPermission('registration', 'APPROVE'), 
  registrationController.approveRegistration
);

// Reject registration
router.put('/:id/reject', 
  auth, 
  checkPermission('registration', 'REJECT'), 
  registrationController.rejectRegistration
);

module.exports = router;
