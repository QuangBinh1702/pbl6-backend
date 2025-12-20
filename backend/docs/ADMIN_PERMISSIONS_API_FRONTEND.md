# 🎯 ADMIN PERMISSION MANAGEMENT API - FRONTEND INTEGRATION GUIDE

## 📌 Base URL & Authentication

```
Base URL: http://localhost:5000/api/admin/permissions
```

**⚠️ QUAN TRỌNG:**
- **TẤT CẢ** endpoints yêu cầu:
  - Header `Authorization: Bearer {token}`
  - User phải có permission `permission:update` (chỉ admin)
- Nếu không có quyền → `403 Forbidden`

---

## 🔐 BASIC vs OPTIONAL Permissions (Staff)

### Khái niệm:
1. **BASIC (29 permissions)** - Tự động có khi có staff role
   - Seed vào `role_action` table
   - Không cần admin grant
   - Ví dụ: `activity:create`, `attendance:scan`, `post:read`

2. **OPTIONAL (22 permissions)** - Admin phải grant thủ công
   - KHÔNG seed vào `role_action`
   - Cần admin grant qua `user_action_override`
   - Ví dụ: `activity:approve`, `evidence:approve`, `class:manage_students`

### Permission Levels (Frontend xử lý UI):
- `student` - Ai cũng có thể toggle
- `staff` - Cần có staff role
- `admin-only` - Chỉ admin (staff không bao giờ có)

Chi tiết: `backend/src/staff_permissions.config.js`

---

## 📚 API ENDPOINTS (10 endpoints)

### 1. 🔍 Lookup User
**Tìm user và lấy permissions theo username/MSSV/mã cán bộ**

```http
GET /api/admin/permissions/lookup-user/:identifier
```

#### Request:
```javascript
// Examples:
GET /api/admin/permissions/lookup-user/102220095       // MSSV
GET /api/admin/permissions/lookup-user/STAFF123        // Mã cán bộ
GET /api/admin/permissions/lookup-user/john_doe        // Username

Headers: {
  "Authorization": "Bearer <token>"
}
```

#### Response Success (200):
```json
{
  "success": true,
  "data": {
    "userId": "672e54a0f13c9f2e5c4a1234",
    "user": {
      "id": "672e54a0f13c9f2e5c4a1234",
      "username": "john_doe",
      "name": "Nguyễn Văn A"
    },
    "orgUnitId": null,
    "roles": [
      {
        "user_role_id": "672e54a0f13c9f2e5c4a5678",
        "role_id": "672e54a0f13c9f2e5c4a9999",
        "role_name": "student",
        "role_description": "Sinh viên",
        "org_unit_id": null
      },
      {
        "user_role_id": "672e54a0f13c9f2e5c4a5679",
        "role_id": "672e54a0f13c9f2e5c4a8888",
        "role_name": "staff",
        "role_description": "Cán bộ/Giảng viên",
        "org_unit_id": "672e54a0f13c9f2e5c4a7777"
      }
    ],
    "permissionsByRole": {
      "student": {
        "user_role_id": "672e54a0f13c9f2e5c4a5678",
        "role_id": "672e54a0f13c9f2e5c4a9999",
        "role_name": "student",
        "role_description": "Sinh viên",
        "org_unit_id": null,
        "permissions": [
          {
            "action_id": "672e54a0f13c9f2e5c4a1111",
            "resource": "activity",
            "action_code": "READ",
            "action_name": "Xem hoạt động",
            "description": "Xem danh sách và chi tiết hoạt động",
            "permission_level": "student",
            "viaRoles": true,
            "overrideType": null,
            "overrideId": null,
            "overrideNote": null,
            "grantedByName": null,
            "grantedAt": null,
            "effective": true
          },
          {
            "action_id": "672e54a0f13c9f2e5c4a2222",
            "resource": "activity",
            "action_code": "APPROVE",
            "action_name": "Duyệt hoạt động",
            "description": "Duyệt hoạt động đã tạo",
            "permission_level": "staff",
            "viaRoles": false,
            "overrideType": "grant",
            "overrideId": "672e54a0f13c9f2e5c4a3333",
            "overrideNote": "Grant quyền duyệt hoạt động cho Chủ nhiệm CLB",
            "grantedByName": "Admin Nguyễn Văn B",
            "grantedAt": "2025-01-15T10:30:00.000Z",
            "effective": true
          }
        ],
        "summary": {
          "totalActions": 93,
          "effectiveCount": 25,
          "overrideCount": 3,
          "grantedCount": 2,
          "revokedCount": 1
        }
      },
      "staff": {
        "user_role_id": "672e54a0f13c9f2e5c4a5679",
        "role_id": "672e54a0f13c9f2e5c4a8888",
        "role_name": "staff",
        "role_description": "Cán bộ/Giảng viên",
        "org_unit_id": "672e54a0f13c9f2e5c4a7777",
        "permissions": [ /* same structure */ ],
        "summary": { /* ... */ }
      }
    },
    "summary": {
      "totalRoles": 2,
      "totalActions": 93,
      "overrideCount": 3
    }
  }
}
```

