# QR Code Attendance System - Implementation Guide

## Overview
This guide documents the complete QR code attendance system implementation for activities.

## Flow Diagram

```
1. ADMIN CREATES ACTIVITY
   └─ POST /api/activities
      └─ System auto-generates QR code (Base64 data URL)
      └─ QR code stored in Activity.qr_code

2. ADMIN APPROVES REGISTRATION
   └─ PUT /api/registrations/:id/approve
      └─ Registration status = "approved"

3. STUDENT SCANS QR CODE
   └─ Mobile app / Scanner reads QR
   └─ Extracts: { activityId, activityTitle, timestamp }
   └─ POST /api/attendances/scan-qr
      └─ Validates:
         ├─ Student exists
         ├─ Activity exists and is ongoing (within 30 min before to end time)
         ├─ Student has approved registration
         └─ Student hasn't already scanned
      └─ Creates Attendance record
      └─ Auto-updates Registration status to "attended"

4. OPTIONAL: STAFF VERIFIES
   └─ PUT /api/attendances/:id/verify
      └─ Sets verified = true
```

## API Endpoints

### 1. Create Activity (Auto-generate QR Code)
**Endpoint:** `POST /api/activities`

**Request:**
```json
{
  "title": "Tình nguyện dọn dẹp",
  "description": "Hoạt động tình nguyện",
  "location": "Sân vận động",
  "start_time": "2025-12-10T10:00:00Z",
  "end_time": "2025-12-10T12:00:00Z",
  "capacity": 100,
  "registration_open": "2025-12-01T00:00:00Z",
  "registration_close": "2025-12-09T23:59:59Z",
  "org_unit_id": "507f1f77bcf86cd799439011",
  "field_id": "507f1f77bcf86cd799439012"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "title": "Tình nguyện dọn dẹp",
    "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAS0AAABkCAYAAABN...",
    "status": "chưa tổ chức",
    ...
  }
}
```

---

### 2. Get QR Code Image
**Endpoint:** `GET /api/activities/:id/qr-code`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "activityId": "507f1f77bcf86cd799439013",
    "title": "Tình nguyện dọn dẹp",
    "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAS0AAABkCAYAAABN..."
  }
}
```

**Usage:**
- Display in admin panel to print/project at event location
- Can be embedded in `<img src="data_url">` in HTML
- Can be downloaded as PNG file

---

### 3. Scan QR Code (Attendance)
**Endpoint:** `POST /api/attendances/scan-qr`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request:**
```json
{
  "qrData": "{\"activityId\":\"507f1f77bcf86cd799439013\",\"activityTitle\":\"Tình nguyện dọn dẹp\",\"timestamp\":\"2025-12-10T10:15:00.000Z\"}"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Điểm danh thành công",
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "student_id": {
      "_id": "507f1f77bcf86cd799439015",
      "user_id": {
        "_id": "507f1f77bcf86cd799439016",
        "username": "nguyenvan.a",
        "email": "nguyenvan.a@university.edu"
      }
    },
    "activity_id": {
      "_id": "507f1f77bcf86cd799439013",
      "title": "Tình nguyện dọn dẹp"
    },
    "status": "present",
    "scanned_at": "2025-12-10T10:15:32.456Z",
    "verified": false
  }
}
```

**Error Responses:**

400 - QR code not provided:
```json
{
  "success": false,
  "message": "QR code data is required"
}
```

400 - Invalid QR format:
```json
{
  "success": false,
  "message": "Invalid QR code format"
}
```

404 - Activity not found:
```json
{
  "success": false,
  "message": "Activity not found"
}
```

400 - Activity not yet started:
```json
{
  "success": false,
  "message": "Hoạt động chưa bắt đầu. Vui lòng quay lại gần giờ bắt đầu"
}
```

400 - Activity ended:
```json
{
  "success": false,
  "message": "Hoạt động đã kết thúc. Không thể điểm danh"
}
```

403 - Not approved for activity:
```json
{
  "success": false,
  "message": "Bạn chưa được duyệt để tham gia hoạt động này"
}
```

400 - Already scanned:
```json
{
  "success": false,
  "message": "Bạn đã điểm danh rồi"
}
```

---

### 4. Verify Attendance (Optional)
**Endpoint:** `PUT /api/attendances/:id/verify`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "verified": true,
    "verified_at": "2025-12-10T10:30:00.000Z",
    ...
  }
}
```

