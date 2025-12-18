# 📋 Cách Các Quyền Được Phân Chia & Hiển Thị Trên UI

## 🎯 Tổng Quan

Các quyền sẽ được **phân nhóm theo Resource** (lĩnh vực) và mỗi resource sẽ hiển thị danh sách các Action (hành động).

---

## 📊 Cấu Trúc Phân Chia

```
┌─────────────────────────────────────────────────────────────┐
│ PERMISSION ADMIN PANEL                                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ Người dùng: Nguyễn Văn A                                    │
│ ID: 507f1f77bcf86cd799439011                               │
│ Vai trò: [student] [staff]                                  │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ ▼ ACTIVITY (Quản lý hoạt động)              [3/8 quyền]   │
│   ├─ ☑ Xem hoạt động         [READ]  Via Role   ✓         │
│   ├─ ☑ Tạo hoạt động        [CREATE] ✚ Added   ✓         │
│   ├─ ☐ Cập nhật hoạt động   [UPDATE] ✕ Removed ✗         │
│   ├─ ☐ Xóa hoạt động        [DELETE]           ✗         │
│   ├─ ☐ Duyệt hoạt động      [APPROVE]          ✗         │
│   ├─ ☐ Từ chối hoạt động    [REJECT]           ✗         │
│   ├─ ☐ Hoàn thành hoạt động [COMPLETE]         ✗         │
│   └─ ☐ Xuất báo cáo          [EXPORT]           ✗         │
│                                                               │
│ ▼ USER (Quản lý người dùng)                 [2/6 quyền]   │
│   ├─ ☑ Xem người dùng        [READ]  Via Role   ✓         │
│   ├─ ☐ Tạo người dùng        [CREATE]           ✗         │
│   ├─ ☐ Cập nhật người dùng   [UPDATE]           ✗         │
│   ├─ ☐ Xóa người dùng        [DELETE]           ✗         │
│   ├─ ☐ Khóa tài khoản        [LOCK]             ✗         │
│   └─ ☐ Mở khóa tài khoản     [UNLOCK]           ✗         │
│                                                               │
│ ▼ ATTENDANCE (Điểm danh)                    [2/4 quyền]   │
│   ├─ ☑ Quét điểm danh        [SCAN]  Via Role   ✓         │
│   ├─ ☑ Xem điểm danh         [READ]  Via Role   ✓         │
│   ├─ ☐ Xác nhận điểm danh    [VERIFY]           ✗         │
│   └─ ☐ Xuất báo cáo          [EXPORT]           ✗         │
│                                                               │
│ ▶ EVIDENCE (Minh chứng)                     [0/5 quyền]   │
│                                                               │
│ ▶ REPORT (Báo cáo)                          [0/3 quyền]   │
│                                                               │
│ ▶ CLASS (Lớp học)                           [0/7 quyền]   │
│                                                               │
│ ... (còn nhiều resource khác)                               │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│ [💾 Lưu thay đổi] [✕ Hủy]  (3 thay đổi chưa lưu)          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔢 Các Resource (Lĩnh Vực)

Các quyền được phân thành những resource sau:

### 1. **activity** - Quản lý hoạt động
```
- Xem hoạt động (READ)
- Tạo hoạt động (CREATE)
- Cập nhật hoạt động (UPDATE)
- Xóa hoạt động (DELETE)
- Duyệt hoạt động (APPROVE)
- Từ chối hoạt động (REJECT)
- Hoàn thành hoạt động (COMPLETE)
- Xuất báo cáo (EXPORT)
```

### 2. **user** - Quản lý người dùng
```
- Xem người dùng (READ)
- Tạo người dùng (CREATE)
- Cập nhật người dùng (UPDATE)
- Xóa người dùng (DELETE)
- Khóa tài khoản (LOCK)
- Mở khóa tài khoản (UNLOCK)
```

### 3. **attendance** - Điểm danh
```
- Quét điểm danh (SCAN)
- Xem điểm danh (READ)
- Xác nhận điểm danh (VERIFY)
- Xuất báo cáo (EXPORT)
```

### 4. **evidence** - Minh chứng
```
- Nộp minh chứng (SUBMIT)
- Xem minh chứng (READ)
- Duyệt minh chứng (APPROVE)
- Từ chối minh chứng (REJECT)
- Xóa minh chứng (DELETE)
```

### 5. **report** - Báo cáo
```
- Xem tổng quan (VIEW_OVERVIEW)
- Xem chi tiết (VIEW_DETAIL)
- Xuất báo cáo (EXPORT)
```

### 6. **class** - Lớp học
```
- Tạo lớp (CREATE)
- Xem lớp (READ)
- Cập nhật lớp (UPDATE)
- Xóa lớp (DELETE)
- Quản lý sinh viên (MANAGE_STUDENTS)
- Điểm danh (ATTENDANCE)
- Báo cáo (REPORT)
```

### 7. **pvcd_record** - Điểm rèn luyện
```
- Tạo điểm rèn luyện (CREATE)
- Xem điểm rèn luyện (READ)
- Cập nhật điểm rèn luyện (UPDATE)
- Xóa điểm rèn luyện (DELETE)
- Điều chỉnh điểm rèn luyện (ADJUST)
```

### 8. **activity_registration** - Đăng ký hoạt động
```
- Tạo đăng ký (CREATE)
- Xem đăng ký (READ)
- Duyệt đăng ký (APPROVE)
- Từ chối đăng ký (REJECT)
- Hủy đăng ký (CANCEL)
```

### 9. **student_feedback** - Phản hồi sinh viên
```
- Nộp phản hồi (SUBMIT)
- Xem phản hồi (READ)
- Xóa phản hồi (DELETE)
```

### 10. **student_profile** - Hồ sơ sinh viên
```
- Tạo hồ sơ (CREATE)
- Xem hồ sơ (READ)
- Cập nhật hồ sơ (UPDATE)
- Xóa hồ sơ (DELETE)
```

### 11. **staff_profile** - Hồ sơ cán bộ
```
- Tạo hồ sơ (CREATE)
- Xem hồ sơ (READ)
- Cập nhật hồ sơ (UPDATE)
- Xóa hồ sơ (DELETE)
```

### 12. **student_cohort** - Sinh viên theo khóa
```
- Tạo liên kết (CREATE)
- Xem liên kết (READ)
- Xóa liên kết (DELETE)
```

### 13. **cohort** - Khóa học
```
- Tạo khóa (CREATE)
- Xem khóa (READ)
- Cập nhật khóa (UPDATE)
- Xóa khóa (DELETE)
```

### 14. **faculty** - Khoa
```
- Tạo khoa (CREATE)
- Xem khoa (READ)
- Cập nhật khoa (UPDATE)
- Xóa khoa (DELETE)
```

### 15. **org_unit** - Đơn vị tổ chức
```
- Tạo đơn vị (CREATE)
- Xem đơn vị (READ)
- Cập nhật đơn vị (UPDATE)
- Xóa đơn vị (DELETE)
```

### 16. **field** - Lĩnh vực
```
- Tạo lĩnh vực (CREATE)
- Xem lĩnh vực (READ)
- Cập nhật lĩnh vực (UPDATE)
- Xóa lĩnh vực (DELETE)
```

### 17. **post** - Bài đăng
```
- Tạo bài đăng (CREATE)
- Xem bài đăng (READ)
- Cập nhật bài đăng (UPDATE)
- Xóa bài đăng (DELETE)
```

### 18. **activity_eligibility** - Điều kiện tham gia
```
- Tạo điều kiện (CREATE)
- Xem điều kiện (READ)
- Cập nhật điều kiện (UPDATE)
- Xóa điều kiện (DELETE)
```

### 19. **notification** - Thông báo
```
- Tạo thông báo (CREATE)
- Xem thông báo (READ)
- Cập nhật thông báo (UPDATE)
- Xóa thông báo (DELETE)
```

### 20. **role** - Vai trò
```
- Tạo vai trò (CREATE)
- Xem vai trò (READ)
- Cập nhật vai trò (UPDATE)
- Xóa vai trò (DELETE)
```

### 21. **permission** - Phân quyền
```
- Tạo quyền (CREATE)
- Xem quyền (READ)
- Cập nhật quyền (UPDATE)
- Xóa quyền (DELETE)
```

---

## 🎨 Cách Mỗi Quyền Được Hiển Thị

### Mỗi hàng quyền gồm:

```
☑ Xem hoạt động    [READ]  Via Role  ✓ Granted
│  │                │       │        │
│  │                │       │        └─ Trạng thái: ✓ Granted (có quyền)
│  │                │       │                      ✗ Denied (không có)
│  │                │       └─ Badge: "Via Role" (từ role)
│  │                │                "✚ Added" (được cấp thêm)
│  │                │                "✕ Removed" (bị thu hồi)
│  │                │
│  │                └─ Action code: READ, CREATE, UPDATE, DELETE, etc.
│  │
│  └─ Tên chức năng: "Xem hoạt động" (tiếng Việt)
│
└─ Checkbox: ☑ (checked/enabled) hoặc ☐ (unchecked/disabled)
```

### Ví dụ Chi Tiết:

**Quyền 1: Có từ Role**
```
☑ Xem hoạt động    [READ]  Via Role    ✓ Granted
- Checkbox: checked (✓)
- Tên: "Xem hoạt động"
- Code: [READ]
- Badge: "Via Role" (có sẵn từ role sinh viên)
- Status: ✓ (có quyền)
```

**Quyền 2: Được Cấp Thêm (Override)**
```
☑ Tạo hoạt động    [CREATE]  ✚ Added    ✓ Granted
- Checkbox: checked (✓)
- Tên: "Tạo hoạt động"
- Code: [CREATE]
- Badge: "✚ Added" (được admin cấp thêm)
- Status: ✓ (có quyền)
```

**Quyền 3: Bị Thu Hồi (Override)**
```
☐ Cập nhật hoạt động  [UPDATE]  ✕ Removed  ✗ Denied
- Checkbox: unchecked (✗)
- Tên: "Cập nhật hoạt động"
- Code: [UPDATE]
- Badge: "✕ Removed" (bị admin thu hồi)
- Status: ✗ (không có quyền)
```

**Quyền 4: Không Có**
```
☐ Xóa hoạt động    [DELETE]           ✗ Denied
- Checkbox: unchecked (✗)
- Tên: "Xóa hoạt động"
- Code: [DELETE]
- Badge: (không có - không từ role, không override)
- Status: ✗ (không có quyền)
```

---

## 👤 Ví Dụ Thực Tế: Sinh Viên Tham Gia Tổ Chức

### Trường Hợp: Nguyễn Văn A
- Role: **student** (sinh viên)
- Role: **staff** (nhân viên tổ chức)

### Quyền sẽ được **kết hợp từ cả 2 role**:

```
Student Role có:
├─ activity:READ
├─ activity_registration:CREATE
└─ evidence:SUBMIT

