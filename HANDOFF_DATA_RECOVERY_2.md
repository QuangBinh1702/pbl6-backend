# 📋 Data Recovery & Setup Handoff - November 19, 2025 (Updated)

**Status**: ✅ Data Recovery Complete + Cloudinary Integration Ready  
**Issue**: Dữ liệu MongoDB bị xóa - Khôi phục từ CSV + tạo seed script hoàn chỉnh  
**Resolution**: Tạo 3 seed script với đầy đủ dữ liệu sinh viên, hoạt động, đăng ký

---

## 🔧 Seed Scripts

### 1. **seed_from_csv.js** (Khôi phục 1000+ sinh viên + hoạt động)
```bash
cd d:\pbl6\backend
node scripts/seed_from_csv.js
```

**Dữ liệu tạo:**
- ✓ 1000+ sinh viên từ CSV file
- ✓ User + StudentProfile (đầy đủ)
- ✓ Khoa, Khoá, Lớp học
- ✓ 4 activities mẫu
- ✓ 400+ activity registrations

**StudentProfile fields:**
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

### 2. **seed_single_student.js** (Tạo 1 sinh viên đầy đủ)
```bash
node scripts/seed_single_student.js
```

**Tạo sinh viên:**
- Mã: 102220095
- Tên: Nguyễn Quang Bình
- Giới tính: Nam
- Ngày sinh: 17/02/2004
- Địa chỉ: 82/123 Nguyễn Lương Bằng

**Dữ liệu liên quan:**
- ✓ User + StudentProfile
- ✓ Activity Registrations (3 hoạt động)
- ✓ Activity Rejections (nếu bị từ chối)
- ✓ Attendance (nếu được duyệt)
- ✓ Evidence (2 bằng chứng)
- ✓ Notifications
- ✓ PVCD Records (hồ sơ rèn luyện)

### 3. **seed_registration_status.js** (Sample data hoạt động)
```bash
node scripts/seed_registration_status.js
```

---

## 🖼️ Student Image Setup

### Hiện tại (DiceBear - Miễn phí)
- Avatar URL: `https://avatars.dicebear.com/api/adventurer/{studentNumber}.svg`
- Không cần setup
- Tự động sinh cho mỗi sinh viên

### Sau này (Cloudinary Upload - Frontend)

**1. Setup Cloudinary:**
```
1. Tạo account miễn phí: https://cloudinary.com
2. Lấy Cloud Name từ dashboard
3. Thêm vào backend/.env:
   CLOUDINARY_CLOUD_NAME=your_cloud_name
```

**2. Frontend Upload (React):**
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

**3. Backend Update Endpoint:**
```
PATCH /api/student-profile/update-image
Body: { student_image: "https://res.cloudinary.com/..." }
```

---

## 📊 Dữ liệu Chi Tiết

### Bảng tạo bởi seed_single_student.js
- ✅ user (102220095@sv1.dut.udn.vn)
- ✅ student_profile
- ✅ class (22T_DT2)
- ✅ falcuty (Công nghệ thông tin)
- ✅ cohort (2022)
- ✅ activity_registration (3 hoạt động)
- ✅ activity_rejection (nếu bị từ chối)
- ✅ attendance (nếu được duyệt)
- ✅ evidence (2 bằng chứng)
- ✅ notification (1 thông báo)
- ✅ notification_read (1 đã đọc)
- ✅ pvcd_record (hồ sơ rèn luyện)

---

## 🚀 Quy trình khôi phục dữ liệu

### Step 1: Chạy seed_from_csv.js
```bash
cd d:\pbl6\backend
node scripts/seed_from_csv.js
```
⏱️ Thời gian: ~2-3 phút (tùy tốc độ internet)

**Output:**
```
✅ SEED DỮ LIỆU HOÀN TẤT!
📊 Thống kê:
   ✓ Sinh viên: 1000+
   ✓ Activities: 4
   ✓ Registrations: 400+
   ✓ Lớp học: 50+
```

### Step 2: Chạy seed_single_student.js (optional)
```bash
node scripts/seed_single_student.js
```

Tạo 1 sinh viên đầy đủ (102220095 - Nguyễn Quang Bình) với tất cả dữ liệu liên quan.

### Step 3: Test dữ liệu
```bash
# Lấy danh sách sinh viên
GET http://localhost:5000/api/student-profile

# Chi tiết sinh viên
GET http://localhost:5000/api/student-profile/102220001

# Hoạt động của sinh viên
GET http://localhost:5000/api/activities/my/activities
```

---

## 📝 Những thay đổi so với lần trước

| Field | Thay đổi |
|-------|---------|
| enrollment_year | ❌ Xoá |
| student_image | ✅ Thêm (DiceBear URL) |
| email | ✅ @sv1.dut.udn.vn |
| phone | ✅ Format số Việt Nam |
| contact_address | ✅ Giữ nguyên |
| user_id | ✅ Tạo tự động |

---

## ⚠️ Lưu ý quan trọng

1. **Không nên chạy seed script trên production** (sẽ xóa dữ liệu cũ)
2. **Chạy 1 lần duy nhất** trên database mới
3. **Nếu cần reset**, xóa collections trước:
```bash
# Chỉ khi cần reset hoàn toàn
db.student_profile.deleteMany({})
db.activity_registration.deleteMany({})
# ... và các collection khác
```

4. **Cloudinary setup** không bắt buộc ngay - có thể làm sau
5. **Password default**: `default_password_123` - User phải đổi lại khi đăng nhập lần đầu

---

## 🔗 Deploy Production (Render)

**Server**: https://pbl6-backend-iy5q.onrender.com

Khi deploy:
- ✅ Dữ liệu CSV không upload lên server
- ✅ Seed script chạy local → MongoDB Atlas
- ✅ Student image: DiceBear (miễn phí, công khai)
- ⏳ Cloudinary: Setup sau nếu cần

---

## 📞 Contact

Nếu cần khôi phục hoặc sửa dữ liệu:
1. Chạy seed script tương ứng
2. Nếu lỗi → kiểm tra MongoDB connection
3. Nếu vẫn lỗi → xem log console

---

**Last Updated**: November 19, 2025  
**Status**: ✅ Ready for Production  
**Next Developer**: Hãy chạy seed script trước khi phát triển feature mới!
