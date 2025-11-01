# 📮 Hướng Dẫn Test API Tạo Minh Chứng trong Postman

## 🚀 Bước 1: Import Postman Collection

1. Mở Postman
2. Click **Import** (góc trên bên trái)
3. Chọn file `Postman_Collection_v2.json` từ thư mục `backend/`
4. Collection sẽ được import vào workspace của bạn

## 🔑 Bước 2: Lấy Authentication Token

Trước khi test API tạo minh chứng, bạn cần đăng nhập để lấy token:

1. Trong collection, tìm folder **🔐 Authentication**
2. Chọn request **"Login - Student"** hoặc **"Login - Admin"**
3. Điền thông tin đăng nhập vào body:
```json
{
  "email": "student@example.com",
  "password": "your_password"
}
```
4. Click **Send**
5. Copy `token` từ response
6. Vào **Variables** của collection (icon ⚙️ bên cạnh collection name)
7. Paste token vào biến `token`

## 📝 Bước 3: Thiết Lập Variables (Tùy chọn)

Để dễ dàng test, bạn có thể set các biến sau trong collection variables:

- `baseUrl`: `http://localhost:5000` (hoặc URL server của bạn)
- `token`: Token đã lấy ở bước 2
- `activityId`: ID của activity (nếu có)
- `studentId`: ID của student

**Cách set variables:**
1. Click vào collection name
2. Click tab **Variables**
3. Điền các giá trị tương ứng

## 🧪 Bước 4: Test API Tạo Minh Chứng

1. Trong collection, tìm folder **Evidence**
2. Chọn request **"Create Evidence"**

### Request Details:

**Method:** `POST`

**URL:** `{{baseUrl}}/api/evidences`
- `baseUrl` sẽ tự động thay thế bằng giá trị từ variables

**Headers:**
- `Content-Type`: `application/json`
- `Authorization`: `Bearer {{token}}`

**Body (JSON):**
```json
{
  "student_id": "{{studentId}}",
  "title": "Minh chứng tham gia hoạt động",
  "file_url": "https://example.com/files/certificate.pdf",
  "self_point": 5
}
```

### Các Trường:

| Trường | Loại | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `student_id` | String (ObjectId) | ✅ **Bắt buộc** | ID của sinh viên |
| `title` | String | ✅ **Bắt buộc** | Tiêu đề minh chứng |
| `file_url` | String | ❌ Tùy chọn | URL của file minh chứng |
| `self_point` | Number | ❌ Tùy chọn | Điểm tự đánh giá (mặc định: 0) |

**Lưu ý:** 
- `_id` sẽ được tự động sinh bởi MongoDB, **KHÔNG** được truyền từ client
- Đây là minh chứng hoạt động ngoài trường, không liên kết với activity trong hệ thống

### Thay đổi Body nếu cần:

Bạn có thể chỉnh sửa body trực tiếp trong Postman:

**Ví dụ: Minh chứng hoạt động ngoài trường**
```json
{
  "student_id": "673a1b2c3d4e5f6g7h8i9j0l",
  "title": "Minh chứng tham gia hoạt động tình nguyện",
  "file_url": "https://example.com/files/cert.pdf",
  "self_point": 10
}
```

## ✅ Bước 5: Kiểm Tra Response

### Response thành công (201 Created):
```json
{
  "success": true,
  "data": {
    "_id": "673a1b2c3d4e5f6g7h8i9j0m", // Tự động sinh
    "student_id": {
      "_id": "673a1b2c3d4e5f6g7h8i9j0l",
      "name": "Nguyễn Văn A",
      ...
    },
    "title": "Minh chứng tham gia hoạt động",
    "file_url": "https://example.com/files/certificate.pdf",
    "self_point": 5,
    "class_point": 0,
    "faculty_point": 0,
    "status": "pending",
    "submitted_at": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Response lỗi (400 Bad Request):
```json
{
  "success": false,
  "message": "Student ID and title are required"
}
```

### Response lỗi xác thực (401 Unauthorized):
```json
{
  "success": false,
  "message": "Token không hợp lệ"
}
```

## 🔍 Các Test Cases Nên Thử

### Test Case 1: Tạo minh chứng thành công
- ✅ Có đầy đủ `student_id` và `title`
- ✅ Có `activityId`, `file_url`, `self_point`

### Test Case 2: Thiếu trường bắt buộc
- ❌ Thiếu `student_id` → Kỳ vọng: 400 Bad Request
- ❌ Thiếu `title` → Kỳ vọng: 400 Bad Request

### Test Case 3: Kiểm tra các trường tùy chọn
- ✅ Chỉ gửi `student_id` và `title` → Kỳ vọng: Thành công với các trường khác có giá trị mặc định

### Test Case 4: Không có token
- ❌ Xóa header Authorization → Kỳ vọng: 401 Unauthorized

### Test Case 5: Token không hợp lệ
- ❌ Sửa token thành giá trị sai → Kỳ vọng: 401 Unauthorized

## 📋 Checklist Test

- [ ] Đã import Postman collection
- [ ] Đã đăng nhập và lấy token
- [ ] Đã set token vào collection variables
- [ ] Test tạo minh chứng thành công
- [ ] Test thiếu trường bắt buộc
- [ ] Kiểm tra `_id` được tự động sinh
- [ ] Kiểm tra response có populate `student_id`

## 🐛 Troubleshooting

### Lỗi: "Cannot find module"
- **Nguyên nhân:** Server chưa chạy hoặc thiếu dependencies
- **Giải pháp:** 
  ```bash
  cd backend
  npm install
  npm start
  ```

### Lỗi: "Connection refused"
- **Nguyên nhân:** Server không chạy hoặc sai port
- **Giải pháp:** Kiểm tra `baseUrl` trong variables và đảm bảo server đang chạy

### Lỗi: "Student ID and title are required"
- **Nguyên nhân:** Thiếu trường bắt buộc trong request body
- **Giải pháp:** Kiểm tra lại body JSON, đảm bảo có `student_id` và `title`

### Lỗi: "Invalid token" hoặc "Unauthorized"
- **Nguyên nhân:** Token hết hạn hoặc không hợp lệ
- **Giải pháp:** Đăng nhập lại và cập nhật token mới

## 📚 Xem Thêm

- File API documentation: `backend/API_ENDPOINTS.md`
- Controller code: `backend/src/controllers/evidence.controller.js`
- Model schema: `backend/src/models/evidence.model.js`

