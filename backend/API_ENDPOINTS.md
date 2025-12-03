# API Endpoints Documentation

## Tổng quan

Tài liệu này mô tả tất cả các API endpoints có sẵn trong hệ thống quản lý hoạt động sinh viên PBL6.

**Base URL**: `/api`

**Server**: `http://localhost:5000` (Development)

---

## 📑 Mục lục

1. [Authentication & Users](#authentication--users)
2. [Organization](#-organization)
3. [Profiles](#profiles)
4. [Activities](#activities)
5. [Activity Registration](#-activity-registration) ⭐ NEW
6. [Points & Feedback](#points--feedback)
7. [Communication](#communication)
8. [System & Permissions](#system--permissions)
9. [Statistics](#statistics)
10. [Registration Status Detail](#-registration-status-detail-by-student-id) ⭐ NEW

---

## 🔐 Authentication & Users

### Auth Routes (`/api/auth`)

| Method | Endpoint                          | Description                             | Auth Required | Roles             |
| ------ | --------------------------------- | --------------------------------------- | ------------- | ----------------- |
| POST   | `/api/auth/login`                 | Đăng nhập                               | ❌            | Public            |
| POST   | `/api/auth/register`              | Đăng ký tài khoản mới                   | ❌            | Public            |
| POST   | `/api/auth/create-user`           | Admin tạo tài khoản user mới            | ✅            | admin             |
| POST   | `/api/auth/create-bulk-users`     | Admin tạo nhiều tài khoản user cùng lúc (hỗ trợ upload Excel) | ✅            | admin             |
| GET    | `/api/auth/profile`               | Lấy thông tin profile của user hiện tại | ✅            | All authenticated |
| POST   | `/api/auth/forgot-password`       | Quên mật khẩu - gửi email reset         | ❌            | Public            |
| POST   | `/api/auth/reset-password`        | Đặt lại mật khẩu bằng token             | ❌            | Public            |
| POST   | `/api/auth/change-password`       | Đổi mật khẩu (cho học sinh)             | ✅            | All authenticated |
| POST   | `/api/auth/admin-update-password` | Admin cập nhật mật khẩu user            | ✅            | admin             |

**Request Body - Login:**

```json
{
  "username": "user1",
  "password": "password123"
}
```

**Request Body - Register:**

```json
{
  "username": "newuser",
  "password": "password123"
}
```

**Request Body - Admin Create-User (Student):**

```json
{
  "username": "102220095",
  "password": "password123",
  "roleName": "student",
  "full_name": "Nguyễn Văn A",
  "class_id": "class_id_here"
}
```

**Request Body - Admin Create-User (Student with more fields):**

```json
{
  "username": "102220095",
  "password": "password123",
  "roleName": "student",
  "full_name": "Nguyễn Văn A",
  "class_id": "class_id_here",
  "enrollment_year": 2022,
  "date_of_birth": "2004-01-15",
  "gender": "male",
  "email": "student@example.com",
  "phone": "0123456789",
  "contact_address": "123 Đường ABC, Hà Nội"
}
```

**Note:** When creating a student account (`roleName: "student"`), the `student_number` field is optional. If not provided, the system will automatically use `username` as `student_number` (because in the form UI, username is the student ID). The `full_name`, `class_id`, and other fields are optional.

**Request Body - Admin Create-User (Staff with Profile):**

```json
{
  "username": "103190205",
  "password": "password123",
  "roleName": "staff",
  "full_name": "Nguyễn Văn A",
  "org_unit_id": "org_unit_id_here",
  "position": "Trưởng phòng"
}
```

**Note:** When creating a staff account (`roleName: "staff"`), the `staff_number` field is optional. If not provided, the system will automatically use `username` as `staff_number` (because in the form UI, username is the staff ID). The `full_name`, `org_unit_id`, and `position` fields are optional. Common position values include: "Trưởng phòng", "Phó phòng", "Thư kí", "Giảng viên", "Nhân viên", etc.

**Request Body - Admin Create Bulk Users:**

```json
{
  "users": [
    {
      "username": "102220095",
      "password": "102220095",
      "roleName": "student",
      "full_name": "Nguyễn Văn A",
      "class_id": "class_id_here"
    },
    {
      "username": "103190205",
      "password": "103190205",
      "roleName": "staff",
      "full_name": "Nguyễn Văn A",
      "org_unit_id": "org_unit_id_here",
      "position": "Trưởng phòng"
    }
  ]
}
```

**Note:** For staff accounts in bulk creation, `staff_number` is optional. If not provided, the system will automatically use `username` as `staff_number`. Optionally include `full_name`, `org_unit_id`, and `position` to match the form UI.

**Request - Create Bulk Users via Excel Upload (⭐ NEW):**

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: Excel file (.xlsx, .xls) - tối đa 5MB
- `roleName`: "student" hoặc "staff"

**Format Excel cho Sinh viên (roleName = "student"):**

| Mã số sinh viên | Tên sinh viên | Lớp | Khoa |
|----------------|---------------|-----|------|
| 102220095 | Nguyễn Văn A | CNTT21.1 | Khoa Công Nghệ Thông Tin |
| 102220096 | Trần Thị B | CNTT21.2 | Khoa Công Nghệ Thông Tin |

**Format Excel cho Staff (roleName = "staff"):**

| Mã cán bộ | Tên cán bộ | Đơn vị | Chức vụ |
|-----------|------------|--------|---------|
| GV001 | Phạm Văn C | Khoa Công Nghệ Thông Tin | Giảng viên |
| CTSV001 | Lê Thị D | Phòng CTSV | Nhân viên |

**Lưu ý về Excel Upload:**

- **Tên cột hỗ trợ (case-insensitive):**
  - **Sinh viên:**
    - Mã số sinh viên / MSSV / Mã sinh viên / Student ID
    - Tên sinh viên / Họ tên / Tên / Full Name / Name
    - Lớp / Class / Tên lớp
    - Khoa / Faculty / Tên khoa
  - **Staff:**
    - Mã cán bộ / Mã giảng viên / Mã nhân viên / Staff ID / Mã CB
    - Tên cán bộ / Tên giảng viên / Tên nhân viên / Họ tên / Tên / Full Name / Name
    - Đơn vị / Đơn vị công tác / Org Unit / Department
    - Chức vụ / Position
- **Dòng đầu tiên:** Phải là tiêu đề cột
- **Password:** Tự động = username (mã số sinh viên/mã cán bộ)
- **Tìm kiếm tự động:**
  - Sinh viên: Tự động tìm `class_id` từ tên lớp + tên khoa (case-insensitive)
  - Staff: Tự động tìm `org_unit_id` từ tên đơn vị (case-insensitive)
- **Validation:** Bỏ qua dòng thiếu mã số/tên (không báo lỗi, chỉ skip)
- **File size:** Tối đa 5MB
- **File format:** Chỉ hỗ trợ .xlsx, .xls

**Ví dụ Request (Excel Upload):**

```bash
curl -X POST "http://localhost:5000/api/auth/create-bulk-users" \
  -H "Authorization: Bearer <TOKEN>" \
  -F "file=@students.xlsx" \
  -F "roleName=student"
```

**Response - Create Bulk Users (Success):**

```json
{
  "success": true,
  "message": "2 users created successfully",
  "created": [
    {
      "username": "102220095",
      "role": "student",
      "id": "675e1234567890abcdef1234"
    },
    {
      "username": "102220112",
      "role": "student",
      "id": "675e1234567890abcdef5678"
    }
  ],
  "summary": {
    "total": 2,
    "created": 2,
    "failed": 0
  }
}
```

**Response - Create Bulk Users (Partial Success):**

```json
{
  "success": true,
  "message": "1 users created successfully, 1 failed",
  "created": [
    {
      "username": "102220095",
      "role": "student",
      "id": "675e1234567890abcdef1234"
    }
  ],
  "failed": [
    {
      "index": 2,
      "username": "102220112",
      "error": "Username already exists"
    }
  ],
  "summary": {
    "total": 2,
    "created": 1,
    "failed": 1
  }
}
```

**Lưu ý về Excel Upload:**

- API hỗ trợ **2 cách sử dụng:**
  1. **Upload Excel file** (mới): Gửi file Excel qua `multipart/form-data` với `file` và `roleName`
  2. **JSON array** (cũ): Gửi JSON với `users` array (backward compatible)
- **Index trong errors:** Số dòng trong Excel (1-based, bao gồm header) hoặc index trong array (0-based)
- **Password mặc định:** = username (mã số sinh viên/mã cán bộ)
- **Tự động map:**
  - Sinh viên: Tìm `class_id` từ tên lớp + tên khoa
  - Staff: Tìm `org_unit_id` từ tên đơn vị
- **Bỏ qua dòng lỗi:** Nếu một số dòng có lỗi, các dòng khác vẫn được tạo

<!-- **Request Body - Forgot Password:**
```json
{
  "username": "user1"
}
```

**Response - Forgot Password (Success):**
```json
{
  "success": true,
  "message": "Password reset link has been sent to your email."
} -->

````

<!-- **Request Body - Reset Password:**
```json
{
  "token": "reset_token_from_email",
  "newPassword": "newpassword123"
}
````

**Response - Reset Password (Success):**

```json
{
  "success": true,
  "message": "Password has been reset successfully"
} -->
```

**Request Body - Change Password (for students):**

```json
{
  "oldPassword": "oldpass123",
  "newPassword": "newpass456"
}
```

**Response - Change Password (Success):**

```json
{
  "success": true,
  "message": "Đổi mật khẩu thành công"
}
```

**Request Body - Admin Update Password:**

```json
{
  "username": "student1",
  "newPassword": "newpass456"
}
```

**Response - Admin Update Password (Success):**

```json
{
  "success": true,
  "message": "Cập nhật mật khẩu thành công"
}
```

**Lưu ý về mật khẩu:**

- **Frontend validation:** Độ dài 6–12 ký tự, password khớp confirm
- **Backend validation:** Không trùng ngày sinh (tất cả các format có/không có số 0 đứng đầu)
  - **DDMMYYYY:** 09022004, 0922004, 9022004, 922004
  - **YYYYMMDD:** 20040902, 2004092, 20049202, 2004922
- Mật khẩu mới phải khác mật khẩu cũ

---

### User Routes (`/api/users`)

| Method | Endpoint                | Description                                             | Auth Required | Permission Required |
| ------ | ----------------------- | ------------------------------------------------------- | ------------- | ------------------- |
| GET    | `/api/users`            | Lấy danh sách tất cả người dùng                         | ✅            | `user:READ`         |
| GET    | `/api/users/:id`        | Lấy chi tiết người dùng theo ID                         | ✅            | -                   |
| POST   | `/api/users`            | Tạo tài khoản người dùng mới                            | ✅            | `user:CREATE`       |
| PUT    | `/api/users/:id`        | Cập nhật thông tin người dùng                           | ✅            | `user:UPDATE`       |
| DELETE | `/api/users/:id`        | Xóa tài khoản người dùng (xóa tất cả dữ liệu liên quan) | ✅            | `user:DELETE`       |
| PUT    | `/api/users/:id/lock`   | Khóa tài khoản người dùng (không cần body)              | ✅            | `user:UPDATE`       |
| PUT    | `/api/users/:id/unlock` | Mở khóa tài khoản người dùng (không cần body)           | ✅            | `user:UPDATE`       |

#### User Role Management

| Method | Endpoint                       | Description                          | Auth Required | Permission Required |
| ------ | ------------------------------ | ------------------------------------ | ------------- | ------------------- |
| GET    | `/api/users/:id/roles`         | Lấy danh sách vai trò của người dùng | ✅            | `user:READ`         |
| POST   | `/api/users/:id/roles`         | Gán vai trò cho người dùng           | ✅            | `user:UPDATE`       |
| DELETE | `/api/users/:id/roles/:roleId` | Xóa vai trò khỏi người dùng          | ✅            | `user:UPDATE`       |

#### User Action Override Management

| Method | Endpoint                                    | Description                         | Auth Required | Permission Required |
| ------ | ------------------------------------------- | ----------------------------------- | ------------- | ------------------- |
| POST   | `/api/users/:id/actions/override`           | Thêm action override cho người dùng | ✅            | `user:UPDATE`       |
| DELETE | `/api/users/:id/actions/override/:actionId` | Xóa action override khỏi người dùng | ✅            | `user:UPDATE`       |

**Request Body - Create User (via `/api/users`):**

```json
{
  "username": "new_username",
  "password": "password123",
  "roleName": "student"
}
```

**Note:** When creating a user via `/api/users` POST, minimal fields are required. To include profile information (name, phone, etc.), use `/api/auth/create-user` endpoint instead (see "Admin Create-User" examples above).

**Request Body - Assign Role:**

```json
{
  "role_id": "role_uuid_here",
  "org_unit_id": "org_unit_uuid_here" // nếu cần gán role theo tổ chức
}
```

**Request Body - Update User:**

```json
{
  "username": "updated_username",
  "active": true,
  "isLocked": false
}
```

**Note:** 
- All fields are optional. Only send the fields you want to update
- Do NOT update `password_hash` directly. Use `/api/auth/admin-update-password` endpoint instead
- Available fields: `username`, `active`, `isLocked`

**Response - Delete User (Success):**

```json
{
  "success": true,
  "message": "User and all related data deleted successfully"
}
```

**Lưu ý - Delete User:**

- **Cascade delete**: Xóa user sẽ tự động xóa tất cả dữ liệu liên quan:
  - Staff Profile (nếu user là cán bộ)
  - Student Profile (nếu user là sinh viên)
  - User Roles (vai trò của user)
  - Action Overrides (quyền đặc biệt của user)
  - Evidence Records (minh chứng của user)
- Khi xóa user, KHÔNG cần xóa từng cái một, chỉ cần call DELETE `/api/users/:id`
- User phải tồn tại mới có thể xóa, nếu không sẽ trả về lỗi 404

**Request Body - Add Action Override:**

```json
{
  "action_id": "action_uuid_here",
  "is_granted": true
}
```

**Note:** The `is_granted` field is optional and defaults to `true` if not specified. Set to `false` to explicitly deny an action for the user.

**Lưu ý - Lock/Unlock User:**

- `PUT /api/users/:id/lock`: Không cần body, sẽ tự động khóa tài khoản
- `PUT /api/users/:id/unlock`: Không cần body, sẽ tự động mở khóa tài khoản

---

## 🏫 Organization

### Faculty Routes (`/api/faculties`)

| Method | Endpoint                              | Description                 | Auth Required | Permission Required |
| ------ | ------------------------------------- | --------------------------- | ------------- | ------------------- |
| GET    | `/api/faculties`                      | Lấy tất cả khoa             | ❌            | -                   |
| GET    | `/api/faculties/:id`                  | Lấy chi tiết khoa theo ID   | ❌            | -                   |
| GET    | `/api/faculties/:id/classes`          | Lấy danh sách lớp của khoa  | ❌            | -                   |
| POST   | `/api/faculties`                      | Tạo khoa mới                | ✅            | `faculty:CREATE`    |
| PUT    | `/api/faculties/:id`                  | Cập nhật thông tin khoa     | ✅            | `faculty:UPDATE`    |
| DELETE | `/api/faculties/:id`                  | Xóa khoa                    | ✅            | `faculty:DELETE`    |

**Request Body - Create Faculty:**

```json
{
  "name": "Khoa Công nghệ Thông tin",
  "founded_date": "2000-01-01",
  "achievements": [
    "Top 3 Quốc Gia Về Tré 2020",
    "Tổ chức 50+ workshop trong 3 năm gần nhất"
  ],
  "description": "Khoa đào tạo lập trình viên chất lượng cao...",
  "leader_id": "staff_id_here"
}
```

**Request Body - Update Faculty:**

```json
{
  "name": "Khoa Kỹ thuật Máy tính (cập nhật)",
  "founded_date": "2000-01-01",
  "achievements": [...],
  "description": "...",
  "leader_id": "staff_id_here"
}
```

**Response - Get All Faculties:**

```json
[
  {
    "_id": "691d6303db9ec83878f1b66c",
    "name": "Khoa Công Nghệ Thông Tin",
    "type": "faculty",
    "founded_date": "2000-01-01T00:00:00.000Z",
    "achievements": [
      "Top 3 Quốc Gia Về Tré 2020",
      "Tổ chức 50+ workshop trong 3 năm gần nhất",
      "Hợp tác cùng Google Developer Group Việt Nam - 2024"
    ],
    "description": "Khoa Công Nghệ Thông Tin - Trung tâm đào tạo lập trình viên chất lượng cao, với cơ sở vật chất hiện đại và giảng viên giàu kinh nghiệm.",
    "leader_id": {
      "_id": "staff_leader_id",
      "full_name": "Nguyễn Văn A",
      "position": "Trưởng khoa"
    }
  },
  {
    "_id": "faculty_id_2",
    "name": "Khoa Kỹ thuật Phần mềm",
    "type": "faculty",
    "founded_date": "2005-03-15T00:00:00.000Z",
    "achievements": [...],
    "description": "...",
    "leader_id": {...}
  }
]
```

**Response - Get Faculty By ID:**

```json
{
  "_id": "691d6303db9ec83878f1b66c",
  "name": "Khoa Công Nghệ Thông Tin",
  "type": "faculty",
  "founded_date": "2000-01-01T00:00:00.000Z",
  "achievements": [
    "Top 3 Quốc Gia Về Tré 2020",
    "Tổ chức 50+ workshop trong 3 năm gần nhất",
    "Hợp tác cùng Google Developer Group Việt Nam - 2024"
  ],
  "description": "Khoa Công Nghệ Thông Tin - Trung tâm đào tạo lập trình viên chất lượng cao...",
  "leader_id": {
    "_id": "staff_leader_id",
    "full_name": "Nguyễn Văn A",
    "position": "Trưởng khoa"
  }
}
```

---

## 👤 Profiles

### Student Profile Routes (`/api/student-profiles`)

| Method | Endpoint                                              | Description                             | Auth Required | Permission Required      |
| ------ | ----------------------------------------------------- | --------------------------------------- | ------------- | ------------------------ |
| GET    | `/api/student-profiles`                               | Lấy tất cả hồ sơ sinh viên              | ✅            | `student_profile:READ`   |
| GET    | `/api/student-profiles/:id`                           | Lấy hồ sơ sinh viên theo ID             | ✅            | -                        |
| GET    | `/api/student-profiles/user/:userId`                  | Lấy hồ sơ sinh viên theo User ID        | ✅            | -                        |
| GET    | `/api/student-profiles/student-number/:studentNumber` | Lấy hồ sơ theo mã sinh viên             | ✅            | -                        |
| GET    | `/api/student-profiles/class/:classId/students`       | Lấy danh sách sinh viên theo lớp        | ✅            | `student_profile:READ`   |
| GET    | `/api/student-profiles/class-monitors`                | Lấy danh sách tất cả lớp trưởng         | ✅            | `student_profile:READ`   |
| POST   | `/api/student-profiles`                               | Tạo hồ sơ sinh viên mới                 | ✅            | `student_profile:CREATE` |
| PUT    | `/api/student-profiles/:id`                           | Cập nhật hồ sơ sinh viên                | ✅            | `student_profile:UPDATE` |
| DELETE | `/api/student-profiles/:id`                           | Xóa hồ sơ sinh viên                     | ✅            | `student_profile:DELETE` |
| PUT    | `/api/student-profiles/:id/set-monitor`               | Đặt làm lớp trưởng                      | ✅            | `student_profile:UPDATE` |
| PUT    | `/api/student-profiles/:id/unset-monitor`             | Hủy chức lớp trưởng                     | ✅            | `student_profile:UPDATE` |
| PUT    | `/api/student-profiles/:id/toggle-monitor`            | Toggle trạng thái lớp trưởng (với body) | ✅            | `student_profile:UPDATE` |

**Request Body - Create Student Profile:**

```json
{
  "userId": "user_uuid_here",
  "studentNumber": "102220095",
  "classId": "class_uuid_here",
  "cohortId": "cohort_uuid_here",
  "phone": "0123456789",
  "address": "Hà Nội"
}
```

**Request Body - Update Student Profile:**

```json
{
  "full_name": "Nguyễn Văn A",
  "date_of_birth": "2002-01-15",
  "gender": "male",
  "email": "student@example.com",
  "phone": "0987654321",
  "enrollment_year": 2020,
  "contact_address": "123 Đường ABC, Quận XYZ, TP. Hà Nội"
}
```

**Request Body - Toggle Class Monitor (`/api/student-profiles/:id/toggle-monitor`):**

```json
{
  "isClassMonitor": true // hoặc false
}
```

**Lưu ý về Toggle Class Monitor:**

- Nếu gửi body với `isClassMonitor: true`, sẽ đặt sinh viên làm lớp trưởng và tự động hủy lớp trưởng cũ trong cùng lớp
- Nếu gửi body với `isClassMonitor: false`, sẽ hủy chức lớp trưởng
- Nếu không gửi body, sẽ tự động toggle giá trị hiện tại (true → false, false → true)

**Response - Toggle Class Monitor:**

```json
{
  "success": true,
  "message": "Class monitor set successfully" hoặc "Class monitor status removed successfully",
  "data": {
    "_id": "...",
    "isClassMonitor": true,
    "full_name": "...",
    ...
  }
}
```

---

### Staff Profile Routes (`/api/staff-profiles`)

| Method | Endpoint                                        | Description                                 | Auth Required | Roles       |
| ------ | ----------------------------------------------- | ------------------------------------------- | ------------- | ----------- |
| GET    | `/api/staff-profiles`                           | Lấy tất cả hồ sơ cán bộ                     | ✅            | admin, ctsv |
| GET    | `/api/staff-profiles/:id`                       | Lấy hồ sơ cán bộ theo ID                    | ✅            | -           |
| GET    | `/api/staff-profiles/user/:userId`              | Lấy hồ sơ cán bộ theo User ID               | ✅            | -           |
| GET    | `/api/staff-profiles/staff-number/:staffNumber` | Lấy hồ sơ theo mã cán bộ                    | ✅            | -           |
| GET    | `/api/staff-profiles/username/:username`        | Lấy hồ sơ cán bộ theo username              | ✅            | -           |
| GET    | `/api/staff-profiles/org-unit/:orgUnitId/staff` | Lấy danh sách cán bộ theo đơn vị            | ✅            | -           |
| GET    | `/api/staff-profiles/positions`                 | Lấy danh sách các position (chức vụ) có sẵn | ✅            | -           |
| POST   | `/api/staff-profiles`                           | Tạo hồ sơ cán bộ mới                        | ✅            | admin, ctsv |
| PUT    | `/api/staff-profiles/:id`                       | Cập nhật hồ sơ cán bộ                       | ✅            | -           |
| DELETE | `/api/staff-profiles/:id`                       | Xóa hồ sơ cán bộ                            | ✅            | admin, ctsv |

**Request Body - Create Staff Profile:**

```json
{
  "user_id": "user_uuid_here",
  "staff_number": "STAFF001",
  "full_name": "Nguyễn Văn A",
  "org_unit_id": "org_unit_uuid_here",
  "faculty_id": "faculty_uuid_here",
  "position": "Trưởng phòng",
  "email": "staff@example.com",
  "phone": "0123456789",
  "date_of_birth": "1980-01-15",
  "gender": "male",
  "contact_address": "123 Đường ABC, Hà Nội",
  "staff_image": "https://example.com/images/staff.jpg"
}
```

**Request Body - Update Staff Profile:**

```json
{
  "full_name": "Nguyễn Văn B",
  "position": "Phó phòng",
  "org_unit_id": "org_unit_uuid_here",
  "faculty_id": "faculty_uuid_here",
  "email": "staff2@example.com",
  "phone": "0987654321",
  "date_of_birth": "1985-05-20",
  "gender": "female",
  "contact_address": "456 Đường XYZ, Hà Nội",
  "staff_image": "https://example.com/images/staff.jpg"
}
```

**Response - Get Staff Profile By ID:**

```json
{
  "_id": "691d5c6df46edc8ea94f0a0e",
  "user_id": {
    "_id": "691d5c6df46edc8ea94f0a01",
    "username": "staff001",
    "email": "staff001@example.com"
  },
  "staff_number": "GV001",
  "full_name": "Phạm Thị Giáo viên A",
  "date_of_birth": "1986-03-25T00:00:00.000Z",
  "gender": "female",
  "email": "teachera@ptit.edu.vn",
  "phone": "0912345004",
  "org_unit_id": {
    "_id": "691d5c6df46edc8ea94f09fc",
    "name": "Khoa Công Nghệ Thông Tin",
    "type": "faculty"
  },
  "faculty_id": {
    "_id": "691d6303db9ec83878f1b66c",
    "name": "Khoa Công Nghệ Thông Tin"
  },
  "position": "Giảng viên",
  "staff_image": "",
  "contact_address": "Hanoi, Vietnam"
}
```

**Response - Get Positions (`GET /api/staff-profiles/positions`):**

```json
{
  "success": true,
  "data": [
    "Cán bộ",
    "Chuyên viên",
    "Giảng viên",
    "Nhân viên",
    "Phó phòng",
    "Phó trưởng bộ môn",
    "Phó trưởng khoa",
    "Thư kí",
    "Trợ lý",
    "Trưởng bộ môn",
    "Trưởng khoa",
    "Trưởng phòng"
  ],
  "count": 12
}
```

**Response - Get Staff Profile (Staff belongs to Faculty):**

```json
{
  "_id": "staff_profile_id",
  "user_id": {
    "_id": "user_id",
    "username": "staff001"
  },
  "staff_number": "STAFF001",
  "full_name": "Nguyễn Văn A",
  "org_unit_id": {
    "_id": "org_unit_id",
    "name": "Khoa Công nghệ thông tin",
    "type": "faculty",
    "leader_id": null
  },
  "position": "Trưởng khoa",
  "email": "staff@example.com",
  "phone": "0123456789",
  "date_of_birth": "1980-01-15T00:00:00.000Z",
  "gender": "male",
  "contact_address": "123 Đường ABC, Hà Nội",
  "staff_image": "https://example.com/images/staff.jpg",
  "is_faculty_member": true,
  "faculty_id": "org_unit_id",
  "faculty_name": "Khoa Công nghệ thông tin"
}
```

**Response - Get Staff Profile (Staff belongs to other Org Unit - e.g., Đoàn trường, CTSV):**

```json
{
  "_id": "staff_profile_id",
  "user_id": {
    "_id": "user_id",
    "username": "staff002"
  },
  "staff_number": "STAFF002",
  "full_name": "Nguyễn Văn B",
  "org_unit_id": {
    "_id": "org_unit_id",
    "name": "Phòng CTSV",
    "type": "ctsv",
    "leader_id": null
  },
  "position": "Trưởng phòng",
  "email": "staff2@example.com",
  "phone": "0987654321",
  "date_of_birth": "1985-05-20T00:00:00.000Z",
  "gender": "female",
  "contact_address": "456 Đường XYZ, Hà Nội",
  "staff_image": null
}
```

**Response - Get Staff Profile (No Org Unit):**

```json
{
  "_id": "staff_profile_id",
  "user_id": {
    "_id": "user_id",
    "username": "staff003"
  },
  "staff_number": "STAFF003",
  "full_name": "Nguyễn Văn C",
  "org_unit_id": null,
  "position": "Giảng viên",
  "email": "staff3@example.com",
  "phone": "0123456789",
  "date_of_birth": null,
  "gender": null,
  "contact_address": null,
  "staff_image": null
}
```

**Note:**

- The `position` field (chức vụ) is optional. Use `GET /api/staff-profiles/positions` to get the list of available positions.
- The API returns both default positions and positions currently used in the database.
- Both camelCase (userId, staffNumber, orgUnitId, fullName, dateOfBirth, contactAddress, staffImage) and snake_case (user_id, staff_number, org_unit_id, full_name, date_of_birth, contact_address, staff_image) field names are supported.
- Required fields for Create: `user_id` (or `userId`) and `staff_number` (or `staffNumber`).
- All other fields are optional.
- **Faculty Information**:
  - **Only added when staff belongs to a faculty** (i.e., `org_unit_id.type === "faculty"`):
    - `is_faculty_member`: `true`
    - `faculty_id`: ID từ bảng `falcuty` (không phải `org_unit_id._id`)
      - Nếu `org_unit.falcuty_id` có giá trị, dùng `org_unit.falcuty_id` (đây là ID thật từ bảng `falcuty`)
      - Nếu không có `falcuty_id`, hệ thống sẽ tìm khoa trong bảng `falcuty` theo tên (name matching)
      - **Important**: `faculty_id` là ID từ bảng `falcuty`, không phải `org_unit_id._id`
    - `faculty_name`: Tên khoa từ bảng `falcuty`
  - **When staff belongs to other org units** (type !== "faculty", e.g., Đoàn trường, CTSV, CLB) **or has no org unit**:
    - The response will **NOT include** `is_faculty_member`, `faculty_id`, or `faculty_name` fields
    - Response remains in the original format (same as before)

---

### Student Cohort Routes (`/api/student-cohorts`)

| Method | Endpoint                                  | Description                           | Auth Required | Roles              |
| ------ | ----------------------------------------- | ------------------------------------- | ------------- | ------------------ |
| GET    | `/api/student-cohorts`                    | Lấy tất cả mối quan hệ sinh viên-khóa | ✅            | admin, ctsv, staff |
| GET    | `/api/student-cohorts/:id`                | Lấy quan hệ sinh viên-khóa theo ID    | ✅            | -                  |
| GET    | `/api/student-cohorts/student/:studentId` | Lấy các khóa của sinh viên            | ✅            | -                  |
| GET    | `/api/student-cohorts/cohort/:cohortId`   | Lấy sinh viên theo khóa               | ✅            | -                  |
| POST   | `/api/student-cohorts`                    | Tạo mối quan hệ sinh viên-khóa mới    | ✅            | admin, ctsv        |
| PUT    | `/api/student-cohorts/:id`                | Cập nhật mối quan hệ                  | ✅            | admin, ctsv        |
| DELETE | `/api/student-cohorts/:id`                | Xóa mối quan hệ                       | ✅            | admin, ctsv        |

**Request Body - Create Student Cohort:**

```json
{
  "student_id": "student_uuid_here",
  "cohort_id": "cohort_uuid_here"
}
```

**Request Body - Update Student Cohort:**

```json
{
  "cohort_id": "cohort_uuid_here"
}
```

---

### PVCD Record Routes (`/api/pvcd-records`)

| Method | Endpoint                               | Description                     | Auth Required | Roles              |
| ------ | -------------------------------------- | ------------------------------- | ------------- | ------------------ |
| GET    | `/api/pvcd-records`                    | Lấy tất cả bản ghi PVCD         | ✅            | admin, ctsv, staff |
| GET    | `/api/pvcd-records/:id`                | Lấy bản ghi PVCD theo ID        | ✅            | -                  |
| GET    | `/api/pvcd-records/student/:studentId` | Lấy bản ghi PVCD theo sinh viên | ✅            | -                  |
| GET    | `/api/pvcd-records/year/:year`         | Lấy bản ghi PVCD theo năm       | ✅            | admin, ctsv, staff |
| POST   | `/api/pvcd-records`                    | Tạo bản ghi PVCD mới            | ✅            | admin, ctsv        |
| PUT    | `/api/pvcd-records/:id`                | Cập nhật bản ghi PVCD           | ✅            | admin, ctsv        |
| PUT    | `/api/pvcd-records/:id/points`         | Cập nhật điểm PVCD              | ✅            | admin, ctsv        |
| DELETE | `/api/pvcd-records/:id`                | Xóa bản ghi PVCD                | ✅            | admin, ctsv        |

**Request Body - Create PVCD Record:**

```json
{
  "student_id": "student_uuid_here",
  "year": 2024,
  "start_year": "2024-09-01T00:00:00.000Z",
  "end_year": "2025-06-30T00:00:00.000Z",
  "total_point": 15
}
```

**Request Body - Update PVCD Record:**

```json
{
  "student_id": "student_uuid_here",
  "year": 2025,
  "start_year": "2024-09-01T00:00:00.000Z",
  "end_year": "2025-06-30T00:00:00.000Z",
  "total_point": 20
}
```

**Request Body - Update PVCD Points:**

```json
{
  "total_point": 25
}
```

---

## 🏢 Organization

### Faculty Routes (`/api/faculties`)

| Method | Endpoint                     | Description                | Auth Required | Roles       |
| ------ | ---------------------------- | -------------------------- | ------------- | ----------- |
| GET    | `/api/faculties`             | Lấy tất cả khoa            | ❌            | Public      |
| GET    | `/api/faculties/:id`         | Lấy thông tin khoa theo ID | ❌            | Public      |
| GET    | `/api/faculties/:id/classes` | Lấy danh sách lớp của khoa | ❌            | Public      |
| POST   | `/api/faculties`             | Tạo khoa mới               | ✅            | admin, ctsv |
| PUT    | `/api/faculties/:id`         | Cập nhật thông tin khoa    | ✅            | admin, ctsv |
| DELETE | `/api/faculties/:id`         | Xóa khoa                   | ✅            | admin, ctsv |

**Request Body - Create Faculty:**

```json
{
  "name": "Khoa Công nghệ thông tin",
  "code": "CNTT",
  "description": "Khoa Công nghệ thông tin"
}
```

**Request Body - Update Faculty:**

```json
{
  "name": "Khoa Công nghệ thông tin (đã cập nhật)",
  "code": "CNTT",
  "description": "Khoa Công nghệ thông tin - Mô tả mới"
}
```

---

### Field Routes (`/api/fields`)

| Method | Endpoint          | Description                     | Auth Required | Roles       |
| ------ | ----------------- | ------------------------------- | ------------- | ----------- |
| GET    | `/api/fields`     | Lấy tất cả ngành học            | ❌            | Public      |
| GET    | `/api/fields/:id` | Lấy thông tin ngành học theo ID | ❌            | Public      |
| POST   | `/api/fields`     | Tạo ngành học mới               | ✅            | admin, ctsv |
| PUT    | `/api/fields/:id` | Cập nhật thông tin ngành học    | ✅            | admin, ctsv |
| DELETE | `/api/fields/:id` | Xóa ngành học                   | ✅            | admin, ctsv |

**Request Body - Create Field:**

```json
{
    "name": "Y tế"
}
```

**Request Body - Update Field:**

```json
{
    "name": "Y tế(cập nhật)"
}
```

---

### Cohort Routes (`/api/cohorts`)

| Method | Endpoint                    | Description                      | Auth Required | Roles       |
| ------ | --------------------------- | -------------------------------- | ------------- | ----------- |
| GET    | `/api/cohorts`              | Lấy tất cả khóa học              | ❌            | Public      |
| GET    | `/api/cohorts/:id`          | Lấy thông tin khóa học theo ID   | ❌            | Public      |
| GET    | `/api/cohorts/year/:year`   | Lấy khóa học theo năm            | ❌            | Public      |
| GET    | `/api/cohorts/:id/classes`  | Lấy danh sách lớp của khóa       | ❌            | Public      |
| GET    | `/api/cohorts/:id/students` | Lấy danh sách sinh viên của khóa | ❌            | Public      |
| POST   | `/api/cohorts`              | Tạo khóa học mới                 | ✅            | admin, ctsv |
| PUT    | `/api/cohorts/:id`          | Cập nhật thông tin khóa học      | ✅            | admin, ctsv |
| DELETE | `/api/cohorts/:id`          | Xóa khóa học                     | ✅            | admin, ctsv |

**Request Body - Create Cohort:**

```json
{
  "year": 2024
}
```

**Request Body - Update Cohort:**

```json
{
  "year": 2025
}
```

---

### Class Routes (`/api/classes`)

| Method | Endpoint                                  | Description                       | Auth Required | Roles       |
| ------ | ----------------------------------------- | --------------------------------- | ------------- | ----------- |
| GET    | `/api/classes`                            | Lấy tất cả lớp học                | ❌            | Public      |
| GET    | `/api/classes/:id`                        | Lấy thông tin lớp học theo ID     | ❌            | Public      |
| GET    | `/api/classes/faculty/:facultyId/classes` | Lấy danh sách lớp theo khoa       | ❌            | Public      |
| GET    | `/api/classes/cohort/:cohortId/classes`   | Lấy danh sách lớp theo khóa       | ❌            | Public      |
| GET    | `/api/classes/:id/students`               | Lấy danh sách sinh viên trong lớp | ❌            | Public      |
| POST   | `/api/classes`                            | Tạo lớp học mới                   | ✅            | admin, ctsv |
| PUT    | `/api/classes/:id`                        | Cập nhật thông tin lớp học        | ✅            | admin, ctsv |
| DELETE | `/api/classes/:id`                        | Xóa lớp học                       | ✅            | admin, ctsv |

**Request Body - Create Class:**

```json
{
  "name": "Lớp A1",
  "falcuty_id": "faculty_uuid_here",
  "cohort_id": "cohort_uuid_here"
}
```

**Request Body - Update Class:**

```json
{
  "name": "Lớp A1 (cập nhật)",
  "falcuty_id": "faculty_uuid_here",
  "cohort_id": "cohort_uuid_here"
}
```

---

### Organization Unit Routes (`/api/org-units`)

| Method | Endpoint                        | Description                                                        | Auth Required | Roles       |
| ------ | ------------------------------- | ------------------------------------------------------------------ | ------------- | ----------- |
| GET    | `/api/org-units`                | Lấy tất cả đơn vị tổ chức                                          | ❌            | Public      |
| GET    | `/api/org-units/:id`            | Lấy thông tin đơn vị theo ID                                       | ❌            | Public      |
| GET    | `/api/org-units/type/:type`     | Lấy đơn vị theo loại                                               | ❌            | Public      |
| GET    | `/api/org-units/:id/staff`      | Lấy danh sách cán bộ của đơn vị                                    | ❌            | Public      |
| POST   | `/api/org-units`                | Tạo đơn vị tổ chức mới (tự động sync với Faculty nếu type=faculty) | ✅            | admin, ctsv |
| PUT    | `/api/org-units/:id`            | Cập nhật thông tin đơn vị                                          | ✅            | admin, ctsv |
| DELETE | `/api/org-units/:id`            | Xóa đơn vị tổ chức                                                 | ✅            | admin, ctsv |
| PUT    | `/api/org-units/:id/set-leader` | Đặt trưởng đơn vị                                                  | ✅            | admin, ctsv |

**Request Body - Create Organization Unit:**

```json
{
  "name": "Khoa Công nghệ thông tin",
  "type": "faculty",
  "leader_id": "leader_uuid_here" // optional
}
```

**Lưu ý - Create Organization Unit:**

- **Nếu type = "faculty"**:
  - Hệ thống sẽ **tự động kiểm tra** xem faculty có tồn tại trong bảng `falcuty` không (theo tên)
  - Nếu chưa tồn tại → **tạo mới faculty** và dùng ID của faculty này
  - Nếu đã tồn tại → **dùng luôn ID của faculty** (không tạo duplicate)
  - **Kết quả**: `org_unit._id` sẽ **trùng với** `faculty._id` (hoàn toàn tự động)
  - Lợi ích: Không cần tạo faculty riêng, chỉ cần POST org_unit với type=faculty
- **Nếu type khác "faculty"** (ví dụ: "ctsv", "doan", "club"):
  - Hệ thống sẽ **tự sinh ID** bình thường (MongoDB ObjectId)
  - Không có bất kỳ đồng bộ hóa với bảng faculty
- **Các trường optional**: `leader_id` (ID của cán bộ làm trưởng)

**Request Body - Set Leader:**

```json
{
  "leaderId": "staff_profile_uuid_here"
}
```

**Request Body - Update Organization Unit:**

```json
{
  "name": "Khoa Công nghệ thông tin (cập nhật)",
  "type": "faculty",
  "leader_id": "leader_uuid_here"
}
```

**Response - Get Org Unit Staff (`GET /api/org-units/:id/staff`):**
The response format is the same as Staff Profile responses.

**Note:**

- The staff list returned by this endpoint uses the same formatting as Staff Profile endpoints.
- **If the org unit is a faculty** (type="faculty"), all staff in that org unit will have:
  - `is_faculty_member`: `true`
  - `faculty_id`: ID từ bảng `falcuty` (không phải `org_unit_id._id`)
    - Nếu `org_unit.falcuty_id` có giá trị, dùng `org_unit.falcuty_id` (đây là ID thật từ bảng `falcuty`)
    - Nếu không có `falcuty_id`, hệ thống sẽ tìm khoa trong bảng `falcuty` theo tên (name matching)
  - `faculty_name`: Tên khoa từ bảng `falcuty`
  - **Important**: `faculty_id` là ID từ bảng `falcuty`, không phải `org_unit_id._id`
- **If the org unit is not a faculty** (e.g., Đoàn trường, CTSV, CLB), the response will **NOT include** `is_faculty_member`, `faculty_id`, or `faculty_name` fields (same as original format).

---

## 🎯 Activities

### Activity Routes (`/api/activities`)

| Method | Endpoint                             | Description                                                                                   | Auth Required | Permission Required            |
| ------ | ------------------------------------ | --------------------------------------------------------------------------------------------- | ------------- | ------------------------------ |
| GET    | `/api/activities`                    | Lấy tất cả hoạt động (có thể filter theo org_unit_id, field_id, status, start_date, end_date) | ❌            | - (Public)                     |
| GET    | `/api/activities/filter`             | Lọc tất cả hoạt động (không cần studentId, hỗ trợ title search)                              | ❌            | - (Public)                     |
| GET    | `/api/activities/my/activities`      | Lấy hoạt động của sinh viên hiện tại                                                          | ✅            | - (Own data)                   |
| GET    | `/api/activities/student/:studentId` | Lấy hoạt động của một sinh viên cụ thể                                                        | ✅            | `activity_registration:READ`   |
| GET    | `/api/activities/student/:student_id/filter` | Lọc hoạt động của sinh viên (đã đăng ký, đã duyệt, đã tham gia) | ✅            | `activity_registration:READ` hoặc `attendance:READ` |
| GET    | `/api/activities/:activityId/student/:studentId` | Lấy chi tiết hoạt động + trạng thái đăng ký của sinh viên | ✅            | `activity_registration:READ`   |
| GET    | `/api/activities/:id`                | Lấy chi tiết hoạt động theo ID (bao gồm requirements)                                         | ❌            | - (Public)                     |
| POST   | `/api/activities`                    | Tạo hoạt động mới (có thể kèm yêu cầu khoa/khóa tham gia)                                     | ✅            | `activity:CREATE`              |
| POST   | `/api/activities/suggest`            | Đề xuất hoạt động (status = chờ duyệt)                                                        | ✅            | - (Authenticated)              |
| PUT    | `/api/activities/:id`                | Cập nhật thông tin hoạt động                                                                  | ✅            | `activity:UPDATE`              |
| DELETE | `/api/activities/:id`                | Xóa hoạt động                                                                                 | ✅            | `activity:DELETE`              |
| PUT    | `/api/activities/:id/approve`        | Phê duyệt hoạt động (chuyển từ chờ duyệt -> chưa tổ chức/đang tổ chức/đã tổ chức)             | ✅            | `activity:APPROVE`             |
| PUT    | `/api/activities/:id/reject`         | Từ chối hoạt động (tạo bản ghi trong bảng activity_rejection)                                 | ✅            | `activity:REJECT`              |
| PUT    | `/api/activities/:id/complete`       | Đánh dấu hoàn thành hoạt động (status = đã tổ chức)                                           | ✅            | `activity:UPDATE`              |
| PUT    | `/api/activities/:id/cancel`         | Hủy hoạt động (status = hủy hoạt động). Body: `{cancellation_reason: string}` (bắt buộc)    | ✅            | `activity:UPDATE`              |
| POST   | `/api/activities/:id/register`       | Đăng ký tham gia hoạt động                                                                    | ✅            | `activity_registration:CREATE` |
| GET    | `/api/activities/:id/registrations`  | Lấy danh sách đăng ký của hoạt động                                                           | ✅            | `activity_registration:READ`   |
| GET    | `/api/activities/rejections`         | Lấy tất cả các hoạt động bị từ chối                                                           | ✅            | `activity:READ`                |
| GET    | `/api/activities/:id/rejection`      | Lấy thông tin từ chối của hoạt động                                                           | ✅            | `activity:READ`                |
| DELETE | `/api/activities/:id/rejection`      | Xóa thông tin từ chối hoạt động                                                               | ✅            | `activity:DELETE`              |

**Request Body - Create Activity:**

```json
{
  "title": "Hoạt động tình nguyện",
  "description": "Mô tả hoạt động",
  "location": "P101",
  "start_time": "2024-01-15T08:00:00.000Z",
  "end_time": "2024-01-15T12:00:00.000Z",
  "capacity": 50,
  "registration_open": "2024-01-10T00:00:00.000Z",
  "registration_close": "2024-01-14T23:59:59.000Z",
  "requires_approval": false,
  "org_unit_id": "org_unit_id_here",
  "field_id": "field_id_here",
  "activity_image": "https://example.com/image.jpg",
  "max_points": 15,
  "requirements": [
    { "type": "falcuty", "id": "faculty_id_here" },
    { "type": "cohort", "id": "cohort_id_here" }
  ]
}
```

**Lưu ý về trường `max_points`:**
- `max_points` (**required**): Điểm tối đa của hoạt động (số >= 0)
- Bắt buộc phải nhập khi tạo hoạt động
- Dùng để tính điểm động khi sinh viên quét QR code
- Công thức tính điểm: `floor((scan_order / total_qr_at_scan) * max_points)`

**Lưu ý về trường `requirements`:**

- Trường `requirements` là **optional** khi tạo hoạt động.
- Nếu gửi lên, phải là một mảng các đối tượng, mỗi đối tượng có:
  - `type`: Loại yêu cầu (`falcuty` hoặc `cohort`)
  - Nếu `type = "falcuty"`: cần `name` (tên khoa)
  - Nếu `type = "cohort"`: cần `year` (năm khóa)
- Ví dụ: Chỉ sinh viên thuộc khoa CNTT và khóa 2022 mới được tham gia:
  ```json
  "requirements": [
    { "type": "falcuty", "name": "Khoa Công nghệ Thông tin" },
    { "type": "cohort", "year": 2022 }
  ]
  ```
- Nếu không gửi trường này, hoạt động sẽ **không giới hạn** khoa/khóa tham gia.
- Khi tạo hoặc cập nhật, hệ thống sẽ tự động tìm khoa/khóa tương ứng và lưu vào bảng `activity_eligibility`.

**Lưu ý - Create Activity:**

- Status sẽ được tự động set dựa trên thời gian:
  - Nếu `end_time < now`: status = `đã tổ chức`
  - Nếu `start_time <= now <= end_time`: status = `đang tổ chức`
  - Nếu `start_time > now`: status = `chưa tổ chức`
- Hoạt động được tạo sẽ có status = `chưa tổ chức` (nếu start_time trong tương lai) hoặc `đang tổ chức`/`đã tổ chức` (nếu đang diễn ra hoặc đã kết thúc)
- **`max_points`** (**required**): Điểm tối đa của hoạt động (số >= 0). Bắt buộc phải nhập
- **`total_qr_created`**: Tự động = 0 khi tạo mới, tăng dần khi admin tạo QR code
- Yêu cầu permission: `activity:CREATE`

**Request Body - Update Activity:**

```json
{
  "title": "Hoạt động tình nguyện (cập nhật)",
  "description": "Mô tả hoạt động (cập nhật)",
  "location": "P102",
  "start_time": "2024-01-20T08:00:00.000Z",
  "end_time": "2024-01-20T12:00:00.000Z",
  "capacity": 60,
  "registration_open": "2024-01-15T00:00:00.000Z",
  "registration_close": "2024-01-19T23:59:59.000Z",
  "requires_approval": true,
  "org_unit_id": "org_unit_id_here",
  "field_id": "field_id_here",
  "activity_image": "https://example.com/image-updated.jpg",
  "max_points": 20,
  "requirements": [
    { "type": "falcuty", "name": "cntt" },
    { "type": "cohort", "year": 2023 }
  ]
}
```

**Lưu ý - Update Activity:**

- Tất cả các trường đều **optional** - chỉ gửi những trường cần cập nhật
- **`max_points`** (optional khi update): Điểm tối đa của hoạt động (số >= 0). Có thể cập nhật riêng trường này. Không thể set = null
- **`requirements`**: Nếu gửi trường này, tất cả requirements cũ sẽ bị xóa và thay thế bằng những requirements mới
- Nếu gửi `requirements: []` (mảng rỗng), tất cả requirements sẽ bị xóa (hoạt động không còn giới hạn)
- Nếu không gửi trường `requirements`, các requirements cũ sẽ giữ nguyên

**Request Body - Suggest Activity (Đề xuất hoạt động):**

```json
{
  "title": "Hoạt động tình nguyện",
  "description": "Mô tả hoạt động",
  "location": "P101",
  "start_time": "2024-01-15T08:00:00.000Z",
  "end_time": "2024-01-15T12:00:00.000Z",
  "capacity": 50,
  "registration_open": "2024-01-10T00:00:00.000Z",
  "registration_close": "2024-01-14T23:59:59.000Z",
  "requires_approval": true,
  "org_unit_id": "org_unit_id_here",
  "field_id": "field_id_here",
  "activity_image": "https://example.com/image.jpg",
  "max_points": 15
}
```

**Lưu ý - Suggest Activity:**

- Status sẽ luôn là `chờ duyệt`
- Hoạt động cần được phê duyệt qua endpoint `/api/activities/:id/approve` trước khi có thể tổ chức
- Không yêu cầu permission đặc biệt, chỉ cần authenticated
- Sau khi được phê duyệt, status sẽ tự động chuyển thành `chưa tổ chức`/`đang tổ chức`/`đã tổ chức` dựa trên thời gian
- **`max_points`** (**required**): Điểm tối đa của hoạt động (số >= 0). Bắt buộc phải nhập
- **`total_qr_created`**: Tự động = 0 khi tạo mới

**Request Body - Reject Activity:**

```json
{
  "reason": "Lý do từ chối hoạt động"
}
```

**Lưu ý - Reject Activity:**

- Khi từ chối hoạt động, hệ thống sẽ:
  1. Tạo bản ghi mới trong bảng `activity_rejection`
  2. **Tự động set status của activity = `từ chối` (rejected)**
- Thông tin từ chối bao gồm: `activity_id`, `reason`, `rejected_by`, `rejected_at`
- Mỗi hoạt động chỉ có thể bị từ chối một lần (unique constraint trên activity_id)
- **Status của activity sẽ tự động chuyển thành `từ chối` khi bị từ chối**
- Yêu cầu permission: `activity:REJECT`
- Field `reason` là bắt buộc và không được để trống
- Khi xóa rejection, status sẽ được cập nhật về `chờ duyệt` (pending)

**Error Response - Reject Activity (Activity not found):**

```json
{
  "success": false,
  "message": "Activity not found"
}
```

**Error Response - Reject Activity (Missing reason):**

```json
{
  "success": false,
  "message": "Lý do từ chối là bắt buộc"
}
```

**Error Response - Reject Activity (Already rejected):**

```json
{
  "success": false,
  "message": "Hoạt động đã bị từ chối trước đó"
}
```

**Request Body - Update Activity:**

```json
{
  "title": "Hoạt động tình nguyện (đã cập nhật)",
  "description": "Mô tả hoạt động đã cập nhật",
  "location": "P102",
  "start_time": "2024-01-16T08:00:00.000Z",
  "end_time": "2024-01-16T12:00:00.000Z",
  "capacity": 100,
  "registration_open": "2024-01-10T00:00:00.000Z",
  "registration_close": "2024-01-15T23:59:59.000Z",
  "requires_approval": false,
  "org_unit_id": "org_unit_id_here",
  "field_id": "field_id_here",
  "activity_image": "https://example.com/image_updated.jpg"
}
```

**Request Body - Approve Activity (tùy chọn):**

```json
{
  "requires_approval": false // hoặc true
}
```

**Lưu ý - Approve Activity:**

- Khi phê duyệt hoạt động có status = `chờ duyệt`, hệ thống sẽ tự động set status dựa trên thời gian:
  - Nếu `end_time < now`: status = `đã tổ chức`
  - Nếu `start_time <= now <= end_time`: status = `đang tổ chức`
  - Nếu `start_time > now`: status = `chưa tổ chức`
- Nếu không gửi body, hệ thống mặc định đặt `requires_approval = false` (coi như đã duyệt)
- Nếu gửi `requires_approval = true`, đánh dấu hoạt động cần duyệt lại

**Lưu ý - Complete/Cancel Activity:**

- `PUT /api/activities/:id/complete`: Không cần body, sẽ tự động đánh dấu hoạt động là `đã tổ chức`
- `PUT /api/activities/:id/cancel`: Không cần body, sẽ tự động đánh dấu hoạt động là `hủy hoạt động`

**Lưu ý - Register Activity:**

- `POST /api/activities/:id/register`: Không cần body, sẽ tự động đăng ký user hiện tại tham gia hoạt động

**Query Parameters - Get All Activities (`GET /api/activities`):**

- `org_unit_id` (optional): Lọc hoạt động theo đơn vị tổ chức
- `field_id` (optional): Lọc hoạt động theo ngành học
- `status` (optional): Lọc hoạt động theo trạng thái (có thể dùng tiếng Anh: `pending`, `approved`, `in_progress`, `completed`, `rejected`, `cancelled` hoặc tiếng Việt: `chờ duyệt`, `chưa tổ chức`, `đang tổ chức`, `đã tổ chức`, `từ chối`, `hủy hoạt động`)
- `start_date` (optional): Lọc hoạt động từ ngày bắt đầu (ISO format: `2024-01-15`)
- `end_date` (optional): Lọc hoạt động đến ngày kết thúc (ISO format: `2024-12-31`)

**Query Parameters - Filter All Activities (`GET /api/activities/filter`):**

- `status` (optional): Lọc theo trạng thái (tiếng Việt: `chờ duyệt`, `chưa tổ chức`, `đang tổ chức`, `đã tổ chức`, `từ chối`, `hủy hoạt động`)
- `field_id` (optional): Lọc theo ngành học (field UUID)
- `org_unit_id` (optional): Lọc theo đơn vị tổ chức (org unit UUID)
- `title` (optional): Tìm kiếm theo tên hoạt động (hỗ trợ tìm kiếm từ riêng, không phân biệt hoa/thường)

**Ví dụ:**
- Lấy tất cả hoạt động: `GET /api/activities/filter`
- Lọc theo trạng thái: `GET /api/activities/filter?status=chưa tổ chức`
- Tìm kiếm theo tên: `GET /api/activities/filter?title=tình nguyện`
- Kết hợp lọc: `GET /api/activities/filter?status=chưa tổ chức&field_id=<field_id>&title=tình nguyện`

**Query Parameters - Filter Student Activities (`GET /api/activities/student/:student_id/filter`):**

- `status` (optional): Lọc hoạt động của sinh viên theo trạng thái (tiếng Việt: `đã đăng ký`, `đã duyệt`, `đã tham gia`)
- `field_id` (optional): Lọc theo ngành học (field UUID)
- `org_unit_id` (optional): Lọc theo đơn vị tổ chức (org unit UUID)
- `title` (optional): Tìm kiếm theo tên hoạt động

**Lưu ý - Filter Student Activities:**
- Chỉ lấy hoạt động mà sinh viên đã đăng ký hoặc tham dự
- Hỗ trợ 3 trạng thái: `đã đăng ký`, `đã duyệt`, `đã tham gia`
- Response bao gồm thông tin `registration` (nếu có) và `attendance` (nếu có)
- Yêu cầu authentication và permission `activity_registration:READ` hoặc `attendance:READ`

**Ví dụ:**
- Lấy hoạt động của sinh viên: `GET /api/activities/student/{studentId}/filter`
- Lọc theo trạng thái: `GET /api/activities/student/{studentId}/filter?status=đã tham gia`
- Tìm kiếm theo tên: `GET /api/activities/student/{studentId}/filter?title=tình nguyện`
- Kết hợp lọc: `GET /api/activities/student/{studentId}/filter?status=đã duyệt&field_id=<field_id>`

**Trạng thái hoạt động (Activity Status):**

- `chờ duyệt`: Hoạt động được đề xuất, đang chờ phê duyệt
- `chưa tổ chức`: Hoạt động đã được phê duyệt nhưng chưa đến thời gian bắt đầu
- `đang tổ chức`: Hoạt động đang diễn ra (start_time <= now <= end_time)
- `đã tổ chức`: Hoạt động đã kết thúc (end_time < now)
- `từ chối`: Hoạt động đã bị từ chối (có bản ghi trong bảng activity_rejection)
- `hủy hoạt động`: Hoạt động đã bị hủy

**Lưu ý:**

- Hệ thống sẽ tự động cập nhật trạng thái từ `chưa tổ chức` -> `đang tổ chức` -> `đã tổ chức` dựa trên thời gian khi truy vấn hoạt động.
- **Status `từ chối` và `hủy hoạt động` có priority cao nhất:** Không bị thay đổi bởi thời gian.
- Trong response, field `status` sẽ trả về bằng tiếng Việt.
- Query parameter `status` có thể nhận cả tiếng Việt (ví dụ: `chờ duyệt`, `chưa tổ chức`, `từ chối`, `hủy hoạt động`) hoặc tiếng Anh (ví dụ: `pending`, `approved`, `rejected`, `cancelled`)

**Ví dụ:**

- Lấy tất cả hoạt động: `GET /api/activities`
- Lấy hoạt động của tổ chức: `GET /api/activities?org_unit_id=<org_unit_id>`
- Lấy hoạt động theo trạng thái: `GET /api/activities?status=chưa tổ chức`
- Lấy hoạt động chờ duyệt: `GET /api/activities?status=chờ duyệt` hoặc `GET /api/activities?status=pending`
- Lấy hoạt động chưa tổ chức: `GET /api/activities?status=chưa tổ chức` hoặc `GET /api/activities?status=approved`
- Lấy hoạt động đang tổ chức: `GET /api/activities?status=đang tổ chức` hoặc `GET /api/activities?status=in_progress`
- Lấy hoạt động đã tổ chức: `GET /api/activities?status=đã tổ chức` hoặc `GET /api/activities?status=completed`
- Lấy hoạt động bị từ chối: `GET /api/activities?status=từ chối` hoặc `GET /api/activities?status=rejected`
- Lấy hoạt động bị hủy: `GET /api/activities?status=hủy hoạt động` hoặc `GET /api/activities?status=cancelled`
- Lấy hoạt động của tổ chức và trạng thái: `GET /api/activities?org_unit_id=<org_unit_id>&status=chờ duyệt`
- Lấy hoạt động trong khoảng thời gian: `GET /api/activities?start_date=2024-01-01&end_date=2024-12-31`

**Response - Get All Activities (`GET /api/activities`):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "activity_id",
      "title": "Hoạt động tình nguyện",
      "description": "Mô tả hoạt động",
      "org_unit_id": {
        "_id": "org_unit_id",
        "name": "Phòng CTSV",
        "code": "CTSV"
      },
      "field_id": {
        "_id": "field_id",
        "name": "Công nghệ thông tin",
        "code": "CNTT"
      },
      "location": "P101",
      "start_time": "2024-01-15T08:00:00.000Z",
      "end_time": "2024-01-15T12:00:00.000Z",
      "capacity": 50,
      "status": "chưa tổ chức",
      "requires_approval": false,
      "approved_at": "2024-01-10T10:00:00.000Z",
      "max_points": 15,
      "total_qr_created": 3,
      "requirements": [
        {
          "type": "falcuty",
          "name": "Khoa Công nghệ Thông tin"
        },
        {
          "type": "cohort",
          "year": 2022
        }
      ]
    }
  ]
}
```

**Response - Get My Activities (`/api/activities/my/activities`):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "activity_id",
      "title": "Hoạt động tình nguyện",
      "description": "Mô tả hoạt động",
      "location": "P101",
      "start_time": "2024-01-15T08:00:00.000Z",
      "end_time": "2024-01-15T12:00:00.000Z",
      "capacity": 50,
      "status": "từ chối",
      "rejection": {
        "reason": "Không đủ điều kiện tham gia",
        "rejected_by": {
          "_id": "staff_id",
          "name": "Nguyễn Văn A",
          "email": "staff@example.com"
        },
        "rejected_at": "2024-01-14T10:00:00.000Z"
      },
      "registration": {
        "id": "registration_id",
        "status": "approved",
        "registered_at": "2024-01-10T10:00:00.000Z"
      },
      "attendance": {
        "id": "attendance_id",
        "scanned_at": "2024-01-15T08:05:00.000Z",
        "status": "present",
        "verified": true,
        "points": 5,
        "feedback": "Hoàn thành tốt"
      },
      "requirements": [
        {
          "type": "falcuty",
          "name": "Khoa Công nghệ Thông tin"
        },
        {
          "type": "cohort",
          "year": 2022
        }
      ]
    }
  ],
  "count": 1
}
```

**Response - Get Student Activities (`/api/activities/student/:studentId`):**
Same format as above.

---

## 🎓 Activity Registration

### Registration Routes (`/api/registrations`)

Quản lý đơn đăng ký tham gia hoạt động của sinh viên với hệ thống trạng thái và lịch sử thay đổi.

---

#### Get Activity Details with Student Registration Status (`GET /api/activities/:activityId/student/:studentId`)

Lấy chi tiết hoạt động kèm thông tin đăng ký của sinh viên cụ thể. Yêu cầu authentication và permission `activity_registration:READ`.

**URL Parameters:**

| Parameter   | Type   | Required | Description           |
| ----------- | ------ | -------- | --------------------- |
| `activityId` | String | ✅       | ID của hoạt động      |
| `studentId` | String | ✅       | User ID hoặc Student Profile ID |

**Request:**

```bash
GET /api/activities/activity_id_123/student/user_id_or_student_id_456
```

**Response (Success):**

```json
{
  "success": true,
  "data": {
      "activity": {
        "_id": "activity_id",
        "title": "Hoạt động tình nguyện",
        "description": "Mô tả hoạt động",
        "location": "P101",
        "start_time": "2024-01-15T08:00:00.000Z",
        "end_time": "2024-01-15T12:00:00.000Z",
        "capacity": 50,
        "status": "chưa tổ chức",
        "requires_approval": false,
        "max_points": 15,
        "total_qr_created": 3,
        "org_unit_id": {
          "_id": "org_unit_id",
          "name": "Phòng CTSV"
        },
        "field_id": {
          "_id": "field_id",
          "name": "Công nghệ thông tin"
        },
        "registrationCount": 25,
      "rejection": {
        "reason": "Không đủ điều kiện tham gia",
        "rejected_by": {
          "_id": "staff_id",
          "name": "Nguyễn Văn A",
          "email": "staff@example.com"
        },
        "rejected_at": "2024-01-14T10:00:00.000Z"
      },
      "requirements": [
        {
          "type": "falcuty",
          "name": "Khoa Công nghệ Thông tin"
        },
        {
          "type": "cohort",
          "year": 2022
        }
      ]
    },
    "student": {
      "registration": {
        "_id": "registration_id",
        "status": "approved",
        "created_at": "2024-01-10T10:30:00.000Z",
        "approved_at": "2024-01-10T14:00:00.000Z"
      },
      "registrationStatus": "approved",
      "attendance": {
        "_id": "attendance_id",
        "points": 4,
        "attended_at": "2024-01-15T08:15:00.000Z"
      }
    }
  }
}
```

**Response (Not Registered):**

```json
{
  "success": true,
  "data": {
    "activity": { /* activity details */ },
    "student": {
      "registration": null,
      "registrationStatus": "not_registered",
      "attendance": null
    }
  }
}
```

**Response (Activity Not Found):**

```json
{
  "success": false,
  "message": "Hoạt động không tồn tại"
}
```

**Notes:**

- ✅ **Yêu cầu authentication** - cần JWT token
- ✅ **Yêu cầu permission**: `activity_registration:READ`
- `studentId` có thể là **user ID** hoặc **student profile ID** - hệ thống sẽ tự xác định
- `registration` sẽ `null` nếu sinh viên chưa đăng ký
- `registrationStatus` có thể là: `not_registered`, `pending`, `approved`, `rejected`, `cancelled`
- `attendance` sẽ `null` nếu sinh viên chưa điểm danh
- Activity status tự động cập nhật dựa trên thời gian hiện tại

---

**Status Values:**
- `pending` - Chờ duyệt (hoạt động yêu cầu approval)
- `approved` - Đã duyệt (được phép tham gia)
- `rejected` - Bị từ chối (không được phép tham gia)
- `cancelled` - Đã hủy (sinh viên hoặc admin hủy đơn)

| Method | Endpoint                                  | Description                                    | Auth Required | Permission Required              |
| ------ | ----------------------------------------- | ---------------------------------------------- | ------------- | -------------------------------- |
| GET    | `/api/registrations`                      | Lấy tất cả đơn đăng ký (admin/staff only)     | ✅            | `activity_registration:READ`     |
| GET    | `/api/registrations/:id`                  | Lấy chi tiết đơn đăng ký                      | ✅            | `activity_registration:READ`     |
| GET    | `/api/registrations/activity/:activityId` | Lấy danh sách đơn đăng ký theo hoạt động      | ✅            | `activity_registration:READ`     |
| GET    | `/api/registrations/student/:studentId`   | Lấy danh sách đơn đăng ký theo sinh viên      | ✅            | `activity_registration:READ`     |
| POST   | `/api/registrations`                      | Tạo đơn đăng ký (sinh viên tự đăng ký)       | ✅            | `activity_registration:CREATE`   |
| PUT    | `/api/registrations/:id`                  | Cập nhật thông tin đơn đăng ký                | ✅            | -                                |
| DELETE | `/api/registrations/:id`                  | Hủy đơn đăng ký (soft delete → status=cancelled) | ✅            | `activity_registration:CANCEL`   |
| PUT    | `/api/registrations/:id/approve`          | Duyệt đơn đăng ký (pending → approved)        | ✅            | `activity_registration:APPROVE`  |
| PUT    | `/api/registrations/:id/reject`           | Từ chối đơn đăng ký (pending → rejected)      | ✅            | `activity_registration:REJECT`   |

#### Student-Only Endpoints (Để sinh viên xem status đơn của mình)

| Method | Endpoint                                      | Description                                        | Auth Required | Permission Required |
| ------ | --------------------------------------------- | -------------------------------------------------- | ------------- | ------------------- |
| GET    | `/api/registrations/my-registrations`         | Lấy tất cả đơn đăng ký của sinh viên hiện tại     | ✅            | -                   |
| GET    | `/api/registrations/my-registrations/status-summary` | Tóm tắt số đơn theo từng trạng thái (dashboard) | ✅            | -                   |
| GET    | `/api/registrations/my-registrations/:id/status-detail` | Chi tiết status + timeline 1 đơn | ✅            | -                   |

**Query Parameters - Get My Registrations (`GET /api/registrations/my-registrations`):**

- `status` (optional): Filter theo trạng thái (`pending`, `approved`, `rejected`, `cancelled`)

**Request Body - Create Registration:**

```json
{
  "student_id": "student_profile_id",
  "activity_id": "activity_id"
}
```

**Notes:**
- `student_id` có thể lấy từ StudentProfile
- `activity_id` phải tồn tại
- Nếu `activity.requires_approval = true` → `status = "pending"` (chờ duyệt)
- Nếu `activity.requires_approval = false` → `status = "approved"` (tự động được phép)
- Kiểm tra `registration_open` và `registration_close` của activity
- Không thể đăng ký 2 lần cùng 1 hoạt động (ngoài những đơn đã hủy)
- Kiểm tra capacity của hoạt động

**Request Body - Approve Registration:**

```json
{}
```

**Notes:**
- Chỉ duyệt được đơn có `status = "pending"`
- Kiểm tra capacity trước khi duyệt
- Sẽ cập nhật `approved_by` (ai duyệt) và `approved_at` (khi duyệt)
- Tự động thêm entry vào `status_history`

**Request Body - Reject Registration:**

```json
{
  "approval_note": "Lý do từ chối (bắt buộc)"
}
```

**Notes:**
- Chỉ từ chối được đơn có `status = "pending"`
- `approval_note` bắt buộc phải có (lý do từ chối)
- Sẽ cập nhật `approved_by` (ai từ chối) và `approved_at` (khi từ chối)
- Tự động thêm entry vào `status_history`

**Request Body - Cancel Registration (Delete):**

```json
{
  "cancellation_reason": "Lý do hủy (optional)"
}
```

**Notes:**
- Chỉ hủy được đơn có `status = "pending"` hoặc `"approved"`
- Không thể hủy đơn đã `rejected` hoặc `cancelled`
- Sẽ cập nhật `cancelled_by` (ai hủy) và `cancelled_at` (khi hủy)
- Không xóa record (soft delete), chỉ cập nhật `status = "cancelled"`

**Response - Get My Registrations:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "registration_id",
      "activity_id": {
        "_id": "activity_id",
        "title": "Hội chợ công nghệ",
        "start_time": "2024-02-15T09:00:00Z"
      },
      "student_id": {
        "_id": "student_id",
        "full_name": "Nguyễn Văn A",
        "student_number": "102220095"
      },
      "status": "approved",
      "registered_at": "2024-01-20T10:30:00Z",
      "approved_at": "2024-01-21T14:00:00Z",
      "approved_by": {
        "_id": "staff_id",
        "username": "staff_ctsv"
      },
      "approval_note": null,
      "cancelled_at": null,
      "cancelled_by": null,
      "cancellation_reason": null,
      "status_history": [
        {
          "status": "pending",
          "changed_at": "2024-01-20T10:30:00Z",
          "changed_by": null,
          "reason": "Initial registration"
        },
        {
          "status": "approved",
          "changed_at": "2024-01-21T14:00:00Z",
          "changed_by": {
            "_id": "staff_id",
            "username": "staff_ctsv"
          },
          "reason": "Approved by staff/admin"
        }
      ]
    }
  ]
}
```

**Response - Get Status Summary (`/my-registrations/status-summary`):**

```json
{
  "success": true,
  "data": {
    "summary": {
      "pending": 2,
      "approved": 5,
      "rejected": 1,
      "cancelled": 0
    },
    "labels": {
      "pending": "Chờ duyệt",
      "approved": "Đã duyệt",
      "rejected": "Bị từ chối",
      "cancelled": "Đã hủy"
    },
    "total": 8
  }
}
```

**Response - Get Status Detail (`/my-registrations/:id/status-detail`):**

```json
{
  "success": true,
  "data": {
    "registration_id": "registration_id",
    "activity": {
      "id": "activity_id",
      "title": "Hội chợ công nghệ",
      "description": "Mô tả hoạt động",
      "start_time": "2024-02-15T09:00:00Z",
      "end_time": "2024-02-15T17:00:00Z",
      "requires_approval": true
    },
    "status": {
      "current": "pending",
      "text": "Chờ duyệt",
      "color": "warning",
      "icon": "clock",
      "message": "Hoạt động yêu cầu duyệt. Vui lòng chờ quản lý duyệt đơn của bạn."
    },
    "timeline": {
      "registered_at": "2024-01-20T10:30:00Z",
      "approved_at": null,
      "rejected_at": null,
      "cancelled_at": null,
      "approved_by": null,
      "cancelled_by": null
    },
    "history": [
      {
        "status": "pending",
        "changed_at": "2024-01-20T10:30:00Z",
        "changed_by": "System",
        "reason": "Initial registration - waiting for approval"
      }
    ]
  }
}
```

**Status Messages:**

| Status    | Text              | Color     | Message                                                        |
| --------- | ----------------- | --------- | -------------------------------------------------------------- |
| pending   | Chờ duyệt        | warning   | Hoạt động yêu cầu duyệt. Vui lòng chờ quản lý duyệt đơn...  |
| approved  | Đã duyệt         | success   | Bạn đã được duyệt. Vui lòng tham gia hoạt động đúng giờ...   |
| rejected  | Bị từ chối       | danger    | Đơn của bạn bị từ chối: {approval_note}                       |
| cancelled | Đã hủy          | secondary | Bạn đã hủy đơn: {cancellation_reason}                         |

---

**Response - Get Activity by ID (`GET /api/activities/:id`):**

```json
{
  "success": true,
  "data": {
    "_id": "activity_id",
    "title": "Hoạt động tình nguyện",
    "description": "Mô tả hoạt động",
    "status": "từ chối",
    "registrationCount": 10,
    "max_points": 15,
    "total_qr_created": 3,
    "rejection": {
      "_id": "rejection_id",
      "activity_id": "activity_id",
      "reason": "Lý do từ chối",
      "rejected_by": {
        "_id": "user_id",
        "username": "admin"
      },
      "rejected_at": "2024-01-10T10:00:00.000Z"
    },
    "requirements": [
      {
        "type": "falcuty",
        "name": "Khoa Công nghệ Thông tin"
      },
      {
        "type": "cohort",
        "year": 2022
      }
    ]
  }
}
```

**Lưu ý:**

- Field `rejection` sẽ là `null` nếu hoạt động chưa bị từ chối.
- **Khi activity bị từ chối, `status` sẽ tự động là `từ chối` (rejected).**

**Response - Suggest Activity (`POST /api/activities/suggest`):**

```json
{
  "success": true,
  "message": "Activity suggested successfully. Waiting for approval.",
  "data": {
    "_id": "activity_id",
    "title": "Hoạt động tình nguyện",
    "description": "Mô tả hoạt động",
    "location": "P101",
    "start_time": "2024-01-15T08:00:00.000Z",
    "end_time": "2024-01-15T12:00:00.000Z",
    "capacity": 50,
    "status": "chờ duyệt",
    "requires_approval": true,
    "max_points": 15,
    "total_qr_created": 0,
    "org_unit_id": {
      "_id": "org_unit_id",
      "name": "Phòng CTSV",
      "code": "CTSV"
    },
    "field_id": {
      "_id": "field_id",
      "name": "Công nghệ thông tin",
      "code": "CNTT"
    }
  }
}
```

**Response - Create Activity (`POST /api/activities`):**

```json
{
  "success": true,
  "data": {
    "_id": "activity_id",
    "title": "Hoạt động tình nguyện",
    "description": "Mô tả hoạt động",
    "location": "P101",
    "start_time": "2024-01-15T08:00:00.000Z",
    "end_time": "2024-01-15T12:00:00.000Z",
    "capacity": 50,
    "status": "chưa tổ chức",
    "requires_approval": false,
    "approved_at": "2024-01-10T10:00:00.000Z",
    "max_points": 15,
    "total_qr_created": 0,
    "org_unit_id": {
      "_id": "org_unit_id",
      "name": "Phòng CTSV",
      "code": "CTSV"
    },
    "requirements": [
      { "type": "falcuty", "id": "faculty_id_here", "name": "Khoa Công nghệ Thông tin" },
      { "type": "cohort", "id": "cohort_id_here", "year": 2022 }
    ]
  }
}
```

**Lưu ý:**
- Trường `requirements` trong response sẽ trả về danh sách yêu cầu đã lưu cho hoạt động (nếu có).
- Nếu không có yêu cầu, trường này sẽ là mảng rỗng hoặc không xuất hiện.

**Response - Reject Activity (`PUT /api/activities/:id/reject`):**

```json
{
  "success": true,
  "message": "Hoạt động đã được từ chối",
  "data": {
    "_id": "rejection_id",
    "activity_id": {
      "_id": "activity_id",
      "title": "Hoạt động tình nguyện",
      "description": "Mô tả hoạt động",
      "status": "từ chối"
    },
    "reason": "Lý do từ chối hoạt động",
    "rejected_by": {
      "_id": "user_id",
      "username": "admin"
    },
    "rejected_at": "2024-01-10T10:00:00.000Z"
  }
}
```

**Lưu ý:** Sau khi reject, activity status sẽ tự động là `từ chối` (rejected).

**Response - Get All Rejections (`GET /api/activities/rejections`):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "rejection_id",
      "activity_id": {
        "_id": "activity_id",
        "title": "Hoạt động tình nguyện",
        "status": "từ chối"
      },
      "reason": "Lý do từ chối",
      "rejected_by": {
        "_id": "user_id",
        "username": "admin"
      },
      "rejected_at": "2024-01-10T10:00:00.000Z"
    }
  ]
}
```

**Lưu ý:** Tất cả activities trong response sẽ có `status: "từ chối"` (rejected).

**Response - Get Rejection by Activity ID (`GET /api/activities/:id/rejection`):**

```json
{
  "success": true,
  "data": {
    "_id": "rejection_id",
    "activity_id": {
      "_id": "activity_id",
      "title": "Hoạt động tình nguyện",
      "status": "từ chối"
    },
    "reason": "Lý do từ chối",
    "rejected_by": {
      "_id": "user_id",
      "username": "admin"
    },
    "rejected_at": "2024-01-10T10:00:00.000Z"
  }
}
```

**Lưu ý:** Activity trong response sẽ có `status: "từ chối"` (rejected).

**Response - Delete Rejection (`DELETE /api/activities/:id/rejection`):**

```json
{
  "success": true,
  "message": "Đã xóa thông tin từ chối hoạt động"
}
```

**Lưu ý - Delete Rejection:**

- Xóa bản ghi từ chối khỏi bảng `activity_rejection`
- Sau khi xóa, hoạt động có thể được từ chối lại (nếu cần)
- Yêu cầu permission: `activity:DELETE`

**Error Response - Get Rejection by Activity ID (Not found):**

```json
{
  "success": false,
  "message": "Không tìm thấy thông tin từ chối cho hoạt động này"
}
```

**Error Response - Delete Rejection (Not found):**

```json
{
  "success": false,
  "message": "Không tìm thấy thông tin từ chối"
}
```

---

### Registration Routes (`/api/registrations`)

| Method | Endpoint                                  | Description                   | Auth Required | Permission Required             |
| ------ | ----------------------------------------- | ----------------------------- | ------------- | ------------------------------- |
| GET    | `/api/registrations/my-registrations`     | Lấy danh sách đăng ký của tôi | ✅            | - (Own data)                    |
| GET    | `/api/registrations`                      | Lấy tất cả đăng ký            | ✅            | `activity_registration:READ`    |
| GET    | `/api/registrations/activity/:activityId` | Lấy đăng ký theo hoạt động    | ✅            | `activity_registration:READ`    |
| GET    | `/api/registrations/student/:studentId`   | Lấy đăng ký theo sinh viên    | ✅            | `activity_registration:READ`    |
| GET    | `/api/registrations/:id`                  | Lấy chi tiết đăng ký theo ID  | ✅            | `activity_registration:READ`    |
| POST   | `/api/registrations`                      | Tạo đăng ký mới               | ✅            | `activity_registration:CREATE`  |
| PUT    | `/api/registrations/:id`                  | Cập nhật đăng ký              | ✅            | - (Own data)                    |
| DELETE | `/api/registrations/:id`                  | Hủy đăng ký                   | ✅            | - (Own registration)            |
| PUT    | `/api/registrations/:id/approve`          | Phê duyệt đăng ký             | ✅            | `activity_registration:APPROVE` |
| PUT    | `/api/registrations/:id/reject`           | Từ chối đăng ký               | ✅            | `activity_registration:REJECT`  |
| GET    | `/api/registrations/my-registrations/status-summary` | Xem tóm tắt status đăng ký | ✅ | - (Own data) |
| GET    | `/api/registrations/my-registrations/:id/status-detail` | Xem chi tiết status đơn | ✅ | - (Own data) |
| GET    | `/api/registrations/student/:studentId/status-detail/:registrationId` | Xem chi tiết status (công khai) | ❌ | - |

**Request Body - Create Registration:**

```json
{
  "activityId": "activity_uuid_here",
  "studentId": "student_uuid_here",
  "note": "Ghi chú đăng ký"
}
```

**Request Body - Update Registration:**

```json
{
  "note": "Ghi chú đăng ký đã cập nhật"
}
```

**Request Body - Reject Registration:**

```json
{
  "approval_note": "Lý do từ chối đăng ký"
}
```

**Response - Delete Registration (Cancel):**

```json
{
  "success": true,
  "message": "Registration cancelled successfully"
}
```

**Lưu ý - Hủy Đơn Đăng Ký (DELETE):**

- Endpoint: `DELETE /api/registrations/:id`
- **Không cần body**
- **Xóa record khỏi database** (hard delete) - không lưu status "cancelled"
- Sinh viên chỉ có thể hủy nếu status là `pending` hoặc `approved`
- **Không thể hủy** nếu status là `rejected` hoặc `attended`
- **Frontend**: Nếu registration không tìm thấy → là dấu hiệu đã hủy
- Status codes:
  - `200`: Hủy thành công
  - `404`: Registration không tồn tại
  - `400`: Không thể hủy (status rejected/attended)
  - `500`: Lỗi server

**Lưu ý - Approve Registration:**

- `PUT /api/registrations/:id/approve`: Không cần body, sẽ tự động phê duyệt đăng ký

**Lưu ý - Reject Registration:**

- Request body bắt buộc có `approval_note`
- Sinh viên không thể từ chối, chỉ staff/admin được phép

---


### Attendance Routes (`/api/attendances`)

#### Phản hồi điểm phục vụ cộng đồng (feedback điểm PVCD)

**Các trường liên quan trong attendance:**

- `feedback`: Nội dung phản hồi của sinh viên về điểm số
- `feedback_time`: Thời gian sinh viên gửi phản hồi
- `feedback_status`: Trạng thái phản hồi (`pending`, `accepted`, `rejected`, hoặc `null` nếu chưa phản hồi)
- `feedback_verified_at`: Thời gian staff xác nhận phản hồi

**Các API phản hồi điểm PVCD:**

| Method | Endpoint                                                        | Description                                         | Auth Required | Roles/Permission         |
| ------ | --------------------------------------------------------------- | --------------------------------------------------- | ------------- | ------------------------ |
| GET    | `/api/attendances/student/:studentId/activity/:activityId`      | Lấy phản hồi của sinh viên cho một hoạt động        | ✅            | student (own attendance) |
| POST   | `/api/attendances/:attendanceId/submit-feedback`                | Sinh viên gửi phản hồi về điểm                       | ✅            | student (own attendance) |
| PUT    | `/api/attendances/:attendanceId/approve-feedback`               | Staff duyệt phản hồi và cập nhật điểm                | ✅            | staff, admin             |
| GET    | `/api/attendances/faculty/:facultyId/pending-feedbacks`         | Lấy danh sách phản hồi chờ duyệt theo khoa           | ✅            | staff, admin             |

**Ví dụ request body cho các API phản hồi điểm:**

**POST /api/attendances/:attendanceId/submit-feedback**
```json
{
  "feedback": "Em xin khiếu nại điểm, em đã hoàn thành đủ yêu cầu"
}
```

**PUT /api/attendances/:attendanceId/approve-feedback**
_Chấp nhận:_
```json
{
  "status": "accepted",
  "newPoints": 10,
  "content": "Phản hồi được chấp nhận"
}
```
_Từ chối:_
```json
{
  "status": "rejected",
  "rejectionReason": "Không đủ minh chứng"
}
```

**GET /api/attendances/faculty/:facultyId/pending-feedbacks**

**Quy trình:**
1. Sinh viên gửi phản hồi về điểm (trường `feedback`, `feedback_time`, `feedback_status: "pending"`).
2. Staff xem phản hồi, nếu đồng ý thì cập nhật trường `points` và chuyển `feedback_status: "accepted"`, nếu không thì chuyển `feedback_status: "rejected"`.
3. Khi duyệt, staff có thể gửi thông báo cho sinh viên.

**Ví dụ dữ liệu attendance có phản hồi:**
```json
{
  "student_id": "68f905f7585ae2c65d0e5503",
  "activity_id": "68f905f7585ae2c65d0e5518",
  "points": 8,
  "feedback": "Em xin khiếu nại điểm, em đã hoàn thành tất cả các yêu cầu",
  "feedback_time": "2025-11-17T15:44:10.000Z",
  "feedback_status": "pending",
  "feedback_verified_at": null
}
```

**Ví dụ attendance không có phản hồi:**
```json
{
  "student_id": "68f905f7585ae2c65d0e5501",
  "activity_id": "68f905f7585ae2c65d0e5518",
  "points": 9
  // Không có trường feedback, feedback_status, feedback_time, feedback_verified_at
}
```

| Method | Endpoint                                         | Description                                        | Auth Required | Roles                     |
| ------ | ------------------------------------------------ | -------------------------------------------------- | ------------- | ------------------------- |
| GET    | `/api/attendances`                               | Lấy tất cả bản ghi điểm danh                       | ✅            | admin, ctsv, staff        |
| GET    | `/api/attendances/:id`                           | Lấy chi tiết điểm danh theo ID                     | ✅            | -                         |
| GET    | `/api/attendances/activity/:activityId`                   | Lấy điểm danh theo hoạt động                                   | ✅            | -                         |
| GET    | `/api/attendances/activity/:activityId/students-stats`    | Lấy danh sách SV tham gia với thống kê (số lần, điểm, v.v)   | ✅            | -                         |
| GET    | `/api/attendances/student/:studentId`                     | Lấy điểm danh theo sinh viên                                   | ✅            | -                         |
| GET    | `/api/attendances/student/:studentId/activities`          | Lấy tất cả hoạt động đã tham gia (theo attendance)            | ✅            | -                         |
| POST   | `/api/attendances`                               | Tạo bản ghi điểm danh mới                          | ✅            | admin, ctsv, staff, union |
| PUT    | `/api/attendances/:id`                           | Cập nhật điểm danh                                 | ✅            | admin, ctsv, staff, union |
| DELETE | `/api/attendances/:id`                           | Xóa điểm danh                                      | ✅            | admin, ctsv, staff, union |
| PUT    | `/api/attendances/:id/verify`                    | Xác minh điểm danh                                 | ✅            | admin, ctsv, staff, union |
| PUT    | `/api/attendances/:id/feedback`                  | Thêm phản hồi cho điểm danh                        | ✅            | -                         |
| POST   | `/api/attendances/submit-attendance`              | 🆕 Nộp điểm danh qua QR (PUBLIC, không cần auth)   | ❌            | -                         |

**Lưu ý về Attendance Status:**
- **Status enum**: Chỉ có `'present'` (có mặt) và `'absent'` (vắng mặt)
- **Status `'partial'` đã bị xóa**: Hệ thống sessions cũ đã bị loại bỏ, không còn status `'partial'`
- **Mặc định**: Khi tạo attendance mới, status mặc định là `'absent'` (phù hợp với thực tế - nếu không có thông tin thì coi như vắng mặt)
- ⚠️ **Hệ thống sessions cũ đã bị xóa**: Endpoint `/api/attendances/scan-qr` và các field liên quan (`attendance_sessions`, `total_sessions_required`, `total_sessions_attended`, `attendance_rate`) đã bị loại bỏ hoàn toàn

**Request Body - Create Attendance:**

```json
{
  "activity_id": "activity_uuid_here",
  "student_id": "student_uuid_here",
  "scanned_at": "2024-01-15T08:05:00.000Z",
  "status": "present",
  "points": 5
}
```

**Request Body - Update Attendance:**

```json
{
  "status": "present",
  "points": 10,
  "scanned_at": "2024-01-15T08:05:00.000Z"
}
```

**Request Body - Verify Attendance:**

```json
{
  "verified": true
}
```

**Request Body - Feedback Attendance:**

```json
{
  "feedback": "Sinh viên tham gia tốt",
  "points": 5
}
```

**GET /api/attendances/activity/:activityId/students-stats** - Response Example:

Lấy danh sách sinh viên duy nhất tham gia hoạt động với thống kê (số lần điểm danh, tổng điểm dựa trên dynamic QR scoring).

**Công thức tính điểm (🆕 Dynamic QR Scoring):**
- `total_points = MAX(points_earned)` từ tất cả các lần quét QR của sinh viên
- `attendance_rate = total_qr_scanned / total_qr_available` (tỷ lệ quét QR)
- `points_earned` được tính theo công thức: `floor((scan_order / total_qr_at_scan) * max_points)`

**Ví dụ:**
- Hoạt động có `max_points = 10`, `total_qr_created = 2`:
  - SV quét QR lần 1: `scan_order = 1`, `points_earned = floor((1/2) * 10) = 5` điểm
  - SV quét QR lần 2: `scan_order = 2`, `points_earned = floor((2/2) * 10) = 10` điểm
  - **Điểm cuối cùng = MAX(5, 10) = 10 điểm** (không phải tổng)

```json
{
  "success": true,
  "data": [
    {
      "student_id": "691d63565bcc1aa642a2f078",
      "student": {
        "_id": "691d63565bcc1aa642a2f078",
        "student_number": "102220115",
        "full_name": "Nguyễn Thị Trà My",
        "email": "102220115@sv1.dut.udn.vn",
        "user_id": {
          "_id": "691d6cdac4ea11f403e6479b",
          "username": "102220115"
        }
      },
      "attendance_count": 2,
      "total_points": 10,
      "attendance_rate": 1.0,
      "total_qr_scanned": 2,
      "total_qr_available": 2,
      "last_attended": "2024-12-15T10:30:00.000Z",
      "status": "present"
    },
    {
      "student_id": "691d63565bcc1aa642a2f079",
      "student": {
        "_id": "691d63565bcc1aa642a2f079",
        "student_number": "102220116",
        "full_name": "Trần Văn B",
        "email": "102220116@sv1.dut.udn.vn",
        "user_id": {
          "_id": "691d6cdac4ea11f403e6479c",
          "username": "102220116"
        }
      },
      "attendance_count": 1,
      "total_points": 5,
      "attendance_rate": 0.5,
      "total_qr_scanned": 1,
      "total_qr_available": 2,
      "last_attended": "2024-12-14T09:00:00.000Z",
      "status": "present"
    }
  ],
  "count": 2
}
```

**Request Body - Submit Attendance (🆕 Dynamic QR System):**

```json
{
  "activity_id": "activity_uuid_here",
  "session_id": "qr_code_id_here",
  "student_info": {
    "student_id_number": "102220095",
    "student_name": "Nguyễn Văn A",
    "class": "class_id_here",
    "faculty": "faculty_id_here"
  }
}
```

**Lưu ý:**
- **PUBLIC endpoint** - Không cần authentication token
- `session_id` = `qr_code_id` (ID của QR code được quét)
- `student_id_number` phải là **9 chữ số** (MSSV)
- Sinh viên phải **tồn tại trong hệ thống** và **đã được duyệt đăng ký** hoạt động
- Điểm được tính tự động theo công thức: `floor((scan_order / total_qr_at_scan) * max_points)`
- Mỗi lần quét QR tạo một attendance record riêng
- Điểm cuối cùng = **MAX(points_earned)** từ tất cả các lần quét

**Response - Submit Attendance (Success):**

```json
{
  "success": true,
  "message": "Điểm danh thành công",
  "data": {
    "_id": "attendance_id",
    "student_id": "student_profile_id",
    "activity_id": "activity_id",
    "qr_code_id": "qr_code_id",
    "scan_order": 2,
    "total_qr_at_scan": 2,
    "points_earned": 10,
    "points": 10,
    "status": "present",
    "scanned_at": "2024-12-15T10:30:00.000Z"
  }
}
```

**Lưu ý về Attendance Status:**
- **Status enum**: Chỉ có `'present'` (có mặt) và `'absent'` (vắng mặt)
- **Status `'partial'` đã bị xóa**: Hệ thống sessions cũ đã bị loại bỏ, không còn status `'partial'`
- **Mặc định**: Khi tạo attendance mới, status mặc định là `'absent'` (phù hợp với thực tế - nếu không có thông tin thì coi như vắng mặt)

**Response - Submit Attendance (Student Not Found):**

```json
{
  "success": false,
  "message": "Sinh viên với MSSV 102220095 không tồn tại trong hệ thống"
}
```

**Response - Submit Attendance (Not Registered):**

```json
{
  "success": false,
  "message": "Bạn chưa được duyệt để tham gia hoạt động này. Vui lòng đăng ký trước."
}
```

**Lưu ý về hệ thống cũ:**
- ⚠️ **Hệ thống sessions cũ đã bị xóa hoàn toàn**: Endpoint `/api/attendances/scan-qr` và các field liên quan đến sessions (`attendance_sessions`, `total_sessions_required`, `total_sessions_attended`, `attendance_rate`) đã bị loại bỏ
- ✅ **Hệ thống QR mới**: Sử dụng `/api/attendances/submit-attendance` với dynamic scoring dựa trên `scan_order` và `total_qr_at_scan`

---

### Post Routes (`/api/posts`)

| Method | Endpoint                          | Description                   | Auth Required | Roles                     |
| ------ | --------------------------------- | ----------------------------- | ------------- | ------------------------- |
| GET    | `/api/posts`                      | Lấy tất cả bài đăng           | ✅            | -                         |
| GET    | `/api/posts/:id`                  | Lấy chi tiết bài đăng theo ID | ✅            | -                         |
| GET    | `/api/posts/activity/:activityId` | Lấy bài đăng theo hoạt động   | ✅            | -                         |
| POST   | `/api/posts`                      | Tạo bài đăng mới              | ✅            | admin, ctsv, staff, union |
| PUT    | `/api/posts/:id`                  | Cập nhật bài đăng             | ✅            | admin, ctsv, staff, union |
| DELETE | `/api/posts/:id`                  | Xóa bài đăng                  | ✅            | admin, ctsv, staff, union |

**Request Body - Create Post:**

```json
{
  "activityId": "activity_uuid_here",
  "title": "Tiêu đề bài đăng",
  "content": "Nội dung bài đăng chi tiết",
  "images": ["image1.jpg", "image2.jpg"]
}
```

**Request Body - Update Post:**

```json
{
  "title": "Tiêu đề bài đăng (đã cập nhật)",
  "content": "Nội dung bài đăng đã cập nhật",
  "images": ["image1.jpg", "image2.jpg", "image3.jpg"]
}
```

---

## ⭐ Points & Feedback

### Feedback Routes (`/api/feedback`)

| Method | Endpoint                                                       | Description                                         | Auth Required | Permission Required       |
| ------ | -------------------------------------------------------------- | --------------------------------------------------- | ------------- | ------------------------- |
| GET    | `/api/feedback/my-feedbacks`                                   | Lấy danh sách phản hồi của tôi                      | ✅            | - (Own data)              |
| GET    | `/api/feedback`                                                | Lấy tất cả phản hồi                                 | ✅            | `student_feedback:READ`   |
| GET    | `/api/feedback/activity/:activityId`                           | Lấy phản hồi theo hoạt động                         | ❌            | -                         |
| GET    | `/api/feedback/:id`                                            | Lấy chi tiết phản hồi theo ID                       | ✅            | `student_feedback:READ`   |
| GET    | `/api/feedback/student/:studentId/activity/:activityId`        | Lấy feedback theo sinh viên và hoạt động ⭐ NEW   | ✅            | `student_feedback:READ`   |
| POST   | `/api/feedback`                                                | Tạo phản hồi mới                                    | ✅            | - (Students)              |
| PUT    | `/api/feedback/:id`                                            | Cập nhật phản hồi                                   | ✅            | - (Own feedback)          |
| DELETE | `/api/feedback/:id`                                            | Xóa phản hồi                                        | ✅            | `student_feedback:DELETE` |

**Request Body - Create Feedback:**

```json
{
  "activityId": "activity_uuid_here",
  "rating": 5,
  "comment": "Hoạt động rất hay và bổ ích",
  "suggestions": "Nên tổ chức thêm hoạt động tương tự"
}
```

**Request Body - Update Feedback:**

```json
{
  "rating": 4,
  "comment": "Hoạt động hay nhưng cần cải thiện thêm",
  "suggestions": "Nên tổ chức thêm hoạt động tương tự và cải thiện thời gian"
}
```

**Response - Get Feedback by Student and Activity (Success):**

```json
{
  "success": true,
  "data": {
    "_id": "feedback_id",
    "activity_id": {
      "_id": "activity_id",
      "title": "Hoạt động tình nguyện",
      "start_time": "2024-01-20T08:00:00.000Z",
      "end_time": "2024-01-20T10:00:00.000Z"
    },
    "student_id": {
      "_id": "student_id",
      "full_name": "Nguyễn Văn A",
      "student_number": "102220095",
      "user_id": {
        "_id": "user_id",
        "username": "student1"
      }
    },
    "rating": 5,
    "comment": "Hoạt động rất hay và bổ ích",
    "submitted_at": "2024-01-20T11:00:00.000Z"
  }
}
```

**Response - Feedback Not Found:**

```json
{
  "success": false,
  "message": "Feedback not found for this student and activity"
}
```

**Response - Missing Parameters:**

```json
{
  "success": false,
  "message": "studentId and activityId are required"
}
```

---

### PVCD Records Routes (`/api/pvcd-records`)

| Method | Endpoint                             | Description                          | Auth Required | Roles              |
| ------ | ------------------------------------ | ------------------------------------ | ------------- | ------------------ |
| GET    | `/api/pvcd-records`                  | Lấy tất cả bản ghi PVCD              | ✅            | admin, ctsv, staff |
| GET    | `/api/pvcd-records/:id`              | Lấy chi tiết PVCD record theo ID     | ✅            | admin, ctsv, staff |
| GET    | `/api/pvcd-records/student/:studentId` | Lấy bản ghi PVCD của sinh viên      | ✅            | -                  |
| GET    | `/api/pvcd-records/year/:year`       | Lấy bản ghi PVCD theo năm            | ✅            | admin, ctsv, staff |
| POST   | `/api/pvcd-records`                  | Tạo bản ghi PVCD mới                 | ✅            | admin, ctsv, staff |
| PUT    | `/api/pvcd-records/:id`              | Cập nhật bản ghi PVCD                | ✅            | admin, ctsv, staff |
| DELETE | `/api/pvcd-records/:id`              | Xóa bản ghi PVCD                     | ✅            | admin              |

**Lưu ý - Tính toán total_point tự động:**
- `total_point` được tính **tự động** khi tạo hoặc cập nhật PVCD record
- Hệ thống sẽ query tất cả `attendance` records của sinh viên
- Lọc những attendance có `activity.start_time` cùng năm với `year` trong PVCD record
- Cộng tất cả `points` từ các attendance đó
- Nếu tổng vượt quá 100, sẽ được giới hạn ở 100
- **Không cần gửi `total_point` trong request body**

**Request Body - Create PVCD Record:**

```json
{
  "student_id": "student_profile_id_here",
  "year": 2024,
  "start_year": "2024-01-01T00:00:00.000Z",
  "end_year": "2024-12-31T23:59:59.000Z"
}
```

**Các trường trong Request:**

- `student_id` (required): ID của StudentProfile
- `year` (required): Năm học (số nguyên, ví dụ: 2024)
- `start_year` (optional): Ngày bắt đầu năm học
- `end_year` (optional): Ngày kết thúc năm học
- **`total_point`**: Không gửi - được tính tự động

**Request Body - Update PVCD Record:**

```json
{
  "year": 2024,
  "start_year": "2024-01-01T00:00:00.000Z",
  "end_year": "2024-12-31T23:59:59.000Z"
}
```

**Response - Create/Update PVCD Record:**

```json
{
  "_id": "pvcd_record_id",
  "student_id": {
    "_id": "student_profile_id",
    "user_id": {
      "_id": "user_id",
      "username": "102220095"
    },
    "full_name": "Nguyễn Văn A"
  },
  "year": 2024,
  "start_year": "2024-01-01T00:00:00.000Z",
  "end_year": "2024-12-31T23:59:59.000Z",
  "total_point": 45.5,
  "createdAt": "2025-11-18T10:30:00.000Z"
}
```

**Ví dụ: Cách tính total_point**

- Sinh viên A tham gia 3 hoạt động năm 2024:
  - Hoạt động 1 (2024-01-15): 10 điểm
  - Hoạt động 2 (2024-06-20): 15 điểm
  - Hoạt động 3 (2024-09-10): 20 điểm
- `total_point` sẽ tự động được tính = 10 + 15 + 20 = 45 điểm

---

### Evidence Routes (`/api/evidences`)

| Method | Endpoint                            | Description                     | Auth Required | Permission Required    |
| ------ | ----------------------------------- | ------------------------------- | ------------- | ---------------------- |
| GET    | `/api/evidences`                    | Lấy tất cả minh chứng           | ✅            | `evidence:READ`        |
| GET    | `/api/evidences/faculty/:facultyId` | Lấy tất cả minh chứng theo khoa | ✅            | `evidence:READ`        |
| GET    | `/api/evidences/class/:classId`     | Lấy tất cả minh chứng trong lớp | ✅            | `evidence:READ`        |
| GET    | `/api/evidences/student/:studentId` | Lấy minh chứng theo sinh viên   | ✅            | -                      |
| GET    | `/api/evidences/:id`                | Lấy chi tiết minh chứng theo ID | ✅            | -                            |
| POST   | `/api/evidences`                    | Tạo minh chứng mới              | ✅            | student                      |
| PUT    | `/api/evidences/:id`                | Cập nhật minh chứng             | ✅            | -                            |
| PUT    | `/api/evidences/:id/approve`        | Phê duyệt minh chứng            | ✅            | ctsv, khoa, loptruong        |
| PUT    | `/api/evidences/:id/reject`         | Từ chối minh chứng              | ✅            | ctsv, khoa, loptruong        |
| DELETE | `/api/evidences/:id`                | Xóa minh chứng                  | ✅            | admin, ctsv                  |

**Request Body - Create Evidence:**

```json
{
  "student_id": "student_uuid_here",
  "title": "Minh chứng tham gia hoạt động",
  "file_url": "https://example.com/files/certificate.pdf",
  "self_point": 5
}
```

**Các trường trong Request:**

- `student_id` (required): ID của sinh viên
- `title` (required): Tiêu đề minh chứng
- `file_url` (optional): URL của file minh chứng
- `self_point` (optional): Điểm tự đánh giá (mặc định: 0)

**Lưu ý:**

- `_id` sẽ được tự động sinh bởi MongoDB, không cần truyền từ client
- Đây là minh chứng cho hoạt động ngoài trường, không liên kết với activity trong hệ thống

**Request Body - Update Evidence:**

```json
{
  "title": "Minh chứng tham gia hoạt động (đã cập nhật)",
  "file_url": "https://example.com/files/certificate_updated.pdf",
  "self_point": 7,
  "class_point": 8,
  "faculty_point": 9
}
```

**Các trường trong Request:**

- `title` (optional): Tiêu đề minh chứng
- `file_url` (optional): URL của file minh chứng
- `self_point` (optional): Điểm tự đánh giá
- `class_point` (optional): Điểm của lớp trưởng
- `faculty_point` (optional): Điểm của khoa

**Lưu ý:**

- `_id` sẽ không được cập nhật từ request body
- `student_id` không thể thay đổi sau khi tạo
- `status` nên được cập nhật qua endpoint `/api/evidences/:id/approve` hoặc `/api/evidences/:id/reject`
- `submitted_at` và `verified_at` được quản lý tự động bởi hệ thống
- Tất cả các trường đều optional, chỉ cập nhật các trường được gửi trong request

**Request Body - Approve Evidence:**

```json
{
  "faculty_point": 9
}
```

**Lưu ý - Approve Evidence:**

- `PUT /api/evidences/:id/approve`: Có thể gửi body với `class_point` và `faculty_point` hoặc không cần body
- Nếu không gửi body, hệ thống sẽ phê duyệt minh chứng với điểm mặc định

**Request Body - Reject Evidence:**

```json
{
  "reason": "Lý do từ chối minh chứng"
}
```

**Response - Get Evidences by Faculty (`/api/evidences/faculty/:facultyId`):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "evidence_id_1",
      "student_id": {
        "_id": "student_profile_id",
        "full_name": "Nguyễn Văn A",
        "class_id": {
          "_id": "class_id",
          "name": "CNTT21.1",
          "falcuty_id": {
            "_id": "faculty_id",
            "name": "Khoa Công nghệ Thông tin"
          }
        }
      },
      "title": "Minh chứng tham gia hoạt động",
      "file_url": "https://example.com/files/certificate.pdf",
      "self_point": 5,
      "class_point": 8,
      "faculty_point": 9,
      "status": "approved",
      "submitted_at": "2024-01-10T10:30:00.000Z",
      "verified_at": "2024-01-10T14:00:00.000Z"
    },
    {
      "_id": "evidence_id_2",
      "student_id": {
        "_id": "student_profile_id_2",
        "full_name": "Trần Thị B",
        "class_id": {
          "_id": "class_id_2",
          "name": "CNTT21.2",
          "falcuty_id": {
            "_id": "faculty_id",
            "name": "Khoa Công nghệ Thông tin"
          }
        }
      },
      "title": "Minh chứng hoạt động khác",
      "file_url": "https://example.com/files/certificate2.pdf",
      "self_point": 4,
      "class_point": 7,
      "faculty_point": 8,
      "status": "pending",
      "submitted_at": "2024-01-15T09:00:00.000Z",
      "verified_at": null
    }
  ]
}
```

**Lưu ý - Get Evidences by Faculty:**

- Trả về tất cả minh chứng của các sinh viên trong khoa (gồm tất cả lớp của khoa)
- Minh chứng sắp xếp theo `submitted_at` giảm dần (mới nhất trước)
- Yêu cầu permission `evidence:READ`

**Response - Get Evidences by Student (`/api/evidences/student/:studentId`):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "evidence_id",
      "student_id": { "_id": "student_id", "name": "Nguyễn Văn A" },
      "title": "Minh chứng tham gia hoạt động",
      "file_url": "https://example.com/files/certificate.pdf",
      "self_point": 5,
      "status": "pending",
      "submitted_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

## 💬 Communication

### Notification Routes (`/api/notifications`)

| Method | Endpoint                          | Description                               | Auth Required | Permission Required   |
| ------ | --------------------------------- | ----------------------------------------- | ------------- | --------------------- |
| GET    | `/api/notifications`              | Lấy danh sách thông báo của user hiện tại | ✅            | - (Own notifications) |
| GET    | `/api/notifications/unread/count` | Lấy số lượng thông báo chưa đọc           | ✅            | - (Own notifications) |
| GET    | `/api/notifications/:id`          | Lấy chi tiết thông báo theo ID            | ✅            | - (Own notifications) |
| POST   | `/api/notifications`              | Tạo thông báo mới                         | ✅            | `notification:CREATE` |
| PUT    | `/api/notifications/:id`          | Cập nhật thông báo                        | ✅            | `notification:UPDATE` |
| DELETE | `/api/notifications/:id`          | Xóa thông báo                             | ✅            | `notification:DELETE` |
| PUT    | `/api/notifications/:id/read`     | Đánh dấu thông báo là đã đọc              | ✅            | - (Own notifications) |
| PUT    | `/api/notifications/read-all`     | Đánh dấu tất cả thông báo là đã đọc       | ✅            | - (Own notifications) |

**Query Parameters - Get All Notifications (`GET /api/notifications`):**

- `page` (optional): Số trang (default: 1)
- `limit` (optional): Số lượng thông báo mỗi trang (default: 10)
- `read_status` (optional): Lọc theo trạng thái đọc (`read` hoặc `unread`)
- `notification_type` (optional): Lọc theo loại thông báo (`schedule`, `score_update`, `cancellation`, `registration_guide`, `general`, `activity`, `announcement`)

**Request Body - Create Notification (Gửi cho tất cả):**

```json
{
  "title": "Thông báo lịch học tuần này",
  "content": "Các lớp học sẽ bắt đầu lúc 7h30 sáng thứ 2. Vui lòng có mặt đúng giờ và chuẩn bị đầy đủ tài liệu học tập.",
  "published_date": "2025-10-23T00:00:00.000Z",
  "icon_type": "megaphone",
  "notification_type": "schedule",
  "target_audience": "all",
  "target_user_ids": [] // ← Bỏ qua khi target_audience = "all"
}
```

**Request Body - Create Notification (Gửi cho sinh viên):**

```json
{
  "title": "Cập nhật điểm rèn luyện",
  "content": "Điểm rèn luyện học kỳ vừa rồi đã được công bố. Sinh viên có thể xem chi tiết trong mục Kết quả học tập.",
  "published_date": "2025-10-22T00:00:00.000Z",
  "icon_type": "megaphone",
  "notification_type": "score_update",
  "target_audience": "student",
  "target_user_ids": [] // ← Bỏ qua khi target_audience = "student"
}
```

**Request Body - Create Notification (Gửi cho staff):**

```json
{
  "title": "Họp phòng CTSV",
  "content": "Thông báo họp phòng CTSV vào thứ 2 tuần sau.",
  "published_date": "2025-10-21T00:00:00.000Z",
  "icon_type": "megaphone",
  "notification_type": "announcement",
  "target_audience": "staff",
  "target_user_ids": [] // ← Bỏ qua khi target_audience = "staff"
}
```

**Request Body - Create Notification (Gửi cho users cụ thể):**

```json
{
  "title": "Thông báo cho lớp CNTT01",
  "content": "Lịch thi cuối kỳ lớp CNTT01 sẽ diễn ra vào...",
  "published_date": "2025-10-23T00:00:00.000Z",
  "icon_type": "megaphone",
  "notification_type": "schedule",
  "target_audience": "specific",
  "target_user_ids": [
    "67a1b2c3d4e5f6g7h8i9j0k1",
    "67a1b2c3d4e5f6g7h8i9j0k2",
    "67a1b2c3d4e5f6g7h8i9j0k3"
  ] // ← Chỉ các users có ID trong danh sách này mới nhìn thấy
}
```

**Các trường trong Request:**

- `title` (required): Tiêu đề thông báo
- `content` (required): Nội dung thông báo
- `published_date` (optional): Ngày xuất bản (default: hiện tại)
- `icon_type` (optional): Loại icon (default: `megaphone`)
- `notification_type` (optional): Loại thông báo (default: `general`)
  - Các giá trị: `schedule`, `score_update`, `cancellation`, `registration_guide`, `general`, `activity`, `announcement`
- `target_audience` (optional): Đối tượng nhận thông báo (default: `all`)
  - Các giá trị: `all`, `student`, `staff`, `specific`
  - `all`: Tất cả users (students, staff, admin)
  - `student`: Chỉ sinh viên
  - `staff`: Chỉ staff và admin
  - `specific`: Chỉ những users trong `target_user_ids`
- `target_user_ids` (optional): Danh sách user IDs nhận thông báo
  - **Chỉ sử dụng khi `target_audience = 'specific'`**
  - Khi `target_audience = 'all'/'student'/'staff'`, trường này bị bỏ qua (có thể để `[]` hoặc không gửi)
  - Khi `target_audience = 'specific'`, **bắt buộc** phải có ít nhất 1 user ID trong danh sách
  - Ví dụ: `["67a1b2c3d4e5f6g7h8i9j0k1", "67a1b2c3d4e5f6g7h8i9j0k2"]`
  - **Lưu ý**: Admin luôn nhìn thấy tất cả thông báo (để quản lý), dù có trong `target_user_ids` hay không

**Request Body - Update Notification:**

```json
{
  "title": "Thông báo lịch học tuần này (đã cập nhật)",
  "content": "Nội dung đã được cập nhật...",
  "published_date": "2025-10-24T00:00:00.000Z",
  "icon_type": "megaphone",
  "notification_type": "schedule",
  "target_audience": "student",
  "target_user_ids": []
}
```

**Request Body - Update Notification (Thay đổi target_audience):**

```json
{
  "target_audience": "staff",
  "target_user_ids": [] // ← Bỏ qua khi target_audience = "staff"
}
```

**Request Body - Update Notification (Thay đổi sang specific users):**

```json
{
  "target_audience": "specific",
  "target_user_ids": ["67a1b2c3d4e5f6g7h8i9j0k1", "67a1b2c3d4e5f6g7h8i9j0k2"] // ← Bắt buộc phải có ít nhất 1 user ID khi target_audience = "specific"
}
```

**Lưu ý - Update Notification:**

- **CÓ THỂ update** các trường `target_audience` và `target_user_ids`
- Khi update `target_audience` từ `all`/`student`/`staff` sang `specific`, **bắt buộc** phải có ít nhất 1 user ID trong `target_user_ids`
- Khi update `target_audience` từ `specific` sang `all`/`student`/`staff`, `target_user_ids` sẽ bị bỏ qua (nhưng vẫn lưu trong database)
- Tất cả các trường đều **optional**, chỉ cập nhật các trường được gửi trong request
- Nếu không gửi `target_audience` và `target_user_ids`, các giá trị cũ sẽ được giữ nguyên

**Response - Get All Notifications (`GET /api/notifications`):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "notification_id",
      "title": "Thông báo lịch học tuần này",
      "content": "Các lớp học sẽ bắt đầu lúc 7h30 sáng thứ 2. Vui lòng có mặt đúng giờ và chuẩn bị đầy đủ tài liệu học tập.",
      "published_date": "2025-10-23T00:00:00.000Z",
      "icon_type": "megaphone",
      "notification_type": "schedule",
      "target_audience": "all",
      "created_by": {
        "_id": "user_id",
        "username": "admin"
      },
      "is_read": false
    },
    {
      "_id": "notification_id_2",
      "title": "Cập nhật điểm rèn luyện",
      "content": "Điểm rèn luyện học kỳ vừa rồi đã được công bố. Sinh viên có thể xem chi tiết trong mục Kết quả học tập.",
      "published_date": "2025-10-22T00:00:00.000Z",
      "icon_type": "megaphone",
      "notification_type": "score_update",
      "target_audience": "all",
      "created_by": {
        "_id": "user_id",
        "username": "admin"
      },
      "is_read": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 4,
    "totalPages": 1
  },
  "unread_count": 2
}
```

**Response - Get Unread Count (`GET /api/notifications/unread/count`):**

```json
{
  "success": true,
  "unread_count": 2
}
```

**Response - Get Notification by ID (`GET /api/notifications/:id`):**

```json
{
  "success": true,
  "data": {
    "_id": "notification_id",
    "title": "Thông báo lịch học tuần này",
    "content": "Các lớp học sẽ bắt đầu lúc 7h30 sáng thứ 2. Vui lòng có mặt đúng giờ và chuẩn bị đầy đủ tài liệu học tập.",
    "published_date": "2025-10-23T00:00:00.000Z",
    "icon_type": "megaphone",
    "notification_type": "schedule",
    "target_audience": "all",
    "created_by": {
      "_id": "user_id",
      "username": "admin"
    },
    "is_read": false
  }
}
```

**Response - Mark as Read (`PUT /api/notifications/:id/read`):**

```json
{
  "success": true,
  "data": {
    "_id": "read_record_id",
    "notification_id": "notification_id",
    "user_id": "user_id",
    "read_at": "2025-10-23T10:30:00.000Z"
  }
}
```

**Response - Mark All as Read (`PUT /api/notifications/read-all`):**

```json
{
  "success": true,
  "message": "Marked 2 notifications as read"
}
```

**Lưu ý:**

- **Xem thông báo**: Tất cả users đều có thể xem thông báo của mình (không cần permission đặc biệt, chỉ cần authentication)
- **Tạo thông báo**: Chỉ **admin** và **staff** có quyền (cần permission `notification:CREATE`)
- **Cập nhật thông báo**: Chỉ **admin** và **staff** có quyền (cần permission `notification:UPDATE`)
- **Xóa thông báo**: Chỉ **admin** và **staff** có quyền (cần permission `notification:DELETE`)
- **Sinh viên (student)**: Chỉ có quyền xem và đánh dấu đã đọc, không thể tạo/cập nhật/xóa thông báo
- **Cách lưu trạng thái "đã đọc" và "chưa đọc"**:
  - **Bảng `notification`**: Lưu thông tin thông báo (dùng chung cho tất cả users), **KHÔNG lưu trạng thái đọc**
  - **Bảng `notification_read`**: **CHỈ lưu trạng thái "ĐÃ ĐỌC"** với các trường:
    - `notification_id`: ID của thông báo
    - `user_id`: ID của user đã đọc
    - `read_at`: Thời gian đánh dấu đã đọc
  - **Trạng thái "CHƯA ĐỌC"**: **KHÔNG lưu trong database**, là trạng thái mặc định (khi không có record trong `notification_read`)
  - **Cách xác định**:
    - `is_read = true` → Có record trong `notification_read` (đã đọc)
    - `is_read = false` → Không có record trong `notification_read` (chưa đọc - mặc định)
  - Khi user đánh dấu đã đọc (`PUT /api/notifications/:id/read`), hệ thống sẽ tạo một record mới trong `notification_read`
  - Khi lấy danh sách thông báo, hệ thống sẽ check xem có record trong `notification_read` không để xác định `is_read`
  - Trường `is_read` trong response **KHÔNG lưu trong database**, mà được tính toán động dựa trên `notification_read`
- Thông báo được sắp xếp theo `published_date` giảm dần (mới nhất trước)
- **Quan trọng**: Sau khi thêm notification permissions, cần chạy lại `seed_permissions.js` để tạo permissions trong database
- **Xem chi tiết**:
  - Xem file `NOTIFICATION_READ_EXPLAINED.md` để hiểu rõ hơn về cách lưu trạng thái đọc
  - Xem file `NOTIFICATION_TARGET_EXPLAINED.md` để hiểu rõ hơn về `target_user_ids` và `target_audience`

**Ví dụ:**

- Lấy tất cả thông báo: `GET /api/notifications`
- Lấy thông báo với phân trang: `GET /api/notifications?page=1&limit=10`
- Lấy thông báo chưa đọc: `GET /api/notifications?read_status=unread`
- Lấy thông báo đã đọc: `GET /api/notifications?read_status=read`
- Lấy thông báo theo loại: `GET /api/notifications?notification_type=schedule`
- Lấy số lượng thông báo chưa đọc: `GET /api/notifications/unread/count`
- Đánh dấu đã đọc: `PUT /api/notifications/:id/read`
- Đánh dấu tất cả đã đọc: `PUT /api/notifications/read-all`

---

## ⚙️ System & Permissions

### Permission Management Routes (`/api/permissions`)

#### Permission & Action Management

| Method | Endpoint                                          | Description                     | Auth Required | Permission Required |
| ------ | ------------------------------------------------- | ------------------------------- | ------------- | ------------------- |
| GET    | `/api/permissions`                                | Lấy tất cả permissions          | ✅            | -                   |
| POST   | `/api/permissions`                                | Tạo permission mới              | ✅            | `permission:CREATE` |
| GET    | `/api/permissions/actions`                        | Lấy tất cả actions              | ✅            | -                   |
| POST   | `/api/permissions/actions`                        | Tạo action mới                  | ✅            | `permission:CREATE` |
| GET    | `/api/permissions/actions/:resource`              | Lấy actions theo resource       | ✅            | -                   |
| GET    | `/api/permissions/roles`                          | Lấy tất cả roles                | ✅            | -                   |
| GET    | `/api/permissions/roles/:roleId/actions`          | Lấy actions của role            | ✅            | -                   |
| POST   | `/api/permissions/roles/:roleId/actions`          | Thêm action vào role            | ✅            | `role:UPDATE`        |
| DELETE | `/api/permissions/roles/:roleId/actions/:actionId` | Xóa action khỏi role            | ✅            | `role:UPDATE`        |

#### User Permission Management ⭐ NEW

| Method | Endpoint                                          | Description                                    | Auth Required | Permission Required |
| ------ | ------------------------------------------------- | ---------------------------------------------- | ------------- | ------------------- |
| GET    | `/api/permissions/users/username/:username`      | Lấy thông tin user và permissions theo username | ✅            | `user:READ`         |
| GET    | `/api/permissions/users/:userId/permissions`     | Lấy tất cả permissions của user               | ✅            | -                   |
| GET    | `/api/permissions/users/:userId/actions/:resource` | Lấy actions của user cho một resource        | ✅            | -                   |
| POST   | `/api/permissions/users/:userId/check-permission` | Kiểm tra user có permission cụ thể          | ✅            | -                   |
| PUT    | `/api/permissions/users/:userId/permissions`     | Cập nhật permissions cho user (bulk update)   | ✅            | `user:UPDATE`       |
| POST   | `/api/permissions/users/:userId/assign-org-role` | Gán role tổ chức cho sinh viên                | ✅            | `user:UPDATE`       |

**Request - Get User by Username (`GET /api/permissions/users/username/:username`):**

```bash
GET /api/permissions/users/username/admin
Headers: Authorization: Bearer <token>
```

**Response - Get User by Username:**

```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "username": "admin",
    "active": true,
    "isLocked": false,
    "userType": "staff"
  },
  "roles": [
    {
      "id": "user_role_id",
      "role": "admin",
      "roleId": "role_id",
      "orgUnit": null
    }
  ],
  "permissions": {
    "activity": [
      {
        "action_code": "CREATE",
        "action_name": "Tạo hoạt động"
      },
      {
        "action_code": "READ",
        "action_name": "Xem hoạt động"
      }
    ],
    "user": [
      {
        "action_code": "READ",
        "action_name": "Xem người dùng"
      }
    ]
  },
  "overrides": [
    {
      "action_id": "action_id",
      "resource": "activity",
      "action_code": "DELETE",
      "action_name": "Xóa hoạt động",
      "is_granted": true
    }
  ]
}
```

**Request - Update User Permissions (`PUT /api/permissions/users/:userId/permissions`):**

```json
{
  "actions": [
    {
      "action_id": "action_id_1",
      "is_granted": true
    },
    {
      "action_id": "action_id_2",
      "is_granted": false
    }
  ]
}
```

**Response - Update User Permissions:**

```json
{
  "success": true,
  "message": "Permissions updated successfully",
  "results": [
    {
      "action_id": "action_id_1",
      "success": true,
      "data": {
        "_id": "override_id",
        "user_id": "user_id",
        "action_id": {
          "_id": "action_id_1",
          "resource": "activity",
          "action_code": "CREATE"
        },
        "is_granted": true
      }
    }
  ]
}
```

**Request - Assign Org Role to Student (`POST /api/permissions/users/:userId/assign-org-role`):**

```json
{
  "role_id": "staff_role_id",
  "org_unit_id": "org_unit_id",
  "position": "Nhân viên"
}
```

**Response - Assign Org Role to Student:**

```json
{
  "success": true,
  "message": "Organization role assigned to student successfully",
  "data": {
    "_id": "user_role_id",
    "user_id": "user_id",
    "role_id": {
      "_id": "staff_role_id",
      "name": "staff"
    },
    "org_unit_id": {
      "_id": "org_unit_id",
      "name": "Khoa Công Nghệ Thông Tin"
    }
  }
}
```

**Lưu ý - Assign Org Role to Student:**

- Chỉ có thể gán cho user có `userType = "student"`
- Nếu `position` được cung cấp, hệ thống sẽ tự động tạo hoặc cập nhật `StaffProfile` cho sinh viên
- `org_unit_id` là bắt buộc
- `position` là optional (có thể để trống)
- Nếu user đã có role này trong org unit, sẽ trả về lỗi 400

**Lưu ý - Update User Permissions:**

- `actions` là một mảng các object với `action_id` và `is_granted`
- `is_granted: true` = cấp quyền, `is_granted: false` = thu hồi quyền
- Hệ thống sẽ tạo hoặc cập nhật `UserActionOverride` cho mỗi action
- Override có priority cao hơn role-based permissions

---

## 📊 Statistics

Lấy thống kê tổng quan hoạt động: tổng số, hoạt động năm nay, tỷ lệ tăng trưởng.

**Request:**
```bash
curl -X GET "http://localhost:5000/api/statistics/activity-dashboard" \
  -H "Authorization: Bearer <TOKEN>"
```

**Response:**
```json
{
  "data": {
    "totalActivities": 150,
    "activitiesThisYear": 85,
    "activitiesPreviousYear": 65,
    "growthPercentage": 31
  },
  "message": "Dashboard statistics retrieved successfully"
}
```

---

#### Get Grades Statistics (`GET /api/statistics/grades`)

Xem thống kê điểm rèn luyện (PVCD) với bộ lọc nâng cao, phân trang và thống kê tổng hợp.

**Query Parameters (tất cả optional):**

| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `student_number` | string | Mã sinh viên (partial search) |
| `faculty_id` | UUID | ID khoa |
| `class_id` | UUID | ID lớp |
| `year` | integer | Năm học |
| `page` | integer | Trang (default: 1) |
| `limit` | integer | Số bản ghi/trang (default: 10) |

**Request:**
```bash
curl -X GET "http://localhost:5000/api/statistics/grades?student_number=1022&year=2024&page=1&limit=10" \
  -H "Authorization: Bearer <TOKEN>"
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Lấy thống kê điểm thành công",
  "data": {
    "records": [
      {
        "_id": "...",
        "year": 2024,
        "total_point": 85,
        "student": {
          "student_number": "102220095",
          "full_name": "Nguyễn Văn A",
          "email": "student@example.com"
        },
        "class": {
          "name": "CNTT21.1"
        },
        "faculty": {
          "name": "Khoa Công nghệ Thông tin"
        }
      }
    ],
    "statistics": {
      "total_students": 15,
      "total_points": 1275,
      "average_points": "85.00",
      "max_points": 98,
      "min_points": 72
    },
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 15,
      "totalPages": 2
    }
  }
}
```

**Response (Empty):**
```json
{
  "success": true,
  "message": "Lấy thống kê điểm thành công",
  "data": {
    "records": [],
    "statistics": {
      "total_students": 0,
      "total_points": 0,
      "average_points": "0.00",
      "max_points": 0,
      "min_points": 0
    },
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

**Notes:**
- Tất cả query parameters optional
- `student_number` hỗ trợ partial search
- Statistics tính từ tất cả kết quả, không chỉ trang hiện tại
- Yêu cầu authentication, không yêu cầu permission đặc biệt

---

## 👥 Role-based Access Control

Hệ thống có **3 roles chính**:

| Role      | Description                                                             | Số lượng Permissions |
| --------- | ----------------------------------------------------------------------- | -------------------- |
| `admin`   | Quản trị viên hệ thống - Toàn quyền                                     | ~82 permissions      |
| `staff`   | Cán bộ (CTSV, Đoàn, Hội SV, Khoa, CLB) - Quản lý sinh viên và hoạt động | ~55 permissions      |
| `student` | Sinh viên - Tham gia hoạt động, nộp minh chứng                          | ~17 permissions      |

**Lưu ý đặc biệt:**

- **Staff** được phân biệt qua `org_unit_id` trong `user_role` (CTSV, Đoàn trường, Khoa, CLB)
- **Lớp trưởng** KHÔNG phải role riêng, mà là field `isClassMonitor: true` trong `student_profile`
- **Lớp trưởng** có thêm 2 quyền: `class:attendance` và `class:report` (cần middleware `checkClassMonitor()`)

---

## 📌 HTTP Status Codes

| Code | Meaning                             |
| ---- | ----------------------------------- |
| 200  | OK - Request thành công             |
| 201  | Created - Tạo mới thành công        |
| 400  | Bad Request - Dữ liệu không hợp lệ  |
| 401  | Unauthorized - Chưa đăng nhập       |
| 403  | Forbidden - Không có quyền truy cập |
| 404  | Not Found - Không tìm thấy          |
| 500  | Internal Server Error - Lỗi server  |

---

## 📱 Test Accounts

Sau khi chạy `seed_correct_structure.js`, bạn có **8 users** cho đầy đủ 3 roles:

### 👑 Admin (1 account)

| Username | Password   | Role  | Mô tả                               |
| -------- | ---------- | ----- | ----------------------------------- |
| `admin`  | `admin123` | admin | Quản trị viên hệ thống - Toàn quyền |

### 👔 Staff (3 accounts)

| Username     | Password   | Role  | Org Unit    | Mô tả                     |
| ------------ | ---------- | ----- | ----------- | ------------------------- |
| `staff_ctsv` | `staff123` | staff | Phòng CTSV  | Cán bộ Công tác sinh viên |
| `staff_doan` | `staff123` | staff | Đoàn trường | Cán bộ Đoàn trường        |
| `staff_khoa` | `staff123` | staff | Khoa CNTT   | Cán bộ Khoa CNTT          |

### 👨‍🎓 Student (4 accounts)

| Username           | Password     | Role    | Student Number | Đặc biệt                                 |
| ------------------ | ------------ | ------- | -------------- | ---------------------------------------- |
| `student1`         | `student123` | student | 102220001      | Sinh viên thường                         |
| `student2_monitor` | `student123` | student | 102220002      | **LỚP TRƯỞNG ⭐** (isClassMonitor: true) |
| `student3`         | `student123` | student | 102220003      | Sinh viên thường                         |
| `student4`         | `student123` | student | 102220004      | Sinh viên thường                         |

### Login Format

```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Note:**

- Database: `Community_Activity_Management`
- **Tất cả passwords đã được hash bằng bcrypt** trong seed file (saltRounds = 10)
- Lớp trưởng được xác định qua field `isClassMonitor: true` trong `student_profile`, KHÔNG phải role riêng

---

## 🎯 Registration Status Detail by Student ID

### Get Registration Status Detail (`GET /api/registrations/student/:studentId/status-detail/:registrationId`)

Lấy chi tiết trạng thái đăng ký của sinh viên. **Không yêu cầu authentication**, chỉ cần truyền `studentId` và `registrationId` trong URL.

**URL Parameters:**

| Parameter        | Type   | Required | Description           |
| ---------------- | ------ | -------- | --------------------- |
| `studentId`      | String | ✅       | ID của StudentProfile |
| `registrationId` | String | ✅       | ID của Registration   |

**Request:**

```bash
GET /api/registrations/student/5f8d1a2c3b1e4a5c6d7e8f9g/status-detail/691d32d37d678ed4b292d8e0
```

**Response (Success):**

```json
{
  "success": true,
  "data": {
    "registration_id": "691d32d37d678ed4b292d8e0",
    "student_id": "5f8d1a2c3b1e4a5c6d7e8f9g",
    "activity": {
      "id": "activity_id",
      "title": "Hoạt động tình nguyện",
      "description": "Tham gia dọn dẹp khuôn viên trường",
      "start_time": "2024-01-20T08:00:00.000Z",
      "end_time": "2024-01-20T10:00:00.000Z",
      "requires_approval": true
    },
    "status": {
      "current": "pending",
      "text": "Chờ duyệt",
      "color": "warning",
      "icon": "clock",
      "message": "Hoạt động yêu cầu duyệt. Vui lòng chờ quản lý duyệt đơn của bạn."
    },
    "timeline": {
      "registered_at": "2024-01-15T10:30:00.000Z",
      "approved_at": null,
      "rejected_at": null,
      "cancelled_at": null,
      "approved_by": null,
      "cancelled_by": null
    },
    "history": [
      {
        "status": "pending",
        "changed_at": "2024-01-15T10:30:00.000Z",
        "changed_by": "System",
        "reason": "Registered"
      }
    ]
  }
}
```

**Response (Attended Status):**

```json
{
  "success": true,
  "data": {
    "registration_id": "691d32d37d678ed4b292d8e0",
    "student_id": "5f8d1a2c3b1e4a5c6d7e8f9g",
    "activity": {
      "id": "activity_id",
      "title": "Hoạt động tình nguyện",
      "description": "Tham gia dọn dẹp khuôn viên trường",
      "start_time": "2024-01-20T08:00:00.000Z",
      "end_time": "2024-01-20T10:00:00.000Z",
      "requires_approval": true
    },
    "status": {
      "current": "attended",
      "text": "Đã tham gia",
      "color": "info",
      "icon": "user-check",
      "message": "Bạn đã tham gia hoạt động thành công."
    },
    "timeline": {
      "registered_at": "2024-01-15T10:30:00.000Z",
      "approved_at": "2024-01-16T14:00:00.000Z",
      "rejected_at": null,
      "attended_at": "2024-01-20T08:15:00.000Z",
      "approved_by": "staff_ctsv"
    },
    "history": [
      {
        "status": "pending",
        "changed_at": "2024-01-15T10:30:00.000Z",
        "changed_by": "System",
        "reason": "Registered"
      },
      {
        "status": "approved",
        "changed_at": "2024-01-16T14:00:00.000Z",
        "changed_by": "staff_ctsv",
        "reason": "Approved by staff/admin"
      },
      {
        "status": "attended",
        "changed_at": "2024-01-20T08:15:00.000Z",
        "changed_by": "System",
        "reason": "Auto-updated by attendance system"
      }
    ]
  }
}
```

**Response (Approved Status):**

```json
{
  "success": true,
  "data": {
    "registration_id": "691d32d37d678ed4b292d8e0",
    "student_id": "5f8d1a2c3b1e4a5c6d7e8f9g",
    "activity": {
      "id": "activity_id",
      "title": "Hoạt động tình nguyện",
      "description": "Tham gia dọn dẹp khuôn viên trường",
      "start_time": "2024-01-20T08:00:00.000Z",
      "end_time": "2024-01-20T10:00:00.000Z",
      "requires_approval": true
    },
    "status": {
      "current": "approved",
      "text": "Đã duyệt",
      "color": "success",
      "icon": "check",
      "message": "Bạn đã được duyệt. Vui lòng tham gia hoạt động đúng giờ."
    },
    "timeline": {
      "registered_at": "2024-01-15T10:30:00.000Z",
      "approved_at": "2024-01-16T14:00:00.000Z",
      "rejected_at": null,
      "cancelled_at": null,
      "approved_by": "staff_ctsv",
      "cancelled_by": null
    },
    "history": [
      {
        "status": "pending",
        "changed_at": "2024-01-15T10:30:00.000Z",
        "changed_by": "System",
        "reason": "Registered"
      },
      {
        "status": "approved",
        "changed_at": "2024-01-16T14:00:00.000Z",
        "changed_by": "staff_ctsv",
        "reason": "Approved by staff/admin"
      }
    ]
  }
}
```

**Response (Rejected Status):**

```json
{
  "success": true,
  "data": {
    "registration_id": "691d32d37d678ed4b292d8e0",
    "student_id": "5f8d1a2c3b1e4a5c6d7e8f9g",
    "activity": {
      "id": "activity_id",
      "title": "Hoạt động tình nguyện",
      "description": "Tham gia dọn dẹp khuôn viên trường",
      "start_time": "2024-01-20T08:00:00.000Z",
      "end_time": "2024-01-20T10:00:00.000Z",
      "requires_approval": true
    },
    "status": {
      "current": "rejected",
      "text": "Bị từ chối",
      "color": "danger",
      "icon": "times",
      "message": "Đơn của bạn bị từ chối: Không đủ điều kiện tham gia"
    },
    "timeline": {
      "registered_at": "2024-01-15T10:30:00.000Z",
      "approved_at": null,
      "rejected_at": "2024-01-16T14:00:00.000Z",
      "attended_at": null,
      "approved_by": null,
      "rejected_by": "staff_ctsv"
    },
    "history": [
      {
        "status": "pending",
        "changed_at": "2024-01-15T10:30:00.000Z",
        "changed_by": "System",
        "reason": "Registered"
      },
      {
        "status": "rejected",
        "changed_at": "2024-01-16T14:00:00.000Z",
        "changed_by": "staff_ctsv",
        "reason": "Rejected by staff/admin"
      }
    ]
  }
}
```

**Response (Student Profile Not Found):**

```json
{
  "success": false,
  "message": "Student profile not found"
}
```

**Response (Registration Not Found):**

```json
{
  "success": false,
  "message": "Registration not found for this student"
}
```

**Status Color & Icon Reference:**

| Status    | Text         | Color     | Icon       | Meaning                             |
| --------- | ------------ | --------- | ---------- | ----------------------------------- |
| pending   | Chờ duyệt    | warning   | clock      | Chờ xét duyệt                       |
| approved  | Đã duyệt     | success   | check      | Được phép tham gia                  |
| rejected  | Bị từ chối   | danger    | times      | Không được phép tham gia            |
| attended  | Đã tham gia  | info      | user-check | Đã tham gia hoạt động thành công    |

**Lưu ý:**

- ✅ **Không cần authentication token** - API công khai
- ✅ **Chỉ cần studentId và registrationId** - dễ dàng chia sẻ với sinh viên
- ✅ **Bảo mật**: Sinh viên chỉ xem được đơn của chính mình (endpoint kiểm tra `student_id` khớp)
- ✅ **Timeline chi tiết**: Hiển thị từng bước trạng thái từ khi đăng ký
- ✅ **History audit**: Lưu lại tất cả các thay đổi trạng thái

**Ứng dụng:**

Frontend có thể dùng endpoint này để:
1. Hiển thị status badge (pending, approved, rejected, cancelled)
2. Hiển thị timeline hoạt động của đơn
3. Hiển thị lý do từ chối (nếu có)
4. Hiển thị thông báo tương ứng với trạng thái

**Ví dụ URL trong Frontend:**

```
/registration-status?studentId=5f8d1a2c3b1e4a5c6d7e8f9g&registrationId=691d32d37d678ed4b292d8e0
```

Hoặc

```
/student/{studentId}/registration/{registrationId}/status
```