---

## QR Code Data Format

QR code stores JSON with the following structure:

```json
{
  "activityId": "507f1f77bcf86cd799439013",
  "activityTitle": "Tình nguyện dọn dẹp",
  "timestamp": "2025-12-10T10:00:00.000Z"
}
```

**Size:** Base64 string (~300x300px PNG image)
**Error Correction Level:** High (H) - 30% data recovery capability
**Encoding:** UTF-8

---

## Validation Rules

### 1. Activity Status
- Only allow scanning during activity time window
- Scanning window: 30 minutes before start until activity end time
- If activity not yet started: Return error "Hoạt động chưa bắt đầu..."
- If activity ended: Return error "Hoạt động đã kết thúc..."

### 2. Registration Status
- Only allow scanning if `ActivityRegistration.status == "approved"`
- If pending: Return 403 "Chưa được duyệt để tham gia"
- If rejected: Return 403 "Đơn đăng ký bị từ chối"

### 3. Attendance Record
- Prevent duplicate scans (same student + activity)
- If already scanned: Return 400 "Bạn đã điểm danh rồi"

### 4. QR Code Format
- Must be valid JSON with `activityId` field
- If invalid: Return 400 "Invalid QR code format"

---

## Database Changes

### Activity Model
- `qr_code` (String): Base64-encoded PNG image data
- Already exists in model, no migration needed

### Attendance Model
- No changes needed
- Existing fields: `scanned_at`, `status`, `verified`, `verified_at`

### ActivityRegistration Model
- `attendance_record_id` (ObjectId ref Attendance): Links to attendance record
- Already exists in model, no migration needed
- Auto-updated when attendance is created via QR scan

---

## Frontend Integration

### Step 1: Install QR Scanner Library
```bash
npm install qr-scanner
# or
npm install html5-qrcode
```

### Step 2: Create QR Scanner Component
```jsx
import { useState, useRef } from 'react';
import QrScanner from 'qr-scanner';

function ActivityQRScanner({ activityId }) {
  const videoRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState(null);

  const startScan = async () => {
    setIsScanning(true);
    const scanner = new QrScanner(
      videoRef.current,
      (result) => handleScan(result.data),
      {
        onDecodeError: (error) => console.log(error),
        preferredCamera: 'environment'
      }
    );
    await scanner.start();
  };

  const handleScan = async (qrData) => {
    try {
      const response = await fetch('/api/attendances/scan-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ qrData })
      });

      const data = await response.json();
      if (data.success) {
        setResult({ success: true, message: data.message });
      } else {
        setResult({ success: false, message: data.message });
      }
    } catch (error) {
      setResult({ success: false, message: error.message });
    }
  };

  return (
    <div>
      <video ref={videoRef} style={{ width: '100%' }} />
      <button onClick={startScan}>Start Scanning</button>
      {result && <p>{result.message}</p>}
    </div>
  );
}
```

### Step 3: Display QR Code at Event
```jsx
function DisplayActivityQR({ activityId }) {
  const [qrCode, setQrCode] = useState(null);

  useEffect(() => {
    fetch(`/api/activities/${activityId}/qr-code`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => setQrCode(d.data.qr_code));
  }, [activityId]);

  return (
    <div>
      <h2>Scan to Check In</h2>
      {qrCode && <img src={qrCode} alt="QR Code" style={{ width: '300px' }} />}
    </div>
  );
}
```

