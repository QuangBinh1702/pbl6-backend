# 🗄️ HƯỚNG DẪN SETUP DATABASE TỪ ĐẦU

## ⚠️ QUAN TRỌNG

Vì đã có **COLLECTIONS TRÙNG LẶP** (singular và plural) trong database, bạn **PHẢI XÓA TOÀN BỘ DATABASE** và tạo lại từ đầu.

---

## 📋 BƯỚC 1: XÓA DATABASE CŨ

### Cách 1: Sử dụng MongoDB Shell (mongosh)

```bash
# Mở mongosh
mongosh

# Chọn database
use Community_Activity_Management

# Xóa toàn bộ database
db.dropDatabase()

# Kiểm tra đã xóa
show dbs

# Thoát
exit
```

### Cách 2: Sử dụng MongoDB Compass

1. Mở **MongoDB Compass**
2. Kết nối đến database của bạn
3. Tìm database `Community_Activity_Management`
4. Click vào **biểu tượng thùng rác** 🗑️
5. Xác nhận xóa

### Cách 3: Sử dụng Studio 3T / MongoDBCompass

1. Right-click vào database `Community_Activity_Management`
2. Chọn **Drop Database**
3. Xác nhận

---

## 🚀 BƯỚC 2: CHẠY SEED DỮ LIỆU CƠ BẢN

```bash
cd backend
node seed_correct_structure.js
```

**Kết quả:**
✅ Tạo 10 users cho 4 roles
✅ Tạo roles, classes, cohorts, faculties
✅ Tạo org_units, fields
✅ Tạo staff_profile và student_profile
✅ Tạo sample activities, attendances
✅ Không tạo permissions (sẽ tạo ở bước 3)

**Danh sách users được tạo:**

| Role | Username | Password | Mô tả |
|------|----------|----------|-------|
| **ADMIN** | `admin` | `admin123` | Quản trị viên |
| **STAFF** | `staff_ctsv` | `staff123` | Cán bộ CTSV |
| **STAFF** | `staff_doan` | `staff123` | Cán bộ Đoàn |
| **STAFF** | `staff_khoa` | `staff123` | Cán bộ Khoa |
| **TEACHER** | `teacher1` | `teacher123` | Giảng viên 1 |
| **TEACHER** | `teacher2` | `teacher123` | Giảng viên 2 |
| **STUDENT** | `student1` | `student123` | Sinh viên (102220001) |
| **STUDENT** | `student2_monitor` | `student123` | **Lớp trưởng ⭐** (102220002) |
| **STUDENT** | `student3` | `student123` | Sinh viên (102220003) |
| **STUDENT** | `student4` | `student123` | Sinh viên (102220004) |

---

## 🔐 BƯỚC 3: CHẠY SEED PERMISSIONS

```bash
node seed_permissions.js
```

**Kết quả:**
✅ Tạo 20 permissions (resources)
✅ Tạo ~82 actions
✅ Tạo role-action mappings cho 4 roles

**Permissions được tạo:**
- activity, user, attendance, evidence
- report, class, pvcd_record
- role, permission, activity_registration
- student_feedback, student_profile, staff_profile
- student_cohort, cohort, faculty, org_unit
- field, post, activity_eligibility

---

## ✅ BƯỚC 4: KIỂM TRA

### 4.1. Kiểm tra Collections trong Database

```bash
mongosh
use Community_Activity_Management
show collections
```

**Kết quả mong đợi (KHÔNG CÓ TRÙNG LẶP):**

```
action
activity
activity_eligiblity
activity_registration
attendance
class
cohort
evidence
falcuty
field
org_unit
permission
post
pvcd_record
role
role_action
staff_profile
student_cohort
student_feedback
student_profile
user
user_action_override
user_role
```

⚠️ **KHÔNG ĐƯỢC CÓ:**
- ❌ `actions`, `activities`, `classes`, `cohorts`, etc. (số nhiều)

### 4.2. Kiểm tra số lượng documents

