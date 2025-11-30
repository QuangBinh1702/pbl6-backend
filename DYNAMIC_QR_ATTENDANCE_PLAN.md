# 📋 Dynamic QR Attendance Scoring System - Implementation Plan

**Date:** Nov 30, 2025  
**Status:** Planning Phase  
**Objective:** Implement dynamic threshold-based scoring for multiple QR scans

---

## 🎯 System Overview

```
Activity: "Hội thảo CNTT" (max_points = 10)

Admin tạo QR1 (total_qr = 1)
├─ SV A quét QR1 → 1/1 = 10 điểm ✅

Admin tạo QR2 (total_qr = 2)
├─ SV A quét QR2 → 2/2 = 10 điểm ✅
├─ SV B quét QR1 → 1/2 = 5 điểm
└─ SV B quét QR2 → 2/2 = 10 điểm ✅

Admin tạo QR3 (total_qr = 3)
├─ SV A quét QR3 → 3/3 = 10 điểm ✅
├─ SV B quét QR3 → 3/3 = 10 điểm ✅
├─ SV C quét QR1 → 1/3 = 3.33 điểm
├─ SV C quét QR3 → 2/3 = 6.66 điểm
└─ SV D quét QR3 → 1/3 = 3.33 điểm
```

---

## 📦 Phase 1: Database & Model Updates

### **1.1 Activity Model Enhancement**
**File:** `backend/src/models/activity.model.js`

**Changes:**
```javascript
{
  // Existing fields...
  title: String,
  description: String,
  max_points: {
    type: Number,
    default: 10
  },
  
  // 🆕 NEW: Total QR codes created for this activity
  total_qr_created: {
    type: Number,
    default: 0    // Auto-increment when admin creates QR
  }
}
```

**Checklist:**
- [ ] Add `total_qr_created` field to Activity schema
- [ ] Set default value = 0
- [ ] Add validation (>= 0)
- [ ] Add index on `total_qr_created` for queries
- [ ] Test with existing activities

---

### **1.2 Attendance Model Enhancement**
**File:** `backend/src/models/attendance.model.js`

**Changes:**
```javascript
{
  // Existing fields...
  student_id: ObjectId,
  activity_id: ObjectId,
  qr_code_id: ObjectId,
  
  // 🆕 NEW: Track scan order and dynamic total_qr
  scan_order: {
    type: Number,
    description: "Which scan this is for the student (1st, 2nd, 3rd...)"
  },
  
  total_qr_at_scan: {
    type: Number,
    description: "Total QR codes that existed when this was scanned"
  },
  
  // Points calculation
  points: {
    type: Number,
    description: "Calculated as: (scan_order / total_qr_at_scan) * max_points"
  },
  
  // Status
  status: {
    type: String,
    enum: ['approved', 'rejected'],
    default: 'approved'  // Auto-approved (validated via QR)
  },
  
  scanned_at: Date
}
```

**Checklist:**
- [ ] Add `scan_order` field
- [ ] Add `total_qr_at_scan` field
- [ ] Add `points` calculation logic
- [ ] Add index on `(student_id, activity_id)` for counting scans
- [ ] Add index on `(student_id, qr_code_id)` for duplicate detection
- [ ] Migrate existing attendance records

---

## 🔧 Phase 2: Backend Logic Implementation

### **2.1 Generate QR Code Enhancement**
**File:** `backend/src/controllers/attendance.controller.js` → `generateQRCode()`

**Changes:**
```javascript
async generateQRCode(req, res) {
  try {
    const { activity_id, qr_name, duration_minutes } = req.body;
    
    // ... existing QR generation code ...
    
    // 🆕 NEW: Increment total_qr_created
    const activity = await Activity.findById(activity_id);
    activity.total_qr_created++;  // ← Auto-increment
    await activity.save();
    
    // Log for debugging
    console.log(`✅ QR created. Activity now has ${activity.total_qr_created} QRs`);
    
    // ... rest of code ...
  }
}
```

**Checklist:**
- [ ] Update `generateQRCode()` to increment `total_qr_created`
- [ ] Test QR generation increments counter
- [ ] Verify `total_qr_created` in response
- [ ] Check database after each generation

