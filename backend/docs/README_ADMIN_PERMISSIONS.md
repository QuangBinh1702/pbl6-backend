# 📚 ADMIN PERMISSION MANAGEMENT SYSTEM - DOCUMENTATION INDEX

## 🎯 Overview

Hệ thống quản lý phân quyền cho Admin tại route `/admin/permissions`, cho phép:
- Tìm kiếm user theo username/MSSV/mã cán bộ
- Xem permissions của user (grouped by role)
- Thêm staff role cho student
- Grant/Revoke permissions (BASIC + OPTIONAL)
- Apply batch changes (recommended)

---

## 📁 Documentation Files

### 1. **ADMIN_PERMISSIONS_API_FRONTEND.md** ⭐ (MAIN)
**Full documentation cho Frontend developers**
- ✅ Chi tiết 10 API endpoints
- ✅ Request/Response format đầy đủ
- ✅ Frontend workflow examples
- ✅ Error handling
- ✅ Testing checklist
- ✅ Axios service examples

**👉 READ THIS FIRST if you're a frontend developer**

---

### 2. **API_QUICK_REFERENCE.md** ⚡
**Quick reference cho developers**
- ✅ Cheat sheet 10 endpoints
- ✅ Permission object structure
- ✅ Common patterns (search, add role, save)
- ✅ BASIC vs OPTIONAL summary
- ✅ Error codes

**👉 READ THIS for quick lookup during development**

---

### 3. **POSTMAN_COLLECTION_EXAMPLE.json** 🧪
**Postman collection for API testing**
- ✅ 10 pre-configured requests
- ✅ Environment variables (baseUrl, token, userId, actionId)
- ✅ Example request bodies
- ✅ Descriptions for each endpoint

**👉 IMPORT THIS to Postman for manual testing**

---

### 4. **STAFF_PERMISSIONS_README.md** 🔐
**Staff permissions system (BASIC vs OPTIONAL)**
- ✅ Permission breakdown (29 BASIC + 22 OPTIONAL)
- ✅ Workflow: Add role → Grant optional
- ✅ 5 use cases (CLB member → CTSV staff)
- ✅ Security notes (admin-only permissions)
- ✅ Validation & seed scripts

**👉 READ THIS to understand staff permission logic**

---

## 🚀 Quick Start

### For Frontend Developers:

1. **Read documentation:**
   ```bash
   backend/docs/ADMIN_PERMISSIONS_API_FRONTEND.md
   ```

2. **Import Axios service:**
   ```javascript
   // Already exists at:
   frontend/src/services/permissionAdminService.js
   ```

3. **Check existing component:**
   ```javascript
   // Reference implementation:
   frontend/src/components/AdminPermissionPanel.jsx
   frontend/src/pages/AdminPermissionPage.jsx
   ```

4. **Test APIs:**
   - Import `POSTMAN_COLLECTION_EXAMPLE.json` to Postman
   - Set `token` variable to your admin JWT
   - Test each endpoint

---

### For Backend Developers:

1. **Understand permission config:**
   ```javascript
   backend/src/permissions.config.js         // Admin, Student, Staff BASIC
   backend/src/staff_permissions.config.js   // BASIC + OPTIONAL
   ```

2. **Check API routes:**
   ```javascript
   backend/src/routes/admin_permission.routes.js  // 10 endpoints
   ```

3. **Understand core logic:**
   ```javascript
   backend/src/utils/permission_admin.util.js  // buildUserPermissionMatrix, applyChanges
   ```

4. **Validate & seed:**
   ```bash
   cd backend
   node validate_staff_permissions.js  # Validate config
   node seed_permissions.js            # Seed to DB
   node test_staff_basic_optional.js   # Test BASIC/OPTIONAL
   ```

---

## 🔑 Key Concepts

### 1. Permission Levels (Frontend UI Logic)
- `student` - Ai cũng có thể toggle
- `staff` - Cần có staff role
- `admin-only` - Chỉ admin (disable cho staff)

### 2. Staff Permissions (Backend Logic)
- **BASIC (29)** - Tự động có qua `role_action`
- **OPTIONAL (22)** - Admin grant qua `user_action_override`

### 3. Permission States
- `viaRoles: true` - Có qua role (BASIC)
- `overrideType: 'grant'` - Admin granted (OPTIONAL)
- `overrideType: 'revoke'` - Admin revoked
- `effective: true/false` - Kết quả cuối cùng

### 4. API Strategy
- ✅ **Use `/apply-changes`** for saving (batch)
- ❌ **Avoid `/grant` & `/revoke`** (single, slow)
- ✅ **Use `/lookup-user`** for initial load
- ✅ **Use `/add-role`** for student → staff

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Frontend (React)                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │  AdminPermissionPage.jsx                         │  │
│  │  - Authorization check (permission:update)       │  │
│  │  - Render AdminPermissionPanel                   │  │
│  └──────────────────────────────────────────────────┘  │
│                         │                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │  AdminPermissionPanel.jsx                        │  │
│  │  - Search user (lookup-user)                     │  │
│  │  - Display permissions (grouped by role)         │  │
│  │  - Track changes (pendingChanges state)          │  │
│  │  - Save (apply-changes API)                      │  │
│  │  - Add staff role modal                          │  │
│  └──────────────────────────────────────────────────┘  │
│                         │                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │  permissionAdminService.js                       │  │
│  │  - Axios wrapper for 10 APIs                     │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                         │
                         │ HTTP (Bearer token)
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Backend (Express.js)                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │  admin_permission.routes.js                      │  │
│  │  - 10 endpoints                                  │  │
│  │  - auth + checkPermission middleware             │  │
│  └──────────────────────────────────────────────────┘  │
│                         │                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │  permission_admin.util.js                        │  │
│  │  - buildUserPermissionMatrix()                   │  │
│  │  - applyPermissionChanges()                      │  │
│  │  - getPermissionLevel()                          │  │
│  └──────────────────────────────────────────────────┘  │
│                         │                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Config Files                                    │  │
│  │  - permissions.config.js (admin/student/basic)   │  │
│  │  - staff_permissions.config.js (basic+optional)  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              MongoDB                                    │
│  - user                                                 │
│  - role                                                 │
│  - user_role                                            │
│  - permission                                           │
│  - action                                               │
│  - role_action (BASIC permissions)                      │
│  - user_action_override (OPTIONAL permissions)          │
└─────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing Guide