```javascript
// Trong mongosh
db.user.countDocuments()        // 10
db.role.countDocuments()        // 4
db.permission.countDocuments()  // 20
db.action.countDocuments()      // ~82
db.staff_profile.countDocuments()   // 5
db.student_profile.countDocuments() // 4
```

### 4.3. Test Login

Sử dụng **Postman** hoặc test file HTML:

```bash
# Start server
npm start

# Test trong browser
http://localhost:5000/test-login.html
```

**Test accounts:**
- Admin: `admin` / `admin123`
- Staff: `staff_ctsv` / `staff123`
- Teacher: `teacher1` / `teacher123`
- Student: `student1` / `student123`
- Lớp trưởng: `student2_monitor` / `student123`

---

## 📊 BƯỚC 5: TEST PERMISSIONS

### 5.1. Login và lấy token

```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOi...",
  "user": { ... }
}
```

### 5.2. Kiểm tra permissions của user

```http
GET http://localhost:5000/api/permissions/users/:userId/permissions
Authorization: Bearer {{token}}
```

Response:
```json
{
  "success": true,
  "data": {
    "activity": ["CREATE", "READ", "UPDATE", "DELETE", "APPROVE"],
    "user": ["CREATE", "READ", "UPDATE"],
    ...
  }
}
```

### 5.3. Test quyền Lớp trưởng

Login với `student2_monitor`:

```javascript
// Kiểm tra isClassMonitor
const studentProfile = await StudentProfile.findOne({ 
  user_id: userId 
});

console.log(studentProfile.isClassMonitor); // true
```

---

## 🔧 TROUBLESHOOTING

### Vấn đề 1: Vẫn thấy collections trùng

**Nguyên nhân:** Chưa xóa database hoàn toàn

**Giải pháp:**
```bash
mongosh
use Community_Activity_Management
db.dropDatabase()
exit

# Chạy lại seed
node seed_correct_structure.js
node seed_permissions.js
```

### Vấn đề 2: Lỗi "Role not found"

**Nguyên nhân:** Chưa chạy `seed_correct_structure.js`

**Giải pháp:**
```bash
node seed_correct_structure.js
node seed_permissions.js
```

### Vấn đề 3: Permissions không hoạt động

**Nguyên nhân:** Chưa có role-action mappings

**Giải pháp:**
```bash
node seed_permissions.js
```

### Vấn đề 4: Login lỗi "User not found"

**Nguyên nhân:** Username sai hoặc chưa seed users

**Giải pháp:**
- Kiểm tra username (phân biệt hoa thường)
- Chạy lại `seed_correct_structure.js`

---

## 📝 CHECKLIST

- [ ] Đã xóa database `Community_Activity_Management`
- [ ] Đã chạy `node seed_correct_structure.js` thành công
- [ ] Đã chạy `node seed_permissions.js` thành công
- [ ] Kiểm tra database KHÔNG có collections trùng
- [ ] Test login với tất cả 4 roles
- [ ] Test permissions API
- [ ] Test lớp trưởng (`student2_monitor`)

---

## 🎯 KẾT QUẢ CUỐI CÙNG

Sau khi hoàn thành, bạn sẽ có:

✅ Database sạch, không trùng lặp
✅ 10 users cho 4 roles (admin, staff, teacher, student)
✅ 1 lớp trưởng (`student2_monitor` với `isClassMonitor: true`)
✅ 20 permissions với ~82 actions
✅ Role-action mappings đầy đủ
✅ Sample data để test (activities, attendance, etc.)

**GIỜ BẠN CÓ THỂ:**
- Login với bất kỳ user nào
- Test permissions theo từng role
- Test middleware lớp trưởng
- Phát triển tiếp features

---

## 📞 SUPPORT

Nếu gặp vấn đề:
1. Xem lại từng bước
2. Kiểm tra MongoDB connection
3. Xem log khi chạy seed scripts
4. Kiểm tra `permissions.config.js` có đúng không

---

✅ **HOÀN TẤT!** Database đã sẵn sàng cho testing!


