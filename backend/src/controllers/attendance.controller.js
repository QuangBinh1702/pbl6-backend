// Quản lý điểm danh
const Attendance = require('../models/attendance.model');
const Activity = require('../models/activity.model');
const StudentProfile = require('../models/student_profile.model');

module.exports = {
  async getAllAttendances(req, res) {
    try {
      const attendances = await Attendance.find()
        .populate({
          path: 'student_id',
          populate: {
            path: 'user_id',
            select: '-password_hash'
          }
        })
        .populate('activity_id')
        .sort({ scanned_at: -1 });
      res.json({ success: true, data: attendances });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getAttendanceById(req, res) {
    try {
      const attendance = await Attendance.findById(req.params.id)
        .populate({
          path: 'student_id',
          populate: {
            path: 'user_id',
            select: '-password_hash'
          }
        })
        .populate('activity_id');
      if (!attendance) {
        return res.status(404).json({ success: false, message: 'Attendance not found' });
      }
      res.json({ success: true, data: attendance });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getAttendancesByActivity(req, res) {
    try {
      const attendances = await Attendance.find({ activity_id: req.params.activityId })
        .populate({
          path: 'student_id',
          populate: {
            path: 'user_id',
            select: '-password_hash'
          }
        })
        .populate('activity_id')
        .sort({ scanned_at: -1 });
      res.json({ success: true, data: attendances });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getAttendancesByStudent(req, res) {
    try {
      const attendances = await Attendance.find({ student_id: req.params.studentId })
        .populate({
          path: 'student_id',
          populate: {
            path: 'user_id',
            select: '-password_hash'
          }
        })
        .populate('activity_id')
        .sort({ scanned_at: -1 });
      res.json({ success: true, data: attendances });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async createAttendance(req, res) {
    try {
      // Check if attendance already exists
      const existingAttendance = await Attendance.findOne({
        student_id: req.body.student_id,
        activity_id: req.body.activity_id
      });

      if (existingAttendance) {
        return res.status(400).json({ success: false, message: 'Attendance already recorded' });
      }

      const attendance = new Attendance(req.body);
      await attendance.save();
      await attendance.populate({
        path: 'student_id',
        populate: {
          path: 'user_id',
          select: '-password_hash'
        }
      });
      await attendance.populate('activity_id');
      
      res.status(201).json({ success: true, data: attendance });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async updateAttendance(req, res) {
    try {
      const attendance = await Attendance.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      )
        .populate({
          path: 'student_id',
          populate: {
            path: 'user_id',
            select: '-password_hash'
          }
        })
        .populate('activity_id');
      
      if (!attendance) {
        return res.status(404).json({ success: false, message: 'Attendance not found' });
      }
      res.json({ success: true, data: attendance });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async deleteAttendance(req, res) {
    try {
      const attendance = await Attendance.findByIdAndDelete(req.params.id);
      if (!attendance) {
        return res.status(404).json({ success: false, message: 'Attendance not found' });
      }
      res.json({ success: true, message: 'Attendance deleted successfully' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async verifyAttendance(req, res) {
    try {
      const attendance = await Attendance.findByIdAndUpdate(
        req.params.id,
        { 
          verified: true,
          verified_at: new Date()
        },
        { new: true }
      )
        .populate({
          path: 'student_id',
          populate: {
            path: 'user_id',
            select: '-password_hash'
          }
        })
        .populate('activity_id');
      
      if (!attendance) {
        return res.status(404).json({ success: false, message: 'Attendance not found' });
      }
      res.json({ success: true, data: attendance });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async addFeedback(req, res) {
    try {
      const { feedback } = req.body;
      const attendance = await Attendance.findByIdAndUpdate(
        req.params.id,
        { 
          feedback,
          feedback_time: new Date()
        },
        { new: true }
      )
        .populate({
          path: 'student_id',
          populate: {
            path: 'user_id',
            select: '-password_hash'
          }
        })
        .populate('activity_id');
      
      if (!attendance) {
        return res.status(404).json({ success: false, message: 'Attendance not found' });
      }
      res.json({ success: true, data: attendance });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async getAttendedActivitiesByStudent(req, res) {
    try {
      const { studentId } = req.params;
      const attendances = await Attendance.find({ student_id: studentId })
        .populate('activity_id')
        .sort({ scanned_at: -1 });

      // Deduplicate by activity_id and include points
      const activitiesMap = new Map();
      attendances.forEach(att => {
        if (att.activity_id) {
          const key = att.activity_id._id.toString();
          if (!activitiesMap.has(key)) {
            const act = att.activity_id.toObject();
            // Add attendance points to activity object
            act.points = att.points || 0;
            activitiesMap.set(key, act);
          }
        }
      });

      const activities = Array.from(activitiesMap.values());

      // Sort by start_time desc if available
      activities.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));

      res.json({ success: true, data: activities, count: activities.length });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async scanQRCode(req, res) {
    try {
      const { qrData } = req.body;
      // Parse QR code data
      const data = JSON.parse(qrData);
      
      // Find student profile
      const studentProfile = await StudentProfile.findOne({ user_id: data.userId });
      if (!studentProfile) {
        return res.status(404).json({ success: false, message: 'Student profile not found' });
      }

      // Check if attendance already exists
      const existingAttendance = await Attendance.findOne({
        student_id: studentProfile._id,
        activity_id: data.activityId
      });

      if (existingAttendance) {
        return res.status(400).json({ success: false, message: 'Attendance already recorded' });
      }

      // Create attendance record
      const attendance = new Attendance({
        student_id: studentProfile._id,
        activity_id: data.activityId,
        status: 'present',
        scanned_at: new Date()
      });

      await attendance.save();
      await attendance.populate({
        path: 'student_id',
        populate: {
          path: 'user_id',
          select: '-password_hash'
        }
      });
      await attendance.populate('activity_id');

      res.status(201).json({ success: true, data: attendance });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },
};


