# System Architecture: Admin Permission Management

## High-Level Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Admin User (Browser)                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  PermissionAdminPanel.jsx                                       │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │  • User ID Input Field                                          │   │
│  │  • Permission Matrix Display (by resource)                      │   │
│  │  • Checkbox toggles for grant/deny                              │   │
│  │  • Change tracking (unsaved indicator)                          │   │
│  │  • Save/Cancel buttons                                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                           ↕                                              │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  permissionAdminService.js                                      │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │  • HTTP client wrapper                                          │   │
│  │  • Axios interceptors for auth                                  │   │
│  │  • Calls backend API                                            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
                               ↕ HTTP/JSON
┌─────────────────────────────────────────────────────────────────────────┐
│                          Express Backend                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  admin_permission.routes.js                                     │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │  Route: GET /api/admin/permissions/users/:userId               │   │
│  │  Route: POST /api/admin/permissions/users/:userId/grant/:id    │   │
│  │  Route: POST /api/admin/permissions/users/:userId/revoke/:id   │   │
│  │  Route: PATCH /api/admin/permissions/users/:userId/apply-...   │   │
│  │  Route: DELETE /api/admin/permissions/users/:userId/override/:id
│  └─────────────────────────────────────────────────────────────────┘   │
│                           ↓                                              │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  permission_admin.util.js                                       │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │  • buildUserPermissionMatrix()                                  │   │
│  │  • grantPermissionToUser()                                      │   │
│  │  • revokePermissionFromUser()                                   │   │
│  │  • deletePermissionOverride()                                   │   │
│  │  • applyPermissionChanges()                                     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                           ↓                                              │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  MongoDB Collections                                            │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │  user                 → Basic user info                         │   │
│  │  user_role            → User to role mapping                    │   │
│  │  role                 → Role definitions                        │   │
│  │  role_action          → Role to action mapping                  │   │
│  │  action               → Master action list                      │   │
│  │  user_action_override → User-specific permission overrides      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Permission Resolution Flow

### When buildUserPermissionMatrix() is called:

```
Step 1: Load User
┌─────────────────────┐
│ Find user by ID     │
│ Get basic info      │
└────────────┬────────┘
             ↓
Step 2: Load User's Roles
┌─────────────────────────────────────────┐
│ Query user_role                          │
│ Find all roles for this user             │
│ (Can be multiple: student + staff)       │
└────────────┬────────────────────────────┘
             ↓
Step 3: Load Role Permissions (Union)
┌──────────────────────────────────────────────┐
│ For each role:                               │
│   Query role_action where role_id = role._id │
│   Get action_id list                         │
│ Combine all → unique set of action_ids       │
│ (UNION semantics for multiple roles)         │
└────────────┬─────────────────────────────────┘
             ↓
Step 4: Load All Available Actions
┌─────────────────────────────────────┐
│ Query action collection              │
│ Filter where is_active = true        │
│ Sort by resource, action_code        │
└────────────┬────────────────────────┘
             ↓
Step 5: Load User Overrides
┌────────────────────────────────────┐
│ Query user_action_override          │
│ Find all where user_id = user._id   │
│ Populate action_id details          │
└────────────┬───────────────────────┘
             ↓
Step 6: Build Permission Matrix
┌──────────────────────────────────────────────────────────────┐
│ For each action:                                              │
│  1. Is it in "role permissions set"? → viaRoles = true/false │
│  2. Is there an override for it? → overrideType = grant/deny │
│  3. Final effective state = override OR viaRoles              │
│                                                               │
│ Result: Array of permission objects with full state          │
└──────────────────────────────────────────────────────────────┘
```

---

## Permission State Matrix

### States for a Single Action

```
                    viaRoles  │  Override  │  Final Result
─────────────────────────────────────────────────────────────
      ✓ from role     true   │   none     │  ✓ GRANTED (inherited)
      ✓ granted       false  │   GRANT    │  ✓ GRANTED (override added)
      ✓ revoked       true   │   REVOKE   │  ✗ DENIED (override removed)
      ✗ not available false  │   GRANT    │  ✓ GRANTED (override granted)
      ✗ not available false  │   none     │  ✗ DENIED (no permission)
      ✗ not available false  │   REVOKE   │  ✗ DENIED (override confirmed)
```

### Visual Representation for UI

```
Permission Row 1: "Xem hoạt động" [READ]
├─ Via Role: YES (blue badge)
├─ Override: NONE
└─ Effective: ✓ GRANTED
   → Show: [✓] Granted  "Via Role"

Permission Row 2: "Tạo hoạt động" [CREATE]
├─ Via Role: NO
├─ Override: GRANT (orange badge)
└─ Effective: ✓ GRANTED
   → Show: [✓] Granted  "✚ Added"

Permission Row 3: "Xóa hoạt động" [DELETE]
├─ Via Role: YES
├─ Override: REVOKE (orange badge)
└─ Effective: ✗ DENIED
   → Show: [✗] Denied  "✕ Removed"

Permission Row 4: "Duyệt hoạt động" [APPROVE]
├─ Via Role: NO
├─ Override: NONE
└─ Effective: ✗ DENIED
   → Show: [✗] Denied
```

