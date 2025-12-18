# 🧪 Testing Admin Permission UI - Quick Guide

## ✅ Setup Complete!

I've added React Router to your App.jsx. Now you can test the UI!

---

## 🚀 Testing Steps

### 1. Start Backend
```bash
cd backend
npm run dev
```
Should see: `✅ Server running on port 5000`

### 2. Start Frontend
```bash
cd frontend
npm start
```
Should see: `Compiled successfully!` and browser opens to localhost:3000

### 3. Login
- You'll see login page asking for JWT token
- For testing, use any token (system will use it)
- Or just paste: `test-token` as a simple token

### 4. Navigate to Permission Admin
- You'll see navigation links at top-left:
  - 💬 Chatbot (old page)
  - 🔐 Quản lý Quyền (permission admin - NEW!)
- Click on "🔐 Quản lý Quyền"

### 5. Test the UI

**Load Permissions:**
```
Enter any valid User ID (MongoDB 24-char format)
Example: 507f1f77bcf86cd799439011

Click "Tải quyền" button
→ Should load permission matrix
```

**If No Data Shows:**
- Backend might not have permissions in database
- Or user doesn't exist
- Check browser console (F12) for errors

---

## 🧪 Test Data Setup (If Needed)

If you want realistic test data, run:

```bash
cd backend
node test_admin_permission.js
```

This creates test user `student1` with ID and sample permissions. After running, use that ID to test.

---

## 🎯 What to Test

### 1. UI Loading
- [ ] Page loads without errors
- [ ] User info displays
- [ ] Permission matrix shows
- [ ] Resources grouped and collapsible

### 2. Permissions Display
- [ ] Action names show (Vietnamese)
- [ ] Action codes show (in badges)
- [ ] Descriptions display
- [ ] "Via Role" badges appear
- [ ] Override badges appear (if any)

### 3. Toggle Functionality
- [ ] Click checkbox to toggle permission
- [ ] Row highlights yellow (unsaved)
- [ ] Counter shows changes pending
- [ ] Multiple toggles work

### 4. Collapse/Expand
- [ ] Click resource header to collapse
- [ ] Arrow icon changes direction
- [ ] Permissions hide/show
- [ ] Works for all resources

### 5. Save Changes
- [ ] "Lưu thay đổi" button active when changes exist
- [ ] Disabled when no changes
- [ ] Shows loading state
- [ ] Success message appears
- [ ] Matrix updates with changes

### 6. Error Handling
- [ ] Invalid user ID → error message
- [ ] No user found → error message
- [ ] Network error → handled gracefully
- [ ] Server error → proper message

### 7. Responsive Design
- [ ] Test on desktop (full width)
- [ ] Test on mobile (use F12 device mode)
- [ ] Layout adapts correctly
- [ ] Buttons are clickable
- [ ] Text is readable

---

## 🔍 Browser Testing Tools

### Open Developer Tools
```
Press F12 or Right-click → Inspect
```

### Check Console for Errors
```
DevTools → Console tab
Look for any red error messages
```

### Check Network Requests
```
DevTools → Network tab
Click "Tải quyền"
→ Should see GET request to:
   http://localhost:5000/api/admin/permissions/users/USER_ID
→ Response should have "success": true
```

### Check Application Storage
```
DevTools → Application tab
→ LocalStorage
→ Should see "token" key
```

---

## 🐛 Troubleshooting

### "User not found" Error
```
✅ Check user ID format (24 characters, hex)
✅ Try: 507f1f77bcf86cd799439011
✅ Or run test script to create test user
```

### "Cannot connect to server"
```
✅ Is backend running? (npm run dev)
✅ Check API_BASE_URL in frontend config
✅ Is it http://localhost:5000/api?
```

### No permissions showing
```
✅ User might not have roles assigned
✅ Check MongoDB if user exists
✅ Check if user_role entries exist
```

### Styling looks weird
```
✅ Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
✅ Check browser console for CSS errors
```

