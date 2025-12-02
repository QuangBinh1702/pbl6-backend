# 📱 HỆ THỐNG ĐIỂM DANH QR CODE - TỔNG HỢP

**Cập nhật:** 2025-01-15  
**Phiên bản:** 2.0  
**Trạng thái:** ✅ Hoạt động

---

## 🎯 TỔNG QUAN

Hệ thống điểm danh QR code cho phép:
- **Admin/Staff** tạo mã QR on-demand (bất kỳ lúc nào)
- **Sinh viên** quét QR code → hiển thị form nhập thông tin
- **Hệ thống** tự động tính điểm dựa trên số lần quét QR
- **Admin/Staff** duyệt/từ chối điểm danh

---

## 🔄 QUY TRÌNH HOẠT ĐỘNG

```
┌─────────────────────────────────────────────────────────┐
│ 1. ADMIN TẠO QR CODE                                    │
│    └─ POST /api/attendances/generate-qr                 │
│       └─ QR chứa URL: /qr-attendance-form.html?        │
│          activity_id=...&qr_code_id=...                 │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 2. SINH VIÊN QUÉT QR                                    │
│    └─ Mở form: qr-attendance-form.html                 │
│       └─ Điền thông tin: Tên, MSSV, Khoa, Lớp          │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 3. SINH VIÊN SUBMIT FORM                                │
│    └─ POST /api/attendances/submit-attendance           │
│       └─ Hệ thống tính điểm động                        │
│       └─ Status: "pending" (chờ duyệt)                  │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 4. ADMIN/STAFF DUYỆT                                    │
│    └─ PUT /api/attendances/:id/approve                   │
│       └─ Status: "approved" + points_earned              │
│    └─ PUT /api/attendances/:id/reject                   │
│       └─ Status: "rejected"                             │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 CÔNG THỨC TÍNH ĐIỂM ĐỘNG

### Công thức:
```
Điểm = min(
  floor((scan_order / total_qr_at_scan) * max_points),
  max_points
)
```

### Giải thích:
- **scan_order**: Lần quét thứ mấy của sinh viên (1, 2, 3...)
- **total_qr_at_scan**: Tổng số QR code đã tạo khi quét
- **max_points**: Điểm tối đa của hoạt động (mặc định: 10)

### Ví dụ:
| Lần quét | Tổng QR | Max điểm | Công thức | Kết quả |
|----------|---------|----------|-----------|---------|
| 1 | 1 | 10 | (1/1) * 10 | **10 điểm** |
| 1 | 2 | 10 | (1/2) * 10 | **5 điểm** |
| 2 | 2 | 10 | (2/2) * 10 | **10 điểm** |
| 1 | 3 | 10 | (1/3) * 10 | **3 điểm** |
| 2 | 3 | 10 | (2/3) * 10 | **6 điểm** |
| 3 | 3 | 10 | (3/3) * 10 | **10 điểm** |

---

## 🔌 API ENDPOINTS

### 1. Tạo QR Code (Admin/Staff)
```http
POST /api/attendances/generate-qr
Authorization: Bearer <admin_or_staff_token>
Content-Type: application/json

Body:
{
  "activity_id": "672a5c3f...",
  "qr_name": "Điểm danh lần 1",
  "duration_minutes": 60  // Optional: QR hết hạn sau 60 phút
}

Response:
{
  "success": true,
  "data": {
    "qr_id": "...",
    "qr_name": "Điểm danh lần 1",
    "qr_code": "data:image/png;base64,...",
    "total_qr_created": 1,
    "expires_at": "2025-01-15T15:30:00Z"
  }
}
```

### 2. Xem danh sách QR của hoạt động
```http
GET /api/attendances/activity/:activity_id/qr-codes
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "current": {
      "qr_id": "...",
      "qr_name": "Điểm danh lần 1",
      "qr_code": "data:image/png;base64,...",
      "scans_count": 23,
      "is_active": true
    },
    "history": [
      { qr_id, qr_name, created_at, scans_count, is_active }
    ]
  }
}
```

### 3. Submit điểm danh (Sinh viên)
```http
POST /api/attendances/submit-attendance
Authorization: Bearer <student_token>
Content-Type: application/json

