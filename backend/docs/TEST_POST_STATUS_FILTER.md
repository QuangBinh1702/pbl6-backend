# Hướng dẫn Test Post Status Filter

## Tổng quan

Đã thêm tính năng lọc theo trạng thái đăng bài (post_status) vào API hoạt động. Trạng thái này cho biết hoạt động đã được đăng lên tờ rơi/thông báo hay chưa.

## Các thay đổi

### 1. Backend (Node.js/Express)

#### File: `src/controllers/activity.controller.js`

**Endpoints được cập nhật:**
- `GET /api/activities/filter` - Lọc tất cả hoạt động
- `GET /api/activities/student/:student_id/filter` - Lọc hoạt động của sinh viên

**Logic bổ sung:**
- Validate POST body với `status` (boolean)
- Lấy post status từ Post collection
- Filter activities theo post_status
- Thêm `post_status` vào response data

**Validation:**
```javascript
if (typeof req.body.status !== 'boolean') {
  return res.status(400).json({
    success: false,
    message: 'Invalid POST status. Must be boolean (true or false)'
  });
}
```

### 2. Frontend (HTML/JavaScript)

#### File: `public/activity-filter-test.html`

**UI Thay đổi:**
1. **Tab "Tất cả hoạt động"**
   - Thêm dropdown "Trạng thái Post" với 3 option:
     - `-- Tất cả --` (mặc định)
     - `Đã post` (true)
     - `Chưa post` (false)

2. **Tab "Hoạt động của sinh viên"**
   - Cập nhật "Trạng thái hoạt động" với các giá trị đúng
   - Thêm dropdown "Trạng thái Post" tương tự tab 1

3. **Tables**
   - Thêm cột "Post" hiển thị:
     - `✓ Đã` (màu xanh) nếu post_status = true
     - `✗ Chưa` (màu đỏ) nếu post_status = false

**Validation Frontend:**
```javascript
if (post_status && (post_status !== 'true' && post_status !== 'false')) {
  showError('all', 'Giá trị trạng thái post không hợp lệ');
  return;
}
```

## Hướng dẫn Test

### Test 1: Lọc hoạt động đã post (Tab "Tất cả hoạt động")

**Bước:**
1. Mở `activity-filter-test.html` trong trình duyệt
2. Click vào tab "Tất cả hoạt động"
3. Chọn "Đã post" từ dropdown "Trạng thái Post"
4. (Optional) Chọn các filter khác: Trạng thái, Lĩnh vực, Tổ chức, Tên
5. Click nút "🔍 Tìm kiếm"

**Kỳ vọng:**
- Kết quả chỉ hiển thị các hoạt động có `post_status = true`
- Cột "Post" hiển thị "✓ Đã" (xanh) cho tất cả kết quả
- Hiển thị JSON response dưới bảng

### Test 2: Lọc hoạt động chưa post

**Bước:**
1. Chọn "Chưa post" từ dropdown "Trạng thái Post"
2. Click "🔍 Tìm kiếm"

**Kỳ vọng:**
- Kết quả chỉ hiển thị các hoạt động có `post_status = false`
- Cột "Post" hiển thị "✗ Chưa" (đỏ) cho tất cả kết quả

### Test 3: Lọc hoạt động sinh viên

**Bước:**
1. Click tab "Hoạt động của sinh viên"
2. Nhập một student_id hợp lệ (bắt buộc)
3. Chọn "Đã post" hoặc "Chưa post" từ "Trạng thái Post"
4. Click "🔍 Tìm kiếm"

**Kỳ vọng:**
- Hiển thị hoạt động của sinh viên với post_status tương ứng
- Cột "Post" hiển thị trạng thái đúng

### Test 4: Kết hợp filter

**Bước:**
1. Tab "Tất cả hoạt động"
2. Chọn:
   - Trạng thái: "Đã tổ chức"
   - Trạng thái Post: "Đã post"
   - Lĩnh vực: (ID hoặc tên)
3. Click "🔍 Tìm kiếm"

