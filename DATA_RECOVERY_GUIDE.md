# 🔄 HƯỚNG DẪN KHÔI PHỤC DỮ LIỆU

**Cập nhật:** 2025-01-15  
**Phiên bản:** 2.0  
**Trạng thái:** ✅ Sẵn sàng sử dụng

---

## 🎯 TỔNG QUAN

Hướng dẫn này cung cấp các phương pháp khôi phục dữ liệu MongoDB khi gặp sự cố mất dữ liệu hoặc cần tạo dữ liệu test.

---

## ⚠️ TÌNH HUỐNG MẤT DỮ LIỆU

### Nguyên nhân thường gặp:
1. **Chạy seed script nhầm** - Xóa toàn bộ collections
2. **MongoDB Atlas Free Tier** - Không có backup tự động
3. **Xóa nhầm dữ liệu** - Không có Point-in-Time Recovery (PITR)
4. **Lỗi migration** - Schema thay đổi làm mất dữ liệu

### Hạn chế MongoDB Atlas Free Tier:
- ❌ Không có backup tự động
- ❌ Không có Point-in-Time Recovery (PITR)
- ❌ Không có Snapshots
- ❌ Không có export file local tự động

---

## 🔧 CÁC PHƯƠNG PHÁP KHÔI PHỤC

### 1. Khôi phục từ Seed Scripts

#### **A. Khôi phục 1000+ sinh viên từ CSV**
```bash
cd backend
node scripts/seed_from_csv.js
```

**Dữ liệu tạo:**
- ✅ 1000+ sinh viên từ CSV file
- ✅ User + StudentProfile (đầy đủ)
- ✅ Khoa, Khoá, Lớp học
- ✅ 4 activities mẫu
- ✅ 400+ activity registrations

**Thời gian:** ~2-3 phút (tùy tốc độ internet)

**Output:**
```
✅ SEED DỮ LIỆU HOÀN TẤT!
📊 Thống kê:
   ✓ Sinh viên: 1000+
   ✓ Activities: 4
   ✓ Registrations: 400+
   ✓ Lớp học: 50+
```

#### **B. Tạo 1 sinh viên đầy đủ**
```bash
cd backend
node scripts/seed_single_student.js
```

**Dữ liệu tạo:**
- ✅ User + StudentProfile
- ✅ Activity Registrations (3 hoạt động)
- ✅ Activity Rejections (nếu bị từ chối)
- ✅ Attendance (nếu được duyệt)
- ✅ Evidence (2 bằng chứng)
- ✅ Notifications
- ✅ PVCD Records (hồ sơ rèn luyện)

**Sinh viên mẫu:**
- Mã: 102220095
- Tên: Nguyễn Quang Bình
- Giới tính: Nam
- Ngày sinh: 17/02/2004
- Địa chỉ: 82/123 Nguyễn Lương Bằng

#### **C. Tạo dữ liệu hoạt động mẫu**
```bash
cd backend
node scripts/seed_registration_status.js
```

**Dữ liệu tạo:**
- ✅ 2 Activities
  - AI Seminar
  - Machine Learning Workshop
- ✅ 2 Students
  - Nguyễn Văn An (102220001)
  - Trần Thị Bình (102220002) - Lớp trưởng
- ✅ 2 Activity Registrations
  - Student 102220001 → AI Seminar (Status: approved)
  - Student 102220002 → ML Workshop (Status: pending)

---

## 📊 CẤU TRÚC DỮ LIỆU SEED

### StudentProfile Fields
```javascript
{
  user_id: ObjectId,              // required
  student_number: "102220001",
  full_name: "Nguyễn Văn An",
  email: "102220001@sv1.dut.udn.vn",
  phone: "0932456001",            // random VN format
  gender: "Nam" / "Nữ",
  date_of_birth: Date,            // tính từ năm khoá
  student_image: "avatar_url",    // DiceBear URL (miễn phí)
  class_id: ObjectId,
  contact_address: "123 Đường ..., Thành phố",
  isClassMonitor: false
}
```

### Collections được tạo
- ✅ `user` - Tài khoản người dùng
- ✅ `student_profile` - Hồ sơ sinh viên
- ✅ `class` - Lớp học
- ✅ `falcuty` - Khoa
- ✅ `cohort` - Khoá học
- ✅ `activity` - Hoạt động
- ✅ `activity_registration` - Đăng ký hoạt động
- ✅ `activity_rejection` - Từ chối đăng ký
- ✅ `attendance` - Điểm danh
- ✅ `evidence` - Bằng chứng
- ✅ `notification` - Thông báo
- ✅ `notification_read` - Đã đọc thông báo
- ✅ `pvcd_record` - Hồ sơ rèn luyện