#### Response Error (404):
```json
{
  "success": false,
  "message": "Không tìm thấy người dùng với username, MSSV, hoặc mã cán bộ này"
}
```

#### Frontend Usage:
```javascript
// Tìm user khi admin submit username
const response = await permissionAdminService.lookupUserByUsername('102220095');
if (response.data.success) {
  const { user, roles, permissionsByRole } = response.data.data;
  
  // Check if user is student only
  const isStudentOnly = roles.length === 1 && roles[0].role_name === 'student';
  
  // Check if user has staff role
  const hasStaffRole = roles.some(r => r.role_name === 'staff');
  
  // Display permissions grouped by role
  Object.entries(permissionsByRole).forEach(([roleName, roleData]) => {
    console.log(`Role: ${roleName}, Effective: ${roleData.summary.effectiveCount}`);
  });
}
```

---

### 2. 👤 Get User Permissions by ID
**Lấy permissions của user theo userId (giống lookup nhưng dùng ID)**

```http
GET /api/admin/permissions/users/:userId?orgUnitId={orgUnitId}
```

#### Request:
```javascript
GET /api/admin/permissions/users/672e54a0f13c9f2e5c4a1234
GET /api/admin/permissions/users/672e54a0f13c9f2e5c4a1234?orgUnitId=672e54a0f13c9f2e5c4a7777

Headers: {
  "Authorization": "Bearer <token>"
}
```

#### Response:
**Giống hệt endpoint `/lookup-user/:identifier`**

#### Frontend Usage:
```javascript
// Reload permissions sau khi thay đổi
const response = await permissionAdminService.getUserPermissions(userId);
```

---

### 3. 📋 Get Available Permissions
**Lấy danh sách permissions có thể quản lý cho user (based on roles)**

```http
GET /api/admin/permissions/users/:userId/available?orgUnitId={orgUnitId}
```

#### Request:
```javascript
GET /api/admin/permissions/users/672e54a0f13c9f2e5c4a1234/available

Headers: {
  "Authorization": "Bearer <token>"
}
```

#### Response Success (200):
```json
{
  "success": true,
  "data": {
    "userId": "672e54a0f13c9f2e5c4a1234",
    "availableActions": [
      {
        "_id": "672e54a0f13c9f2e5c4a1111",
        "resource": "activity",
        "action_code": "READ",
        "action_name": "Xem hoạt động",
        "description": "Xem danh sách và chi tiết hoạt động",
        "is_active": true
      },
      {
        "_id": "672e54a0f13c9f2e5c4a2222",
        "resource": "activity",
        "action_code": "CREATE",
        "action_name": "Tạo hoạt động",
        "description": "Tạo hoạt động mới",
        "is_active": true
      }
    ],
    "count": 45
  }
}
```

#### Frontend Usage:
```javascript
// Lấy danh sách permissions có thể toggle (optional)
const response = await permissionAdminService.getAvailablePermissions(userId);
console.log(`User có thể được cấp ${response.data.data.count} permissions`);
```

---

