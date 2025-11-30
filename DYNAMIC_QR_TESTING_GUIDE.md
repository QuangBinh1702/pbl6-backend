# 🧪 Dynamic QR Attendance Scoring - Testing Guide

**Date:** Nov 30, 2025  
**Purpose:** Test all scenarios for dynamic QR scoring system  
**Status:** Ready to test

---

## 📋 Test Scenarios (11 scenarios from PLAN)

### Scenario 1: Single QR, Single Student
```
Activity: Test Activity (max_points = 10)
Admin creates QR1 (total_qr_created = 1)
Student A scans QR1
Expected: points = (1/1) * 10 = 10
DB Record: scan_order=1, total_qr_at_scan=1, points=10
Status: ✅ Ready to test
```

### Scenario 2: Two QRs, Same Student Scans Both
```
Activity: Test Activity (max_points = 10)
Admin creates QR1 (total_qr_created = 1)
Student A scans QR1 → 1/1 = 10pts
Admin creates QR2 (total_qr_created = 2)
Student A scans QR2 → 2/2 = 10pts
Expected: Both get 10pts (scan_order increases)
Status: ✅ Ready to test
```

### Scenario 3: Two QRs, New Student Scans First
```
Admin creates QR1, QR2 (total_qr_created = 2)
Student B scans QR1 (first scan)
Expected: points = (1/2) * 10 = 5pts
DB Record: scan_order=1, total_qr_at_scan=2
Status: ✅ Ready to test
```

### Scenario 4: Three QRs, Multiple Students
```
Admin creates QR1 (total_qr=1) → SV A: 1/1 = 10pts
Admin creates QR2 (total_qr=2) → SV B scans QR1: 1/2 = 5pts
Admin creates QR3 (total_qr=3) → SV C scans QR1: 1/3 = 3pts
Expected: Each gets correct points based on total_qr at their scan time
Status: ✅ Ready to test
```

### Scenario 5: Duplicate Scan Prevention
```
Student A scans QR1 → Success
Student A scans QR1 again
Expected: Error "Bạn đã quét QR này rồi"
Status: ✅ Ready to test
```

### Scenario 6: Points Cap at Max
```
Activity: max_points = 10
4 QRs created, student scans all 4
Expected: points = min((4/4)*10, 10) = 10 (capped)
Status: ✅ Ready to test
```

### Scenario 7: Fractional Points Floor
```
Activity: max_points = 10
3 QRs created, student scans once
Expected: points = floor((1/3)*10) = floor(3.33) = 3
Status: ✅ Ready to test
```

### Scenario 8: Out of Order Scans
```
Admin creates QR1, QR2, QR3 (total_qr=3)
Student scans: QR3 → QR1 → QR2
Expected: Each scan counts in order (1st, 2nd, 3rd)
Points: 1/3=3, 2/3=6, 3/3=10
Status: ✅ Ready to test
```

### Scenario 9: QR Expiry Redirect
```
Create QR with 5-minute expiry
Scan immediately → Success
Wait 5+ minutes, scan QR → Failure (redirect to /404.html)
Status: ✅ Ready to test
```

### Scenario 10: Form Validation
```
Test all field validations:
- MSSV: Must be 5-6 digits
- Phone: Must be Vietnamese format (0xxxxxxxxx)
- Notes: Max 500 characters
- Student name: Required
- Faculty: Required
- Class: Required
Status: ✅ Ready to test
```

### Scenario 11: Database Auto-Increment
```
Create Activity without total_qr_created
Generate QR1 → total_qr_created should become 1
Generate QR2 → total_qr_created should become 2
Check activity.total_qr_created is correct
Status: ✅ Ready to test
```

---

## 🧮 Points Calculation Examples

| Scan# | Total QR | Max Pts | Formula | Calculation | Result |
|-------|----------|---------|---------|-------------|--------|
| 1 | 1 | 10 | (1/1)*10 | 10 | 10 ✅ |
| 1 | 2 | 10 | (1/2)*10 | 5 | 5 ✅ |
| 2 | 2 | 10 | (2/2)*10 | 10 | 10 ✅ |
| 1 | 3 | 10 | (1/3)*10 | 3.33 | 3 ✅ |
| 2 | 3 | 10 | (2/3)*10 | 6.66 | 6 ✅ |
| 3 | 3 | 10 | (3/3)*10 | 10 | 10 ✅ |
| 4 | 3 | 10 | min((4/3)*10, 10) | 13→10 | 10 ✅ |