---

### **2.2 Submit Attendance Logic (Core Logic)**
**File:** `backend/src/controllers/attendance.controller.js` → `submitAttendance()`

**New Logic Flow:**

```javascript
async submitAttendance(req, res) {
  try {
    const { activity_id, student_info } = req.body;
    const userId = req.user._id;
    
    // ===== VALIDATIONS =====
    
    // 1. Check Activity exists
    const activity = await Activity.findById(activity_id);
    if (!activity) return error('Activity not found');
    
    // 2. Check StudentProfile exists (map MSSV → student_id)
    let studentProfile = await StudentProfile.findOne({ 
      user_id: userId 
    });
    
    if (!studentProfile) {
      // Auto-create minimal profile if doesn't exist
      studentProfile = new StudentProfile({
        user_id: userId,
        student_number: student_info.student_id_number
      });
      await studentProfile.save();
    }
    
    const studentId = studentProfile._id;
    
    // 3. Check Student registered this activity
    const registration = await ActivityRegistration.findOne({
      student_id: studentId,
      activity_id: activity_id,
      status: 'approved'
    });
    if (!registration) {
      return error('You are not registered for this activity');
    }
    
    // ===== DUPLICATE CHECK =====
    
    // 4. Check student hasn't scanned this QR before
    const qrCodeId = req.body.qr_code_id;  // From form submission
    if (qrCodeId) {
      const existingAttendance = await Attendance.findOne({
        student_id: studentId,
        qr_code_id: qrCodeId
      });
      
      if (existingAttendance) {
        return error('Bạn đã quét QR này rồi');
      }
    }
    
    // ===== CALCULATE POINTS =====
    
    // 5. Count how many times this student has scanned for this activity
    const scanCountForActivity = await Attendance.countDocuments({
      student_id: studentId,
      activity_id: activity_id
    });
    
    const scan_order = scanCountForActivity + 1;  // 1st, 2nd, 3rd...
    const total_qr_at_scan = activity.total_qr_created;
    
    // Formula: (scan_order / total_qr) * max_points
    const points = Math.min(
      Math.floor((scan_order / total_qr_at_scan) * activity.max_points),
      activity.max_points
    );
    
    // ===== SAVE ATTENDANCE =====
    
    const attendance = new Attendance({
      student_id: studentId,
      activity_id: activity_id,
      qr_code_id: qrCodeId,
      
      scan_order: scan_order,
      total_qr_at_scan: total_qr_at_scan,
      points: points,
      
      student_info: {
        student_id_number: student_info.student_id_number,
        student_name: student_info.student_name,
        class: student_info.class,
        faculty: student_info.faculty,
        phone: student_info.phone || null,
        notes: student_info.notes || null,
        submitted_at: new Date()
      },
      
      status: 'approved',  // Auto-approved (verified via QR)
      scanned_at: new Date()
    });
    
    await attendance.save();
    
    // Log for debugging
    console.log(`✅ Attendance saved:
      Student: ${studentId}
      Activity: ${activity_id}
      Scan order: ${scan_order}/${total_qr_at_scan}
      Points: ${points}
    `);
    
    res.status(201).json({
      success: true,
      message: `✅ Điểm danh thành công! Lần ${scan_order}/${total_qr_at_scan} - ${points} điểm`,
      data: {
        scan_order,
        total_qr_at_scan,
        points,
        attendance_id: attendance._id
      }
    });
    
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}
```

**Checklist:**
- [ ] Count existing attendance for student
- [ ] Calculate `scan_order` (count + 1)
- [ ] Get `total_qr_at_scan` from activity
- [ ] Calculate points with formula
- [ ] Cap points at max_points
- [ ] Check duplicate QR scan
- [ ] Check student registration
- [ ] Save all fields correctly
- [ ] Return correct message with scan_order

---

### **2.3 Validate QR Code (Already Done)**
**File:** `backend/src/controllers/attendance.controller.js` → `validateQRCode()`

**Status:** ✅ Already implemented in previous tasks
- Checks if QR is expired
- Checks if QR is active
- Returns `total_qr_at_scan` for frontend

