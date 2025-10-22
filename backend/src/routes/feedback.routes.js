const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedback.controller');
const auth = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/check_permission.middleware');

// Get my feedbacks (no permission check - own data)
router.get('/my-feedbacks', auth, feedbackController.getMyFeedbacks);

// Get all feedbacks (admin/staff only)
router.get('/', 
  auth, 
  checkPermission('student_feedback', 'READ'), 
  feedbackController.getAllFeedbacks
);

// Get feedbacks by activity
router.get('/activity/:activityId', 
  auth, 
  checkPermission('student_feedback', 'READ'), 
  feedbackController.getFeedbacksByActivity
);

// Get feedback by ID
router.get('/:id', 
  auth, 
  checkPermission('student_feedback', 'READ'), 
  feedbackController.getFeedbackById
);

// Create feedback (students only)
router.post('/', 
  auth, 
  feedbackController.createFeedback
);

// Update feedback (own feedback only)
router.put('/:id', 
  auth, 
  feedbackController.updateFeedback
);

// Delete feedback (admin/staff or own feedback)
router.delete('/:id', 
  auth, 
  checkPermission('student_feedback', 'DELETE'), 
  feedbackController.deleteFeedback
);

module.exports = router;
