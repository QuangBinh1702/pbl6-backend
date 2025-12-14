const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activity.controller');

const auth = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/check_permission.middleware');

// IMPORTANT: Specific routes MUST come before :id route to avoid conflicts
// Order matters in Express routing!

// Activity Rejection routes (MUST be before /:id to avoid "rejections" being treated as an ID)
router.get('/rejections', 
  auth, 
  checkPermission('activity', 'READ'), 
  activityController.getActivityRejections
);

router.get('/', activityController.getAllActivities);

// GET /filter - Filter all activities (no auth required)
router.get('/filter', 
  activityController.getActivitiesWithFilter
);

router.get('/my/activities', 
  auth, 
  activityController.getMyActivities
);

router.get('/student/:studentId', 
  auth, 
  checkPermission('activity_registration', 'READ'), 
  activityController.getStudentActivities
);

// GET /student/:student_id/filter - Filter student activities (requires auth)
router.get('/student/:student_id/filter', 
  auth, 
  (req, res, next) => {
    // Check if user has either activity_registration:READ or attendance:READ permission
    req.requiredPermissions = ['activity_registration:READ', 'attendance:READ'];
    next();
  },
  activityController.getStudentActivitiesWithFilter
);

// Get activity details with student's registration status
router.get('/:activityId/student/:studentId', 
  auth,
  checkPermission('activity_registration', 'READ'),
  activityController.getActivityWithStudentStatus
);

// Get QR code for activity (MUST be before /:id)
router.get('/:id/qr-code',
  auth,
  activityController.getActivityQRCode
);

router.get('/:id', activityController.getActivityById); // Public - view activity details (MUST be last)

// Protected routes with permission checks
router.post('/', 
  auth, 
  checkPermission('activity', 'CREATE'), 
  activityController.createActivity
);

router.post('/suggest', 
  auth, 
  activityController.suggestActivity
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

router.put('/:id/cancel', 
  auth, 
  checkPermission('activity', 'UPDATE'), 
  activityController.cancelActivity
);

// Registration
router.post('/:id/register', 
  auth, 
  checkPermission('activity_registration', 'CREATE'), 
  activityController.registerActivity
);

router.get('/:id/registrations', 
  auth, 
  checkPermission('activity_registration', 'READ'), 
  activityController.getActivityRegistrations
);

// Activity Rejection routes
router.get('/:id/rejection', 
  auth, 
  checkPermission('activity', 'READ'), 
  activityController.getRejectionByActivityId
);

router.delete('/:id/rejection', 
  auth, 
  checkPermission('activity', 'DELETE'), 
  activityController.deleteRejection
);

module.exports = router;
