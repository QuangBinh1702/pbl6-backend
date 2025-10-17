// Quản lý điểm danh
const Attendance = require('../models/attendance.model');
const Activity = require('../models/activity.model');
const StudentProfile = require('../models/student_profile.model');

module.exports = {
  async getAllAttendances(req, res) {
    try {
      const attendances = await Attendance.find()
        .populate({
          path: 'student',
          populate: {
            path: 'user',
            select: '-password'
          }
        })
        .populate('activity')
        .sort({ scanned_at: -1 });
      res.json(attendances);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getAttendanceById(req, res) {
    try {
      const attendance = await Attendance.findById(req.params.id)
        .populate({
          path: 'student',
          populate: {
            path: 'user',
            select: '-password'
          }
        })
        .populate('activity');
      if (!attendance) {
        return res.status(404).json({ message: 'Attendance not found' });
      }
      res.json(attendance);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getAttendancesByActivity(req, res) {
    try {
      const attendances = await Attendance.find({ activity: req.params.activityId })
        .populate({
          path: 'student',
          populate: {
            path: 'user',
            select: '-password'
          }
        })
        .populate('activity')
        .sort({ scanned_at: -1 });
      res.json(attendances);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getAttendancesByStudent(req, res) {
    try {
      const attendances = await Attendance.find({ student: req.params.studentId })
        .populate({
          path: 'student',
          populate: {
            path: 'user',
            select: '-password'
          }
        })
        .populate('activity')
        .sort({ scanned_at: -1 });
      res.json(attendances);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async createAttendance(req, res) {
    try {
      // Check if attendance already exists
      const existingAttendance = await Attendance.findOne({
        student: req.body.student,
        activity: req.body.activity
      });

      if (existingAttendance) {
        return res.status(400).json({ message: 'Attendance already recorded' });
      }

      const attendance = new Attendance(req.body);
      await attendance.save();
      await attendance.populate({
        path: 'student',
        populate: {
          path: 'user',
          select: '-password'
        }
      });
      await attendance.populate('activity');
      
      res.status(201).json(attendance);
    } catch (err) {
      res.status(400).json({ message: err.message });
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
          path: 'student',
          populate: {
            path: 'user',
            select: '-password'
          }
        })
        .populate('activity');
      
      if (!attendance) {
        return res.status(404).json({ message: 'Attendance not found' });
      }
      res.json(attendance);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  async deleteAttendance(req, res) {
    try {
      const attendance = await Attendance.findByIdAndDelete(req.params.id);
      if (!attendance) {
        return res.status(404).json({ message: 'Attendance not found' });
      }
      res.json({ message: 'Attendance deleted successfully' });
    } catch (err) {
      res.status(500).json({ message: err.message });
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
          path: 'student',
          populate: {
            path: 'user',
            select: '-password'
          }
        })
        .populate('activity');
      
      if (!attendance) {
        return res.status(404).json({ message: 'Attendance not found' });
      }
      res.json(attendance);
    } catch (err) {
      res.status(400).json({ message: err.message });
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
          path: 'student',
          populate: {
            path: 'user',
            select: '-password'
          }
        })
        .populate('activity');
      
      if (!attendance) {
        return res.status(404).json({ message: 'Attendance not found' });
      }
      res.json(attendance);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  async scanQRCode(req, res) {
    try {
      const { qrData } = req.body;
      // Parse QR code data
      const data = JSON.parse(qrData);
      
      // Find student profile
      const studentProfile = await StudentProfile.findOne({ user: data.userId });
      if (!studentProfile) {
        return res.status(404).json({ message: 'Student profile not found' });
      }

      // Check if attendance already exists
      const existingAttendance = await Attendance.findOne({
        student: studentProfile._id,
        activity: data.activityId
      });

      if (existingAttendance) {
        return res.status(400).json({ message: 'Attendance already recorded' });
      }

      // Create attendance record
      const attendance = new Attendance({
        student: studentProfile._id,
        activity: data.activityId,
        status: 'present',
        scanned_at: new Date()
      });

      await attendance.save();
      await attendance.populate({
        path: 'student',
        populate: {
          path: 'user',
          select: '-password'
        }
      });
      await attendance.populate('activity');

      res.status(201).json(attendance);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
};