### 4. ✅ Grant Permission
**Cấp một permission cụ thể cho user (tạo override với is_granted=true)**

```http
POST /api/admin/permissions/users/:userId/grant/:actionId
```

#### Request:
```javascript
POST /api/admin/permissions/users/672e54a0f13c9f2e5c4a1234/grant/672e54a0f13c9f2e5c4a2222

Headers: {
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}

Body: {
  "note": "Cấp quyền duyệt hoạt động cho Chủ nhiệm CLB" // Optional
}
```

#### Response Success (200):
```json
{
  "success": true,
  "data": {
    "result": {
      "message": "Permission granted",
      "override": {
        "_id": "672e54a0f13c9f2e5c4a3333",
        "user_id": "672e54a0f13c9f2e5c4a1234",
        "action_id": "672e54a0f13c9f2e5c4a2222",
        "is_granted": true,
        "granted_by": "672e54a0f13c9f2e5c4a9999",
        "note": "Cấp quyền duyệt hoạt động cho Chủ nhiệm CLB",
        "granted_at": "2025-01-15T10:30:00.000Z"
      }
    },
    "updatedMatrix": { /* Full permission matrix như /lookup-user */ }
  }
}
```

#### Response Error (400):
```json
{
  "success": false,
  "message": "User already has this permission via role"
}
```

#### Frontend Usage:
```javascript
// Grant single permission (ít dùng, nên dùng apply-changes)
const response = await permissionAdminService.grantPermission(
  userId, 
  actionId, 
  "Cấp quyền duyệt hoạt động"
);
if (response.data.success) {
  // Update UI với updatedMatrix
  setPermissions(response.data.data.updatedMatrix);
}
```

---

### 5. ❌ Revoke Permission
**Thu hồi permission của user (tạo override với is_granted=false)**

```http
POST /api/admin/permissions/users/:userId/revoke/:actionId
```

#### Request:
```javascript
POST /api/admin/permissions/users/672e54a0f13c9f2e5c4a1234/revoke/672e54a0f13c9f2e5c4a2222

Headers: {
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}

Body: {
  "note": "Thu hồi quyền do vi phạm quy định" // Optional
}
```

#### Response Success (200):
```json
{
  "success": true,
  "data": {
    "result": {
      "message": "Permission revoked",
      "override": {
        "_id": "672e54a0f13c9f2e5c4a3333",
        "user_id": "672e54a0f13c9f2e5c4a1234",
        "action_id": "672e54a0f13c9f2e5c4a2222",
        "is_granted": false,
        "granted_by": "672e54a0f13c9f2e5c4a9999",
        "note": "Thu hồi quyền do vi phạm quy định",
        "granted_at": "2025-01-15T10:35:00.000Z"
      }
    },
    "updatedMatrix": { /* Full permission matrix */ }
  }
}
```

#### Frontend Usage:
```javascript
// Revoke single permission (ít dùng, nên dùng apply-changes)
const response = await permissionAdminService.revokePermission(
  userId, 
  actionId, 
  "Thu hồi quyền"
);
```

---

### 6. 🗑️ Delete Override
**Xóa override (quay về quyền mặc định từ role)**

```http
DELETE /api/admin/permissions/users/:userId/override/:actionId
```

#### Request:
```javascript
DELETE /api/admin/permissions/users/672e54a0f13c9f2e5c4a1234/override/672e54a0f13c9f2e5c4a2222

Headers: {
  "Authorization": "Bearer <token>"
}
```

#### Response Success (200):
```json
{
  "success": true,
  "data": {
    "result": {
      "message": "Override deleted",
      "deletedCount": 1
    },
    "updatedMatrix": { /* Full permission matrix */ }
  }
}
```

#### Response Error (404):
```json
{
  "success": false,
  "message": "No override found"
}
```

#### Frontend Usage:
```javascript
// Xóa override (quay về mặc định)
const response = await permissionAdminService.deleteOverride(userId, actionId);
```

---

### 7. 🔄 Apply Changes (RECOMMENDED)
**Apply nhiều thay đổi permissions cùng lúc - ĐÂY LÀ API CHÍNH CHO FRONTEND**

