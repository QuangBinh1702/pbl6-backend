# 📋 PLAN THỰC HIỆN CÁC CHỨC NĂNG

## 📝 Tổng quan từ NotePBL.docx

### Các chức năng cần làm:

1. **Chức năng xem thống kê 1 hoạt động**
   - Load lần đầu sẽ có tổng hoạt động của hệ thống
   - Khi lọc sẽ hiện thông tin của hoạt động theo bộ lọc

2. **Chức năng lọc cho sinh viên**

3. **Chức năng lọc cho staff**

4. **Chức năng phân quyền**
   - Nhập username → hiển thị các quyền đang có của username đó
   - Admin tick thay đổi các action rồi lưu
   - Hoặc nếu là sinh viên thì admin có thể tick qua role tổ chức (chọn đơn vị tổ chức, chức vụ), sau đó chọn quyền rồi lưu → admin sẽ được thêm role và các permission

---

## 🔍 PHÂN TÍCH HIỆN TRẠNG

### ✅ Đã có:

1. **API thống kê hoạt động** (`GET /api/statistics/activity-dashboard`)
   - ✅ Tổng hoạt động
   - ✅ Hoạt động năm nay
   - ✅ Tăng trưởng so với năm trước
   - ❌ **THIẾU: Filter theo tiêu chí**

2. **API lọc hoạt động cho sinh viên** (`GET /api/activities/student/:student_id/filter`)
   - ✅ Filter theo status, field_id, org_unit_id, title
   - ⚠️ **CẦN KIỂM TRA: Bug filter (chọn 2 tiêu chí nhưng chỉ áp dụng 1)**

3. **API lọc hoạt động tổng quát** (`GET /api/activities/filter`)
   - ✅ Filter theo status, field_id, org_unit_id, title
   - ⚠️ **CẦN KIỂM TRA: Bug filter (chọn 2 tiêu chí nhưng chỉ áp dụng 1)**

4. **API phân quyền**
   - ✅ `GET /api/permissions/users/:userId` - Lấy quyền của user
   - ✅ `POST /api/permissions/users/:userId/grant/:permId` - Gán quyền
   - ✅ `POST /api/permissions/users/:userId/revoke/:permId` - Thu hồi quyền
   - ✅ `GET /api/permissions/users/:userId/check/:permId` - Kiểm tra quyền
   - ✅ `GET /api/users/:id/roles` - Lấy roles của user
   - ✅ `POST /api/users/:id/roles` - Gán role cho user
   - ❌ **THIẾU: UI để admin quản lý phân quyền theo username**
   - ❌ **THIẾU: Logic gán role tổ chức cho sinh viên (chọn đơn vị tổ chức, chức vụ)**

### ❌ Chưa có:

1. **API lọc hoạt động cho staff**
   - Chưa có endpoint riêng cho staff
   - Có thể dùng `/api/activities/filter` nhưng cần kiểm tra quyền

---

## 🐛 BUG CẦN SỬA

### Bug 1: Filter chỉ áp dụng 1 tiêu chí khi chọn nhiều tiêu chí

**Vị trí:** `backend/src/controllers/activity.controller.js`
- Function: `getActivitiesWithFilter` (dòng 1651-1741)
- Function: `getStudentActivitiesWithFilter` (dòng 1445-1649)

**Nguyên nhân có thể:**
1. Logic filter đang đúng (dùng nhiều `if` riêng biệt)
2. Có thể bug ở frontend (không gửi đủ params)
3. Có thể bug ở cách so sánh field_id/org_unit_id (so sánh string vs ObjectId)

**Cần kiểm tra:**
- Xem frontend có gửi đủ params không
- Xem logic so sánh field_id và org_unit_id có đúng không

---

## 📋 PLAN CHI TIẾT

### 🔧 BƯỚC 1: SỬA BUG FILTER (Ưu tiên cao)

**File:** `backend/src/controllers/activity.controller.js`

**Vấn đề:**
- Khi chọn nhiều tiêu chí filter (ví dụ: status + field_id), chỉ áp dụng 1 tiêu chí

**Giải pháp:**
1. Kiểm tra logic filter hiện tại
2. Sửa cách so sánh field_id và org_unit_id (đảm bảo so sánh đúng ObjectId)
3. Test với nhiều tiêu chí cùng lúc

**Code cần sửa:**
```javascript
// Dòng 1705-1721 trong getActivitiesWithFilter
// Đảm bảo logic filter đúng với nhiều tiêu chí
```

---

### 📊 BƯỚC 2: THÊM FILTER VÀO THỐNG KÊ HOẠT ĐỘNG

**File:** `backend/src/controllers/statistic.controller.js`

**Yêu cầu:**
- Load lần đầu: Hiển thị tổng hoạt động của hệ thống (đã có)
- Khi có filter: Hiển thị thống kê theo bộ lọc

