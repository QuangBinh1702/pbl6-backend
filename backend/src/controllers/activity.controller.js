// Quản lý hoạt động
const Activity = require('../models/activity.model');
const ActivityRegistration = require('../models/activity_registration.model');
const Attendance = require('../models/attendance.model');
const StudentProfile = require('../models/student_profile.model');
const User = require('../models/user.model');

module.exports = {
  async getAllActivities(req, res) {
    try {
      const { org_unit_id, field_id, start_date, end_date } = req.query;
      
      const filter = {};
      if (org_unit_id) filter.org_unit_id = org_unit_id;
      if (field_id) filter.field_id = field_id;
      if (start_date || end_date) {
        filter.start_time = {};
        if (start_date) filter.start_time.$gte = new Date(start_date);
        if (end_date) filter.start_time.$lte = new Date(end_date);
      }
      
      const activities = await Activity.find(filter)
        .populate('org_unit_id')
        .populate('field_id')
        .sort({ start_time: -1 });
      
      res.json({ success: true, data: activities });
    } catch (err) {
      console.error('Get all activities error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getActivityById(req, res) {
    try {
      const activity = await Activity.findById(req.params.id)
        .populate('org_unit_id')
        .populate('field_id');
      
      if (!activity) {
        return res.status(404).json({ 
          success: false, 
          message: 'Activity not found' 
        });
      }
      
      // Get registration count
      const registrationCount = await ActivityRegistration.countDocuments({ 
        activity_id: activity._id 
      });
      
      res.json({ 
        success: true, 
        data: {
          ...activity.toObject(),
          registrationCount
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
        activity_image
      } = req.body;
      
      // Validate required fields
      if (!title || !start_time || !end_time) {
        return res.status(400).json({ 
          success: false, 
          message: 'Title, start_time, and end_time are required' 
        });
      }
      
      // Convert to Date objects for validation
      const startTimeDate = new Date(start_time);
      const endTimeDate = new Date(end_time);
      const registrationOpenDate = registration_open ? new Date(registration_open) : null;
      const registrationCloseDate = registration_close ? new Date(registration_close) : null;
      const now = new Date();
      
      // Validate: Check if dates are valid
      if (isNaN(startTimeDate.getTime())) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid start_time format' 
        });
      }
      if (isNaN(endTimeDate.getTime())) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid end_time format' 
        });
      }
      if (registrationOpenDate && isNaN(registrationOpenDate.getTime())) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid registration_open format' 
        });
      }
      if (registrationCloseDate && isNaN(registrationCloseDate.getTime())) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid registration_close format' 
        });
      }
      
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
        activity_image
      });
      
      res.status(201).json({ success: true, data: activity });
    } catch (err) {
      console.error('Create activity error:', err);
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async updateActivity(req, res) {
    try {
      const updates = { ...req.body };
      
      // Update time_updated fields if start_time or end_time changed
      if (updates.start_time) {
        updates.start_time = new Date(updates.start_time);
        updates.start_time_updated = new Date();
      }
      if (updates.end_time) {
        updates.end_time = new Date(updates.end_time);
        updates.end_time_updated = new Date();
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
      
      res.json({ success: true, data: activity });
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
      
      await activity.save();
      
      res.json({ 
        success: true, 
        message: `Activity ${activity.requires_approval ? 'marked as requiring approval' : 'approved successfully'}`,
        data: activity 
      });
    } catch (err) {
      console.error('Approve activity error:', err);
      res.status(400).json({ success: false, message: err.message });
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
      
      // When rejecting, we can set requires_approval to true to indicate it needs review again
      // or keep it as is. Based on business logic, we'll keep the current value.
      // The rejection is mainly tracked through the reason in the request body
      
      await activity.save();
      
      res.json({ 
        success: true, 
        message: req.body.reason ? `Activity rejected: ${req.body.reason}` : 'Activity rejected',
        data: activity 
      });
    } catch (err) {
      console.error('Reject activity error:', err);
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
      
      activity.completed = true;
      activity.completed_at = new Date();
      await activity.save();
      
      res.json({ success: true, data: activity });
    } catch (err) {
      console.error('Complete activity error:', err);
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async registerActivity(req, res) {
    try {
      const { student_id } = req.body;
      const studentIdToUse = student_id || req.user.id;
      
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
      }).populate('student_id');
      
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
      }).populate('activity_id');
      
      // Get all attendance records for this student
      const attendances = await Attendance.find({ 
        student_id: studentProfileId 
      }).populate('activity_id');
      
      // Combine both results
      const activities = [];
      const activityMap = new Map();
      
      // Process registrations
      registrations.forEach(reg => {
        if (reg.activity_id) {
          const activityData = reg.activity_id.toObject();
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
      
      // Sort by start_time (most recent first)
      activities.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
      
      res.json({ 
        success: true, 
        data: activities,
        count: activities.length
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
      }).populate('activity_id');
      
      const attendances = await Attendance.find({ 
        student_id: studentProfile._id 
      }).populate('activity_id');
      
      const activities = [];
      const activityMap = new Map();
      
      // Process registrations
      registrations.forEach(reg => {
        if (reg.activity_id) {
          const activityData = reg.activity_id.toObject();
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
      
      // Sort by start_time (most recent first)
      activities.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
      
      res.json({ 
        success: true, 
        data: activities,
        count: activities.length
      });
    } catch (err) {
      console.error('Get my activities error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
