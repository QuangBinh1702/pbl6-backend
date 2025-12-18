# Admin Permission Management System

## Tổng Quan

Hệ thống quản lý quyền hạn cho phép admin:
1. **Xem** tất cả quyền hạn của một người dùng
2. **Cấp** hoặc **Thu hồi** quyền từng cái cho người dùng cụ thể
3. **Quản lý** ghi đè quyền (override) độc lập với role definitions
4. **Hỗ trợ** người dùng có nhiều role (Student + Staff)

## Architecture

### Backend Flow

```
User Request
    ↓
admin_permission.routes.js (API endpoints)
    ↓
permission_admin.util.js (Business Logic)
    ├── buildUserPermissionMatrix()
    ├── grantPermissionToUser()
    ├── revokePermissionFromUser()
    ├── deletePermissionOverride()
    └── applyPermissionChanges()
    ↓
Database
    ├── user_role (User's roles)
    ├── role_action (What each role can do)
    ├── action (Master action list)
    └── user_action_override (User-specific exceptions)
```

### Frontend Flow

```
PermissionAdminPanel Component
    ↓
Input: User ID
    ↓
permissionAdminService.js (API Client)
    ├── getUserPermissions()
    ├── grantPermission()
    ├── revokePermission()
    └── applyPermissionChanges()
    ↓
Display: Permission Matrix
    ├── User Info & Roles
    ├── Permissions grouped by resource
    ├── Show action_name + action_code
    ├── Indicate via-role vs override
    └── Toggle grant/deny
```

## Phase 1: Backend Implementation ✅

### Files Created

1. **`/src/utils/permission_admin.util.js`**
   - Core business logic for permission management
   - Functions:
     - `buildUserPermissionMatrix()` - Get full permission state
     - `grantPermissionToUser()` - Add permission to user
     - `revokePermissionFromUser()` - Remove permission from user
     - `deletePermissionOverride()` - Revert to role-based permissions
     - `applyPermissionChanges()` - Bulk change operations

2. **`/src/routes/admin_permission.routes.js`**
   - API endpoints:
     - `GET /api/admin/permissions/users/:userId` - Get permission matrix
     - `GET /api/admin/permissions/users/:userId/available` - Get available actions
     - `POST /api/admin/permissions/users/:userId/grant/:actionId` - Grant permission
     - `POST /api/admin/permissions/users/:userId/revoke/:actionId` - Revoke permission
     - `DELETE /api/admin/permissions/users/:userId/override/:actionId` - Delete override
     - `PATCH /api/admin/permissions/users/:userId/apply-changes` - Bulk changes

3. **`/src/app.js`** (Modified)
   - Added: `app.use('/api/admin/permissions', require('./routes/admin_permission.routes'));`

### Testing Backend

```bash
# Run test script
cd backend
node test_admin_permission.js
```

Expected output:
```
✅ Building permission matrix
📊 Summary:
   - Total Actions: 89
   - Effective Permissions: 12
   - Overrides: 0
✅ Grant permission successful
✅ Revoke permission successful
```

### API Examples

#### 1. Get User Permissions

```bash
curl -X GET "http://localhost:5000/api/admin/permissions/users/USER_ID" \
  -H "Authorization: Bearer TOKEN"
```

Response:
```json
{
  "success": true,
  "data": {
    "userId": "...",
    "user": {
      "id": "...",
      "username": "student1",
      "name": "Nguyễn Văn A"
    },
    "roles": [
      {
        "role_id": "...",
        "role_name": "student",
        "role_description": "Student role"
      }
    ],
    "permissions": [
      {
        "action_id": "...",
        "resource": "activity",
        "action_code": "READ",
        "action_name": "Xem hoạt động",
        "description": "View activities",
        "viaRoles": true,           // Comes from role
        "overrideType": null,       // No override
        "effective": true           // Final state
      },
      {
        "action_id": "...",
        "resource": "activity",
        "action_code": "CREATE",
        "action_name": "Tạo hoạt động",
        "viaRoles": false,          // Not from role
        "overrideType": "grant",    // Override grants it
        "grantedByName": "Admin",
        "grantedAt": "2025-01-15T10:30:00Z",
        "effective": true
      }
    ],
    "summary": {
      "totalActions": 89,
      "effectiveCount": 12,
      "overrideCount": 1,
      "grantedCount": 1,
      "revokedCount": 0
    }
  }
}
```

#### 2. Grant Permission

```bash
curl -X POST "http://localhost:5000/api/admin/permissions/users/USER_ID/grant/ACTION_ID" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "note": "Cấp quyền xóa hoạt động cho sinh viên trưởng lớp"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "result": {
      "success": true,
      "message": "Permission granted to user",
      "actionTaken": "CREATED_OVERRIDE"
    },
    "updatedMatrix": { ... }
  }
}
```

#### 3. Revoke Permission

```bash
curl -X POST "http://localhost:5000/api/admin/permissions/users/USER_ID/revoke/ACTION_ID" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "note": "Sinh viên đã rời vị trí lớp trưởng"
  }'
```

#### 4. Apply Multiple Changes