Body:
{
  "activity_id": "672a5c3f...",
  "session_id": "672a5d7f...",  // = qr_code_id
  "student_info": {
    "student_id_number": "20001",
    "student_name": "Nguyễn Văn A",
    "class": "672a5e8f...",  // ObjectId của Class
    "faculty": "672a5f9f...", // ObjectId của Faculty
    "phone": "0123456789",    // Optional
    "notes": "Ghi chú"        // Optional, max 500 chars
  }
}

Response:
{
  "success": true,
  "message": "✅ Điểm danh thành công! Lần 1/3 - 3 điểm",
  "data": {
    "scan_order": 1,
    "total_qr_at_scan": 3,
    "points_earned": 3,
    "attendance_id": "..."
  },
  "warnings": null  // hoặc { class_mismatch: true, ... }
}
```

### 4. Xem danh sách chờ duyệt (Admin/Staff)
```http
GET /api/attendances/pending?activity_id=...
Authorization: Bearer <admin_or_staff_token>

Response:
{
  "success": true,
  "total": 45,
  "data": [
    {
      "_id": "...",
      "student_info": {
        "student_id_number": "20001",
        "student_name": "Nguyễn Văn A",
        "class": { "name": "12A1" },
        "faculty": { "name": "IT" }
      },
      "status": "pending",
      "scan_order": 1,
      "points_earned": 3
    }
  ]
}
```

### 5. Duyệt điểm danh (Admin/Staff)
```http
PUT /api/attendances/:id/approve
Authorization: Bearer <admin_or_staff_token>
Content-Type: application/json

Body:
{
  "verified_comment": "Đúng khối lượng hoạt động"
}

Response:
{
  "success": true,
  "data": {
    "status": "approved",
    "points_earned": 3,
    "verified_by": "admin_id",
    "verified_at": "2025-01-15T14:30:00Z"
  }
}
```

### 6. Từ chối điểm danh (Admin/Staff)
```http
PUT /api/attendances/:id/reject
Authorization: Bearer <admin_or_staff_token>
Content-Type: application/json

Body: POST /api/activities/:id/register
{
  "rejection_reason": "DUPLICATE",
  "verified_comment": "Đã điểm danh rồi"
}

Response:
{
  "success": true,
  "data": {
    "status": "rejected",
    "rejection_reason": "DUPLICATE"
  }
}
```

### 7. Xuất Excel danh sách chờ duyệt
```http
GET /api/attendances/export-pending?activity_id=...
Authorization: Bearer <admin_or_staff_token>