### Button clicks not working
```
✅ Check browser console for JS errors
✅ Check if component loaded correctly
✅ Try refreshing page
```

---

## 📊 Sample Test Users

After running `node test_admin_permission.js`, you can use:

**User: student1**
```
ID: (shown in test output)
Role: student
Status: Ready to test
```

**Steps to get ID:**
```
1. Run: node test_admin_permission.js
2. Look for output: "User found: Nguyễn Văn A (ID: ...)"
3. Copy that ID
4. Paste into permission panel
5. Click "Tải quyền"
```

---

## ✅ Successful Test Checklist

After testing, verify:

- [ ] Page loads at http://localhost:3000/admin/permissions
- [ ] User selection works
- [ ] Permission matrix displays
- [ ] Resources are grouped
- [ ] Action names show (Vietnamese)
- [ ] Action codes show (badges)
- [ ] Toggling works
- [ ] Unsaved indicator appears
- [ ] Save button works
- [ ] Success message shows
- [ ] Changes persist
- [ ] No console errors
- [ ] Responsive on mobile

---

## 📱 Test on Different Devices

### Desktop
```
Full size: 1920x1080
Test at: http://localhost:3000/admin/permissions
```

### Tablet
```
iPad size: 768x1024
DevTools → F12 → Toggle device toolbar → iPad
```

### Mobile
```
iPhone size: 375x667
DevTools → F12 → Toggle device toolbar → iPhone 12
```

---

## 🎓 Understanding Test Results

### Expected Success Response
```json
{
  "success": true,
  "data": {
    "userId": "...",
    "user": { "name": "..." },
    "permissions": [ ... ],
    "summary": { "totalActions": 89, "effectiveCount": 15 }
  }
}
```

### Expected Error Response
```json
{
  "success": false,
  "message": "User not found"
}
```

---

## 💡 Pro Testing Tips

### Tip 1: Network Throttling
```
DevTools → Network → Throttle to "Slow 3G"
→ Test if loading states work
→ Test if UI is responsive with latency
```

### Tip 2: Performance
```
DevTools → Performance tab
→ Click record
→ Interact with UI
→ Click stop
→ Check if any janky animations
→ Check if rendering is smooth
```

### Tip 3: Accessibility
```
DevTools → Lighthouse
→ Click "Analyze page load"
→ Check accessibility score
→ Read recommendations
```

### Tip 4: Console Logs
```
Open DevTools console
Look for info, warn, error messages
Should only see error if something broke
```

---

## 🚀 Common Test Scenarios

### Scenario 1: New User
```
1. Create new test user in MongoDB
2. Get their ID
3. Paste in permission panel
4. Click "Tải quyền"
→ Should show no permissions or basic role permissions
```

### Scenario 2: User with Multiple Roles
```
1. Assign 2 roles to a test user (student + staff)
2. Load permissions
→ Should show union of both roles
```

### Scenario 3: User with Overrides
```
1. Create user with role
2. Manually add override in database
3. Load permissions
→ Should show permission with override badge
```

### Scenario 4: Grant Permission
```
1. Load user permissions
2. Toggle a permission (unchecked → checked)
3. Click save
→ Should show success message
→ Should create override in database
```

---

## 📝 Test Report Template

```
Test Date: ___________
Tester: ___________
Browser: Chrome / Firefox / Safari
OS: Windows / Mac / Linux

Results:
- UI Loads: ✅ / ❌
- Permissions Display: ✅ / ❌
- Toggle Works: ✅ / ❌
- Save Works: ✅ / ❌
- Responsive: ✅ / ❌
- No Errors: ✅ / ❌

Issues Found:
- Issue 1: ___________
- Issue 2: ___________

Notes:
___________
___________
```

---

## ✨ Ready to Test!

Everything is set up. Just:

1. ✅ Start backend: `npm run dev`
2. ✅ Start frontend: `npm start`
3. ✅ Go to: `http://localhost:3000/admin/permissions`
4. ✅ Enter user ID
5. ✅ Test!

Happy testing! 🎉
