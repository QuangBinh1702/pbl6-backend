# 📋 QR Attendance Form Submit Flow - Detailed Guide

**Date:** Nov 30, 2025  
**Version:** 1.0  
**Status:** Implementation Complete

---

## 🎯 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                   STUDENT SCANS QR CODE                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Form Loads: qr-attendance-form.html?activity_id=xxx&qr_code_id=yyy
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│           FRONTEND: validateQRCodeOnLoad()                       │
│  POST /attendances/validate-qr { qr_code_id }                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────┴─────────┐
                    ↓                   ↓
            ❌ EXPIRED/INVALID      ✅ VALID
            Redirect to /404       Continue Form
                                      ↓
                        ┌─────────────────────────────┐
                        │  predictPoints() [OPTIONAL]  │
                        │  Fetch Activity details      │
                        │  Show: Total QR, Predicted   │
                        └─────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│        STUDENT FILLS FORM & CLICKS "Nộp Điểm Danh"             │
│                                                                 │
│  Fields:                                                        │
│  - Tên sinh viên (required) *🆕                                │
│  - MSSV (required)                                             │
│  - Khoa (required)                                             │
│  - Lớp (required)                                              │
│  - Số điện thoại (optional)                                    │
│  - Ghi chú (optional)                                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│         FRONTEND: handleSubmit()                                │
│                                                                 │
│  Validation:                                                    │
│  ✓ All required fields filled                                 │
│  ✓ MSSV: 5-6 digits only                                      │
│  ✓ Phone: VN format (0xxxxxxxxx)                              │
│  ✓ Notes: max 500 chars                                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────┴─────────────────┐
        ↓                                       ↓
    ❌ VALIDATION FAIL              ✅ VALIDATION PASS
    Show error message             Show loading spinner
                                        ↓
                        ┌─────────────────────────────┐
                        │  POST /attendances/submit-attendance
                        │
                        │  Body: {
                        │    activity_id: "...",
                        │    session_id: "qr_code_id",
                        │    student_info: {
                        │      student_id_number: "20001",
                        │      student_name: "Nguyễn A", *🆕
                        │      class: ObjectId,
                        │      faculty: ObjectId,
                        │      phone: "0123456789",
                        │      notes: "..."
                        │    }
                        │  }
                        └─────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│      BACKEND: submitAttendance() - VALIDATION LAYER 1           │
│                                                                 │
│  ✓ Activity exists?                                            │
│  ✓ QR Code exists?                                             │
│  ✓ QR Code active?                                             │
│  ✓ QR Code NOT expired?                                        │
│  ✓ Student NOT scanned this QR before? (DUPLICATE CHECK)      │
│  ✓ Class exists in DB?                                        │
│  ✓ Faculty exists in DB?                                      │
│  ✓ Student registered this activity?                          │
│  ✓ Phone format valid?                                        │
│  ✓ Notes length <= 500 chars?                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────┴─────────┐
                    ↓                   ↓
            ❌ VALIDATION FAIL      ✅ ALL PASS
            Return error 400       Continue to calculate
                                        ↓
