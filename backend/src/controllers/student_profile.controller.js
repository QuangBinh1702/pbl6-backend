// Quản lý hồ sơ sinh viên
const mongoose = require('mongoose');
const StudentProfile = require('../models/student_profile.model');
const User = require('../models/user.model');
const Class = require('../models/class.model');

module.exports = {
  async getAllStudentProfiles(req, res) {
    try {
      const { class_id, student_number, faculty_id } = req.query;
      const filter = {};
      
      // Filter by student_number (partial match)
      if (student_number) {
        filter.student_number = { $regex: student_number, $options: 'i' };
      }
      
      // Filter by faculty_id and/or class_id
      // Process faculty_id first to get list of classes
      if (faculty_id) {
        try {
          // First get all classes from this faculty
          const classesInFaculty = await Class.find({ falcuty_id: faculty_id }).select('_id');
          const classIds = classesInFaculty.map(c => c._id.toString());
          
          if (classIds.length > 0) {
            // If class_id is also specified, verify it belongs to this faculty
            if (class_id) {
              // Convert class_id to string for comparison
              const classIdStr = class_id.toString();
              // Check if the selected class belongs to the selected faculty
              if (classIds.includes(classIdStr)) {
                // Both filters match: use the specific class_id
                filter.class_id = class_id;
              } else {
                // Class doesn't belong to this faculty - no results
                return res.json({ success: true, data: [], count: 0 });
              }
            } else {
              // Only faculty filter: class must be in faculty
              // Convert ObjectIds to strings for $in query
              filter.class_id = { $in: classIds.map(id => new mongoose.Types.ObjectId(id)) };
            }
          } else {
            // No classes in this faculty
            return res.json({ success: true, data: [], count: 0 });
          }
        } catch (err) {
          console.error('Error getting classes by faculty:', err);
          return res.json({ success: true, data: [], count: 0 });
        }
      } else if (class_id) {
        // Only class_id filter (no faculty_id)
        filter.class_id = class_id;
      }
      
      const studentProfiles = await StudentProfile.find(filter)
        .populate('user_id', 'username email')
        .populate({ path: 'class_id', populate: [ { path: 'falcuty_id' }, { path: 'cohort_id' } ] })
        .sort({ student_number: 1 })
        .lean();

      const data = studentProfiles.map(sp => ({
        ...sp,
        falcuty_name: sp.class_id?.falcuty_id?.name || '-',
        class_name: sp.class_id?.name || '-',
        cohort_year: sp.class_id?.cohort_id?.year
      }));
      
      res.json({ success: true, data, count: data.length });
    } catch (err) {
      console.error('Get all student profiles error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getStudentProfileById(req, res) {
    try {
      const studentProfile = await StudentProfile.findById(req.params.id)
        .populate('user_id')
        .populate({ path: 'class_id', populate: [ { path: 'falcuty_id' }, { path: 'cohort_id' } ] })
        .lean();
      
      if (!studentProfile) {
        return res.status(404).json({ 
          success: false, 
          message: 'Student profile not found' 
        });
      }
      
      res.json({ 
        success: true, 
        data: {
          ...studentProfile,
          falcuty_name: studentProfile.class_id?.falcuty_id?.name,
          cohort_year: studentProfile.class_id?.cohort_id?.year
        }
      });
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
        .populate({ path: 'class_id', populate: [ { path: 'falcuty_id' }, { path: 'cohort_id' } ] })
        .lean();
      
      if (!studentProfile) {
        return res.status(404).json({ 
          success: false, 
          message: 'Student profile not found' 
        });
      }
      
      res.json({ success: true, data: {
        ...studentProfile,
        falcuty_name: studentProfile.class_id?.falcuty_id?.name,
        cohort_year: studentProfile.class_id?.cohort_id?.year
      } });
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
        .populate({ path: 'class_id', populate: [ { path: 'falcuty_id' }, { path: 'cohort_id' } ] })
        .lean();
      
      if (!studentProfile) {
        return res.status(404).json({ 
          success: false, 
          message: 'Student profile not found' 
        });
      }
      
      res.json({ success: true, data: {
        ...studentProfile,
        falcuty_name: studentProfile.class_id?.falcuty_id?.name,
        cohort_year: studentProfile.class_id?.cohort_id?.year
      } });
    } catch (err) {
      console.error('Get student profile by student number error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getStudentProfileByUsername(req, res) {
    try {
      // First, find the user by username
      const user = await User.findOne({ username: req.params.username });
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      
      // Then find the student profile by user_id
      const studentProfile = await StudentProfile.findOne({ 
        user_id: user._id 
      })
        .populate('user_id')
        .populate({ path: 'class_id', populate: [ { path: 'falcuty_id' }, { path: 'cohort_id' } ] })
        .lean();
      
      if (!studentProfile) {
        return res.status(404).json({ 
          success: false, 
          message: 'Student profile not found for this user' 
        });
      }
      
      res.json({ success: true, data: {
        ...studentProfile,
        falcuty_name: studentProfile.class_id?.falcuty_id?.name,
        cohort_year: studentProfile.class_id?.cohort_id?.year
      } });
    } catch (err) {
      console.error('Get student profile by username error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getStudentsByClass(req, res) {
    try {
      const studentProfiles = await StudentProfile.find({ 
        class_id: req.params.classId 
      })
        .populate('user_id')
        .populate({ path: 'class_id', populate: [ { path: 'falcuty_id' }, { path: 'cohort_id' } ] })
        .lean();
      
      const data2 = studentProfiles.map(sp => ({
        ...sp,
        falcuty_name: sp.class_id?.falcuty_id?.name,
        cohort_year: sp.class_id?.cohort_id?.year
      }));
      
      res.json({ success: true, data: data2 });
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

      // Kiểm tra user_id có thực sự tồn tại trong bảng user không
      const userExists = await User.findById(user_id);
      if (!userExists) {
        return res.status(400).json({
          success: false,
          message: 'User not found with given user_id'
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
      
      // Xử lý file upload (student_image)
      let studentImageUrl = student_image; // Giữ nguyên ảnh nếu không upload mới
      
      if (req.file) {
        // Sử dụng Cloudinary URL nếu có, nếu không dùng local URL
        const { getFileUrl } = require('../utils/cloudinary.util');
        studentImageUrl = getFileUrl(req.file, req);
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
        student_image: studentImageUrl,
        contact_address,
        isClassMonitor: isClassMonitor || false
      });
      
      await studentProfile.populate('user_id');
      await studentProfile.populate({ path: 'class_id', populate: [ { path: 'falcuty_id' }, { path: 'cohort_id' } ] });
      const spLean = studentProfile.toObject();
      
      res.status(201).json({ success: true, data: {
        ...spLean,
        falcuty_name: spLean.class_id?.falcuty_id?.name,
        cohort_year: spLean.class_id?.cohort_id?.year
      } });
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
      
      // Xử lý file upload (student_image)
      if (req.file) {
        // Sử dụng Cloudinary URL nếu có, nếu không dùng local URL
        const { getFileUrl } = require('../utils/cloudinary.util');
        updates.student_image = getFileUrl(req.file, req);
      }
      // Nếu không có file upload mới, giữ nguyên giá trị từ body (nếu có)
      
      const studentProfile = await StudentProfile.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true, runValidators: true }
      )
        .populate('user_id')
        .populate({ path: 'class_id', populate: [ { path: 'falcuty_id' }, { path: 'cohort_id' } ] })
        .lean();
      
      if (!studentProfile) {
        return res.status(404).json({ 
          success: false, 
          message: 'Student profile not found' 
        });
      }
      
      res.json({ success: true, data: {
        ...studentProfile,
        falcuty_name: studentProfile.class_id?.falcuty_id?.name,
        cohort_year: studentProfile.class_id?.cohort_id?.year
      } });
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
        .populate({ path: 'class_id', populate: [ { path: 'falcuty_id' }, { path: 'cohort_id' } ] });
      
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
      await studentProfile.populate({ path: 'class_id', populate: [ { path: 'falcuty_id' }, { path: 'cohort_id' } ] });
      const spMon = studentProfile.toObject();
      
      res.json({ 
        success: true, 
        data: {
          ...spMon,
          falcuty_name: spMon.class_id?.falcuty_id?.name,
          cohort_year: spMon.class_id?.cohort_id?.year
        },
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
        .populate({ path: 'class_id', populate: [ { path: 'falcuty_id' }, { path: 'cohort_id' } ] })
        .lean();
      
      if (!studentProfile) {
        return res.status(404).json({ 
          success: false, 
          message: 'Student profile not found' 
        });
      }
      
      res.json({ 
        success: true, 
        data: {
          ...studentProfile,
          falcuty_name: studentProfile.class_id?.falcuty_id?.name,
          cohort_year: studentProfile.class_id?.cohort_id?.year
        },
        message: 'Class monitor status removed successfully' 
      });
    } catch (err) {
      console.error('Unset class monitor error:', err);
      res.status(400).json({ success: false, message: err.message });
    }
  },

  // Toggle class monitor status with body (similar to approve activity)
  async toggleClassMonitor(req, res) {
    try {
      const studentProfile = await StudentProfile.findById(req.params.id)
        .populate({ path: 'class_id', populate: [ { path: 'falcuty_id' }, { path: 'cohort_id' } ] });
      
      if (!studentProfile) {
        return res.status(404).json({ 
          success: false, 
          message: 'Student profile not found' 
        });
      }
      
      // Get isClassMonitor from body (default: toggle current value)
      let newStatus;
      if (req.body.hasOwnProperty('isClassMonitor')) {
        newStatus = req.body.isClassMonitor;
      } else {
        // Default: toggle current value
        newStatus = !studentProfile.isClassMonitor;
      }
      
      // If setting to true, remove existing class monitor in the same class
      if (newStatus === true && studentProfile.class_id) {
        await StudentProfile.updateMany(
          { 
            class_id: studentProfile.class_id._id,
            isClassMonitor: true,
            _id: { $ne: studentProfile._id } // Exclude current student
          },
          { isClassMonitor: false }
        );
      }
      
      // Set new status
      studentProfile.isClassMonitor = newStatus;
      await studentProfile.save();
      
      await studentProfile.populate('user_id');
      await studentProfile.populate({ path: 'class_id', populate: [ { path: 'falcuty_id' }, { path: 'cohort_id' } ] });
      const spMon = studentProfile.toObject();
      
      res.json({ 
        success: true, 
        data: {
          ...spMon,
          falcuty_name: spMon.class_id?.falcuty_id?.name,
          cohort_year: spMon.class_id?.cohort_id?.year
        },
        message: newStatus 
          ? 'Class monitor set successfully' 
          : 'Class monitor status removed successfully'
      });
    } catch (err) {
      console.error('Toggle class monitor error:', err);
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async getClassMonitors(req, res) {
    try {
      const classMonitors = await StudentProfile.find({ 
        isClassMonitor: true 
      })
        .populate('user_id')
        .populate({ path: 'class_id', populate: [ { path: 'falcuty_id' }, { path: 'cohort_id' } ] })
        .lean();
      
      const data3 = classMonitors.map(sp => ({
        ...sp,
        falcuty_name: sp.class_id?.falcuty_id?.name,
        cohort_year: sp.class_id?.cohort_id?.year
      }));
      
      res.json({ success: true, data: data3 });
    } catch (err) {
      console.error('Get class monitors error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
