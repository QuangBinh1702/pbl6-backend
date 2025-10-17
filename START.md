# ⚡ PBL6 - MongoDB Backend

## ✅ ĐÃ LÀM GÌ?

Chuyển đổi **TOÀN BỘ** `pbl6.sql` (20 tables) sang MongoDB (17 collections).

- ✅ 17 models MongoDB
- ✅ Permission system chi tiết (5 permissions, 21 actions)
- ✅ Seed script toàn bộ database
- ✅ Test script (9/9 pass)
- ✅ APIs & middlewares
- ✅ Test UI

---

## 🚀 CHẠY NGAY

```bash
cd backend

# 1. Seed database
node SEED_ALL.js

# 2. Start server
npm run dev

# 3. Test (optional)
node test_permission_system.js
```

**Server:** http://localhost:5000  
**Test UI:** http://localhost:5000/test-permission.html

---

## 👥 LOGIN

| Username | Password | Role | 
|----------|----------|------|
| admin | password123 | Admin (tất cả quyền) |
| sv001 | password123 | Sinh viên |
| gv001 | password123 | Giáo viên CTSV |

---

## 📊 DATABASE

**MongoDB Collections (17):**
- permissions (5)
- users (5)
- student_profiles (3)
- staff_profiles (1)
- org_units (3)
- activities (3)
- fields (5)
- falcuties (3)
- cohorts (2)
- classes (3)
- user_permissions (10)
- + 6 collections ready (chưa có data)

---

## 📝 FILES

### Seed & Test:
- `backend/SEED_ALL.js` - Seed toàn bộ DB
- `backend/test_permission_system.js` - Test hệ thống

### Models (17):
```
backend/src/models/
├── permission.model.js (with embedded details)
├── user_permission.model.js
├── user.model.js
├── student_profile.model.js
├── staff_profile.model.js
├── org_unit.model.js
├── activity.model.js
├── attendance.model.js
├── evidence.model.js
├── field.model.js
├── class.model.js
├── falcuty.model.js
├── cohort.model.js
├── student_cohort.model.js
├── pvcd_record.model.js
├── post.model.js
└── activity_eligibility.model.js
```

### Controllers & Routes:
```
backend/src/controllers/*.controller.js
backend/src/routes/*.routes.js
```

---

## 🛡️ PERMISSION SYSTEM

### Middleware:
```javascript
const { checkPermission } = require('./middlewares/check_permission.middleware');

router.post('/activities',
  authMiddleware,
  checkPermission('ACTIVITY_MANAGEMENT', 'CREATE'),
  activityController.create
);
```

### 5 Permissions:
1. ACTIVITY_MANAGEMENT (5 actions)
2. USER_MANAGEMENT (5 actions)
3. ATTENDANCE_MANAGEMENT (4 actions)
4. EVIDENCE_MANAGEMENT (4 actions)
5. REPORT_VIEW (3 actions)

### Action Control:
- ✅ CREATE, READ, UPDATE, APPROVE: Allowed
- ❌ DELETE: Denied (check_action = false)

---

## 📡 API

**Endpoints chính:**
```
POST   /api/auth/login
GET    /api/permissions
GET    /api/permissions/users/:userId
POST   /api/permissions/users/:userId/grant/:permId
GET    /api/activities
POST   /api/activities
...
```

---

## ✅ TESTS

```bash
node test_permission_system.js
```

**Kết quả:** 9/9 PASS ✅

1. ✅ Permissions exist
2. ✅ Users created
3. ✅ Permissions assigned
4. ✅ User permissions loaded
5. ✅ Specific checks work
6. ✅ Action-level control
7. ✅ Revoke/Grant
8. ✅ Time-based
9. ✅ Statistics

---

## 🔧 THAO TÁC

### Seed lại database:
```bash
node SEED_ALL.js
```

### Xóa database:
```bash
mongosh
> use pbl6
> db.dropDatabase()
> exit
```

### Check collections:
```bash
mongosh
> use pbl6
> show collections
> db.permissions.find().pretty()
```

---

## 📚 CHI TIẾT

Xem: **[README_MONGODB.md](./README_MONGODB.md)** (đầy đủ)

---

**Xong!** ✅ Hệ thống sẵn sàng sử dụng.




