# 🎨 Ví Dụ Giao Diện Hiển Thị Quyền

## Giao Diện Khi Load Quyền Của Một Sinh Viên

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                       📋 QUẢN LÝ QUYỀN HẠN NGƯỜI DÙNG                       ║
║                                                                  [X Close]    ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  📍 Chọn Người Dùng:   [507f1f77bcf86cd799439011..................] [Tải]   ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  ┌─────────────────────────────────────────────────────────────────────┐   ║
║  │ 👤 Nguyễn Văn A                                                      │   ║
║  │ ID: 507f1f77bcf86cd799439011                                        │   ║
║  │                                                                      │   ║
║  │ Các Vai Trò: [student] [staff]                                      │   ║
║  │                                                                      │   ║
║  │ 📊 Tổng Quyền: 89  │ Có Quyền: 55  │ Đã Tùy Chỉnh: 3               │   ║
║  └─────────────────────────────────────────────────────────────────────┘   ║
║                                                                              ║
║  ┌─ ACTIVITY - Quản Lý Hoạt Động          [5 / 8 quyền] ▼                 ║
║  │                                                                          ║
║  │  ☑ Xem Hoạt Động         [READ]    Via Role  ✓ Granted                  ║
║  │     Xem danh sách và chi tiết hoạt động                                 ║
║  │                                                                          ║
║  │  ☑ Tạo Hoạt Động        [CREATE]   ✚ Added  ✓ Granted                  ║
║  │     Tạo hoạt động mới                                                   ║
║  │                                                                          ║
║  │  ☑ Cập Nhật Hoạt Động   [UPDATE]   Via Role  ✓ Granted                  ║
║  │     Sửa thông tin hoạt động                                             ║
║  │                                                                          ║
║  │  ☐ Xóa Hoạt Động        [DELETE]             ✗ Denied                   ║
║  │     Xóa hoạt động                                                       ║
║  │                                                                          ║
║  │  ☐ Duyệt Hoạt Động      [APPROVE]   ✕ Removed  ✗ Denied                ║
║  │     Chấp thuận hoạt động                                                ║
║  │                                                                          ║
║  │  ☐ Từ Chối Hoạt Động    [REJECT]             ✗ Denied                   ║
║  │     Hủy bỏ hoạt động                                                    ║
║  │                                                                          ║
║  │  ☐ Hoàn Thành Hoạt Động [COMPLETE]          ✗ Denied                   ║
║  │     Đánh dấu hoạt động đã hoàn thành                                    ║
║  │                                                                          ║
║  │  ☐ Xuất Báo Cáo         [EXPORT]             ✗ Denied                   ║
║  │     Xuất dữ liệu hoạt động                                              ║
║  │                                                                          ║
║  └─────────────────────────────────────────────────────────────────────────┘
║
║  ┌─ USER - Quản Lý Người Dùng             [1 / 6 quyền] ▼                  ║
║  │                                                                          ║
║  │  ☑ Xem Người Dùng       [READ]    Via Role  ✓ Granted                   ║
║  │     Xem danh sách người dùng                                            ║
║  │                                                                          ║
║  │  ☐ Tạo Người Dùng       [CREATE]            ✗ Denied                    ║
║  │     Tạo tài khoản mới                                                   ║
║  │                                                                          ║
║  │  ☐ Cập Nhật Người Dùng  [UPDATE]            ✗ Denied                    ║
║  │     Sửa thông tin tài khoản                                             ║
║  │                                                                          ║
║  │  ☐ Xóa Người Dùng       [DELETE]            ✗ Denied                    ║
║  │     Xóa tài khoản                                                       ║
║  │                                                                          ║
║  │  ☐ Khóa Tài Khoản       [LOCK]              ✗ Denied                    ║
║  │     Khóa/cấm truy cập                                                   ║
║  │                                                                          ║
║  │  ☐ Mở Khóa Tài Khoản    [UNLOCK]            ✗ Denied                    ║
║  │     Mở khóa tài khoản                                                   ║
║  │                                                                          ║
║  └─────────────────────────────────────────────────────────────────────────┘
║
║  ┌─ ATTENDANCE - Điểm Danh                 [2 / 4 quyền] ▼                 ║
║  │                                                                          ║
║  │  ☑ Quét Điểm Danh      [SCAN]    Via Role  ✓ Granted                    ║
║  │     Quét QR code điểm danh                                              ║
║  │                                                                          ║
║  │  ☑ Xem Điểm Danh       [READ]    Via Role  ✓ Granted                    ║
║  │     Xem lịch sử điểm danh                                               ║
║  │                                                                          ║
║  │  ☐ Xác Nhận Điểm Danh  [VERIFY]            ✗ Denied                     ║
║  │     Xác nhận/phê duyệt điểm danh                                        ║
║  │                                                                          ║
║  │  ☐ Xuất Báo Cáo        [EXPORT]            ✗ Denied                     ║
║  │     Xuất dữ liệu điểm danh                                              ║
║  │                                                                          ║
║  └─────────────────────────────────────────────────────────────────────────┘
║
║  ▶ EVIDENCE - Minh Chứng                   [1 / 5 quyền]                   ║
║
║  ▶ REPORT - Báo Cáo                        [0 / 3 quyền]                   ║
║
║  ▶ CLASS - Lớp Học                         [0 / 7 quyền]                   ║
║
║  ▶ PVCD_RECORD - Điểm Rèn Luyện            [0 / 5 quyền]                   ║
║
║  ... (còn 15 resource khác)
║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  [💾 Lưu Thay Đổi]  [✕ Hủy]  ← (3 thay đổi chưa lưu)                      ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 📊 Giải Thích Chi Tiết Các Phần Tử