---

## 🚀 QUY TRÌNH KHÔI PHỤC CHI TIẾT

### Bước 1: Kiểm tra MongoDB Connection
```bash
# Kiểm tra file .env
cat backend/.env | grep MONGODB_URI

# Test connection
cd backend
node -e "require('./src/config/db.js').connectDB()"
```

### Bước 2: Backup dữ liệu hiện tại (nếu có)
```bash
# Export toàn bộ database
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/Community_Activity_Management" --out=./backup_$(date +%Y%m%d)

# Hoặc export từng collection
mongoexport --uri="mongodb+srv://..." --collection=student_profile --out=student_profile.json
```

### Bước 3: Chạy Seed Script
```bash
# Option 1: Khôi phục 1000+ sinh viên
node scripts/seed_from_csv.js

# Option 2: Tạo 1 sinh viên đầy đủ
node scripts/seed_single_student.js

# Option 3: Tạo dữ liệu hoạt động mẫu
node scripts/seed_registration_status.js
```

### Bước 4: Verify dữ liệu
```bash
# Test API endpoints
curl http://localhost:5000/api/student-profile

# Chi tiết sinh viên
curl http://localhost:5000/api/student-profile/102220001

# Hoạt động của sinh viên
curl http://localhost:5000/api/activities/my/activities
```

---

## 🖼️ SETUP STUDENT IMAGE

### Hiện tại (DiceBear - Miễn phí)
- Avatar URL: `https://avatars.dicebear.com/api/adventurer/{studentNumber}.svg`
- Không cần setup
- Tự động sinh cho mỗi sinh viên

### Tương lai (Cloudinary Upload)

#### 1. Setup Cloudinary
```
1. Tạo account miễn phí: https://cloudinary.com
2. Lấy Cloud Name từ dashboard
3. Thêm vào backend/.env:
   CLOUDINARY_CLOUD_NAME=your_cloud_name
```

#### 2. Frontend Upload (React)
```javascript
// .env
REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloud_name
REACT_APP_CLOUDINARY_UPLOAD_PRESET=unsigned_preset

// Upload component
const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET);
  
  const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData
  });
  const { secure_url } = await res.json();
  return secure_url;
};

// Gửi URL về backend
await updateStudentProfile({ student_image: secure_url });
```

#### 3. Backend Update Endpoint
```http
PATCH /api/student-profile/update-image
Body: { student_image: "https://res.cloudinary.com/..." }
```

---

## 📋 DANH SÁCH SEED SCRIPTS

| Script | Mục đích | Dữ liệu tạo | Thời gian |
|--------|----------|-------------|-----------|
| `seed_from_csv.js` | Khôi phục 1000+ SV | 1000+ SV, 4 activities, 400+ registrations | ~2-3 phút |
| `seed_single_student.js` | Tạo 1 SV đầy đủ | 1 SV với tất cả dữ liệu liên quan | ~10 giây |
| `seed_registration_status.js` | Dữ liệu hoạt động mẫu | 2 activities, 2 students, 2 registrations | ~5 giây |
| `seed_attendance_sessions.js` | Tạo sessions điểm danh | Activity + 2 sessions + QR codes | ~5 giây |
| `seed_notifications.js` | Tạo thông báo mẫu | Notifications cho users | ~5 giây |

---

## ⚠️ LƯU Ý QUAN TRỌNG

### 1. Không chạy seed trên production
- Seed scripts sẽ **XÓA** dữ liệu cũ
- Chỉ chạy trên database mới hoặc development

### 2. Chạy 1 lần duy nhất
- Mỗi script chỉ nên chạy 1 lần
- Nếu cần reset, xóa collections trước:
```bash
# Chỉ khi cần reset hoàn toàn
db.student_profile.deleteMany({})
db.activity_registration.deleteMany({})
db.activity.deleteMany({})
# ... và các collection khác
```

### 3. Password mặc định
- Password default: `default_password_123`
- User phải đổi lại khi đăng nhập lần đầu

### 4. Cloudinary setup
- Không bắt buộc ngay
- Có thể setup sau khi cần upload ảnh thật

---

## 🔄 EXPORT/IMPORT DỮ LIỆU

### Export toàn bộ database
```bash
# Export tất cả collections
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/Community_Activity_Management" --out=./backup_$(date +%Y%m%d)

# Export từng collection
mongoexport --uri="mongodb+srv://..." \
  --collection=student_profile \
  --out=student_profile.json \
  --jsonArray
```

