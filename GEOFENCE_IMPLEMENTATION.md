# ✅ GEOFENCE TRACKING IMPLEMENTATION - COMPLETE

## Summary

Tôi đã hoàn thành implement hệ thống tracking vị trí (geofence) cho QR code attendance. Hệ thống tự động lấy GPS của staff lúc tạo QR, rồi so sánh với vị trí của sinh viên lúc quét.

---

## 📋 Changes Made

### 1. **Database Models**

#### `qr_code.model.js` ✅
```javascript
// Thêm location field để lưu vị trí tạo QR
location: {
  latitude: Number,
  longitude: Number,
  checkpoint_name: String,
  accuracy_m: Number,
  created_at: Date
}

// Geofence radius (default 80m)
geofence_radius_m: { type: Number, default: 80 }
```

#### `attendance.model.js` ✅
```javascript
// Lưu vị trí quét
scan_location: {
  latitude: Number,
  longitude: Number,
  accuracy_m: Number
}

// Kết quả kiểm tra
distance_from_qr_m: Number,
within_geofence: Boolean,
location_status: String  // 'OK', 'OUT_OF_RANGE', 'NO_GPS', 'LOCATION_DENIED'
```

---

### 2. **Backend Controller Updates**

#### `attendance.controller.js` ✅

**A. New Utility Function:**
```javascript
calculateDistance(lat1, lon1, lat2, lon2) {
  // Haversine formula - tính khoảng cách giữa 2 điểm GPS
  // Returns: distance in meters
}
```

**B. generateQRCode() - Updated:**
```
Input: {
  activity_id,
  qr_name,
  duration_minutes,
  location: {          // 🆕 REQUIRED
    latitude,
    longitude,
    accuracy,
    geofence_radius_m  // optional
  }
}

Logic:
- Kiểm tra location bắt buộc
- Lưu location vào QR record
- Lưu geofence_radius_m (default 80m)

Output: 
- location data trong response
```

**C. submitAttendance() - Updated:**
```
Input: {
  activity_id,
  session_id (qr_code_id),
  student_info,
  scan_location: {     // 🆕 NEW
    latitude,
    longitude,
    accuracy
  }
}

New Logic:
1. Validate QR (existing)
2. 🆕 GEOFENCE CHECK:
   - Tính distance = calculateDistance(qr_lat, qr_lng, scan_lat, scan_lng)
   - So sánh: distance ≤ geofence_radius_m?
   - Nếu KHÔNG → return 400 error (quá xa)
3. Lưu attendance với location data:
   - scan_location
   - distance_from_qr_m
   - within_geofence
   - location_status
4. Return location verification info

Output:
- location_data: {
    distance_m,
    required_distance_m,
    within_geofence
  }
```

---

### 3. **Frontend Updates**

#### `qr-manager.html` ✅ (Dành cho Staff)

**Flow:**
1. Staff chọn Activity
2. Bấm nút "📍 Lấy GPS Hiện Tại"
   - Auto capture GPS từ điện thoại
   - Hiển thị vị trí đã lấy
3. Bấm nút "🎯 Tạo QR tại vị trí này"
   - Gửi location kèm request

**New Elements:**
```html
<!-- Location Info Display -->
<div id="locationInfo">
  <label>📍 Vị trí Tạo QR</label>
  <p id="locationStatus">Chưa lấy vị trí</p>
  <p id="locationCoords">Lat: ..., Lng: ...</p>
</div>

<!-- Buttons -->
<button onclick="captureLocationForQR()">📍 Lấy GPS Hiện Tại</button>
<button onclick="generateNewQR()">🎯 Tạo QR tại vị trí này</button>
```

**JavaScript:**
```javascript
let capturedLocation = null;

async function captureLocationForQR() {
  // Request permission
  // Get position
  // Store in capturedLocation
  // Update UI
}

async function generateNewQR() {
  // Check capturedLocation exist
  // Send location with request
  // Handle errors (NO_GPS, TIMEOUT, PERMISSION_DENIED)
}
```

#### `scan-attendance.html` ✅ (Dành cho Student)

**Flow:**
1. Student quét QR
2. Điền form thông tin
3. Bấm "📍 Gửi Điểm Danh (Lấy GPS)"
   - Auto capture GPS
   - Kiểm tra geofence
   - Submit
4. Hiển thị kết quả (khoảng cách, trong hay ngoài vùng)

**New Function:**
```javascript
async function captureLocationAndSubmit() {
  // Validate form
  // Request GPS permission
  // Get position
  // Call submitForm(scanLocation)
  // Handle errors
}

async function submitForm(scanLocation) {
  // Send request with scan_location
  // Show location verification result
  // Display success/error message
}
```

**Button Update:**
```html
<!-- Old -->
<button onclick="submitForm()">✅ Gửi Điểm Danh</button>

<!-- New -->
<button onclick="captureLocationAndSubmit()">📍 Gửi Điểm Danh (Lấy GPS)</button>
```

---

## 🎯 Key Features

### 1. **Auto GPS Capture (Automatic)**
- Staff lúc tạo QR: tự động lấy GPS từ điện thoại
- Student lúc quét: tự động lấy GPS lúc submit
- Hiển thị độ chính xác (accuracy in meters)