┌─────────────────────────────────────────────────────────────────┐
│      BACKEND: Calculate Points (Dynamic Scoring)               │
│                                                                 │
│  Step 1: Count existing attendance for this student+activity  │
│          scanCountForActivity = Attendance.count({             │
│            student_id, activity_id                            │
│          })                                                     │
│                                                                 │
│  Step 2: Calculate scan_order                                 │
│          scan_order = scanCountForActivity + 1                │
│          (1st scan, 2nd scan, 3rd scan...)                    │
│                                                                 │
│  Step 3: Get total_qr_at_scan                                 │
│          total_qr_at_scan = activity.total_qr_created         │
│          (Total QR codes created for this activity so far)     │
│                                                                 │
│  Step 4: Calculate points                                     │
│          points = floor((scan_order / total_qr_at_scan) *      │
│                         activity.max_points)                   │
│          points = min(points, activity.max_points)  // CAP     │
│                                                                 │
│  Example:                                                       │
│  - Activity has 3 QR codes (total_qr_at_scan = 3)             │
│  - Student scanning 2nd time (scan_order = 2)                 │
│  - Activity max_points = 10                                    │
│  - Calc: floor((2/3) * 10) = floor(6.66) = 6 points          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│      BACKEND: Save Attendance Record                            │
│                                                                 │
│  Create Attendance Document:                                   │
│  {                                                             │
│    _id: ObjectId,                                             │
│    student_id: ObjectId,                        // From User   │
│    activity_id: ObjectId,                       // From Param  │
│    qr_code_id: ObjectId,                        // From Form   │
│                                                 │
│    // 🆕 DYNAMIC SCORING FIELDS                               │
│    scan_order: 2,                               // 2nd scan    │
│    total_qr_at_scan: 3,                         // 3 QRs made  │
│    points_earned: 6,                            // Calculated  │
│    points: 6,                                   // Backward compat
│                                                 │
│    student_info: {                              │
│      student_id_number: "20001",                // 5-6 digits  │
│      student_name: "Nguyễn A",        // 🆕 NEW  │
│      class: ObjectId,                           // From DB      │
│      faculty: ObjectId,                         // From DB      │
│      phone: "0123456789",                       // Optional     │
│      notes: "...",                              // Optional     │
│      submitted_at: Date                         │
│    },                                           │
│                                                 │
│    student_info_flags: {                        │
│      class_mismatch: false,                     // Check if different
│      registered_class: ObjectId,                │
│      student_in_system: true                    │
│    },                                           │
│                                                 │
│    status: 'approved',                 // 🆕 AUTO-APPROVED!   │
│    verified: true,                              │
│    verified_by: userId,                         │
│    scanned_at: Date,                            │
│    created_at: Date,                            │
│    updated_at: Date                             │
│  }                                              │
│                                                 │
│  Then SAVE to Database                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│      BACKEND: Return Success Response                           │
│                                                                 │
│  HTTP 201 Created                                              │
│                                                                 │
│  {                                                             │
│    success: true,                                             │
│    message: "✅ Điểm danh thành công! Lần 2/3 - 6 điểm",     │
│    data: {                                                     │
│      attendance_id: "...",                                     │
│      scan_order: 2,                 // Lần mấy                │
│      total_qr_at_scan: 3,           // Tổng QR                │
│      points_earned: 6,              // Điểm được              │
│      student_name: "Nguyễn A",                                │
│      activity_id: "...",                                      │
│      scanned_at: "2025-11-30T10:15:00Z"                       │
│    },                                                          │
│    warnings: null  // or { class_mismatch: true, ... }        │
│  }                                                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│      FRONTEND: handleSubmit() - Process Response               │
│                                                                 │
│  ✅ Show success message:                                      │
│     "✅ Điểm danh thành công! Lần 2/3 - 6 điểm"              │
│                                                                 │
│  ✓ Reset form                                                 │
│  ✓ Clear character counter                                    │
│  ✓ Wait 2 seconds                                             │
│  ✓ Redirect to home page                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema - What Gets Saved

### **Attendance Collection Record**

```javascript
{
  // IDs & References
  _id: ObjectId("507f1f77bcf86cd799439011"),
  student_id: ObjectId("507f1f77bcf86cd799439012"),
  activity_id: ObjectId("507f1f77bcf86cd799439013"),
  qr_code_id: ObjectId("507f1f77bcf86cd799439014"),

  // 🆕 DYNAMIC SCORING FIELDS
  scan_order: 2,                    // This is student's 2nd scan for activity
  total_qr_at_scan: 3,              // Activity had 3 QRs when scanned
  points_earned: 6,                 // Calculated: (2/3)*10 = 6
  points: 6,                        // Same as points_earned (backward compat)

  // Student Info from Form Submission
  student_info: {
    student_id_number: "20001",     // 5-6 digits from form
    student_name: "Nguyễn Văn A",   // 🆕 NEW from form
    class: ObjectId("60d5ec49c1234567890abcde"),
    faculty: ObjectId("60d5ec49c1234567890abcdf"),
    phone: "0123456789",            // Optional
    notes: "Tham dự đầy đủ buổi học",  // Optional, max 500 chars
    submitted_at: ISODate("2025-11-30T10:15:00Z")
  },

  // Check for Warnings
  student_info_flags: {
    class_mismatch: false,                     // No warning
    registered_class: ObjectId("60d5ec49c1234567890abcde"),
    student_in_system: true
  },

  // Status
  status: "approved",               // 🆕 Auto-approved (was pending before)
  verified: true,
  verified_by: ObjectId("507f1f77bcf86cd799439015"),
  verified_at: ISODate("2025-11-30T10:15:00Z"),

  // Timestamps
  scanned_at: ISODate("2025-11-30T10:15:00Z"),
  createdAt: ISODate("2025-11-30T10:15:00Z"),
  updatedAt: ISODate("2025-11-30T10:15:00Z")
}
```

---

## 🧮 Points Calculation Examples

### **Example 1: Activity with 2 QRs**
```
Activity: "Hội thảo CNTT"
├─ max_points: 10
├─ total_qr_created: 2 (2 QRs already made)

Student A (1st scan):
├─ scan_order: 1
├─ total_qr_at_scan: 2
├─ points: floor((1/2) * 10) = 5

Student A (2nd scan):
├─ scan_order: 2
├─ total_qr_at_scan: 2
├─ points: floor((2/2) * 10) = 10 ✅ (FULL POINTS)
```

### **Example 2: Admin Creates 3rd QR**
```
Before: total_qr_created = 2

Admin clicks "Tạo QR3"
  └─ API: generateQRCode()
     └─ activity.total_qr_created++ (2 → 3)
     └─ Save Activity

After: total_qr_created = 3

Student B (1st scan, AFTER QR3 created):
├─ scan_order: 1
├─ total_qr_at_scan: 3  ← Different from Student A!
├─ points: floor((1/3) * 10) = 3

Student B (2nd scan):
├─ scan_order: 2
├─ total_qr_at_scan: 3  ← Still 3 (locked from 1st scan)
├─ points: floor((2/3) * 10) = 6

Student B (3rd scan):
├─ scan_order: 3
├─ total_qr_at_scan: 3
├─ points: floor((3/3) * 10) = 10 ✅
```