Staff Role có:
├─ activity:CREATE
├─ activity:UPDATE
├─ activity:APPROVE
├─ evidence:READ
└─ evidence:APPROVE

Kết quả sau khi kết hợp (UNION):
├─ activity:READ         ← từ Student
├─ activity_registration:CREATE  ← từ Student
├─ evidence:SUBMIT       ← từ Student
├─ activity:CREATE       ← từ Staff
├─ activity:UPDATE       ← từ Staff
├─ activity:APPROVE      ← từ Staff
├─ evidence:READ         ← từ Staff
└─ evidence:APPROVE      ← từ Staff

Admin có thể:
├─ Cấp thêm: activity:DELETE (không có ở role nào)
└─ Thu hồi: activity:UPDATE (từ staff role)
```

---

## 🔄 Khi Cấp/Thu Hồi Quyền

### Cấp Thêm Quyền:

```
Trước:
☐ Xóa hoạt động    [DELETE]           ✗ Denied

Admin click checkbox → chuyển thành:
☑ Xóa hoạt động    [DELETE]  ✚ Added  ✓ Granted

Lưu → System tạo override: is_granted = true
```

### Thu Hồi Quyền:

```
Trước:
☑ Duyệt hoạt động  [APPROVE]  Via Role  ✓ Granted

