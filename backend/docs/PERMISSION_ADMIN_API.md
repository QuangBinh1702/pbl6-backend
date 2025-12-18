# 🔐 Permission Admin API Documentation

## Base URL
```
http://localhost:5000/api/admin/permissions
```

## Authentication
**Tất cả API đều yêu cầu JWT token trong header:**
```javascript
headers: {
  'Authorization': 'Bearer YOUR_JWT_TOKEN',
  'Content-Type': 'application/json'
}
```

---

## 📋 API Endpoints

### 1. Lấy Permission Matrix của User
Lấy toàn bộ thông tin permissions của một user, bao gồm roles, permissions từ role, và các override.

**Endpoint:** `GET /users/:userId`

**Parameters:**
- `userId` (path) - ID của user cần xem permissions
- `orgUnitId` (query, optional) - Lọc theo đơn vị tổ chức

**Request Example:**
```javascript
const response = await fetch(
  `http://localhost:5000/api/admin/permissions/users/675a51a0e71234567890abcd`,
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "675a51a0e71234567890abcd",
      "username": "student01",
      "name": "Nguyễn Văn A"
    },
    "roles": [
      {
        "user_role_id": "abc123",
        "role_id": "role123",
        "role_name": "student",
        "role_code": "STUDENT"
      }
    ],
    "permissions": [
      {
        "action_id": "action123",
        "action_name": "Xem hoạt động",
        "action_code": "READ",
        "resource": "activity",
        "description": "Xem danh sách hoạt động",
        "viaRoles": true,           // Quyền từ role
        "overrideType": null,        // null | "grant" | "revoke"
        "effective": true,           // Quyền hiệu lực cuối cùng
        "grantedBy": null,
        "note": null
      },
      {
        "action_id": "action456",
        "action_name": "Tạo hoạt động",
        "action_code": "CREATE",
        "resource": "activity",
        "description": "Tạo hoạt động mới",
        "viaRoles": false,
        "overrideType": "grant",      // Được cấp thêm quyền
        "effective": true,
        "grantedBy": "admin01",
        "note": "Cấp quyền đặc biệt"
      }
    ]
  }
}
```

**Response Error (500):**
```json
{
  "success": false,
  "message": "User not found"
}
```

---

### 2. Lấy Danh Sách Permissions Có Thể Quản Lý
Lấy danh sách permissions mà user này có thể được cấp/thu hồi (dựa trên roles hiện tại).

**Endpoint:** `GET /users/:userId/available`

**Parameters:**
- `userId` (path) - ID của user
- `orgUnitId` (query, optional) - Lọc theo đơn vị

**Request Example:**
```javascript
const response = await fetch(
  `http://localhost:5000/api/admin/permissions/users/675a51a0e71234567890abcd/available`,
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "userId": "675a51a0e71234567890abcd",
    "availableActions": [
      {
        "action_id": "action123",
        "action_name": "Xem hoạt động",
        "action_code": "READ",
        "resource": "activity",
        "description": "Xem danh sách hoạt động"
      }
    ],
    "count": 93
  }
}
```

---

### 3. Cấp Quyền Cho User
Cấp một permission cụ thể cho user (tạo override type "grant").

**Endpoint:** `POST /users/:userId/grant/:actionId`

**Parameters:**
- `userId` (path) - ID của user nhận quyền
- `actionId` (path) - ID của action/permission cần cấp

**Request Body:**
```json
{
  "note": "Cấp quyền đặc biệt cho sinh viên này"
}
```

**Request Example:**
```javascript
const response = await fetch(
  `http://localhost:5000/api/admin/permissions/users/675a51a0e71234567890abcd/grant/action123`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      note: "Cấp quyền đặc biệt"
    })
  }
);
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "result": {
      "success": true,
      "message": "Permission granted successfully",
      "override": {
        "_id": "override123",
        "user_id": "675a51a0e71234567890abcd",
        "action_id": "action123",
        "override_type": "grant",
        "granted_by": "admin01",
        "note": "Cấp quyền đặc biệt"
      },
      "actionTaken": "GRANT"
    },
    "updatedMatrix": {
      // Full permission matrix như API #1
    }
  }
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "Permission already granted via roles"
}
```

---

### 4. Thu Hồi Quyền Từ User
Thu hồi một permission từ user (tạo override type "revoke").

**Endpoint:** `POST /users/:userId/revoke/:actionId`

**Parameters:**
- `userId` (path) - ID của user bị thu hồi quyền
- `actionId` (path) - ID của action/permission cần thu hồi

**Request Body:**
```json
{
  "note": "Thu hồi quyền tạm thời"
}
```

**Request Example:**
```javascript
const response = await fetch(
  `http://localhost:5000/api/admin/permissions/users/675a51a0e71234567890abcd/revoke/action123`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      note: "Thu hồi quyền tạm thời"
    })
  }
);
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "result": {
      "success": true,
      "message": "Permission revoked successfully",
      "override": {
        "_id": "override456",
        "user_id": "675a51a0e71234567890abcd",
        "action_id": "action123",
        "override_type": "revoke",
        "granted_by": "admin01",
        "note": "Thu hồi quyền tạm thời"
      },
      "actionTaken": "REVOKE"
    },
    "updatedMatrix": {
      // Full permission matrix
    }
  }
}
```

---

### 5. Xóa Override (Khôi Phục Về Role)
Xóa override để permission trở về trạng thái theo role.

**Endpoint:** `DELETE /users/:userId/override/:actionId`

**Parameters:**
- `userId` (path) - ID của user
- `actionId` (path) - ID của action có override cần xóa

**Request Example:**
```javascript
const response = await fetch(
  `http://localhost:5000/api/admin/permissions/users/675a51a0e71234567890abcd/override/action123`,
  {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "result": {
      "success": true,
      "message": "Override deleted successfully",
      "actionTaken": "DELETE_OVERRIDE"
    },
    "updatedMatrix": {
      // Full permission matrix
    }
  }
}
```

---

### 6. Áp Dụng Nhiều Thay Đổi Cùng Lúc ⭐ (RECOMMENDED)
API chính để áp dụng nhiều thay đổi permissions cùng lúc. **Đây là API bạn đang dùng trong PermissionAdminPanel.**

**Endpoint:** `PATCH /users/:userId/apply-changes`

**Parameters:**
- `userId` (path) - ID của user

**Request Body:**
```json
{
  "changes": [
    {
      "actionId": "action123",
      "desiredEffective": true,
      "note": "Cấp quyền"
    },
    {
      "actionId": "action456",
      "desiredEffective": false,
      "note": "Thu hồi quyền"
    }
  ]
}
```

**Request Example:**
```javascript
const response = await fetch(
  `http://localhost:5000/api/admin/permissions/users/675a51a0e71234567890abcd/apply-changes`,
  {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      changes: [
        { actionId: "action123", desiredEffective: true },
        { actionId: "action456", desiredEffective: false }
      ]
    })
  }
);
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "changes": [
      {
        "actionId": "action123",
        "success": true,
        "message": "Permission granted successfully",
        "actionTaken": "GRANT"
      },
      {
        "actionId": "action456",
        "success": true,
        "message": "Permission revoked successfully",
        "actionTaken": "REVOKE"
      }
    ],
    "updatedMatrix": {
      "user": { ... },
      "roles": [ ... ],
      "permissions": [ ... ]
    }
  }
}
```

**Response Error (400):**
```json
{
  "success": false,
  "message": "changes must be an array"
}
```

**Response Error (500):**
```json
{
  "success": false,
  "message": "Error message here"
}
```

---

## 📝 Frontend Service Example

Đây là code mẫu service cho frontend (đã có trong `permissionAdminService.js`):

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/admin/permissions';

// Create axios instance with auth
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 1. Get user permission matrix
export const getUserPermissions = async (userId) => {
  const response = await apiClient.get(`/users/${userId}`);
  return response.data;
};

// 2. Get available permissions
export const getAvailablePermissions = async (userId) => {
  const response = await apiClient.get(`/users/${userId}/available`);
  return response.data;
};

// 3. Grant single permission
export const grantPermission = async (userId, actionId, note = '') => {
  const response = await apiClient.post(
    `/users/${userId}/grant/${actionId}`,
    { note }
  );
  return response.data;
};

// 4. Revoke single permission
export const revokePermission = async (userId, actionId, note = '') => {
  const response = await apiClient.post(
    `/users/${userId}/revoke/${actionId}`,
    { note }
  );
  return response.data;
};

// 5. Delete override
export const deleteOverride = async (userId, actionId) => {
  const response = await apiClient.delete(
    `/users/${userId}/override/${actionId}`
  );
  return response.data;
};

// 6. Apply multiple changes (RECOMMENDED)
export const applyPermissionChanges = async (userId, changes) => {
  const response = await apiClient.patch(
    `/users/${userId}/apply-changes`,
    { changes }
  );
  return response.data;
};
```

