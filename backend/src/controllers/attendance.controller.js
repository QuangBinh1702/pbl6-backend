// Quản lý điểm danh
const Attendance = require('../models/attendance.model');
const Activity = require('../models/activity.model');
const StudentProfile = require('../models/student_profile.model');
const Notification = require('../models/notification.model');
const ActivityRegistration = require('../models/activity_registration.model');
// ⚠️ REMOVED: AttendanceSession không còn dùng (hệ thống sessions đã bị xóa)
const QRCodeModel = require('../models/qr_code.model');  // ← PHASE 2.5: QR Manager
const Class = require('../models/class.model');
const Falcuty = require('../models/falcuty.model');
const registrationController = require('./registration.controller');
const QRCode = require('qrcode');
// ⚠️ REMOVED: attendanceCalculator không còn dùng (hệ thống sessions đã bị xóa)
const XLSX = require('xlsx');  // ← For Excel export

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
      
      // 🆕 Get ALL attendance records for this student + activity (multiple QR scans)
      const attendances = await Attendance.find({
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
        .populate('activity_id')
        .sort({ scanned_at: 1 }); // Sort by scan time (oldest first)
      
      if (!attendances || attendances.length === 0) {
        return res.status(404).json({ success: false, message: 'Attendance not found' });
      }
      
      // 🆕 Calculate final points: MAX points_earned (highest score from all scans)
      const maxPoints = Math.max(...attendances.map(att => att.points_earned || att.points || 0));
      const totalScans = attendances.length;
      
      // Get the latest attendance record (most recent scan)
      const latestAttendance = attendances[attendances.length - 1];
      
      res.json({ 
        success: true, 
        data: {
          // Latest attendance record (most recent)
          ...latestAttendance.toObject(),
          // 🆕 Summary stats
          total_scans: totalScans,
          final_points: maxPoints,  // Highest points earned (correct final score)
          all_scans: attendances.map(att => ({
            scan_order: att.scan_order,
            points_earned: att.points_earned || att.points || 0,
            scanned_at: att.scanned_at,
            qr_code_id: att.qr_code_id
          }))
        }
      });
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

      // 🆕 Deduplicate by activity_id and get MAX points (highest score from all scans)
      const activitiesMap = new Map();
      attendances.forEach(att => {
        if (att.activity_id) {
          const key = att.activity_id._id.toString();
          const points = att.points_earned || att.points || 0;
          
          if (!activitiesMap.has(key)) {
            const act = att.activity_id.toObject();
            // Add MAX points (highest score from all scans for this activity)
            act.points = points;
            act.final_points = points;  // 🆕 Final points (highest)
            act.attendance_id = att._id;
            act.scanned_at = att.scanned_at;  // 🆕 Attendance scan time
            act.total_scans = 1;  // 🆕 Count of scans
            activitiesMap.set(key, act);
          } else {
            // Update if this scan has higher points
            const existing = activitiesMap.get(key);
            if (points > existing.points) {
              existing.points = points;
              existing.final_points = points;
              existing.attendance_id = att._id;
              existing.scanned_at = att.scanned_at;
            }
            existing.total_scans += 1;  // Increment scan count
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
      
      // Get activity to get total_qr_created (for dynamic QR scoring)
      const activity = await Activity.findById(activityId);
      if (!activity) {
        return res.status(404).json({ success: false, message: 'Activity not found' });
      }

      // 🆕 Use total_qr_created for QR system, default to 1 if not set
      const totalQRCreated = activity.total_qr_created || 1;
      
      // Get all attendance records for the activity
      const attendances = await Attendance.find({ activity_id: activityId })
        .populate({
          path: 'student_id',
          populate: [
            {
              path: 'user_id',
              select: '-password_hash'
            },
            {
              path: 'class_id',
              populate: [
                {
                  path: 'falcuty_id',
                  select: '_id name'
                },
                {
                  path: 'cohort_id',
                  select: '_id year'
                }
              ]
            }
          ]
        })
        .lean();

      // Group by student and calculate stats
      const studentStatsMap = new Map();
      attendances.forEach(att => {
        if (att.student_id) {
          const key = att.student_id._id.toString();
          
          if (!studentStatsMap.has(key)) {
            studentStatsMap.set(key, {
              student_id: {
                _id: att.student_id._id,
                student_number: att.student_id.student_number,
                full_name: att.student_id.full_name,
                email: att.student_id.email,
                gender: att.student_id.gender,
                phone: att.student_id.phone,
                class_id: att.student_id.class_id ? {
                  _id: att.student_id.class_id._id,
                  name: att.student_id.class_id.name,
                  falcuty_id: att.student_id.class_id.falcuty_id ? {
                    _id: att.student_id.class_id.falcuty_id._id,
                    name: att.student_id.class_id.falcuty_id.name
                  } : null,
                  cohort_id: att.student_id.class_id.cohort_id ? {
                    _id: att.student_id.class_id.cohort_id._id,
                    year: att.student_id.class_id.cohort_id.year
                  } : null
                } : null,
                contact_address: att.student_id.contact_address,
                date_of_birth: att.student_id.date_of_birth,
                student_image: att.student_id.student_image,
                isClassMonitor: att.student_id.isClassMonitor,
                user_id: att.student_id.user_id?._id || null,
                username: att.student_id.user_id?.username || null,
                active: att.student_id.user_id?.active || false,
                isLocked: att.student_id.user_id?.isLocked || false
              },
              attendance_count: 0,
              last_attended: null,
              last_attendance_id: null,  // 🆕 Track latest attendance_id
              status: att.status
            });
          }
          
          const stats = studentStatsMap.get(key);
          stats.attendance_count += 1;
          
          // Update last_attended and last_attendance_id to most recent
          if (!stats.last_attended || new Date(att.scanned_at) > new Date(stats.last_attended)) {
            stats.last_attended = att.scanned_at;
            stats.last_attendance_id = att._id;  // 🆕 Store latest attendance_id
          }
        }
      });

      // 🆕 Calculate total_points: MAX points_earned from all scans (dynamic QR scoring)
      const result = Array.from(studentStatsMap.values()).map(stats => {
        // Get all attendances for this student
        const studentAttendances = attendances.filter(
          att => att.student_id?._id?.toString() === stats.student_id._id.toString()
        );
        
        // Calculate max points (highest score from all scans)
        const maxPoints = Math.max(
          ...studentAttendances.map(att => att.points_earned || att.points || 0),
          0
        );
        
        // Calculate attendance rate based on QR scans
        const attendanceRate = totalQRCreated > 0 ? stats.attendance_count / totalQRCreated : 0;
        
        // Base response object
        const responseData = {
          ...stats,
          attendance_id: stats.last_attendance_id,  // 🆕 Add attendance_id (latest)
          total_points: maxPoints,  // 🆕 Final points = max points from all scans
          attendance_rate: Math.min(attendanceRate, 1.0)  // Cap at 1.0
        };
        
        // Only add QR-related fields if using new QR system (total_qr_created exists)
        if (activity.total_qr_created) {
          responseData.total_qr_scanned = stats.attendance_count;  // Number of QR scans
          responseData.total_qr_available = totalQRCreated;  // Total QR codes available
        }
        
        return responseData;
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

  // ⚠️ REMOVED: Hệ thống cũ (sessions-based) đã bị xóa
  // Hệ thống QR mới sử dụng submitAttendance thay thế

  // ===== PHASE 2.5: scanQRCodeV2 - New on-demand QR scanning (replaces old scanQRCode) =====
  async scanQRCodeV2(req, res) {
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

      const { activityId, qrId } = data;
      
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

      // ===== NEW: Check QR exists and not expired =====
      let qrRecord = null;
      let qrName = 'QR Code';

      if (qrId) {
        qrRecord = await QRCodeModel.findById(qrId);
        if (!qrRecord) {
          return res.status(404).json({ success: false, message: 'QR code not found' });
        }
        
        if (!qrRecord.is_active) {
          return res.status(400).json({ success: false, message: 'QR code has been deactivated' });
        }
        
        // Check expiry
        if (qrRecord.expires_at && new Date() > qrRecord.expires_at) {
          return res.status(400).json({ success: false, message: 'QR code has expired' });
        }

        qrName = qrRecord.qr_name || 'QR Code';
      }

      // ✅ NO TIME WINDOW VALIDATION - Can scan anytime!

      // Check if already scanned THIS QR (prevent duplicate)
      const alreadyScanned = await Attendance.findOne({
        student_id: studentProfile._id,
        activity_id: activityId,
        qr_code_id: qrId
      });

      if (alreadyScanned) {
        return res.status(400).json({
          success: false,
          message: `Bạn đã quét QR này rồi (${qrName})`
        });
      }

      // ===== Create temporary attendance record =====
      // This is just to record the QR scan
      // Student still needs to submit form with details
      const attendance = new Attendance({
        student_id: studentProfile._id,
        activity_id: activityId,
        qr_code_id: qrId,  // Track which QR
        status: 'present',  // Mark as present when QR is scanned
        scanned_at: new Date()
      });

      await attendance.save();

      // ===== Increment QR scan count =====
      if (qrRecord) {
        await QRCodeModel.findByIdAndUpdate(qrId, {
          $inc: { scans_count: 1 }
        });
      }

      // Populate for response
      await attendance.populate({
        path: 'student_id',
        populate: { path: 'user_id', select: '-password_hash' }
      });
      await attendance.populate('activity_id');
      await attendance.populate('qr_code_id', 'qr_name');

      res.status(201).json({
        success: true,
        message: `✅ QR scanned! Now fill in your information below.`,
        data: {
          attendance,
          activity: {
            _id: activity._id,
            title: activity.title
          },
          qr_info: {
            qr_id: qrId,
            qr_name: qrName
          }
        }
      });
    } catch (err) {
      console.error('Error scanning QR:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // ===== PHASE 2: APPROVAL WORKFLOW =====

  // 1. Submit Attendance (Student submission for approval)
  async submitAttendance(req, res) {
    try {
      const { activity_id, session_id, student_info } = req.body;
      // 🆕 NO AUTH REQUIRED: Public endpoint - validate by MSSV and registration

      // Validate required fields
      if (!activity_id || !student_info) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      if (!student_info.student_id_number || !student_info.class || !student_info.faculty) {
        return res.status(400).json({ success: false, message: 'student_id_number, class, and faculty are required' });
      }

      // Validate MSSV format
      if (!/^\d{9}$/.test(student_info.student_id_number)) {
        return res.status(400).json({ success: false, message: 'MSSV must be 9 digits' });
      }

      // Check if activity exists
      const activity = await Activity.findById(activity_id);
      if (!activity) {
        return res.status(404).json({ success: false, message: 'Activity not found' });
      }

      // 🆕 Find student profile by MSSV (student_number) - REQUIRED
      const studentProfile = await StudentProfile.findOne({ 
        student_number: student_info.student_id_number 
      }).populate('user_id');
      
      if (!studentProfile) {
        return res.status(404).json({
          success: false,
          message: `Sinh viên với MSSV ${student_info.student_id_number} không tồn tại trong hệ thống. Vui lòng liên hệ quản trị viên.`
        });
      }

      const studentId = studentProfile._id;
      const userId = studentProfile.user_id?._id || null;
      console.log(`✅ Found student in system: ${student_info.student_id_number} → ${studentId}`);

      // 🆕 Check if student is registered and approved for this activity - REQUIRED
      const registration = await ActivityRegistration.findOne({
        student_id: studentId,
        activity_id: activity_id,
        status: 'approved'
      });

      if (!registration) {
        return res.status(403).json({
          success: false,
          message: 'Bạn chưa được duyệt để tham gia hoạt động này. Vui lòng đăng ký và chờ duyệt trước.'
        });
      }
      console.log(`✅ Student ${student_info.student_id_number} is registered and approved for activity`);

      // 🆕 Validate QR Code if provided (BACKEND CHECK)
      const qrCodeId = session_id;  // session_id = qr_code_id in new system
      if (qrCodeId) {
        const qrRecord = await QRCodeModel.findById(qrCodeId);
        
        if (!qrRecord) {
          return res.status(400).json({ 
            success: false, 
            message: 'QR code not found' 
          });
        }

        if (!qrRecord.is_active) {
          return res.status(400).json({ 
            success: false, 
            message: 'QR code has been deactivated' 
          });
        }

        if (qrRecord.expires_at && new Date() > qrRecord.expires_at) {
          return res.status(400).json({ 
            success: false, 
            message: `QR code has expired at ${new Date(qrRecord.expires_at).toLocaleString('vi-VN')}` 
          });
        }

        // 🆕 Check for duplicate: Student can't scan same QR twice
        const duplicateAttendance = await Attendance.findOne({
          student_id: studentId,
          activity_id: activity_id,
          qr_code_id: qrCodeId
        });

        if (duplicateAttendance) {
          return res.status(400).json({
            success: false,
            message: 'Bạn đã quét QR này rồi'
          });
        }
      }

      // Validate class exists (from database)
      const classData = await Class.findById(student_info.class);
      if (!classData) {
        return res.status(400).json({ success: false, message: 'Invalid class. Class not found in database.' });
      }

      // Validate faculty exists (from database)
      const facultyData = await Falcuty.findById(student_info.faculty);
      if (!facultyData) {
        return res.status(400).json({ success: false, message: 'Invalid faculty. Faculty not found in database.' });
      }

      // ===== NEW: Check if student in system & class mismatch (Option B+) =====
      let registeredClass = null;
      let classMismatch = false;

      if (studentProfile && studentProfile.class_id) {
        registeredClass = studentProfile.class_id;
        
        // ⚠️ WARNING: Class mismatch but ALLOW submit
        if (registeredClass.toString() !== student_info.class) {
          classMismatch = true;
          console.warn(`⚠️ Class mismatch for student ${userId}: registered=${registeredClass}, submitted=${student_info.class}`);
        }
      }

      // 🆕 Calculate points using dynamic scoring
      // Count how many times this student has scanned for this activity
      const scanCountForActivity = await Attendance.countDocuments({
        student_id: studentId,
        activity_id: activity_id
      });
      const scan_order = scanCountForActivity + 1;  // 1st, 2nd, 3rd...
      const total_qr_at_scan = activity.total_qr_created || 1;  // Total QR created at this moment
      
      // 🆕 Get max_points from activity (required field from database)
      const max_points_from_activity = activity.max_points || 10;  // Default 10 if not set
      
      // Formula: (scan_order / total_qr) * max_points, capped at max_points
      const calculated_points = Math.min(
        Math.floor((scan_order / total_qr_at_scan) * max_points_from_activity),
        max_points_from_activity
      );
      
      console.log(`[Attendance] Points calculation: scan_order=${scan_order}, total_qr=${total_qr_at_scan}, max_points=${max_points_from_activity} → ${calculated_points} pts`);

      // Create attendance with present status (validated via QR + registration)
      const attendance = new Attendance({
        student_id: studentId,
        activity_id: activity_id,
        qr_code_id: qrCodeId,
        
        // 🆕 Dynamic scoring fields
        scan_order: scan_order,
        total_qr_at_scan: total_qr_at_scan,
        points_earned: calculated_points,
        points: calculated_points,  // For backward compatibility
        
        student_info: {
          student_id_number: student_info.student_id_number,
          student_name: student_info.student_name,  // 🆕 New field
          class: student_info.class,  // ObjectId
          faculty: student_info.faculty,  // ObjectId
          submitted_at: new Date()
        },
        
        // Track mismatches
        student_info_flags: {
          class_mismatch: classMismatch,
          registered_class: registeredClass,
          student_in_system: !!studentProfile
        },
        
        status: 'present',  // Mark as present (validated via QR + registration)
        scanned_at: new Date(),
        verified: true,
        verified_by: userId  // Student who scanned
      });

      await attendance.save();

      // Populate with try-catch to handle missing student profile
      try {
        await attendance.populate({
          path: 'student_id',
          populate: { path: 'user_id', select: '-password_hash' }
        });
        await attendance.populate({
          path: 'student_info.class',
          select: 'name'
        });
        await attendance.populate({
          path: 'student_info.faculty',
          select: 'name'
        });
        await attendance.populate({
          path: 'student_info_flags.registered_class',
          select: 'name'
        });
        await attendance.populate('activity_id');
      } catch (e) {
        // If populate fails, just continue without it
        console.log('Could not populate fields:', e.message);
      }

      res.status(201).json({
        success: true,
        message: `✅ Điểm danh thành công! Lần ${scan_order}/${total_qr_at_scan} - ${calculated_points} điểm`,
        data: {
          attendance_id: attendance._id,
          scan_order: scan_order,
          total_qr_at_scan: total_qr_at_scan,
          points_earned: calculated_points,
          student_name: student_info.student_name,
          activity_id: activity_id,
          scanned_at: attendance.scanned_at
        },
        warnings: classMismatch ? {
          class_mismatch: true,
          registered_class: registeredClass ? registeredClass.toString() : null,
          submitted_class: student_info.class
        } : null
      });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  // 2. Get Attendances Needing Review (Admin view)
  // Returns attendances with points_earned = 0 or not verified (need staff review)
  async getPendingAttendances(req, res) {
    try {
      const { activity_id } = req.query;

      const query = { 
        $or: [
          { points_earned: 0 },
          { points_earned: { $exists: false } },
          { verified: false }
        ]
      };
      if (activity_id) query.activity_id = activity_id;

      const attendances = await Attendance.find(query)
        .populate({
          path: 'student_id',
          populate: { path: 'user_id', select: '-password_hash' }
        })
        .populate('activity_id')
        .sort({ 'student_info.submitted_at': -1 });

      res.json({
        success: true,
        total: attendances.length,
        data: attendances
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // 3. Update Attendance Points (Staff update points and mark as present)
  async approveAttendance(req, res) {
    try {
      const { id } = req.params;
      const { verified_comment } = req.body;
      const admin_id = req.user._id;

      const attendance = await Attendance.findById(id);
      if (!attendance) {
        return res.status(404).json({ success: false, message: 'Attendance not found' });
      }

      // Get activity to calculate points
      const activity = await Activity.findById(attendance.activity_id);
      
      // Calculate points using dynamic scoring logic
      let pointsEarned;
      if (attendance.points_earned) {
        // Keep existing points if already calculated
        pointsEarned = attendance.points_earned;
      } else if (attendance.scan_order && attendance.total_qr_at_scan) {
        // Calculate using dynamic scoring formula: (scan_order / total_qr_at_scan) * max_points
        const max_points = activity?.max_points || 10;
        pointsEarned = Math.min(
          Math.floor((attendance.scan_order / attendance.total_qr_at_scan) * max_points),
          max_points
        );
      } else {
        // Fallback: default to 0 points (not 10) - staff should manually set points if needed
        pointsEarned = 0;
      }

      // Update attendance - mark as present and update points
      attendance.status = 'present';
      attendance.verified_by = admin_id;
      attendance.verified_at = new Date();
      attendance.verified_comment = verified_comment || '';
      attendance.points_earned = pointsEarned;
      attendance.points = pointsEarned;  // For backward compatibility

      await attendance.save();

      await attendance.populate({
        path: 'student_id',
        populate: { path: 'user_id', select: '-password_hash' }
      });
      await attendance.populate('activity_id');
      await attendance.populate('verified_by', '-password_hash');

      res.json({
        success: true,
        message: 'Attendance updated successfully',
        data: attendance
      });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  // 4. Mark Attendance as Absent (Staff mark as absent and set points to 0)
  async rejectAttendance(req, res) {
    try {
      const { id } = req.params;
      const { rejection_reason, verified_comment } = req.body;
      const admin_id = req.user._id;

      if (!rejection_reason) {
        return res.status(400).json({ success: false, message: 'Rejection reason is required' });
      }

      const attendance = await Attendance.findById(id);
      if (!attendance) {
        return res.status(404).json({ success: false, message: 'Attendance not found' });
      }

      // Update attendance - mark as absent and set points to 0
      attendance.status = 'absent';
      attendance.rejection_reason = rejection_reason;
      attendance.verified_by = admin_id;
      attendance.verified_at = new Date();
      attendance.verified_comment = verified_comment || '';
      attendance.points_earned = 0;

      await attendance.save();

      await attendance.populate({
        path: 'student_id',
        populate: { path: 'user_id', select: '-password_hash' }
      });
      await attendance.populate('activity_id');
      await attendance.populate('verified_by', '-password_hash');

      res.json({
        success: true,
        message: 'Attendance marked as absent',
        data: attendance
      });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  // 5. Export Attendances Needing Review to Excel
  async exportPendingAttendances(req, res) {
    try {
      const { activity_id } = req.query;

      const query = { 
        $or: [
          { points_earned: 0 },
          { points_earned: { $exists: false } },
          { verified: false }
        ]
      };
      if (activity_id) query.activity_id = activity_id;

      const attendances = await Attendance.find(query)
        .populate({
          path: 'student_id',
          populate: { path: 'user_id' }
        })
        .populate('activity_id')
        .populate('student_info.class', 'name')
        .populate('student_info.faculty', 'name');

      // Get activity name
      let activityName = 'Attendance';
      if (activity_id && attendances.length > 0) {
        activityName = attendances[0].activity_id?.title || 'Attendance';
      }

      // Prepare data for Excel
      const excelData = attendances.map((att, index) => {
        const className = att.student_info?.class?.name || att.student_info?.class || 'N/A';
        const facultyName = att.student_info?.faculty?.name || att.student_info?.faculty || 'N/A';
        
        return {
          'STT': index + 1,
          'Tên sinh viên': att.student_id?.user_id?.full_name || 'N/A',
          'MSSV': att.student_info?.student_id_number || 'N/A',
          'Lớp': className,
          'Khoa': facultyName,
          'SĐT': att.student_info?.phone || 'N/A',
          'Ghi chú': att.student_info?.notes || '',
          'Thời gian nộp': att.student_info?.submitted_at ? new Date(att.student_info.submitted_at).toLocaleString('vi-VN') : 'N/A'
        };
      });

      // Create workbook
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      worksheet['!cols'] = [
        { wch: 5 },   // STT
        { wch: 20 },  // Name
        { wch: 10 },  // MSSV
        { wch: 10 },  // Class
        { wch: 15 },  // Faculty
        { wch: 15 },  // Phone
        { wch: 30 },  // Notes
        { wch: 20 }   // Submission time
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách điểm danh');

      // Generate Excel file
      const fileName = `attendance_${activityName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(buffer);
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // 6. Get Rejection Reasons (for dropdown)
  async getRejectionReasons(req, res) {
    try {
      const reasons = [
        { code: 'MISSING_INFO', label: 'Thông tin không đủ' },
        { code: 'INVALID_CLASS', label: 'Lớp không tồn tại' },
        { code: 'DUPLICATE', label: 'Đã điểm danh rồi' },
        { code: 'NOT_PARTICIPANT', label: 'Không phải thành viên' },
        { code: 'OUT_OF_TIME', label: 'Quét ngoài thời gian' },
        { code: 'NO_EVIDENCE', label: 'Không có bằng chứng' },
        { code: 'INVALID_PHONE', label: 'Số điện thoại sai' }
      ];

      res.json({
        success: true,
        data: reasons
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // 7. Get Master Data (Classes & Faculties for dropdowns) - FROM DATABASE
  async getMasterData(req, res) {
    try {
      // Get all classes with their faculty info
      const classes = await Class.find()
        .populate('falcuty_id', 'name _id')
        .select('name _id falcuty_id');

      // Get all faculties
      const faculties = await Falcuty.find()
        .select('name _id')
        .sort({ name: 1 });

      res.json({
        success: true,
        data: {
          classes: classes.map(c => ({
            _id: c._id,
            name: c.name,
            faculty_id: c.falcuty_id?._id,
            faculty_name: c.falcuty_id?.name
          })),
          faculties: faculties.map(f => ({
            _id: f._id,
            name: f.name
          }))
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // ===== PHASE 2.5: ON-DEMAND QR MANAGEMENT =====

  // 8. Generate On-Demand QR Code
  async generateQRCode(req, res) {
    try {
      const { activity_id, qr_name, duration_minutes } = req.body;
      const userId = req.user._id;

      if (!activity_id) {
        return res.status(400).json({ success: false, message: 'activity_id is required' });
      }

      // Check activity exists
      const activity = await Activity.findById(activity_id);
      if (!activity) {
        return res.status(404).json({ success: false, message: 'Activity not found' });
      }

      // Generate unique QR ID
      const qrId = new (require('mongoose')).Types.ObjectId();

      // Calculate expiry time if duration provided
      let expiresAt = null;
      if (duration_minutes) {
        expiresAt = new Date(Date.now() + duration_minutes * 60 * 1000);
      }

      // Create QR data (what gets encoded in the QR image)
      const qrData = {
        activityId: activity_id.toString(),
        qrId: qrId.toString(),
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt ? expiresAt.toISOString() : null
      };

      // QR code contains custom form link with activity_id
      // When scanned, phone will redirect to the form with activity_id parameter
      const formUrl = `https://pbl6-backend-iy5q.onrender.com/qr-attendance-form.html?activity_id=${activity_id}&qr_code_id=${qrId}`;

      // Generate QR code image (Base64) - encode form URL
      const qrCodeImage = await QRCode.toDataURL(formUrl);

      // Save to database
      const qrRecord = new QRCodeModel({
        _id: qrId,
        activity_id: activity_id,
        qr_name: qr_name || `QR #${Date.now()}`,
        qr_data: JSON.stringify(qrData),
        qr_code: qrCodeImage,
        created_by: userId,
        created_at: new Date(),
        expires_at: expiresAt,
        is_active: true,
        scans_count: 0
      });

      await qrRecord.save();

      // 🆕 DYNAMIC QR SCORING: Increment total_qr_created counter
      activity.total_qr_created = (activity.total_qr_created || 0) + 1;
      await activity.save();
      
      console.log(`✅ QR created. Activity "${activity.title}" now has ${activity.total_qr_created} QRs`);

      res.status(201).json({
        success: true,
        message: 'QR code generated successfully',
        data: {
          qr_id: qrRecord._id,
          qr_name: qrRecord.qr_name,
          qr_code: qrRecord.qr_code,
          created_at: qrRecord.created_at,
          expires_at: qrRecord.expires_at,
          scans_count: 0,
          // 🆕 DYNAMIC QR SCORING: Return total QR count
          total_qr_created: activity.total_qr_created
        }
      });
    } catch (err) {
      console.error('Error generating QR:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // 9. Get All QRs for Activity
  async getQRCodesForActivity(req, res) {
    try {
      const { activity_id } = req.params;

      const qrCodes = await QRCodeModel.find({ activity_id })
        .sort({ created_at: -1 });

      // Separate current (active) and history (expired/inactive)
      const current = qrCodes.find(qr => qr.is_active && (!qr.expires_at || new Date() < qr.expires_at));
      const history = qrCodes.filter(qr => qr._id !== current?._id);

      res.json({
        success: true,
        data: {
          current: current ? {
            _id: current._id,
            qr_name: current.qr_name,
            qr_code: current.qr_code,
            created_at: current.created_at,
            expires_at: current.expires_at,
            scans_count: current.scans_count,
            is_active: current.is_active
          } : null,
          history: history.map(qr => ({
            _id: qr._id,
            qr_name: qr.qr_name,
            created_at: qr.created_at,
            expires_at: qr.expires_at,
            scans_count: qr.scans_count,
            is_active: qr.is_active,
            status: qr.is_active && (!qr.expires_at || new Date() < qr.expires_at) ? 'active' : 'expired'
          }))
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // 10. Delete old QR codes (keep latest N)
  async deleteOldQRCodes(req, res) {
    try {
      const { activity_id } = req.params;
      const { keep_latest } = req.query;
      const keepCount = parseInt(keep_latest) || 3;

      const qrCodes = await QRCodeModel.find({ activity_id })
        .sort({ created_at: -1 });

      // Delete all except latest N
      const toDelete = qrCodes.slice(keepCount);
      for (const qr of toDelete) {
        await QRCodeModel.deleteOne({ _id: qr._id });
      }

      res.json({
        success: true,
        message: `Deleted ${toDelete.length} old QR codes`,
        kept: keepCount
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // 11. Validate QR Code (check if expired) - for frontend
  async validateQRCode(req, res) {
    try {
      const { qr_code_id } = req.body;

      if (!qr_code_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'QR code ID is required',
          valid: false 
        });
      }

      const qrRecord = await QRCodeModel.findById(qr_code_id);

      if (!qrRecord) {
        return res.status(404).json({ 
          success: false, 
          message: 'QR code not found',
          valid: false 
        });
      }

      // Check if QR is active
      if (!qrRecord.is_active) {
        return res.json({ 
          success: false, 
          message: 'QR code is deactivated',
          valid: false,
          reason: 'deactivated'
        });
      }

      // Check if QR is expired
      if (qrRecord.expires_at && new Date() > qrRecord.expires_at) {
        return res.json({ 
          success: false, 
          message: `QR code expired at ${new Date(qrRecord.expires_at).toLocaleString('vi-VN')}`,
          valid: false,
          reason: 'expired',
          expired_at: qrRecord.expires_at
        });
      }

      // 🆕 DYNAMIC QR SCORING: Get activity details for point prediction
      const activityData = await Activity.findById(qrRecord.activity_id);

      // QR is valid
      res.json({
        success: true,
        message: 'QR code is valid',
        valid: true,
        qr_name: qrRecord.qr_name,
        created_at: qrRecord.created_at,
        expires_at: qrRecord.expires_at,
        scans_count: qrRecord.scans_count,
        // 🆕 DYNAMIC QR SCORING: Include activity details for frontend prediction
        activity_id: qrRecord.activity_id,
        total_qr_created: activityData ? activityData.total_qr_created : 0,
        max_points: activityData ? (activityData.max_points || 10) : 10
      });
    } catch (err) {
      res.status(500).json({ 
        success: false, 
        message: err.message,
        valid: false 
      });
    }
  }
};