---

## 🚀 Manual Testing Steps

### Step 1: Setup Activity
```bash
1. Create Activity: "Test QR Scoring"
   - max_points: 10
2. Verify: total_qr_created = 0 (should default)
```

### Step 2: Generate First QR
```bash
1. Go to QR Manager
2. Click "Generate QR1"
3. Check response: total_qr_created = 1
4. Check DB: activity.total_qr_created = 1
```

### Step 3: Student Scans (First)
```bash
1. Scan QR1 code
2. Fill form: Name, MSSV (20001), Faculty, Class
3. Submit
4. Expected response: ✅ Điểm danh thành công! Lần 1/1 - 10 điểm
5. Check DB:
   - attendance.scan_order = 1
   - attendance.total_qr_at_scan = 1
   - attendance.points_earned = 10
```

### Step 4: Generate Second QR
```bash
1. Generate QR2 in QR Manager
2. Check response: total_qr_created = 2
3. Check DB: activity.total_qr_created = 2
```

### Step 5: Same Student Scans QR2
```bash
1. Scan QR2
2. Fill same form
3. Submit (NEW student, so no duplicate error)
4. Expected response: ✅ Điểm danh thành công! Lần 1/2 - 5 điểm
5. Check DB: points_earned = 5 (because total_qr_at_scan = 2)
```

### Step 6: Different Student Scans QR1
```bash
1. Scan QR1 (same QR as before)
2. Fill form with DIFFERENT MSSV (20002)
3. Submit
4. Expected response: ✅ Điểm danh thành công! Lần 1/2 - 5 điểm
5. Check DB: This is FIRST scan for student 20002, so scan_order=1
```

### Step 7: Duplicate Prevention
```bash
1. Try scanning QR1 again with SAME student (20001)
2. Submit
3. Expected error: ❌ Bạn đã quét QR này rồi
```

### Step 8: Frontend Point Prediction
```bash
1. Scan QR code link
2. Before submitting, check info box shows:
   - Activity name
   - Max points: 10
   - Total QR: 2
   - Predicted points: 5 (for first scan)
```

---

## 🐛 Debugging Checklist

- [ ] Check `activity.total_qr_created` exists in database
- [ ] Check `activity.max_points` defaults to 10
- [ ] Check `attendance.scan_order` is populated
- [ ] Check `attendance.total_qr_at_scan` is populated
- [ ] Check `attendance.points_earned` calculated correctly
- [ ] Check points formula: `min(floor((scan/total)*max), max)`
- [ ] Check duplicate detection works
- [ ] Check QR expiry validation works
- [ ] Check form fields all validated
- [ ] Check response message includes scan_order

---

## 📊 API Endpoints Test

### Generate QR
```bash
POST /api/attendances/generate-qr
Body: { activity_id: "...", qr_name: "QR1", duration_minutes: 5 }

Expected Response:
{
  "success": true,
  "data": {
    "qr_id": "...",
    "qr_name": "QR1",
    "total_qr_created": 1,  ← Should increment
    "expires_at": "..."
  }
}
```

### Validate QR
```bash
POST /api/attendances/validate-qr
Body: { qr_code_id: "..." }

Expected Response:
{
  "success": true,
  "valid": true,
  "total_qr_created": 2,      ← From activity
  "max_points": 10,           ← From activity
  "activity_id": "..."
}
```

### Submit Attendance
```bash
POST /api/attendances/submit-attendance
Body: {
  "activity_id": "...",
  "session_id": "qr_code_id",
  "student_info": {
    "student_id_number": "20001",
    "student_name": "Nguyễn A",
    "class": "...",
    "faculty": "...",
    "phone": "0123456789"
  }
}

Expected Response:
{
  "success": true,
  "message": "✅ Điểm danh thành công! Lần 1/2 - 5 điểm",
  "data": {
    "scan_order": 1,
    "total_qr_at_scan": 2,
    "points_earned": 5
  }
}
```

---

## ✅ Final Checklist Before Deploy

- [ ] All 11 test scenarios passed
- [ ] Points calculation verified with examples
- [ ] Duplicate prevention working
- [ ] QR expiry working
- [ ] Frontend form prediction correct
- [ ] Database fields populated correctly
- [ ] API responses include new fields
- [ ] Indexes created for performance
- [ ] Error messages clear and helpful
- [ ] No console errors in browser
- [ ] No backend errors in logs

---

**Status:** ✅ Ready for Testing

**Next Step:** Execute test scenarios and document results
