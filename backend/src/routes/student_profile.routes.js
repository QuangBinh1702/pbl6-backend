const express = require('express');
const router = express.Router();
const studentProfileController = require('../controllers/student_profile.controller');
const auth = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/check_permission.middleware');
const upload = require('../middlewares/upload.middleware');
const { uploadToCloudinaryMiddleware } = require('../middlewares/upload.middleware');

// Get all class monitors
router.get('/class-monitors', 
  auth, 
  checkPermission('student_profile', 'READ'), 
  studentProfileController.getClassMonitors
);

// Get all student profiles
router.get('/', 
  auth, 
  checkPermission('student_profile', 'READ'), 
  studentProfileController.getAllStudentProfiles
);

// Get students by class
router.get('/class/:classId/students', 
  auth, 
  checkPermission('student_profile', 'READ'), 
  studentProfileController.getStudentsByClass
);

// Get student profile by user ID
router.get('/user/:userId', 
  auth, 
  studentProfileController.getStudentProfileByUserId
);

// Get student profile by student number
router.get('/student-number/:studentNumber', 
  auth, 
  studentProfileController.getStudentProfileByStudentNumber
);

// Get student profile by username
router.get('/username/:username', 
  auth, 
  studentProfileController.getStudentProfileByUsername
);

// Get student profile by ID
router.get('/:id', 
  auth, 
  studentProfileController.getStudentProfileById
);

// Create student profile - với file upload
router.post('/', 
  auth, 
  checkPermission('student_profile', 'CREATE'),
  upload.single('student_image'), // Middleware để upload file ảnh
  uploadToCloudinaryMiddleware, // Tự động upload lên Cloudinary nếu có config
  studentProfileController.createStudentProfile
);

// Update student profile - với file upload
router.put('/:id', 
  auth, 
  checkPermission('student_profile', 'UPDATE'),
  upload.single('student_image'), // Middleware để upload file ảnh
  uploadToCloudinaryMiddleware, // Tự động upload lên Cloudinary nếu có config
  studentProfileController.updateStudentProfile
);

// Delete student profile
router.delete('/:id', 
  auth, 
  checkPermission('student_profile', 'DELETE'), 
  studentProfileController.deleteStudentProfile
);

// Set as class monitor (admin/ctsv only)
router.put('/:id/set-monitor', 
  auth, 
  checkPermission('student_profile', 'UPDATE'), 
  studentProfileController.setClassMonitor
);

// Remove class monitor status (admin/ctsv only)
router.put('/:id/unset-monitor', 
  auth, 
  checkPermission('student_profile', 'UPDATE'), 
  studentProfileController.unsetClassMonitor
);

// Toggle class monitor status with body (similar to approve activity)
router.put('/:id/toggle-monitor', 
  auth, 
  checkPermission('student_profile', 'UPDATE'), 
  studentProfileController.toggleClassMonitor
);

module.exports = router;
