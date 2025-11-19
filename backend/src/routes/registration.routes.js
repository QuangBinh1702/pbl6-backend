const express = require("express");
const router = express.Router();
const registrationController = require("../controllers/registration.controller");
const auth = require("../middlewares/auth.middleware");
const {
  checkPermission,
} = require("../middlewares/check_permission.middleware");

// ⭐ IMPORTANT: Routes with specific paths MUST come BEFORE routes with parameters
// Otherwise /:id will catch /my-registrations/... routes

// Get my registrations status summary (tóm tắt số lượng theo trạng thái) - MUST be before :id routes
router.get(
  "/my-registrations/status-summary",
  auth,
  registrationController.getMyRegistrationsStatusSummary
);

// Get my registration status detail (chi tiết trạng thái 1 đơn) - MUST be before :id routes
router.get(
  "/my-registrations/:id/status-detail",
  auth,
  registrationController.getMyRegistrationStatusDetail
);

// Get my registrations (no permission check needed - own data)
router.get(
  "/my-registrations",
  auth,
  registrationController.getMyRegistrations
);

// Get registrations by activity - MUST be before /:id
router.get(
  "/activity/:activityId",
  auth,
  checkPermission("activity_registration", "READ"),
  registrationController.getRegistrationsByActivity
);

// Get registrations by student - MUST be before /:id
router.get(
  "/student/:studentId",
  auth,
  checkPermission("activity_registration", "READ"),
  registrationController.getRegistrationsByStudent
);

// Get registration status detail by student ID (no auth required)
router.get(
  "/student/:studentId/status-detail/:registrationId",
  registrationController.getRegistrationStatusDetailByStudentId
);

// Get all registrations (admin/staff only) - MUST be before /:id
router.get(
  "/",
  auth,
  checkPermission("activity_registration", "READ"),
  registrationController.getAllRegistrations
);

// Get registration by ID - Must be LAST in GET routes
router.get(
  "/:id",
  auth,
  checkPermission("activity_registration", "READ"),
  registrationController.getRegistrationById
);

// Create registration
router.post(
  "/",
  auth,
  checkPermission("activity_registration", "CREATE"),
  registrationController.createRegistration
);

// Update registration (own registration only - controller checks ownership)
router.put("/:id", auth, registrationController.updateRegistration);

// Cancel/Delete registration (xóa record khỏi DB - không lưu status cancelled)
router.delete(
  "/:id",
  auth,
  registrationController.deleteRegistration
);

// Approve registration
router.put(
  "/:id/approve",
  auth,
  checkPermission("activity_registration", "APPROVE"),
  registrationController.approveRegistration
);

// Reject registration
router.put(
  "/:id/reject",
  auth,
  checkPermission("activity_registration", "REJECT"),
  registrationController.rejectRegistration
);

module.exports = router;