Response: Excel file (.xlsx)
```

### 8. Lấy dữ liệu master (Classes, Faculties)
```http
GET /api/attendances/master-data
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "classes": [
      { "_id": "...", "name": "12A1", "faculty": { "name": "IT" } }
    ],
    "faculties": [
      { "_id": "...", "name": "IT" }
    ]
  }
}
```

---

## 🗄️ DATABASE SCHEMA

### QRCode Collection
```javascript
{
  _id: ObjectId,
  activity_id: ObjectId (ref: Activity),
  qr_name: String,              // "Điểm danh lần 1"
  qr_data: String,              // JSON: {activityId, qrId, createdAt, expiresAt}
  qr_code: String,              // Base64 PNG image
  created_by: ObjectId (ref: User),
  created_at: Date,
  expires_at: Date,             // Optional
  is_active: Boolean,
  scans_count: Number
}
```

### Attendance Collection
```javascript
{
  _id: ObjectId,
  student_id: ObjectId (ref: StudentProfile),
  activity_id: ObjectId (ref: Activity),
  qr_code_id: ObjectId (ref: QRCode),  // QR nào được quét
  
  // Thông tin tính điểm động
  scan_order: Number,                  // Lần quét thứ mấy
  total_qr_at_scan: Number,            // Tổng QR khi quét
  points_earned: Number,               // Điểm đã tính
  
  // Thông tin sinh viên từ form
  student_info: {
    student_id_number: String,          // MSSV (5-6 chữ số)
    student_name: String,
    class: ObjectId (ref: Class),
    faculty: ObjectId (ref: Faculty),
    phone: String,                     // Optional
    notes: String,                     // Optional, max 500
    submitted_at: Date
  },
  
  // Cảnh báo
  student_info_flags: {
    class_mismatch: Boolean,           // Lớp khác với đăng ký
    registered_class: ObjectId,
    student_in_system: Boolean
  },
  
  // Trạng thái
  status: String,                      // 'pending', 'approved', 'rejected'
  verified_by: ObjectId (ref: User),
  verified_at: Date,
  rejection_reason: String,
  verified_comment: String,
  
  scanned_at: Date
}
```

### Activity Collection (Updated)
```javascript
{
  _id: ObjectId,
  title: String,
  // ... các field khác
  
  // 🆕 Dynamic QR Scoring
  total_qr_created: Number,             // Tổng QR đã tạo
  max_points: Number                    // Điểm tối đa (default: 10)
}
```

---

## ✅ VALIDATION RULES

### Form Submission
- **MSSV**: 5-6 chữ số (`/^\d{5,6}$/`)
- **Tên sinh viên**: Required, max 100 ký tự
- **Lớp**: Phải tồn tại trong database
- **Khoa**: Phải tồn tại trong database
- **Phone**: Format Việt Nam (`/^(0|\+84)\d{9,10}$/`) - Optional
- **Notes**: Max 500 ký tự - Optional

### QR Code Validation
- ✅ QR code phải tồn tại
- ✅ QR code phải active (`is_active = true`)
- ✅ QR code chưa hết hạn (nếu có `expires_at`)
- ✅ Sinh viên chưa quét QR này (duplicate prevention)
- ✅ Sinh viên đã đăng ký hoạt động (status = 'approved')

### Permission Requirements
- **Tạo QR Code**: Cần permission `activity:CREATE` (Admin/Staff)
- **Duyệt/Từ chối điểm danh**: Cần permission `attendance:VERIFY` (Admin/Staff)
- **Xem danh sách chờ duyệt**: Cần permission `attendance:READ` (Admin/Staff)
- **Xuất Excel**: Cần permission `attendance:EXPORT` (Admin/Staff)

---

## 🎨 FRONTEND

### Form điểm danh
**File:** `backend/public/qr-attendance-form.html`

**URL:** `/qr-attendance-form.html?activity_id=...&qr_code_id=...`

**Fields:**
- Tên sinh viên * (required)
- MSSV * (required, 5-6 digits)
- Khoa * (dropdown từ API)
- Lớp * (dropdown từ API, filter theo Khoa)
- Số điện thoại (optional)
- Ghi chú (optional, max 500 chars)

**Features:**
- Auto-load master data (classes, faculties)
- Real-time validation
- Warning messages (class mismatch)
- Success/error feedback

### QR Manager (Admin/Staff)
**File:** `backend/public/qr-manager.html`

**Features:**
- Chọn hoạt động
- Xem QR hiện tại
- Tạo QR mới
- Xem lịch sử QR
- Copy/Print QR
- Set expiry time

### Admin/Staff Dashboard
**File:** `backend/public/admin-attendance.html`

**Features:**
- Danh sách chờ duyệt
- Filter theo activity/session
- Approve/Reject với comment
- Export Excel
- Warning indicators (class mismatch)

---

## 🧪 TESTING

### Test Case 1: Tạo QR Code
```bash
POST /api/attendances/generate-qr
Body: { "activity_id": "...", "qr_name": "QR 1" }

Expected:
- QR code được tạo
- total_qr_created = 1
- QR image (Base64) trả về
```

### Test Case 2: Quét QR và Submit
```bash
1. Quét QR → Form hiện
2. Điền form đầy đủ
3. Submit

Expected:
- Status = "pending"
- scan_order = 1
- total_qr_at_scan = 1
- points_earned = 10 (nếu max_points = 10, 1 QR)
```

### Test Case 3: Quét nhiều QR
```bash
1. Tạo QR 1 → total_qr = 1
2. Sinh viên quét QR 1 → points = 10
3. Tạo QR 2 → total_qr = 2
4. Sinh viên quét QR 2 → points = 10 (2/2)

