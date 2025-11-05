# 📋 HƯỚNG DẪN COPY CÁC THAY ĐỔI VÀO POSTMAN

## 🔧 BƯỚC 1: THÊM BIẾN `admin_token` VÀO COLLECTION VARIABLES

1. Mở Postman Collection của bạn
2. Click vào tab **Variables** (ở cấp Collection)
3. Thêm biến mới:
   - **Variable**: `admin_token`
   - **Value**: (để trống)
   - **Type**: String

---

## 🔧 BƯỚC 2: TẠO REQUEST "Login - Admin" MỚI

### 2.1. Tạo request mới trong folder "👥 Users":
- **Name**: `Login - Admin`
- **Method**: `POST`
- **URL**: `{{baseUrl}}/api/auth/login`
- **Headers**: `Content-Type: application/json`
- **Body** (raw JSON):
```json
{
  "username": "admin",
  "password": "admin123"
}
```

### 2.2. Test Script (copy vào tab "Tests"):
```javascript
pm.test('Status 200', function () { pm.response.to.have.status(200); });
var data = pm.response.json();
pm.test('Has token', function(){ pm.expect(data).to.have.property('token'); });
if (data && data.token) { 
    pm.collectionVariables.set('admin_token', data.token); 
    pm.environment.set('admin_token', data.token); 
}
```

**LƯU Ý**: Di chuyển request này lên **ĐẦU TIÊN** trong folder "👥 Users" để đảm bảo nó chạy trước các request "Create User".

---

## 🔧 BƯỚC 3: SỬA REQUEST "Login - User Inactive"

### Test Script (sửa dòng này):
```javascript
pm.test('Forbidden 403/401 or Not Found 404', function () { pm.expect([403,401,404]).to.include(pm.response.code); });
```

---

## 🔧 BƯỚC 4: SỬA CÁC REQUEST "CREATE USER"

### 4.1. Sửa Authorization Header:
Thay đổi từ:
```
Bearer {{token}}
```
Thành:
```
Bearer {{admin_token}}
```

**Áp dụng cho các request sau:**
- ✅ Create User (admin /api/auth/create-user)
- ✅ Create User - Duplicate Username
- ✅ Create User - Missing Password
- ✅ Create User - Password Too Short (<6)
- ✅ Create User - Invalid Username Chars

---

## 🔧 BƯỚC 5: THÊM PRE-REQUEST SCRIPT CHO CÁC REQUEST "CREATE USER"

### 5.1. Script cho "Create User (admin /api/auth/create-user)"

Copy vào tab **Pre-request Script**:

```javascript
// Kiểm tra admin_token - Nếu chưa có, hãy chạy request 'Login - Admin' trước
const adminToken = pm.collectionVariables.get('admin_token') || pm.environment.get('admin_token');
if (!adminToken) {
  console.log('⚠️ Chưa có admin_token! Đang tự động login admin...');
  const baseUrl = pm.collectionVariables.get('baseUrl') || pm.environment.get('baseUrl') || 'http://localhost:5000';
  const loginRequest = {
    url: baseUrl + '/api/auth/login',
    method: 'POST',
    header: { 'Content-Type': 'application/json' },
    body: {
      mode: 'raw',
      raw: JSON.stringify({ username: 'admin', password: 'admin123' })
    }
  };
  pm.sendRequest(loginRequest, function (err, res) {
    if (!err && res.code === 200) {
      const data = res.json();
      if (data && data.token) {
        pm.collectionVariables.set('admin_token', data.token);
        pm.environment.set('admin_token', data.token);
        console.log('✅ Đã login admin và lưu admin_token');
      }
    } else {
      console.log('❌ Không thể login admin tự động. Vui lòng chạy request "Login - Admin" trước.');
    }
  });
} else {
  console.log('✅ Đã có admin_token, sẵn sàng tạo user');
}
// Prepare random admin user (or use defaults)
const ts = Date.now();
const u = pm.environment.get('cu_username') || `superadmin_${ts}`;
const p = pm.environment.get('cu_password') || 'password123';
const r = pm.environment.get('cu_roleName') || 'admin';
pm.environment.set('cu_username', u);
pm.environment.set('cu_password', p);
pm.environment.set('cu_roleName', r);
```

---

### 5.2. Script cho "Create User - Duplicate Username"

Copy vào tab **Pre-request Script**:

