// Controller cho minh chứng hoạt động ngoài trường
const Evidence = require('../models/evidence.model');
const StudentProfile = require('../models/student_profile.model');

module.exports = {
  async getAllEvidences(req, res) {
    try {
      const evidences = await Evidence.find()
        .populate('student_id')
        .sort({ submitted_at: -1 });
      res.json({ success: true, data: evidences });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getEvidencesByFaculty(req, res) {
    try {
      const { facultyId } = req.params;
      if (!facultyId) {
        return res.status(400).json({ success: false, message: 'facultyId is required' });
      }

      // Get all classes in this faculty
      const Class = require('../models/class.model');
      const classesInFaculty = await Class.find({ falcuty_id: facultyId }).select('_id');
      const classIds = classesInFaculty.map((c) => c._id);

      if (classIds.length === 0) {
        return res.json({ success: true, data: [] });
      }

      // Get all students in classes of this faculty
      const studentsInFaculty = await StudentProfile.find({ 
        class_id: { $in: classIds } 
      }).select('_id');
      const studentIds = studentsInFaculty.map((s) => s._id);

      if (studentIds.length === 0) {
        return res.json({ success: true, data: [] });
      }

      // Get evidences for all students in this faculty
      const evidences = await Evidence.find({ student_id: { $in: studentIds } })
        .populate({
          path: 'student_id',
          populate: {
            path: 'class_id',
            select: '_id name',
            populate: {
              path: 'falcuty_id',
              select: '_id name'
            }
          }
        })
        .sort({ submitted_at: -1 });

      res.json({ success: true, data: evidences });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getEvidencesByClass(req, res) {
    try {
      const { classId } = req.params;
      if (!classId) {
        return res.status(400).json({ success: false, message: 'classId is required' });
      }

      const studentsInClass = await StudentProfile.find({ class_id: classId }).select('_id');
      const studentIds = studentsInClass.map((s) => s._id);

      if (studentIds.length === 0) {
        return res.json({ success: true, data: [] });
      }

      const evidences = await Evidence.find({ student_id: { $in: studentIds } })
        .populate('student_id')
        .sort({ submitted_at: -1 });

      res.json({ success: true, data: evidences });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getEvidenceById(req, res) {
    try {
      const evidence = await Evidence.findById(req.params.id)
        .populate('student_id');
      if (!evidence) return res.status(404).json({ success: false, message: 'Evidence not found' });
      res.json({ success: true, data: evidence });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getEvidencesByStudent(req, res) {
    try {
      const evidences = await Evidence.find({ student_id: req.params.studentId })
        .populate('student_id')
        .sort({ submitted_at: -1 });
      res.json({ success: true, data: evidences });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async createEvidence(req, res) {
    try {
      const { student_id, title, file_url, self_point, class_point, faculty_point } = req.body;
      
      // Ensure _id is not passed from request (should be auto-generated)
      if (req.body._id) {
        delete req.body._id;
      }
      
      // Validate required fields
      if (!student_id || !title) {
        return res.status(400).json({ 
          success: false, 
          message: 'Student ID and title are required' 
        });
      }

      const evidence = new Evidence({
        student_id,
        title,
        file_url,
        self_point: self_point || 0,
        class_point: class_point || 0,
        faculty_point: faculty_point || 0,
        submitted_at: new Date(),
        status: 'pending'
      });
      
      await evidence.save();
      await evidence.populate('student_id');

      // Send notification to staff of the same faculty when new evidence is submitted
      try {
        const Notification = require('../models/notification.model');
        const StaffProfile = require('../models/staff_profile.model');
        
        // Validate student exists and get their class/faculty
        const student = await StudentProfile.findById(student_id)
          .populate({ path: 'class_id', select: 'falcuty_id' });
        
        if (!student) {
          console.error(`Student profile not found for student_id: ${student_id}`);
          return res.status(400).json({ success: false, message: 'Student not found' });
        }

        // Get faculty_id from student's class
        const facultyId = student.class_id?.falcuty_id;
        if (!facultyId) {
          console.error(`Faculty not found for student ${student_id}`);
          // Continue without sending notification if faculty not found
          res.status(201).json({ 
            success: true, 
            data: evidence,
            warning: 'Notification not sent: Faculty information not found'
          });
          return;
        }

        // Find all staff members of the same faculty
        const staffMembers = await StaffProfile.find({ faculty_id: facultyId })
          .select('user_id')
          .lean();

        if (staffMembers.length === 0) {
          console.warn(`No staff members found for faculty: ${facultyId}`);
          res.status(201).json({ 
            success: true, 
            data: evidence,
            warning: 'Notification not sent: No staff members in this faculty'
          });
          return;
        }

        // Get all user IDs from staff profiles
        const userIds = staffMembers
          .map(s => s.user_id)
          .filter(uid => uid !== null && uid !== undefined);

        if (userIds.length === 0) {
          console.warn(`No valid user IDs found for staff in faculty: ${facultyId}`);
          res.status(201).json({ 
            success: true, 
            data: evidence,
            warning: 'Notification not sent: No valid user accounts for staff'
          });
          return;
        }

        // Create notification for all staff of the same faculty
        const studentInfo = evidence.student_id;
        const notificationTitle = `Minh chứng mới cần duyệt`;
        const notificationContent = `Sinh viên ${studentInfo.full_name || studentInfo.student_number} (lớp: ${student.class_id?.name || 'N/A'}) đã nộp minh chứng: "${title}"`;

        await Notification.create({
          title: notificationTitle,
          content: notificationContent,
          published_date: new Date(),
          notification_type: 'activity',
          icon_type: 'document',
          target_audience: 'specific',
          target_user_ids: userIds,
          created_by: req.user?.id || null
        });

        console.log(`Notification created for ${userIds.length} staff members in faculty ${facultyId} about new evidence submission`);
        res.status(201).json({ success: true, data: evidence });
      } catch (notifErr) {
        console.error('Error creating evidence submission notification:', notifErr);
        // Don't fail the submission if notification fails
        res.status(201).json({ 
          success: true, 
          data: evidence,
          warning: 'Evidence submitted but notification failed: ' + notifErr.message
        });
      }
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async updateEvidence(req, res) {
    try {
      // Ensure _id is not passed from request (should be auto-generated)
      if (req.body._id) {
        delete req.body._id;
      }
      
      const evidence = await Evidence.findByIdAndUpdate(
        req.params.id, 
        req.body, 
        { new: true, runValidators: true }
      )
        .populate('student_id');
      
      if (!evidence) return res.status(404).json({ success: false, message: 'Evidence not found' });
      res.json({ success: true, data: evidence });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async approveEvidence(req, res) {
    try {
      const evidence = await Evidence.findById(req.params.id)
        .populate('student_id');
      
      if (!evidence) return res.status(404).json({ success: false, message: 'Evidence not found' });

      const updateData = { 
        status: 'approved', 
        verified_at: new Date() 
      };

      // Add optional faculty_point if provided
      if (req.body.faculty_point !== undefined) {
        updateData.faculty_point = req.body.faculty_point;
      }

      const updatedEvidence = await Evidence.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      )
        .populate('student_id');
      
      // Send notification to student when evidence is approved
      try {
        const Notification = require('../models/notification.model');
        
        // Get student profile to find user_id
        const studentProfile = await StudentProfile.findById(evidence.student_id._id)
          .select('user_id');

        // Validate student profile exists and has user_id
        if (!studentProfile) {
          console.error(`Student profile not found for student_id: ${evidence.student_id._id}`);
          res.json({ 
            success: true, 
            data: updatedEvidence,
            warning: 'Evidence approved but notification not sent: Student profile not found'
          });
          return;
        }

        if (!studentProfile.user_id) {
          console.error(`User ID not found for student: ${evidence.student_id._id}`);
          res.json({ 
            success: true, 
            data: updatedEvidence,
            warning: 'Evidence approved but notification not sent: User account not found'
          });
          return;
        }

        // Calculate total points
        const totalPoints = updateData.faculty_point !== undefined 
          ? updateData.faculty_point 
          : (evidence.faculty_point || 0);

        const notificationTitle = `Minh chứng "${evidence.title}" đã được phê duyệt`;
        const notificationContent = `Minh chứng "${evidence.title}" của bạn đã được phê duyệt. Bạn nhận được ${totalPoints} điểm.`;

        await Notification.create({
          title: notificationTitle,
          content: notificationContent,
          published_date: new Date(),
          notification_type: 'score_update',
          icon_type: 'check_circle',
          target_audience: 'specific',
          target_user_ids: [studentProfile.user_id],
          created_by: req.user?.id || null
        });

        console.log(`Notification created for student ${studentProfile.user_id} about approved evidence`);
        res.json({ success: true, data: updatedEvidence });
      } catch (notifErr) {
        console.error('Error creating evidence approval notification:', notifErr);
        // Don't fail the approval if notification fails
        res.json({ 
          success: true, 
          data: updatedEvidence,
          warning: 'Evidence approved but notification failed: ' + notifErr.message
        });
      }
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async rejectEvidence(req, res) {
    try {
      const evidence = await Evidence.findById(req.params.id)
        .populate('student_id');
      
      if (!evidence) return res.status(404).json({ success: false, message: 'Evidence not found' });

      const updatedEvidence = await Evidence.findByIdAndUpdate(
        req.params.id,
        { 
          status: 'rejected', 
          verified_at: new Date() 
        },
        { new: true }
      )
        .populate('student_id');
      
      // Send notification to student when evidence is rejected
      try {
        const Notification = require('../models/notification.model');
        
        // Get student profile to find user_id
        const studentProfile = await StudentProfile.findById(evidence.student_id._id)
          .select('user_id');

        // Validate student profile exists and has user_id
        if (!studentProfile) {
          console.error(`Student profile not found for student_id: ${evidence.student_id._id}`);
          res.json({ 
            success: true, 
            data: updatedEvidence,
            warning: 'Evidence rejected but notification not sent: Student profile not found'
          });
          return;
        }

        if (!studentProfile.user_id) {
          console.error(`User ID not found for student: ${evidence.student_id._id}`);
          res.json({ 
            success: true, 
            data: updatedEvidence,
            warning: 'Evidence rejected but notification not sent: User account not found'
          });
          return;
        }

        // Get rejection reason from request body
        const rejectReason = req.body.reason || 'Minh chứng không đủ điều kiện';
        
        const notificationTitle = `Minh chứng "${evidence.title}" bị từ chối`;
        const notificationContent = `Minh chứng "${evidence.title}" của bạn bị từ chối. Lý do: ${rejectReason}`;

        await Notification.create({
          title: notificationTitle,
          content: notificationContent,
          published_date: new Date(),
          notification_type: 'activity',
          icon_type: 'cancel',
          target_audience: 'specific',
          target_user_ids: [studentProfile.user_id],
          created_by: req.user?.id || null
        });

        console.log(`Notification created for student ${studentProfile.user_id} about rejected evidence`);
        res.json({ success: true, data: updatedEvidence });
      } catch (notifErr) {
        console.error('Error creating evidence rejection notification:', notifErr);
        // Don't fail the rejection if notification fails
        res.json({ 
          success: true, 
          data: updatedEvidence,
          warning: 'Evidence rejected but notification failed: ' + notifErr.message
        });
      }
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async deleteEvidence(req, res) {
    try {
      const evidence = await Evidence.findByIdAndDelete(req.params.id);
      if (!evidence) return res.status(404).json({ success: false, message: 'Evidence not found' });
      res.json({ success: true, message: 'Evidence deleted successfully' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getEvidencesByStatus(req, res) {
    try {
      const { status } = req.params;
      const evidences = await Evidence.find({ status })
        .populate('student_id')
        .sort({ submitted_at: -1 });
      res.json({ success: true, data: evidences });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Get approved evidences for student score results page
  async getApprovedEvidencesForStudent(req, res) {
    try {
      const { studentId } = req.params;
      const userId = req.user._id; // From auth middleware (user object)
      
      // Validate studentId parameter
      if (!studentId || studentId.trim() === '') {
        return res.status(400).json({ 
          success: false, 
          message: 'studentId is required and cannot be empty' 
        });
      }

      // Validate MongoDB ObjectId format
      const mongoose = require('mongoose');
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid studentId format' 
        });
      }

      // Permission check: Student can only view their own approved evidences
      // Staff/Teacher/Admin can view any student's approved evidences
      const StudentProfileModel = require('../models/student_profile.model');
      const student = await StudentProfileModel.findById(studentId).select('user_id');
      
      if (!student) {
        return res.status(404).json({ 
          success: false, 
          message: 'Student not found' 
        });
      }

      // Check if user is the student or has staff/teacher/admin role
      const User = require('../models/user.model');
      const currentUser = await User.findById(userId).select('role');
      
      if (!currentUser) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      // Allow access if user is student or has staff/admin role
      const isOwnStudent = student.user_id.toString() === userId.toString();
      const allowedRoles = ['admin', 'staff'];
      const hasPermission = isOwnStudent || allowedRoles.includes(currentUser.role);

      if (!hasPermission) {
        return res.status(403).json({ 
          success: false, 
          message: 'You do not have permission to view this student\'s evidence' 
        });
      }

      // Get approved evidences for student
      const approvedEvidences = await Evidence.find({
        student_id: studentId,
        status: 'approved'
      })
        .populate({
          path: 'student_id',
          select: 'student_number full_name email class_id',
          populate: {
            path: 'user_id',
            select: 'email'
          }
        })
        .populate({
          path: 'activity_id',
          select: 'title field_id org_unit_id max_points',
          populate: [
            {
              path: 'field_id',
              select: 'name'
            },
            {
              path: 'org_unit_id',
              select: 'name'
            }
          ]
        })
        .populate({
          path: 'approved_by',
          select: 'email first_name last_name'
        })
        .sort({ verified_at: -1 });

      // Calculate total points from approved evidences
      const totalPoints = approvedEvidences.reduce((sum, evidence) => {
        return sum + (evidence.faculty_point || 0);
      }, 0);

      res.json({
        success: true,
        data: {
          student_id: studentId,
          total_approved_evidences: approvedEvidences.length,
          total_points: totalPoints,
          evidences: approvedEvidences
        }
      });
    } catch (err) {
      console.error('Error getting approved evidences:', err);
      res.status(500).json({ 
        success: false, 
        message: err.message 
      });
    }
  },

  // Get approved evidences for current authenticated student
  async getMyApprovedEvidences(req, res) {
    try {
      const userId = req.user._id; // From auth middleware (user object)
      
      // Validate userId
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not authenticated' 
        });
      }

      // Validate MongoDB ObjectId format
      const mongoose = require('mongoose');
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid user ID format' 
        });
      }

      // Find student profile for current user
      const StudentProfileModel = require('../models/student_profile.model');
      const student = await StudentProfileModel.findOne({ user_id: userId });
      
      if (!student) {
        return res.status(404).json({ 
          success: false, 
          message: 'Student profile not found' 
        });
      }

      // Get approved evidences for current student
      const approvedEvidences = await Evidence.find({
        student_id: student._id,
        status: 'approved'
      })
        .populate({
          path: 'student_id',
          select: 'student_number full_name email class_id',
          populate: {
            path: 'user_id',
            select: 'email'
          }
        })
        .populate({
          path: 'activity_id',
          select: 'title field_id org_unit_id max_points',
          populate: [
            {
              path: 'field_id',
              select: 'name'
            },
            {
              path: 'org_unit_id',
              select: 'name'
            }
          ]
        })
        .populate({
          path: 'approved_by',
          select: 'email first_name last_name'
        })
        .sort({ verified_at: -1 });

      // Calculate total points from approved evidences
      const totalPoints = approvedEvidences.reduce((sum, evidence) => {
        return sum + (evidence.faculty_point || 0);
      }, 0);

      res.json({
        success: true,
        data: {
          student_id: student._id,
          student_number: student.student_number,
          total_approved_evidences: approvedEvidences.length,
          total_points: totalPoints,
          evidences: approvedEvidences
        }
      });
    } catch (err) {
      console.error('Error getting my approved evidences:', err);
      res.status(500).json({ 
        success: false, 
        message: err.message 
      });
    }
  }
};