```bash
curl -X PATCH "http://localhost:5000/api/admin/permissions/users/USER_ID/apply-changes" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "changes": [
      {
        "actionId": "ACTION_ID_1",
        "desiredEffective": true,
        "note": "Grant this"
      },
      {
        "actionId": "ACTION_ID_2",
        "desiredEffective": false,
        "note": "Revoke this"
      }
    ]
  }'
```

## Phase 2: Frontend Implementation ✅

### Files Created

1. **`/frontend/src/services/permissionAdminService.js`**
   - API client for permission management
   - Functions mirror backend endpoints

2. **`/frontend/src/components/PermissionAdminPanel.jsx`**
   - Main component for permission management
   - Features:
     - User selection input
     - Permission matrix display
     - Resource grouping (collapsible)
     - Real-time toggle for grant/deny
     - Bulk save with change tracking
     - Status messages (success/error)

3. **`/frontend/src/components/PermissionAdminPanel.css`**
   - Professional styling
   - Responsive design
   - Dark mode ready (can be extended)

4. **`/frontend/src/pages/AdminPermissionPage.jsx`**
   - Page wrapper for full-screen access

5. **`/frontend/src/pages/AdminPermissionPage.css`**
   - Page-level styling

### Using the Frontend Component

#### In a Dashboard

```jsx
import PermissionAdminPanel from '../components/PermissionAdminPanel';

function AdminDashboard() {
  return (
    <div>
      <PermissionAdminPanel />
    </div>
  );
}
```

#### As Modal

```jsx
import PermissionAdminPanel from '../components/PermissionAdminPanel';
import { useState } from 'react';

function AdminDashboard() {
  const [showModal, setShowModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  return (
    <>
      {showModal && (
        <div className="modal">
          <PermissionAdminPanel
            userId={selectedUserId}
            onClose={() => setShowModal(false)}
          />
        </div>
      )}
      {/* Rest of dashboard */}
    </>
  );
}
```

### Component Features

#### 1. User Selection
- Input field for User ID
- Automatically loads permissions on selection
- Displays loading state

#### 2. User Info Card
- User name and ID
- List of assigned roles
- Summary statistics:
  - Total available actions
  - Number of effective permissions
  - Number of overrides

#### 3. Permission Display
- **Grouped by Resource**
  - activity, user, report, evidence, etc.
  - Collapsible for better UX

- **Per Action Row**
  - Action Name: "Tạo hoạt động"
  - Action Code: CREATE (color-coded background)
  - Description: "Create new activities"
  - Badges:
    - "Via Role" - comes from user's role
    - "✚ Added" - granted override
    - "✕ Removed" - revoked override
  - Toggle checkbox for grant/deny
  - Current state indicator

#### 4. Change Tracking
- Unsaved changes highlighted in yellow
- Shows count of pending changes
- Can cancel changes before saving
- Batch save all at once

#### 5. Visual Indicators
- ✅ Granted - green
- ❌ Denied - red
- "Via Role" - blue badge (inherited)
- "Override" - orange badge (manually changed)

### UI Screenshots (Text Description)

```
┌─────────────────────────────────────────────────────────────────┐
│ 📋 Quản lý quyền hạn người dùng                            [✕] │
├─────────────────────────────────────────────────────────────────┤
│ Chọn người dùng:  [User ID or name............] [Tải quyền]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ ┌─ User Info ───────────────────────────────────────────────┐   │
│ │ Nguyễn Văn A                                              │   │
│ │ ID: 507f1f77bcf86cd799439011                             │   │
│ │                                                            │   │
│ │ Các vai trò: [student] [staff]                           │   │
│ │                                                            │   │
│ │ Tổng quyền: 89  │ Có quyền: 15  │ Đã tùy chỉnh: 2       │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│ ┌─ Permissions by Resource ─────────────────────────────────┐   │
│ │                                                             │   │
│ │ ▼ activity (3/5)                                           │   │
│ │   ☑ Xem hoạt động       [READ]  Via Role        [✓ Granted]│   │
│ │   ☐ Tạo hoạt động      [CREATE]                 [✓ Granted]│   │
│ │   ☐ Sửa hoạt động      [UPDATE]                 [✗ Denied] │   │
│ │   ☐ Xóa hoạt động      [DELETE] ✚ Added        [✓ Granted]│   │
│ │   ☐ Duyệt hoạt động    [APPROVE]                [✗ Denied] │   │
│ │                                                             │   │
│ │ ▼ user (2/8)                                               │   │
│ │   ☑ Xem người dùng      [READ]  Via Role        [✓ Granted]│   │
│ │   ☐ Tạo người dùng      [CREATE]                [✗ Denied] │   │
│ │   ... (6 more)                                              │   │
│ │                                                             │   │
│ │ ▶ evidence (0/5)                                            │   │
│ │                                                             │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│ [💾 Lưu thay đổi] [✕ Hủy] ← (2 thay đổi chưa lưu)            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Scenarios & Usage

### Scenario 1: Grant Additional Permission to Student

1. Open Admin Permission Panel
2. Enter student ID
3. Find the permission you want to grant (e.g., "activity:DELETE")
4. Click toggle to enable it
5. Click "Lưu thay đổi"
6. Permission appears with "✚ Added" badge

### Scenario 2: Multiple Roles (Student + Staff)

User "Hồ Chí Minh" has:
- Role: **student** (has: activity:READ, activity_registration:CREATE)
- Role: **staff** (has: activity:CREATE, activity:APPROVE, evidence:APPROVE)

System shows **union** of all permissions:
- activity:READ ✓ (via student role)
- activity_registration:CREATE ✓ (via student role)
- activity:CREATE ✓ (via staff role)
- activity:APPROVE ✓ (via staff role)
- evidence:APPROVE ✓ (via staff role)

Admin can then:
- Grant activity:DELETE (adds override)
- Revoke evidence:APPROVE (creates deny override, but still shown since staff role has it)

### Scenario 3: Remove Permission from permissions.config.js

Old staff had `activity:DELETE`, but you remove it:

1. Delete `role_action` record from DB
2. Existing `user_action_override` with `is_granted: true` for that action **still works**
3. User still has the permission via override
4. Permission matrix shows:
   - viaRoles: false (not from role anymore)
   - overrideType: "grant" (from override)
   - effective: true (still works!)

5. Admin can later revoke it by clicking toggle or deleting override

## Key Concepts

### Via Roles vs Overrides

```
Permission State = Via Roles + Overrides

