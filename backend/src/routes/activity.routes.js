const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activity.controller');

const auth = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/check_permission.middleware');

// Activity routes with new permission system
router.get('/', activityController.getAllActivities); // Public - list activities
router.get('/:id', activityController.getActivityById); // Public - view activity details

// Protected routes with permission checks
router.post('/', 
  auth, 
  checkPermission('activity', 'CREATE'), 
  activityController.createActivity
);

router.put('/:id', 
  auth, 
  checkPermission('activity', 'UPDATE'), 
  activityController.updateActivity
);

router.delete('/:id', 
  auth, 
  checkPermission('activity', 'DELETE'), 
  activityController.deleteActivity
);

router.put('/:id/approve', 
  auth, 
  checkPermission('activity', 'APPROVE'), 
  activityController.approveActivity
);

router.put('/:id/reject', 
  auth, 
  checkPermission('activity', 'REJECT'), 
  activityController.rejectActivity
);

router.put('/:id/complete', 
  auth, 
  checkPermission('activity', 'UPDATE'), 
  activityController.completeActivity
);

// Registration
router.post('/:id/register', 
  auth, 
  checkPermission('registration', 'CREATE'), 
  activityController.registerActivity
);

router.get('/:id/registrations', 
  auth, 
  checkPermission('registration', 'VIEW'), 
  activityController.getActivityRegistrations
);

module.exports = router;
