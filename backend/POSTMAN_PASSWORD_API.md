# 📧 Hướng Dẫn Test Password APIs trên Postman

## 📋 Tổng Quan

Collection Postman đã được cập nhật với các API liên quan đến mật khẩu. Bạn có thể test trực tiếp trên Postman.

## 🚀 Quick Start

### Bước 1: Import Collection

1. Mở Postman
2. Click **Import** (góc trên bên trái)
3. Chọn file `Postman_Collection_v2.json`
4. Collection sẽ xuất hiện trong sidebar

### Bước 2: Setup Environment

Collection đã có sẵn variables, bạn có thể tạo Environment mới để quản lý dễ hơn:

1. Click **Environments** trong sidebar
2. Click **+** để tạo environment mới
3. Thêm các variables:
   - `baseUrl`: `http://localhost:5000`
   - `token`: để trống (sẽ tự động fill sau khi login)
4. Save và chọn environment vừa tạo

---

## 🔐 Test Authentication & Password APIs

### 1️⃣ Login để lấy Token

**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "username": "alice",
  "password": "123456789"
}
```

**Steps:**
1. Chọn request **"Login - Student"**
2. Click **Send**
3. Copy `token` từ response
4. Paste vào environment variable `token`

**Expected Response (Success):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "username": "alice",
    "roles": [...]
  }
}
```

---

### 2️⃣ Test Forgot Password

**Endpoint:** `POST /api/auth/forgot-password`

**Request:**
```json
{
  "username": "alice"
}
```

**Steps:**
1. Chọn request **"Forgot Password"**
2. Thay username trong body
3. Click **Send**

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "Password reset link has been sent to your email."
}
```

**Lưu ý:** 
- Cần có email đã cấu hình trong `.env`
- Kiểm tra email để lấy reset token

---

### 3️⃣ Test Reset Password

**Endpoint:** `POST /api/auth/reset-password`

**Request:**
```json
{
  "token": "your_reset_token_from_email",
  "newPassword": "newpass456"
}
```

**Steps:**
1. Chọn request **"Reset Password"**
2. Thay token bằng token nhận được từ email
3. Thay `newPassword` với mật khẩu mới
4. Click **Send**

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "Password has been reset successfully"
}
```

---

### 4️⃣ Test Change Password (Student Self Update)

**Endpoint:** `POST /api/auth/change-password`

**Requirements:**
- ✅ Phải đăng nhập (có token)
- ✅ Cần mật khẩu cũ

**Request:**
```json
{
  "oldPassword": "oldpass123",
  "newPassword": "newpass456",
  "confirmPassword": "newpass456"
}
```

**Steps:**
1. Đảm bảo đã có token (từ Login)
2. Chọn request **"Change Password (Student Self Update)"**
3. Thay `oldPassword` = mật khẩu hiện tại
4. Thay `newPassword` và `confirmPassword` = mật khẩu mới
5. Click **Send**

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "Đổi mật khẩu thành công"
}
```

**Validation Rules:**
- ✅ Mật khẩu cũ phải đúng
- ✅ Mật khẩu mới: 6-12 ký tự
- ✅ Không trùng với ngày sinh
- ✅ Phải khác mật khẩu cũ
- ✅ `newPassword` phải khớp `confirmPassword`

**Error Examples:**

❌ Mật khẩu cũ sai:
```json
{
  "success": false,
  "message": "Mật khẩu cũ không đúng"
}
```

❌ Mật khẩu quá ngắn:
```json
{
  "success": false,
  "message": "Mật khẩu phải có độ dài từ 6 đến 12 ký tự"
}
```

❌ Trùng ngày sinh:
```json
{
  "success": false,
  "message": "Không được đặt mật khẩu trùng ngày sinh"
}
```

❌ Không khớp confirm:
```json
{
  "success": false,
  "message": "Mật khẩu mới và xác nhận mật khẩu không khớp"
}
```

---

### 5️⃣ Test Admin Update Password

**Endpoint:** `POST /api/auth/admin-update-password`

**Requirements:**
- ✅ Phải đăng nhập với tài khoản admin
- ✅ Có permission `user:UPDATE`
- ✅ Không cần mật khẩu cũ

**Request:**
```json
{
  "username": "alice",
  "newPassword": "newpass456",
  "confirmPassword": "newpass456"
}
```

**Steps:**
1. Login với tài khoản admin để lấy admin token
2. Chọn request **"Admin Update Password"**
3. Thay `username` = username cần cập nhật
4. Thay `newPassword` và `confirmPassword`
5. Click **Send**

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "Cập nhật mật khẩu thành công"
}
```

