# 🎯 Attendance Sessions Test Guide

## Overview
Test the multi-session attendance system with 2 required sessions (Mid-Session & End-Session).

---

## Quick Start

### Option 1: Automatic Setup (Recommended)
```bash
cd backend
node scripts/seed-attendance-sessions.js
```

This creates:
- ✅ 1 Activity with multi-session config
- ✅ 2 Attendance Sessions (Mid & End)
- ✅ QR codes for each session
- ✅ Pre-configured attendance rules

**Output**: Activity ID and Session details in console

---

### Option 2: Manual Setup via GUI

1. **Open Test Page**
   ```
   http://localhost:3000/test-attendance.html
   ```

2. **Create Activity**
   - Click "Create Activity" button
   - Form auto-fills with default values
   - Click "Set Default Times" to use 2 hours from now
   - Submit to create activity + 2 sessions

3. **View Sessions**
   - Shows both sessions with timing
   - Click "View QR Code" to see QR image
   - Copy QR data for testing

---

## Activity Configuration

### Sessions Created
```
Session 1: Mid-Session Attendance
├─ Time: Activity start + 30 minutes
├─ Duration: 15 minutes
├─ QR ID: session_1
└─ Required: Yes

Session 2: End-Session Attendance
├─ Time: Activity start + 90 minutes
├─ Duration: 15 minutes
├─ QR ID: session_2
└─ Required: Yes
```

### Attendance Rules
- **Method**: `partial` (attend ≥ 50% of sessions)
- **Total Required**: 2 sessions
- **Threshold**: 50% attendance
- **Max Points**: 10 (5 per session)
- **Partial Points**: Yes (proportional to sessions attended)

---

## Test Scenarios

### Scenario 1: Attend Both Sessions (Full Score)
```
Scan: Session 1 → Session 2
Result:
  - Status: PRESENT ✅
  - Sessions: 2/2
  - Rate: 100%
  - Points: 10/10
```

### Scenario 2: Attend Only Mid-Session (Meets Threshold)
```
Scan: Session 1
Result:
  - Status: PRESENT ✅ (≥50%)
  - Sessions: 1/2
  - Rate: 50%
  - Points: 5/10 (partial points enabled)
```

### Scenario 3: Attend Only End-Session (Meets Threshold)
```
Scan: Session 2
Result:
  - Status: PRESENT ✅ (≥50%)
  - Sessions: 1/2
  - Rate: 50%
  - Points: 5/10
```

### Scenario 4: Attend Neither (Fail)
```
Scan: None
Result:
  - Status: ABSENT ❌
  - Sessions: 0/2
  - Rate: 0%
  - Points: 0/10
```

---

## How to Test

### Using the GUI Test Page

1. **Create Activity**
   - Open http://localhost:3000/test-attendance.html
   - Fill form or use defaults
   - Click "Create Activity"
   - Get Activity ID from success message

2. **Simulate Scan**
   - Click "View QR Code" on a session
   - QR data auto-populates in textarea
   - Optionally enter Student ID
   - Click "Simulate Scan"
   - View results

3. **Repeat for Multiple Sessions**
   - Scan Session 1, then Session 2
   - See status update from PARTIAL → PRESENT
   - Points increase from 5 → 10

### Using API (curl/Postman)

**1. Create Activity**
```bash
curl -X POST http://localhost:5000/api/activities \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "org_unit_id": "UNIT_ID",
    "title": "Multi-Session Event",
    "start_time": "2025-11-28T10:00:00Z",
    "end_time": "2025-11-28T12:00:00Z",
    "capacity": 100,
    "status": "approved"
  }'
```

**2. Create Sessions**
```bash
curl -X POST http://localhost:5000/api/attendances/activity/ACTIVITY_ID/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "sessions": [
      {
        "session_number": 1,
        "name": "Mid-Session",
        "start_time": "2025-11-28T10:30:00Z",
        "end_time": "2025-11-28T10:45:00Z",
        "required": true
      },
      {
        "session_number": 2,
        "name": "End-Session",
        "start_time": "2025-11-28T11:30:00Z",
        "end_time": "2025-11-28T11:45:00Z",
        "required": true
      }
    ]
  }'
```