```http
PATCH /api/admin/permissions/users/:userId/apply-changes
```

#### Request:
```javascript
PATCH /api/admin/permissions/users/672e54a0f13c9f2e5c4a1234/apply-changes

Headers: {
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}

Body: {
  "changes": [
    {
      "actionId": "672e54a0f13c9f2e5c4a2222",
      "desiredEffective": true,  // User PHẢI có permission này
      "note": "Cấp quyền duyệt hoạt động"
    },
    {
      "actionId": "672e54a0f13c9f2e5c4a3333",
      "desiredEffective": false,  // User KHÔNG được có permission này
      "note": "Thu hồi quyền xuất báo cáo"
    },
    {
      "actionId": "672e54a0f13c9f2e5c4a4444",
      "desiredEffective": true,
      "note": null  // Note optional
    }
  ]
}
```

#### Validation:
```json
// ❌ Invalid request
{
  "success": false,
  "message": "changes must be an array"
}
```

#### Response Success (200):
```json
{
  "success": true,
  "data": {
    "userId": "672e54a0f13c9f2e5c4a1234",
    "changesProcessed": 3,
    "results": [
      {
        "actionId": "672e54a0f13c9f2e5c4a2222",
        "desiredEffective": true,
        "action": "grant",
        "message": "Permission granted",
        "override": { /* override object */ }
      },
      {
        "actionId": "672e54a0f13c9f2e5c4a3333",
        "desiredEffective": false,
        "action": "revoke",
        "message": "Permission revoked",
        "override": { /* override object */ }
      },
      {
        "actionId": "672e54a0f13c9f2e5c4a4444",
        "desiredEffective": true,
        "action": "no-change",
        "message": "User already has this permission via role"
      }
    ],
    "updatedMatrix": { /* Full permission matrix sau khi apply */ }
  }
}
```

#### Logic chi tiết:

| viaRoles | desiredEffective | Action |
|----------|------------------|--------|
| `true`   | `true`          | **no-change** (đã có sẵn) |
| `true`   | `false`         | **revoke** (tạo override is_granted=false) |
| `false`  | `true`          | **grant** (tạo override is_granted=true) |
| `false`  | `false`         | **no-change** (đã không có) |

#### Frontend Usage (QUAN TRỌNG):
```javascript
// ✅ RECOMMENDED: Apply tất cả thay đổi khi user click "Lưu"
const changes = [];

// User toggle checkbox "activity:approve" from false to true
changes.push({
  actionId: "672e54a0f13c9f2e5c4a2222",
  desiredEffective: true,
  note: "Cấp quyền duyệt hoạt động cho Chủ nhiệm"
});

// User toggle checkbox "evidence:approve" from true to false
changes.push({
  actionId: "672e54a0f13c9f2e5c4a3333",
  desiredEffective: false,
  note: "Thu hồi quyền duyệt minh chứng"
});

const response = await permissionAdminService.applyChanges(userId, { changes });

if (response.data.success) {
  const { updatedMatrix, results } = response.data.data;
  
  // Update UI
  setPermissions(updatedMatrix);
  
  // Show notification
  console.log(`Đã xử lý ${results.length} thay đổi`);
  
  // Check for errors
  const errors = results.filter(r => r.action === 'error');
  if (errors.length > 0) {
    alert(`Có ${errors.length} lỗi`);
  }
}
```

---

### 8. 🏢 Get Org Units
**Lấy danh sách đơn vị tổ chức (cho dropdown "Thêm role Staff")**

```http
GET /api/admin/permissions/org-units
```

#### Request:
```javascript
GET /api/admin/permissions/org-units

Headers: {
  "Authorization": "Bearer <token>"
}
```

