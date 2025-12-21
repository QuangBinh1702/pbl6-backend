# 🎨 Frontend Integration Guide - Geofence Tracking

## Overview

Hướng dẫn này giúp frontend developer kết nối với backend Geofence Tracking API vừa implement.

---

## 📡 API Endpoints

### 1. **Generate QR Code with Location** (Staff)

```
POST /api/attendances/generate-qr
```

**Request Header:**
```javascript
{
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

**Request Body:**
```json
{
  "activity_id": "507f1f77bcf86cd799439011",
  "qr_name": "Buổi sáng",
  "duration_minutes": 30,
  "location": {
    "latitude": 10.7769,
    "longitude": 106.6869,
    "accuracy": 25,
    "geofence_radius_m": 80
  }
}
```

**Response Success (201):**
```json
{
  "success": true,
  "message": "✅ QR tạo thành công tại vị trí [10.7769, 106.6869]",
  "data": {
    "qr_id": "507f1f77bcf86cd799439012",
    "qr_name": "Buổi sáng",
    "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "created_at": "2025-01-20T10:00:00.000Z",
    "expires_at": "2025-01-20T10:30:00.000Z",
    "scans_count": 0,
    "location": {
      "latitude": 10.7769,
      "longitude": 106.6869,
      "accuracy_m": 25
    },
    "geofence_radius_m": 80,
    "total_qr_created": 5
  }
}
```

**Response Error (400):**
```json
{
  "success": false,
  "message": "❌ Vị trí là bắt buộc. Bấm nút 🎯 Tạo QR tại vị trí này để lấy GPS"
}
```

---

### 2. **Submit Attendance with Location** (Student)

```
POST /api/attendances/submit-attendance
```

**Request Header:**
```javascript
{
  'Content-Type': 'application/json'
}
```

**Request Body:**
```json
{
  "activity_id": "507f1f77bcf86cd799439011",
  "session_id": "507f1f77bcf86cd799439012",
  "student_info": {
    "student_id_number": "202001234",
    "student_name": "Nguyễn Văn A",
    "class": "507f1f77bcf86cd799439001",
    "faculty": "507f1f77bcf86cd799439002",
    "phone": "0912345678",
    "notes": "Có"
  },
  "scan_location": {
    "latitude": 10.7775,
    "longitude": 106.6875,
    "accuracy": 20
  }
}
```

**Response Success (201):**
```json
{
  "success": true,
  "message": "✅ Điểm danh thành công! Lần 1/4 - 2 điểm",
  "data": {
    "attendance_id": "507f1f77bcf86cd799439013",
    "scan_order": 1,
    "total_qr_at_scan": 4,
    "points_earned": 2,
    "student_name": "Nguyễn Văn A",
    "activity_id": "507f1f77bcf86cd799439011",
    "scanned_at": "2025-01-20T10:05:00.000Z",
    "location_data": {
      "distance_m": 45,
      "required_distance_m": 80,
      "within_geofence": true
    }
  },
  "warnings": null
}
```

**Response Error - Out of Geofence (400):**
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

**Response Error - Student Not Found (404):**
```json
{
  "success": false,
  "message": "Sinh viên với MSSV 202001234 không tồn tại trong hệ thống"
}
```

**Response Error - Not Registered (403):**
```json
{
  "success": false,
  "message": "Bạn chưa được duyệt để tham gia hoạt động này"
}
```

---

## 🎯 Frontend Implementation Guide

### **Part 1: Staff Dashboard - Generate QR**

#### HTML Structure:
```html
<div class="generate-qr-section">
  <h2>Generate New QR</h2>
  
  <!-- QR Name Input -->
  <div class="form-group">
    <label>QR Name</label>
    <input type="text" id="qrName" placeholder="Buổi sáng">
  </div>
  
  <!-- Duration Input -->
  <div class="form-group">
    <label>Duration (Minutes)</label>
    <input type="number" id="duration" placeholder="30" min="1">
  </div>
  
  <!-- Location Display -->
  <div class="location-info" id="locationInfo" style="background: #f0fdf4; padding: 10px; border-radius: 6px;">
    <label>📍 Vị trí Tạo QR</label>
    <p id="locationStatus">Chưa lấy vị trí</p>
    <p id="locationCoords" style="font-family: monospace; font-size: 0.9em;"></p>
  </div>
  
  <!-- Buttons -->
  <div class="button-group">
    <button onclick="captureLocationForQR()" class="btn-success">
      📍 Lấy GPS Hiện Tại
    </button>
    <button onclick="generateNewQR()" class="btn-primary">
      🎯 Tạo QR tại vị trị này
    </button>
  </div>
  
  <!-- Messages -->
  <div id="generateMessage" class="message"></div>
