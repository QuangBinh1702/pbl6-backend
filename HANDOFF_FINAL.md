# 📋 Handoff - Data & Backend Setup - November 19, 2025

**Status**: ✅ Complete - All seed scripts and fixes implemented

---

## 🔧 Scripts Tạo & Sửa

### 1. **seed_from_csv.js** ✅ (Updated)
```bash
cd d:\pbl6\backend && node scripts/seed_from_csv.js
```

**Thay đổi:**
- ✅ Thêm `bcryptjs` import và hash password với `bcrypt.hash(password, 10)`
- ✅ Tạo User với `username = student_number`, `password_hash = hashed_password`
- ✅ Gán role student cho mỗi user tạo mới qua UserRole
- ✅ Tạo 1000+ sinh viên từ CSV + activities + registrations

**User tạo:**
- username: `{student_number}` (vd: 102220001)
- password: `{student_number}` (hashed)
- role: student

---

### 2. **seed_single_student.js** ✅ (Updated)
```bash
cd d:\pbl6\backend && node scripts/seed_single_student.js
```

**Thay đổi:**
- ✅ Sửa password hashing giống seed_from_csv
- ✅ Sửa Notification fields: `title`, `content`, `published_date` (không có message, type, recipient_id)
- ✅ Sửa PVCDRecord: chỉ có `student_id` và `year` (không categories)
- ✅ Student 102220095 được tạo đầy đủ

---

### 3. **seed_activities_attendance.js** ✅ (New)
```bash
cd d:\pbl6\backend && node scripts/seed_activities_attendance.js
```

**Tạo cho sinh viên 102220095:**
- ✅ 7 hoạt động với trạng thái khác nhau: pending, approved, in_progress, completed, cancelled, rejected
- ✅ ActivityRegistration cho mỗi hoạt động
- ✅ Attendance records (với points) cho hoạt động completed/in_progress
- ✅ `org_unit_id` + `field_id` gán đúng

**Hoạt động có attendance (có points):**
- Hội thảo Khoa học Công nghệ: 5 điểm
- Tuyên truyền An toàn thông tin: 3 điểm
- Chương trình Tình nguyện Tháng Ba: 4 điểm

---

### 4. **seed_notifications.js** ✅ (New)
```bash
cd d:\pbl6\backend && node scripts/seed_notifications.js
```

**Xóa & tạo mới:**
- ✅ Xóa tất cả notification + notification_read cũ
- ✅ Tạo 7 notification mới
- ✅ 3 notification riêng cho user 102220095
- ✅ 4 notification chung (nhưng 102220095 đánh dấu đã đọc)

---

### 5. **add_student_roles.js** ✅ (New)
```bash
cd d:\pbl6\backend && node scripts/add_student_roles.js
```

**Không xóa dữ liệu:**
- ✅ Kiểm tra tất cả users hiện tại
- ✅ Thêm role student chỉ cho những user chưa có
- ✅ Không ảnh hưởng dữ liệu cũ

---

### 6. **clean_and_reseed_activities.js** ✅ (New - Optional)
```bash
cd d:\pbl6\backend && node scripts/clean_and_reseed_activities.js
```

**Nếu cần clean activities:**
- ✅ Xóa hoạt động sai lệch từ lần trước
- ✅ Tạo lại 7 hoạt động với org_unit_id + field_id đúng

---

## 🔧 Code Fixes

### 1. **activity.controller.js** ✅
**Sửa `transformActivity()`** - Trích name từ org_unit_id và field_id:
```javascript
// Extract name từ org_unit_id nếu có
if (activityObj.org_unit_id && typeof activityObj.org_unit_id === 'object') {
  activityObj.org_unit_name = activityObj.org_unit_id.name || null;
  activityObj.org_unit_id = activityObj.org_unit_id._id;
}

// Extract name từ field_id nếu có
if (activityObj.field_id && typeof activityObj.field_id === 'object') {
  activityObj.field_name = activityObj.field_id.name || null;
  activityObj.field_id = activityObj.field_id._id;
}
```

**Response sẽ có:**
```json
{
  "org_unit_id": "691d5c6df46edc8ea94f09fe",
  "org_unit_name": "Đoàn trường",
  "field_id": "691d638adb9ec83878f1be51",
  "field_name": "Lễ tết"
}
```

---

### 2. **attendance.controller.js** ✅
**Sửa `getAttendedActivitiesByStudent()`** - Populate org_unit_id + field_id:
```javascript
const attendances = await Attendance.find({ student_id: studentId })
  .populate({
    path: 'activity_id',
    populate: [
      { path: 'org_unit_id' },
      { path: 'field_id' }
    ]
  })
  .sort({ scanned_at: -1 });
```

**API**: `GET /api/attendance/student/{studentId}/activities`

**Response:**
```json
{
  "org_unit_id": {
    "_id": "691d5c6df46edc8ea94f09fe",
    "name": "Đoàn trường"
  },
  "field_id": {
    "_id": "691d638adb9ec83878f1be51",
    "name": "Lễ tết"
  }
}
```