---

## Testing Checklist

- [ ] Create activity → QR code auto-generated
- [ ] QR code readable by scanner apps
- [ ] Get QR code endpoint returns correct image
- [ ] Scan QR → Attendance created successfully
- [ ] Duplicate scan → Error returned
- [ ] Scan before activity start → Error returned
- [ ] Scan after activity end → Error returned
- [ ] Scan without approved registration → Error 403
- [ ] ActivityRegistration status updated to "attended"
- [ ] Student sees "Điểm danh thành công" message
- [ ] Points assigned (if configured)
- [ ] PvcdRecord updated (if configured)

---

## Troubleshooting

### QR Code Not Generated
- Check if `qrcode` npm package is installed: `npm list qrcode`
- Check server logs for QR generation errors
- Try manually calling the `/qr-code` endpoint which regenerates if missing

### QR Code Not Scanning
- Ensure QR code is at least 300x300px
- Check lighting conditions (needs good lighting)
- Verify QR code is not damaged/corrupted
- Try different QR scanner app

### Attendance Not Created
- Check if student has "approved" registration
- Check if activity time is correct
- Verify student profile exists
- Check server logs for errors

### Registration Not Updated to "attended"
- Ensure `attendance_record_id` is populated
- Check ActivityRegistration permissions

---

## Security Considerations

1. **QR Code Exposure:** Base64 string is visible in database and API responses
   - QR code contains only activity ID, not sensitive data
   - Validate registration before creating attendance

2. **Replay Attacks:** Same QR code scanned multiple times
   - Prevented by duplicate scan check
   - Each student can only scan once per activity

3. **Timing Attacks:** Scanning outside activity window
   - Validated by activity start/end time check
   - 30-minute pre-activity window to allow setup scanning

4. **Unauthorized Access:** Non-approved students scanning
   - Verified by registration status check
   - Prevented if status != "approved"

---

## Configuration

### Scanning Window
Default: 30 minutes before activity start

To modify, edit in `scanQRCode()`:
```javascript
const scanStartWindow = new Date(startTime.getTime() - 30 * 60000);
// Change 30 to desired minutes
```

### QR Code Size
Default: 300x300px with 1px margin

To modify, edit in `generateActivityQRCode()`:
```javascript
width: 300,  // Change pixel width
margin: 1    // Change margin
```

### Error Correction Level
Default: High (H) - 30% recovery

Options: L (7%), M (15%), Q (25%), H (30%)

---

## Files Modified/Created

### Modified Files
- `backend/src/controllers/activity.controller.js` - Added QR generation and retrieval
- `backend/src/controllers/attendance.controller.js` - Enhanced QR scanning validation
- `backend/src/routes/activity.routes.js` - Added QR code endpoint

### Created Files
- `backend/src/utils/qr_code.util.js` - QR code utility functions
- `QR_CODE_ATTENDANCE_GUIDE.md` - This documentation

---

## Performance Notes

- QR code generation is async but doesn't block activity creation
- QR code is stored as Base64 string (~2-3KB per activity)
- Scanning validation includes activity lookup but is optimized with indexes
- Consider caching QR codes in frontend for display to reduce API calls

---

## Future Enhancements

1. **QR Code Variants:**
   - Store both Base64 and PNG file versions
   - Generate mobile-optimized QR codes
   - Add activity details inside QR (requires larger codes)

2. **Advanced Validation:**
   - IP-based location validation
   - Biometric verification
   - Camera timestamp validation

3. **Reporting:**
   - Real-time attendance dashboard
   - QR scan statistics
   - Attendance rate analytics

4. **Integration:**
   - SMS notifications on successful attendance
   - Email confirmation
   - Calendar integration

---

## Support

For issues or questions:
1. Check error message in API response
2. Review server logs in `backend/logs/`
3. Verify database connection
4. Check QR scanner app is up-to-date