#### Response Success (200):
```json
{
  "success": true,
  "data": [
    {
      "_id": "672e54a0f13c9f2e5c4a7777",
      "name": "CLB Tin học",
      "description": "Câu lạc bộ Tin học",
      "type": "club"
    },
    {
      "_id": "672e54a0f13c9f2e5c4a7778",
      "name": "Đoàn trường",
      "description": "Đoàn TNCS Hồ Chí Minh",
      "type": "union"
    },
    {
      "_id": "672e54a0f13c9f2e5c4a7779",
      "name": "Phòng CTSV",
      "description": "Phòng Công tác Sinh viên",
      "type": "department"
    },
    {
      "_id": "672e54a0f13c9f2e5c4a7780",
      "name": "Khoa CNTT",
      "description": "Khoa Công nghệ Thông tin",
      "type": "faculty"
    }
  ]
}
```

#### Frontend Usage:
```javascript
// Load org units cho dropdown khi admin click "Thêm role Staff"
const response = await permissionAdminService.getOrgUnits();
const orgUnits = response.data.data;

// Render dropdown
<select>
  {orgUnits.map(org => (
    <option key={org._id} value={org._id}>
      {org.name} - {org.description}
    </option>
  ))}
</select>
```

---

### 9. 👔 Get Positions
**Lấy danh sách chức vụ (cho dropdown "Thêm role Staff")**

```http
GET /api/admin/permissions/positions
```

#### Request:
```javascript
GET /api/admin/permissions/positions

Headers: {
  "Authorization": "Bearer <token>"
}
```

#### Response Success (200):
```json
{
  "success": true,
  "data": [
    "Chủ nhiệm",
    "Phó chủ nhiệm",
    "Trưởng ban",
    "Phó ban",
    "Thành viên",
    "Cố vấn",
    "Ủy viên",
    "Thư ký"
  ]
}
```

#### Frontend Usage:
```javascript
// Load positions cho dropdown
const response = await permissionAdminService.getPositions();
const positions = response.data.data;

// Render dropdown
<select>
  {positions.map(position => (
    <option key={position} value={position}>
      {position}
    </option>
  ))}
</select>
```

---

### 10. ➕ Add Role to User
**Thêm role cho user (VD: thêm staff role cho student)**

```http
POST /api/admin/permissions/users/:userId/add-role
```

#### Request:
```javascript
POST /api/admin/permissions/users/672e54a0f13c9f2e5c4a1234/add-role

Headers: {
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}

Body: {
  "roleName": "staff",  // Required: "staff" | "student" | "admin"
  "orgUnitId": "672e54a0f13c9f2e5c4a7777",  // Required for staff
  "position": "Chủ nhiệm"  // Required for staff
}
```

#### Validation Errors:

```json
// ❌ User not found
{ "success": false, "message": "User not found" }

// ❌ Role not found
{ "success": false, "message": "Role not found" }

// ❌ Missing orgUnitId for staff
{ "success": false, "message": "orgUnitId is required for staff role" }

// ❌ Missing position for staff
{ "success": false, "message": "position is required for staff role" }

// ❌ Org unit not found
{ "success": false, "message": "Org unit not found" }

// ❌ User already has this role
{ "success": false, "message": "User already has this role" }
```

#### Response Success (200):
```json
{
  "success": true,
  "message": "Added staff role to user",
  "data": {
    "userRole": {
      "_id": "672e54a0f13c9f2e5c4a5679",
      "user_id": "672e54a0f13c9f2e5c4a1234",
      "role_id": "672e54a0f13c9f2e5c4a8888",
      "org_unit_id": "672e54a0f13c9f2e5c4a7777"
    },
    "updatedMatrix": { /* Full permission matrix sau khi add role */ }
  }
}
```

#### Side Effects:
1. Tạo record trong `user_role` table
2. Nếu là staff role:
   - Tạo hoặc update `staff_profile`
   - Auto-generate `staff_number` nếu chưa có: `STAFF{timestamp}`
   - Lưu `org_unit_id` và `position`
3. User tự động có **29 BASIC staff permissions** (qua role_action)
4. **22 OPTIONAL staff permissions** chưa có (admin cần grant thêm)

