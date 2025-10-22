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
  checkPermission('activity_registration', 'READ'), 
  registrationController.getAllRegistrations
);

// Get registrations by activity
router.get('/activity/:activityId', 
  auth, 
  checkPermission('activity_registration', 'READ'), 
  registrationController.getRegistrationsByActivity
);

// Get registrations by student
router.get('/student/:studentId', 
  auth, 
  checkPermission('activity_registration', 'READ'), 
  registrationController.getRegistrationsByStudent
);

// Get registration by ID
router.get('/:id', 
  auth, 
  checkPermission('activity_registration', 'READ'), 
  registrationController.getRegistrationById
);

// Create registration
router.post('/', 
  auth, 
  checkPermission('activity_registration', 'CREATE'), 
  registrationController.createRegistration
);

// Update registration (own registration only - controller checks ownership)
router.put('/:id', 
  auth, 
  registrationController.updateRegistration
);

// Cancel/Delete registration (student can cancel own registration)
router.delete('/:id', 
  auth, 
  checkPermission('activity_registration', 'CANCEL'), 
  registrationController.deleteRegistration
);

// Approve registration
router.put('/:id/approve', 
  auth, 
  checkPermission('activity_registration', 'APPROVE'), 
  registrationController.approveRegistration
);

// Reject registration
router.put('/:id/reject', 
  auth, 
  checkPermission('activity_registration', 'REJECT'), 
  registrationController.rejectRegistration
);

module.exports = router;