**Checklist:**
- [ ] Verify `validateQRCode()` endpoint working
- [ ] Test with expired QR → 404 redirect
- [ ] Test with valid QR → continue to form

---

## 🎨 Phase 3: Frontend Form Enhancement

### **3.1 QR Attendance Form Update**
**File:** `backend/public/qr-attendance-form.html`

**Changes:**
```javascript
// On form load - after QR validation
async function showSubmissionForm(qrData) {
  const activity = await fetchActivity(qrData.activityId);
  
  // 🆕 Calculate what scan_order WILL be
  const estimatedScanOrder = await estimateScanOrder(qrData.activityId);
  
  // Display info
  document.getElementById('activityInfo').innerHTML = `
    Activity: ${activity.title}
    Max Points: ${activity.max_points}
    Total QR Created: ${activity.total_qr_created}
    Lần quét của bạn: ${estimatedScanOrder}/${activity.total_qr_created}
    Điểm dự tính: ${calculatePoints(estimatedScanOrder, activity.total_qr_created, activity.max_points)}
  `;
}
```

**Frontend Display:**
```
📋 Điểm Danh Hoạt Động
─────────────────────
Hoạt động: Hội thảo CNTT
Điểm tối đa: 10
Đã tạo QR: 3 cái
Lần quét của bạn: 1/3
Điểm dự tính: 3.33 → 3 điểm

[Form fields...]

✅ Nộp Điểm Danh
```

**Checklist:**
- [ ] Display activity name
- [ ] Display max_points
- [ ] Display total_qr_created
- [ ] Estimate scan_order (count + 1)
- [ ] Show predicted points
- [ ] Update in real-time if needed
- [ ] Test with multiple scenarios

---

## 🧪 Phase 4: Testing & Validation

### **4.1 Unit Tests**
**File:** Create `backend/tests/attendance.points.test.js`

```javascript
describe('Points Calculation', () => {
  
  test('Scenario 1: 1 QR, student scans once', () => {
    // points = (1/1) * 10 = 10
    expect(calculatePoints(1, 1, 10)).toBe(10);
  });
  
  test('Scenario 2: 2 QR, student scans once', () => {
    // points = (1/2) * 10 = 5
    expect(calculatePoints(1, 2, 10)).toBe(5);
  });
  
  test('Scenario 3: 2 QR, student scans twice', () => {
    // points = (2/2) * 10 = 10
    expect(calculatePoints(2, 2, 10)).toBe(10);
  });
  
  test('Scenario 4: 3 QR, student scans twice', () => {
    // points = (2/3) * 10 = 6.66 → 6
    expect(calculatePoints(2, 3, 10)).toBe(6);
  });
  
  test('Scenario 5: 3 QR, student scans 4 times (cap)', () => {
    // points = min((4/3) * 10, 10) = 10
    expect(calculatePoints(4, 3, 10)).toBe(10);
  });
});
```

**Checklist:**
- [ ] Create test file
- [ ] Write unit tests for all scenarios
- [ ] Run tests and verify all pass
- [ ] Test edge cases (division by zero, etc)

---

### **4.2 Integration Tests**
**File:** Create test page `backend/public/qr-attendance-test.html`

**Test Scenarios:**

| # | Scenario | Expected | Status |
|---|----------|----------|--------|
| 1 | Activity: 10pts, QR1 created; SV A scans QR1 | 1/1 = 10pts | [ ] |
| 2 | QR2 created; SV A scans QR2 | 2/2 = 10pts | [ ] |
| 3 | SV B scans QR1 (1st scan) | 1/2 = 5pts | [ ] |
| 4 | SV B scans QR2 (2nd scan) | 2/2 = 10pts | [ ] |
| 5 | QR3 created; SV B scans QR3 | 3/3 = 10pts | [ ] |
| 6 | SV C scans QR1 (1st scan) | 1/3 = 3pts | [ ] |
| 7 | SV C scans QR3 (2nd scan) | 2/3 = 6pts | [ ] |
| 8 | SV C scans QR2 (3rd scan) | 3/3 = 10pts | [ ] |
| 9 | SV D scans QR1 only | 1/3 = 3pts | [ ] |
| 10 | SV A tries to scan QR1 again | Reject (duplicate) | [ ] |
| 11 | QR1 expires; SV E tries to scan | Redirect 404 | [ ] |