</div>
```

#### JavaScript Implementation:
```javascript
// Store captured location globally
let capturedLocation = null;
const API_BASE = 'http://localhost:5000/api';

// Function 1: Capture Location
async function captureLocationForQR() {
  try {
    // Request browser geolocation permission
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        { 
          enableHighAccuracy: true,    // High accuracy mode
          timeout: 15000,              // 15 seconds timeout
          maximumAge: 0                // Don't use cached location
        }
      );
    });

    // Store captured location
    capturedLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy
    };

    // Update UI
    document.getElementById('locationStatus').textContent = 
      `✅ Đã lấy vị trí (độ chính xác: ±${Math.round(capturedLocation.accuracy)}m)`;
    
    document.getElementById('locationCoords').textContent = 
      `Lat: ${capturedLocation.latitude.toFixed(6)}, Lng: ${capturedLocation.longitude.toFixed(6)}`;
    
    document.getElementById('locationInfo').style.background = '#f0fdf4';

    showMessage('generateMessage', '✅ Đã lấy vị trí thành công!', 'success');

  } catch (error) {
    // Handle different error types
    if (error.code === error.PERMISSION_DENIED) {
      showMessage('generateMessage', '❌ Cần bật Permission vị trị để tạo QR', 'error');
    } else if (error.code === error.TIMEOUT) {
      showMessage('generateMessage', '❌ Timeout lấy vị trị. Vui lòng thử lại', 'error');
    } else {
      showMessage('generateMessage', `❌ Lỗi: ${error.message}`, 'error');
    }
  }
}

// Function 2: Generate QR with Location
async function generateNewQR() {
  try {
    const activityId = document.getElementById('activitySelect').value;
    
    // Validate activity selected
    if (!activityId) {
      showMessage('generateMessage', '❌ Vui lòng chọn Activity', 'error');
      return;
    }

    // Validate location captured
    if (!capturedLocation) {
      showMessage('generateMessage', '❌ Vui lòng bấm "📍 Lấy GPS Hiện Tại" trước', 'error');
      return;
    }

    const qrName = document.getElementById('qrName').value.trim();
    const duration = document.getElementById('duration').value;
    const token = localStorage.getItem('authToken');

    // Show loading state
    showMessage('generateMessage', '⏳ Đang tạo QR...', 'info');

    // Call API
    const response = await fetch(`${API_BASE}/attendances/generate-qr`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        activity_id: activityId,
        qr_name: qrName || `QR #${new Date().toLocaleTimeString()}`,
        duration_minutes: duration ? parseInt(duration) : null,
        location: capturedLocation  // 🆕 SEND LOCATION
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Tạo QR thất bại');
    }

    const result = await response.json();

    // Success - Display QR
    displayQRCode(result.data);
    showMessage('generateMessage', result.message, 'success');

    // Reset form
    document.getElementById('qrName').value = '';
    document.getElementById('duration').value = '';
    capturedLocation = null;
    document.getElementById('locationStatus').textContent = 'Chưa lấy vị trí';
    document.getElementById('locationCoords').textContent = '';

  } catch (error) {
    showMessage('generateMessage', `❌ ${error.message}`, 'error');
    console.error('Error:', error);
  }
}

