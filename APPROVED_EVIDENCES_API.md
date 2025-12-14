# API Lấy Minh Chứng Đã Duyệt - Trang Kết Quả Điểm

## Tổng Quan
API này cung cấp hai endpoint để lấy minh chứng đã được duyệt, dành cho trang hiển thị kết quả điểm của sinh viên.

---

## Endpoint 1: Lấy Minh Chứng Đã Duyệt Của Sinh Viên Hiện Tại

### URL
```
GET /api/evidence/approved/my-evidences
```

### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Authentication
- **Yêu cầu**: Có
- **Loại**: JWT Token
- **Vai trò**: Student, Staff, Admin

### Validation
- Kiểm tra JWT token có hợp lệ không
- Kiểm tra user có tồn tại không
- Kiểm tra student profile có tồn tại không
- Lọc chỉ hiển thị minh chứng có status = 'approved'

### Response (Success 200)
```json
{
  "success": true,
  "data": {
    "student_id": "507f1f77bcf86cd799439011",
    "student_number": "20210001",
    "total_approved_evidences": 3,
    "total_points": 25,
    "evidences": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "student_id": {
          "_id": "507f1f77bcf86cd799439011",
          "student_number": "20210001",
          "full_name": "Nguyễn Văn A",
          "email": "a@student.edu.vn",
          "user_id": {
            "_id": "507f1f77bcf86cd799439010",
            "email": "a@student.edu.vn"
          }
        },
        "title": "Tham gia hoạt động tình nguyện",
        "description": "Tham gia dọn vệ sinh khuôn viên trường",
        "file_url": "https://example.com/evidence1.pdf",
        "submitted_at": "2024-12-01T10:30:00Z",
        "status": "approved",
        "verified_at": "2024-12-05T14:20:00Z",
        "self_point": 5,
        "faculty_point": 5,
        "activity_id": {
          "_id": "507f1f77bcf86cd799439013",
          "title": "Hoạt động tình nguyện",
          "field_id": {
            "_id": "507f1f77bcf86cd799439014",
            "name": "Tình nguyện"
          },
          "org_unit_id": {
            "_id": "507f1f77bcf86cd799439015",
            "name": "Đoàn thanh niên"
          },
          "max_points": 10
        },
        "approved_by": {
          "_id": "507f1f77bcf86cd799439016",
          "email": "staff@university.edu.vn",
          "first_name": "Trần",
          "last_name": "Văn B"
        },
        "rejection_reason": null,
        "feedback": "Minh chứng rõ ràng, đủ điều kiện duyệt"
      }
    ]
  }
}
```

### Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "User not authenticated"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Student profile not found"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Error message here"
}
```

---

## Endpoint 2: Lấy Minh Chứng Đã Duyệt Của Một Sinh Viên Cụ Thể

### URL
```
GET /api/evidence/approved/:studentId
```

### URL Parameters
| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| `studentId` | ObjectId | Có | ID của sinh viên (MongoDB ObjectId format) |

### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Authentication
- **Yêu cầu**: Có
- **Loại**: JWT Token
- **Vai trò**: Staff, Teacher, Admin (hoặc sinh viên xem của mình)

### Validation
- Kiểm tra `studentId` không được rỗng
- Kiểm tra `studentId` có định dạng ObjectId hợp lệ
- Kiểm tra student có tồn tại không
- Kiểm tra quyền hạn:
  - Sinh viên chỉ xem được minh chứng của chính mình
  - Staff/Teacher/Admin xem được minh chứng của bất kỳ sinh viên nào
- Lọc chỉ hiển thị minh chứng có status = 'approved'

### Request Example
```bash
curl -X GET "https://api.example.com/api/evidence/approved/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

### Response (Success 200)
```json
{
  "success": true,
  "data": {
    "student_id": "507f1f77bcf86cd799439011",
    "total_approved_evidences": 3,
    "total_points": 25,
    "evidences": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "student_id": {
          "_id": "507f1f77bcf86cd799439011",
          "student_number": "20210001",
          "full_name": "Nguyễn Văn A",
          "email": "a@student.edu.vn"
        },
        "title": "Tham gia hoạt động tình nguyện",
        "description": "Tham gia dọn vệ sinh khuôn viên trường",
        "file_url": "https://example.com/evidence1.pdf",
        "submitted_at": "2024-12-01T10:30:00Z",
        "status": "approved",
        "verified_at": "2024-12-05T14:20:00Z",
        "self_point": 5,
        "faculty_point": 5,
        "activity_id": {
          "_id": "507f1f77bcf86cd799439013",
          "title": "Hoạt động tình nguyện",
          "field_id": {
            "_id": "507f1f77bcf86cd799439014",
            "name": "Tình nguyện"
          },
          "org_unit_id": {
            "_id": "507f1f77bcf86cd799439015",
            "name": "Đoàn thanh niên"
          },
          "max_points": 10
        },
        "approved_by": {
          "_id": "507f1f77bcf86cd799439016",
          "email": "staff@university.edu.vn",
          "first_name": "Trần",
          "last_name": "Văn B"
        }
      }
    ]
  }
}
```