### Import dữ liệu
```bash
# Import toàn bộ database
mongorestore --uri="mongodb+srv://..." ./backup_20250115

# Import từng collection
mongoimport --uri="mongodb+srv://..." \
  --collection=student_profile \
  --file=student_profile.json \
  --jsonArray
```

---

## 🛡️ PHÒNG NGỪA MẤT DỮ LIỆU

### 1. Backup định kỳ
```bash
# Tạo script backup tự động
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="mongodb+srv://..." --out=./backups/backup_$DATE

# Chạy hàng ngày với cron
# 0 2 * * * /path/to/backup.sh
```

### 2. Upgrade MongoDB Atlas
- **M2 trở lên** có backup tự động
- **M10 trở lên** có Point-in-Time Recovery (PITR)
- **M30 trở lên** có Snapshots

### 3. Git commit dữ liệu test
```bash
# Lưu seed scripts vào git
git add scripts/seed_*.js
git commit -m "Add seed scripts for data recovery"
```

### 4. Luôn hỏi trước khi chạy seed
- ❌ **KHÔNG** chạy seed script mà không hỏi
- ✅ **HỎI** trước khi xóa hoặc reset dữ liệu
- ✅ **BACKUP** trước khi thay đổi lớn

---

## 🐛 TROUBLESHOOTING

### Lỗi: Connection failed
```bash
# Kiểm tra MongoDB URI
cat backend/.env | grep MONGODB_URI

# Test connection
node -e "require('mongoose').connect(process.env.MONGODB_URI)"
```

### Lỗi: CSV file not found
```bash
# Kiểm tra file CSV có tồn tại
ls -la backend/scripts/*.csv

# Kiểm tra đường dẫn trong script
grep -n "csv" backend/scripts/seed_from_csv.js
```

### Lỗi: Duplicate key error
```bash
# Xóa dữ liệu cũ trước khi seed lại
mongo "mongodb+srv://..." --eval "db.student_profile.deleteMany({})"
```

### Lỗi: Out of memory
```bash
# Seed từng batch nhỏ
# Sửa script để seed 100 records mỗi lần
```

---

## 📊 VERIFY DỮ LIỆU SAU KHI KHÔI PHỤC

### Kiểm tra số lượng records
```javascript
// MongoDB shell
use Community_Activity_Management

db.student_profile.countDocuments()
db.activity.countDocuments()
db.activity_registration.countDocuments()
db.attendance.countDocuments()
```

### Kiểm tra dữ liệu mẫu
```bash
# API test
curl http://localhost:5000/api/student-profile/102220001
curl http://localhost:5000/api/activities
curl http://localhost:5000/api/activities/my/activities
```

---

## 📝 BÀI HỌC KINH NGHIỆM

### Từ sự cố mất dữ liệu (Nov 19, 2025):
1. ✅ **Luôn hỏi trước** khi chạy seed hoặc xóa dữ liệu
2. ✅ **Upgrade MongoDB** lên bản có backup (M2 trở lên)
3. ✅ **Export data định kỳ** nếu dùng free tier
4. ✅ **Git commit** dữ liệu test để có lịch sử
5. ✅ **Backup trước** khi thực hiện thay đổi lớn

---

## 🔗 TÀI LIỆU THAM KHẢO

### Files quan trọng
- `HANDOFF_DATA_RECOVERY.md` - Tài liệu khôi phục lần 1
- `HANDOFF_DATA_RECOVERY_2.md` - Tài liệu khôi phục lần 2
- `backend/scripts/seed_from_csv.js` - Script khôi phục từ CSV
- `backend/scripts/seed_single_student.js` - Script tạo 1 SV
- `backend/scripts/seed_registration_status.js` - Script tạo activities

### MongoDB Commands
```bash
# Xem tất cả collections
show collections

# Đếm documents
db.collection_name.countDocuments()

# Xem document mẫu
db.collection_name.findOne()

# Xóa tất cả documents
db.collection_name.deleteMany({})
```

---

## 📞 HỖ TRỢ

Nếu cần khôi phục thêm dữ liệu:
1. Kiểm tra file seed trong `backend/scripts/` folder
2. Nếu dữ liệu ở đó → chạy script tương ứng
3. Nếu không → tạo lại từ mô tả (kể lại dữ liệu)

**Chúc bạn khôi phục dữ liệu thành công! 🎉**

---

**Cập nhật lần cuối:** 2025-01-15  
**Phiên bản:** 2.0  
**Trạng thái:** ✅ Production Ready


