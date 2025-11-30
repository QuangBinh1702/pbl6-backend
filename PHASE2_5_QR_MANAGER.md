# 🎯 PHASE 2.5: On-Demand QR Management

**Date:** Nov 28, 2025  
**Priority:** HIGH - Core Feature for Attendance  
**Status:** Planning  
**Difficulty:** Medium 🟡

---

## 📋 Yêu Cầu Người Dùng

```
✅ Người ta muốn điểm danh BẤT KỲ LÚC NÀO (không cố định thời gian)
✅ Cần trang riêng để tạo/quản lý QR codes
✅ Có thể tạo QR mới mỗi lần điểm danh
✅ Không giới hạn thời gian scan QR
✅ Admin có toàn quyền quản lý điểm danh
```

---

## 🏗️ Kiến Trúc Mới vs Cũ

### **Cũ (Fixed Time Sessions)**
```
Activity tạo
  ↓
2 sessions có fixed time:
  ├─ Session 1: 10:00-10:15 (Mid-Session)
  ├─ Session 2: 16:00-16:15 (End-Session)
  └─ QR tạo 1 lần, lưu vĩnh viễn
  ↓
Student quét
  └─ Validate: Hiện tại có phải trong time window không?
  ↓
Admin duyệt theo sessions
```

### **Mới (On-Demand, No Time Limit) ✨**
```
Activity tạo
  ↓
QR Management Trang Riêng:
  ├─ [📱 Generate New QR] button
  ├─ [🔄 Refresh QR] button (tạo QR mới)
  ├─ [⏱️ Set Duration] (optional: hiệu lực trong X phút)
  ├─ History: QR cũ
  └─ Current: QR mới nhất
  ↓
Student quét
  └─ Không validate time window ✅
  ↓
Admin duyệt
  └─ Không phân sessions, chỉ 1 attendance record
```

---

## 🎯 Chi Tiết Yêu Cầu

### **Requirement 1: QR Manager Page**
```
URL: http://localhost:5000/qr-manager.html

┌─────────────────────────────────────────┐
│ 📱 QR CODE MANAGER                      │
├─────────────────────────────────────────┤
│                                         │
│ Activity: [Dropdown - All Activities]   │
│ Status: Active / History                │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ✅ Current QR (Active)              │ │
│ │                                     │ │
│ │ [QR Image 300x300]                  │ │
│ │                                     │ │
│ │ Created: 2025-11-28 14:30           │ │
│ │ Expires: 2025-11-28 15:30 (optional)│ │
│ │ Scans: 23 students                  │ │
│ │                                     │ │
│ │ [📋 Copy Data] [🖨️ Print]          │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [🔄 Generate New QR] [⏱️ Set Expiry]   │
│                                         │
│ ─────────────────────────────────────── │
│                                         │
│ 📜 QR History:                          │
│ ├─ QR #3 - 14:30 (23 scans) ✅ Current│
│ ├─ QR #2 - 14:00 (15 scans) ⏰ Expired│
│ └─ QR #1 - 13:30 (8 scans)  ⏰ Expired│
│                                         │
│ [🗑️ Delete Old] [📊 Statistics]       │
│                                         │
└─────────────────────────────────────────┘
```

### **Requirement 2: Generate On-Demand QR**

**Endpoint:**
```http
POST /api/attendances/generate-qr
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "activity_id": "672a5c3f...",
  "duration_minutes": 60  // Optional: QR hiệu lực 60 phút
}

Response:
{
  "success": true,
  "data": {
    "qr_id": "672a5d7f...",
    "qr_code": "data:image/png;base64,...",
    "qr_data": {
      "activityId": "672a5c3f...",
      "qrId": "672a5d7f...",
      "createdAt": "2025-11-28T14:30:00Z",
      "expiresAt": "2025-11-28T15:30:00Z"  // Optional
    }
  }
}
```

### **Requirement 3: No Time Window Validation**

**Old scanQRCode validation:**
```javascript
// ❌ OLD: Check if within session time window
const startTime = activity.start_time;
const endTime = activity.end_time;
const scanStartWindow = new Date(startTime.getTime() - 30 * 60000);

if (now < scanStartWindow) {
  Error: "Hoạt động chưa bắt đầu"
}
if (now > endTime) {
  Error: "Hoạt động đã kết thúc"
}
```

