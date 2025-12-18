# Quick Start: Admin Permission Management

## 🚀 5 Minute Setup

### Step 1: Backend is Ready! ✅
All backend code is implemented:
- `/src/utils/permission_admin.util.js` - Business logic
- `/src/routes/admin_permission.routes.js` - API endpoints
- `/src/app.js` - Already configured

### Step 2: Verify Backend Routes

```bash
# Start backend
cd backend
npm run dev

# In another terminal, test the API
curl -X GET "http://localhost:5000/api/admin/permissions/users/USER_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Should return permission matrix with no errors.

### Step 3: Frontend Component Ready! ✅
Files ready to use:
- `/frontend/src/components/PermissionAdminPanel.jsx` - Main component
- `/frontend/src/components/PermissionAdminPanel.css` - Styling
- `/frontend/src/services/permissionAdminService.js` - API client
- `/frontend/src/pages/AdminPermissionPage.jsx` - Full page

### Step 4: Add to Your Admin Dashboard

**Option 1: Embed in existing page**

```jsx
// In your admin dashboard
import PermissionAdminPanel from '../components/PermissionAdminPanel';

export default function AdminDashboard() {
  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      
      {/* Add permission panel */}
      <PermissionAdminPanel />
    </div>
  );
}
```

**Option 2: Full page route**

```jsx
// In your routing configuration (App.jsx or Router setup)
import AdminPermissionPage from './pages/AdminPermissionPage';

<Route path="/admin/permissions" element={<AdminPermissionPage />} />
```

### Step 5: Test!

1. **Start backend** (if not already running):
   ```bash
   cd backend
   npm run dev
   ```

2. **Start frontend**:
   ```bash
   cd frontend
   npm start
   ```

3. **Navigate** to permission page:
   - Option 1: Check your admin dashboard
   - Option 2: Go to `http://localhost:3000/admin/permissions`

4. **Test with a user ID**:
   - Open browser developer tools (F12)
   - Go to Network tab
   - Enter a valid User ID in the input field
   - Click "Tải quyền"
   - Should see permission matrix load

## 📋 Understanding What You See

### User Info Section
```
Nguyễn Văn A
ID: 507f1f77bcf86cd799439011

Các vai trò: [student] [staff]

Tổng quyền: 89  │  Có quyền: 15  │  Đã tùy chỉnh: 2
```

- **Tổng quyền (Total)**: All available actions in system
- **Có quyền (Effective)**: Permissions user actually has
- **Đã tùy chỉnh (Overrides)**: Manually changed permissions

### Permissions List

Each permission row shows:

```
☑ Xem hoạt động       [READ]  Via Role  ✓ Granted
```

- **☑/☐**: Toggle to grant/deny
- **Action name**: "Xem hoạt động" (Vietnamese description)
- **[Action code]**: "READ" (technical code)
- **Badges**:
  - "Via Role" = comes from user's role
  - "✚ Added" = manually granted via override
  - "✕ Removed" = manually revoked via override
- **Status**: ✓ Granted or ✗ Denied

## 🎯 Common Tasks

### Task 1: Grant Permission to a Student

1. Enter student ID
2. Click "Tải quyền"
3. Find permission (e.g., "Xóa hoạt động")
4. Click checkbox to enable it (becomes highlighted in yellow)
5. Click "💾 Lưu thay đổi"
6. See confirmation message

### Task 2: Revoke Permission from Staff

1. Enter staff member ID
2. Click "Tải quyền"
3. Find permission they should not have
4. Click checkbox to disable it
5. Click "💾 Lưu thay đổi"

### Task 3: See What Changed

1. Unsaved changes appear with yellow background
2. Count shows "(2 thay đổi chưa lưu)" at bottom
3. Can review before clicking save
4. Click "✕ Hủy" to discard changes

### Task 4: Understand Overrides

**Scenario: Student with staff-only permission**

```
☑ Duyệt hoạt động  [APPROVE]  ✚ Added  ✓ Granted
```

- "Via Role" is NOT shown (not in student role)
- "✚ Added" badge shows admin manually granted it
- Permission is effective because override is active

**Scenario: Staff member with revoked permission**

```
☐ Tạo người dùng   [CREATE]  ✕ Removed  ✗ Denied
```

- "Via Role" is NOT shown (student can't create users anyway)
- "✕ Removed" badge shows admin explicitly denied it
- Permission is denied because override revokes it

## 🔍 Verification Checklist

- [ ] Backend running (`npm run dev` in backend folder)
- [ ] Frontend running (`npm start` in frontend folder)
- [ ] Can see PermissionAdminPanel component
- [ ] User ID input works
- [ ] Can load permissions for a user
- [ ] Can toggle permissions
- [ ] Can save changes
- [ ] Changes persist (reload page, still see the changes)

## 🐛 Quick Debug

### "User not found" error
```
- Check user ID format: should be 24-character MongoDB ID
- Example: 507f1f77bcf86cd799439011
```

### "No permissions showing"
```
- User might not have roles
- Check: are there role_action entries for user's roles?
- Check Actions collection: are there active actions?
```

### Changes not saving
```
- Check browser console (F12 → Console tab)
- Check Network tab for API errors
- Verify backend is running and responding
```

### API endpoint 404
```
- Make sure backend app.js includes:
  app.use('/api/admin/permissions', require('./routes/admin_permission.routes'));
- Restart backend server
```

## 📚 Next Steps

1. **Integrate with your admin dashboard**: Add navigation to permission management
2. **Add authentication check**: Ensure only admins can access (already have `checkPermission` middleware ready)
3. **Add to admin menu**: Link to `/admin/permissions` from main dashboard
4. **Test with real users**: Verify with staff and student accounts

## 📖 Full Documentation

See `ADMIN_PERMISSION_GUIDE.md` for:
- Detailed API documentation
- Backend function reference
- Database schema explanation
- Advanced scenarios
- Troubleshooting guide
- Future enhancements

## ✨ Key Features

✅ View all permissions for a user  
✅ Grant/revoke permissions per user  
✅ Support multiple roles (union-based)  
✅ Visual indication of override vs role-based  
✅ Batch save multiple changes  
✅ Responsive design  
✅ Error handling & feedback  
✅ Vietnamese UI labels  
✅ Action descriptions (tên chức năng)  

## 🎓 Understanding the Architecture

```
Admin clicks permission toggle
    ↓
React state updates (tracks changes)
    ↓
Admin clicks "Lưu thay đổi"
    ↓
Send PATCH to /api/admin/permissions/users/:id/apply-changes
    ↓
Backend processes each change:
    - If desired state = viaRoles state → delete override (fall back to role)
    - If different → create/update override (is_granted: true/false)
    ↓
Permission check in future requests:
    1. Check override (priority)
    2. Check role-based permissions
    3. Return final result
```

That's it! 🎉

Start using it now and let me know if you need any customization!