Expected:
- Điểm tăng dần theo số lần quét
- Mỗi QR chỉ quét được 1 lần
```

### Test Case 4: Duplicate Prevention
```bash
1. Sinh viên quét QR 1
2. Sinh viên quét lại QR 1

Expected:
- Error: "Bạn đã quét QR này rồi"
- Không tạo attendance mới
```

### Test Case 5: QR Expiry
```bash
1. Tạo QR với duration_minutes = 1
2. Đợi 2 phút
3. Quét QR

Expected:
- Error: "QR code has expired"
```

---

## 🐛 TROUBLESHOOTING

### Lỗi: `total_qr_created` không tăng
**Nguyên nhân:** Logic trong `generateQRCode()` chưa được gọi  
**Giải pháp:** Kiểm tra `activity.total_qr_created++` và `await activity.save()`

### Lỗi: Điểm tính sai
**Nguyên nhân:** `scan_order` hoặc `total_qr_at_scan` lấy sai  
**Giải pháp:** Kiểm tra logic đếm trong `submitAttendance()`

### Lỗi: Form không load Khoa/Lớp
**Nguyên nhân:** API `/api/attendances/master-data` không hoạt động  
**Giải pháp:** Kiểm tra endpoint và CORS config

### Lỗi: QR code không redirect đến form
**Nguyên nhân:** URL trong QR code sai format  
**Giải pháp:** Kiểm tra `formUrl` trong `generateQRCode()`

---

## 📋 CHECKLIST TRƯỚC KHI DEPLOY

### Backend
- [ ] `generateQRCode()` tăng `total_qr_created`
- [ ] `submitAttendance()` tính điểm đúng
- [ ] Duplicate check hoạt động
- [ ] Expiry check hoạt động
- [ ] Registration check hoạt động

### Frontend
- [ ] Form load được Khoa/Lớp
- [ ] Form submit thành công
- [ ] Hiển thị điểm sau khi submit
- [ ] Error handling đúng

### Database
- [ ] Attendance records có đầy đủ fields
- [ ] `scan_order`, `total_qr_at_scan`, `points_earned` được lưu đúng
- [ ] `total_qr_created` trong Activity tăng đúng

---

## 📚 TÀI LIỆU THAM KHẢO

### Files quan trọng
- `HUONG_DAN_TEST_QR_DIEM_DANH.md` - Hướng dẫn test chi tiết
- `DANH_GIA_HE_THONG_QR_DIEM_DANH.md` - Đánh giá hệ thống
- `QR_ATTENDANCE_SUBMIT_FLOW.md` - Flow submit chi tiết
- `QR_CODE_ATTENDANCE_GUIDE.md` - Hướng dẫn đầy đủ
- `PHASE2_PHASE2.5_HANDOFF.md` - Tổng hợp Phase 2 & 2.5

### Code files
- `backend/src/controllers/attendance.controller.js` - Logic chính
- `backend/src/models/qr_code.model.js` - QR Code model
- `backend/src/models/attendance.model.js` - Attendance model
- `backend/public/qr-attendance-form.html` - Form điểm danh
- `backend/public/qr-manager.html` - QR Manager

---

## 🚀 DEMO FLOW HOÀN CHỈNH

1. **Admin tạo hoạt động** → Có `activity_id`
2. **Admin tạo QR code 1** → `total_qr_created = 1`
3. **Admin tạo QR code 2** → `total_qr_created = 2`
4. **Sinh viên đăng ký hoạt động** → Status = 'approved'
5. **Sinh viên quét QR 1** → Form hiện → Submit → Điểm = 5 (1/2 * 10)
6. **Sinh viên quét QR 2** → Form hiện → Submit → Điểm = 10 (2/2 * 10)
7. **Sinh viên quét lại QR 1** → Error: "Đã quét rồi"
8. **Admin/Staff duyệt** → Status = 'approved', points_earned được lưu

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề, kiểm tra:
1. Console logs trong backend
2. Network tab trong browser
3. MongoDB collections: `activity`, `attendance`, `qr_codes`
4. Token authentication

**Chúc bạn sử dụng hệ thống thành công! 🎉**

---

**Cập nhật lần cuối:** 2025-01-15  
**Phiên bản:** 2.0  
**Trạng thái:** ✅ Production Ready

