// Quản lý đăng ký hoạt động
const ActivityRegistration = require("../models/activity_registration.model");
const Activity = require("../models/activity.model");
const StudentProfile = require("../models/student_profile.model");
const User = require("../models/user.model");
const QRCode = require("qrcode");

module.exports = {
  async getAllRegistrations(req, res) {
    try {
      const { status, activity_id } = req.query;
      const filter = {};

      if (status) filter.status = status;
      if (activity_id) filter.activity_id = activity_id;

      const registrations = await ActivityRegistration.find(filter)
        .populate({
          path: "student_id",
          populate: { path: "user_id" },
        })
        .populate("activity_id")
        .populate("approved_by")
        .populate("cancelled_by")
        .populate("status_history.changed_by")
        .sort({ createdAt: -1 });

      res.json({ success: true, data: registrations });
    } catch (err) {
      console.error("Get all registrations error:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getRegistrationById(req, res) {
    try {
      const registration = await ActivityRegistration.findById(req.params.id)
        .populate({
          path: "student_id",
          populate: { path: "user_id" },
        })
        .populate("activity_id")
        .populate("approved_by")
        .populate("cancelled_by")
        .populate("status_history.changed_by");

      if (!registration) {
        return res.status(404).json({
          success: false,
          message: "Registration not found",
        });
      }

      res.json({ success: true, data: registration });
    } catch (err) {
      console.error("Get registration by ID error:", err);
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
          path: "student_id",
          populate: { path: "user_id" },
        })
        .populate("approved_by")
        .populate("cancelled_by")
        .populate("status_history.changed_by")
        .sort({ createdAt: -1 });

      res.json({ success: true, data: registrations });
    } catch (err) {
      console.error("Get registrations by activity error:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getRegistrationsByStudent(req, res) {
    try {
      const { studentId } = req.params;

      const registrations = await ActivityRegistration.find({
        student_id: studentId,
      })
        .populate("activity_id")
        .populate("approved_by")
        .populate("cancelled_by")
        .populate("status_history.changed_by")
        .sort({ createdAt: -1 });

      res.json({ success: true, data: registrations });
    } catch (err) {
      console.error("Get registrations by student error:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async createRegistration(req, res) {
    try {
      const { student_id, activity_id } = req.body;

      if (!student_id || !activity_id) {
        return res.status(400).json({
          success: false,
          message: "student_id and activity_id are required",
        });
      }

      // Check if already registered (active registration)
      const existingReg = await ActivityRegistration.findOne({
        student_id,
        activity_id,
        status: { $ne: "cancelled" },
      });

      if (existingReg) {
        return res.status(400).json({
          success: false,
          message: `Already registered for this activity (status: ${existingReg.status})`,
        });
      }

      // Check activity exists and registration window
      const activity = await Activity.findById(activity_id);
      if (!activity) {
        return res.status(404).json({
          success: false,
          message: "Activity not found",
        });
      }

      // Check registration window
      const now = new Date();
      if (activity.registration_open && now < activity.registration_open) {
        return res.status(400).json({
          success: false,
          message: "Registration is not yet open for this activity",
        });
      }

      if (activity.registration_close && now > activity.registration_close) {
        return res.status(400).json({
          success: false,
          message: "Registration has closed for this activity",
        });
      }

      // Check capacity
      if (activity.capacity > 0) {
        const approvedCount = await ActivityRegistration.countDocuments({
          activity_id,
          status: "approved",
        });

        const pendingCount = await ActivityRegistration.countDocuments({
          activity_id,
          status: "pending",
        });

        // Nếu không yêu cầu duyệt, chỉ tính approved; ngược lại tính cả pending
        const totalCount = activity.requires_approval
          ? approvedCount + pendingCount
          : approvedCount;

        if (totalCount >= activity.capacity) {
          return res.status(400).json({
            success: false,
            message: "Activity is full",
          });
        }
      }

      // Create registration with appropriate status
      const registration = await ActivityRegistration.create({
        student_id,
        activity_id,
        status: activity.requires_approval ? "pending" : "approved",
        // Auto-approve nếu không yêu cầu duyệt
        ...(activity.requires_approval === false && {
          approved_at: new Date(),
        }),
      });

      await registration.populate({
        path: "student_id",
        populate: { path: "user_id" },
      });
      await registration.populate("activity_id");
      await registration.populate("approved_by");
      await registration.populate("cancelled_by");
      await registration.populate("status_history.changed_by");

      res.status(201).json({
        success: true,
        data: registration,
        message: activity.requires_approval
          ? "Registration pending approval"
          : "Registration approved successfully",
      });
    } catch (err) {
      console.error("Create registration error:", err);
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
          path: "student_id",
          populate: { path: "user_id" },
        })
        .populate("activity_id")
        .populate("approved_by")
        .populate("cancelled_by")
        .populate("status_history.changed_by");

      if (!registration) {
        return res.status(404).json({
          success: false,
          message: "Registration not found",
        });
      }

      res.json({ success: true, data: registration });
    } catch (err) {
      console.error("Update registration error:", err);
      res.status(400).json({ success: false, message: err.message });
    }
  },

  /**
   * API tự động cập nhật status thành "attended" khi attendance được tạo
   * Called internally khi có attendance record
   */
  async markAsAttended(registrationId, attendanceRecordId) {
    try {
      const registration = await ActivityRegistration.findById(registrationId);

      if (!registration) {
        throw new Error("Registration not found");
      }

      // Chỉ cập nhật nếu status là 'approved'
      if (registration.status !== "approved") {
        return;
      }

      registration.status = "attended";
      registration.attendance_record_id = attendanceRecordId;
      registration.changed_by = null; // System change
      registration.change_reason = "Auto-updated by attendance system";

      await registration.save();
    } catch (err) {
      console.error("Mark as attended error:", err);
    }
  },

  async deleteRegistration(req, res) {
    try {
      const registration = await ActivityRegistration.findById(req.params.id);

      if (!registration) {
        return res.status(404).json({
          success: false,
          message: "Registration not found",
        });
      }

      // Validate: không thể hủy registration ở trạng thái 'rejected' hoặc 'attended'
      if (["rejected", "attended"].includes(registration.status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot cancel a ${registration.status} registration`,
        });
      }

      // Hard delete - xóa record khỏi DB (không lưu status cancelled)
      await ActivityRegistration.findByIdAndDelete(req.params.id);

      res.json({
        success: true,
        message: "Registration cancelled successfully",
      });
    } catch (err) {
      console.error("Delete registration error:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async approveRegistration(req, res) {
    try {
      const registration = await ActivityRegistration.findById(req.params.id);

      if (!registration) {
        return res.status(404).json({
          success: false,
          message: "Registration not found",
        });
      }

      // Validate: chỉ có thể duyệt registration ở trạng thái 'pending'
      if (registration.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: `Cannot approve a ${registration.status} registration`,
        });
      }

      // Check capacity before approving
      const activity = await Activity.findById(registration.activity_id);
      if (activity && activity.capacity > 0) {
        const approvedCount = await ActivityRegistration.countDocuments({
          activity_id: registration.activity_id,
          status: "approved",
        });

        if (approvedCount >= activity.capacity) {
          return res.status(400).json({
            success: false,
            message: "Activity is now full, cannot approve more registrations",
          });
        }
      }

      // Update status
      registration.status = "approved";
      registration.approved_by = req.user.id;
      registration.approved_at = new Date();
      registration.changed_by = req.user.id;
      registration.change_reason = "Approved by staff/admin";

      await registration.save();

      await registration.populate({
        path: "student_id",
        populate: { path: "user_id" },
      });
      await registration.populate("activity_id");
      await registration.populate("approved_by");
      await registration.populate("cancelled_by");
      await registration.populate("status_history.changed_by");

      res.json({
        success: true,
        data: registration,
        message: "Registration approved successfully",
      });
    } catch (err) {
      console.error("Approve registration error:", err);
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async rejectRegistration(req, res) {
    try {
      const { approval_note } = req.body;

      if (!approval_note || approval_note.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "approval_note is required when rejecting a registration",
        });
      }

      const registration = await ActivityRegistration.findById(req.params.id);

      if (!registration) {
        return res.status(404).json({
          success: false,
          message: "Registration not found",
        });
      }

      // Validate: chỉ có thể từ chối registration ở trạng thái 'pending'
      if (registration.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: `Cannot reject a ${registration.status} registration`,
        });
      }

      // Update status
      registration.status = "rejected";
      registration.approved_by = req.user.id;
      registration.approved_at = new Date();
      registration.approval_note = approval_note.trim();
      registration.changed_by = req.user.id;
      registration.change_reason = "Rejected by staff/admin";

      await registration.save();

      await registration.populate({
        path: "student_id",
        populate: { path: "user_id" },
      });
      await registration.populate("activity_id");
      await registration.populate("approved_by");
      await registration.populate("cancelled_by");
      await registration.populate("status_history.changed_by");

      res.json({
        success: true,
        data: registration,
        message: "Registration rejected successfully",
      });
    } catch (err) {
      console.error("Reject registration error:", err);
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async getMyRegistrations(req, res) {
    try {
      const { status } = req.query;

      // Get student profile for current user
      const studentProfile = await StudentProfile.findOne({
        user_id: req.user.id,
      });

      if (!studentProfile) {
        return res.status(404).json({
          success: false,
          message: "Student profile not found",
        });
      }

      const filter = { student_id: studentProfile._id };
      if (status) filter.status = status;

      const registrations = await ActivityRegistration.find(filter)
        .populate("activity_id")
        .populate("approved_by")
        .populate("cancelled_by")
        .populate("status_history.changed_by")
        .sort({ createdAt: -1 });

      res.json({ success: true, data: registrations });
    } catch (err) {
      console.error("Get my registrations error:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * API xem tóm tắt status của các đăng ký
   * GET /my-registrations/status-summary
   */
  async getMyRegistrationsStatusSummary(req, res) {
    try {
      // Get student profile for current user
      const studentProfile = await StudentProfile.findOne({
        user_id: req.user.id,
      });

      if (!studentProfile) {
        return res.status(404).json({
          success: false,
          message: "Student profile not found",
        });
      }

      // Group by status
      const summary = await ActivityRegistration.aggregate([
        { $match: { student_id: studentProfile._id } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            registrations: { $push: "$_id" },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]);

      // Map to readable format
      const statusMap = {
        pending: "Chờ duyệt",
        approved: "Đã duyệt",
        rejected: "Bị từ chối",
        attended: "Đã tham gia",
      };

      const result = {
        pending: 0,
        approved: 0,
        rejected: 0,
        attended: 0,
        // Không có status "cancelled" - xóa record khỏi DB
      };

      summary.forEach((item) => {
        result[item._id] = item.count;
      });

      res.json({
        success: true,
        data: {
          summary: result,
          labels: {
            pending: statusMap.pending,
            approved: statusMap.approved,
            rejected: statusMap.rejected,
            cancelled: statusMap.cancelled,
          },
          total: Object.values(result).reduce((a, b) => a + b, 0),
        },
      });
    } catch (err) {
      console.error("Get status summary error:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * API xem chi tiết status 1 đăng ký
   * GET /my-registrations/:id/status-detail
   */
  async getMyRegistrationStatusDetail(req, res) {
    try {
      const { id } = req.params;

      // Get student profile for current user
      const studentProfile = await StudentProfile.findOne({
        user_id: req.user.id,
      });

      if (!studentProfile) {
        return res.status(404).json({
          success: false,
          message: "Student profile not found",
        });
      }

      const registration = await ActivityRegistration.findOne({
        _id: id,
        student_id: studentProfile._id,
      })
        .populate({
          path: "activity_id",
          select: "title description start_time end_time requires_approval",
        })
        .populate({
          path: "approved_by",
          select: "username",
        })
        .populate({
          path: "cancelled_by",
          select: "username",
        })
        .populate({
          path: "status_history.changed_by",
          select: "username",
        });

      if (!registration) {
        return res.status(404).json({
          success: false,
          message: "Registration not found",
        });
      }

      // Format response
      const statusMap = {
        pending: {
          text: "Chờ duyệt",
          color: "warning",
          icon: "clock",
          message:
            "Hoạt động yêu cầu duyệt. Vui lòng chờ quản lý duyệt đơn của bạn.",
        },
        approved: {
          text: "Đã duyệt",
          color: "success",
          icon: "check",
          message: "Bạn đã được duyệt. Vui lòng tham gia hoạt động đúng giờ.",
        },
        rejected: {
          text: "Bị từ chối",
          color: "danger",
          icon: "times",
          message: `Đơn của bạn bị từ chối: ${
            registration.approval_note || "Không có lý do"
          }`,
        },
        cancelled: {
          text: "Đã hủy",
          color: "secondary",
          icon: "ban",
          message: `Bạn đã hủy đơn: ${registration.cancellation_reason || ""}`,
        },
      };

      const currentStatusInfo =
        statusMap[registration.status] || statusMap.pending;

      res.json({
        success: true,
        data: {
          registration_id: registration._id,
          activity: {
            id: registration.activity_id._id,
            title: registration.activity_id.title,
            description: registration.activity_id.description,
            start_time: registration.activity_id.start_time,
            end_time: registration.activity_id.end_time,
            requires_approval: registration.activity_id.requires_approval,
          },
          status: {
            current: registration.status,
            text: currentStatusInfo.text,
            color: currentStatusInfo.color,
            icon: currentStatusInfo.icon,
            message: currentStatusInfo.message,
          },
          timeline: {
            registered_at: registration.registered_at,
            approved_at: registration.approved_at,
            rejected_at: registration.approved_at,
            cancelled_at: registration.cancelled_at,
            approved_by: registration.approved_by?.username,
            cancelled_by: registration.cancelled_by?.username,
          },
          history: registration.status_history?.map((h) => ({
            status: h.status,
            changed_at: h.changed_at,
            changed_by: h.changed_by?.username || "System",
            reason: h.reason,
          })),
        },
      });
    } catch (err) {
      console.error("Get status detail error:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * API xem chi tiết status dùng studentId (không cần auth)
   * GET /registrations/student/:studentId/status-detail/:registrationId
   */
  async getRegistrationStatusDetailByStudentId(req, res) {
    try {
      const { studentId, registrationId } = req.params;

      // Kiểm tra StudentProfile tồn tại
      const studentProfile = await StudentProfile.findById(studentId);
      if (!studentProfile) {
        return res.status(404).json({
          success: false,
          message: "Student profile not found",
        });
      }

      // Tìm registration của sinh viên
      const registration = await ActivityRegistration.findOne({
        _id: registrationId,
        student_id: studentId,
      })
        .populate({
          path: "activity_id",
          select: "title description start_time end_time requires_approval",
        })
        .populate({
          path: "approved_by",
          select: "username",
        })
        .populate({
          path: "cancelled_by",
          select: "username",
        })
        .populate({
          path: "status_history.changed_by",
          select: "username",
        });

      if (!registration) {
        return res.status(404).json({
          success: false,
          message: "Registration not found for this student",
        });
      }

      // Format response
      const statusMap = {
        pending: {
          text: "Chờ duyệt",
          color: "warning",
          icon: "clock",
          message:
            "Hoạt động yêu cầu duyệt. Vui lòng chờ quản lý duyệt đơn của bạn.",
        },
        approved: {
          text: "Đã duyệt",
          color: "success",
          icon: "check",
          message: "Bạn đã được duyệt. Vui lòng tham gia hoạt động đúng giờ.",
        },
        rejected: {
          text: "Bị từ chối",
          color: "danger",
          icon: "times",
          message: `Đơn của bạn bị từ chối: ${
            registration.approval_note || "Không có lý do"
          }`,
        },
        cancelled: {
          text: "Đã hủy",
          color: "secondary",
          icon: "ban",
          message: `Bạn đã hủy đơn: ${registration.cancellation_reason || ""}`,
        },
      };

      const currentStatusInfo =
        statusMap[registration.status] || statusMap.pending;

      res.json({
        success: true,
        data: {
          registration_id: registration._id,
          student_id: studentId,
          activity: {
            id: registration.activity_id._id,
            title: registration.activity_id.title,
            description: registration.activity_id.description,
            start_time: registration.activity_id.start_time,
            end_time: registration.activity_id.end_time,
            requires_approval: registration.activity_id.requires_approval,
          },
          status: {
            current: registration.status,
            text: currentStatusInfo.text,
            color: currentStatusInfo.color,
            icon: currentStatusInfo.icon,
            message: currentStatusInfo.message,
          },
          timeline: {
            registered_at: registration.createdAt,
            approved_at: registration.approved_at,
            rejected_at: registration.approved_at,
            cancelled_at: registration.cancelled_at,
            approved_by: registration.approved_by?.username,
            cancelled_by: registration.cancelled_by?.username,
          },
          history: registration.status_history?.map((h) => ({
            status: h.status,
            changed_at: h.changed_at,
            changed_by: h.changed_by?.username || "System",
            reason: h.reason,
          })),
        },
      });
    } catch (err) {
      console.error("Get registration status detail error:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },
};