// Helper: Display QR Code
function displayQRCode(data) {
  const qrDisplay = document.getElementById('qrDisplay');
  qrDisplay.innerHTML = `
    <div class="qr-card">
      <img src="${data.qr_code}" alt="QR Code" style="width: 300px;">
      <p><strong>Tên QR:</strong> ${data.qr_name}</p>
      <p><strong>Tạo lúc:</strong> ${new Date(data.created_at).toLocaleString('vi-VN')}</p>
      <p><strong>Hết hạn:</strong> ${data.expires_at ? new Date(data.expires_at).toLocaleString('vi-VN') : 'Không'}</p>
      <p><strong>Vị trí:</strong> [${data.location.latitude.toFixed(4)}, ${data.location.longitude.toFixed(4)}]</p>
      <p><strong>Bán kính:</strong> ${data.geofence_radius_m}m</p>
      <p><strong>Tổng QR:</strong> ${data.total_qr_created}</p>
    </div>
  `;
}

// Helper: Show Messages
function showMessage(elementId, message, type) {
  const el = document.getElementById(elementId);
  el.textContent = message;
  el.className = `message ${type}`;
  
  if (type === 'success') {
    setTimeout(() => el.textContent = '', 3000);
  }
}
```

---

### **Part 2: Student Scanner - Submit with Location**

#### HTML Structure:
```html
<div class="form-section" id="formSection" style="display: none;">
  <h2>✅ Thông Tin Điểm Danh</h2>

  <!-- Activity Info Display -->
  <div class="info-box">
    <p><strong>Hoạt động:</strong> <span id="activityName">-</span></p>
    <p><strong>Mã QR:</strong> <span id="qrIdDisplay">-</span></p>
    <p><strong>Thời gian:</strong> <span id="qrTime">-</span></p>
  </div>

  <!-- Form Fields -->
  <div class="form-group">
    <label>Họ và Tên *</label>
    <input type="text" id="studentName" placeholder="Nguyễn Văn A" maxlength="100">
  </div>

  <div class="form-group">
    <label>MSSV (9 chữ số) *</label>
    <input type="text" id="mssv" placeholder="202001234" pattern="\d{9}">
  </div>

  <div class="form-group">
    <label>Lớp *</label>
    <select id="class" required>
      <option value="">-- Chọn Lớp --</option>
    </select>
  </div>

  <div class="form-group">
    <label>Khoa *</label>
    <select id="faculty" required>
      <option value="">-- Chọn Khoa --</option>
    </select>
  </div>

  <div class="form-group">
    <label>Điện thoại (tùy chọn)</label>
    <input type="tel" id="phone" placeholder="0912345678">
  </div>

  <div class="form-group">
    <label>Ghi chú</label>
    <textarea id="notes" placeholder="Ghi chú..." maxlength="500" rows="3"></textarea>
  </div>

  <!-- Submit Buttons -->
  <div class="button-group">
    <!-- 🆕 UPDATE: Use captureLocationAndSubmit instead of submitForm -->
    <button onclick="captureLocationAndSubmit()" class="btn-success">
      📍 Gửi Điểm Danh (Lấy GPS)
    </button>
    <button onclick="resetForm()" class="btn-secondary">
      🔄 Quét Tiếp
    </button>
  </div>

  <!-- Messages -->
  <div id="formMessage" class="message"></div>
</div>
```

#### JavaScript Implementation:
```javascript
let currentActivityId = null;
let currentQRId = null;