#### Frontend Usage:
```javascript
// Add staff role to student-only user
const handleAddStaffRole = async () => {
  const response = await permissionAdminService.addRoleToUser(userId, {
    roleName: 'staff',
    orgUnitId: selectedOrgUnit,
    position: selectedPosition
  });
  
  if (response.data.success) {
    // Update UI với updatedMatrix
    setPermissions(response.data.data.updatedMatrix);
    
    // Hide "Add Staff Role" button
    setShowAddRoleButton(false);
    
    // Show success message
    alert('Đã thêm role Staff thành công! User giờ có 29 BASIC permissions.');
  }
};
```

---

## 🎨 FRONTEND WORKFLOW (Complete Example)

### Step 1: Search User
```javascript
const handleSearch = async (identifier) => {
  setLoading(true);
  try {
    const response = await permissionAdminService.lookupUserByUsername(identifier);
    const { user, roles, permissionsByRole } = response.data.data;
    
    setSelectedUser(user);
    setUserRoles(roles);
    setPermissions(permissionsByRole);
    
    // Check if user is student only
    const isStudentOnly = roles.length === 1 && roles[0].role_name === 'student';
    setShowAddStaffRoleButton(isStudentOnly);
    
  } catch (error) {
    if (error.response?.status === 404) {
      alert('Không tìm thấy người dùng');
    }
  } finally {
    setLoading(false);
  }
};
```

### Step 2: Display Permissions (Grouped by Role)
```javascript
const renderPermissions = () => {
  return Object.entries(permissions).map(([roleName, roleData]) => (
    <div key={roleName} className="role-section">
      <h3>{roleData.role_name.toUpperCase()}</h3>
      <p>Hiệu lực: {roleData.summary.effectiveCount}/{roleData.summary.totalActions}</p>
      
      {/* Group by resource */}
      {groupByResource(roleData.permissions).map(([resource, actions]) => (
        <div key={resource} className="resource-group">
          <h4>{resource}</h4>
          {actions.map(action => (
            <PermissionCheckbox
              key={action.action_id}
              action={action}
              userRoles={userRoles}
              onChange={handleToggle}
            />
          ))}
        </div>
      ))}
    </div>
  ));
};
```

### Step 3: Permission Checkbox with Disable Logic
```javascript
const PermissionCheckbox = ({ action, userRoles, onChange }) => {
  const hasStaffRole = userRoles.some(r => r.role_name === 'staff');
  
  // Check if can toggle
  const canToggle = canTogglePermission(action.permission_level, hasStaffRole);
  
  // Determine badge
  let badge = null;
  if (action.overrideType === 'grant') {
    badge = <span className="badge-added">Added</span>;
  } else if (action.overrideType === 'revoke') {
    badge = <span className="badge-removed">Removed</span>;
  } else if (action.viaRoles) {
    badge = <span className="badge-via-role">Via Role</span>;
  }
  
  // Tooltip for disabled
  let tooltip = null;
  if (!canToggle) {
    if (action.permission_level === 'admin-only') {
      tooltip = "Chỉ Admin mới có quyền này";
    } else if (action.permission_level === 'staff' && !hasStaffRole) {
      tooltip = "Cần có role Tổ chức để được cấp quyền này";
    }
  }
  
  return (
    <div className="permission-item" title={tooltip}>
      <input
        type="checkbox"
        checked={action.effective}
        disabled={!canToggle}
        onChange={(e) => onChange(action.action_id, e.target.checked)}
      />
      <label>{action.action_name}</label>
      {badge}
      {action.overrideNote && <span className="note">{action.overrideNote}</span>}
    </div>
  );
};

// Helper function
const canTogglePermission = (permissionLevel, hasStaffRole) => {
  if (permissionLevel === 'student') return true;
  if (permissionLevel === 'staff') return hasStaffRole;
  if (permissionLevel === 'admin-only') return false;
  return true;
};
```

### Step 4: Track Changes
```javascript
const [pendingChanges, setPendingChanges] = useState([]);

const handleToggle = (actionId, checked) => {
  // Add to pending changes
  setPendingChanges(prev => {
    const existing = prev.find(c => c.actionId === actionId);
    if (existing) {
      return prev.map(c => 
        c.actionId === actionId 
          ? { ...c, desiredEffective: checked }
          : c
      );
    }
    return [...prev, { actionId, desiredEffective: checked, note: '' }];
  });
  
  // Update UI immediately (optimistic update)
  setPermissions(prev => {
    // ... update permissions object
  });
};
```

