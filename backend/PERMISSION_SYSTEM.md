# New Permission System Documentation

## Overview

This permission system uses a role-based access control (RBAC) with user-level overrides.

**Flow**: `User → UserRole → RoleAction → Action (+ UserActionOverride)`

## Architecture

### Database Collections

1. **user** - System users
   - `username`, `password_hash`, `active`, `isLocked`

2. **role** - Roles in the system
   - `name`, `description`
   - Examples: admin, ctsv, khoa, student

3. **action** - Individual actions/permissions
   - `resource`, `action_code`, `action_name`, `description`, `is_active`
   - Example: `activity.CREATE`, `student.UPDATE`

4. **user_role** - Links users to roles (with org_unit context)
   - `user_id`, `role_id`, `org_unit_id`
   - A user can have multiple roles in different organizational units

5. **role_action** - Links roles to actions
   - `role_id`, `action_id`
   - Defines what actions each role can perform

6. **user_action_override** - Individual permission overrides
   - `user_id`, `action_id`, `is_granted`
   - Overrides role-based permissions for specific users
   - `is_granted: true` grants permission, `false` revokes it

7. **student_profile** - Student information
   - Includes `isClassMonitor` field (boolean)
   - Class monitor is NOT a role, just a flag

## Permission Check Flow

```
1. Check if user has user_action_override
   └─ If exists → return override value (granted/revoked)
   
2. If no override, check user's roles
   └─ Get all roles from user_role
   └─ For each role, check role_action
   └─ If any role has the action → return true
   
3. If no role has permission → return false
```

## Usage Examples

### In Routes/Controllers

```javascript
const { 
  checkPermission, 
  checkClassMonitor,
  checkAnyPermission,
  checkAllPermissions 
} = require('./middlewares/check_permission.middleware');

// Check specific permission
router.post('/activities', 
  checkPermission('activity', 'CREATE'), 
  activityController.create
);

// Check class monitor
router.post('/class/attendance', 
  checkClassMonitor(), 
  attendanceController.update
);

// Check any of multiple permissions
router.get('/reports', 
  checkAnyPermission([
    { resource: 'report', action: 'VIEW' },
    { resource: 'report', action: 'EXPORT' }
  ]),
  reportController.view
);

// Check all permissions required
router.post('/activities/approve', 
  checkAllPermissions([
    { resource: 'activity', action: 'VIEW' },
    { resource: 'activity', action: 'APPROVE' }
  ]),
  activityController.approve
);
```

### In Controller Logic

```javascript
const { 
  hasPermission, 
  getUserActions,
  isClassMonitor,
  getAllUserPermissions 
} = require('../utils/permission.util');

// Check if user has permission
const canUpdate = await hasPermission(userId, 'activity', 'UPDATE');
if (!canUpdate) {
  return res.status(403).json({ message: 'No permission' });
}

// Get all actions user can perform on resource
const actions = await getUserActions(userId, 'activity');
// Returns: ['VIEW', 'CREATE', 'UPDATE', ...]

// Check if user is class monitor
const isMonitor = await isClassMonitor(userId);

// Get all user permissions
const permissions = await getAllUserPermissions(userId);
// Returns: { activity: ['VIEW', 'CREATE'], student: ['VIEW'], ... }
```

## Standard Action Codes

- `VIEW` - View/read resource
- `CREATE` - Create new resource
- `UPDATE` - Update/edit resource
- `DELETE` - Delete resource
- `APPROVE` - Approve/accept resource
- `REJECT` - Reject resource
- `EXPORT` - Export data
- `IMPORT` - Import data

## Roles and Permissions

### Admin Role
- Full access to all resources and actions

### CTSV (Phòng Công tác Sinh viên)
- Manage activities, students, registrations, attendance
- View and export reports

### Khoa (Faculty)
- Create and manage activities
- View students
- Approve/reject registrations

### Student
- View activities
- Register for activities
- View own attendance

### Class Monitor
- Not a role, but a boolean field in `student_profile`
- Use `checkClassMonitor()` middleware to check
- Has additional privileges for their class

## Adding User Action Overrides

Overrides allow granting or revoking specific permissions for individual users:

```javascript
const UserActionOverride = require('./models/user_action_override.model');
const Action = require('./models/action.model');

// Revoke DELETE permission for a specific user
const action = await Action.findOne({ 
  resource: 'activity', 
  action_code: 'DELETE' 
});

await UserActionOverride.create({
  user_id: userId,
  action_id: action._id,
  is_granted: false // false = revoke, true = grant
});
```

## Database Setup

### 1. Seed Roles and Actions

```bash
node seed_new_permission_data.js
```

This creates:
- 6 roles (admin, ctsv, doantruong, khoa, clb, student)
- 18 actions across 5 resources
- Sample users with role assignments
- Sample overrides for testing

### 2. Test the System

```bash
node test_new_permission_system.js
```

## Migration from Old System

The old permission system used:
- `permission` table with `details` array
- `user_permission` for direct user-permission mapping

The new system is more flexible:
- Separate `action` table for granular permissions
- Role-based permissions with overrides
- Organizational unit context support

## API Response Examples

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Permission Denied
```json
{
  "success": false,
  "message": "Bạn không có quyền thực hiện hành động \"CREATE\" trên \"activity\"",
  "required_permission": "activity:CREATE"
}
```

### Class Monitor Required
```json
{
  "success": false,
  "message": "Chỉ lớp trưởng mới có quyền thực hiện hành động này"
}
```

## Best Practices

1. **Use middleware for routes** - Always use `checkPermission()` in routes
2. **Check in controllers when needed** - Use `hasPermission()` for conditional logic
3. **Consistent action codes** - Use standard action codes (VIEW, CREATE, etc.)
4. **Resource naming** - Use lowercase, singular form (activity, student, not activities)
5. **Override sparingly** - Use role_action for general permissions, overrides for exceptions
6. **Class monitor check** - Always use `checkClassMonitor()` middleware, not role-based check

## Troubleshooting

### Permission always denied
- Check if user has role assigned in `user_role`
- Check if role has action in `role_action`
- Check for negative override in `user_action_override`

### Duplicate index errors
- Action uses compound unique index on (resource, action_code)
- Same action code can exist for different resources

### Class monitor not working
- Check `student_profile.isClassMonitor` field
- Ensure student profile exists for the user
- Use `checkClassMonitor()` middleware, not permission check

