// Quản lý hoạt động
const Activity = require('../models/activity.model');
const ActivityRegistration = require('../models/activity_registration.model');
const ActivityRejection = require('../models/activity_rejection.model');
const Attendance = require('../models/attendance.model');
const StudentProfile = require('../models/student_profile.model');
const User = require('../models/user.model');
const ActivityEligibility = require('../models/activity_eligibility.model');
const Falcuty = require('../models/falcuty.model');
const Cohort = require('../models/cohort.model');
const QRCode = require('qrcode');
const { validateDate } = require('../utils/date.util');

// Mapping status từ tiếng Anh (database) sang tiếng Việt (response)
const statusMapping = {
  'pending': 'chờ duyệt',
  'approved': 'chưa tổ chức',
  'in_progress': 'đang tổ chức',
  'completed': 'đã tổ chức',
  'rejected': 'từ chối',
  'cancelled': 'hủy hoạt động'
};

// Reverse mapping: từ tiếng Việt sang tiếng Anh (cho query)
const statusReverseMapping = {
  'chờ duyệt': 'pending',
  'chưa tổ chức': 'approved',
  'đang tổ chức': 'in_progress',
  'đã tổ chức': 'completed',
  'từ chối': 'rejected',
  'hủy hoạt động': 'cancelled'
};

// Helper function to get Vietnamese status
function getStatusVi(status) {
  return statusMapping[status] || status;
}

// Helper function to get English status from Vietnamese
function getStatusEn(status) {
  return statusReverseMapping[status] || status;
}

// Helper function to transform activity object - chỉ trả về status tiếng Việt
function transformActivity(activity) {
  if (!activity) return activity;
  
  const activityObj = activity.toObject ? activity.toObject() : activity;
  
  // Thay thế status tiếng Anh bằng tiếng Việt
  activityObj.status = getStatusVi(activityObj.status);
  
  // Giữ nguyên org_unit_id và field_id dưới dạng objects (không tách thành _id và name)
  // Nếu là string ID, giữ như cũ
  
  return activityObj;
}

// Helper function to transform array of activities
function transformActivities(activities) {
  if (Array.isArray(activities)) {
    return activities.map(activity => transformActivity(activity));
  }
  return transformActivity(activities);
}

// Helper function to check if activity is rejected
async function checkActivityRejection(activity) {
  if (!activity) return activity;
  
  const rejection = await ActivityRejection.findOne({ activity_id: activity._id });
  if (rejection) {
    // If activity has rejection, set status to rejected
    if (activity.status !== 'rejected') {
      activity.status = 'rejected';
      await activity.save();
    }
  }
  
  return activity;
}

// Helper function to update activity status based on time
async function updateActivityStatusBasedOnTime(activity) {
  if (!activity) return activity;
  
  // Don't update if activity is rejected or cancelled - these statuses take priority
  if (activity.status === 'rejected' || activity.status === 'cancelled') {
    return activity;
  }
  
  // Only update if activity is approved (not pending or already completed)
  if (activity.status === 'pending' || activity.status === 'completed') {
    return activity;
  }
  
  const now = new Date();
  const startTime = new Date(activity.start_time);
  const endTime = new Date(activity.end_time);
  
  let newStatus = activity.status;
  
  // If end_time has passed, set to completed
  if (endTime < now) {
    newStatus = 'completed';
  }
  // If activity is currently happening (start_time <= now <= end_time)
  else if (startTime <= now && now <= endTime) {
    newStatus = 'in_progress';
  }
  // If start_time is in the future, keep as approved (chưa tổ chức)
  else if (startTime > now) {
    newStatus = 'approved';
  }
  
  // Only update if status changed
  if (newStatus !== activity.status) {
    activity.status = newStatus;
    if (newStatus === 'completed') {
      activity.completed_at = new Date();
    }
    await activity.save();
  }
  
  return activity;
}

// Helper function to update activity status (check rejection first, then time)
async function updateActivityStatus(activity) {
  if (!activity) return activity;
  
  // First check if activity is rejected
  await checkActivityRejection(activity);
  
  // If not rejected, update based on time
  if (activity.status !== 'rejected') {
    await updateActivityStatusBasedOnTime(activity);
  }
  
  return activity;
}

// Helper function to get activity requirements
async function getActivityRequirementsData(activityId) {
  const requirements = await ActivityEligibility.find({ activity_id: activityId });
  
  const detailedRequirements = await Promise.all(
    requirements.map(async (req) => {
      try {
        // Validate reference_id exists
        if (!req.reference_id) {
          // Return placeholder for requirement with missing reference_id
          return {
            type: req.type || 'unknown',
            id: null,
            name: req.type === 'faculty' ? 'Unknown' : undefined,
            year: req.type === 'cohort' ? 'Unknown' : undefined
          };
        }

        if (req.type === 'faculty') {
          const falcuty = await Falcuty.findById(req.reference_id);
          if (falcuty) {
            return {
              type: 'faculty',
              id: falcuty._id.toString(),
              name: falcuty.name
            };
          } else {
            // Return placeholder when faculty is not found (e.g., deleted)
            return {
              type: 'faculty',
              id: req.reference_id.toString(),
              name: 'Unknown'
            };
          }
        } else if (req.type === 'cohort') {
          const cohort = await Cohort.findById(req.reference_id);
          if (cohort) {
            return {
              type: 'cohort',
              id: cohort._id.toString(),
              year: cohort.year
            };
          } else {
            // Return placeholder when cohort is not found (e.g., deleted)
            return {
              type: 'cohort',
              id: req.reference_id.toString(),
              year: 'Unknown'
            };
          }
        } else {
          // Handle unknown type - return placeholder to maintain requirement count
          console.warn(`Unknown requirement type: ${req.type} for activity ${activityId}`);
          return {
            type: req.type || 'unknown',
            id: req.reference_id ? req.reference_id.toString() : null,
            name: 'Unknown'
          };
        }
      } catch (error) {
        // Handle errors (e.g., invalid ObjectId format, database errors)
        console.error(`Error processing requirement for activity ${activityId}:`, error.message);
        // Return placeholder to maintain requirement count even on error
        return {
          type: req.type || 'unknown',
          id: req.reference_id ? req.reference_id.toString() : null,
          name: req.type === 'faculty' ? 'Unknown' : undefined,
          year: req.type === 'cohort' ? 'Unknown' : undefined
        };
      }
    })
  );
  
  return detailedRequirements.filter(r => r);
}