**New scanQRCode validation:**
```javascript
// ✅ NEW: Only check if QR exists and not expired
const qrRecord = await QRCode.findById(qrId);

if (!qrRecord) {
  Error: "QR không tồn tại"
}

if (qrRecord.expiresAt && new Date() > qrRecord.expiresAt) {
  Error: "QR đã hết hạn"
}

// Otherwise: ALLOW scan anytime ✅
```

---

## 🗄️ Database Schema Changes

### **1. New Collection: QRCode (On-Demand QRs)**

```javascript
// models/qr_code.model.js - NEW FILE

const qrCodeSchema = new mongoose.Schema({
  activity_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    required: true,
    index: true
  },
  
  qr_data: {
    type: String,
    required: true  // JSON: {activityId, qrId, createdAt, expiresAt}
  },
  
  qr_code: {
    type: String,   // Base64 PNG image
    required: true
  },
  
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',    // Admin who created
    required: true
  },
  
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  expires_at: {
    type: Date,
    sparse: true,   // Optional
    index: true
  },
  
  is_active: {
    type: Boolean,
    default: true,
    index: true
  },
  
  scans_count: {
    type: Number,
    default: 0
  },
  
  notes: String   // "Điểm danh lần 1", "Điểm danh lần 2", etc
});

module.exports = mongoose.model('QRCode', qrCodeSchema, 'qr_codes');
```

### **2. Update Attendance Schema**

```javascript
// models/attendance.model.js - MODIFY

// Remove session_id (không cần fixed sessions)
// Add qr_code_id (track QR nào được scan)

const attendanceSchema = new mongoose.Schema({
  student_id: { ... },
  activity_id: { ... },
  
  // ❌ OLD: session_id (remove)
  // ✅ NEW: qr_code_id (which QR was scanned)
  qr_code_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QRCode',
    sparse: true
  },
  
  student_info: { ... },
  status: { ... },
  ...
});
```

---

## 🔌 API Endpoints

### **1. Generate On-Demand QR**
```http
POST /api/attendances/generate-qr
Authorization: Bearer TOKEN (admin only)
Content-Type: application/json

Body:
{
  "activity_id": "672a5c3f...",
  "duration_minutes": 60,  // Optional
  "notes": "Điểm danh lần 1"  // Optional
}

Response:
{
  "success": true,
  "data": {
    "_id": "672a5d7f...",
    "qr_code": "data:image/png;base64,...",
    "created_at": "2025-11-28T14:30:00Z",
    "expires_at": "2025-11-28T15:30:00Z",
    "is_active": true,
    "scans_count": 0
  }
}
```

### **2. Get All QRs for Activity**
```http
GET /api/attendances/activity/:activityId/qr-codes
Authorization: Bearer TOKEN

Response:
{
  "success": true,
  "data": {
    "current": {
      "_id": "672a5d7f...",
      "qr_code": "data:image/png;base64,...",
      "created_at": "2025-11-28T14:30:00Z",
      "is_active": true,
      "scans_count": 23
    },
    "history": [
      { qr #2, created: 14:00, scans: 15 },
      { qr #1, created: 13:30, scans: 8 }
    ]
  }
}
```

### **3. Set QR Expiration**
```http
PUT /api/qr-codes/:qrId/set-expiry
Authorization: Bearer TOKEN

Body:
{
  "duration_minutes": 30
}

Response:
{
  "success": true,
  "expires_at": "2025-11-28T15:00:00Z"
}
```

### **4. Deactivate QR**
```http
PUT /api/qr-codes/:qrId/deactivate
Authorization: Bearer TOKEN

Response:
{
  "success": true,
  "is_active": false
}
```

### **5. Delete Old QRs**
```http
DELETE /api/qr-codes/:activityId/cleanup
Authorization: Bearer TOKEN (admin only)

Query: ?keep_latest=3  // Keep 3 latest QRs, delete older

Response:
{
  "success": true,
  "deleted_count": 7
}
```

---

## 🎨 QR Manager Page HTML

**File:** `backend/public/qr-manager.html` (NEW)