### Step 5: Save Changes
```javascript
const handleSave = async () => {
  if (pendingChanges.length === 0) {
    alert('Không có thay đổi nào');
    return;
  }
  
  setSaving(true);
  try {
    const response = await permissionAdminService.applyChanges(
      selectedUser.id,
      { changes: pendingChanges }
    );
    
    if (response.data.success) {
      const { updatedMatrix, results } = response.data.data;
      
      // Update UI
      setPermissions(updatedMatrix.permissionsByRole);
      setPendingChanges([]);
      
      // Show summary
      const granted = results.filter(r => r.action === 'grant').length;
      const revoked = results.filter(r => r.action === 'revoke').length;
      alert(`Đã lưu thành công!\nCấp: ${granted}, Thu hồi: ${revoked}`);
    }
  } catch (error) {
    alert('Lỗi khi lưu: ' + error.message);
  } finally {
    setSaving(false);
  }
};
```

### Step 6: Add Staff Role (Modal)
```javascript
const handleAddStaffRole = async () => {
  // Validate
  if (!selectedOrgUnit || !selectedPosition) {
    alert('Vui lòng chọn đơn vị và chức vụ');
    return;
  }
  
  setSaving(true);
  try {
    const response = await permissionAdminService.addRoleToUser(
      selectedUser.id,
      {
        roleName: 'staff',
        orgUnitId: selectedOrgUnit,
        position: selectedPosition
      }
    );
    
    if (response.data.success) {
      // Update UI
      const { updatedMatrix } = response.data.data;
      setPermissions(updatedMatrix.permissionsByRole);
      setUserRoles(updatedMatrix.roles);
      
      // Hide button
      setShowAddStaffRoleButton(false);
      
      // Close modal
      setShowModal(false);
      
      alert('Đã thêm role Staff! User giờ có 29 BASIC permissions tự động.');
    }
  } catch (error) {
    alert('Lỗi: ' + error.response?.data?.message);
  } finally {
    setSaving(false);
  }
};
```

---

## ⚠️ COMMON ERRORS & HANDLING

### 1. 403 Forbidden
```json
{ "success": false, "message": "Permission denied" }
```
**Cause:** User không có `permission:update`  
**Fix:** Redirect về trang chủ, show message "Bạn không có quyền truy cập"

### 2. 404 User Not Found
```json
{ "success": false, "message": "Không tìm thấy người dùng..." }
```
**Cause:** Identifier sai hoặc user không tồn tại  
**Fix:** Show error "Không tìm thấy người dùng với MSSV/username này"

### 3. 400 Validation Error
```json
{ "success": false, "message": "orgUnitId is required for staff role" }
```
**Cause:** Missing required fields  
**Fix:** Validate form trước khi submit

### 4. 500 Server Error
```json
{ "success": false, "message": "Internal server error" }
```
**Cause:** Backend bug or DB connection issue  
**Fix:** Show generic error, log to console

---

## 🧪 TESTING CHECKLIST

### 1. Authorization
- [ ] Access without token → 401
- [ ] Access with student/staff token → 403
- [ ] Access with admin token → 200

### 2. Lookup User
- [ ] Search by username → Found
- [ ] Search by MSSV → Found
- [ ] Search by staff_number → Found
- [ ] Search invalid identifier → 404

### 3. Permission Display
- [ ] Student-only user → Show "Add Staff Role" button
- [ ] Staff user → Show staff permissions
- [ ] Both roles → Show permissions grouped by role
- [ ] Staff permissions disabled if no staff role

### 4. Add Staff Role
- [ ] Select org unit + position → Success
- [ ] Missing org unit → Error
- [ ] Missing position → Error
- [ ] Already has staff role → Error
- [ ] After add → 29 BASIC permissions auto-granted

