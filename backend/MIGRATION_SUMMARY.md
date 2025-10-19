# Permission System Migration Summary

## What Changed

### ✅ New Models Created (6)

1. **action.model.js** - Individual permissions/actions
2. **role_action.model.js** - Role to action mappings
3. **user_role.model.js** - User to role mappings (with org_unit context)
4. **user_action_override.model.js** - User-specific permission overrides
5. **student_feedback.model.js** - Student feedback for activities
6. **activity_registration.model.js** - Activity registration tracking

### 🔄 Models Updated (5)

1. **permission.model.js**
   - Removed `details` array
   - Kept only: `resource`, `name`, `description`

2. **user.model.js**
   - Simplified to: `username`, `password_hash`, `active`, `isLocked`
   - Removed: `name`, `email`, `role`, `phone`, `class`, `studentId`, etc.
   - Role moved to `user_role` table

3. **activity.model.js**
   - Renamed `name` → `title`
   - Replaced `time` with `start_time`, `end_time`, `start_time_updated`, `end_time_updated`
   - Added: `org_unit_id`, `field_id`, `capacity`, `qr_code`, `registration_open`, `registration_close`, `activity_image`, `requires_approval`

4. **student_profile.model.js**
   - Updated field naming to snake_case
   - Changed `user` → `user_id`
   - Changed `class` → `class_id`
   - Added `student_image` field
   - Ensured `isClassMonitor` field exists

5. **role.model.js**
   - Removed `permissions` array
   - Kept only: `name`, `description`

### 🆕 New Utilities

**permission.util.js** - Core permission checking functions:
- `hasPermission(userId, resource, actionCode, orgUnitId)` - Check if user has permission
- `getUserActions(userId, resource, orgUnitId)` - Get all actions user can perform
- `isClassMonitor(userId)` - Check if user is class monitor
- `getAllUserPermissions(userId, orgUnitId)` - Get all user permissions
- `hasAnyPermission(userId, permissions, orgUnitId)` - Check if user has any of the permissions
- `hasAllPermissions(userId, permissions, orgUnitId)` - Check if user has all permissions

### 🔄 Middleware Updated

**check_permission.middleware.js** - Rewritten to use new system:
- `checkPermission(resource, actionCode)` - Main permission check middleware
- `checkAnyPermission(permissionList)` - Check any permission
- `checkAllPermissions(permissionList)` - Check all permissions
- `checkClassMonitor()` - Check if user is class monitor (NEW)
- `attachUserActions(resource)` - Attach user actions to request (NEW)

### 📊 Database Schema Changes

**Before:**
```
User (has role field)
  └─> Permission (has details array with actions)
```

**After:**
```
User
  └─> UserRole ──> Role ──> RoleAction ──> Action
  └─> UserActionOverride ──> Action (overrides role permissions)
  
StudentProfile (has isClassMonitor field)
```

## New Permission Flow

1. **User logs in** → System identifies user
2. **Check override** → Look in `user_action_override` first
   - If override exists → Use override value (grant/revoke)
3. **Check role permissions** → Get user's roles from `user_role`
   - For each role → Get actions from `role_action`
   - If any role has the action → Grant permission
4. **Class monitor check** → Separate check via `student_profile.isClassMonitor`

## Migration Steps for Existing Code

### Before (Old System)
```javascript
// Old middleware
const { checkPermission } = require('./middlewares/check_permission.middleware');
router.post('/activities', checkPermission('ACTIVITY_MANAGEMENT', 'CREATE'), handler);
```

### After (New System)
```javascript
// New middleware
const { checkPermission } = require('./middlewares/check_permission.middleware');
router.post('/activities', checkPermission('activity', 'CREATE'), handler);
```

### Key Differences

| Old System | New System |
|------------|------------|
| Permission name + action code | Resource + action code |
| `ACTIVITY_MANAGEMENT`, `CREATE` | `activity`, `CREATE` |
| Direct user → permission mapping | User → Role → Action (with overrides) |
| No organizational context | Supports org_unit context |
| No override mechanism | User-level overrides available |

## Testing

### Run Tests
```bash
# Seed sample data
node seed_new_permission_data.js

# Run tests
node test_new_permission_system.js
```

### Sample Test Users
- **admin** - Full access (admin role)
- **student001** - Student with class monitor flag
- **teacher001** - Faculty role with DELETE override (revoked)

## Files Created/Modified

### Created (9 files)
1. `src/models/action.model.js`
2. `src/models/role_action.model.js`
3. `src/models/user_role.model.js`
4. `src/models/user_action_override.model.js`
5. `src/models/student_feedback.model.js`
6. `src/models/activity_registration.model.js`
7. `src/utils/permission.util.js`
8. `seed_new_permission_data.js`
9. `test_new_permission_system.js`

### Modified (6 files)
1. `src/models/permission.model.js`
2. `src/models/user.model.js`
3. `src/models/activity.model.js`
4. `src/models/student_profile.model.js`
5. `src/models/role.model.js`
6. `src/middlewares/check_permission.middleware.js`

### Documentation (2 files)
1. `PERMISSION_SYSTEM.md` - Complete usage guide
2. `MIGRATION_SUMMARY.md` - This file

## Next Steps

1. ✅ Models created and updated
2. ✅ Permission utilities implemented
3. ✅ Middleware updated
4. ✅ Test data seeded
5. ✅ System tested and verified
6. 🔄 Update existing routes to use new middleware signature
7. 🔄 Update auth controller to handle new user model
8. 🔄 Update seed scripts to use new schema

## Important Notes

- **Class Monitor is NOT a role** - It's a boolean field in `student_profile`
- **Action codes are uppercase** - Always use uppercase (VIEW, CREATE, not view, create)
- **Resource names are lowercase** - Always use lowercase (activity, student, not Activity)
- **Overrides take precedence** - `user_action_override` overrides role permissions
- **Compound unique index** - Actions use (resource, action_code) as unique key