---

## Multi-Role Handling

### Example: Student + Staff Role

```
User: "Hồ Chí Minh"
├─ Role 1: student
│  ├─ activity:READ ✓
│  ├─ activity_registration:CREATE ✓
│  └─ evidence:SUBMIT ✓
│
└─ Role 2: staff
   ├─ activity:CREATE ✓
   ├─ activity:APPROVE ✓
   └─ evidence:APPROVE ✓

System Combines (UNION):
└─ Available Permissions: {
     activity:READ,
     activity_registration:CREATE,
     evidence:SUBMIT,
     activity:CREATE,
     activity:APPROVE,
     evidence:APPROVE
   }

Then Apply Overrides:
If admin grants: user:READ (not in any role)
└─ Final Permissions: {
     activity:READ,
     activity_registration:CREATE,
     evidence:SUBMIT,
     activity:CREATE,
     activity:APPROVE,
     evidence:APPROVE,
     user:READ ← added by override
   }
```

---

## Override Logic

### Grant a Permission

```
Admin wants to grant: activity:DELETE

Current State:
├─ viaRoles: false (student doesn't have it)
└─ override: none

Decision:
├─ Is it coming from a role? NO
├─ Does an override exist? NO
└─ Action: CREATE new override with is_granted=true

Result:
├─ User can now do activity:DELETE
├─ Shows badge: "✚ Added"
└─ Override is independent from roles

Future:
If student role gets activity:DELETE added:
├─ Override still exists
├─ Override takes priority → still effective
└─ Badge changes: "✚ Added" → "Via Role" (?)
   (Actually: "Via Role" + no override, so badge disappears)
```

### Revoke a Permission

```
Admin wants to revoke: activity:READ

Current State:
├─ viaRoles: true (comes from student role)
└─ override: none

Decision:
├─ Is it coming from a role? YES
├─ Does an override exist? NO
└─ Action: CREATE new override with is_granted=false

Result:
├─ User CANNOT do activity:READ anymore
├─ Shows badge: "✕ Removed"
└─ Override persists even if role permission is removed

Future:
If activity:READ is removed from student role:
├─ viaRoles becomes false
├─ Override is_granted=false still active
└─ Result: Still denied (correct!)

If admin clears the override:
├─ If role still has it: user gets permission back
├─ If role doesn't have it: user has no permission
```

---

## Database Queries

### Query 1: Get User's Roles

```javascript
// GET all roles for a user
db.user_role.find({ user_id: ObjectId("...") })
  .populate('role_id')
  .populate('org_unit_id')

// Result: Array of user_role documents with role details
```

### Query 2: Get Actions for Roles

```javascript
// GET all actions available from user's roles
const roleIds = [...];  // from step 1

db.role_action.find({ role_id: { $in: roleIds } })
  .populate('action_id')

// Result: Array of role_action documents
// Extract action_ids and combine into Set
```

### Query 3: Get User Overrides

```javascript
// GET all overrides for this user
db.user_action_override.find({ user_id: ObjectId("...") })
  .populate('action_id')
  .populate('granted_by', 'name username')

// Result: Array of override documents
// Map by action_id for quick lookup
```

### Query 4: Check Final Permission

```javascript
// In permission.util.js hasPermission() flow:

// 1. Find action
db.action.findOne({
  resource: "activity",
  action_code: "READ",
  is_active: true
})

// 2. Check override (takes priority)
const override = db.user_action_override.findOne({
  user_id: userId,
  action_id: actionId
})
if (override) return override.is_granted;

// 3. Check roles
const hasViaRole = db.role_action.findOne({
  role_id: { $in: userRoleIds },
  action_id: actionId
})
return hasViaRole ? true : false;
```

---

## Component Lifecycle

### Loading Permissions

```javascript
// 1. User enters ID and clicks "Tải quyền"
PermissionAdminPanel.state.loading = true;
PermissionAdminPanel.state.error = '';

// 2. Service makes API call
permissionAdminService.getUserPermissions(userId)
  → axios.get('/api/admin/permissions/users/:userId')
  → backend routes handler

// 3. Backend builds matrix
buildUserPermissionMatrix(userId)
  → queries database (5 queries)
  → builds permission array
  → returns with summary

// 4. Frontend receives response
PermissionAdminPanel.state.matrix = response.data;
PermissionAdminPanel.state.loading = false;
PermissionAdminPanel.state.expandedResources = { ... };

// 5. Render permission matrix
PermissionAdminPanel renders groups by resource
Each resource shows list of actions with toggles
```

### Making Changes