```html
<!DOCTYPE html>
<html>
<head>
  <title>QR Code Manager</title>
  <style>
    .qr-container {
      text-align: center;
      padding: 30px;
      background: #f9f9f9;
      border-radius: 12px;
      margin: 20px 0;
    }
    
    .qr-image {
      width: 300px;
      height: 300px;
      border: 3px solid #667eea;
      border-radius: 8px;
      margin: 20px auto;
    }
    
    .qr-info {
      color: #666;
      font-size: 0.9em;
      margin: 10px 0;
    }
    
    .qr-history {
      margin-top: 40px;
    }
    
    .qr-item {
      background: white;
      border: 1px solid #ddd;
      padding: 15px;
      margin: 10px 0;
      border-radius: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .status-active {
      color: #10b981;
      font-weight: bold;
    }
    
    .status-expired {
      color: #ef4444;
      opacity: 0.6;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📱 QR Code Manager</h1>
    
    <div class="card">
      <h2>Select Activity</h2>
      <select id="activitySelect" onchange="loadActivity()">
        <option value="">-- Choose Activity --</option>
      </select>
    </div>
    
    <div id="qrPanel" style="display: none;">
      <div class="card">
        <h2>Current QR Code</h2>
        
        <div class="qr-container" id="currentQRContainer">
          <img id="currentQRImage" class="qr-image" src="">
          <div class="qr-info">
            <p id="createdTime"></p>
            <p id="expiryTime"></p>
            <p id="scansCount"></p>
          </div>
          <div style="margin-top: 20px;">
            <button onclick="copyQRData()">📋 Copy QR Data</button>
            <button onclick="printQR()">🖨️ Print</button>
          </div>
        </div>
        
        <div style="margin-top: 20px;">
          <button class="btn-primary" onclick="generateNewQR()">
            🔄 Generate New QR
          </button>
          <button class="btn-secondary" onclick="setExpiry()">
            ⏱️ Set Expiration
          </button>
        </div>
      </div>
      
      <div class="card qr-history">
        <h2>QR History</h2>
        <div id="qrHistoryList"></div>
        <button onclick="cleanupOldQRs()" style="margin-top: 20px;">
          🗑️ Cleanup Old QRs (Keep Latest 3)
        </button>
      </div>
    </div>
  </div>
  
  <script>
    const API_BASE = 'http://localhost:5000/api';
    let currentActivity = null;
    
    async function loadActivities() {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE}/activities`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      const select = document.getElementById('activitySelect');
      data.data.forEach(act => {
        select.innerHTML += `<option value="${act._id}">${act.title}</option>`;
      });
    }
    
    async function loadActivity() {
      const activityId = document.getElementById('activitySelect').value;
      if (!activityId) return;
      
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE}/attendances/activity/${activityId}/qr-codes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      displayQRs(data.data);
    }
    
    function displayQRs(data) {
      // Display current QR
      if (data.current) {
        document.getElementById('currentQRImage').src = data.current.qr_code;
        document.getElementById('createdTime').textContent = 
          `Created: ${new Date(data.current.created_at).toLocaleString('vi-VN')}`;
        document.getElementById('expiryTime').textContent = 
          data.current.expires_at ? `Expires: ${new Date(data.current.expires_at).toLocaleString('vi-VN')}` : 'No Expiration';
        document.getElementById('scansCount').textContent = `Scans: ${data.current.scans_count}`;
      }
      
      // Display history
      const historyHTML = data.history.map(qr => `
        <div class="qr-item">
          <div>
            <p>Created: ${new Date(qr.created_at).toLocaleString('vi-VN')}</p>
            <p>Scans: ${qr.scans_count}</p>
            <p class="${qr.is_active ? 'status-active' : 'status-expired'}">
              ${qr.is_active ? '✅ Active' : '⏰ Expired'}
            </p>
          </div>
          <button onclick="viewOldQR('${qr._id}')">View</button>
        </div>
      `).join('');
      
      document.getElementById('qrHistoryList').innerHTML = historyHTML;
      document.getElementById('qrPanel').style.display = 'block';
    }
    
    async function generateNewQR() {
      const activityId = document.getElementById('activitySelect').value;
      if (!activityId) {
        alert('Please select an activity');
        return;
      }
      
      const token = localStorage.getItem('adminToken');
      const durationMinutes = prompt('QR Expiration (minutes)? Leave blank for no expiration:', '60');
      
      const res = await fetch(`${API_BASE}/attendances/generate-qr`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          activity_id: activityId,
          duration_minutes: durationMinutes ? parseInt(durationMinutes) : null
        })
      });
      
      if (res.ok) {
        alert('✅ New QR generated!');
        loadActivity();
      } else {
        alert('❌ Error generating QR');
      }
    }
    
    function copyQRData() {
      const img = document.getElementById('currentQRImage').src;
      navigator.clipboard.writeText(img);
      alert('✅ QR data copied!');
    }
    
    function printQR() {
      const printWindow = window.open();
      printWindow.document.write('<img src="' + document.getElementById('currentQRImage').src + '" style="width: 400px;">');
      printWindow.print();
    }
    
    async function setExpiry() {
      // Similar to generateNewQR
    }
    
    async function cleanupOldQRs() {
      const activityId = document.getElementById('activitySelect').value;
      const token = localStorage.getItem('adminToken');
      
      const res = await fetch(`${API_BASE}/qr-codes/${activityId}/cleanup?keep_latest=3`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        alert('✅ Old QRs deleted!');
        loadActivity();
      }
    }
    
    // Load on init
    window.addEventListener('load', loadActivities);
  </script>
