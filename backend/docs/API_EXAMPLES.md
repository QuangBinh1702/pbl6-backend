# Admin Permission API Examples

## Table of Contents
1. [Get Permission Matrix](#1-get-permission-matrix)
2. [Grant Permission](#2-grant-permission)
3. [Revoke Permission](#3-revoke-permission)
4. [Delete Override](#4-delete-override)
5. [Apply Multiple Changes](#5-apply-multiple-changes)

---

## 1. Get Permission Matrix

### Request
```bash
curl -X GET "http://localhost:5000/api/admin/permissions/users/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer your_token_here" \
  -H "Content-Type: application/json"
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "username": "student1",
      "name": "Nguyễn Văn A"
    },
    "orgUnitId": null,
    "roles": [
      {
        "user_role_id": "507f191e810c19729de860ea",
        "role_id": "507f191e810c19729de860eb",
        "role_name": "student",
        "role_description": "Student in the system",
        "org_unit_id": null
      }
    ],
    "permissions": [
      {
        "action_id": "507f191e810c19729de860ec",
        "resource": "activity",
        "action_code": "READ",
        "action_name": "Xem hoạt động",
        "description": "View activities list and details",
        "viaRoles": true,
        "overrideType": null,
        "overrideId": null,
        "overrideNote": null,
        "grantedByName": null,
        "grantedAt": null,
        "effective": true
      },
      {
        "action_id": "507f191e810c19729de860ed",
        "resource": "activity",
        "action_code": "CREATE",
        "action_name": "Tạo hoạt động",
        "description": "Create new activities",
        "viaRoles": false,
        "overrideType": "grant",
        "overrideId": "507f191e810c19729de860ee",
        "overrideNote": "Cấp quyền tạo hoạt động ngoài trường",
        "grantedByName": "Admin User",
        "grantedAt": "2025-01-15T10:30:00Z",
        "effective": true
      },
      {
        "action_id": "507f191e810c19729de860ef",
        "resource": "activity",
        "action_code": "DELETE",
        "action_name": "Xóa hoạt động",
        "description": "Delete activities",
        "viaRoles": false,
        "overrideType": "revoke",
        "overrideId": "507f191e810c19729de860f0",
        "overrideNote": "Đang kiểm tra khả năng",
        "grantedByName": "Admin User",
        "grantedAt": "2025-01-14T15:20:00Z",
        "effective": false
      },
      {
        "action_id": "507f191e810c19729de860f1",
        "resource": "attendance",
        "action_code": "READ",
        "action_name": "Xem điểm danh",
        "description": "View attendance records",
        "viaRoles": true,
        "overrideType": null,
        "overrideId": null,
        "overrideNote": null,
        "grantedByName": null,
        "grantedAt": null,
        "effective": true
      }
    ],
    "summary": {
      "totalActions": 89,
      "effectiveCount": 15,
      "overrideCount": 2,
      "grantedCount": 1,
      "revokedCount": 1
    }
  }
}
```

### Key Points
- **viaRoles**: `true` = comes from user's role, `false` = override only
- **overrideType**: `"grant"` | `"revoke"` | `null`
- **effective**: Final permission state (true = user can do this action)
- **summary**: Useful for UI display
  - `totalActions`: All actions in system
  - `effectiveCount`: Permissions user actually has
  - `overrideCount`: Manually changed permissions
  - `grantedCount`: Overrides that GRANT access
  - `revokedCount`: Overrides that DENY access

---

## 2. Grant Permission

### Request
```bash
curl -X POST "http://localhost:5000/api/admin/permissions/users/507f1f77bcf86cd799439011/grant/507f191e810c19729de860ed" \
  -H "Authorization: Bearer your_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "note": "Cấp quyền tạo hoạt động cho sinh viên tham gia tổ chức"
  }'
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "result": {
      "success": true,
      "message": "Permission granted to user",
      "actionTaken": "CREATED_OVERRIDE",
      "override": {
        "_id": "507f191e810c19729de860ee",
        "user_id": "507f1f77bcf86cd799439011",
        "action_id": "507f191e810c19729de860ed",
        "is_granted": true,
        "note": "Cấp quyền tạo hoạt động cho sinh viên tham gia tổ chức",
        "granted_by": "507f1f77bcf86cd799439012",
        "granted_at": "2025-01-15T11:45:00Z"
      }
    },
    "updatedMatrix": {
      "userId": "507f1f77bcf86cd799439011",
      "user": { ... },
      "roles": [ ... ],
      "permissions": [
        {
          "action_id": "507f191e810c19729de860ed",
          "resource": "activity",
          "action_code": "CREATE",
          "action_name": "Tạo hoạt động",
          "viaRoles": false,
          "overrideType": "grant",
          "effective": true
        }
      ],
      "summary": {
        "totalActions": 89,
        "effectiveCount": 16,
        "overrideCount": 1,
        "grantedCount": 1,
        "revokedCount": 0
      }
    }
  }
}
```

### Possible actionTaken Values
- `"CREATED_OVERRIDE"` - New override created
- `"OVERRIDE_CHANGED"` - Existing override changed
- `"REMOVED_DENY_OVERRIDE"` - Removed revoke, user now has it via role
- `"NONE"` - No action needed, already granted

---

## 3. Revoke Permission

### Request
```bash
curl -X POST "http://localhost:5000/api/admin/permissions/users/507f1f77bcf86cd799439011/revoke/507f191e810c19729de860ec" \
  -H "Authorization: Bearer your_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "note": "Sinh viên được cử làm lớp trưởng, cần giới hạn quyền"
  }'
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "result": {
      "success": true,
      "message": "Permission revoked from user",
      "actionTaken": "CREATED_OVERRIDE",
      "override": {
        "_id": "507f191e810c19729de860f0",
        "user_id": "507f1f77bcf86cd799439011",
        "action_id": "507f191e810c19729de860ec",
        "is_granted": false,
        "note": "Sinh viên được cử làm lớp trưởng, cần giới hạn quyền",
        "granted_by": "507f1f77bcf86cd799439012",
        "granted_at": "2025-01-15T11:50:00Z"
      }
    },
    "updatedMatrix": {
      "permissions": [
        {
          "action_id": "507f191e810c19729de860ec",
          "resource": "activity",
          "action_code": "READ",
          "action_name": "Xem hoạt động",
          "viaRoles": true,
          "overrideType": "revoke",
          "effective": false
        }
      ]
    }
  }
}
```

### Note
Even though action came from role (`viaRoles: true`), override can revoke it. Override takes priority!

---

## 4. Delete Override

### Request
```bash
curl -X DELETE "http://localhost:5000/api/admin/permissions/users/507f1f77bcf86cd799439011/override/507f191e810c19729de860f0" \
  -H "Authorization: Bearer your_token_here" \
  -H "Content-Type: application/json"
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "result": {
      "success": true,
      "message": "Override removed, reverted to role-based permissions",
      "actionTaken": "DELETED"
    },
    "updatedMatrix": {
      "permissions": [
        {
          "action_id": "507f191e810c19729de860ec",
          "resource": "activity",
          "action_code": "READ",
          "action_name": "Xem hoạt động",
          "viaRoles": true,
          "overrideType": null,
          "effective": true
        }
      ]
    }
  }
}
```

### Effect
- Override is deleted
- Permission reverts to role-based state
- `viaRoles: true` is now effective again

---

## 5. Apply Multiple Changes

### Request
```bash
curl -X PATCH "http://localhost:5000/api/admin/permissions/users/507f1f77bcf86cd799439011/apply-changes" \
  -H "Authorization: Bearer your_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "changes": [
      {
        "actionId": "507f191e810c19729de860ed",
        "desiredEffective": true,
        "note": "Cấp quyền tạo hoạt động"
      },
      {
        "actionId": "507f191e810c19729de860ef",
        "desiredEffective": false,
        "note": "Thu hồi quyền xóa hoạt động"
      },
      {
        "actionId": "507f191e810c19729de860f1",
        "desiredEffective": true,
        "note": "Xác nhận quyền xem"
      }
    ]
  }'
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "changes": [
      {
        "actionId": "507f191e810c19729de860ed",
        "success": true,
        "message": "Permission granted to user",
        "actionTaken": "CREATED_OVERRIDE"
      },
      {
        "actionId": "507f191e810c19729de860ef",
        "success": true,
        "message": "Permission revoked from user",
        "actionTaken": "CREATED_OVERRIDE"
      },
      {
        "actionId": "507f191e810c19729de860f1",
        "success": true,
        "message": "No change needed",
        "actionTaken": "NONE"
      }
    ],
    "updatedMatrix": {
      "userId": "507f1f77bcf86cd799439011",
      "user": { ... },
      "roles": [ ... ],
      "permissions": [ ... ],
      "summary": {
        "totalActions": 89,
        "effectiveCount": 17,
        "overrideCount": 2,
        "grantedCount": 1,
        "revokedCount": 1
      }
    }
  }
}
```

### Bulk Operation Features
- All changes processed atomically
- Each change has individual success status
- Can include mix of grant/revoke changes
- Returns complete updated matrix
- Good for batch operations from frontend

---

## Error Responses

### 1. User Not Found
```json
{
  "success": false,
  "message": "User not found"
}
```

### 2. Action Not Found
```json
{
  "success": false,
  "message": "Action not found"
}
```

### 3. Invalid User ID
```json
{
  "success": false,
  "message": "Cast to ObjectId failed for value \"invalid-id\""
}
```

### 4. Database Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Real-World Scenarios

### Scenario 1: New Class Monitor

**Context**: Nguyễn Văn B was elected class monitor and needs extra permissions

**Changes**:
- Grant: `evidence:APPROVE` - Approve other students' evidence
- Grant: `class:ATTENDANCE` - Record class attendance
- Grant: `class:REPORT` - View class report

```bash
curl -X PATCH "http://localhost:5000/api/admin/permissions/users/CLASS_MONITOR_ID/apply-changes" \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{
    "changes": [
      {"actionId": "ACTION_EVIDENCE_APPROVE", "desiredEffective": true},
      {"actionId": "ACTION_CLASS_ATTENDANCE", "desiredEffective": true},
      {"actionId": "ACTION_CLASS_REPORT", "desiredEffective": true}
    ]
  }'
```

### Scenario 2: Promote Student to Staff

**Context**: Nguyễn Thị C was a student helper, now promoting to official staff

**Changes**:
- Grant: `activity:CREATE`
- Grant: `activity:APPROVE`
- Grant: `activity:EXPORT`
- Keep: `activity:READ` (already had)

```bash
curl -X PATCH "http://localhost:5000/api/admin/permissions/users/STUDENT_ID/apply-changes" \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{
    "changes": [
      {"actionId": "ACTION_ACTIVITY_CREATE", "desiredEffective": true, "note": "Nâng cấp thành nhân viên"},
      {"actionId": "ACTION_ACTIVITY_APPROVE", "desiredEffective": true, "note": "Nâng cấp thành nhân viên"},
      {"actionId": "ACTION_ACTIVITY_EXPORT", "desiredEffective": true, "note": "Nâng cấp thành nhân viên"}
    ]
  }'
```

### Scenario 3: Restrict Permissions Due to Violation

**Context**: Student was caught cheating, need to restrict `evidence:SUBMIT`

**Changes**:
- Revoke: `evidence:SUBMIT` - Cannot submit evidence anymore

```bash
curl -X POST "http://localhost:5000/api/admin/permissions/users/STUDENT_ID/revoke/ACTION_EVIDENCE_SUBMIT" \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{
    "note": "Sinh viên vi phạm quy tắc, tạm dừng nộp minh chứng"
  }'
```

---

## Frontend Integration

### Usage in React Component

```javascript
import permissionAdminService from '../services/permissionAdminService';

// Load permissions
const response = await permissionAdminService.getUserPermissions(userId);
const matrix = response.data;

// Grant permission
const grantResult = await permissionAdminService.grantPermission(
  userId,
  actionId,
  "Reason for grant"
);

// Revoke permission
const revokeResult = await permissionAdminService.revokePermission(
  userId,
  actionId,
  "Reason for revoke"
);

// Apply multiple changes
const bulkResult = await permissionAdminService.applyPermissionChanges(userId, [
  { actionId: "...", desiredEffective: true },
  { actionId: "...", desiredEffective: false }
]);
```

---

## Testing with Postman

### Setup
1. Get your auth token by logging in
2. In Postman, set Collection variable: `token = your_token`
3. Set Base URL: `http://localhost:5000`

### Create Request
```
GET /api/admin/permissions/users/{{userId}}
Headers:
  Authorization: Bearer {{token}}
```

### Pre-request Script
```javascript
// Set default test values
pm.variables.set("userId", "507f1f77bcf86cd799439011");
pm.variables.set("actionId", "507f191e810c19729de860ed");
```

---

## Notes

- All timestamps in UTC ISO format
- User ID and Action ID are MongoDB ObjectIds (24-character hex strings)
- Override changes are atomic per action (not per request)
- Matrix is always fresh from database (no caching)
- All operations logged with `grantedByName` and `grantedAt`
