# 👨‍💻 Dynamic QR Scoring - Developer Guide

**For Next Developer**

---

## 🔍 Quick Overview

**What It Does:**
- Students scan QR codes to mark attendance
- Points calculated dynamically: `(scan_order / total_qr_created) * max_points`
- Higher attendance = higher points (capped at max)

**Example:**
- Activity has max_points=10
- Admin creates 3 QR codes (total_qr_created=3)
- Student scans QR1 (1st): (1/3)*10 = 3 points
- Student scans QR2 (2nd): (2/3)*10 = 6 points  
- Student scans QR3 (3rd): (3/3)*10 = 10 points

---

## 📁 Key Files to Know

### Backend - Models
```
backend/src/models/activity.model.js
├─ total_qr_created: Number (auto-incremented)
└─ max_points: Number (default: 10)

backend/src/models/attendance.model.js
├─ scan_order: Number (which scan is this?)
├─ total_qr_at_scan: Number (how many QRs existed?)
├─ points_earned: Number (calculated points)
└─ points: Number (for backward compatibility)
```

### Backend - Controllers
```
backend/src/controllers/attendance.controller.js

1. generateQRCode() - Line 1365
   └─ Creates QR and increments activity.total_qr_created

2. validateQRCode() - Line 1505
   └─ Validates QR and returns activity details (total_qr_created, max_points)

3. submitAttendance() - Line 911
   └─ Handles form submission with dynamic points calculation
```

### Frontend
```
backend/public/qr-attendance-form.html

1. validateQRCodeOnLoad() - Line 352
   └─ Validates QR when page loads

2. predictPoints() - Line 386
   └─ Shows estimated points before submission (uses validateQRCode response)
```

---

## 🧮 Points Calculation Logic

**Location:** `attendance.controller.js`, Line 1027-1031

```javascript
const scan_order = scanCountForActivity + 1;
const total_qr_at_scan = activity.total_qr_created || 1;
const max_points_from_activity = activity.max_points || 10;

const calculated_points = Math.min(
  Math.floor((scan_order / total_qr_at_scan) * max_points_from_activity),
  max_points_from_activity
);
```

**If you need to change the formula:**
1. Open `attendance.controller.js` line 1027-1031
2. Modify calculation (keep the `Math.min` cap)
3. Update frontend `predictPoints()` to match (line 403-407)
4. Test with scenarios in `DYNAMIC_QR_TESTING_GUIDE.md`

---

## 🔄 Data Flow

```
QR GENERATION
├─ Admin POST /api/attendances/generate-qr
├─ Backend: Saves QR record
├─ Backend: Increments activity.total_qr_created++
└─ Response includes: total_qr_created

QR VALIDATION
├─ Frontend calls POST /api/attendances/validate-qr
├─ Backend: Checks if expired/active
├─ Backend: Fetches activity details
└─ Response includes: total_qr_created, max_points

ATTENDANCE SUBMISSION
├─ Frontend POST /api/attendances/submit-attendance
├─ Backend: Counts student's existing scans → scan_order
├─ Backend: Gets activity.total_qr_created → total_qr_at_scan
├─ Backend: Calculates: points = (scan_order/total_qr) * max_points
├─ Backend: Saves Attendance record (auto-approved)
└─ Response: message with "Lần X/Y - Z điểm"
```

---

## 🐛 Debugging Tips

### Check if points calculated correctly:
```bash
# Look for log in backend:
console.log(`[Attendance] Points calculation: scan_order=2, total_qr=3, max_points=10 → 6 pts`);
```

### Check database:
```javascript
// Check Activity
db.activity.findOne({_id: ObjectId("...")})
→ Should see: total_qr_created: 3, max_points: 10

// Check Attendance
db.attendance.findOne({_id: ObjectId("...")})
→ Should see: scan_order: 2, total_qr_at_scan: 3, points_earned: 6
```

### Check frontend validation:
```javascript
// Browser console should show:
✅ QR Code Valid: {total_qr_created: 3, max_points: 10}
```

---

## ⚠️ Common Issues & Fixes

### Issue 1: Points always 0
**Cause:** `activity.max_points` not set
**Fix:** Set max_points when creating activity
```javascript
activity.max_points = 10;
await activity.save();
```

### Issue 2: total_qr_created not incrementing
**Cause:** generateQRCode() not calling `activity.total_qr_created++`
**Check:** Line 1421 in attendance.controller.js
```javascript
activity.total_qr_created = (activity.total_qr_created || 0) + 1;
await activity.save();  // ← Must save!
```

### Issue 3: Frontend shows old points estimation
**Cause:** validateQRCode response doesn't include total_qr_created
**Check:** Line 1561 in attendance.controller.js
```javascript
res.json({
  ...
  total_qr_created: activityData ? activityData.total_qr_created : 0,
  max_points: activityData ? (activityData.max_points || 10) : 10
});
```

