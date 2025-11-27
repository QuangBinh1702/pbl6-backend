// Quản lý Attendance Sessions
const Activity = require('../models/activity.model');
const AttendanceSession = require('../models/attendance_session.model');
const QRCode = require('qrcode');

module.exports = {
  /**
   * Tạo attendance sessions cho một hoạt động
   * POST /api/activities/:id/attendance-sessions
   */
  async createAttendanceSessions(req, res) {
    try {
      const { id } = req.params;
      const { sessions } = req.body;

      if (!Array.isArray(sessions) || sessions.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Sessions must be a non-empty array'
        });
      }

      const activity = await Activity.findById(id);
      if (!activity) {
        return res.status(404).json({
          success: false,
          message: 'Activity not found'
        });
      }

      const createdSessions = [];

      for (const sessionData of sessions) {
        // Validate session data
        if (!sessionData.name || !sessionData.start_time || !sessionData.end_time) {
          return res.status(400).json({
            success: false,
            message: 'Each session must have name, start_time, and end_time'
          });
        }

        const startTime = new Date(sessionData.start_time);
        const endTime = new Date(sessionData.end_time);

        // Validate dates
        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid date format for session times'
          });
        }

        if (endTime <= startTime) {
          return res.status(400).json({
            success: false,
            message: 'Session end_time must be after start_time'
          });
        }

        try {
          // Generate QR code for this session
          const qrData = JSON.stringify({
            activityId: activity._id.toString(),
            sessionId: sessionData.id || `session_${sessionData.session_number}`,
            sessionNumber: sessionData.session_number,
            sessionName: sessionData.name,
            timestamp: new Date().toISOString()
          });

          const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            width: 300,
            margin: 1,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });

          // Create AttendanceSession document
          const attendanceSession = new AttendanceSession({
            activity_id: id,
            session_number: sessionData.session_number,
            name: sessionData.name,
            description: sessionData.description,
            start_time: startTime,
            end_time: endTime,
            qr_code: qrCodeDataUrl,
            required: sessionData.required !== false
          });

          await attendanceSession.save();
          createdSessions.push(attendanceSession);
        } catch (qrError) {
          console.error('Error generating QR code for session:', qrError);
          return res.status(500).json({
            success: false,
            message: 'Failed to generate QR code for session'
          });
        }
      }

      // Update Activity với attendance_sessions và config
      activity.attendance_sessions = createdSessions.map(s => ({
        _id: s._id,
        session_number: s.session_number,
        name: s.name,
        description: s.description,
        start_time: s.start_time,
        end_time: s.end_time,
        qr_code: s.qr_code,
        required: s.required
      }));

      // Set default attendance_config nếu chưa có
      if (!activity.attendance_config) {
        activity.attendance_config = {
          enabled: true,
          total_sessions_required: createdSessions.length,
          calculation_method: 'partial',
          attendance_threshold: 0.5,
          points_config: {
            points_per_session: 5,
            partial_points: true,
            max_points: createdSessions.length * 5
          }
        };
      } else {
        // Update total_sessions_required
        activity.attendance_config.total_sessions_required = createdSessions.length;
        if (!activity.attendance_config.points_config.max_points) {
          activity.attendance_config.points_config.max_points = createdSessions.length * 5;
        }
      }

      await activity.save();

      res.status(201).json({
        success: true,
        message: `Created ${createdSessions.length} attendance sessions`,
        data: {
          activity_id: id,
          sessions: createdSessions,
          config: activity.attendance_config
        }
      });
    } catch (err) {
      console.error('Create attendance sessions error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Lấy attendance sessions của một hoạt động
   * GET /api/activities/:id/attendance-sessions
   */
  async getAttendanceSessions(req, res) {
    try {
      const { id } = req.params;

      const activity = await Activity.findById(id);
      if (!activity) {
        return res.status(404).json({
          success: false,
          message: 'Activity not found'
        });
      }

      const sessions = await AttendanceSession.find({
        activity_id: id
      }).sort({ session_number: 1 });

      res.json({
        success: true,
        data: {
          activity_id: id,
          total_sessions: sessions.length,
          sessions: sessions,
          config: activity.attendance_config
        }
      });
    } catch (err) {
      console.error('Get attendance sessions error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Lấy QR code của một session
   * GET /api/attendance-sessions/:sessionId/qr-code
   */
  async getSessionQRCode(req, res) {
    try {
      const { sessionId } = req.params;

      const session = await AttendanceSession.findById(sessionId).populate('activity_id');
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Attendance session not found'
        });
      }

      res.json({
        success: true,
        data: {
          sessionId: session._id,
          activityId: session.activity_id._id,
          sessionNumber: session.session_number,
          sessionName: session.name,
          qr_code: session.qr_code
        }
      });
    } catch (err) {
      console.error('Get session QR code error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Update attendance session
   * PUT /api/attendance-sessions/:sessionId
   */
  async updateAttendanceSession(req, res) {
    try {
      const { sessionId } = req.params;
      const { name, description, start_time, end_time, required } = req.body;

      const session = await AttendanceSession.findById(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Attendance session not found'
        });
      }

      if (name) session.name = name;
      if (description !== undefined) session.description = description;
      if (start_time) session.start_time = new Date(start_time);
      if (end_time) session.end_time = new Date(end_time);
      if (required !== undefined) session.required = required;

      // Regenerate QR if times changed
      if (start_time || end_time) {
        try {
          const activity = await Activity.findById(session.activity_id);
          const qrData = JSON.stringify({
            activityId: activity._id.toString(),
            sessionId: session._id.toString(),
            sessionNumber: session.session_number,
            sessionName: session.name,
            timestamp: new Date().toISOString()
          });

          session.qr_code = await QRCode.toDataURL(qrData, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            width: 300,
            margin: 1
          });
        } catch (qrError) {
          console.error('Error regenerating QR code:', qrError);
        }
      }

      session.updated_at = new Date();
      await session.save();

      res.json({
        success: true,
        message: 'Attendance session updated',
        data: session
      });
    } catch (err) {
      console.error('Update attendance session error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Delete attendance session
   * DELETE /api/attendance-sessions/:sessionId
   */
  async deleteAttendanceSession(req, res) {
    try {
      const { sessionId } = req.params;

      const session = await AttendanceSession.findByIdAndDelete(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Attendance session not found'
        });
      }

      res.json({
        success: true,
        message: 'Attendance session deleted'
      });
    } catch (err) {
      console.error('Delete attendance session error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Cập nhật attendance configuration cho hoạt động
   * PUT /api/activities/:id/attendance-config
   */
  async updateAttendanceConfig(req, res) {
    try {
      const { id } = req.params;
      const { calculation_method, attendance_threshold, points_config } = req.body;

      const activity = await Activity.findById(id);
      if (!activity) {
        return res.status(404).json({
          success: false,
          message: 'Activity not found'
        });
      }

      if (!activity.attendance_config) {
        activity.attendance_config = {
          enabled: true,
          total_sessions_required: activity.attendance_sessions?.length || 1,
          calculation_method: 'partial',
          attendance_threshold: 0.5,
          points_config: {
            points_per_session: 5,
            partial_points: true,
            max_points: 5
          }
        };
      }

      // Update config fields
      if (calculation_method) {
        if (!['all', 'partial', 'first_match'].includes(calculation_method)) {
          return res.status(400).json({
            success: false,
            message: "calculation_method must be 'all', 'partial', or 'first_match'"
          });
        }
        activity.attendance_config.calculation_method = calculation_method;
      }

      if (attendance_threshold !== undefined) {
        if (attendance_threshold < 0 || attendance_threshold > 1) {
          return res.status(400).json({
            success: false,
            message: 'attendance_threshold must be between 0 and 1'
          });
        }
        activity.attendance_config.attendance_threshold = attendance_threshold;
      }

      if (points_config) {
        activity.attendance_config.points_config = {
          ...activity.attendance_config.points_config,
          ...points_config
        };
      }

      await activity.save();

      res.json({
        success: true,
        message: 'Attendance configuration updated',
        data: {
          activity_id: id,
          config: activity.attendance_config
        }
      });
    } catch (err) {
      console.error('Update attendance config error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
