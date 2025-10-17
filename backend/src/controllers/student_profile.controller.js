// Quản lý hồ sơ sinh viên
const StudentProfile = require('../models/student_profile.model');
const User = require('../models/user.model');

module.exports = {
  async getAllStudentProfiles(req, res) {
    try {
      const studentProfiles = await StudentProfile.find()
        .populate('user', '-password')
        .populate('class');
      res.json(studentProfiles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getStudentProfileById(req, res) {
    try {
      const studentProfile = await StudentProfile.findById(req.params.id)
        .populate('user', '-password')
        .populate('class');
      if (!studentProfile) {
        return res.status(404).json({ message: 'Student profile not found' });
      }
      res.json(studentProfile);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getStudentProfileByUserId(req, res) {
    try {
      const studentProfile = await StudentProfile.findOne({ user: req.params.userId })
        .populate('user', '-password')
        .populate('class');
      if (!studentProfile) {
        return res.status(404).json({ message: 'Student profile not found' });
      }
      res.json(studentProfile);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getStudentProfileByStudentNumber(req, res) {
    try {
      const studentProfile = await StudentProfile.findOne({ student_number: req.params.studentNumber })
        .populate('user', '-password')
        .populate('class');
      if (!studentProfile) {
        return res.status(404).json({ message: 'Student profile not found' });
      }
      res.json(studentProfile);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async createStudentProfile(req, res) {
    try {
      const studentProfile = new StudentProfile(req.body);
      await studentProfile.save();
      await studentProfile.populate('user', '-password');
      await studentProfile.populate('class');
      res.status(201).json(studentProfile);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  async updateStudentProfile(req, res) {
    try {
      const studentProfile = await StudentProfile.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      )
        .populate('user', '-password')
        .populate('class');
      if (!studentProfile) {
        return res.status(404).json({ message: 'Student profile not found' });
      }
      res.json(studentProfile);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  async deleteStudentProfile(req, res) {
    try {
      const studentProfile = await StudentProfile.findByIdAndDelete(req.params.id);
      if (!studentProfile) {
        return res.status(404).json({ message: 'Student profile not found' });
      }
      res.json({ message: 'Student profile deleted successfully' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async setClassMonitor(req, res) {
    try {
      const studentProfile = await StudentProfile.findByIdAndUpdate(
        req.params.id,
        { isClassMonitor: true },
        { new: true }
      )
        .populate('user', '-password')
        .populate('class');
      if (!studentProfile) {
        return res.status(404).json({ message: 'Student profile not found' });
      }
      res.json(studentProfile);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  async removeClassMonitor(req, res) {
    try {
      const studentProfile = await StudentProfile.findByIdAndUpdate(
        req.params.id,
        { isClassMonitor: false },
        { new: true }
      )
        .populate('user', '-password')
        .populate('class');
      if (!studentProfile) {
        return res.status(404).json({ message: 'Student profile not found' });
      }
      res.json(studentProfile);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  async getStudentsByClass(req, res) {
    try {
      const students = await StudentProfile.find({ class: req.params.classId })
        .populate('user', '-password')
        .populate('class');
      res.json(students);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
};


