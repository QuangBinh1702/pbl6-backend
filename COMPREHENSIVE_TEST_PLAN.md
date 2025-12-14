# Comprehensive Test Plan - Approved Evidences API

## 📋 Test Cases

### Test 1: Get My Approved Evidences (Sinh viên xem của mình)

**Endpoint**: `GET /api/evidences/approved/my-evidences`

**Setup**:
```
1. Login với student1
2. Copy token
3. Set vào Authorization: Bearer {token}
4. Gọi endpoint
```

**Expected Results**:

| Case | Input | Expected Status | Expected Response |
|------|-------|-----------------|------------------|
| ✅ Success | Valid token của student | 200 | `{"success": true, "data": {...}}` |
| ❌ No token | Không có Authorization header | 401 | `{"message": "No token provided"}` |
| ❌ Invalid token | Token sai format | 401 | `{"message": "Invalid token"}` |
| ❌ Expired token | Token hết hạn | 401 | `{"message": "Token expired"}` |
| ❌ User locked | User account bị khóa | 401 | `{"message": "Invalid or locked user"}` |
| ❌ No student profile | User admin login | 404 | `{"message": "Student profile not found"}` |

---

### Test 2: Get Student Approved Evidences (Staff xem student)

**Endpoint**: `GET /api/evidences/approved/:studentId`

**Setup**:
```
1. Login với student1 (để lấy student1 ID)
2. Login với staff_ctsv (để lấy staff token)
3. Gọi endpoint với student1 ID và staff token
```

**Expected Results**:

| Case | Student ID | User | Expected Status | Expected Response |
|------|-----------|------|-----------------|------------------|
| ✅ Staff view any | Valid ID | staff_ctsv | 200 | Success |
| ✅ Admin view any | Valid ID | admin | 200 | Success |
| ✅ Student view own | Own ID | student1 | 200 | Success |
| ❌ Invalid format | "not-a-valid-id" | Any | 400 | `Invalid studentId format` |
| ❌ Empty ID | "" | Any | 400 | `studentId is required` |
| ❌ Student view other | Other student ID | student1 | 403 | `Permission denied` |
| ❌ Not found | Valid format but no user | Any | 404 | `Student not found` |

---

## 🧪 Manual Test Sequence

### Phase 1: Login & Token Setup

```
Step 1: POST /api/auth/login
{
  "username": "student1",
  "password": "student123"
}

Response:
{
  "success": true,
  "data": {
    "user": {
      "_id": "... student1 ID ...",
      "username": "student1"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}

⚠️ Save student1 ID & token
```

---

### Phase 2: Test Endpoint 1 - My Approved Evidences

```
Step 2: GET /api/evidences/approved/my-evidences
Authorization: Bearer {token từ step 1}

✅ Expected 200:
{
  "success": true,
  "data": {
    "student_id": "...",
    "student_number": "20210001",
    "total_approved_evidences": 0,  // or số minh chứng đã duyệt
    "total_points": 0,               // or tổng điểm
    "evidences": []                  // or danh sách evidences
  }
}

❌ Nếu 404:
{
  "success": false,
  "message": "Student profile not found"
}
→ Normal nếu user không có student profile

❌ Nếu 401:
{
  "success": false,
  "message": "User not authenticated"
}
→ Check token format & validity
```

---

### Phase 3: Test Endpoint 2 - Student Approved Evidences

```
Step 3: Login staff để lấy staff token
POST /api/auth/login
{
  "username": "staff_ctsv",
  "password": "staff123"
}

Step 4: GET /api/evidences/approved/{student1_id}
Authorization: Bearer {staff token}

✅ Expected 200:
{
  "success": true,
  "data": {
    "student_id": "...",
    "total_approved_evidences": 0,
    "total_points": 0,
    "evidences": []
  }
}

⚠️ Nếu 404 "Student not found":
→ Student ID có thể invalid, check format

⚠️ Nếu 403 "Permission denied":
→ Test với wrong user trying to view other student
```

---

### Phase 4: Permission Check