**Checklist:**
- [ ] Create comprehensive test page
- [ ] Test all 11 scenarios
- [ ] Verify database records
- [ ] Check points calculation
- [ ] Verify no duplicates allowed
- [ ] Test expired QR handling

---

### **4.3 Edge Cases**

| Case | Handling | Status |
|------|----------|--------|
| Student not registered | Return error | [ ] |
| QR code not found | Return error | [ ] |
| QR code expired | Redirect 404 | [ ] |
| Duplicate scan same QR | Return error | [ ] |
| Scan out of order (QR3→QR1→QR2) | Allow, count sequentially | [ ] |
| total_qr = 0 | Should not happen (check on creation) | [ ] |
| points > max_points | Cap at max_points | [ ] |
| Negative scan_order | Should not happen (validate) | [ ] |

**Checklist:**
- [ ] Test all edge cases
- [ ] Add validation for each case
- [ ] Log errors for debugging
- [ ] Handle gracefully

---

## 📊 Phase 5: Monitoring & Documentation

### **5.1 Logging**
**File:** Update controllers with detailed logs

```javascript
console.log(`[Attendance] Student: ${studentId}, Activity: ${activity_id}`);
console.log(`[Attendance] Scan ${scan_order}/${total_qr_at_scan} = ${points} pts`);
console.log(`[QR] Created. Activity total_qr: ${activity.total_qr_created}`);
console.log(`[Duplicate] Student ${studentId} already scanned QR ${qrCodeId}`);
```

**Checklist:**
- [ ] Add logging to all critical points
- [ ] Track QR creation
- [ ] Track attendance submission
- [ ] Track duplicate attempts
- [ ] Track error cases

---

### **5.2 API Response Format**

**Generate QR Response:**
```json
{
  "success": true,
  "data": {
    "qr_id": "...",
    "qr_name": "QR Buổi 3",
    "total_qr_created": 3,
    "created_at": "2025-11-30T10:00:00Z"
  }
}
```

**Submit Attendance Response:**
```json
{
  "success": true,
  "message": "✅ Điểm danh thành công! Lần 2/3 - 6 điểm",
  "data": {
    "scan_order": 2,
    "total_qr_at_scan": 3,
    "points": 6,
    "attendance_id": "..."
  }
}
```

**Checklist:**
- [ ] Update response formats
- [ ] Include scan_order in response
- [ ] Include total_qr_at_scan in response
- [ ] Include points calculation details

---

## 🚀 Implementation Sequence

```
Week 1:
├─ Phase 1: Database updates (1 day)
├─ Phase 2: Backend logic (2 days)
└─ Phase 2.5: API response updates (0.5 days)

Week 2:
├─ Phase 3: Frontend form (1 day)
├─ Phase 4: Testing (2 days)
└─ Phase 5: Monitoring & docs (0.5 days)

Week 3:
└─ Deploy + Monitor
```

---

## ✅ Deployment Checklist

- [ ] All models updated
- [ ] All endpoints updated
- [ ] All tests passing
- [ ] Database migrated
- [ ] Frontend updated
- [ ] Documentation complete
- [ ] Error handling complete
- [ ] Logging configured
- [ ] Performance tested
- [ ] Security review done
- [ ] Staging test passed
- [ ] Production deployment

---

## 📞 Key Files to Modify

1. **Models:**
   - `backend/src/models/activity.model.js`
   - `backend/src/models/attendance.model.js`

2. **Controllers:**
   - `backend/src/controllers/attendance.controller.js`
   - Methods: `generateQRCode()`, `submitAttendance()`

3. **Frontend:**
   - `backend/public/qr-attendance-form.html`

4. **Tests:**
   - Create: `backend/tests/attendance.points.test.js`
   - Create: `backend/public/qr-attendance-test.html`

---

**Status:** ✅ Plan Complete - Ready for Implementation

**Next Step:** Start Phase 1 (Database Updates)