**Giải pháp:**
1. Thêm query parameters vào `getActivityDashboard`:
   - `status` (optional)
   - `field_id` (optional)
   - `org_unit_id` (optional)
   - `start_date` (optional)
   - `end_date` (optional)

2. Áp dụng filter trước khi tính thống kê

**API mới:**
```
GET /api/statistics/activity-dashboard?status=chưa tổ chức&field_id=xxx
```

**Response:**
```json
{
  "data": {
    "totalActivities": 50,  // Tổng theo filter
    "activitiesThisYear": 30,  // Theo filter + năm nay
    "activitiesPreviousYear": 20,  // Theo filter + năm trước
    "growthPercentage": 50
  }
}
```

---

### 👨‍🎓 BƯỚC 3: KIỂM TRA VÀ SỬA LỌC CHO SINH VIÊN

**File:** `backend/src/controllers/activity.controller.js`
- Function: `getStudentActivitiesWithFilter`

**Kiểm tra:**
1. Logic filter có đúng không
2. Có bug gì không
3. Test với nhiều tiêu chí

**Sửa nếu cần:**
- Đảm bảo filter hoạt động đúng với nhiều tiêu chí
- Kiểm tra logic so sánh field_id và org_unit_id

---

### 👨‍💼 BƯỚC 4: TẠO CHỨC NĂNG LỌC CHO STAFF

**Yêu cầu:**
- Staff có thể lọc hoạt động theo các tiêu chí
- Có thể dùng API `/api/activities/filter` nhưng cần kiểm tra quyền

**Giải pháp:**
1. Kiểm tra xem `/api/activities/filter` có cần auth không
2. Nếu cần, thêm middleware checkPermission
3. Hoặc tạo endpoint riêng: `/api/activities/staff/filter`
4. Tạo UI test cho staff (file HTML mới hoặc thêm tab vào activity-filter-test.html)

**API:**
```
GET /api/activities/staff/filter?status=xxx&field_id=xxx&org_unit_id=xxx&title=xxx
```

**Middleware:**
- Auth required
- Check permission: `activity:read` hoặc `activity:view_overview`

---

### 🛡️ BƯỚC 5: HOÀN THIỆN CHỨC NĂNG PHÂN QUYỀN

**File hiện có:** `backend/public/test-permission.html`

**Yêu cầu:**
1. Nhập username → hiển thị các quyền đang có
2. Admin tick thay đổi các action rồi lưu
3. Nếu là sinh viên: Admin có thể tick qua role tổ chức
   - Hiện box chọn đơn vị tổ chức
   - Chọn chức vụ
   - Chọn quyền
   - Lưu → user được thêm role và các permission

**Giải pháp:**

#### 5.1. Tạo UI quản lý phân quyền theo username

**File mới:** `backend/public/admin-permission-management.html`

**Chức năng:**
1. Input username → tìm user
2. Hiển thị thông tin user:
   - Username, email, role hiện tại
   - Danh sách quyền hiện có (từ UserRole và UserActionOverride)
3. Form thay đổi quyền:
   - Danh sách tất cả actions (grouped by resource)
   - Checkbox cho mỗi action (checked nếu user có quyền)
   - Nút "Lưu thay đổi"

#### 5.2. Logic gán role tổ chức cho sinh viên

**API cần có:**
```
POST /api/users/:userId/roles/org-unit
Body: {
  role_id: "staff",
  org_unit_id: "xxx",
  position: "Chức vụ"
}
```

**Flow:**
1. Admin nhập username (sinh viên)
2. Chọn "Gán role tổ chức"
3. Hiện form:
   - Chọn đơn vị tổ chức (dropdown)
   - Chọn chức vụ (input hoặc dropdown)
   - Chọn quyền (checkboxes)
4. Lưu → Tạo UserRole với org_unit_id và position
5. Gán các permissions tương ứng

**File cần sửa:**
- `backend/src/controllers/user.controller.js` - Thêm logic gán role tổ chức
- `backend/src/routes/user.routes.js` - Thêm route mới

---

## 🎯 THỨ TỰ THỰC HIỆN

1. ✅ **BƯỚC 1: Sửa bug filter** (Ưu tiên cao nhất)
2. ✅ **BƯỚC 2: Thêm filter vào thống kê**
3. ✅ **BƯỚC 3: Kiểm tra lọc cho sinh viên**
4. ✅ **BƯỚC 4: Tạo lọc cho staff**
5. ✅ **BƯỚC 5: Hoàn thiện phân quyền**

---

## 📝 GHI CHÚ

- Tất cả các API cần có error handling đầy đủ
- Test với nhiều trường hợp edge case
- Đảm bảo security (check permission, validate input)
- UI cần responsive và user-friendly


