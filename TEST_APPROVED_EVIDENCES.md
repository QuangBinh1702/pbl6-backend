# Test Approved Evidences API

## ✅ Fix Applied

**Vấn đề**: Route không hoạt động (404 error)  
**Nguyên nhân**: Thứ tự route sai - `/approved/:studentId` đã bắt trước `/approved/my-evidences`  
**Giải pháp**: Di chuyển routes chuyên biệt lên trước, trước các routes chung

---

## 📋 Đúng Endpoint Path

**Lưu ý**: Endpoint là `/evidences` (số nhiều), KHÔNG phải `/evidence` (số ít)

```
GET /api/evidences/approved/my-evidences
GET /api/evidences/approved/:studentId
```

❌ Sai:
```
GET /api/evidence/approved/my-evidences
```

✅ Đúng:
```
GET /api/evidences/approved/my-evidences
```

---

## 🧪 Test Cases

### Test 1: Lấy minh chứng đã duyệt của sinh viên hiện tại

**Method**: GET  
**URL**: `{{baseUrl}}/api/evidences/approved/my-evidences`  
**Headers**:
```
Authorization: Bearer <YOUR_TOKEN>
Content-Type: application/json
```

**Expected Response (200)**:
```json
{
  "success": true,
  "data": {
    "student_id": "...",
    "student_number": "20210001",
    "total_approved_evidences": 3,
    "total_points": 25,
    "evidences": [
      {
        "_id": "...",
        "title": "Tham gia hoạt động tình nguyện",
        "status": "approved",
        "faculty_point": 5,
        "verified_at": "2024-12-05T14:20:00Z"
      }
    ]
  }
}
```

**Error Cases**:
- `401`: User not authenticated (token không hợp lệ/expired)
- `404`: Student profile not found (user chưa có profile sinh viên)
- `500`: Server error

---

### Test 2: Lấy minh chứng đã duyệt của một sinh viên cụ thể

**Method**: GET  
**URL**: `{{baseUrl}}/api/evidences/approved/507f1f77bcf86cd799439011`  
**Headers**:
```
Authorization: Bearer <YOUR_TOKEN>
Content-Type: application/json
```

**Expected Response (200)**:
```json
{
  "success": true,
  "data": {
    "student_id": "507f1f77bcf86cd799439011",
    "total_approved_evidences": 3,
    "total_points": 25,
    "evidences": [...]
  }
}
```

**Error Cases**:
- `400`: Invalid studentId format
- `401`: User not authenticated
- `403`: Permission denied (sinh viên khác hoặc không đủ quyền)
- `404`: Student not found
- `500`: Server error

---

## 🔧 Postman Collection Template

```bash
# 1. Get My Approved Evidences
curl -X GET "http://localhost:5000/api/evidences/approved/my-evidences" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# 2. Get Student Approved Evidences (replace STUDENT_ID)
curl -X GET "http://localhost:5000/api/evidences/approved/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

## 🚀 Frontend Integration

```javascript
// Get my approved evidences
const getMyApprovedEvidences = async (token) => {
  const response = await fetch('/api/evidences/approved/my-evidences', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
};

// Get student approved evidences
const getStudentApprovedEvidences = async (studentId, token) => {
  const response = await fetch(`/api/evidences/approved/${studentId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
};

// Usage
try {
  const result = await getMyApprovedEvidences(token);
  console.log('Total points:', result.data.total_points);
  console.log('Evidences:', result.data.evidences);
} catch (error) {
  console.error('Error:', error.message);
}
```

---

## ✨ Features

✅ **JWT Authentication** - Kiểm tra token hợp lệ  
✅ **Permission Check** - Sinh viên chỉ xem được của mình, staff/admin xem được tất cả  
✅ **MongoDB ObjectId Validation** - Validate định dạng studentId  
✅ **Data Aggregation** - Tính tổng points tự động  
✅ **Nested Population** - Populate student, activity, approver info  
✅ **Error Handling** - Chi tiết error messages  
✅ **Status Filter** - Chỉ lấy approved evidences  

---

## 📝 Checklist Before Production

- [ ] Routes mounted correctly in main server file
- [ ] Auth middleware working (token validation)
- [ ] Student profile lookup working
- [ ] Permission check logic tested with different roles
- [ ] Tested with valid and invalid studentId formats
- [ ] Error responses verified
- [ ] Database indexes created on `evidences` collection
- [ ] CORS headers configured if needed
- [ ] Rate limiting applied if needed

---

## 🔍 Debugging

If still getting 404:

1. **Check route file**: `/backend/src/routes/evidence.routes.js`
   - Routes phải nằm ở đúng vị trí
   - Route `/approved/my-evidences` phải trước `/approved/:studentId`

2. **Check server mount**: `/backend/src/index.js` (hoặc `app.js`)
   - Evidence routes phải được mount: `app.use('/api/evidences', evidenceRoutes)`

3. **Check endpoint path**:
   ```
   ❌ /api/evidence/  (singular)
   ✅ /api/evidences/ (plural)
   ```

4. **Restart server**:
   ```bash
   npm start
   ```

5. **Check logs**: Server console phải hiển thị request đến endpoint

---

## 📞 Support

Nếu vẫn có lỗi, kiểm tra:
- Server đang chạy `http://localhost:5000`
- Token hợp lệ và chưa hết hạn
- Base URL đúng trong request
- Network tab trong DevTools để xem full URL request