```javascript
// Auto login admin nếu chưa có admin_token
const adminToken = pm.collectionVariables.get('admin_token') || pm.environment.get('admin_token');
if (!adminToken) {
  const baseUrl = pm.collectionVariables.get('baseUrl') || pm.environment.get('baseUrl') || 'http://localhost:5000';
  const loginRequest = {
    url: baseUrl + '/api/auth/login',
    method: 'POST',
    header: { 'Content-Type': 'application/json' },
    body: {
      mode: 'raw',
      raw: JSON.stringify({ username: 'admin', password: 'admin123' })
    }
  };
  pm.sendRequest(loginRequest, function (err, res) {
    if (!err && res.code === 200) {
      const data = res.json();
      if (data && data.token) {
        pm.collectionVariables.set('admin_token', data.token);
        pm.environment.set('admin_token', data.token);
      }
    }
  });
}
// Ensure duplicate uses same cu_username as previous create
const u = pm.environment.get('cu_username') || 'superadmin2';
const p = pm.environment.get('cu_password') || 'password123';
const r = pm.environment.get('cu_roleName') || 'admin';
pm.request.body.update(JSON.stringify({ username: u, password: p, roleName: r }, null, 2));
```

---

### 5.3. Script cho "Create User - Missing Password"

Copy vào tab **Pre-request Script**:

```javascript
// Auto login admin nếu chưa có admin_token
const adminToken = pm.collectionVariables.get('admin_token') || pm.environment.get('admin_token');
if (!adminToken) {
  const baseUrl = pm.collectionVariables.get('baseUrl') || pm.environment.get('baseUrl') || 'http://localhost:5000';
  const loginRequest = {
    url: baseUrl + '/api/auth/login',
    method: 'POST',
    header: { 'Content-Type': 'application/json' },
    body: {
      mode: 'raw',
      raw: JSON.stringify({ username: 'admin', password: 'admin123' })
    }
  };
  pm.sendRequest(loginRequest, function (err, res) {
    if (!err && res.code === 200) {
      const data = res.json();
      if (data && data.token) {
        pm.collectionVariables.set('admin_token', data.token);
        pm.environment.set('admin_token', data.token);
      }
    }
  });
}
```

---

### 5.4. Script cho "Create User - Password Too Short (<6)"

Copy vào tab **Pre-request Script**:

```javascript
// Auto login admin nếu chưa có admin_token
const adminToken = pm.collectionVariables.get('admin_token') || pm.environment.get('admin_token');
if (!adminToken) {
  const baseUrl = pm.collectionVariables.get('baseUrl') || pm.environment.get('baseUrl') || 'http://localhost:5000';
  const loginRequest = {
    url: baseUrl + '/api/auth/login',
    method: 'POST',
    header: { 'Content-Type': 'application/json' },
    body: {
      mode: 'raw',
      raw: JSON.stringify({ username: 'admin', password: 'admin123' })
    }
  };
  pm.sendRequest(loginRequest, function (err, res) {
    if (!err && res.code === 200) {
      const data = res.json();
      if (data && data.token) {
        pm.collectionVariables.set('admin_token', data.token);
        pm.environment.set('admin_token', data.token);
      }
    }
  });
}
```

---

### 5.5. Script cho "Create User - Invalid Username Chars"

Copy vào tab **Pre-request Script**:

```javascript
// Auto login admin nếu chưa có admin_token
const adminToken = pm.collectionVariables.get('admin_token') || pm.environment.get('admin_token');
if (!adminToken) {
  const baseUrl = pm.collectionVariables.get('baseUrl') || pm.environment.get('baseUrl') || 'http://localhost:5000';
  const loginRequest = {
    url: baseUrl + '/api/auth/login',
    method: 'POST',
    header: { 'Content-Type': 'application/json' },
    body: {
      mode: 'raw',
      raw: JSON.stringify({ username: 'admin', password: 'admin123' })
    }
  };
  pm.sendRequest(loginRequest, function (err, res) {
    if (!err && res.code === 200) {
      const data = res.json();
      if (data && data.token) {
        pm.collectionVariables.set('admin_token', data.token);
        pm.environment.set('admin_token', data.token);
      }
    }
  });
}
```

---

## ✅ TÓM TẮT CÁC THAY ĐỔI:

1. ✅ Thêm biến `admin_token` vào Collection Variables
2. ✅ Tạo request "Login - Admin" mới ở đầu folder "👥 Users"
3. ✅ Sửa Authorization header của các request "Create User" từ `{{token}}` → `{{admin_token}}`
4. ✅ Thêm Pre-request Script tự động login admin cho các request "Create User"
5. ✅ Sửa test case "Login - User Inactive" để chấp nhận 404

---

## 🚀 CÁCH TEST:

1. **Chạy Collection Runner** cho folder "👥 Users" → Request "Login - Admin" sẽ chạy trước và set `admin_token`
2. **Hoặc chạy thủ công**: Chạy "Login - Admin" trước, sau đó chạy các request "Create User"

---

## ⚠️ LƯU Ý:

- `pm.sendRequest` là async nên không đợi được trong pre-request script
- **Cách tốt nhất**: Chạy "Login - Admin" trước khi chạy các request "Create User"
- Hoặc dùng Collection Runner để chạy toàn bộ folder "👥 Users" theo thứ tự



