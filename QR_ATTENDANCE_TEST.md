# QR Code Attendance - Quick Test Guide

## Prerequisites
- Backend running on `http://localhost:3000`
- Valid JWT token for testing
- Postman, curl, or similar API testing tool

---

## Test Sequence

### 1. Create Activity with QR Code
**Request:**
```bash
curl -X POST http://localhost:3000/api/activities \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test QR Activity",
    "description": "Testing QR code attendance",
    "location": "Test Location",
    "start_time": "2025-12-20T10:00:00Z",
    "end_time": "2025-12-20T12:00:00Z",
    "capacity": 50,
    "org_unit_id": "507f1f77bcf86cd799439011"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "ACTIVITY_ID",
    "title": "Test QR Activity",
    "qr_code": "data:image/png;base64,...",
    "status": "chưa tổ chức"
  }
}
```

**Save ACTIVITY_ID for next tests**

---

### 2. Get QR Code Image
**Request:**
```bash
curl -X GET http://localhost:3000/api/activities/ACTIVITY_ID/qr-code \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "activityId": "ACTIVITY_ID",
    "title": "Test QR Activity",
    "qr_code": "data:image/png;base64,..."
  }
}
```

**Verification:**
- Copy the `qr_code` value (without `data:image/png;base64,` prefix)
- Go to https://www.base64.guru/tools/decode
- Paste and decode - should see PNG image
- Or use this Python code:

```python
import base64
import re

qr_data = "YOUR_QR_CODE_BASE64_STRING"
# Remove data URL prefix if present
qr_data = re.sub(r'^data:image/png;base64,', '', qr_data)
with open('qr_code.png', 'wb') as f:
    f.write(base64.b64decode(qr_data))
print("QR code saved to qr_code.png")
```

---

### 3. Manually Extract QR Data
The QR code contains this data:

```json
{
  "activityId": "ACTIVITY_ID",
  "activityTitle": "Test QR Activity",
  "timestamp": "2025-12-20T10:00:00.000Z"
}
```

You can use this directly for scanning tests without needing a physical QR scanner.

---

### 4. Register Student for Activity
**Prerequisites:**
- Student profile exists
- Get `STUDENT_ID` from student profile

**Request:**
```bash
curl -X POST http://localhost:3000/api/registrations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "activity_id": "ACTIVITY_ID",
    "student_id": "STUDENT_ID"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "REGISTRATION_ID",
    "status": "pending",
    "activity_id": "ACTIVITY_ID",
    "student_id": "STUDENT_ID"
  }
}
```

**Save REGISTRATION_ID**

---

### 5. Approve Registration (Admin)
**Request:**
```bash
curl -X PUT http://localhost:3000/api/registrations/REGISTRATION_ID/approve \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "approval_note": "Approved for test"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "REGISTRATION_ID",
    "status": "approved",
    "approved_at": "2025-12-20T...",
    "approved_by": "ADMIN_ID"
  }
}
```

---

### 6. Scan QR Code (Create Attendance)
**Important:** Use student's JWT token, not admin token

**Request:**
```bash
curl -X POST http://localhost:3000/api/attendances/scan-qr \
  -H "Authorization: Bearer STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "qrData": "{\"activityId\":\"ACTIVITY_ID\",\"activityTitle\":\"Test QR Activity\",\"timestamp\":\"2025-12-20T10:00:00.000Z\"}"
  }'
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Điểm danh thành công",
  "data": {
    "_id": "ATTENDANCE_ID",
    "student_id": {
      "_id": "STUDENT_ID",
      "user_id": {
        "_id": "USER_ID",
        "username": "student_username"
      }
    },
    "activity_id": {
      "_id": "ACTIVITY_ID",
      "title": "Test QR Activity"
    },
    "status": "present",
    "scanned_at": "2025-12-20T..."
  }
}
```

**Save ATTENDANCE_ID**

---

### 7. Verify Registration Updated
**Request:**
```bash
curl -X GET http://localhost:3000/api/registrations/REGISTRATION_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
Should show:
```json
{
  "success": true,
  "data": {
    "_id": "REGISTRATION_ID",
    "status": "attended",
    "attendance_record_id": "ATTENDANCE_ID"
  }
}
```

---

### 8. Test Duplicate Scan (Should Fail)
**Request:**
```bash
curl -X POST http://localhost:3000/api/attendances/scan-qr \
  -H "Authorization: Bearer STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "qrData": "{\"activityId\":\"ACTIVITY_ID\",\"activityTitle\":\"Test QR Activity\",\"timestamp\":\"2025-12-20T10:00:00.000Z\"}"
  }'