// Function 1: Capture Location and Submit
async function captureLocationAndSubmit() {
  try {
    // Validate form fields
    const studentName = document.getElementById('studentName').value.trim();
    const mssv = document.getElementById('mssv').value.trim();
    const classId = document.getElementById('class').value;
    const facultyId = document.getElementById('faculty').value;
    const phone = document.getElementById('phone').value.trim();
    const notes = document.getElementById('notes').value.trim();

    // Validation checks
    if (!studentName || !mssv || !classId || !facultyId) {
      showMessage('formMessage', '❌ Vui lòng điền đủ thông tin bắt buộc (*)', 'error');
      return;
    }

    if (!/^\d{9}$/.test(mssv)) {
      showMessage('formMessage', '❌ MSSV phải là 9 chữ số', 'error');
      return;
    }

    if (phone && !/^(0|\+84)\d{9,10}$/.test(phone)) {
      showMessage('formMessage', '❌ Số điện thoại không hợp lệ', 'error');
      return;
    }

    // Show loading message
    showMessage('formMessage', '📍 Đang lấy vị trí của bạn...', 'info');

    // Request browser geolocation permission
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        { 
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      );
    });

    // Capture student's location
    const scanLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy
    };

    console.log('📍 Student location captured:', scanLocation);

    // Submit form with location
    await submitForm(scanLocation);

  } catch (error) {
    // Handle different error types
    if (error.code === error.PERMISSION_DENIED) {
      showMessage('formMessage', 
        '❌ Cần bật Permission vị trị. Vui lòng cấp quyền truy cập vị trị', 
        'error');
    } else if (error.code === error.TIMEOUT) {
      showMessage('formMessage', 
        '❌ Timeout lấy vị trị. Vui lòng thử lại hoặc liên hệ nhân viên', 
        'error');
    } else {
      showMessage('formMessage', `❌ Lỗi: ${error.message}`, 'error');
    }
    console.error('Geolocation error:', error);
  }
}