### 2. **Geofence Validation (Server-side)**
```
Formula: distance ≤ geofence_radius_m
Mặc định: 80 meters

Nếu quá xa:
  ❌ Request bị reject
  Message: "❌ Quá xa điểm danh: 150m (cho phép 80m)"
```

### 3. **Haversine Distance Calculation**
```javascript
// Công thức tính khoảng cách chính xác giữa 2 tọa độ GPS
distance = calculateDistance(qr_lat, qr_lng, scan_lat, scan_lng)
// Return: meters
```

### 4. **Error Handling**

| Case | Handling |
|------|----------|
| No GPS permission | ❌ "Cần bật Permission vị trí" |
| GPS timeout | ❌ "Timeout lấy vị trí. Vui lòng thử lại" |
| Out of geofence | ❌ "Quá xa điểm danh: 150m (cho phép 80m)" |
| Success | ✅ "Điểm danh thành công! 📍 Khoảng cách: 45m" |

### 5. **Location Data Logging**
```
Attendance record lưu:
- scan_location (lat, lng, accuracy)
- distance_from_qr_m (actual distance)
- within_geofence (boolean)
- location_status (OK/OUT_OF_RANGE/NO_GPS/LOCATION_DENIED)
```

---

## 📊 Data Flow

```
STAFF (Tạo QR):
┌─────────────────────────────────────────┐
│ 1. Chọn Activity                        │
│ 2. Bấm "📍 Lấy GPS Hiện Tại"           │
│    → navigator.geolocation              │
│    → Lấy {lat, lng, accuracy}          │
│ 3. Bấm "🎯 Tạo QR tại vị trị này"      │
│    → POST /generate-qr                  │
│    → {location: {lat, lng, accuracy}}  │
└─────────────────────────────────────────┘
         ↓
  Backend: Lưu location vào QR
  QR Record: {
    location: {lat, lng, ...},
    geofence_radius_m: 80
  }

STUDENT (Quét QR):
┌─────────────────────────────────────────┐
│ 1. Quét QR (có location data)           │
│ 2. Điền form thông tin                  │
│ 3. Bấm "📍 Gửi Điểm Danh (Lấy GPS)"   │
│    → navigator.geolocation              │
│    → Lấy {lat, lng, accuracy}          │
│ 4. POST /submit-attendance              │
│    → {scan_location: {lat, lng}}       │
└─────────────────────────────────────────┘
         ↓
  Backend: Kiểm tra geofence
  - calculateDistance(qr_loc, scan_loc)
  - distance ≤ 80m? ✅ OK : ❌ REJECT
  
  ✅ SUCCESS:
    Lưu attendance với location data
    
  ❌ FAIL:
    Return 400: "Quá xa: 150m (cho phép 80m)"
```

---

## 🔧 Configuration

**Geofence Radius (Mặc định 80 meters):**

Nếu muốn thay đổi:

1. **Backend:**
```javascript
// attendance.controller.js - generateQRCode
const radius = req.body.location.geofence_radius_m || 80;  // Change here
```

2. **Cho từng QR:**
```json
POST /attendances/generate-qr {
  "location": {
    "latitude": 10.7769,
    "longitude": 106.6869,
    "geofence_radius_m": 100  // Override default 80m
  }
}
```

---

## ✅ Testing Checklist

- [ ] **Staff tạo QR:**
  1. Mở qr-manager.html
  2. Bấm "📍 Lấy GPS Hiện Tại"
  3. Xác nhận GPS được lấy (show coords + accuracy)
  4. Bấm "🎯 Tạo QR tại vị trị này"
  5. QR tạo thành công + show location info
  6. Check DB: QR record có location fields ✓

- [ ] **Student quét QR:**
  1. Mở scan-attendance.html
  2. Quét QR được tạo ở trên
  3. Điền form đầy đủ
  4. Bấm "📍 Gửi Điểm Danh (Lấy GPS)"
  5. GPS được lấy tự động
  6. Kiểm tra response:
     - Nếu trong vùng 80m: ✅ Success
     - Nếu ngoài vùng: ❌ Error "Quá xa"
  7. Check DB: Attendance có location data ✓

- [ ] **Test Error Cases:**
  1. [ ] Deny GPS permission → "Cần bật Permission vị trị"
  2. [ ] Timeout GPS → "Timeout lấy vị trị"
  3. [ ] Quét từ quá xa → "Quá xa điểm danh: XXXm"

---

## 📝 Files Changed

```
Backend:
  ✅ /backend/src/models/qr_code.model.js
  ✅ /backend/src/models/attendance.model.js
  ✅ /backend/src/controllers/attendance.controller.js

Frontend:
  ✅ /backend/public/qr-manager.html
  ✅ /backend/public/scan-attendance.html
```

---

## 🚀 Next Steps (Optional)

1. **Admin Dashboard:** Thêm view để xem location stats
2. **Map Display:** Hiển thị map với QR locations
3. **Adjustment:** Tuning geofence radius theo môi trường
4. **Logging:** Analyze location data để phát hiện gian lận

---

**Status:** ✅ READY TO TEST

Tất cả files đã update. Chỉ cần test lại flow là OK!
