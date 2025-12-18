# ⚡ ADMIN PERMISSIONS API - QUICK REFERENCE

**Base URL:** `http://localhost:5000/api/admin/permissions`  
**Auth:** Bearer token, requires `permission:update` (admin only)

---

## 📋 10 ENDPOINTS

### 1️⃣ Search User
```javascript
GET /lookup-user/:identifier

// Examples
GET /lookup-user/102220095       // MSSV
GET /lookup-user/STAFF123        // Staff number
GET /lookup-user/john_doe        // Username

Response: {
  success: true,
  data: {
    user: { id, username, name },
    roles: [{ role_name, org_unit_id }],
    permissionsByRole: {
      student: { permissions: [...], summary: {...} },
      staff: { permissions: [...], summary: {...} }
    }
  }
}
```

### 2️⃣ Get Permissions by ID
```javascript
GET /users/:userId?orgUnitId=...

// Same response as lookup-user
```

### 3️⃣ Get Available Permissions
```javascript
GET /users/:userId/available

Response: {
  success: true,
  data: {
    availableActions: [...],
    count: 45
  }
}
```

### 4️⃣ Grant Permission (Single)
```javascript
POST /users/:userId/grant/:actionId
Body: { note: "..." }

Response: { success: true, data: { result, updatedMatrix } }
```

### 5️⃣ Revoke Permission (Single)
```javascript
POST /users/:userId/revoke/:actionId
Body: { note: "..." }

Response: { success: true, data: { result, updatedMatrix } }
```

### 6️⃣ Delete Override
```javascript
DELETE /users/:userId/override/:actionId

Response: { success: true, data: { result, updatedMatrix } }
```

### 7️⃣ Apply Changes ⭐ (MAIN API)
```javascript
PATCH /users/:userId/apply-changes
Body: {
  changes: [
    { actionId: "...", desiredEffective: true, note: "..." },
    { actionId: "...", desiredEffective: false, note: "..." }
  ]
}

Response: {
  success: true,
  data: {
    changesProcessed: 3,
    results: [...],
    updatedMatrix: {...}
  }
}
```

### 8️⃣ Get Org Units
```javascript
GET /org-units

Response: {
  success: true,
  data: [
    { _id, name, description, type },
    ...
  ]
}
```

### 9️⃣ Get Positions
```javascript
GET /positions

Response: {
  success: true,
  data: ["Chủ nhiệm", "Phó chủ nhiệm", ...]
}
```

### 🔟 Add Role
```javascript
POST /users/:userId/add-role
Body: {
  roleName: "staff",
  orgUnitId: "...",  // Required for staff
  position: "Chủ nhiệm"  // Required for staff
}

Response: {
  success: true,
  message: "Added staff role to user",
  data: { userRole, updatedMatrix }
}
```

---

## 🎯 PERMISSION OBJECT STRUCTURE

```javascript
{
  action_id: "672e54a0...",
  resource: "activity",
  action_code: "APPROVE",
  action_name: "Duyệt hoạt động",
  description: "Duyệt hoạt động đã tạo",
  
  // UI Logic
  permission_level: "student" | "staff" | "admin-only",
  
  // Permission State
  viaRoles: true,           // Has via role_action (BASIC)
  overrideType: "grant" | "revoke" | null,
  effective: true,          // Final result
  
  // Override Info
  overrideId: "...",
  overrideNote: "Cấp quyền...",
  grantedByName: "Admin Nguyễn Văn B",
  grantedAt: "2025-01-15T10:30:00.000Z"
}
```

---

## 🎨 FRONTEND LOGIC

### Disable Checkbox
```javascript
const canToggle = (permission_level, hasStaffRole) => {
  if (permission_level === 'student') return true;
  if (permission_level === 'staff') return hasStaffRole;
  if (permission_level === 'admin-only') return false;
  return true;
};
```

### Badge Display
```javascript
if (overrideType === 'grant') return <Badge color="green">Added</Badge>;
if (overrideType === 'revoke') return <Badge color="red">Removed</Badge>;
if (viaRoles) return <Badge color="blue">Via Role</Badge>;
return null;
```

### Save Flow
```javascript
// 1. User toggles checkboxes → Track in state
const [pendingChanges, setPendingChanges] = useState([]);

// 2. User clicks "Save" → Call apply-changes
const response = await api.patch('/users/:userId/apply-changes', {
  changes: pendingChanges
});

// 3. Update UI with updatedMatrix
setPermissions(response.data.data.updatedMatrix);
setPendingChanges([]);
```

---

## 🔥 COMMON PATTERNS

### Pattern 1: Search & Display
```javascript
const handleSearch = async (identifier) => {
  const res = await api.get(`/lookup-user/${identifier}`);
  const { user, roles, permissionsByRole } = res.data.data;
  
  setUser(user);
  setRoles(roles);
  setPermissions(permissionsByRole);
  
  // Check if student only
  const isStudentOnly = roles.length === 1 && roles[0].role_name === 'student';
  setShowAddRoleBtn(isStudentOnly);
};
```

### Pattern 2: Add Staff Role
```javascript
const handleAddStaffRole = async () => {
  const res = await api.post(`/users/${userId}/add-role`, {
    roleName: 'staff',
    orgUnitId: selectedOrgUnit,
    position: selectedPosition
  });
  
  // User now has 29 BASIC permissions
  setPermissions(res.data.data.updatedMatrix.permissionsByRole);
  setRoles(res.data.data.updatedMatrix.roles);
  setShowAddRoleBtn(false);
};
```

### Pattern 3: Save Changes
```javascript
const handleSave = async () => {
  const res = await api.patch(`/users/${userId}/apply-changes`, {
    changes: pendingChanges
  });
  
  setPermissions(res.data.data.updatedMatrix.permissionsByRole);
  setPendingChanges([]);
  
  alert(`Saved! ${res.data.data.changesProcessed} changes applied`);
};
```

---

## 📊 BASIC vs OPTIONAL (Staff)

### BASIC (29) - Auto via role_action
```
activity:create, read, update
attendance:scan, read, verify, export
pvcd_record:create, read, update, adjust
activity_registration:read, approve, reject, cancel
post:create, read, update, delete
... (total 29)
```

### OPTIONAL (22) - Manual grant via override
```
activity:approve, reject, export
evidence:read, approve, reject
report:view_overview, view_detail, export
class:read, manage_students, attendance, report
student_profile:read, update
... (total 22)
```

---

## ⚠️ ERROR CODES

| Code | Message | Action |
|------|---------|--------|
| 401 | Unauthorized | Redirect to login |
| 403 | Permission denied | Show "No access" |
| 404 | User not found | Show error message |
| 400 | Validation error | Show field error |
| 500 | Server error | Show generic error |

---

## 🧪 TESTING CHECKLIST

- [ ] Search by username/MSSV/staff_number
- [ ] Display permissions grouped by role
- [ ] Student-only → Show "Add Role" button
- [ ] Add staff role → 29 BASIC permissions granted
- [ ] Toggle BASIC permission off → Create revoke override
- [ ] Toggle OPTIONAL permission on → Create grant override
- [ ] Disable checkboxes based on permission_level
- [ ] Show tooltips for disabled checkboxes
- [ ] Save changes → Call apply-changes API
- [ ] Display badges (Via Role, Added, Removed)

---

📝 **Full documentation:** `ADMIN_PERMISSIONS_API_FRONTEND.md`

