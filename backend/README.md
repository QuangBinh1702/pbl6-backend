# 🎓 Community Activity Management Backend

Backend API cho hệ thống quản lý hoạt động cộng đồng với **Hệ thống Phân Quyền Chi Tiết**.

## ✨ Features

- 🔐 Authentication & Authorization với JWT
- 👥 Quản lý người dùng (User Management)
- 🎯 Quản lý hoạt động (Activity Management)
- ✅ Điểm danh QR Code
- 📊 Thống kê và báo cáo
- 💬 Chat và thông báo
- 📝 Quản lý minh chứng
- **🛡️ Hệ thống phân quyền chi tiết (Permission System)**

## 🚀 Quick Start

### 1. Cài đặt
```bash
npm install
```

### 2. Cấu hình
Tạo file `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/pbl6
PORT=5000
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d

# Email Configuration (for forgot password)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
FRONTEND_URL=http://localhost:5000
```

**Lưu ý**: Để sử dụng tính năng quên mật khẩu, bạn cần:
- Tạo App Password cho Gmail: [Hướng dẫn](https://support.google.com/accounts/answer/185833)
- Điền EMAIL_USER và EMAIL_PASS vào file .env
- Đặt FRONTEND_URL là URL của frontend application
- **Xem chi tiết:** [EMAIL_SETUP.md](./EMAIL_SETUP.md)

### 3. Test kết nối MongoDB
```bash
node test_connection.js
```

### 4. Seed dữ liệu
```bash
node src/seed_permission_system.js
```

### 5. Chạy server
```bash
npm run dev
```

## 📚 Documentation

### Hệ Thống Phân Quyền
- **[QUICKSTART.md](./QUICKSTART.md)** - Bắt đầu nhanh trong 5 phút
- **[MONGODB_SETUP.md](./MONGODB_SETUP.md)** - Hướng dẫn setup MongoDB chi tiết
- **[PERMISSION_USAGE.md](./PERMISSION_USAGE.md)** - Cách sử dụng Permission Models
- **[API_EXAMPLES.md](./API_EXAMPLES.md)** - Ví dụ API calls với cURL

### Tài Liệu Khác
- **[Postman_Collection.json](./Postman_Collection.json)** - Import vào Postman để test API

## 🗂️ Cấu Trúc Dự Án

```
backend/
├── src/
│   ├── models/               # Mongoose models (24 models)
│   │   ├── user.model.js                    # User
│   │   ├── student_profile.model.js         # Student profile
│   │   ├── staff_profile.model.js           # Staff profile
│   │   ├── student_cohort.model.js          # Student-cohort mapping
│   │   ├── pvcd_record.model.js             # PVCD records
│   │   ├── activity.model.js                # Activity
│   │   ├── registration.model.js            # Activity registration
│   │   ├── attendance.model.js              # Attendance
│   │   ├── class.model.js                   # Class
│   │   ├── cohort.model.js                  # Cohort
│   │   ├── falcuty.model.js                 # Faculty
│   │   ├── field.model.js                   # Field
│   │   ├── org_unit.model.js                # Organization unit
│   │   ├── post.model.js                    # Post
│   │   ├── evidence.model.js                # Evidence
│   │   ├── feedback.model.js                # Feedback
│   │   ├── point.model.js                   # Point
│   │   ├── notification.model.js            # Notification
│   │   ├── chat.model.js                    # Chat
│   │   ├── role.model.js                    # Role
│   │   ├── permission.model.js              # ⭐ Permission
│   │   ├── user_permission.model.js         # ⭐ User-Permission
│   │   ├── activity_eligibility.model.js    # Activity eligibility
│   │   └── ...
│   ├── controllers/          # Business logic (20+ controllers)
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── student_profile.controller.js    # ✨ New
│   │   ├── staff_profile.controller.js      # ✨ New
│   │   ├── student_cohort.controller.js     # ✨ New
│   │   ├── pvcd_record.controller.js        # ✨ New
│   │   ├── activity.controller.js
│   │   ├── registration.controller.js       # ✨ New
│   │   ├── attendance.controller.js         # ✨ New
│   │   ├── class.controller.js              # ✨ New
│   │   ├── cohort.controller.js             # ✨ New
│   │   ├── faculty.controller.js            # ✨ New
│   │   ├── field.controller.js              # ✨ New
│   │   ├── org_unit.controller.js           # ✨ New
│   │   ├── post.controller.js               # ✨ New
│   │   ├── role.controller.js               # ✨ New
│   │   ├── evidence.controller.js
│   │   ├── feedback.controller.js
│   │   ├── point.controller.js
│   │   ├── notification.controller.js
│   │   ├── chat.controller.js
│   │   ├── statistic.controller.js
│   │   └── permission.controller.js         # ⭐ Permission
│   ├── routes/              # API routes (20+ routes)
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── student_profile.routes.js        # ✨ New
│   │   ├── staff_profile.routes.js          # ✨ New
│   │   ├── student_cohort.routes.js         # ✨ New
│   │   ├── pvcd_record.routes.js            # ✨ New
│   │   ├── activity.routes.js
│   │   ├── registration.routes.js           # ✨ New
│   │   ├── attendance.routes.js             # ✨ New
│   │   ├── class.routes.js                  # ✨ New
│   │   ├── cohort.routes.js                 # ✨ New
│   │   ├── faculty.routes.js                # ✨ New
│   │   ├── field.routes.js                  # ✨ New
│   │   ├── org_unit.routes.js               # ✨ New
│   │   ├── post.routes.js                   # ✨ New
│   │   ├── role.routes.js                   # ✨ New
│   │   ├── evidence.routes.js
│   │   ├── feedback.routes.js
│   │   ├── point.routes.js
│   │   ├── notification.routes.js
│   │   ├── chat.routes.js
│   │   ├── statistic.routes.js
│   │   └── permission.routes.js             # ⭐ Permission
│   ├── middlewares/         # Middlewares
│   │   ├── auth.middleware.js
│   │   ├── check_permission.middleware.js   # ⭐ Permission checker
│   │   ├── role.middleware.js
│   │   ├── error.middleware.js
│   │   └── ...
│   ├── config/              # Configuration
│   │   ├── db.js
│   │   ├── app.config.js
│   │   └── db.config.js
│   ├── utils/               # Utilities
│   │   ├── email.util.js
│   │   └── qr.util.js
│   ├── seed_permission_system.js            # ⭐ Seed script
│   ├── seed_sample_data.js
│   ├── app.js               # ✨ Updated - Express app
│   └── server.js            # Server entry
├── public/                  # Static files
│   ├── test-auth.html
│   ├── test-login.html
│   └── test-permission.html
├── test_connection.js       # ⭐ MongoDB test script
├── test_permission_system.js
├── API_ENDPOINTS.md        # ✨ New - Complete API documentation
├── QUICKSTART.md
├── MONGODB_SETUP.md
├── PERMISSION_USAGE.md
├── API_EXAMPLES.md
├── Postman_Collection.json
├── package.json
└── README.md               # This file
```

## 🛡️ Hệ Thống Phân Quyền Chi Tiết

### Cấu Trúc

```
User ←→ UserPermission ←→ Permission
                              ↓
                        PermissionDetails
```

### Models

#### Permission Model
```javascript
{
  name_per: "ACTIVITY_MANAGEMENT",
  description: "Quản lý hoạt động",
  details: [
    {
      action_name: "Tạo hoạt động",
      action_code: "CREATE",
      check_action: true
    },
    {
      action_name: "Xóa hoạt động",
      action_code: "DELETE",
      check_action: false
    }
  ]
}
```

#### UserPermission Model
```javascript
{
  id_user: ObjectId,      // User reference
  id_per: ObjectId,       // Permission reference
  licensed: true,         // Granted or revoked
  granted_at: Date,
  expires_at: Date        // null = permanent
}
```

### Middleware Usage

```javascript
const { checkPermission } = require('./middlewares/check_permission.middleware');

// Protect route với permission và action
router.post('/activities',
  authMiddleware,
  checkPermission('ACTIVITY_MANAGEMENT', 'CREATE'),
  activityController.create
);
```

## 📡 API Endpoints

Xem **[API_ENDPOINTS.md](./API_ENDPOINTS.md)** để biết chi tiết đầy đủ tất cả endpoints.

### Các module chính:

#### 🔐 Authentication & Users
- `/api/auth` - Authentication
- `/api/users` - User management
- `/api/student-profiles` - Student profiles
- `/api/staff-profiles` - Staff profiles

#### 🏫 Organization
- `/api/faculties` - Faculty management
- `/api/fields` - Field of study
- `/api/cohorts` - Cohort management
- `/api/classes` - Class management
- `/api/org-units` - Organization units
- `/api/student-cohorts` - Student-cohort mapping
- `/api/pvcd-records` - PVCD records

#### 🎯 Activities
- `/api/activities` - Activity management
- `/api/registrations` - Activity registrations
- `/api/attendances` - Attendance tracking
- `/api/posts` - Activity posts

#### 📊 Points & Feedback
- `/api/points` - Point management
- `/api/feedback` - Feedback system
- `/api/evidences` - Evidence management

#### 💬 Communication
- `/api/notifications` - Notifications
- `/api/chats` - Chat system

#### ⚙️ System
- `/api/permissions` - Permission system
- `/api/roles` - Role management
- `/api/statistics` - Statistics

### **Permissions** ⭐
```
GET    /api/permissions                           # Get all permissions
GET    /api/permissions/:id                       # Get permission detail
POST   /api/permissions                           # Create permission
PUT    /api/permissions/:id                       # Update permission
DELETE /api/permissions/:id                       # Delete permission
POST   /api/permissions/:id/details               # Add action detail

GET    /api/permissions/users/:userId             # Get user permissions
POST   /api/permissions/users/:userId/grant/:permId    # Grant permission
POST   /api/permissions/users/:userId/revoke/:permId   # Revoke permission
GET    /api/permissions/users/:userId/check/:permId    # Check permission
```

[Xem API_EXAMPLES.md](./API_EXAMPLES.md) để biết chi tiết cách sử dụng.

## 🧪 Testing

### Test kết nối
```bash
node test_connection.js
```

### Test API với cURL
```bash
# Get permissions
curl http://localhost:5000/api/permissions \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create permission
curl -X POST http://localhost:5000/api/permissions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name_per":"TEST_PERMISSION","description":"Test"}'
```

### Test với Postman
Import file `Postman_Collection.json` vào Postman.

## 🔧 Tech Stack

- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Nodemailer** - Email service

## 📦 Dependencies

```json
{
  "express": "^4.18.2",
  "mongoose": "^8.0.0",
  "jsonwebtoken": "^9.0.0",
  "dotenv": "^16.0.0",
  "cors": "^2.8.5",
  "morgan": "^1.10.0",
  "nodemailer": "^6.9.0"
}
```

## 🌱 Seed Data

### Seed permissions
```bash
node src/seed_permission_system.js
```

Tạo 5 permissions mẫu:
1. ACTIVITY_MANAGEMENT
2. USER_MANAGEMENT
3. ATTENDANCE_MANAGEMENT
4. EVIDENCE_MANAGEMENT
5. REPORT_VIEW

### Seed sample data
```bash
node src/seed_sample_data.js
```

## ❓ Troubleshooting

### Lỗi kết nối MongoDB
```bash
# Kiểm tra MongoDB đã chạy
mongosh

# Hoặc restart service
sudo systemctl restart mongod
```

### Port đã được sử dụng
Thay đổi `PORT` trong file `.env`

### Permission không hoạt động
Kiểm tra:
1. User đã được gán permission chưa?
2. `licensed = true`?
3. `expires_at` còn hạn?
4. `check_action = true` cho action đó?

## 📖 Xem Thêm

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [Express Documentation](https://expressjs.com/)

## 👥 Team

PBL6 - Community Activity Management System

## 📄 License

MIT License

---

**🚀 Start:** `npm run dev`  
**📚 Docs:** Xem các file `.md` trong thư mục này  
**❓ Help:** Mở issue hoặc liên hệ team