### 5. Permission Changes
- [ ] Toggle checkbox → Track in pendingChanges
- [ ] Save changes → Apply via API
- [ ] Reload → Correct permissions displayed
- [ ] BASIC permission (viaRoles=true, toggle off) → Create revoke override
- [ ] OPTIONAL permission (viaRoles=false, toggle on) → Create grant override

### 6. Badges
- [ ] Via Role → Blue badge
- [ ] Added (override grant) → Green badge
- [ ] Removed (override revoke) → Red badge
- [ ] Unsaved change → Yellow badge

### 7. Tooltips
- [ ] Admin-only permission → "Chỉ Admin mới có quyền này"
- [ ] Staff permission without staff role → "Cần có role Tổ chức..."

---

## 📦 AXIOS SERVICE EXAMPLE

```javascript
// frontend/src/services/permissionAdminService.js
import api from './api';

const API_BASE = '/admin/permissions';

export default {
  // 1. Lookup user
  lookupUserByUsername: (identifier) => 
    api.get(`${API_BASE}/lookup-user/${identifier}`),
  
  // 2. Get user permissions by ID
  getUserPermissions: (userId, orgUnitId = null) => 
    api.get(`${API_BASE}/users/${userId}`, { params: { orgUnitId } }),
  
  // 3. Get available permissions
  getAvailablePermissions: (userId, orgUnitId = null) => 
    api.get(`${API_BASE}/users/${userId}/available`, { params: { orgUnitId } }),
  
  // 4. Grant permission
  grantPermission: (userId, actionId, note = '') => 
    api.post(`${API_BASE}/users/${userId}/grant/${actionId}`, { note }),
  
  // 5. Revoke permission
  revokePermission: (userId, actionId, note = '') => 
    api.post(`${API_BASE}/users/${userId}/revoke/${actionId}`, { note }),
  
  // 6. Delete override
  deleteOverride: (userId, actionId) => 
    api.delete(`${API_BASE}/users/${userId}/override/${actionId}`),
  
  // 7. Apply changes (RECOMMENDED)
  applyChanges: (userId, payload) => 
    api.patch(`${API_BASE}/users/${userId}/apply-changes`, payload),
  
  // 8. Get org units
  getOrgUnits: () => 
    api.get(`${API_BASE}/org-units`),
  
  // 9. Get positions
  getPositions: () => 
    api.get(`${API_BASE}/positions`),
  
  // 10. Add role to user
  addRoleToUser: (userId, payload) => 
    api.post(`${API_BASE}/users/${userId}/add-role`, payload)
};
```

---

## 🎯 SUMMARY

| Endpoint | Method | Purpose | Main Use Case |
|----------|--------|---------|---------------|
| `/lookup-user/:identifier` | GET | Search user & get permissions | Initial load when admin searches |
| `/users/:userId` | GET | Get permissions by ID | Reload after changes |
| `/users/:userId/available` | GET | Get available permissions | Optional: filter permissions |
| `/users/:userId/grant/:actionId` | POST | Grant single permission | Rarely used (use apply-changes) |
| `/users/:userId/revoke/:actionId` | POST | Revoke single permission | Rarely used (use apply-changes) |
| `/users/:userId/override/:actionId` | DELETE | Delete override | Revert to role default |
| `/users/:userId/apply-changes` | PATCH | **Apply multiple changes** | **PRIMARY: Save all changes** |
| `/org-units` | GET | Get org units | Dropdown in Add Role modal |
| `/positions` | GET | Get positions | Dropdown in Add Role modal |
| `/users/:userId/add-role` | POST | Add role to user | Add staff role to student |

---

**🔥 KEY TAKEAWAYS:**
1. **Use `apply-changes` for saving** - Không dùng grant/revoke riêng lẻ
2. **Permission levels matter** - Check `permission_level` để disable checkboxes
3. **BASIC vs OPTIONAL** - Staff tự động có BASIC, OPTIONAL phải grant
4. **Always reload after changes** - API returns `updatedMatrix`
5. **Validate before submit** - Check required fields cho add-role

---

📝 **Generated:** 2025-01-15  
📧 **Contact:** Backend Team  
🔗 **Related:** `backend/STAFF_PERMISSIONS_README.md`




