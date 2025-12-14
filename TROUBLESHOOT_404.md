# Troubleshoot 404 Error

## 🔴 Vấn đề
`GET {{baseUrl}}/api/evidences/approved/my-evidences` → 404 Not Found

## ✅ Các bước kiểm tra

### 1. **URL chính xác?**

Kiểm tra URL:
- ❌ `/api/evidence/approved/my-evidences` (singular - WRONG)
- ✅ `/api/evidences/approved/my-evidences` (plural - CORRECT)

**Chú ý**: Endpoint là `/evidences/` (số nhiều), không phải `/evidence/`

---

### 2. **Server đang chạy?**

Kiểm tra log server:

```bash
# Nếu chạy với npm start
npm start

# Hoặc nếu chạy với nodemon
npx nodemon src/server.js
```

Server phải in ra:
```
Server running on port 5000
Database connected
```

---

### 3. **Mount point đúng?**

File: `/backend/src/app.js` (dòng 109)

```javascript
app.use('/api/evidences', require('./routes/evidence.routes'));
```

✅ Nếu dòng này tồn tại, routes sẽ có prefix `/api/evidences`

---

### 4. **Routes file chính xác?**

File: `/backend/src/routes/evidence.routes.js`

**Kiểm tra thứ tự routes** (từ cụ thể → chung):

```javascript
// 🔴 ROUTES CHUYÊN BIỆT (phải nằm trước)
router.get('/approved/my-evidences', ...);
router.get('/approved/:studentId', ...);

// 🟢 ROUTES CHUNG (phải nằm sau)
router.get('/faculty/:facultyId', ...);
router.get('/class/:classId', ...);
router.get('/student/:studentId', ...);
router.get('/:id', ...);
```

---

### 5. **Controller method tồn tại?**

File: `/backend/src/controllers/evidence.controller.js`

Kiểm tra 2 methods tồn tại:
```javascript
async getMyApprovedEvidences(req, res) { ... }
async getApprovedEvidencesForStudent(req, res) { ... }
```

---

### 6. **Full Request Test**

Trong Postman/Thunder Client, test request này:

```
GET http://localhost:5000/api/evidences/approved/my-evidences
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

**Expected Response**:
- `200` - Success
- `401` - Token invalid/missing
- `404` - Student profile not found
- `500` - Server error

---

## 🔧 Debug Steps

### Step 1: Kiểm tra routes được load

Thêm log vào `/backend/src/app.js`:

```javascript
// Line 109 - thêm logging
console.log('✅ Evidence routes mounted');
app.use('/api/evidences', require('./routes/evidence.routes'));
```

Restart server, kiểm tra console có message này không.

---

### Step 2: Kiểm tra route được match

Thêm middleware debug vào `/backend/src/routes/evidence.routes.js`:

```javascript
const express = require('express');
const router = express.Router();

// DEBUG LOG
router.use((req, res, next) => {
  console.log('🟡 Evidence route accessed:', req.method, req.path);
  next();
});

// ... rest of routes
```

Restart server, khi gọi API sẽ thấy:
```
🟡 Evidence route accessed: GET /approved/my-evidences
```

---

### Step 3: Kiểm tra auth middleware

Nếu vẫn 404 sau khi confirm routes match, có thể auth middleware block request.

Thêm debug vào middleware:

```javascript
// /backend/src/middlewares/auth.middleware.js
module.exports = (req, res, next) => {
  console.log('🔒 Auth middleware:', req.path);
  // ... rest of code
};
```

---

### Step 4: Network tab check

1. Mở DevTools → Network tab
2. Gọi API
3. Kiểm tra:
   - **Request URL**: Phải là `http://localhost:5000/api/evidences/approved/my-evidences`
   - **Request Headers**: `Authorization: Bearer ...`
   - **Response**: HTML với `Cannot GET ...` hay JSON?

---

## 📝 Checklist

- [ ] URL là `/api/evidences/` (plural)
- [ ] Server running on port 5000
- [ ] Token hợp lệ (test với other endpoints trước)
- [ ] Routes file có 2 methods mới
- [ ] Routes mounted tại line 109 app.js
- [ ] Thứ tự routes đúng (approved routes trước)
- [ ] Restarted server sau khi thay đổi code
- [ ] Network tab shows correct URL and headers

---

## 🚨 Common Mistakes

| Lỗi | Nguyên nhân | Fix |
|-----|-----------|-----|
| 404 | URL có `/evidence/` (singular) | Dùng `/evidences/` (plural) |
| 404 | Routes chưa được mount | Add `app.use('/api/evidences', ...)` |
| 404 | Routes chưa được reload | Restart server |
| 401 | Token missing/invalid | Add Authorization header |
| 500 | Controller method crash | Check console logs |

---

## 💡 Quick Test

Copy-paste vào Terminal (replace YOUR_TOKEN):

```bash
curl -X GET "http://localhost:5000/api/evidences/approved/my-evidences" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

Response:
- `{"success":true,"data":{...}}` → ✅ Working
- `Cannot GET /api/evidences/...` → ❌ Route not found
- `{"message":"User not authenticated"}` → ❌ Token invalid
- `{"message":"Student profile not found"}` → ✅ Route found, user issue

---

## 🆘 Still not working?

1. Share full error response (HTML or JSON?)
2. Check server console output
3. Verify NetworkTab shows correct full URL
4. Make sure `app.js` line 109 exists and correct
5. Check routes file has both methods defined