Example 1: Student with "activity:READ" from role
└─ Via Roles: true
└─ Override: null
└─ Effective: true ✓

Example 2: Student wanting "activity:CREATE" (not in student role)
└─ Via Roles: false
└─ Override: grant (admin added it)
└─ Effective: true ✓

Example 3: Staff with "activity:DELETE" from role, but admin revoked it
└─ Via Roles: true
└─ Override: revoke (admin removed it)
└─ Effective: false ✗

Example 4: Permission comes from role and has override
└─ Via Roles: true
└─ Override: revoke (admin overrode it)
└─ Effective: false ✗ (override takes priority)
```

### When Roles Change

**Scenario: Admin removes `activity:DELETE` from student role**

Before:
```
User "ABC" (student role)
├─ activity:DELETE via role ✓
└─ No override
```

After deleting role_action:
```
User "ABC" (student role)
├─ activity:DELETE NO LONGER via role
└─ No override
Result: ✗ No permission
```

**But if user had override:**
```
User "ABC" (student role)
├─ activity:DELETE NO LONGER via role
└─ Override grant ✓
Result: ✓ Still has permission (override persists!)
```

## Admin Routes Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/permissions/users/:userId` | GET | Get full permission matrix |
| `/api/admin/permissions/users/:userId/available` | GET | Get available actions for user |
| `/api/admin/permissions/users/:userId/grant/:actionId` | POST | Grant specific permission |
| `/api/admin/permissions/users/:userId/revoke/:actionId` | POST | Revoke specific permission |
| `/api/admin/permissions/users/:userId/override/:actionId` | DELETE | Delete override, revert to role |
| `/api/admin/permissions/users/:userId/apply-changes` | PATCH | Apply multiple changes at once |

## Database Changes

No schema changes needed! Uses existing tables:
- `user_role` - User's roles (unchanged)
- `role_action` - Role to action mapping (unchanged)
- `action` - Master action list (unchanged)
- `user_action_override` - User-specific overrides (unchanged)

## Testing

### Backend Test
```bash
cd backend
node test_admin_permission.js
```

### Frontend Test
1. Start backend: `npm run dev`
2. Start frontend: `npm start`
3. Navigate to: `http://localhost:3000/admin/permissions`
4. Enter any user ID
5. Click "Tải quyền"
6. Try toggling permissions
7. Click "Lưu thay đổi"

## Troubleshooting

### Issue: "User not found"
- Check user ID format (should be MongoDB ObjectId)
- Verify user exists in database

### Issue: "Action not found"
- Check action ID format
- Verify action is marked as `is_active: true`

### Issue: No permissions showing
- User might not have any roles assigned
- Check `user_role` collection for user
- Check if actions exist and are `is_active: true`

### Issue: Changes not saving
- Check browser console for errors
- Verify API endpoint is working: `curl http://localhost:5000/api/admin/permissions/users/USER_ID`
- Check authentication token is valid

## Future Enhancements

1. **Audit Log**
   - Track who changed what permission when
   - Reasons for changes
   - Ability to rollback changes

2. **Batch Operations**
   - Copy permissions from one user to another
   - Apply same permission set to multiple users
   - Permission templates

3. **Permission Groups**
   - Group related permissions (e.g., all activity permissions)
   - Grant/revoke by group instead of individually

4. **Time-based Permissions**
   - Permission valid from date X to Y
   - Automatic expiration
   - Temporary elevation for specific period

5. **Approval Workflow**
   - Request permission changes
   - Admin approval required
   - Email notifications

## Support

For issues or questions:
1. Check troubleshooting section
2. Review test output
3. Check backend console logs
4. Review API response in browser Network tab
