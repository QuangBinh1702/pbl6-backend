const mongoose = require("mongoose");

const activityRegistrationSchema = new mongoose.Schema(
  {
    activity_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Activity",
      required: true,
    },
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
    },
    registered_at: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
    },
    approval_note: String,
    approved_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approved_at: Date,
    // Audit trail: lịch sử thay đổi status
    status_history: [
      {
        status: {
          type: String,
          enum: ["pending", "approved", "rejected", "cancelled"],
        },
        changed_at: {
          type: Date,
          default: Date.now,
        },
        changed_by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        reason: String,
      },
    ],
    // Lý do hủy (nếu status = cancelled)
    cancellation_reason: String,
    cancelled_at: Date,
    cancelled_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Index for faster queries
activityRegistrationSchema.index({ activity_id: 1 });
activityRegistrationSchema.index({ student_id: 1 });
activityRegistrationSchema.index({ status: 1 });
activityRegistrationSchema.index({ registered_at: -1 });

// Prevent duplicate registrations (active ones)
activityRegistrationSchema.index(
  { activity_id: 1, student_id: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { status: { $ne: "cancelled" } },
  }
);

/**
 * ===== VALIDATION RULES =====
 * 1. pending → approved (chỉ admin/staff)
 * 2. pending → rejected (chỉ admin/staff, có approval_note)
 * 3. pending/approved → cancelled (sinh viên hoặc admin)
 * 4. rejected → không thể chuyển trạng thái
 * 5. cancelled → không thể chuyển trạng thái
 */

// Pre-save hook: Validate state transitions
activityRegistrationSchema.pre("save", async function (next) {
  // Nếu là lần đầu tạo, bỏ qua validation
  if (this.isNew) {
    // Thêm vào status_history khi tạo mới
    this.status_history = [
      {
        status: this.status,
        changed_at: new Date(),
        changed_by: null,
        reason: "Initial registration",
      },
    ];
    return next();
  }

  // Nếu status không thay đổi, bỏ qua
  if (!this.isModified("status")) {
    return next();
  }

  const oldStatus = this.constructor.findById(this._id).select("status");

  // Validate transitions
  const validTransitions = {
    pending: ["approved", "rejected", "cancelled"],
    approved: ["cancelled"],
    rejected: [],
    cancelled: [],
  };

  const old = await oldStatus;
  if (old && !validTransitions[old.status].includes(this.status)) {
    return next(
      new Error(`Cannot transition from ${old.status} to ${this.status}`)
    );
  }

  // rejected/cancelled không được phép chuyển trạng thái
  if (["rejected", "cancelled"].includes(old.status)) {
    return next(
      new Error(`Cannot change status of ${old.status} registration`)
    );
  }

  // Nếu chuyển sang 'rejected', phải có approval_note
  if (this.status === "rejected" && !this.approval_note) {
    return next(
      new Error("approval_note is required when rejecting a registration")
    );
  }

  // Nếu chuyển sang 'cancelled', ghi lại thông tin hủy
  if (this.status === "cancelled") {
    this.cancelled_at = new Date();
  }

  // Cập nhật status_history
  if (!this.status_history) {
    this.status_history = [];
  }
  this.status_history.push({
    status: this.status,
    changed_at: new Date(),
    changed_by: this.changed_by || null,
    reason: this.change_reason || null,
  });

  next();
});

module.exports = mongoose.model(
  "ActivityRegistration",
  activityRegistrationSchema,
  "activity_registration"
);