### 1. Validate Config
```bash
cd backend
node validate_staff_permissions.js
```
Expected output:
```
✅ PASSED: All 29 BASIC permissions exist in permissions.config.js
✅ PASSED: All 22 OPTIONAL permissions NOT in permissions.config.js
✅ PASSED: No duplicates between BASIC and OPTIONAL
✅ PASSED: All 51 staff permissions exist in admin config
```

### 2. Seed Database
```bash
cd backend
node seed_permissions.js
```
Expected output:
```
🔐 STAFF: 29 BASIC permissions (tự động có)
ℹ️  22 OPTIONAL permissions (admin grant thủ công)
✅ Đã tạo 141 role-action mappings
```

### 3. Test BASIC/OPTIONAL Separation
```bash
cd backend
node test_staff_basic_optional.js
```
Expected output:
```
✅ ALL 29 BASIC permissions exist in role_action
✅ ALL 22 OPTIONAL permissions NOT in role_action
```

### 4. Test APIs (Postman)
1. Import `POSTMAN_COLLECTION_EXAMPLE.json`
2. Set environment variables:
   - `token`: Your admin JWT
   - `userId`: Test user ID
   - `actionId`: Test action ID
3. Run all 10 requests

### 5. Test Frontend
1. Login as admin
2. Navigate to `http://localhost:3000/admin/permissions`
3. Test scenarios:
   - Search student-only user → Show "Add Staff Role" button
   - Add staff role → 29 BASIC permissions granted
   - Toggle OPTIONAL permission → Track in pendingChanges
   - Save changes → Call apply-changes API
   - Check disabled checkboxes (staff/admin-only permissions)
   - Verify tooltips on disabled checkboxes

---

## 🔥 Common Issues & Solutions

### Issue 1: 403 Forbidden
**Cause:** User không có `permission:update`  
**Fix:** Đảm bảo user có admin role và permission đã được seed

### Issue 2: Checkboxes không disable đúng
**Cause:** `permission_level` không chính xác  
**Fix:** Check `getPermissionLevel()` logic trong `permission_admin.util.js`

### Issue 3: OPTIONAL permissions tự động có
**Cause:** Đã seed vào `role_action`  
**Fix:** Chạy lại `node seed_permissions.js` (chỉ seed BASIC)

### Issue 4: Add staff role không có permissions
**Cause:** `role_action` table không có records  
**Fix:** Check seed script, verify 29 BASIC staff permissions được seed

### Issue 5: Apply changes không hoạt động
**Cause:** Request body format sai  
**Fix:** Đảm bảo `changes` là array với `actionId` và `desiredEffective`

---

## 📈 Performance Notes

- **Lookup user:** ~50-100ms (index on username/student_number/staff_number)
- **Build permission matrix:** ~100-200ms (93 actions x N roles)
- **Apply changes:** ~50ms per change (batch insert/update)
- **Optimization:** Cache role_actions per role, use bulk operations

---

## 🔗 Related Files

### Frontend
```
frontend/src/components/AdminPermissionPanel.jsx
frontend/src/components/AdminPermissionPanel.css
frontend/src/pages/AdminPermissionPage.jsx
frontend/src/pages/AdminPermissionPage.css
frontend/src/services/permissionAdminService.js
```

### Backend
```
backend/src/routes/admin_permission.routes.js
backend/src/utils/permission_admin.util.js
backend/src/middlewares/check_permission.middleware.js
backend/src/permissions.config.js
backend/src/staff_permissions.config.js
backend/seed_permissions.js
backend/validate_staff_permissions.js
backend/test_staff_basic_optional.js
```

### Models
```
backend/src/models/user.model.js
backend/src/models/role.model.js
backend/src/models/user_role.model.js
backend/src/models/action.model.js
backend/src/models/role_action.model.js
backend/src/models/user_action_override.model.js
backend/src/models/org_unit.model.js
backend/src/models/staff_profile.model.js
backend/src/models/student_profile.model.js
```

---

## 📝 Changelog

### 2025-01-15 - Initial Release
- ✅ 10 API endpoints for admin permission management
- ✅ BASIC/OPTIONAL staff permissions system
- ✅ Frontend integration guide
- ✅ Postman collection
- ✅ Validation & test scripts

---

## 👥 Team & Support

**Backend Team:**
- API Development
- Permission logic
- Database schema

**Frontend Team:**
- React components
- UI/UX implementation
- API integration

**Questions?**
- Read full docs: `ADMIN_PERMISSIONS_API_FRONTEND.md`
- Quick reference: `API_QUICK_REFERENCE.md`
- Test with Postman: `POSTMAN_COLLECTION_EXAMPLE.json`

---

📧 **Contact:** Backend Team  
📅 **Last Updated:** 2025-01-15  
🔖 **Version:** 1.0.0
