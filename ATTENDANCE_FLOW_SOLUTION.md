# 📋 Quy trình Điểm Danh với Duyệt (Attendance Verification Flow)

## 🎯 Yêu cầu
1. Quét QR → lấy dữ liệu từ QR
2. Hiển thị form điền thông tin (tên lớp, khoa, MSSV...)
3. Bấm gửi → lưu submission
4. Admin duyệt → chấp nhận hoặc từ chối

---

## 🔄 Workflow Đề xuất

```
┌─────────────────────────────────────────────────────────────────┐
│                     SINH VIÊN (Mobile/Web)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1️⃣  SCAN QR                                                     │
│      ↓                                                            │
│      [QR Scanner / Paste QR Data]                               │
│      ↓                                                            │
│  2️⃣  SHOW FORM (Auto-fill từ QR)                               │
│      ├─ Activity Name (readonly)                                │
│      ├─ Session Name (readonly)                                 │
│      ├─ Student ID (auto từ token)                              │
│      ├─ Class (dropdown / text)    ← USER INPUT                │
│      ├─ Faculty (dropdown)         ← USER INPUT                │
│      ├─ Phone (optional)            ← USER INPUT                │
│      └─ Notes (optional)            ← USER INPUT                │
│      ↓                                                            │
│  3️⃣  SUBMIT                                                      │
│      ↓                                                            │
│      POST /api/attendances/submit-attendance                    │
│      Body: { qr_data, class, faculty, phone, notes }           │
│      ↓                                                            │
│  Status: 🟡 PENDING (chờ duyệt)                                │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE (MongoDB)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Collection: attendance                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ {                                                         │   │
│  │   _id: ObjectId,                                         │   │
│  │   student_id: "...",                                     │   │
│  │   activity_id: "...",                                    │   │
│  │   session_id: "...",                                     │   │
│  │   status: "pending",  ← 🟡 Chờ duyệt                    │   │
│  │   scanned_at: Date,                                      │   │
│  │                                                           │   │
│  │   // ← NEW: Thông tin điền vào từ form                  │   │
│  │   student_info: {                                        │   │
│  │     class: "12A1",        ← Lớp                         │   │
│  │     faculty: "Công Nghệ", ← Khoa                        │   │
│  │     phone: "0123456789",  ← SĐT                         │   │
│  │     notes: "..."          ← Ghi chú                     │   │
│  │   },                                                      │   │
│  │                                                           │   │
│  │   // ← Verification fields                              │   │
│  │   verified: false,                                       │   │
│  │   verified_by: null,  ← Admin ID (sau khi duyệt)       │   │
│  │   verified_at: null,  ← Thời gian duyệt                │   │
│  │   rejection_reason: null,  ← Lý do từ chối             │   │
│  │   verified_comment: null   ← Nhận xét từ staff         │   │
│  │ }                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN/STAFF (Dashboard)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  📊 ADMIN DASHBOARD                                             │
│  ├─ List pending attendances (chờ duyệt)                       │
│  ├─ Filter by activity, session, class                         │
│  │                                                              │
│  │  [Row 1] Student1 - Class 12A1 - Faculty IT                │
│  │          [✅ APPROVE] [❌ REJECT] [📝 View Details]        │
│  │          Status: 🟡 Pending                                │
│  │                                                              │
│  │  [Row 2] Student2 - Class 12B2 - Faculty Business          │
│  │          [✅ APPROVE] [❌ REJECT] [📝 View Details]        │
│  │          Status: 🟡 Pending                                │
│  │                                                              │
│  └─ Approved list (đã duyệt)                                  │
│  └─ Rejected list (từ chối)                                   │
│                                                                  │
│  4️⃣  APPROVE / REJECT                                          │
│      ↓                                                           │
│      PUT /api/attendances/:id/approve                          │
│      or                                                         │
│      PUT /api/attendances/:id/reject                          │
│      ↓                                                           │
│  ✅ APPROVED: points_earned = calculated                       │
│  ❌ REJECTED: status = rejected, reason stored                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema Changes

### 1. Update Attendance Model

```javascript
const attendanceSchema = new mongoose.Schema({
  student_id: mongoose.Schema.Types.ObjectId,
  activity_id: mongoose.Schema.Types.ObjectId,
  
  // ... existing fields ...
  
  // ← NEW: Student submitted info
  student_info: {
    class: String,           // Lớp: 12A1, 12B2, ...
    faculty: String,         // Khoa: IT, Business, ...
    phone: String,           // Số điện thoại
    notes: String            // Ghi chú thêm
  },
  
  // ← UPDATED: Verification workflow
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'present', 'absent'],
    default: 'pending'  // 🟡 Chờ duyệt
  },
  
  verified: Boolean,
  verified_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'         // Staff/Admin duyệt
  },
  verified_at: Date,
  
  // ← Rejection details
  rejection_reason: String,    // Lý do từ chối
  verified_comment: String     // Nhận xét/ghi chú của staff
});
```

---

## 🔌 API Endpoints Cần Tạo

### 1. Submit Attendance with Form Data
```http
POST /api/attendances/submit-attendance
Authorization: Bearer TOKEN

