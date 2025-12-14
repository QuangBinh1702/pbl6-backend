# Debug 401 Error

## 🔴 Vấn đề
`GET /api/evidences/approved/my-evidences` → 401 Unauthorized (mặc dù đã nhập token)

## 🔍 Nguyên nhân Có Thể

### 1. **Token Format Sai**

❌ Sai:
```
Authorization: YOUR_TOKEN
Authorization: Token YOUR_TOKEN
```

✅ Đúng:
```
Authorization: Bearer YOUR_TOKEN
```

**Kiểm tra**: Header phải có `Bearer ` (với space) trước token

---

### 2. **Token Expired**

Token có thể đã hết hạn. Cần **login lại** để lấy token mới.

**Response sẽ là**:
```json
{
  "success": false,
  "message": "Token expired"
}
```

---

### 3. **Token Invalid**

Token có thể bị corrupt hoặc không khớp với secret key.

**Response sẽ là**:
```json
{
  "success": false,
  "message": "Invalid token"
}
```

---

### 4. **User Bị Khóa (Locked)**

User account có `isLocked: true` trong database.

**Response sẽ là**:
```json
{
  "success": false,
  "message": "Invalid or locked user"
}
```

---

### 5. **Token Từ User Khác**

Nếu token từ admin hoặc staff, nhưng endpoint cần student profile:
- `/api/evidences/approved/my-evidences` → Tìm student profile của user hiện tại
- Nếu user không có student profile → 404 "Student profile not found"

---

## 🧪 Test Steps

### Step 1: Lấy Token Mới

```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "student1",
  "password": "student123"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Copy token này**

---

### Step 2: Test Endpoint

```bash
GET /api/evidences/approved/my-evidences
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

---

### Step 3: Kiểm tra Response

**Nếu 200**:
```json
{
  "success": true,
  "data": { ... }
}
```
✅ Thành công!

**Nếu 401 - Token Expired**:
```json
{
  "success": false,
  "message": "Token expired"
}
```
→ Login lại để lấy token mới

**Nếu 401 - Invalid Token**:
```json
{
  "success": false,
  "message": "Invalid token"
}
```
→ Token bị corrupt, login lại

**Nếu 401 - No Token**:
```json
{
  "success": false,
  "message": "No token provided"
}
```
→ Kiểm tra header Authorization format

**Nếu 404 - Student Profile Not Found**:
```json
{
  "success": false,
  "message": "Student profile not found"
}
```
→ User không có student profile (dùng admin/staff user)

---

## 🔧 Postman Test

### Postman Steps:

1. **Tab "Authorization"**:
   - Type: `Bearer Token`
   - Token: `(paste your token here)`

   HOẶC

2. **Tab "Headers"**:
   - Key: `Authorization`
   - Value: `Bearer YOUR_TOKEN`

3. **Gửi Request**

---

## 💡 Curl Test

```bash
# Test với token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET "http://localhost:5000/api/evidences/approved/my-evidences" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -v
```

Lưu ý: `-v` để xem full response headers

---

## 🔐 Auth Middleware Logic

File: `/backend/src/middlewares/auth.middleware.js`

```javascript
const authHeader = req.headers['authorization'];
const token = authHeader && authHeader.split(' ')[1];

if (!token) {
  return res.status(401).json({ 
    success: false, 
    message: 'No token provided' 
  });
}

try {
  const decoded = jwt.verify(token, jwtSecret);
  const user = await User.findById(decoded.id);
  
  if (!user || user.isLocked) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or locked user' 
    });
  }
  
  req.user = user;  // ← User object set here
  next();
} catch (err) {
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ 
      success: false, 
      message: 'Token expired' 
    });
  }
  return res.status(401).json({ 
    success: false, 
    message: 'Invalid token' 
  });
}
```

**Kiểm tra**:
1. Header `Authorization` tồn tại
2. Format: `Bearer <token>`
3. Token hợp lệ (không expired, chữ ký đúng)
4. User tồn tại trong database
5. User không bị khóa (`isLocked !== true`)

---

## 📋 Kiểm tra Danh Sách

- [ ] Token format: `Authorization: Bearer TOKEN` (có space)
- [ ] Token mới (vừa login)
- [ ] Dùng student user (không phải admin/staff)
- [ ] Student có student profile trong database
- [ ] User account không bị khóa
- [ ] Server timezone đúng (nếu token hết hạn)

---

## 🔑 Test Accounts

Nếu không có token, login trước:

```bash
POST /api/auth/login
{
  "username": "student1",
  "password": "student123"
}
```

Hoặc:

```bash
POST /api/auth/login
{
  "username": "student2_monitor",
  "password": "student123"
}
```

---

## 🆘 Still Getting 401?

1. **Đăng nhập lại** - Lấy token mới từ login endpoint
2. **Kiểm tra format header** - `Authorization: Bearer <token>` (chứ không phải `Token <token>`)
3. **Dùng student user** - Dùng student login, không phải admin/staff
4. **Check server logs** - Xem console có error gì không
5. **Test token** - Dùng token đó ở endpoint khác để confirm nó hợp lệ

---

## 🧪 Quick Test Sequence

```bash
# 1. Login lấy token
curl -X POST "http://localhost:5000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"student1","password":"student123"}' \
  | jq '.data.token'

# 2. Copy token ra, dùng ở command tiếp theo
TOKEN="... paste token here ..."

# 3. Test endpoint với token
curl -X GET "http://localhost:5000/api/evidences/approved/my-evidences" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -v

# 4. Kiểm tra response
# Nếu 200 → ✅ Success
# Nếu 401 → ❌ Check token format & expiry
# Nếu 404 → ❌ Student profile not found
```

---

## 📝 Possible Responses & Meanings

| Response | Meaning | Action |
|----------|---------|--------|
| `200 OK` | Success | ✅ Working |
| `401 - Token expired` | Token hết hạn | Login lại |
| `401 - Invalid token` | Token sai/corrupt | Login lại |
| `401 - No token provided` | Quên header | Thêm `Authorization: Bearer` |
| `401 - Invalid or locked user` | User khóa/xóa | Check database |
| `404 - Student profile not found` | Route ok, user issue | Dùng student user |
| `500` | Server error | Check server console |