module.exports = {
  async getAllActivities(req, res) {
    try {
      const { org_unit_id, field_id, status, start_date, end_date } = req.query;
      
      const filter = {};
      if (org_unit_id) filter.org_unit_id = org_unit_id;
      if (field_id) filter.field_id = field_id;
      if (status) {
        // Accept both English and Vietnamese status
        const statusEn = getStatusEn(status);
        const validStatuses = ['pending', 'approved', 'in_progress', 'completed', 'rejected', 'cancelled'];
        if (validStatuses.includes(statusEn)) {
          filter.status = statusEn;
        } else if (validStatuses.includes(status)) {
          filter.status = status;
        }
      }
      if (start_date || end_date) {
        filter.start_time = {};
        if (start_date) filter.start_time.$gte = new Date(start_date);
        if (end_date) filter.start_time.$lte = new Date(end_date);
      }
      
      let activities = await Activity.find(filter)
        .populate('org_unit_id', '_id name')
        .populate('field_id', '_id name')
        .sort({ start_time: -1 });
      
      // Auto-update status (check rejection first, then time) for each activity
      activities = await Promise.all(
        activities.map(activity => updateActivityStatus(activity))
      );
      
      // Get requirements for each activity
      const activitiesWithRequirements = await Promise.all(
        activities.map(async (activity) => {
          const activityObj = transformActivity(activity);
          const requirements = await getActivityRequirementsData(activity._id);
          return {
            ...activityObj,
            requirements
          };
        })
      );
      
      // Transform activities to return Vietnamese status
      const transformedActivities = transformActivities(activities);
      
      res.json({ success: true, data: activitiesWithRequirements });
    } catch (err) {
      console.error('Get all activities error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getActivityById(req, res) {
    try {
      let activity = await Activity.findById(req.params.id)
        .populate('org_unit_id', '_id name')
        .populate('field_id', '_id name');
      
      if (!activity) {
        return res.status(404).json({ 
          success: false, 
          message: 'Activity not found' 
        });
      }
      
      // Auto-update status (check rejection first, then time)
      activity = await updateActivityStatus(activity);
      
      // Get registration count
      const registrationCount = await ActivityRegistration.countDocuments({ 
        activity_id: activity._id 
      });
      
      // Get rejection info if exists
      const rejection = await ActivityRejection.findOne({ activity_id: activity._id })
        .populate('rejected_by', 'name email');
      
      // Get requirements
      const requirements = await getActivityRequirementsData(activity._id);
      
      // Transform activity to return Vietnamese status
      const transformedActivity = transformActivity(activity);
      
      res.json({ 
        success: true, 
        data: {
          ...transformedActivity,
          registrationCount,
          rejection: rejection || null,
          requirements
        }
      });
    } catch (err) {
      console.error('Get activity by ID error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async createActivity(req, res) {
    try {
      const {
        title,
        description,
        location,
        start_time,
        end_time,
        capacity,
        registration_open,
        registration_close,
        requires_approval,
        org_unit_id,
        field_id,
        activity_image,
        requirements // <-- thêm trường này
      } = req.body;
      
      // Validate required fields
      if (!title || !start_time || !end_time) {
        return res.status(400).json({ 
          success: false, 
          message: 'Title, start_time, and end_time are required' 
        });
      }
      
      // Convert to Date objects for validation với helper function
      const startTimeValidation = validateDate(start_time, 'start_time');
      if (startTimeValidation.error) {
        return res.status(400).json({ 
          success: false, 
          message: startTimeValidation.error 
        });
      }
      const startTimeDate = startTimeValidation.date;

      const endTimeValidation = validateDate(end_time, 'end_time');
      if (endTimeValidation.error) {
        return res.status(400).json({ 
          success: false, 
          message: endTimeValidation.error 
        });
      }
      const endTimeDate = endTimeValidation.date;

      let registrationOpenDate = null;
      if (registration_open) {
        const regOpenValidation = validateDate(registration_open, 'registration_open');
        if (regOpenValidation.error) {
          return res.status(400).json({ 
            success: false, 
            message: regOpenValidation.error 
          });
        }
        registrationOpenDate = regOpenValidation.date;
      }

      let registrationCloseDate = null;
      if (registration_close) {
        const regCloseValidation = validateDate(registration_close, 'registration_close');
        if (regCloseValidation.error) {
          return res.status(400).json({ 
            success: false, 
            message: regCloseValidation.error 
          });
        }
        registrationCloseDate = regCloseValidation.date;
      }

      const now = new Date();
      
      // Validate: start_time cannot be in the past
      if (startTimeDate < now) {
        return res.status(400).json({ 
          success: false, 
          message: 'Start time cannot be in the past' 
        });
      }
      
      // Validate: end_time must be after start_time
      if (endTimeDate <= startTimeDate) {
        return res.status(400).json({ 
          success: false, 
          message: 'End time must be after start time' 
        });
      }
      
      // Validate: registration_close must be after registration_open (if both provided)
      if (registrationOpenDate && registrationCloseDate) {
        if (registrationCloseDate < registrationOpenDate) {
          return res.status(400).json({ 
            success: false, 
            message: 'Registration close time must be after registration open time' 
          });
        }
      }
      
      // Validate: registration_open cannot be in the past (if provided)
      if (registrationOpenDate && registrationOpenDate < now) {
        return res.status(400).json({ 
          success: false, 
          message: 'Registration open time cannot be in the past' 
        });
      }
      
      // Validate: registration_close cannot be in the past (if provided)
      if (registrationCloseDate && registrationCloseDate < now) {
        return res.status(400).json({ 
          success: false, 
          message: 'Registration close time cannot be in the past' 
        });
      }
      
      // Validate: registration_open and registration_close must be before start_time (if provided)
      if (registrationOpenDate && registrationOpenDate >= startTimeDate) {
        return res.status(400).json({ 
          success: false, 
          message: 'Registration open time must be before activity start time' 
        });
      }
      
      if (registrationCloseDate && registrationCloseDate >= startTimeDate) {
        return res.status(400).json({ 
          success: false, 
          message: 'Registration close time must be before activity start time' 
        });
      }
      
      // Determine status based on time
      // If start_time is in the past, set to completed
      // If start_time is now or in the future but end_time is in the past, set to completed
      // If start_time <= now <= end_time, set to in_progress
      // Otherwise, set to approved (chưa tổ chức)
      let activityStatus = 'approved';
      if (endTimeDate < now) {
        activityStatus = 'completed';
      } else if (startTimeDate <= now && now <= endTimeDate) {
        activityStatus = 'in_progress';
      }
      
      const activity = await Activity.create({
        title,
        description,
        location,
        start_time: startTimeDate,
        end_time: endTimeDate,
        start_time_updated: startTimeDate,
        end_time_updated: endTimeDate,
        capacity: capacity || 0,
        registration_open: registrationOpenDate,
        registration_close: registrationCloseDate,
        requires_approval: requires_approval || false,
        org_unit_id,
        field_id,
        activity_image,
        status: activityStatus,
        approved_at: activityStatus === 'approved' || activityStatus === 'in_progress' ? new Date() : null
      });
      
      // Generate QR code for the activity
      try {
        const qrData = JSON.stringify({
          activityId: activity._id.toString(),
          activityTitle: activity.title,
          timestamp: new Date().toISOString()
        });
        
        // Generate QR code as Base64 data URL
        const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
          errorCorrectionLevel: 'H',
          type: 'image/png',
          width: 300,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        activity.qr_code = qrCodeDataUrl;
        await activity.save();
      } catch (qrError) {
        console.error('Error generating QR code:', qrError);
        // Don't fail the entire request if QR generation fails
      }
      // Xử lý requirements nếu có
      const requirementsWarnings = [];
      if (Array.isArray(requirements) && requirements.length > 0) {
        for (const reqItem of requirements) {
          if (!reqItem.type) {
            requirementsWarnings.push(`Requirement thiếu trường 'type'`);
            continue;
          }

          if (reqItem.type === 'faculty') {
            if (!reqItem.id) {
              requirementsWarnings.push(`Requirement type 'faculty' thiếu trường 'id'`);
              continue;
            }
            const falcuty = await Falcuty.findById(reqItem.id);
            if (falcuty) {
              await ActivityEligibility.create({
                activity_id: activity._id,
                type: 'faculty',
                reference_id: falcuty._id
              });
            } else {
              requirementsWarnings.push(`Không tìm thấy khoa với id: "${reqItem.id}"`);
            }
          } else if (reqItem.type === 'cohort') {
            if (!reqItem.id) {
              requirementsWarnings.push(`Requirement type 'cohort' thiếu trường 'id'`);
              continue;
            }
            const cohort = await Cohort.findById(reqItem.id);
            if (cohort) {
              await ActivityEligibility.create({
                activity_id: activity._id,
                type: 'cohort',
                reference_id: cohort._id
              });
            } else {
              requirementsWarnings.push(`Không tìm thấy khóa với id: "${reqItem.id}"`);
            }
          } else {
            requirementsWarnings.push(`Requirement type không hợp lệ: "${reqItem.type}". Chỉ chấp nhận 'faculty' hoặc 'cohort'`);
          }
        }
      }
      // Transform activity to return Vietnamese status
      const transformedActivity = transformActivity(activity);
      const response = { success: true, data: transformedActivity };
      if (requirementsWarnings.length > 0) {
        response.warnings = requirementsWarnings;
      }
      res.status(201).json(response);
    } catch (err) {
      console.error('Create activity error:', err);
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async suggestActivity(req, res) {
    try {
      const {
        title,
        description,
        location,
        start_time,
        end_time,
        capacity,
        registration_open,
        registration_close,
        requires_approval,
        org_unit_id,
        field_id,
        activity_image,
        requirements // <-- thêm trường này
      } = req.body;
      
      // Validate required fields
      if (!title || !start_time || !end_time) {
        return res.status(400).json({ 
          success: false, 
          message: 'Title, start_time, and end_time are required' 
        });
      }
      
      // Convert to Date objects for validation với helper function
      const startTimeValidation = validateDate(start_time, 'start_time');
      if (startTimeValidation.error) {
        return res.status(400).json({ 
          success: false, 
          message: startTimeValidation.error 
        });
      }
      const startTimeDate = startTimeValidation.date;

      const endTimeValidation = validateDate(end_time, 'end_time');
      if (endTimeValidation.error) {
        return res.status(400).json({ 
          success: false, 
          message: endTimeValidation.error 
        });
      }
      const endTimeDate = endTimeValidation.date;

      let registrationOpenDate = null;
      if (registration_open) {
        const regOpenValidation = validateDate(registration_open, 'registration_open');
        if (regOpenValidation.error) {
          return res.status(400).json({ 
            success: false, 
            message: regOpenValidation.error 
          });
        }
        registrationOpenDate = regOpenValidation.date;
      }

      let registrationCloseDate = null;
      if (registration_close) {
        const regCloseValidation = validateDate(registration_close, 'registration_close');
        if (regCloseValidation.error) {
          return res.status(400).json({ 
            success: false, 
            message: regCloseValidation.error 
          });
        }
        registrationCloseDate = regCloseValidation.date;
      }

      const now = new Date();
      
      // Validate: end_time must be after start_time
      if (endTimeDate <= startTimeDate) {
        return res.status(400).json({ 
          success: false, 
          message: 'End time must be after start time' 
        });
      }
      
      // Validate: registration_close must be after registration_open (if both provided)
      if (registrationOpenDate && registrationCloseDate) {
        if (registrationCloseDate < registrationOpenDate) {
          return res.status(400).json({ 
            success: false, 
            message: 'Registration close time must be after registration open time' 
          });
        }
      }
      
      // Validate: registration_open and registration_close must be before start_time (if provided)
      if (registrationOpenDate && registrationOpenDate >= startTimeDate) {
        return res.status(400).json({ 
          success: false, 
          message: 'Registration open time must be before activity start time' 
        });
      }
      
      if (registrationCloseDate && registrationCloseDate >= startTimeDate) {
        return res.status(400).json({ 
          success: false, 
          message: 'Registration close time must be before activity start time' 
        });
      }
      
      // Suggest activity always has status = pending (chờ duyệt)
      const activity = await Activity.create({
        title,
        description,
        location,
        start_time: startTimeDate,
        end_time: endTimeDate,
        start_time_updated: startTimeDate,
        end_time_updated: endTimeDate,
        capacity: capacity || 0,
        registration_open: registrationOpenDate,
        registration_close: registrationCloseDate,
        requires_approval: requires_approval !== undefined ? requires_approval : true,
        org_unit_id,
        field_id,
        activity_image,
        status: 'pending' // Đề xuất hoạt động luôn có status = pending
      });
      
      // Xử lý requirements nếu có
      const requirementsWarnings = [];
      if (Array.isArray(requirements) && requirements.length > 0) {
        for (const reqItem of requirements) {
          if (!reqItem.type) {
            requirementsWarnings.push(`Requirement thiếu trường 'type'`);
            continue;
          }

          if (reqItem.type === 'faculty') {
            if (!reqItem.id) {
              requirementsWarnings.push(`Requirement type 'faculty' thiếu trường 'id'`);
              continue;
            }
            const falcuty = await Falcuty.findById(reqItem.id);
            if (falcuty) {
              await ActivityEligibility.create({
                activity_id: activity._id,
                type: 'faculty',
                reference_id: falcuty._id
              });
            } else {
              requirementsWarnings.push(`Không tìm thấy khoa với id: "${reqItem.id}"`);
            }
          } else if (reqItem.type === 'cohort') {
            if (!reqItem.id) {
              requirementsWarnings.push(`Requirement type 'cohort' thiếu trường 'id'`);
              continue;
            }
            const cohort = await Cohort.findById(reqItem.id);
            if (cohort) {
              await ActivityEligibility.create({
                activity_id: activity._id,
                type: 'cohort',
                reference_id: cohort._id
              });
            } else {
              requirementsWarnings.push(`Không tìm thấy khóa với id: "${reqItem.id}"`);
            }
          } else {
            requirementsWarnings.push(`Requirement type không hợp lệ: "${reqItem.type}". Chỉ chấp nhận 'faculty' hoặc 'cohort'`);
          }
        }
      }
      
      // Transform activity to return Vietnamese status
      const transformedActivity = transformActivity(activity);
      const response = { success: true, message: 'Activity suggested successfully. Waiting for approval.', data: transformedActivity };
      if (requirementsWarnings.length > 0) {
        response.warnings = requirementsWarnings;
      }
      
      res.status(201).json(response);
    } catch (err) {
      console.error('Suggest activity error:', err);
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async updateActivity(req, res) {
    try {
      const updates = { ...req.body };
      const requirements = updates.requirements;
      
      // Remove requirements from updates object (handle separately)
      delete updates.requirements;
      
      // Update time_updated fields if start_time or end_time changed
      if (updates.start_time) {
        const startTimeValidation = validateDate(updates.start_time, 'start_time');
        if (startTimeValidation.error) {
          return res.status(400).json({ 
            success: false, 
            message: startTimeValidation.error 
          });
        }
        updates.start_time = startTimeValidation.date;
        updates.start_time_updated = new Date();
      }
      if (updates.end_time) {
        const endTimeValidation = validateDate(updates.end_time, 'end_time');
        if (endTimeValidation.error) {
          return res.status(400).json({ 
            success: false, 
            message: endTimeValidation.error 
          });
        }
        updates.end_time = endTimeValidation.date;
        updates.end_time_updated = new Date();
      }
      
      // Validate registration_open and registration_close if provided
      if (updates.registration_open) {
        const regOpenValidation = validateDate(updates.registration_open, 'registration_open');
        if (regOpenValidation.error) {
          return res.status(400).json({ 
            success: false, 
            message: regOpenValidation.error 
          });
        }
        updates.registration_open = regOpenValidation.date;
      }
      if (updates.registration_close) {
        const regCloseValidation = validateDate(updates.registration_close, 'registration_close');
        if (regCloseValidation.error) {
          return res.status(400).json({ 
            success: false, 
            message: regCloseValidation.error 
          });
        }
        updates.registration_close = regCloseValidation.date;
      }
      
      const activity = await Activity.findByIdAndUpdate(
        req.params.id, 
        updates, 
        { new: true, runValidators: true }
      ).populate('org_unit_id').populate('field_id');
      
      if (!activity) {
        return res.status(404).json({ 
          success: false, 
          message: 'Activity not found' 
        });
      }
      
      // Handle requirements update
      const requirementsWarnings = [];
      let requirementsUpdated = false;
      
      if (requirements !== undefined && requirements !== null && Array.isArray(requirements)) {
        // Get existing requirements to compare
        const existingRequirements = await ActivityEligibility.find({ activity_id: activity._id });
        
        // Helper function to normalize requirements for comparison
        const normalizeRequirements = (reqs) => {
          return reqs.map(r => `${r.type}:${r.reference_id || r.id}`).sort();
        };
        
        // Compare with new requirements
        const existingNormalized = normalizeRequirements(
          existingRequirements.map(r => ({
            type: r.type,
            reference_id: r.reference_id
          }))
        );
        
        const newNormalized = normalizeRequirements(
          requirements.map(r => ({
            type: r.type,
            reference_id: r.id
          }))
        );
        
        // Only update if requirements actually changed
        const requirementsChanged = existingNormalized.length !== newNormalized.length || 
                                   !existingNormalized.every((val, idx) => val === newNormalized[idx]);
        
        if (requirementsChanged) {
          // Delete all existing requirements for this activity
          await ActivityEligibility.deleteMany({ activity_id: activity._id });
          
          // Create new requirements if provided
          if (requirements.length > 0) {
            for (const reqItem of requirements) {
              if (!reqItem.type) {
                requirementsWarnings.push(`Requirement thiếu trường 'type'`);
                continue;
              }

              if (reqItem.type === 'faculty') {
                if (!reqItem.id) {
                  requirementsWarnings.push(`Requirement type 'faculty' thiếu trường 'id'`);
                  continue;
                }
                const falcuty = await Falcuty.findById(reqItem.id);
                if (falcuty) {
                  await ActivityEligibility.create({
                    activity_id: activity._id,
                    type: 'faculty',
                    reference_id: falcuty._id
                  });
                } else {
                  requirementsWarnings.push(`Không tìm thấy khoa với id: "${reqItem.id}"`);
                }
              } else if (reqItem.type === 'cohort') {
                if (!reqItem.id) {
                  requirementsWarnings.push(`Requirement type 'cohort' thiếu trường 'id'`);
                  continue;
                }
                const cohort = await Cohort.findById(reqItem.id);
                if (cohort) {
                  await ActivityEligibility.create({
                    activity_id: activity._id,
                    type: 'cohort',
                    reference_id: cohort._id
                  });
                } else {
                  requirementsWarnings.push(`Không tìm thấy khóa với id: "${reqItem.id}"`);
                }
              } else {
                requirementsWarnings.push(`Requirement type không hợp lệ: "${reqItem.type}". Chỉ chấp nhận 'faculty' hoặc 'cohort'`);
              }
            }
          }
          requirementsUpdated = true;
        }
      }
      
      // Auto-update status based on time if start_time or end_time changed
      if (updates.start_time || updates.end_time) {
        await updateActivityStatusBasedOnTime(activity);
      }
      
      // Get updated requirements to return in response
      const updatedRequirements = await getActivityRequirementsData(activity._id);
      
      // Transform activity to return Vietnamese status
      const transformedActivity = transformActivity(activity);
      const response = { 
        success: true, 
        data: {
          ...transformedActivity,
          requirements: updatedRequirements
        }
      };
      
      // Add info about whether requirements were updated
      if (requirements !== undefined && requirements !== null && Array.isArray(requirements)) {
        response.requirementsUpdated = requirementsUpdated;
        if (!requirementsUpdated) {
          response.message = 'Requirements không có thay đổi (giống với dữ liệu cũ)';
        }
      }
      
      if (requirementsWarnings.length > 0) {
        response.warnings = requirementsWarnings;
      }
      res.json(response);
    } catch (err) {
      console.error('Update activity error:', err);
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async deleteActivity(req, res) {
    try {
      const activity = await Activity.findByIdAndDelete(req.params.id);
      
      if (!activity) {
        return res.status(404).json({ 
          success: false, 
          message: 'Activity not found' 
        });
      }
      
      // Also delete related registrations
      await ActivityRegistration.deleteMany({ activity_id: req.params.id });
      
      res.json({ success: true, message: 'Activity deleted successfully' });
    } catch (err) {
      console.error('Delete activity error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async approveActivity(req, res) {
    try {
      const activity = await Activity.findById(req.params.id);
      if (!activity) {
        return res.status(404).json({ 
          success: false, 
          message: 'Activity not found' 
        });
      }
      
      // Update requires_approval from body (default: false when approving)
      // Example: { "requires_approval": false } to approve
      // Example: { "requires_approval": true } to mark as requiring approval
      if (req.body.hasOwnProperty('requires_approval')) {
        activity.requires_approval = req.body.requires_approval;
      } else {
        // Default: set to false when approving (activity has been approved)
        activity.requires_approval = false;
      }
      
      // Determine status based on time when approving
      const now = new Date();
      let newStatus = 'approved';
      if (activity.end_time < now) {
        newStatus = 'completed';
      } else if (activity.start_time <= now && now <= activity.end_time) {
        newStatus = 'in_progress';
      }
      
      // Update status to approved/in_progress/completed based on time
      activity.status = newStatus;
      activity.approved_at = new Date();
      
      await activity.save();

      // Send notification to activity creator when activity is approved
      try {
        const Notification = require('../models/notification.model');
        const statusVi = getStatusVi(newStatus);
        
        const notificationTitle = `Hoạt động "${activity.title}" đã được phê duyệt`;
        const notificationContent = `Hoạt động "${activity.title}" của bạn đã được phê duyệt. Trạng thái: ${statusVi}`;

        await Notification.create({
          title: notificationTitle,
          content: notificationContent,
          published_date: new Date(),
          notification_type: 'activity',
          icon_type: 'check_circle',
          target_audience: 'specific',
          target_user_ids: [activity.created_by],
          created_by: req.user?.id || null
        });

        console.log(`Notification created for activity creator about approved activity`);
      } catch (notifErr) {
        console.error('Error creating activity approval notification:', notifErr);
        // Don't fail the approval if notification fails
      }
      
      // Transform activity to return Vietnamese status
      const transformedActivity = transformActivity(activity);
      const statusVi = getStatusVi(newStatus);
      
      res.json({ 
        success: true, 
        message: `Hoạt động đã được phê duyệt. Trạng thái: ${statusVi}`,
        data: transformedActivity 
      });
    } catch (err) {
      console.error('Approve activity error:', err);
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async completeActivity(req, res) {
    try {
      const activity = await Activity.findById(req.params.id);
      if (!activity) {
        return res.status(404).json({ 
          success: false, 
          message: 'Activity not found' 
        });
      }
      
      // Update status to completed
      activity.status = 'completed';
      activity.completed_at = new Date();
      await activity.save();
      
      // Transform activity to return Vietnamese status
      const transformedActivity = transformActivity(activity);
      
      res.json({ success: true, data: transformedActivity });
    } catch (err) {
      console.error('Complete activity error:', err);
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async registerActivity(req, res) {
    try {
      const { student_id } = req.body;
      let studentIdToUse = student_id;
      
      // If student_id is not provided, find it from the logged-in user
      if (!studentIdToUse) {
        const studentProfile = await StudentProfile.findOne({ 
          user_id: req.user.id 
        });
        
        if (!studentProfile) {
          return res.status(404).json({ 
            success: false, 
            message: 'Student profile not found for this user' 
          });
        }
        
        studentIdToUse = studentProfile._id;
      }
      
      // Check if already registered
      const exist = await ActivityRegistration.findOne({ 
        student_id: studentIdToUse, 
        activity_id: req.params.id 
      });
      
      if (exist) {
        return res.status(400).json({ 
          success: false, 
          message: 'Already registered for this activity' 
        });
      }
      
      // Check capacity
      const activity = await Activity.findById(req.params.id);
      if (!activity) {
        return res.status(404).json({ 
          success: false, 
          message: 'Activity not found' 
        });
      }
      
      if (activity.capacity > 0) {
        const registrationCount = await ActivityRegistration.countDocuments({ 
          activity_id: req.params.id,
          status: { $in: ['pending', 'approved'] }
        });
        
        if (registrationCount >= activity.capacity) {
          return res.status(400).json({ 
            success: false, 
            message: 'Activity is full' 
          });
        }
      }
      
      const registration = await ActivityRegistration.create({ 
        student_id: studentIdToUse, 
        activity_id: req.params.id,
        status: activity.requires_approval ? 'pending' : 'approved'
      });
      
      res.status(201).json({ success: true, data: registration });
    } catch (err) {
      console.error('Register activity error:', err);
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async getActivityRegistrations(req, res) {
    try {
      const registrations = await ActivityRegistration.find({ 
        activity_id: req.params.id 
      }).populate({
        path: 'student_id',
        populate: {
          path: 'class_id',
          populate: { path: 'falcuty_id' }
        }
      });
      
      res.json({ success: true, data: registrations });
    } catch (err) {
      console.error('Get activity registrations error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getStudentActivities(req, res) {
    try {
      const { studentId } = req.params;
      
      // Get student profile ID if studentId is a user ID
      let studentProfileId = studentId;
      
      // If studentId is a user ID, find the corresponding student profile
      const studentProfile = await StudentProfile.findOne({ user_id: studentId });
      if (studentProfile) {
        studentProfileId = studentProfile._id;
      }
      
      // Get all registrations for this student
      const registrations = await ActivityRegistration.find({ 
        student_id: studentProfileId 
      }).populate({
        path: 'activity_id',
        populate: [
          { path: 'org_unit_id' },
          { path: 'field_id' }
        ]
      });
      
      // Get all attendance records for this student
      const attendances = await Attendance.find({ 
        student_id: studentProfileId 
      }).populate({
        path: 'activity_id',
        populate: [
          { path: 'org_unit_id' },
          { path: 'field_id' }
        ]
      });
      
      // Get all activity IDs to check for rejections
      const activityIds = new Set();
      registrations.forEach(reg => {
        if (reg.activity_id) activityIds.add(reg.activity_id._id);
      });
      attendances.forEach(att => {
        if (att.activity_id) activityIds.add(att.activity_id._id);
      });
      
      // Check rejections for all activities
      const rejections = await ActivityRejection.find({
        activity_id: { $in: Array.from(activityIds) }
      });
      const rejectionMap = new Map();
      rejections.forEach(rej => {
        rejectionMap.set(rej.activity_id.toString(), rej);
      });
      
      // Combine both results
      const activities = [];
      const activityMap = new Map();
      
      // Process registrations
      registrations.forEach(reg => {
        if (reg.activity_id) {
          const activityData = reg.activity_id.toObject();
          
          // Check if activity is rejected and update status
          if (rejectionMap.has(activityData._id.toString())) {
            activityData.status = 'rejected';
          } else {
            // Update status based on time if not rejected
            // Note: We don't save here, just update for response
            const now = new Date();
            const startTime = new Date(activityData.start_time);
            const endTime = new Date(activityData.end_time);
            
            if (activityData.status !== 'pending' && activityData.status !== 'rejected' && activityData.status !== 'cancelled') {
              if (endTime < now) {
                activityData.status = 'completed';
              } else if (startTime <= now && now <= endTime) {
                activityData.status = 'in_progress';
              } else if (startTime > now) {
                activityData.status = 'approved';
              }
            }
          }
          
          // Convert status to Vietnamese
           activityData.status = getStatusVi(activityData.status);
           
           activityMap.set(activityData._id.toString(), {
             ...activityData,
             registration: {
               id: reg._id,
               status: reg.status,
               registered_at: reg.registered_at,
               approval_note: reg.approval_note,
               approved_by: reg.approved_by,
               approved_at: reg.approved_at
             },
             attendance: null
           });
        }
      });
      
      // Process attendances
      attendances.forEach(att => {
        if (att.activity_id) {
          const activityId = att.activity_id._id.toString();
          if (activityMap.has(activityId)) {
            // Add attendance info to existing activity
            activityMap.get(activityId).attendance = {
              id: att._id,
              scanned_at: att.scanned_at,
              status: att.status,
              verified: att.verified,
              verified_at: att.verified_at,
              points: att.points,
              feedback: att.feedback,
              feedback_time: att.feedback_time
            };
          } else {
            // Activity with attendance but no registration
            const activityData = att.activity_id.toObject();
            
            // Check if activity is rejected and update status
            if (rejectionMap.has(activityId)) {
              activityData.status = 'rejected';
            } else {
              // Update status based on time if not rejected
              const now = new Date();
              const startTime = new Date(activityData.start_time);
              const endTime = new Date(activityData.end_time);
              
              if (activityData.status !== 'pending' && activityData.status !== 'rejected' && activityData.status !== 'cancelled') {
                if (endTime < now) {
                  activityData.status = 'completed';
                } else if (startTime <= now && now <= endTime) {
                  activityData.status = 'in_progress';
                } else if (startTime > now) {
                  activityData.status = 'approved';
                }
              }
            }
            
            // Convert status to Vietnamese
             activityData.status = getStatusVi(activityData.status);
             
             activityMap.set(activityId, {
               ...activityData,
               registration: null,
               attendance: {
                 id: att._id,
                 scanned_at: att.scanned_at,
                 status: att.status,
                 verified: att.verified,
                 verified_at: att.verified_at,
                 points: att.points,
                 feedback: att.feedback,
                 feedback_time: att.feedback_time
               }
             });
          }
        }
      });
      
      // Convert map to array
      activityMap.forEach(value => {
        activities.push(value);
      });
      
      // Add requirements to each activity
      const activitiesWithRequirements = await Promise.all(
        activities.map(async (activity) => {
          const requirements = await getActivityRequirementsData(activity._id);
          return {
            ...activity,
            requirements
          };
        })
      );
      
      // Sort by start_time (most recent first)
      activitiesWithRequirements.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
      
      res.json({ 
        success: true, 
        data: activitiesWithRequirements,
        count: activitiesWithRequirements.length
      });
      } catch (err) {
      console.error('Get student activities error:', err);
      res.status(500).json({ success: false, message: err.message });
      }
      },

  async getMyActivities(req, res) {
    try {
      // Get current user ID
      const userId = req.user.id;
      
      // Get student profile for this user
      const studentProfile = await StudentProfile.findOne({ user_id: userId });
      
      if (!studentProfile) {
        return res.status(404).json({ 
          success: false, 
          message: 'Student profile not found for this user' 
        });
      }
      
      // Use the same logic as getStudentActivities
      const registrations = await ActivityRegistration.find({ 
        student_id: studentProfile._id 
      }).populate({
        path: 'activity_id',
        populate: [
          { path: 'org_unit_id', select: '_id name' },
          { path: 'field_id', select: '_id name' }
        ]
      });
      
      const attendances = await Attendance.find({ 
        student_id: studentProfile._id 
      }).populate({
        path: 'activity_id',
        populate: [
          { path: 'org_unit_id', select: '_id name' },
          { path: 'field_id', select: '_id name' }
        ]
      });
      
      // Get all activity IDs to check for rejections
      const activityIds = new Set();
      registrations.forEach(reg => {
        if (reg.activity_id) activityIds.add(reg.activity_id._id);
      });
      attendances.forEach(att => {
        if (att.activity_id) activityIds.add(att.activity_id._id);
      });
      
      // Check rejections for all activities
      const rejections = await ActivityRejection.find({
        activity_id: { $in: Array.from(activityIds) }
      }).populate('rejected_by', 'name email');
      const rejectionMap = new Map();
      rejections.forEach(rej => {
        rejectionMap.set(rej.activity_id.toString(), rej);
      });
      
      const activities = [];
      const activityMap = new Map();
      
      // Process registrations
      registrations.forEach(reg => {
        if (reg.activity_id) {
          const activityData = reg.activity_id.toObject();
          
          // Check if activity is rejected and update status
          const rejectionInfo = rejectionMap.get(activityData._id.toString());
          if (rejectionInfo) {
            activityData.status = 'rejected';
            activityData.rejection = {
              reason: rejectionInfo.reason,
              rejected_by: rejectionInfo.rejected_by,
              rejected_at: rejectionInfo.rejected_at
            };
          } else {
            // Update status based on time if not rejected
            const now = new Date();
            const startTime = new Date(activityData.start_time);
            const endTime = new Date(activityData.end_time);
            
            if (activityData.status !== 'pending' && activityData.status !== 'rejected' && activityData.status !== 'cancelled') {
              if (endTime < now) {
                activityData.status = 'completed';
              } else if (startTime <= now && now <= endTime) {
                activityData.status = 'in_progress';
              } else if (startTime > now) {
                activityData.status = 'approved';
              }
            }
          }
          
          // Convert status to Vietnamese
          activityData.status = getStatusVi(activityData.status);
          // Add post status info
          activityData.post_status = postMap.get(activityData._id.toString()) || false;
          
          activityMap.set(activityData._id.toString(), {
            ...activityData,
            registration: {
              id: reg._id,
              status: reg.status,
              registered_at: reg.registered_at,
              approval_note: reg.approval_note,
              approved_by: reg.approved_by,
              approved_at: reg.approved_at
            },
            attendance: null
          });
        }
      });
      
      // Process attendances
      attendances.forEach(att => {
        if (att.activity_id) {
          const activityId = att.activity_id._id.toString();
          if (activityMap.has(activityId)) {
            activityMap.get(activityId).attendance = {
              id: att._id,
              scanned_at: att.scanned_at,
              status: att.status,
              verified: att.verified,
              verified_at: att.verified_at,
              points: att.points,
              feedback: att.feedback,
              feedback_time: att.feedback_time
            };
          } else {
            const activityData = att.activity_id.toObject();
            
            // Check if activity is rejected and update status
            const rejectionInfo = rejectionMap.get(activityId);
            if (rejectionInfo) {
              activityData.status = 'rejected';
              activityData.rejection = {
                reason: rejectionInfo.reason,
                rejected_by: rejectionInfo.rejected_by,
                rejected_at: rejectionInfo.rejected_at
              };
            } else {
              // Update status based on time if not rejected
              const now = new Date();
              const startTime = new Date(activityData.start_time);
              const endTime = new Date(activityData.end_time);
              
              if (activityData.status !== 'pending' && activityData.status !== 'rejected' && activityData.status !== 'cancelled') {
                if (endTime < now) {
                  activityData.status = 'completed';
                } else if (startTime <= now && now <= endTime) {
                  activityData.status = 'in_progress';
                } else if (startTime > now) {
                  activityData.status = 'approved';
                }
              }
            }
            
            // Convert status to Vietnamese
            activityData.status = getStatusVi(activityData.status);
            // Add post status info
            activityData.post_status = postMap.get(activityId) || false;
            
            activityMap.set(activityId, {
              ...activityData,
              registration: null,
              attendance: {
                id: att._id,
                scanned_at: att.scanned_at,
                status: att.status,
                verified: att.verified,
                verified_at: att.verified_at,
                points: att.points,
                feedback: att.feedback,
                feedback_time: att.feedback_time
              }
            });
          }
        }
      });
      
      // Convert map to array
      activityMap.forEach(value => {
        activities.push(value);
      });
      
      // Add requirements to each activity
      const activitiesWithRequirements = await Promise.all(
        activities.map(async (activity) => {
          const requirements = await getActivityRequirementsData(activity._id);
          return {
            ...activity,
            requirements
          };
        })
      );
      
      // Sort by start_time (most recent first)
      activitiesWithRequirements.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
      
      res.json({ 
        success: true, 
        data: activitiesWithRequirements,
        count: activitiesWithRequirements.length
      });
      } catch (err) {
      console.error('Get my activities error:', err);
      res.status(500).json({ success: false, message: err.message });
      }
      },

  async rejectActivity(req, res) {
    try {
      const activity = await Activity.findById(req.params.id);
      if (!activity) {
        return res.status(404).json({ 
          success: false, 
          message: 'Activity not found' 
        });
      }

      // Debug: Log request body
      console.log('Reject Activity - Request Body:', req.body);
      console.log('Reject Activity - Content-Type:', req.headers['content-type']);

      const { reason } = req.body;
      
      // Check if reason exists and is not empty after trimming
      if (!reason || (typeof reason === 'string' && reason.trim() === '')) {
        return res.status(400).json({ 
          success: false, 
          message: 'Lý do từ chối là bắt buộc',
          debug: {
            receivedBody: req.body,
            reasonValue: reason,
            reasonType: typeof reason
          }
        });
      }

      // Check if activity already rejected
      const existingRejection = await ActivityRejection.findOne({ activity_id: activity._id });
      if (existingRejection) {
        return res.status(400).json({ 
          success: false, 
          message: 'Hoạt động đã bị từ chối trước đó' 
        });
      }

      // Get current user ID
      const rejectedBy = req.user.id;

      // Create rejection record
      const rejection = await ActivityRejection.create({
        activity_id: activity._id,
        reason: reason.trim(),
        rejected_by: rejectedBy,
        rejected_at: new Date()
      });

      // Update activity status to rejected
      activity.status = 'rejected';
      await activity.save();

      // Send notification to activity creator when activity is rejected
      try {
        const Notification = require('../models/notification.model');
        
        const notificationTitle = `Hoạt động "${activity.title}" bị từ chối`;
        const notificationContent = `Hoạt động "${activity.title}" của bạn bị từ chối. Lý do: ${reason.trim()}`;

        await Notification.create({
          title: notificationTitle,
          content: notificationContent,
          published_date: new Date(),
          notification_type: 'activity',
          icon_type: 'cancel',
          target_audience: 'specific',
          target_user_ids: [activity.created_by],
          created_by: req.user?.id || null
        });

        console.log(`Notification created for activity creator about rejected activity`);
      } catch (notifErr) {
        console.error('Error creating activity rejection notification:', notifErr);
        // Don't fail the rejection if notification fails
      }

      // Populate rejection data
      const populatedRejection = await ActivityRejection.findById(rejection._id)
        .populate('activity_id', 'title description status')
        .populate('rejected_by', 'username');

      // Transform activity status to Vietnamese in response
      if (populatedRejection.activity_id) {
        populatedRejection.activity_id.status = getStatusVi('rejected');
      }

      res.json({ 
        success: true, 
        message: 'Hoạt động đã được từ chối',
        data: populatedRejection 
      });
    } catch (err) {
      console.error('Reject activity error:', err);
      if (err.code === 11000) {
        return res.status(400).json({ 
          success: false, 
          message: 'Hoạt động đã bị từ chối trước đó' 
        });
      }
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async getActivityRejections(req, res) {
    try {
      const rejections = await ActivityRejection.find()
        .populate('activity_id')
        .populate('rejected_by', 'username')
        .sort({ rejected_at: -1 });

      // Transform activity status to Vietnamese in each rejection
      const transformedRejections = rejections.map(rejection => {
        const rejectionObj = rejection.toObject();
        if (rejectionObj.activity_id) {
          rejectionObj.activity_id.status = getStatusVi(rejectionObj.activity_id.status);
        }
        return rejectionObj;
      });

      res.json({ success: true, data: transformedRejections });
    } catch (err) {
      console.error('Get activity rejections error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getRejectionByActivityId(req, res) {
    try {
      const { id } = req.params;
      
      const rejection = await ActivityRejection.findOne({ activity_id: id })
        .populate('activity_id')
        .populate('rejected_by', 'username');

      if (!rejection) {
        return res.status(404).json({ 
          success: false, 
          message: 'Không tìm thấy thông tin từ chối cho hoạt động này' 
        });
      }

      // Transform activity status to Vietnamese
      const rejectionObj = rejection.toObject();
      if (rejectionObj.activity_id) {
        rejectionObj.activity_id.status = getStatusVi(rejectionObj.activity_id.status);
      }

      res.json({ success: true, data: rejectionObj });
    } catch (err) {
      console.error('Get rejection by activity ID error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async deleteRejection(req, res) {
    try {
      const { id } = req.params;
      
      const rejection = await ActivityRejection.findOneAndDelete({ activity_id: id });

      if (!rejection) {
        return res.status(404).json({ 
          success: false, 
          message: 'Không tìm thấy thông tin từ chối' 
        });
      }

      // Update activity status back to pending (since rejection is removed)
      const activity = await Activity.findById(id);
      if (activity && activity.status === 'rejected') {
        activity.status = 'pending';
        await activity.save();
      }

      res.json({ 
        success: true, 
        message: 'Đã xóa thông tin từ chối hoạt động. Status đã được cập nhật về "chờ duyệt"' 
      });
    } catch (err) {
      console.error('Delete rejection error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async cancelActivity(req, res) {
    try {
      const { cancellation_reason } = req.body;
      
      // Validate cancellation_reason is required
      if (!cancellation_reason || cancellation_reason.trim() === '') {
        return res.status(400).json({ 
          success: false, 
          message: 'Vui lòng nhập lý do hủy hoạt động' 
        });
      }

      // Validate cancellation_reason length
      const trimmedReason = cancellation_reason.trim();
      if (trimmedReason.length < 5) {
        return res.status(400).json({ 
          success: false, 
          message: 'Lý do hủy hoạt động phải có ít nhất 5 ký tự' 
        });
      }

      if (trimmedReason.length > 500) {
        return res.status(400).json({ 
          success: false, 
          message: 'Lý do hủy hoạt động không thể vượt quá 500 ký tự' 
        });
      }
      
      const activity = await Activity.findById(req.params.id)
        .populate('org_unit_id', 'name')
        .populate('field_id', 'name');

      if (!activity) {
        return res.status(404).json({ 
          success: false, 
          message: 'Hoạt động không tồn tại' 
        });
      }

      // Check if activity is already cancelled
      if (activity.status === 'cancelled') {
        return res.status(400).json({ 
          success: false, 
          message: 'Hoạt động đã bị hủy trước đó' 
        });
      }

      // Check if activity has started (cannot cancel ongoing or completed activities)
      const now = new Date();
      if (new Date(activity.start_time) <= now) {
        return res.status(400).json({ 
          success: false, 
          message: 'Không thể hủy hoạt động đã bắt đầu hoặc đã kết thúc' 
        });
      }

      // Update activity status to cancelled
      activity.status = 'cancelled';
      activity.cancelled_at = new Date();
      activity.cancellation_reason = trimmedReason;
      await activity.save();

      // Get all registered students for this activity
      const registrations = await ActivityRegistration.find({ 
        activity_id: activity._id 
      }).select('student_id').lean();

      // Get student user IDs
      const studentProfileIds = registrations.map(reg => reg.student_id);
      
      if (studentProfileIds.length > 0) {
        // Get user IDs from student profiles
        const studentProfiles = await StudentProfile.find({
          _id: { $in: studentProfileIds }
        }).select('user_id').lean();

        const userIds = studentProfiles
          .map(sp => sp.user_id)
          .filter(uid => uid !== null && uid !== undefined);

        // Create notification for each registered student
        if (userIds.length > 0) {
          const Notification = require('../models/notification.model');
          
          const notificationTitle = `Hoạt động "${activity.title}" đã bị hủy`;
          const notificationContent = `Hoạt động "${activity.title}" mà bạn đã đăng ký đã bị hủy. Lý do: ${trimmedReason}`;

          try {
            await Notification.create({
              title: notificationTitle,
              content: notificationContent,
              published_date: new Date(),
              notification_type: 'cancellation',
              icon_type: 'cancel',
              target_audience: 'specific',
              target_user_ids: userIds,
              created_by: req.user?.id || null
            });

            console.log(`Notification created for ${userIds.length} students for cancelled activity ${activity._id}`);
          } catch (notifErr) {
            console.error('Error creating cancellation notification:', notifErr);
            // Don't fail the cancellation if notification fails
          }
        }
      }

      // Transform activity to return Vietnamese status
      const transformedActivity = transformActivity(activity);

      res.json({ 
        success: true, 
        message: `Hoạt động đã được hủy. Thông báo đã được gửi đến ${studentProfileIds.length} học sinh đã đăng ký`,
        data: transformedActivity,
        notifiedStudents: studentProfileIds.length
      });
    } catch (err) {
      console.error('Cancel activity error:', err);
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async getStudentActivitiesWithFilter(req, res) {
    try {
      const { student_id } = req.params;
      const { status, field_id, org_unit_id, title, post_status } = req.query;
      let postStatusFilter = null;

      // ✅ Parse post_status query parameter
      if (post_status) {
        if (post_status === 'true') {
          postStatusFilter = true;
        } else if (post_status === 'false') {
          postStatusFilter = false;
        } else {
          return res.status(400).json({
            success: false,
            message: 'Invalid post_status. Must be "true" or "false"'
          });
        }
        console.log(`[Filter Student Activities] Post Status Filter: ${postStatusFilter ? 'Posted' : 'Not Posted'}`);
      }

      // Get all registrations for the student
      const registrations = await ActivityRegistration.find({ 
        student_id 
      }).populate({
        path: 'activity_id',
        populate: [
          { path: 'org_unit_id', select: '_id name' },
          { path: 'field_id', select: '_id name' }
        ]
      });

      // Get all attendances for the student
      const attendances = await Attendance.find({ 
        student_id 
      }).populate({
        path: 'activity_id',
        populate: [
          { path: 'org_unit_id', select: '_id name' },
          { path: 'field_id', select: '_id name' }
        ]
      });

      // Get all activity IDs to check for rejections
      const activityIds = new Set();
      registrations.forEach(reg => {
        if (reg.activity_id) activityIds.add(reg.activity_id._id);
      });
      attendances.forEach(att => {
        if (att.activity_id) activityIds.add(att.activity_id._id);
      });

      // Check rejections for all activities
      const rejections = await ActivityRejection.find({
        activity_id: { $in: Array.from(activityIds) }
      });
      const rejectionMap = new Map();
      rejections.forEach(rej => {
        rejectionMap.set(rej.activity_id.toString(), rej);
      });

      // Get all posts if post_status filter is applied
      let postMap = new Map();
      if (postStatusFilter !== null) {
        const Post = require('../models/post.model');
        const posts = await Post.find({
          activity_id: { $in: Array.from(activityIds) }
        });
        posts.forEach(post => {
          postMap.set(post.activity_id.toString(), post.status);
        });
      }

      const activities = [];
      const activityMap = new Map();

      // Process registrations
      registrations.forEach(reg => {
        if (reg.activity_id) {
          const activityData = reg.activity_id.toObject();
          
          // Check if activity is rejected and update status
          if (rejectionMap.has(activityData._id.toString())) {
            activityData.status = 'rejected';
          } else {
            // Update status based on time if not rejected
            const now = new Date();
            const startTime = new Date(activityData.start_time);
            const endTime = new Date(activityData.end_time);
            
            if (activityData.status !== 'pending' && activityData.status !== 'rejected' && activityData.status !== 'cancelled') {
              if (endTime < now) {
                activityData.status = 'completed';
              } else if (startTime <= now && now <= endTime) {
                activityData.status = 'in_progress';
              } else if (startTime > now) {
                activityData.status = 'approved';
              }
            }
          }
          
          // Convert status to Vietnamese
          activityData.status = getStatusVi(activityData.status);
          activityMap.set(activityData._id.toString(), {
            ...activityData,
            registration: {
              id: reg._id,
              status: reg.status,
              registered_at: reg.registered_at,
              approval_note: reg.approval_note,
              approved_by: reg.approved_by,
              approved_at: reg.approved_at
            },
            attendance: null
          });
        }
      });

      // Process attendances
      attendances.forEach(att => {
        if (att.activity_id) {
          const activityId = att.activity_id._id.toString();
          if (activityMap.has(activityId)) {
            // Add attendance info to existing activity
            activityMap.get(activityId).attendance = {
              id: att._id,
              scanned_at: att.scanned_at,
              status: att.status,
              verified: att.verified,
              verified_at: att.verified_at,
              points: att.points,
              feedback: att.feedback,
              feedback_time: att.feedback_time
            };
          } else {
            // Activity with attendance but no registration
            const activityData = att.activity_id.toObject();
            
            // Check if activity is rejected and update status
            if (rejectionMap.has(activityId)) {
              activityData.status = 'rejected';
            } else {
              // Update status based on time if not rejected
              const now = new Date();
              const startTime = new Date(activityData.start_time);
              const endTime = new Date(activityData.end_time);
              
              if (activityData.status !== 'pending' && activityData.status !== 'rejected' && activityData.status !== 'cancelled') {
                if (endTime < now) {
                  activityData.status = 'completed';
                } else if (startTime <= now && now <= endTime) {
                  activityData.status = 'in_progress';
                } else if (startTime > now) {
                  activityData.status = 'approved';
                }
              }
            }
            
            // Convert status to Vietnamese
            activityData.status = getStatusVi(activityData.status);
            activityMap.set(activityId, {
              ...activityData,
              registration: null,
              attendance: {
                id: att._id,
                scanned_at: att.scanned_at,
                status: att.status,
                verified: att.verified,
                verified_at: att.verified_at,
                points: att.points,
                feedback: att.feedback,
                feedback_time: att.feedback_time
              }
            });
          }
        }
      });

      // Convert map to array
      activityMap.forEach(value => {
        activities.push(value);
      });

      // Apply filters
      let filtered = activities;

      // Debug: Log filter parameters
      console.log('Student filter params:', { student_id, status, field_id, org_unit_id, title, postStatusFilter });

      if (status) {
        filtered = filtered.filter(act => {
          // Convert Vietnamese status to English if needed
          const statusEn = getStatusEn(status);
          const statusVi = getStatusVi(statusEn);
          
          // Filter by activity status (Vietnamese or English)
          // Also support filtering by registration status
          if (act.registration && act.registration.status === status) {
            return true;
          }
          
          // Filter by activity status
          return act.status === status || act.status === statusVi;
        });
      }

      if (postStatusFilter !== null) {
        filtered = filtered.filter(act => act.post_status === postStatusFilter);
      }

      if (field_id) {
        filtered = filtered.filter(act => act.field_id && (
          act.field_id._id.toString() === field_id || 
          act.field_id.name.toLowerCase() === field_id.toLowerCase()
        ));
      }

      if (org_unit_id) {
        filtered = filtered.filter(act => act.org_unit_id && (
          act.org_unit_id._id.toString() === org_unit_id || 
          act.org_unit_id.name.toLowerCase() === org_unit_id.toLowerCase()
        ));
      }

      if (title) {
        filtered = filtered.filter(act => 
          act.title && act.title.toLowerCase().includes(title.toLowerCase())
        );
      }

      // Sort by start_time (most recent first)
      filtered.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));

      res.json({ 
        success: true, 
        data: filtered,
        count: filtered.length
      });
    } catch (err) {
      console.error('Get student activities with filter error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getActivitiesWithFilter(req, res) {
    try {
      const { status, field_id, org_unit_id, title, post_status } = req.query;
      let postStatusFilter = null;

      // ✅ Parse post_status query parameter
      if (post_status) {
        if (post_status === 'true') {
          postStatusFilter = true;
        } else if (post_status === 'false') {
          postStatusFilter = false;
        } else {
          return res.status(400).json({
            success: false,
            message: 'Invalid post_status. Must be "true" or "false"'
          });
        }
        console.log(`[Filter Activities] Post Status Filter: ${postStatusFilter ? 'Posted' : 'Not Posted'}`);
      }

      // Get all activities
      const activities = await Activity.find()
        .populate('org_unit_id', '_id name')
        .populate('field_id', '_id name')
        .sort({ start_time: -1 });

      // Get all rejections
      const rejections = await ActivityRejection.find();
      const rejectionMap = new Map();
      rejections.forEach(rej => {
        rejectionMap.set(rej.activity_id.toString(), rej);
      });

      // Get all posts if post_status filter is applied
      let postMap = new Map();
      if (postStatusFilter !== null) {
        const Post = require('../models/post.model');
        const posts = await Post.find();
        posts.forEach(post => {
          postMap.set(post.activity_id.toString(), post.status);
        });
      }

      // Process all activities
      const processedActivities = activities.map(act => {
        const activityData = act.toObject();

        // Check if activity is rejected and update status
        if (rejectionMap.has(activityData._id.toString())) {
          activityData.status = 'rejected';
        } else {
          // Update status based on time if not rejected
          const now = new Date();
          const startTime = new Date(activityData.start_time);
          const endTime = new Date(activityData.end_time);

          if (activityData.status !== 'pending' && activityData.status !== 'rejected' && activityData.status !== 'cancelled') {
            if (endTime < now) {
              activityData.status = 'completed';
            } else if (startTime <= now && now <= endTime) {
              activityData.status = 'in_progress';
            } else if (startTime > now) {
              activityData.status = 'approved';
            }
          }
        }

        // Convert status to Vietnamese
        activityData.status = getStatusVi(activityData.status);
        
        // Add post status info
        activityData.post_status = postMap.get(activityData._id.toString()) || false;
        
        return activityData;
      });

      // Apply filters
      let filtered = processedActivities;

      if (status) {
        const statusEn = getStatusEn(status);
        filtered = filtered.filter(act => act.status === status || act.status === statusEn);
      }

      if (postStatusFilter !== null) {
        filtered = filtered.filter(act => act.post_status === postStatusFilter);
      }

      if (field_id) {
        filtered = filtered.filter(act => {
          if (!act.field_id) return false;
          const fieldObjId = act.field_id._id ? act.field_id._id.toString() : act.field_id.toString();
          const fieldName = act.field_id.name ? act.field_id.name.toLowerCase() : '';
          return fieldObjId === field_id || fieldName === field_id.toLowerCase();
        });
      }

      if (org_unit_id) {
        filtered = filtered.filter(act => {
          if (!act.org_unit_id) return false;
          const orgObjId = act.org_unit_id._id ? act.org_unit_id._id.toString() : act.org_unit_id.toString();
          const orgName = act.org_unit_id.name ? act.org_unit_id.name.toLowerCase() : '';
          return orgObjId === org_unit_id || orgName === org_unit_id.toLowerCase();
        });
      }

      if (title) {
        filtered = filtered.filter(act => 
          act.title && act.title.toLowerCase().includes(title.toLowerCase())
        );
      }

      // Sort by start_time (most recent first)
      filtered.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));

      res.json({ 
        success: true, 
        data: filtered,
        count: filtered.length
      });
    } catch (err) {
      console.error('Get activities with filter error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getActivityWithStudentStatus(req, res) {
    try {
      const { activityId, studentId } = req.params;
      
      // Get activity details
      let activity = await Activity.findById(activityId)
        .populate('org_unit_id', '_id name')
        .populate('field_id', '_id name');
      
      if (!activity) {
        return res.status(404).json({ 
          success: false, 
          message: 'Hoạt động không tồn tại' 
        });
      }
      
      // Auto-update status
      activity = await updateActivityStatus(activity);
      
      // Get registration count
      const registrationCount = await ActivityRegistration.countDocuments({ 
        activity_id: activity._id 
      });
      
      // Get rejection info
      const rejection = await ActivityRejection.findOne({ activity_id: activity._id })
        .populate('rejected_by', 'username');
      
      // Get requirements
      const requirements = await getActivityRequirementsData(activity._id);
      
      // Get student profile ID if studentId is a user ID
      let studentProfileId = studentId;
      const studentProfile = await StudentProfile.findOne({ user_id: studentId });
      if (studentProfile) {
        studentProfileId = studentProfile._id;
      }
      
      // Get student's registration for this activity
      let registration = null;
      let registrationStatus = 'not_registered';
      
      const registrationRecord = await ActivityRegistration.findOne({
        activity_id: activityId,
        student_id: studentProfileId
      })
        .populate('approved_by', '_id username email name')
        .populate('cancelled_by', '_id username email name')
        .populate({
          path: 'status_history.changed_by',
          select: '_id username email name'
        });
      
      if (registrationRecord) {
        registration = registrationRecord.toObject();
        registrationStatus = registrationRecord.status;
      }
      
      // Get student's attendance for this activity
      let attendance = null;
      const attendanceRecord = await Attendance.findOne({
        activity_id: activityId,
        student_id: studentProfileId
      });
      
      if (attendanceRecord) {
        attendance = attendanceRecord.toObject();
      }
      
      // Transform activity to return Vietnamese status
      const transformedActivity = transformActivity(activity);
      
      res.json({ 
        success: true, 
        data: {
          activity: {
            ...transformedActivity,
            registrationCount,
            rejection: rejection || null,
            requirements
          },
          student: {
            registration: registration || null,
            registrationStatus,
            attendance: attendance || null
          }
        }
      });
    } catch (err) {
      console.error('Get activity with student status error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getActivityQRCode(req, res) {
    try {
      const { id } = req.params;
      
      const activity = await Activity.findById(id);
      if (!activity) {
        return res.status(404).json({ 
          success: false, 
          message: 'Activity not found' 
        });
      }

      // If QR code doesn't exist, generate it
      if (!activity.qr_code) {
        try {
          const qrData = JSON.stringify({
            activityId: activity._id.toString(),
            activityTitle: activity.title,
            timestamp: new Date().toISOString()
          });

          const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            width: 300,
            margin: 1,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });

          activity.qr_code = qrCodeDataUrl;
          await activity.save();
        } catch (qrError) {
          console.error('Error generating QR code:', qrError);
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to generate QR code' 
          });
        }
      }

      // Return QR code as Base64 data URL
      res.json({ 
        success: true, 
        data: {
          activityId: activity._id,
          title: activity.title,
          qr_code: activity.qr_code
        }
      });
    } catch (err) {
      console.error('Get activity QR code error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