{
  "activity_id": "...",
  "session_id": "...",
  "student_info": {
    "class": "12A1",
    "faculty": "Công Nghệ",
    "phone": "0123456789",
    "notes": "Đi trễ 5 phút"
  }
}

Response:
{
  "success": true,
  "data": {
    "_id": "...",
    "status": "pending",  // 🟡 Chờ duyệt
    "message": "Attendance submitted. Waiting for approval."
  }
}
```

### 2. Admin: Get Pending Attendances
```http
GET /api/attendances/pending?activity_id=...&session_id=...
Authorization: Bearer TOKEN (admin only)

Response:
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "student_id": {
        "user_id": "...",
        "full_name": "Nguyễn Văn A"
      },
      "activity_id": { "title": "Event" },
      "session_id": { "name": "Mid-Session" },
      "student_info": {
        "class": "12A1",
        "faculty": "IT",
        "phone": "0123..."
      },
      "status": "pending",
      "scanned_at": "2025-11-28T15:00:00Z"
    }
  ]
}
```

### 3. Admin: Approve Attendance
```http
PUT /api/attendances/:id/approve
Authorization: Bearer TOKEN (admin only)

{
  "verified_comment": "Đúng khối lượng hoạt động"
}

Response:
{
  "success": true,
  "data": {
    "status": "approved",  // ✅ Duyệt rồi
    "verified": true,
    "points_earned": 5,
    "verified_by": "admin_id",
    "verified_at": "2025-11-28T15:05:00Z"
  }
}
```

### 4. Admin: Reject Attendance
```http
PUT /api/attendances/:id/reject
Authorization: Bearer TOKEN (admin only)

{
  "rejection_reason": "Không có xác nhận từ công ty"
}

Response:
{
  "success": true,
  "data": {
    "status": "rejected",  // ❌ Từ chối
    "rejection_reason": "Không có xác nhận từ công ty",
    "verified_by": "admin_id",
    "verified_at": "2025-11-28T15:05:00Z"
  }
}
```

---

## 🟢 Status Flow

```
📱 Student Side:
  pending ← SUBMIT QR + FORM
    ↓
  (waiting for admin review...)

👨‍💼 Admin Side:
  pending → APPROVE ✅ → approved (save points, mark as present)
         → REJECT ❌ → rejected (zero points, mark as absent)
```

---

## 🛠️ Implementation Steps

### Phase 1: Database (10 min)
- ✅ Update Attendance model với `student_info`, `verified_by`, `rejection_reason`

### Phase 2: Backend API (15 min)
1. Controller: `submitAttendance()` - lưu form + set status = pending
2. Controller: `approveAttendance()` - update status, calculate points
3. Controller: `rejectAttendance()` - update status, rejection_reason
4. Controller: `getPendingAttendances()` - list chờ duyệt
5. Routes: POST/PUT endpoints

### Phase 3: Test Page (10 min)
1. After QR scan → show form (class, faculty, phone, notes)
2. Submit form → call `submitAttendance` API
3. Show pending status

### Phase 4: Admin Dashboard (20 min)
1. Dashboard to list pending attendances
2. Approve/Reject buttons
3. Real-time status update

---

## 💡 Benefits

| Điểm | Lợi ích |
|------|---------|
| **Transparency** | Sinh viên biết trạng thái submission |
| **Data Verification** | Staff duyệt thông tin trước tính points |
| **Audit Trail** | Lưu ai duyệt, khi nào, lý do từ chối |
| **Flexibility** | Thay đổi status sau khi duyệt được |
| **Anti-Fraud** | Ngăn điểm danh giả mạo |

---

## 📝 Approval Reasons (Reject Templates)

```javascript
const REJECTION_REASONS = {
  MISSING_INFO: "Thông tin không đủ",
  INVALID_CLASS: "Lớp không tồn tại",
  DUPLICATE: "Đã điểm danh phiên này rồi",
  NOT_PARTICIPANT: "Không phải thành viên activity",
  OUT_OF_TIME: "Quét ngoài thời gian cho phép",
  NO_EVIDENCE: "Không có bằng chứng"
};
```

---

## 🎯 Workflow Summary

| Bước | Người | Hành động | Status |
|------|-------|----------|--------|
| 1 | Sinh viên | Quét QR | - |
| 2 | Sinh viên | Điền form (class, faculty...) | - |
| 3 | Sinh viên | Bấm Submit | 🟡 pending |
| 4 | Admin | Xem danh sách pending | 🟡 pending |
| 5 | Admin | Duyệt hoặc từ chối | ✅ approved / ❌ rejected |
| 6 | System | Tính points (nếu approved) | ✅ present + points |

---

## ❓ FAQs

**Q: Điểm danh như thế nào nếu status = pending?**  
A: Chỉ tính points khi `status = approved`. Pending thì chưa tính.

**Q: Nếu từ chối thì sao?**  
A: `points_earned = 0`, `status = rejected`, không tính vào điểm danh.

**Q: Có thể thay đổi sau duyệt không?**  
A: Có, admin có thể approve rồi reject lại nếu cần (revoke approval).

**Q: Dữ liệu form có validate không?**  
A: Có, backend validate class, faculty, phone format.

---

**Ready to implement?** Bạn muốn tôi bắt đầu từ đâu?