</body>
</html>
```

---

## 🔄 Updated scanQRCode Logic

**File:** `backend/src/controllers/attendance.controller.js`

```javascript
async scanQRCode(req, res) {
  try {
    const { qrData } = req.body;
    const userId = req.user._id;
    
    if (!qrData) {
      return res.status(400).json({ success: false, message: 'QR code data is required' });
    }
    
    // Parse QR data
    let data;
    try {
      data = JSON.parse(qrData);
    } catch (parseErr) {
      return res.status(400).json({ success: false, message: 'Invalid QR code format' });
    }
    
    const { activityId, qrId } = data;  // 🆕 qrId instead of sessionId
    
    if (!activityId) {
      return res.status(400).json({ success: false, message: 'Invalid QR code: missing activityId' });
    }
    
    // ===== NEW: Check QR exists and not expired =====
    let qrRecord = null;
    if (qrId) {
      qrRecord = await QRCode.findById(qrId);
      if (!qrRecord) {
        return res.status(404).json({ success: false, message: 'QR code not found' });
      }
      
      if (!qrRecord.is_active) {
        return res.status(400).json({ success: false, message: 'QR code is deactivated' });
      }
      
      if (qrRecord.expires_at && new Date() > qrRecord.expires_at) {
        return res.status(400).json({ success: false, message: 'QR code has expired' });
      }
    }
    
    // ❌ REMOVED: Time window validation
    // No more checking if current time is within activity.start_time/end_time
    
    // Rest of scan logic same as before...
    
    // ===== Update attendance with qr_code_id =====
    const attendance = new Attendance({
      student_id: studentProfile._id,
      activity_id: activityId,
      qr_code_id: qrId,  // 🆕
      student_info: { ... },
      status: 'pending',
      scanned_at: new Date()
    });
    
    await attendance.save();
    
    // ===== Increment QR scan count =====
    if (qrRecord) {
      await QRCode.findByIdAndUpdate(qrId, {
        $inc: { scans_count: 1 }
      });
    }
    
    // Response...
  }
}
```

---

## 📋 Implementation Roadmap

| Task | Time | Files |
|------|------|-------|
| 1. Create QRCode model | 10 min | `models/qr_code.model.js` |
| 2. Create endpoints | 20 min | `controllers/attendance.controller.js` |
| 3. Create routes | 5 min | `routes/attendance.routes.js` |
| 4. Update scanQRCode | 10 min | `controllers/attendance.controller.js` |
| 5. Create QR Manager page | 30 min | `public/qr-manager.html` |
| 6. Test workflows | 20 min | Manual testing |
| **TOTAL** | **95 min** | |

---

## 🎯 Integration with Phase 2

```
Phase 2: Approval Workflow
  ├─ Submit attendance (student nộp)
  ├─ Admin duyệt
  └─ Export Excel
  
Phase 2.5: On-Demand QR (THIS)
  ├─ Generate QR anytime
  ├─ No time limit for scan
  └─ Flexible điểm danh
  
Result: Combined System
  1. Admin generates QR (on-demand, any time)
  2. Student scan (no time limit)
  3. Student submit form
  4. Admin duyệt
  5. Points awarded
```

---

## ✅ Benefits

```
✅ Flexibility: Admin controls when QR available
✅ No Time Pressure: Student can scan anytime
✅ Multiple QRs: Can create new QR per "session"
✅ History: Track which QR was scanned
✅ Safety: Can deactivate old QRs
✅ Analytics: Scan counts per QR
```

---

## 📝 Next Steps

1. **Create QRCode model** (new file)
2. **Create endpoints** (6 new endpoints)
3. **Update scanQRCode()** (remove time validation)
4. **Create QR Manager page** (admin interface)
5. **Test full workflow**

---

**Ready to implement Phase 2.5?**