### Error Responses

#### 400 Bad Request - studentId rỗng
```json
{
  "success": false,
  "message": "studentId is required and cannot be empty"
}
```

#### 400 Bad Request - Invalid format
```json
{
  "success": false,
  "message": "Invalid studentId format"
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "User not found"
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "message": "You do not have permission to view this student's evidence"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Student not found"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Error message here"
}
```

---

## Validation Chi Tiết

### Endpoint 1: `/api/evidence/approved/my-evidences`
1. **JWT Token Validation**
   - Kiểm tra token có hợp lệ
   - Kiểm tra token chưa hết hạn
   - Lấy userId từ token

2. **User Validation**
   - Kiểm tra userId có tồn tại trong database
   - Kiểm tra user.role có hợp lệ

3. **Student Profile Validation**
   - Kiểm tra student profile có tồn tại với user_id = userId
   - Nếu không tìm thấy => return 404 "Student profile not found"

4. **Evidence Query Validation**
   - Query: `{ student_id: student._id, status: 'approved' }`
   - Sort by: `verified_at: -1` (mới nhất trước)

5. **Data Aggregation**
   - Tính tổng số minh chứng duyệt: `total_approved_evidences`
   - Tính tổng điểm: `total_points` (tổng faculty_point)

### Endpoint 2: `/api/evidence/approved/:studentId`
1. **Parameter Validation**
   - Kiểm tra `studentId` không rỗng
   - Kiểm tra `studentId` có định dạng ObjectId hợp lệ
   - Return 400 nếu validation thất bại

2. **Student Existence Check**
   - Query student bằng studentId
   - Return 404 nếu không tìm thấy

3. **JWT Token Validation**
   - Kiểm tra token có hợp lệ
   - Lấy userId từ token

4. **Current User Validation**
   - Kiểm tra current user có tồn tại
   - Lấy role của user

5. **Permission Check**
   - Nếu là sinh viên: chỉ xem được minh chứng của chính mình
     ```
     isOwnStudent = student.user_id.toString() === userId.toString()
     ```
   - Nếu là staff/teacher/admin: xem được minh chứng của bất kỳ sinh viên nào
   - Return 403 nếu không có quyền

6. **Evidence Query & Aggregation**
   - Query: `{ student_id: studentId, status: 'approved' }`
   - Populate student info, activity info, approver info
   - Sort by: `verified_at: -1`
   - Tính tổng điểm từ faculty_point

---

## Các Kiểm Tra Bổ Sung

### 1. Error Handling
- Tất cả các endpoint có try-catch để bắt lỗi
- Log lỗi vào console cho việc debug
- Return proper HTTP status codes (400, 401, 403, 404, 500)

### 2. Data Security
- Chỉ trả về cần thiết fields của user/approver
- Không trả về sensitive data
- Validate tất cả input trước khi dùng

### 3. Performance
- Sử dụng indexes:
  - `evidenceSchema.index({ student_id: 1 })`
  - `evidenceSchema.index({ status: 1 })`
  - `evidenceSchema.index({ verified_at: -1 })`
- Populate chỉ những fields cần thiết

### 4. Authorization
- `middleware/auth.middleware`: Kiểm tra JWT token
- `req.user.userId`: Được set bởi auth middleware
- Permission check dựa trên role

---

## Lưu Ý

1. **Route Order**: Route `GET /approved/my-evidences` phải được định nghĩa trước route `GET /approved/:studentId` để tránh nhầm lẫn

2. **MongoDB ObjectId**: Sử dụng `mongoose.Types.ObjectId.isValid()` để validate format

3. **Timezone**: Dates được lưu theo UTC, frontend có thể format lại nếu cần

4. **Pagination**: Hiện tại không có pagination, có thể thêm sau nếu cần

5. **Filtering**: Hiện tại chỉ filter theo status = 'approved', có thể mở rộng thêm filters khác

---

## Các Bước Implement

1. Thêm hai methods vào `evidence.controller.js`:
   - `getApprovedEvidencesForStudent()`
   - `getMyApprovedEvidences()`

2. Thêm hai routes vào `evidence.routes.js`:
   - `GET /approved/my-evidences`
   - `GET /approved/:studentId`

3. Đảm bảo middleware auth có sẵn

4. Test API với Postman/Thunder Client

5. Integrate vào frontend

---

## Frontend Integration Example

```javascript
// Lấy minh chứng của sinh viên hiện tại
const getMyApprovedEvidences = async () => {
  try {
    const response = await fetch('/api/evidence/approved/my-evidences', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    if (result.success) {
      console.log('Total points:', result.data.total_points);
      console.log('Evidences:', result.data.evidences);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

// Lấy minh chứng của một sinh viên cụ thể (staff/teacher/admin)
const getStudentApprovedEvidences = async (studentId) => {
  try {
    const response = await fetch(`/api/evidence/approved/${studentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    if (result.success) {
      return result.data;
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```