### 1️⃣ User Info Header
```
👤 Nguyễn Văn A
ID: 507f1f77bcf86cd799439011

Các Vai Trò: [student] [staff]

📊 Tổng Quyền: 89  │ Có Quyền: 55  │ Đã Tùy Chỉnh: 3
```
- **Tên người dùng**: Hiển thị rõ ràng
- **ID**: MongoDB ID để tham khảo
- **Vai Trò**: Badges show all roles of user
- **Thống kê**:
  - **Tổng Quyền (89)**: Tất cả actions có sẵn trong system
  - **Có Quyền (55)**: User thực sự có (từ role + override)
  - **Đã Tùy Chỉnh (3)**: Số quyền được override (cấp thêm hoặc thu hồi)

### 2️⃣ Resource Group Header
```
┌─ ACTIVITY - Quản Lý Hoạt Động          [5 / 8 quyền] ▼
```
- **Resource Name**: "ACTIVITY" (code)
- **Description**: "Quản Lý Hoạt Động" (Vietnamese)
- **Count**: "5 / 8 quyền" = 5 quyền có, 8 quyền tổng cộng
- **Toggle Arrow**: ▼ (expanded) / ▶ (collapsed)

### 3️⃣ Mỗi Action Row

#### Trường Hợp 1: Có Quyền Từ Role
```
☑ Xem Hoạt Động         [READ]    Via Role  ✓ Granted
```
- **☑ (checkbox)**: Được check (enabled)
- **Tên**: "Xem Hoạt Động" (Vietnamese name)
- **Code**: "[READ]" (technical action code)
- **Badge**: "Via Role" (blue) - quyền từ role
- **Status**: "✓ Granted" (green) - có quyền

#### Trường Hợp 2: Được Admin Cấp Thêm (Override GRANT)
```
☑ Tạo Hoạt Động        [CREATE]   ✚ Added  ✓ Granted
```
- **☑ (checkbox)**: Được check
- **Tên**: "Tạo Hoạt Động"
- **Code**: "[CREATE]"
- **Badge**: "✚ Added" (orange) - được admin cấp thêm
- **Status**: "✓ Granted" (green)

#### Trường Hợp 3: Admin Thu Hồi (Override REVOKE)
```
☐ Duyệt Hoạt Động      [APPROVE]   ✕ Removed  ✗ Denied
```
- **☐ (checkbox)**: Không check (disabled)
- **Tên**: "Duyệt Hoạt Động"
- **Code**: "[APPROVE]"
- **Badge**: "✕ Removed" (red) - bị admin thu hồi
- **Status**: "✗ Denied" (red) - không có quyền