---

## 🔄 Flow Sử Dụng Trong Component

### Flow 1: Load & Display Permissions
```javascript
// 1. Load user permissions
const loadPermissions = async (userId) => {
  try {
    const response = await getUserPermissions(userId);
    if (response.success) {
      setPermissions(response.data.permissions);
      setUserRoles(response.data.roles);
    }
  } catch (error) {
    console.error('Error loading permissions:', error);
  }
};
```

### Flow 2: Toggle & Save Changes (Bulk Update)
```javascript
// 1. User toggle permissions
const handleToggle = (actionId, currentValue) => {
  const newChanges = new Map(pendingChanges);
  if (newChanges.has(actionId)) {
    newChanges.delete(actionId);
  } else {
    newChanges.set(actionId, !currentValue);
  }
  setPendingChanges(newChanges);
};

// 2. Apply all changes at once
const handleSave = async () => {
  const changes = Array.from(pendingChanges.entries()).map(
    ([actionId, desiredEffective]) => ({
      actionId,
      desiredEffective
    })
  );

  try {
    const response = await applyPermissionChanges(userId, changes);
    if (response.success) {
      // Update UI with new matrix
      setPermissions(response.data.updatedMatrix.permissions);
      setPendingChanges(new Map());
      alert('Cập nhật thành công!');
    }
  } catch (error) {
    console.error('Error saving changes:', error);
    alert('Lỗi khi lưu thay đổi');
  }
};
```