**Validation Rules:**
- ✅ Username phải tồn tại
- ✅ Mật khẩu mới: 6-12 ký tự
- ✅ Không trùng với ngày sinh
- ✅ `newPassword` phải khớp `confirmPassword`

**Error Examples:**

❌ Không có quyền:
```json
{
  "success": false,
  "message": "Permission denied"
}
```

❌ Username không tồn tại:
```json
{
  "success": false,
  "message": "Không tìm thấy người dùng với username này"
}
```

---

## 📊 So Sánh 4 APIs

| API | Auth Required | Old Password | Admin Only | Use Case |
|-----|---------------|--------------|------------|----------|
| Forgot Password | ❌ | ❌ | ❌ | User quên mật khẩu |
| Reset Password | ❌ | ❌ | ❌ | Đặt lại từ email link |
| Change Password | ✅ | ✅ | ❌ | User tự đổi mật khẩu |
| Admin Update | ✅ | ❌ | ✅ | Admin reset mật khẩu user |

---

## 🧪 Test Flow Hoàn Chỉnh

### Scenario 1: User tự đổi mật khẩu
```
1. Login → lấy token
2. Change Password → đổi mật khẩu thành công
3. Login lại với mật khẩu mới → verify
```

### Scenario 2: User quên mật khẩu
```
1. Forgot Password → gửi email
2. Lấy token từ email
3. Reset Password → đặt mật khẩu mới
4. Login với mật khẩu mới → verify
```

### Scenario 3: Admin reset mật khẩu cho user
```
1. Login Admin → lấy admin token
2. Admin Update Password → đặt mật khẩu mới cho user
3. User login với mật khẩu mới → verify
```

---

## ⚠️ Lưu Ý Quan Trọng

### 1. Validation Rules
- **Độ dài**: 6-12 ký tự
- **Không trùng**: không được giống ngày sinh (DDMMYYYY hoặc YYYYMMDD)
- **Confirm**: `newPassword` và `confirmPassword` phải giống nhau
- **Change Password**: mật khẩu mới phải khác mật khẩu cũ

### 2. Security
- Token trong email hết hạn sau 30 phút
- Mật khẩu được hash bằng bcrypt (10 rounds)
- Không tiết lộ thông tin nhạy cảm trong response

### 3. Testing Tips
- Test cả success và error cases
- Verify validation rules hoạt động đúng
- Check permission với các role khác nhau
- Test với ngày sinh khác nhau (DDMMYYYY vs YYYYMMDD)

---

## 🔍 Troubleshooting

### Lỗi 401 Unauthorized
**Nguyên nhân:** Chưa có token hoặc token sai

**Giải pháp:**
1. Login lại để lấy token mới
2. Update token trong environment variables
3. Verify token chưa hết hạn

### Lỗi 403 Forbidden
**Nguyên nhân:** Không có quyền

**Giải pháp:**
1. Đăng nhập với tài khoản có đủ quyền
2. Kiểm tra role và permission
3. Verify `user:UPDATE` permission cho admin

### Lỗi 500 Internal Server Error
**Nguyên nhân:** Server error

**Giải pháp:**
1. Check server logs
2. Verify database connection
3. Check email configuration (cho forgot password)

### Lỗi Email không gửi được
**Nguyên nhân:** Email config sai

**Giải pháp:**
1. Verify `.env` có đúng EMAIL_USER và EMAIL_PASS
2. Check Gmail App Password đã tạo đúng
3. Verify FRONTEND_URL đúng

---

## 📚 Resources

- [API Documentation](./API_ENDPOINTS.md)
- [Email Setup Guide](./README.md#-quick-start)
- [Test HTML Files](./public/)

---

## ✅ Checklist Test

- [ ] Import collection thành công
- [ ] Setup environment variables
- [ ] Login được và lấy token
- [ ] Forgot Password gửi email thành công
- [ ] Reset Password hoạt động với token
- [ ] Change Password validate đúng rules
- [ ] Admin Update Password chỉ admin mới được
- [ ] Test tất cả error cases
- [ ] Verify ngày sinh validation
- [ ] Check permission middleware

---

**Happy Testing! 🎉**