```

**Expected Response (400):**
```json
{
  "success": false,
  "message": "Bạn đã điểm danh rồi"
}
```

---

### 9. Test Invalid QR Data (Should Fail)
**Request:**
```bash
curl -X POST http://localhost:3000/api/attendances/scan-qr \
  -H "Authorization: Bearer STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "qrData": "invalid json data"
  }'
```

**Expected Response (400):**
```json
{
  "success": false,
  "message": "Invalid QR code format"
}
```

---

### 10. Test Scan Without Approval (Should Fail)
**Setup:**
1. Create new activity
2. Register new student (don't approve)
3. Try to scan

**Request:**
```bash
curl -X POST http://localhost:3000/api/attendances/scan-qr \
  -H "Authorization: Bearer NEW_STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "qrData": "{\"activityId\":\"ACTIVITY_ID\",\"activityTitle\":\"...\",\"timestamp\":\"...\"}"
  }'
```

**Expected Response (403):**
```json
{
  "success": false,
  "message": "Bạn chưa được duyệt để tham gia hoạt động này"
}
```

---

## Verification Queries (MongoDB)

### Check Attendance Created
```javascript
db.attendance.findOne({ activity_id: ObjectId("ACTIVITY_ID") })
```

Should return document with:
- `status: "present"`
- `scanned_at: <timestamp>`
- `verified: false`

### Check Registration Updated
```javascript
db.activity_registration.findOne({ _id: ObjectId("REGISTRATION_ID") })
```

Should show:
- `status: "attended"`
- `attendance_record_id: ObjectId("ATTENDANCE_ID")`

### Check QR Code Stored
```javascript
db.activity.findOne({ _id: ObjectId("ACTIVITY_ID") })
```

Should show:
- `qr_code: "data:image/png;base64,..."`

---

## Common Issues & Solutions

### Issue: "Student profile not found"
- Solution: Ensure student_id is correct and StudentProfile exists
- Check: `db.student_profiles.findOne({ user_id: ObjectId("USER_ID") })`

### Issue: "Activity not found"
- Solution: Verify ACTIVITY_ID is correct
- Check: `db.activity.findOne({ _id: ObjectId("ACTIVITY_ID") })`

### Issue: "Invalid QR code format"
- Solution: Ensure qrData is valid JSON string
- Format: `{"activityId":"...", "activityTitle":"...", "timestamp":"..."}`

### Issue: "Bạn chưa được duyệt"
- Solution: Registration status must be "approved" not "pending"
- Check: `db.activity_registration.findOne({ _id: ObjectId("REGISTRATION_ID") })`

### Issue: Token expired
- Solution: Get fresh JWT token from login endpoint
- Check token expiry with: `https://jwt.io/`

---

## Performance Testing

### Bulk Scan Test
Generate 100 attendance records:

```bash
for i in {1..100}; do
  curl -X POST http://localhost:3000/api/attendances/scan-qr \
    -H "Authorization: Bearer STUDENT_TOKEN_$i" \
    -H "Content-Type: application/json" \
    -d "{\"qrData\": \"{\\\"activityId\\\":\\\"ACTIVITY_ID\\\",\\\"activityTitle\\\":\\\"Test\\\",\\\"timestamp\\\":\\\"2025-12-20T10:00:00Z\\\"}\"}" \
    &
done
wait
```

Monitor server performance:
- Check response times
- Monitor CPU/Memory usage
- Verify all records created in database

---

## Success Criteria

✅ **All 10 tests pass**
- Activity created with QR code
- QR code retrievable and valid
- Student registration successful
- Registration approval works
- QR scan creates attendance
- Duplicate scan prevented
- Invalid QR rejected
- Unapproved student blocked
- Registration status updated
- Data persisted correctly

✅ **Database integrity**
- Attendance records linked to Activity and Student
- Registration records linked to Attendance
- No orphaned records
- All timestamps correct

✅ **Error handling**
- All error messages in Vietnamese
- Appropriate HTTP status codes
- No console errors in backend logs

---

## Next Steps After Testing

1. **Frontend Implementation**
   - Install QR scanner library (html5-qrcode or qr-scanner)
   - Create QR scanner component
   - Create QR display component

2. **Mobile App Integration**
   - Build QR scanner interface
   - Add real-time scanning with camera
   - Handle network errors gracefully

3. **Admin Features**
   - QR code display/print at events
   - Real-time attendance tracking
   - Download attendance reports

4. **Analytics**
   - Track attendance rates per activity
   - Identify peak scanning times
   - Generate statistics reports

---

## Support Files

- **Documentation:** `/QR_CODE_ATTENDANCE_GUIDE.md`
- **Utility Functions:** `/backend/src/utils/qr_code.util.js`
- **Modified Controllers:**
  - `/backend/src/controllers/activity.controller.js`
  - `/backend/src/controllers/attendance.controller.js`
- **Routes:** `/backend/src/routes/activity.routes.js`
