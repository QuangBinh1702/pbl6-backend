# 🧪 GEOFENCE - QUICK TEST GUIDE

## Test Scenario 1: Staff Tạo QR

**Bước 1-3 (Tạo QR):**
```
1. Mở: http://localhost:5000/qr-manager.html
2. Login bằng staff token
3. Chọn Activity
4. Bấm "📍 Lấy GPS Hiện Tại"
   → Cấp phép truy cập vị trị
   → Xác nhận nhận được lat/lng/accuracy
5. Bấm "🎯 Tạo QR tại vị trị này"
   → QR tạo thành công
   → Hiển thị location info: [10.7769, 106.6869]
```

**Expected Response:**
```json
{
  "success": true,
  "message": "✅ QR tạo thành công tại vị trí [10.7769, 106.6869]",
  "data": {
    "qr_id": "...",
    "qr_code": "data:image/png;base64,...",
    "location": {
      "latitude": 10.7769,
      "longitude": 106.6869,
      "accuracy_m": 25
    },
    "geofence_radius_m": 80
  }
}
```

---

## Test Scenario 2: Student Quét QR - ✅ TRONG VÙNG

**Bước 1-4 (Quét + Submit):**
```
1. Mở: http://localhost:5000/scan-attendance.html
2. Quét QR vừa tạo
3. Điền form (MSSV, tên, lớp, khoa)
4. Bấm "📍 Gửi Điểm Danh (Lấy GPS)"
   → Cấp phép truy cập vị trị
   → Lấy GPS từ vị trị GẦN (trong 80m)
```

**Expected Result:**
```json
{
  "success": true,
  "message": "✅ Điểm danh thành công! Lần 1/X - Y điểm",
  "data": {
    "attendance_id": "...",
    "scan_order": 1,
    "location_data": {
      "distance_m": 45,
      "required_distance_m": 80,
      "within_geofence": true
    }
  }
}
```

**UI Message:**
```
✅ Gửi điểm danh thành công! Vui lòng chờ duyệt.
📍 Khoảng cách: 45m (cho phép 80m)
```

---

## Test Scenario 3: Student Quét QR - ❌ NGOÀI VÙNG

**Bước 1-4 (Quét + Submit từ quá xa):**
```
1. Mở: http://localhost:5000/scan-attendance.html
2. Quét QR vừa tạo
3. Điền form
4. Di chuyển ĐẾN VỊ TRÍ KHÁC (cách > 80m)
5. Bấm "📍 Gửi Điểm Danh (Lấy GPS)"
   → Lấy GPS từ vị trị QUAY XA
```

**Expected Error Response:**
```json
{
  "success": false,
  "message": "❌ Quá xa điểm danh: 150m (cho phép 80m). Vui lòng di chuyển đến gần điểm danh hơn.",
  "data": {
    "distance_m": 150,
    "required_distance_m": 80
  }
}
```

**UI Message:**
```
❌ Quá xa điểm danh: 150m (cho phép 80m)
```

---

## Test Scenario 4: Permission Denied

**Bước:**
```
1. Staff nhấc "📍 Lấy GPS Hiện Tại"
   → Browser yêu cầu permission
2. Click "Block" hoặc "Không"
```

**Expected Error:**
```
❌ Cần bật Permission vị trị để tạo QR

Hoặc lúc student submit:
❌ Cần bật Permission vị trị. Vui lòng cấp quyền truy cập vị trị
```

---

## Curl Commands to Test API

### **1. Generate QR with Location (Staff)**
```bash
curl -X POST http://localhost:5000/api/attendances/generate-qr \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "activity_id": "ACTIVITY_ID",
    "qr_name": "Test QR",
    "duration_minutes": 30,
    "location": {
      "latitude": 10.7769,
      "longitude": 106.6869,
      "accuracy": 25
    }
  }'
```

### **2. Submit Attendance with Location (Student)**
```bash
curl -X POST http://localhost:5000/api/attendances/submit-attendance \
  -H "Content-Type: application/json" \
  -d '{
    "activity_id": "ACTIVITY_ID",
    "session_id": "QR_CODE_ID",
    "student_info": {
      "student_id_number": "202001234",
      "student_name": "Nguyễn Văn A",
      "class": "CLASS_ID",
      "faculty": "FACULTY_ID"
    },
    "scan_location": {
      "latitude": 10.7775,
      "longitude": 106.6875,
      "accuracy": 20
    }
  }'
```

### **3. Check Attendance Record (with location)**
```bash
curl -X GET "http://localhost:5000/api/attendances?activity_id=ACTIVITY_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response should include:
{
  "attendance_id": "...",
  "scan_location": {
    "latitude": 10.7775,
    "longitude": 106.6875,
    "accuracy_m": 20
  },
  "distance_from_qr_m": 45,
  "within_geofence": true,
  "location_status": "OK"
}
```

---

## Database Check

### **Check QR Record with Location:**
```javascript
db.qr_codes.findOne(
  { _id: ObjectId("QR_ID") },
  {
    location: 1,
    geofence_radius_m: 1,
    _id: 0
  }
)

// Expected:
{
  "location": {
    "latitude": 10.7769,
    "longitude": 106.6869,
    "checkpoint_name": "Điểm danh",
    "accuracy_m": 25,
    "created_at": ISODate("2025-01-20T10:00:00.000Z")
  },
  "geofence_radius_m": 80
}
```

### **Check Attendance Record with Location:**
```javascript
db.attendance.findOne(
  { _id: ObjectId("ATTENDANCE_ID") },
  {
    scan_location: 1,
    distance_from_qr_m: 1,
    within_geofence: 1,
    location_status: 1,
    _id: 0
  }
)

// Expected:
{
  "scan_location": {
    "latitude": 10.7775,
    "longitude": 106.6875,
    "accuracy_m": 20
  },
  "distance_from_qr_m": 45,
  "within_geofence": true,
  "location_status": "OK"
}
```

---

## Distance Verification

**Formula sử dụng: Haversine**
```javascript
// Tính khoảng cách giữa 2 điểm GPS
calculateDistance(
  10.7769,  // QR latitude
  106.6869, // QR longitude
  10.7775,  // Scan latitude (cách ~50m về phía NE)
  106.6875  // Scan longitude
) = ~45 meters
```

**Test values:**
- QR tạo tại: 10.7769, 106.6869
- Quét từ (45m away): 10.7775, 106.6875 → ✅ OK (< 80m)
- Quét từ (150m away): 10.7799, 106.6919 → ❌ REJECT (> 80m)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `❌ Vị trí là bắt buộc` | Staff chưa bấm "📍 Lấy GPS Hiện Tại" trước |
| `❌ Quá xa điểm danh` | Student quét từ vị trị > 80m khác |
| `❌ Cần bật Permission` | Browser chặn quyền truy cập vị trí |
| GPS không lấy được | Check HTTPS (local localhost OK), Check WiFi/Mobile data |
| `location undefined` | Request body không gửi scan_location |

---

## Notes

1. **Default Geofence:** 80 meters (configurable)
2. **GPS Accuracy:** Thường 10-30m trên điện thoại (lấy từ position.coords.accuracy)
3. **Server Side:** Kiểm tra geofence trên backend (secure)
4. **Logging:** Tất cả location data được lưu để audit trail

---

**Status:** Ready for testing! 🚀
