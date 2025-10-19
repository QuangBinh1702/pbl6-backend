// Quản lý đăng ký hoạt động
const ActivityRegistration = require('../models/activity_registration.model');
const Activity = require('../models/activity.model');
const StudentProfile = require('../models/student_profile.model');
const User = require('../models/user.model');
const QRCode = require('qrcode');

module.exports = {
  async getAllRegistrations(req, res) {
    try {
      const { status, activity_id } = req.query;
      const filter = {};
      
      if (status) filter.status = status;
      if (activity_id) filter.activity_id = activity_id;
      
      const registrations = await ActivityRegistration.find(filter)
        .populate({
          path: 'student_id',
          populate: { path: 'user_id' }
        })
        .populate('activity_id')
        .populate('approved_by')
        .sort({ createdAt: -1 });
      
      res.json({ success: true, data: registrations });
    } catch (err) {
      console.error('Get all registrations error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getRegistrationById(req, res) {
    try {
      const registration = await ActivityRegistration.findById(req.params.id)
        .populate({
          path: 'student_id',
          populate: { path: 'user_id' }
        })
        .populate('activity_id')
        .populate('approved_by');
      
      if (!registration) {
        return res.status(404).json({ 
          success: false, 
          message: 'Registration not found' 
        });
      }
      
      res.json({ success: true, data: registration });
    } catch (err) {
      console.error('Get registration by ID error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getRegistrationsByActivity(req, res) {
    try {
      const { status } = req.query;
      const filter = { activity_id: req.params.activityId };
      
      if (status) filter.status = status;
      
      const registrations = await ActivityRegistration.find(filter)
        .populate({
          path: 'student_id',
          populate: { path: 'user_id' }
        })
        .populate('approved_by')
        .sort({ createdAt: -1 });
      
      res.json({ success: true, data: registrations });
    } catch (err) {
      console.error('Get registrations by activity error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getRegistrationsByStudent(req, res) {
    try {
      const { studentId } = req.params;
      
      const registrations = await ActivityRegistration.find({ 
        student_id: studentId 
      })
        .populate('activity_id')
        .populate('approved_by')
        .sort({ createdAt: -1 });
      
      res.json({ success: true, data: registrations });
    } catch (err) {
      console.error('Get registrations by student error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async createRegistration(req, res) {
    try {
      const { student_id, activity_id } = req.body;
      
      if (!student_id || !activity_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'student_id and activity_id are required' 
        });
      }
      
      // Check if already registered
      const existingReg = await ActivityRegistration.findOne({
        student_id,
        activity_id
      });
      
      if (existingReg) {
        return res.status(400).json({ 
          success: false, 
          message: 'Already registered for this activity' 
        });
      }

      // Check activity exists and capacity
      const activity = await Activity.findById(activity_id);
      if (!activity) {
        return res.status(404).json({ 
          success: false, 
          message: 'Activity not found' 
        });
      }
      
      if (activity.capacity > 0) {
        const registrationCount = await ActivityRegistration.countDocuments({ 
          activity_id,
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
        student_id,
        activity_id,
        status: activity.requires_approval ? 'pending' : 'approved'
      });

      await registration.populate({
        path: 'student_id',
        populate: { path: 'user_id' }
      });
      await registration.populate('activity_id');
      
      res.status(201).json({ success: true, data: registration });
    } catch (err) {
      console.error('Create registration error:', err);
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async updateRegistration(req, res) {
    try {
      const registration = await ActivityRegistration.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      )
        .populate({
          path: 'student_id',
          populate: { path: 'user_id' }
        })
        .populate('activity_id')
        .populate('approved_by');
      
      if (!registration) {
        return res.status(404).json({ 
          success: false, 
          message: 'Registration not found' 
        });
      }
      
      res.json({ success: true, data: registration });
    } catch (err) {
      console.error('Update registration error:', err);
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async deleteRegistration(req, res) {
    try {
      const registration = await ActivityRegistration.findByIdAndDelete(req.params.id);
      
      if (!registration) {
        return res.status(404).json({ 
          success: false, 
          message: 'Registration not found' 
        });
      }
      
      res.json({ success: true, message: 'Registration deleted successfully' });
    } catch (err) {
      console.error('Delete registration error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async approveRegistration(req, res) {
    try {
      const registration = await ActivityRegistration.findByIdAndUpdate(
        req.params.id,
        { 
          status: 'approved',
          approved_by: req.user.id,
          approved_at: new Date()
        },
        { new: true }
      )
        .populate({
          path: 'student_id',
          populate: { path: 'user_id' }
        })
        .populate('activity_id')
        .populate('approved_by');
      
      if (!registration) {
        return res.status(404).json({ 
          success: false, 
          message: 'Registration not found' 
        });
      }
      
      res.json({ success: true, data: registration });
    } catch (err) {
      console.error('Approve registration error:', err);
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async rejectRegistration(req, res) {
    try {
      const { approval_note } = req.body;
      
      const registration = await ActivityRegistration.findByIdAndUpdate(
        req.params.id,
        { 
          status: 'rejected',
          approved_by: req.user.id,
          approved_at: new Date(),
          approval_note
        },
        { new: true }
      )
        .populate({
          path: 'student_id',
          populate: { path: 'user_id' }
        })
        .populate('activity_id')
        .populate('approved_by');
      
      if (!registration) {
        return res.status(404).json({ 
          success: false, 
          message: 'Registration not found' 
        });
      }
      
      res.json({ success: true, data: registration });
    } catch (err) {
      console.error('Reject registration error:', err);
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async getMyRegistrations(req, res) {
    try {
      // Get student profile for current user
      const studentProfile = await StudentProfile.findOne({ 
        user_id: req.user.id 
      });
      
      if (!studentProfile) {
        return res.status(404).json({ 
          success: false, 
          message: 'Student profile not found' 
        });
      }
      
      const registrations = await ActivityRegistration.find({ 
        student_id: studentProfile._id 
      })
        .populate('activity_id')
        .sort({ createdAt: -1 });
      
      res.json({ success: true, data: registrations });
    } catch (err) {
      console.error('Get my registrations error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },
};