```
Step 5: Student xem của mình → Should be 200
GET /api/evidences/approved/{student1_id}
Authorization: Bearer {student1 token}

Step 6: Student xem của student khác → Should be 403
GET /api/evidences/approved/{other_student_id}
Authorization: Bearer {student1 token}

Expected 403:
{
  "success": false,
  "message": "You do not have permission to view this student's evidence"
}

Step 7: Staff xem bất kỳ student nào → Should be 200
GET /api/evidences/approved/{any_student_id}
Authorization: Bearer {staff token}
```

---

### Phase 5: Validation Tests

```
Step 8: Invalid studentId format
GET /api/evidences/approved/invalid-id-format
Authorization: Bearer {any token}

Expected 400:
{
  "success": false,
  "message": "Invalid studentId format"
}

Step 9: Valid format nhưng user không tồn tại
GET /api/evidences/approved/507f1f77bcf86cd799439999
Authorization: Bearer {any token}

Expected 404:
{
  "success": false,
  "message": "Student not found"
}
```

---

## 📊 Expected Data Structure

Nếu endpoint thành công (200), response data có structure:

```json
{
  "success": true,
  "data": {
    "student_id": "507f...",
    "student_number": "20210001",          // (chỉ có ở /my-evidences)
    "total_approved_evidences": 3,
    "total_points": 25,
    "evidences": [
      {
        "_id": "507f...",
        "student_id": {
          "_id": "507f...",
          "student_number": "20210001",
          "full_name": "Nguyễn Văn A",
          "email": "a@student.edu.vn"
        },
        "title": "Tham gia hoạt động",
        "file_url": "https://...",
        "submitted_at": "2024-12-01T10:30:00Z",
        "status": "approved",
        "verified_at": "2024-12-05T14:20:00Z",
        "self_point": 5,
        "faculty_point": 5,
        "activity_id": {
          "_id": "507f...",
          "title": "Hoạt động A"
        },
        "approved_by": {
          "_id": "507f...",
          "email": "staff@...",
          "first_name": "Trần",
          "last_name": "Văn B"
        }
      }
    ]
  }
}
```

---

## ✅ Checklist

- [ ] **Test 1 - My Evidences (Student)**
  - [ ] 200 Success với token hợp lệ
  - [ ] 401 No token provided (nếu quên Authorization)
  - [ ] 404 Student profile not found (nếu admin login)

- [ ] **Test 2 - Student Evidences (Staff)**
  - [ ] 200 Success - Staff xem student
  - [ ] 200 Success - Admin xem student
  - [ ] 200 Success - Student xem của mình
  - [ ] 403 Forbidden - Student xem student khác
  - [ ] 400 Invalid format - ID sai format
  - [ ] 404 Not found - ID không tồn tại

- [ ] **Data Validation**
  - [ ] `total_points` được tính đúng (tổng `faculty_point`)
  - [ ] `total_approved_evidences` đếm đúng
  - [ ] Chỉ return evidences với `status = 'approved'`
  - [ ] Sorted by `verified_at` (mới nhất trước)

- [ ] **Nested Data**
  - [ ] `student_id` populated đúng
  - [ ] `activity_id` populated đúng
  - [ ] `approved_by` populated đúng
  - [ ] Không return sensitive fields

---

## 🐛 Common Issues & Solutions

| Issue | Symptom | Fix |
|-------|---------|-----|
| Token format | 401 even with token | Check: `Authorization: Bearer {token}` |
| Token expired | 401 Token expired | Login lại để lấy token mới |
| User not found | 401 Invalid or locked user | Check user tồn tại & không bị khóa |
| No student profile | 404 Student profile not found | Dùng student user, không phải admin |
| Permission denied | 403 when student views other | Staff/admin can view any, student can only view own |
| Invalid ID format | 400 Invalid studentId format | Kiểm tra ID có 24 ký tự hex không |

---

## 📞 If Still Have Issues

1. **Check Server Logs** - Console sẽ show chi tiết error
2. **Verify Auth Middleware** - Kiểm tra token được pass đúng
3. **Test Other Endpoints** - Xem auth có hoạt động ở endpoint khác không
4. **Database Query** - Check evidence records tồn tại trong database
5. **Populate** - Verify nested data được populate đúng

---

## 🚀 Next Steps

Khi tests pass:
1. ✅ Update documentation với findings
2. ✅ Add to API testing suite
3. ✅ Integrate với frontend score results page
4. ✅ Test end-to-end với thực tế data