---

## 📊 Dữ Liệu Hiện Tại

### Sinh viên 102220095 (Nguyễn Quang Bình)
- ✅ User: username=102220095, password=102220095 (hashed)
- ✅ StudentProfile: Mã 102220095, Khoa CNTT, Khoá 2022, Lớp 22T_DT2
- ✅ UserRole: role=student
- ✅ 7 Hoạt động đủ trạng thái
- ✅ 7 ActivityRegistrations
- ✅ 3 Attendance (5+3+4 = 12 điểm)
- ✅ PVCDRecord: year=2023, total_point=12 (tự động từ attendance)
- ✅ 7 Notifications

### 1000+ Sinh viên từ CSV
- ✅ User + StudentProfile cho mỗi sinh viên
- ✅ Role student
- ✅ Classes, Cohorts, Faculties
- ✅ 4 Activities cơ bản
- ✅ 400+ ActivityRegistrations

---

## 🚀 Thực Hiện

### Chạy toàn bộ seed (tạo mới):
```bash
# 1. Seed permissions & roles
cd d:\pbl6\backend && node seed_permissions.js

# 2. Seed 1000+ sinh viên + 4 activities
node scripts/seed_from_csv.js

# 3. Seed sinh viên 102220095 đầy đủ (optional nếu chưa có)
node scripts/seed_single_student.js

# 4. Seed 7 hoạt động + attendance cho 102220095
node scripts/seed_activities_attendance.js

# 5. Seed notifications
node scripts/seed_notifications.js

# 6. Thêm role student cho users hiện tại
node scripts/add_student_roles.js
```

### Nếu có vấn đề dữ liệu:
```bash
# Clean & reseed activities
node scripts/clean_and_reseed_activities.js
```

---

## ⚠️ Lưu ý quan trọng

1. **Không chạy seed trên production** - sẽ xóa/ghi đè dữ liệu cũ
2. **Chạy 1 lần duy nhất** trên database mới
3. **Nếu cần reset**, xóa collections trước:
   ```bash
   # Chỉ khi cần reset hoàn toàn
   db.user.deleteMany({})
   db.student_profile.deleteMany({})
   db.activity.deleteMany({})
   ```
4. **StudentProfile image**: DiceBear URL (miễn phí, không cần setup)
5. **PVCDRecord**: Tự động cộng điểm từ attendance.points

---

## 📝 Schema Changes

### User Model
- ✅ `username`: mã số sinh viên
- ✅ `password_hash`: hashed password
- ✅ `active`: true
- ✅ `isLocked`: false

### StudentProfile Model
- ✅ `user_id`: reference tới User
- ✅ `student_number`, `full_name`, `email`, `phone`
- ✅ `gender`, `date_of_birth`, `class_id`
- ✅ `student_image`: DiceBear URL
- ✅ `contact_address`

### Activity Model
- ✅ `org_unit_id`: reference tới OrgUnit
- ✅ `field_id`: reference tới Field
- ✅ `status`: enum (pending, approved, in_progress, completed, rejected, cancelled)
- ✅ Tất cả fields được populate

### Attendance Model
- ✅ `points`: điểm tham gia (3-5 điểm)
- ✅ Tự động cộng vào PVCDRecord.total_point

### PVCDRecord Model
- ✅ `student_id`: reference tới StudentProfile
- ✅ `year`: năm (2023, 2024, ...)
- ✅ `total_point`: auto-calculated từ attendance

---

## 🔗 API Endpoints

### Activities
- `GET /api/activities` - Tất cả hoạt động (có org_unit_name, field_name)
- `GET /api/activities/:id` - Chi tiết hoạt động
- `POST /api/activities` - Tạo hoạt động

### Attendance & Activities
- `GET /api/attendance/student/:studentId/activities` - Hoạt động đã tham gia (full populate)

### PVCD Records
- `GET /api/pvcd-record/:studentId` - Điểm rèn luyện (auto từ attendance)

---

## ✅ Checklist

- [x] User tạo với password_hash hashed
- [x] Tất cả users có role student
- [x] Activities có org_unit_id + field_id đúng
- [x] Response hiển thị org_unit_name + field_name
- [x] Attendance có points
- [x] PVCDRecord auto-calculate từ attendance
- [x] Notifications tạo đúng
- [x] Sinh viên 102220095 đầy đủ dữ liệu
- [x] 1000+ sinh viên từ CSV

---

## 📞 Developer Tiếp Theo

1. **Chạy seed script** tương ứng trước khi phát triển feature mới
2. **Kiểm tra database** xem dữ liệu đầy đủ
3. **Test API endpoints** để đảm bảo populate đúng
4. **Không modify seed scripts** nếu không cần thiết
5. **Backup database** trước khi run seed production

---

**Last Updated**: November 19, 2025  
**Status**: ✅ Ready for Development  
**Next Step**: Start building features!