### **Example 3: Exceeding QR Count (Capped)**
```
Activity: max_points = 10, total_qr_created = 2

Student C (1st scan): 1/2 * 10 = 5
Student C (2nd scan): 2/2 * 10 = 10
Student C (3rd scan): min(3/2 * 10, 10) = min(15, 10) = 10 ✅ (CAPPED)
```

---

## ❌ Error Cases & Handling

| Error Case | Validation Layer | Response | Status |
|------------|------------------|----------|--------|
| QR Expired | Frontend + Backend | Redirect 404 | 400 |
| QR Not Active | Backend | "QR code has been deactivated" | 400 |
| QR Not Found | Backend | "QR code not found" | 400 |
| Duplicate Scan | Backend | "Bạn đã quét QR này rồi" | 400 |
| Student Not Registered | Backend | "You are not registered for this activity" | 400 |
| Invalid Class | Backend | "Invalid class. Class not found in database." | 400 |
| Invalid Faculty | Backend | "Invalid faculty. Faculty not found in database." | 400 |
| Invalid Phone | Frontend | "Số điện thoại không hợp lệ" | Client-side |
| MSSV Invalid | Frontend | "MSSV phải là 5-6 chữ số" | Client-side |
| Required Fields Empty | Frontend | "Vui lòng điền đầy đủ thông tin bắt buộc" | Client-side |

---

## 📱 Form Fields Sent to Backend

### **Payload Structure**
```json
{
  "activity_id": "60d5ec49c1234567890abcde",
  "session_id": "60d5ec49c1234567890abcdf",
  "student_info": {
    "student_id_number": "20001",
    "student_name": "Nguyễn Văn A",
    "class": "60d5ec49c1234567890abc01",
    "faculty": "60d5ec49c1234567890abc02",
    "phone": "0123456789",
    "notes": "Ghi chú thêm"
  }
}
```

### **Notes:**
- `session_id` = `qr_code_id` (from URL param)
- `student_id_number` = MSSV (5-6 digits only)
- `student_name` = Full name (max 100 chars)
- `class` = ObjectId selected from dropdown
- `faculty` = ObjectId selected from dropdown
- `phone` & `notes` = Optional fields

---

## ✅ Success Response Format

```json
{
  "success": true,
  "message": "✅ Điểm danh thành công! Lần 2/3 - 6 điểm",
  "data": {
    "attendance_id": "507f1f77bcf86cd799439016",
    "scan_order": 2,
    "total_qr_at_scan": 3,
    "points_earned": 6,
    "student_name": "Nguyễn Văn A",
    "activity_id": "60d5ec49c1234567890abcde",
    "scanned_at": "2025-11-30T10:15:00Z"
  },
  "warnings": null
}
```

---

## 🔄 Key Differences from Old System

| Feature | Old System | New System |
|---------|-----------|-----------|
| Status | `pending` (admin approves) | `approved` (auto-approved via QR) |
| Points | Manual entry by admin | Auto-calculated based on attendance |
| Student Name | From StudentProfile | From form submission |
| QR Tracking | `session_id` | `qr_code_id` |
| Duplicate Check | No | Yes (1 student x 1 QR = 1 record) |
| Points Calculation | Static | Dynamic (based on total_qr_created) |
| Workflow | Submit → Pending → Approve | Submit → Auto-Approved |

---

## 🧪 Test Scenarios

### **Test 1: Basic Single Scan**
```
Activity: max_points=10
Admin creates QR1 (total_qr=1)
Student A scans QR1
  → Expected: points=10, scan_order=1
  → Actual: ✅ Pass
```

### **Test 2: Multiple Scans**
```
Activity: max_points=10
Admin creates QR1 (total_qr=1)
Student B scans QR1
  → Expected: points=10, scan_order=1

Admin creates QR2 (total_qr=2)
Student B scans QR2
  → Expected: points=10, scan_order=2
  → Actual: ✅ Pass
```

### **Test 3: Duplicate Prevention**
```
Student C scans QR1
Student C tries to scan QR1 again
  → Expected: Error "Bạn đã quét QR này rồi"
  → Actual: ✅ Pass
```

### **Test 4: Dynamic Scoring**
```
Activity: max_points=10, total_qr=3
Student D scans QR1 (1st)
  → points = (1/3)*10 = 3 ✅

Student D scans QR2 (2nd)
  → points = (2/3)*10 = 6 ✅

Student D scans QR3 (3rd)
  → points = (3/3)*10 = 10 ✅
```

---

**Document Complete** ✅

For implementation: See `DYNAMIC_QR_ATTENDANCE_PLAN.md`
