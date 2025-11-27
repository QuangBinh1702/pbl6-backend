// Quản lý điểm danh
const Attendance = require('../models/attendance.model');
const Activity = require('../models/activity.model');
const StudentProfile = require('../models/student_profile.model');
const Notification = require('../models/notification.model');
const ActivityRegistration = require('../models/activity_registration.model');
const AttendanceSession = require('../models/attendance_session.model');
const registrationController = require('./registration.controller');
const QRCode = require('qrcode');
const attendanceCalculator = require('../utils/attendance_calculator');

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
      
      // Tự động cập nhật registration status thành "attended"
      const registration = await ActivityRegistration.findOne({
        student_id: req.body.student_id,
        activity_id: req.body.activity_id,
        status: "approved"
      });

      if (registration) {
        await registrationController.markAsAttended(registration._id, attendance._id);
      }
      
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
      
      if (!feedback) {
        return res.status(400).json({ success: false, message: 'Feedback không được để trống' });
      }

      const attendance = await Attendance.findByIdAndUpdate(
        req.params.id,
        { 
          feedback,
          feedback_time: new Date(),
          feedback_status: 'pending'
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
      res.json({ success: true, message: 'Phản hồi đã được gửi, chờ duyệt', data: attendance });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  // API sinh viên gửi phản hồi về điểm
  async submitFeedback(req, res) {
    try {
      const { feedback } = req.body;
      const { attendanceId } = req.params;
      const student_id = req.user._id;

      if (!feedback || feedback.trim() === '') {
        return res.status(400).json({ success: false, message: 'Phản hồi không được để trống' });
      }

      // Kiểm tra attendance tồn tại và thuộc về sinh viên
      const attendance = await Attendance.findById(attendanceId).populate('student_id');
      if (!attendance) {
        return res.status(404).json({ success: false, message: 'Bản ghi điểm danh không tồn tại' });
      }

      // So sánh user_id của StudentProfile với req.user._id
      if (attendance.student_id.user_id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền phản hồi bản ghi này' });
      }

      // Cập nhật feedback với trạng thái pending
      attendance.feedback = feedback;
      attendance.feedback_time = new Date();
      attendance.feedback_status = 'pending';
      await attendance.save();

      await attendance.populate({
        path: 'student_id',
        populate: {
          path: 'user_id',
          select: '-password_hash'
        }
      });
      await attendance.populate('activity_id');

      res.json({ success: true, message: 'Phản hồi đã được gửi, chờ duyệt từ staff', data: attendance });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // API staff duyệt phản hồi và sửa điểm
  async approveFeedback(req, res) {
    try {
      const { attendanceId } = req.params;
      const { status, newPoints, rejectionReason } = req.body;
      const staff_id = req.user._id;

      // Validate input
      if (!['accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
      }

      const attendance = await Attendance.findById(attendanceId)
        .populate({
          path: 'student_id',
          populate: {
            path: 'user_id',
            select: '-password_hash'
          }
        })
        .populate('activity_id');

      if (!attendance) {
        return res.status(404).json({ success: false, message: 'Bản ghi điểm danh không tồn tại' });
      }

      if (attendance.feedback_status !== 'pending') {
        return res.status(400).json({ success: false, message: 'Phản hồi này đã được duyệt trước đó' });
      }

      // Cập nhật trạng thái phản hồi
      attendance.feedback_status = status;
      attendance.feedback_verified_at = new Date();

      // Nếu chấp nhận, cập nhật điểm
      if (status === 'accepted' && newPoints !== undefined) {
        attendance.points = newPoints;
      }

      await attendance.save();

      // Gửi thông báo cho sinh viên
      const notificationContent = status === 'accepted' 
        ? `Phản hồi của bạn về điểm hoạt động "${attendance.activity_id.title}" đã được chấp nhận. Điểm được cập nhật: ${newPoints} điểm`
        : `Phản hồi của bạn về điểm hoạt động "${attendance.activity_id.title}" đã bị từ chối. Lý do: ${rejectionReason || 'Không có lý do'}`;

      const notification = new Notification({
        title: status === 'accepted' ? 'Phản hồi được chấp nhận' : 'Phản hồi bị từ chối',
        content: notificationContent,
        notification_type: 'score_update',
        target_audience: 'specific',
        target_user_ids: [attendance.student_id.user_id],
        created_by: staff_id
      });

      await notification.save();

      res.json({ 
        success: true, 
        message: `Phản hồi đã được ${status === 'accepted' ? 'chấp nhận' : 'từ chối'}`, 
        data: attendance 
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Lấy danh sách phản hồi chờ duyệt theo khoa
  async getPendingFeedbacksByFaculty(req, res) {
    try {
      const { facultyId } = req.params;

      // Lấy danh sách sinh viên thuộc khoa (phải populate class_id -> falcuty_id)
      const allStudents = await StudentProfile.find().populate({
        path: 'class_id',
        populate: {
          path: 'falcuty_id'  // Note: typo in model - falcuty not faculty
        }
      });
      
      const filteredStudents = allStudents.filter(p => {
        return p.class_id && p.class_id.falcuty_id && p.class_id.falcuty_id._id.toString() === facultyId;
      });
      
      const studentIds = filteredStudents.map(s => s._id);

      if (studentIds.length === 0) {
        return res.json({ success: true, data: [], count: 0 });
      }

      // Lấy danh sách phản hồi chờ duyệt của sinh viên thuộc khoa
      const result = await Attendance.find({
        student_id: { $in: studentIds },
        feedback_status: 'pending'
      })
        .populate({
          path: 'student_id',
          populate: {
            path: 'user_id',
            select: '-password_hash'
          }
        })
        .populate('activity_id')
        .sort({ feedback_time: -1 });

      res.json({ success: true, data: result, count: result.length });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getAttendanceByStudentAndActivity(req, res) {
    try {
      const { studentId, activityId } = req.params;
      
      const attendance = await Attendance.findOne({
        student_id: studentId.trim(),
        activity_id: activityId.trim()
      })
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

  async getAttendedActivitiesByStudent(req, res) {
    try {
      const { studentId } = req.params;
      const attendances = await Attendance.find({ student_id: studentId })
        .populate({
          path: 'activity_id',
          populate: [
            { path: 'org_unit_id' },
            { path: 'field_id' }
          ]
        })
        .sort({ scanned_at: -1 });

      // Deduplicate by activity_id and include points
      const activitiesMap = new Map();
      attendances.forEach(att => {
        if (att.activity_id) {
          const key = att.activity_id._id.toString();
          if (!activitiesMap.has(key)) {
            const act = att.activity_id.toObject();
            // Add attendance points and id to activity object
            act.points = att.points || 0;
            act.attendance_id = att._id;
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

  // Lấy danh sách sinh viên tham gia theo hoạt động (có thống kê: số lần điểm danh, điểm,...)
  async getStudentsWithStatsByActivity(req, res) {
    try {
      const { activityId } = req.params;
      
      // Get activity to get total_sessions_required
      const activity = await Activity.findById(activityId);
      if (!activity) {
        return res.status(404).json({ success: false, message: 'Activity not found' });
      }

      const totalSessionsRequired = activity.total_sessions_required || 1;
      
      // Get all attendance records for the activity
      const attendances = await Attendance.find({ activity_id: activityId })
        .populate({
          path: 'student_id',
          populate: {
            path: 'user_id',
            select: '-password_hash'
          }
        })
        .lean();

      // Group by student and calculate stats
      const studentStatsMap = new Map();
      attendances.forEach(att => {
        if (att.student_id) {
          const key = att.student_id._id.toString();
          
          if (!studentStatsMap.has(key)) {
            studentStatsMap.set(key, {
              student_id: att.student_id._id,
              student: att.student_id,
              attendance_count: 0,
              last_attended: null,
              status: att.status
            });
          }
          
          const stats = studentStatsMap.get(key);
          stats.attendance_count += 1;
          
          // Update last_attended to most recent
          if (!stats.last_attended || new Date(att.scanned_at) > new Date(stats.last_attended)) {
            stats.last_attended = att.scanned_at;
          }
        }
      });

      // Calculate total_points based on attendance rate
      const result = Array.from(studentStatsMap.values()).map(stats => {
        const attendanceRate = stats.attendance_count / totalSessionsRequired;
        const total_points = Math.round(attendanceRate * 10 * 100) / 100; // Làm tròn 2 số thập phân
        return {
          ...stats,
          total_points: total_points,
          attendance_rate: attendanceRate
        };
      });

      res.json({ 
        success: true, 
        data: result, 
        count: result.length 
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async scanQRCode(req, res) {
    try {
      const { qrData } = req.body;
      const userId = req.user._id;
      
      if (!qrData) {
        return res.status(400).json({ success: false, message: 'QR code data is required' });
      }

      // Parse QR code data
      let data;
      try {
        data = JSON.parse(qrData);
      } catch (parseErr) {
        return res.status(400).json({ success: false, message: 'Invalid QR code format' });
      }

      const { activityId, sessionId } = data;
      
      if (!activityId) {
        return res.status(400).json({ success: false, message: 'Invalid QR code: missing activityId' });
      }

      // 1. Find student profile
      const studentProfile = await StudentProfile.findOne({ user_id: userId });
      if (!studentProfile) {
        return res.status(404).json({ success: false, message: 'Student profile not found' });
      }

      // 2. Check if activity exists
      const activity = await Activity.findById(activityId);
      if (!activity) {
        return res.status(404).json({ success: false, message: 'Activity not found' });
      }

      // 3. Check registration
      const registration = await ActivityRegistration.findOne({
        student_id: studentProfile._id,
        activity_id: activityId,
        status: 'approved'
      });

      if (!registration) {
        return res.status(403).json({ 
          success: false, 
          message: 'Bạn chưa được duyệt để tham gia hoạt động này' 
        });
      }

      // ===== Handle Multiple Sessions =====
      let attendanceSession = null;
      let sessionName = 'Activity';

      if (sessionId && activity.attendance_sessions && activity.attendance_sessions.length > 0) {
        // Find the session
        attendanceSession = await AttendanceSession.findById(sessionId);
        
        if (!attendanceSession) {
          return res.status(404).json({ 
            success: false, 
            message: 'Attendance session not found' 
          });
        }

        sessionName = attendanceSession.name;

        // Validate session timing
        const timingValidation = attendanceCalculator.validateSessionTiming(
          attendanceSession.start_time,
          attendanceSession.end_time,
          30
        );

        if (!timingValidation.isValid) {
          return res.status(400).json({ 
            success: false, 
            message: timingValidation.message 
          });
        }

        // Check if already scanned this session
        let attendance = await Attendance.findOne({
          student_id: studentProfile._id,
          activity_id: activityId
        });

        if (!attendance) {
          // Create new attendance record
          attendance = new Attendance({
            student_id: studentProfile._id,
            activity_id: activityId,
            total_sessions_required: activity.attendance_sessions.length,
            attendance_sessions: [],
            scanned_at: new Date()
          });
        }

        // Check if already attended this session
        const alreadyAttendedThisSession = attendance.attendance_sessions.some(
          s => s.session_id.toString() === sessionId
        );

        if (alreadyAttendedThisSession) {
          return res.status(400).json({
            success: false,
            message: `Bạn đã điểm danh session "${sessionName}" rồi`
          });
        }

        // Add session to attendance
        attendance.attendance_sessions.push({
          session_id: sessionId,
          session_number: attendanceSession.session_number,
          session_name: sessionName,
          scanned_at: new Date(),
          session_status: 'present'
        });

        // Calculate attendance status and points
        const calculation = attendanceCalculator.calculateAttendanceStatus(
          activity,
          attendance.attendance_sessions.length
        );

        attendance.status = calculation.status;
        attendance.attendance_rate = calculation.attendanceRate;
        attendance.total_sessions_attended = attendance.attendance_sessions.length;
        attendance.points_earned = calculation.earnedPoints;
        attendance.points = calculation.earnedPoints; // For backward compatibility
        attendance.scanned_at = new Date();

        await attendance.save();

        // ===== Auto-update Registration Status =====
        if (calculation.status === 'present') {
          await ActivityRegistration.findByIdAndUpdate(
            registration._id,
            {
              status: 'attended',
              attendance_record_id: attendance._id
            }
          );
        }

        // Populate for response
        await attendance.populate({
          path: 'student_id',
          populate: { path: 'user_id', select: '-password_hash' }
        });
        await attendance.populate('activity_id');

        res.status(201).json({
          success: true,
          message: `Điểm danh ${sessionName} thành công`,
          data: {
            attendance,
            summary: attendanceCalculator.formatAttendanceSummary(attendance, calculation)
          }
        });
      } else {
        // ===== Single Session Mode (Backward Compatible) =====
        const now = new Date();
        const startTime = new Date(activity.start_time);
        const endTime = new Date(activity.end_time);
        const scanStartWindow = new Date(startTime.getTime() - 30 * 60000);
        
        if (now < scanStartWindow) {
          return res.status(400).json({ 
            success: false, 
            message: 'Hoạt động chưa bắt đầu. Vui lòng quay lại gần giờ bắt đầu' 
          });
        }

        if (now > endTime) {
          return res.status(400).json({ 
            success: false, 
            message: 'Hoạt động đã kết thúc. Không thể điểm danh' 
          });
        }

        // Check if already attended
        const existingAttendance = await Attendance.findOne({
          student_id: studentProfile._id,
          activity_id: activityId
        });

        if (existingAttendance) {
          return res.status(400).json({ 
            success: false, 
            message: 'Bạn đã điểm danh rồi' 
          });
        }

        // Create attendance
        const attendance = new Attendance({
          student_id: studentProfile._id,
          activity_id: activityId,
          status: 'present',
          scanned_at: new Date(),
          total_sessions_required: 1,
          total_sessions_attended: 1,
          attendance_rate: 1.0,
          verified: false
        });

        await attendance.save();

        // Auto-update registration
        await ActivityRegistration.findByIdAndUpdate(
          registration._id,
          { 
            status: 'attended',
            attendance_record_id: attendance._id
          }
        );

        await attendance.populate({
          path: 'student_id',
          populate: { path: 'user_id', select: '-password_hash' }
        });
        await attendance.populate('activity_id');

        res.status(201).json({ 
          success: true, 
          message: 'Điểm danh thành công',
          data: attendance 
        });
      }
    } catch (err) {
      console.error('Scan QR code error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },
};


