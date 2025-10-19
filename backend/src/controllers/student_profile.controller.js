// Quản lý hồ sơ sinh viên
const StudentProfile = require('../models/student_profile.model');
const User = require('../models/user.model');
const Class = require('../models/class.model');

module.exports = {
  async getAllStudentProfiles(req, res) {
    try {
      const { class_id, isClassMonitor } = req.query;
      const filter = {};
      
      if (class_id) filter.class_id = class_id;
      if (isClassMonitor !== undefined) filter.isClassMonitor = isClassMonitor === 'true';
      
      const studentProfiles = await StudentProfile.find(filter)
        .populate('user_id')
        .populate('class_id');
      
      res.json({ success: true, data: studentProfiles });
    } catch (err) {
      console.error('Get all student profiles error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getStudentProfileById(req, res) {
    try {
      const studentProfile = await StudentProfile.findById(req.params.id)
        .populate('user_id')
        .populate('class_id');
      
      if (!studentProfile) {
        return res.status(404).json({ 
          success: false, 
          message: 'Student profile not found' 
        });
      }
      
      res.json({ success: true, data: studentProfile });
    } catch (err) {
      console.error('Get student profile by ID error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getStudentProfileByUserId(req, res) {
    try {
      const studentProfile = await StudentProfile.findOne({ 
        user_id: req.params.userId 
      })
        .populate('user_id')
        .populate('class_id');
      
      if (!studentProfile) {
        return res.status(404).json({ 
          success: false, 
          message: 'Student profile not found' 
        });
      }
      
      res.json({ success: true, data: studentProfile });
    } catch (err) {
      console.error('Get student profile by user ID error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getStudentProfileByStudentNumber(req, res) {
    try {
      const studentProfile = await StudentProfile.findOne({ 
        student_number: req.params.studentNumber 
      })
        .populate('user_id')
        .populate('class_id');
      
      if (!studentProfile) {
        return res.status(404).json({ 
          success: false, 
          message: 'Student profile not found' 
        });
      }
      
      res.json({ success: true, data: studentProfile });
    } catch (err) {
      console.error('Get student profile by student number error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getStudentsByClass(req, res) {
    try {
      const studentProfiles = await StudentProfile.find({ 
        class_id: req.params.classId 
      })
        .populate('user_id')
        .populate('class_id');
      
      res.json({ success: true, data: studentProfiles });
    } catch (err) {
      console.error('Get students by class error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async createStudentProfile(req, res) {
    try {
      const {
        user_id,
        student_number,
        full_name,
        date_of_birth,
        gender,
        email,
        phone,
        enrollment_year,
        class_id,
        student_image,
        contact_address,
        isClassMonitor
      } = req.body;
      
      // Validate required fields
      if (!user_id || !student_number) {
        return res.status(400).json({ 
          success: false, 
          message: 'user_id and student_number are required' 
        });
      }
      
      // Check if student profile already exists
      const existingProfile = await StudentProfile.findOne({ 
        $or: [{ user_id }, { student_number }] 
      });
      
      if (existingProfile) {
        return res.status(400).json({ 
          success: false, 
          message: 'Student profile already exists for this user or student number' 
        });
      }
      
      const studentProfile = await StudentProfile.create({
        user_id,
        student_number,
        full_name,
        date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
        gender,
        email,
        phone,
        enrollment_year,
        class_id,
        student_image,
        contact_address,
        isClassMonitor: isClassMonitor || false
      });
      
      await studentProfile.populate('user_id');
      await studentProfile.populate('class_id');
      
      res.status(201).json({ success: true, data: studentProfile });
    } catch (err) {
      console.error('Create student profile error:', err);
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async updateStudentProfile(req, res) {
    try {
      const updates = { ...req.body };
      
      // Convert date if provided
      if (updates.date_of_birth) {
        updates.date_of_birth = new Date(updates.date_of_birth);
      }
      
      const studentProfile = await StudentProfile.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true, runValidators: true }
      )
        .populate('user_id')
        .populate('class_id');
      
      if (!studentProfile) {
        return res.status(404).json({ 
          success: false, 
          message: 'Student profile not found' 
        });
      }
      
      res.json({ success: true, data: studentProfile });
    } catch (err) {
      console.error('Update student profile error:', err);
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async deleteStudentProfile(req, res) {
    try {
      const studentProfile = await StudentProfile.findByIdAndDelete(req.params.id);
      
      if (!studentProfile) {
        return res.status(404).json({ 
          success: false, 
          message: 'Student profile not found' 
        });
      }
      
      res.json({ success: true, message: 'Student profile deleted successfully' });
    } catch (err) {
      console.error('Delete student profile error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Class Monitor endpoints
  async setClassMonitor(req, res) {
    try {
      const studentProfile = await StudentProfile.findById(req.params.id)
        .populate('class_id');
      
      if (!studentProfile) {
        return res.status(404).json({ 
          success: false, 
          message: 'Student profile not found' 
        });
      }
      
      // Remove existing class monitor in the same class
      if (studentProfile.class_id) {
        await StudentProfile.updateMany(
          { 
            class_id: studentProfile.class_id._id,
            isClassMonitor: true 
          },
          { isClassMonitor: false }
        );
      }
      
      // Set new class monitor
      studentProfile.isClassMonitor = true;
      await studentProfile.save();
      
      await studentProfile.populate('user_id');
      await studentProfile.populate('class_id');
      
      res.json({ 
        success: true, 
        data: studentProfile,
        message: 'Class monitor set successfully' 
      });
    } catch (err) {
      console.error('Set class monitor error:', err);
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async unsetClassMonitor(req, res) {
    try {
      const studentProfile = await StudentProfile.findByIdAndUpdate(
        req.params.id,
        { isClassMonitor: false },
        { new: true }
      )
        .populate('user_id')
        .populate('class_id');
      
      if (!studentProfile) {
        return res.status(404).json({ 
          success: false, 
          message: 'Student profile not found' 
        });
      }
      
      res.json({ 
        success: true, 
        data: studentProfile,
        message: 'Class monitor status removed successfully' 
      });
    } catch (err) {
      console.error('Unset class monitor error:', err);
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async getClassMonitors(req, res) {
    try {
      const classMonitors = await StudentProfile.find({ 
        isClassMonitor: true 
      })
        .populate('user_id')
        .populate('class_id');
      
      res.json({ success: true, data: classMonitors });
    } catch (err) {
      console.error('Get class monitors error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