```javascript
// 1. User clicks checkbox
→ handlePermissionToggle(actionId, currentEffective)
→ setChanges(new Map with change)

// 2. UI updates
Row highlights yellow (unsaved)
Counter shows "(N thay đổi chưa lưu)"
"Lưu thay đổi" button becomes enabled

// 3. User clicks save
→ handleSaveChanges()
→ applyPermissionChanges(userId, changesArray)
→ axios.patch('/api/admin/permissions/users/:id/apply-changes')

// 4. Backend processes
For each change:
  1. Get current viaRoles state
  2. Compare with desiredEffective
  3. Create/update/delete override as needed

// 5. Return updated matrix
Updated matrix sent back with new state

// 6. Frontend updates
PermissionAdminPanel.state.matrix = newMatrix
Changes cleared from map
Success message shown
Matrix re-renders with new states
```

---

## Error Handling

### Frontend Error Flow

```
User Action
    ↓
API Call (Service)
    ↓
Network/API Error
    ├─ Network error → "Cannot connect to server"
    ├─ 404 User not found → "User not found"
    ├─ 500 Server error → "Internal server error"
    └─ Other → Show error.message
    ↓
State Update
    ├─ setError(message)
    └─ setLoading(false)
    ↓
UI Renders Alert
    ├─ Alert component shows error
    ├─ Color: red background
    └─ User can retry
```

### Backend Error Handling

```
Request arrives
    ↓
Route handler
    ├─ Try block: execute function
    │  ├─ Query DB
    │  ├─ Process data
    │  └─ Return result
    │
    └─ Catch block: error handling
       ├─ Log error
       ├─ Format error message
       └─ Return { success: false, message: "..." }
```

---

## Performance Considerations

### Database Queries
- **Indexed fields**: user_id, role_id, action_id, user_id+action_id
- **Multiple roles**: Uses single $in query (efficient)
- **Large action count**: loads all actions once (89 in your case = fine)

### Caching (Optional for Future)
```javascript
// Could cache permission matrix for 5-15 minutes
const cache = new Map();
const cacheKey = `matrix_${userId}`;

if (cache.has(cacheKey)) {
  return cache.get(cacheKey);
}

// Build and cache
const matrix = await buildUserPermissionMatrix(userId);
cache.set(cacheKey, matrix);
setTimeout(() => cache.delete(cacheKey), 5 * 60 * 1000);
```

### UI Performance
- **Collapsible groups**: Only expand when needed
- **Lazy loading**: Could load actions per-resource instead of all at once
- **Virtual scrolling**: For very long lists (probably not needed now)

---

## Security Considerations

### Access Control
```javascript
// Ensure only admins can access
router.get('/users/:userId', 
  auth,  // ← require authentication
  checkPermission('permission', 'READ'),  // ← require admin permission
  handler
);
```

### Audit Trail
```javascript
// All changes tracked
user_action_override fields:
├─ granted_by: admin's user ID
├─ granted_at: when change was made
└─ note: reason for change

// Can generate audit report later
```

### Data Validation
```javascript
// Validate inputs
├─ User ID: check if valid ObjectId
├─ Action ID: check if exists in action collection
├─ Note: check length (max 500 chars)
└─ desiredEffective: check boolean

// Validate business logic
├─ User exists
├─ Action exists and is_active
└─ User has roles (for determining viaRoles)
```

---

## Testing Strategy

### Unit Tests (Backend)
```javascript
// Test permission_admin.util.js functions
✓ buildUserPermissionMatrix()
✓ grantPermissionToUser()
✓ revokePermissionFromUser()
✓ deletePermissionOverride()
✓ applyPermissionChanges()

// Test with different scenarios
✓ User with single role
✓ User with multiple roles
✓ Permissions from roles only
✓ Permissions with overrides
✓ Multiple overrides
```

### Integration Tests
```javascript
// Test full flow
✓ Load matrix
✓ Grant permission → verify override created
✓ Revoke permission → verify override created
✓ Load matrix again → verify changes persisted
✓ Bulk apply changes → verify all changes applied

// Test with real database
```

### Manual Testing
```javascript
// Use test_admin_permission.js
node test_admin_permission.js

// Or use browser + Postman
1. Start backend
2. Start frontend
3. Open browser DevTools
4. Test permission loading
5. Test grant/revoke
6. Verify database changes with MongoDB Compass
```

---

## Deployment Checklist

- [ ] Backend routes registered in app.js
- [ ] `permission_admin.util.js` deployed
- [ ] Database indexes exist on user_role, role_action, user_action_override
- [ ] Frontend components deployed
- [ ] Frontend service client deployed
- [ ] Environment variables configured (API_BASE_URL)
- [ ] Auth middleware working
- [ ] Permission checks configured for admin routes
- [ ] Tests passing
- [ ] Documentation deployed
- [ ] Team trained

---

This architecture is clean, scalable, and maintainable! 🎉