**3. Scan QR Code**
```bash
curl -X POST http://localhost:5000/api/attendances/scan-qr \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "activityId": "ACTIVITY_ID",
    "sessionId": "session_1",
    "studentId": "STUDENT_ID"
  }'
```

---

## Configuration Methods

You can change attendance calculation method via API:

```bash
curl -X PUT http://localhost:5000/api/attendances/activity/ACTIVITY_ID/config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "calculation_method": "all",  # or "partial" or "first_match"
    "attendance_threshold": 0.8,   # 80%
    "points_config": {
      "points_per_session": 5,
      "partial_points": true,
      "max_points": 15
    }
  }'
```

### Methods Explained:
- **`all`**: Must attend ALL sessions to be marked PRESENT
- **`partial`**: Attend ≥ threshold (default 50%) to be PRESENT
- **`first_match`**: Only need to attend 1 session

---

## Expected Output (Seed Script)

```
📡 Connecting to MongoDB...
✅ Connected!
✅ Created Activity: 65a1b2c3d4e5f6g7h8i9j0k1
   Title: Demo Event - Multi-Session Attendance
   Time: 2025-11-28 14:30:00 to 2025-11-28 16:30:00
✅ Created Session 1: Mid-Session Attendance
   Time: 2025-11-28 15:00:00 to 2025-11-28 15:15:00
✅ Created Session 2: End-Session Attendance
   Time: 2025-11-28 16:00:00 to 2025-11-28 16:15:00
✅ Activity updated with sessions!

============================================================
📋 TEST INFORMATION
============================================================

Activity ID: 65a1b2c3d4e5f6g7h8i9j0k1
Activity Name: Demo Event - Multi-Session Attendance
Required Sessions: 2
Calculation Method: partial
Max Points: 10

Session 1: Mid-Session Attendance
  - QR Code ID: session_1
  - Time Window: 2025-11-28 15:00:00

Session 2: End-Session Attendance
  - QR Code ID: session_2
  - Time Window: 2025-11-28 16:00:00

Test scenarios:
1. Scan Session 1 QR → status: partial, points: 5/10
2. Scan Session 2 QR → status: present, points: 10/10
3. Scan both → status: present, points: 10/10
4. Scan neither → status: absent, points: 0
============================================================
```

---

## Database Collections

After setup, check MongoDB:

```javascript
// View Activity
db.activity.findOne({ title: "Demo Event - Multi-Session Attendance" })

// View Sessions
db.attendance_session.find({ activity_id: ObjectId("...") }).sort({ session_number: 1 })

// View Attendance Records
db.attendance.find({ activity_id: ObjectId("...") })
```

---

## Troubleshooting

### QR Code Not Generated
- Check if `qrcode` package is installed: `npm list qrcode`
- Verify session start/end times are valid dates

### Scan Fails with "Session not found"
- Confirm sessionId matches (e.g., "session_1", "session_2")
- Check activity has sessions: `GET /api/attendances/activity/ACTIVITY_ID/sessions`

### Points Not Calculated
- Verify `attendance_config.points_config` exists
- Check calculation method supports partial points
- Ensure `partial_points: true` in config

### Status Shows "absent" but attended 50%
- Change `calculation_method` to "partial"
- Verify `attendance_threshold: 0.5`
- Try full attendance (2/2 sessions)

---

## Files Created

```
backend/scripts/
└── seed-attendance-sessions.js   ← Run this to auto-setup

frontend/public/
└── test-attendance.html          ← Open in browser
```

---

## Quick Commands

```bash
# Seed data
cd backend && node scripts/seed-attendance-sessions.js

# Run server
npm start

# Open test page
# http://localhost:3000/test-attendance.html

# Check MongoDB
mongo "mongodb://..." --eval "db.activity.countDocuments()"
```

---

## Next Steps

After testing:
1. ✅ Verify attendance calculation logic
2. ✅ Test partial point distribution
3. ✅ Verify QR code generation for different sessions
4. ✅ Check feedback mechanism with multi-session
5. ✅ Integration test with student registration

---

**Created**: Nov 27, 2025  
**Test Status**: Ready for Testing ✅