Admin click checkbox → chuyển thành:
☐ Duyệt hoạt động  [APPROVE]  ✕ Removed  ✗ Denied

Lưu → System tạo override: is_granted = false
```

---

## 📊 Tóm Tắt Thông Tin

UI sẽ hiển thị:

| Thông Tin | Vị Trí | Chi Tiết |
|-----------|--------|---------|
| **User Info** | Top | Tên, ID, Roles |
| **Summary** | Under Info | Tổng quyền, Có quyền, Đã tùy chỉnh |
| **Resources** | Main | Danh sách 20+ resource |
| **Actions** | Mỗi Resource | Danh sách hành động của resource |
| **Status** | Mỗi Action | ✓ Granted hoặc ✗ Denied |
| **Source** | Badge | Via Role hoặc Override (✚/✕) |
| **Toggle** | Checkbox | Click để thay đổi |
| **Changes** | Bottom | Counter + Lưu/Hủy button |

---

## 🎯 Số Lượng Quyền

- **Tổng Actions**: 80-90 quyền
- **Resources**: 20+ lĩnh vực
- **Actions/Resource**: 3-8 quyền mỗi lĩnh vực
- **Student Role**: ~15 quyền
- **Staff Role**: ~50 quyền
- **Admin Role**: ~80 quyền

---

## 💡 Cách Sử Dụng

1. **Xem**: Mở permission panel → chọn user → bấm "Tải quyền"
2. **Lọc**: Có thể collapse/expand resource để xem chi tiết
3. **Sửa**: Click checkbox để thay đổi trạng thái
4. **Lưu**: Bấm "💾 Lưu thay đổi" để lưu tất cả thay đổi
5. **Hủy**: Bấm "✕ Hủy" nếu muốn từ bỏ thay đổi

---

## ✅ Kết Luận

Quyền sẽ được phân chia theo **Resource** (lĩnh vực), mỗi resource chứa nhiều **Action** (hành động). Mỗi action sẽ hiển thị:
- **Tên chức năng** (Tiếng Việt, dễ hiểu)
- **Mã hành động** (Code, kỹ thuật)
- **Trạng thái** (Có hoặc Không)
- **Nguồn** (Từ role hay override)
- **Toggle** (Click để thay đổi)

Tất cả đều được thiết kế để **dễ sử dụng** và **trực quan**! 🎉