// Function 2: Submit Form with Location
async function submitForm(scanLocation = null) {
  try {
    const studentName = document.getElementById('studentName').value.trim();
    const mssv = document.getElementById('mssv').value.trim();
    const classId = document.getElementById('class').value;
    const facultyId = document.getElementById('faculty').value;
    const phone = document.getElementById('phone').value.trim();
    const notes = document.getElementById('notes').value.trim();

    const token = localStorage.getItem('authToken') || '';

    // Build request body
    const requestBody = {
      activity_id: currentActivityId,
      session_id: currentQRId,  // QR Code ID
      student_info: {
        student_id_number: mssv,
        student_name: studentName,
        class: classId,
        faculty: facultyId,
        phone: phone || null,
        notes: notes || null
      }
    };

    // 🆕 Include scan location if provided
    if (scanLocation) {
      requestBody.scan_location = scanLocation;
    }

    // Call API
    const response = await fetch(`${API_BASE}/attendances/submit-attendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Gửi thất bại');
    }

    const result = await response.json();

    // Build success message with location info
    let successMsg = result.message;
    
    // 🆕 ADD Location verification info to message
    if (result.data?.location_data) {
      const loc = result.data.location_data;
      successMsg += `\n📍 Khoảng cách: ${loc.distance_m}m (cho phép ${loc.required_distance_m}m)`;
      
      if (!loc.within_geofence) {
        successMsg = '❌ ' + successMsg;
      }
    }

    showMessage('formMessage', successMsg, 'success');

    console.log('✅ Attendance submitted:', result.data);

    // Reset form after 3 seconds
    setTimeout(() => resetForm(), 3000);

  } catch (error) {
    showMessage('formMessage', `❌ ${error.message}`, 'error');
    console.error('Submit error:', error);
  }
}

// Helper: Reset Form
function resetForm() {
  document.getElementById('studentName').value = '';
  document.getElementById('mssv').value = '';
  document.getElementById('class').value = '';
  document.getElementById('faculty').value = '';
  document.getElementById('phone').value = '';
  document.getElementById('notes').value = '';
  document.getElementById('formMessage').innerHTML = '';

  // Show scanner again
  document.getElementById('scannerSection').style.display = 'block';
  document.getElementById('formSection').style.display = 'none';
  
  // Reset QR data
  currentActivityId = null;
  currentQRId = null;
}

// Helper: Show Messages
function showMessage(elementId, message, type) {
  const el = document.getElementById(elementId);
  el.textContent = message;
  el.className = `message ${type}`;
  
  if (type === 'success') {
    setTimeout(() => el.textContent = '', 5000);
  }
}
```

---

## 🔧 Configuration

### API Base URL:
```javascript
// Development
const API_BASE = 'http://localhost:5000/api';

// Production
const API_BASE = 'https://your-domain.com/api';
```

### Token Storage:
```javascript
// Save token after login
localStorage.setItem('authToken', token);

// Retrieve token for requests
const token = localStorage.getItem('authToken');

// Use in headers
headers: {
  'Authorization': `Bearer ${token}`
}
```

---

## 📊 Error Handling Examples

### Location Permission Denied:
```javascript
if (error.code === error.PERMISSION_DENIED) {
  // Browser blocked location access
  // User needs to enable in browser settings
  showMessage('❌ Cần bật Permission vị trị');
}
```

### GPS Timeout:
```javascript
if (error.code === error.TIMEOUT) {
  // GPS took too long to get signal
  // Try again or move to open area
  showMessage('❌ Timeout lấy vị trị. Vui lòng thử lại');
}
```

### Out of Geofence:
```javascript
if (response.status === 400 && 'Quá xa' in response.message) {
  const { distance_m, required_distance_m } = response.data;
  showMessage(`❌ Quá xa: ${distance_m}m (cho phép ${required_distance_m}m)`);
  // Guide user to move closer
}
```

### Student Not Registered:
```javascript
if (response.status === 403) {
  showMessage('❌ Bạn chưa được duyệt để tham gia hoạt động này');
  // Show registration option
}
```

---

## 🧪 Testing with cURL

### Test 1: Generate QR
```bash
curl -X POST http://localhost:5000/api/attendances/generate-qr \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "activity_id": "ACTIVITY_ID",
    "qr_name": "Test QR",
    "location": {
      "latitude": 10.7769,
      "longitude": 106.6869,
      "accuracy": 25
    }
  }'
```

### Test 2: Submit Attendance
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

---

## 📱 Mobile Considerations

### HTTPS Required:
```javascript
// Geolocation only works on HTTPS (except localhost)
// Production must use HTTPS for location permission
```

### High Accuracy vs Battery:
```javascript
// High accuracy - uses GPS + WiFi + cellular
navigator.geolocation.getCurrentPosition(resolve, reject, {
  enableHighAccuracy: true  // More battery, faster
});

// Balanced - uses WiFi + cellular
navigator.geolocation.getCurrentPosition(resolve, reject, {
  enableHighAccuracy: false
});
```

### Timeout Settings:
```javascript
// 15 seconds - reasonable for most cases
timeout: 15000,

// Adjust based on environment:
// Indoor (poor GPS): 20000-30000ms
// Outdoor (good GPS): 5000-10000ms
```

---

## ✅ Checklist for Frontend

- [ ] Import API_BASE URL
- [ ] Add location capture UI
- [ ] Implement captureLocationForQR() function
- [ ] Implement generateNewQR() function with location
- [ ] Implement captureLocationAndSubmit() function
- [ ] Implement submitForm() with scan_location
- [ ] Add error handling for GPS errors
- [ ] Add success message with location distance
- [ ] Test on mobile device (requires HTTPS or localhost)
- [ ] Test permission denied scenario
- [ ] Test timeout scenario
- [ ] Test within/outside geofence

---

## 🚀 Quick Start

1. Copy the HTML structure above
2. Copy the JavaScript functions
3. Update API_BASE URL
4. Test with cURL commands
5. Test in browser (mobile preferred)

---

**Status:** Ready to integrate ✅