---

## 🎯 Best Practices

1. **Sử dụng API #6 (apply-changes) cho bulk updates** thay vì gọi API #3,#4 nhiều lần
2. **Cache permission matrix** để giảm số lần gọi API
3. **Hiển thị loading state** khi đang call API
4. **Handle errors gracefully** và show message rõ ràng cho user
5. **Confirm trước khi save** để tránh thay đổi nhầm
6. **Reload matrix sau khi save** để đảm bảo data sync

---

## 🐛 Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `401 Unauthorized` | Token không hợp lệ hoặc hết hạn | Redirect to login |
| `500 User not found` | userId không tồn tại | Validate userId trước khi gọi API |
| `changes must be an array` | Request body sai format | Check request body structure |
| `Network Error` | Backend chưa chạy | Kiểm tra backend server |
| `Cannot read properties of undefined` | Thiếu auth middleware | Đã fix - cần restart backend |

---

## ✅ Checklist Integration

- [ ] Copy `permissionAdminService.js` vào project
- [ ] Update `API_BASE_URL` nếu cần
- [ ] Implement token storage/retrieval
- [ ] Test từng API với Postman/Thunder Client
- [ ] Integrate vào component
- [ ] Add error handling
- [ ] Add loading states
- [ ] Add confirmation dialogs
- [ ] Test full flow: load → toggle → save
- [ ] Handle edge cases (network error, 401, etc.)

---

## 📞 Support

Nếu có vấn đề khi integrate, check:
1. Backend server đã chạy chưa? (`npm run dev`)
2. Token có trong localStorage không?
3. CORS đã config đúng chưa?
4. Network tab trong DevTools có request nào fail không?