### Issue 4: Duplicate detection not working
**Cause:** Missing qr_code_id when submitting
**Check:** Form must send `session_id` = `qr_code_id`
```javascript
qr_code_id: qrCodeId,  // From URL or form
```

---

## 📝 Making Changes

### Change 1: Modify Points Formula
```
File: attendance.controller.js, line 1027
Change: Math.floor((scan_order / total_qr_at_scan) * max_points_from_activity)
Also update: qr-attendance-form.html, line 403 (predictPoints function)
Test: Run DYNAMIC_QR_TESTING_GUIDE.md scenarios
```

### Change 2: Change Default Max Points
```
File: activity.model.js, line 113
Change: default: 10  →  default: 20
Note: Existing activities keep their values, only new ones use new default
```

### Change 3: Add New Field to Attendance
```
File: attendance.model.js
Add: your_new_field: { type: String }
File: attendance.controller.js, submitAttendance()
Add: your_new_field: value
Test: Verify new field saves to database
```

### Change 4: Change Frontend Display
```
File: qr-attendance-form.html, line 410-422
Update: infoHTML template with new info
Test: Check browser displays correctly
```

---

## 🧪 Testing Before Deploy

### Unit Test Points Calculation:
```javascript
// Test file: backend/tests/attendance.points.test.js

test('(1/1)*10 = 10', () => {
  expect(calculatePoints(1, 1, 10)).toBe(10);
});

test('(1/2)*10 = 5', () => {
  expect(calculatePoints(1, 2, 10)).toBe(5);
});

test('(4/3)*10 capped = 10', () => {
  expect(calculatePoints(4, 3, 10)).toBe(10);
});
```

### Manual Test Checklist:
- [ ] Create activity with max_points=10
- [ ] Generate QR1 → Check total_qr_created=1
- [ ] Student A scans QR1 → Should get 10 points
- [ ] Generate QR2 → Check total_qr_created=2
- [ ] Student A scans QR2 → Should get 10 points (2/2)
- [ ] Student B scans QR1 → Should get 5 points (1/2)
- [ ] Student B tries QR1 again → Error "đã quét"
- [ ] Check response message includes scan_order

---

## 📞 Response Format

### Submit Attendance Response (Success)
```json
{
  "success": true,
  "message": "✅ Điểm danh thành công! Lần 2/3 - 6 điểm",
  "data": {
    "attendance_id": "...",
    "scan_order": 2,
    "total_qr_at_scan": 3,
    "points_earned": 6,
    "student_name": "Nguyễn A",
    "activity_id": "...",
    "scanned_at": "2025-11-30T10:15:00Z"
  }
}
```

### Validate QR Response (Success)
```json
{
  "success": true,
  "valid": true,
  "qr_name": "QR Buổi 1",
  "created_at": "2025-11-30T10:00:00Z",
  "expires_at": "2025-11-30T10:05:00Z",
  "scans_count": 5,
  "activity_id": "...",
  "total_qr_created": 3,
  "max_points": 10
}
```

---

## 🚀 Deployment Checklist

Before pushing to production:

- [ ] `activity.model.js` has `total_qr_created` and `max_points`
- [ ] `attendance.model.js` has proper indexes
- [ ] `generateQRCode()` increments `total_qr_created`
- [ ] `validateQRCode()` returns activity details
- [ ] `submitAttendance()` calculates points correctly
- [ ] Frontend `predictPoints()` matches backend formula
- [ ] All test scenarios pass (DYNAMIC_QR_TESTING_GUIDE.md)
- [ ] No console errors/warnings
- [ ] Database migration run (if needed)

**Deploy Command:**
```bash
git add .
git commit -m "feat: dynamic QR attendance scoring"
git push origin main
```

---

## 📚 Documentation Files

1. **DYNAMIC_QR_ATTENDANCE_PLAN.md** - Original implementation plan (5 phases)
2. **IMPLEMENTATION_COMPLETE_DYNAMIC_QR.md** - What was completed
3. **DYNAMIC_QR_TESTING_GUIDE.md** - How to test (11 scenarios)
4. **DYNAMIC_QR_DEVELOPER_GUIDE.md** - This file (for developers)

---

## ❓ FAQ

**Q: What if max_points is not set on activity?**
A: Code defaults to 10. But always set it explicitly when creating activity.

**Q: Can points be negative?**
A: No. Math.floor and Math.min ensure points ≥ 0 and ≤ max_points.

**Q: What if student deletes attendance record?**
A: Scan order recounts. If student has 1 attendance left, next scan is order=2 (not 1).

**Q: Can admin change points after scan?**
A: No, points are immutable. Delete and rescan if correction needed.

**Q: What happens if total_qr_created = 0?**
A: Code has fallback `|| 1` to prevent division by zero.

---

**Last Updated:** Nov 30, 2025  
**Status:** ✅ Ready for Development/Testing