**Kỳ vọng:**
- Kết quả lọc theo cả hai điều kiện
- Chỉ hiển thị hoạt động "Đã tổ chức" VÀ "Đã post"

### Test 5: Reset Form

**Bước:**
1. Nhập các filter
2. Click "🔄 Reset"

**Kỳ vọng:**
- Tất cả dropdown và input được xóa trắng
- Kết quả tìm kiếm bị ẩn

## API Request/Response Examples

### Request 1: Lọc theo post_status = true

```bash
curl -X POST https://pbl6-backend-iy5q.onrender.com/api/activities/filter \
  -H "Content-Type: application/json" \
  -d '{"status": true}'
```

### Request 2: Lọc theo post_status + trạng thái

```bash
curl -X POST https://pbl6-backend-iy5q.onrender.com/api/activities/filter?status=chờ+duyệt \
  -H "Content-Type: application/json" \
  -d '{"status": true}'
```

### Response Format

```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "title": "Hoạt động A",
      "status": "đã tổ chức",
      "post_status": true,
      "field_id": { "_id": "...", "name": "Lĩnh vực" },
      "org_unit_id": { "_id": "...", "name": "Tổ chức" },
      "start_time": "2024-01-15T08:00:00Z",
      "location": "Địa điểm",
      ...
    }
  ],
  "count": 1
}
```

## Validation Rules

### Frontend Validation

1. **post_status** phải là "true" hoặc "false" (string)
2. Nếu không chọn, không gửi POST body

### Backend Validation

1. **POST body status** phải là boolean (true/false)
2. Bất kỳ field nào khác sẽ log warning

## Error Handling

### Error 1: Invalid POST body

```json
{
  "success": false,
  "message": "Invalid POST status. Must be boolean (true or false) indicating if data has been posted"
}
```

**Lý do:** Gửi `{"status": "true"}` (string) thay vì `{"status": true}` (boolean)

### Error 2: Missing student_id

```json
{
  "success": false,
  "message": "Vui lòng nhập ID sinh viên"
}
```

**Lý do:** Không nhập student_id ở tab "Hoạt động của sinh viên"

## Kiểm tra Log Backend

Mở console backend để xem logs:

```
[Filter Activities] POST Status Filter: true
[Filter Activities] POST Status Filter: false
[Filter Student Activities] POST Status Filter: true
```

## Cách hoạt động

### Luồng xử lý POST Status Filter

1. **Frontend gửi request:**
   - Nếu chọn post_status, gửi POST request với `{"status": boolean}`
   - Nếu không chọn, gửi GET request bình thường

2. **Backend xử lý:**
   - Kiểm tra request body có field `status` không
   - Validate nó là boolean
   - Lấy tất cả Posts từ database
   - Tạo map: `activity_id -> post_status`
   - Add `post_status` vào mỗi activity
   - Filter activities theo `post_status`

3. **Frontend hiển thị:**
   - Render cột "Post" với badge (✓ Đã/✗ Chưa)
   - Hiển thị JSON response đầy đủ

## Troubleshooting

### Vấn đề 1: Không thấy cột "Post"

**Giải pháp:** 
- Xóa cache browser (Ctrl+Shift+Del)
- Reload trang (Ctrl+R)
- Kiểm tra console (F12) có lỗi không

### Vấn đề 2: Lọc không hoạt động

**Giải pháp:**
- Kiểm tra console backend có message `POST Status Filter` không
- Kiểm tra database có Posts không
- Verify activity_id trong Post collection tồn tại

### Vấn đề 3: "Invalid POST status" error

**Giải pháp:**
- Kiểm tra giá trị dropdown có phải "true" hoặc "false" không
- Inspect Network tab (F12) xem POST body gửi đi

## Notes

- Post model có field `status` (boolean): false = chưa đăng, true = đã đăng
- Filter hoạt động cùng với các filter khác (status, field_id, org_unit_id, title)
- Hiện tại backend không tự động tạo Post khi activity được tạo, phải tạo thủ công qua API