#### Trường Hợp 4: Không Có Quyền
```
☐ Xóa Hoạt Động        [DELETE]             ✗ Denied
```
- **☐ (checkbox)**: Không check
- **Tên**: "Xóa Hoạt Động"
- **Code**: "[DELETE]"
- **Badge**: (không có) - không có override
- **Status**: "✗ Denied" (red) - không có quyền

### 4️⃣ Description (tùy chọn)
```
    Xem danh sách và chi tiết hoạt động
```
- Mô tả chi tiết về chức năng
- Giúp admin hiểu rõ quyền này dùng để làm gì

---

## 🔄 Tương Tác Người Dùng

### Khi Admin Click Checkbox

**Trước (Không Có Quyền):**
```
☐ Xóa Hoạt Động        [DELETE]             ✗ Denied
```

**Admin Click Checkbox:**
```
☑ Xóa Hoạt Động        [DELETE]   ✚ Added  ✓ Granted
```
→ Row chuyển sang màu vàng (unsaved)
→ Counter tăng: "(3 thay đổi chưa lưu)"

**Sau Khi Lưu:**
```
✅ Success! Updated 1 permission
☑ Xóa Hoạt Động        [DELETE]   ✚ Added  ✓ Granted
```
→ Row trở lại màu trắng
→ Counter reset

---

## 💡 Các Màu Sắc & Biểu Tượng

| Phần Tử | Màu | Ý Nghĩa |
|--------|-----|---------|
| Badge "Via Role" | 🔵 Blue | Quyền từ role |
| Badge "✚ Added" | 🟠 Orange | Được cấp thêm |
| Badge "✕ Removed" | 🔴 Red | Bị thu hồi |
| Status "✓ Granted" | 🟢 Green | Có quyền |
| Status "✗ Denied" | 🔴 Red | Không có |
| Row unsaved | 🟨 Yellow | Chưa lưu |
| Checkbox ☑ | Checked | Có quyền |
| Checkbox ☐ | Unchecked | Không có |

---

## 📱 Giao Diện Trên Mobile

```
╔═══════════════════════════════════╗
║ 📋 Quản Lý Quyền         [X]      ║
╠═══════════════════════════════════╣
║ Chọn user:  [ID...........]  [📤] ║
╠═══════════════════════════════════╣
║ 👤 Nguyễn Văn A                  ║
║ ID: 507f1f77...                  ║
║ Vai Trò: [student] [staff]       ║
║ 📊 89 | 55 | 3                   ║
╠═══════════════════════════════════╣
║ ▼ ACTIVITY      [5/8]            ║
║  ☑ Xem [READ] Via Role  ✓        ║
║  ☑ Tạo [CREATE] ✚ Added ✓       ║
║  ☑ Sửa [UPDATE] Via Role ✓      ║
║  ☐ Xóa [DELETE]         ✗       ║
║  ☐ Duyệt [APPROVE] ✕ ✗         ║
║                                  ║
║ ▼ USER         [1/6]             ║
║  ☑ Xem [READ] Via Role  ✓        ║
║  ☐ Tạo [CREATE]         ✗       ║
║  ☐ Sửa [UPDATE]         ✗       ║
║                                  ║
║ ▶ ATTENDANCE   [2/4]             ║
║ ▶ EVIDENCE     [1/5]             ║
║ ... more                          ║
╠═══════════════════════════════════╣
║ [💾 Lưu] [✕ Hủy]  (3 changes)   ║
╚═══════════════════════════════════╝
```

---

## 🎯 Tóm Tắt

**Giao diện hiển thị:**
1. ✅ Thông tin người dùng + vai trò
2. ✅ Thống kê tổng quát
3. ✅ Danh sách 20+ resource
4. ✅ Mỗi resource có 3-8 actions
5. ✅ Mỗi action có:
   - Checkbox (toggle)
   - Tên tiếng Việt
   - Code kỹ thuật
   - Badge (via role / override)
   - Status (✓/✗)
   - Description (tùy chọn)
6. ✅ Tracked changes indicator
7. ✅ Save/Cancel buttons

**Màu sắc & biểu tượng:**
- 🔵 Blue = Via Role
- 🟠 Orange = Override
- 🟢 Green = Granted
- 🔴 Red = Denied
- 🟨 Yellow = Unsaved

**Trực quan & dễ sử dụng!** 🎉
