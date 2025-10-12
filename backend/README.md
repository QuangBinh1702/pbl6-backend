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
```

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
│   ├── models/               # Mongoose models
│   │   ├── permission.model.js          # ⭐ Permission với details
│   │   ├── user_permission.model.js     # ⭐ User-Permission mapping
│   │   ├── user.model.js
│   │   ├── activity.model.js
│   │   └── ...
│   ├── controllers/          # Business logic
│   │   ├── permission.controller.js     # ⭐ Permission controller
│   │   ├── auth.controller.js
│   │   └── ...
│   ├── routes/              # API routes
│   │   ├── permission.routes.js         # ⭐ Permission routes
│   │   ├── auth.routes.js
│   │   └── ...
│   ├── middlewares/         # Middlewares
│   │   ├── check_permission.middleware.js  # ⭐ Permission checker
│   │   ├── auth.middleware.js
│   │   └── ...
│   ├── config/              # Configuration
│   │   ├── db.js
│   │   └── ...
│   ├── utils/               # Utilities
│   ├── seed_permission_system.js        # ⭐ Seed script
│   ├── app.js               # Express app
│   └── server.js            # Server entry
├── test_connection.js       # ⭐ MongoDB test script
├── QUICKSTART.md           # ⭐ Quick start guide
├── MONGODB_SETUP.md        # ⭐ MongoDB setup guide
├── PERMISSION_USAGE.md     # ⭐ Permission usage guide
├── API_EXAMPLES.md         # ⭐ API examples
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

### Authentication
```
POST   /api/auth/login              # Login
POST   /api/auth/register           # Register
POST   /api/auth/refresh            # Refresh token
```

### Users
```
GET    /api/users                   # Get all users
GET    /api/users/:id               # Get user by ID
PUT    /api/users/:id               # Update user
DELETE /api/users/:id               # Delete user
```

### Activities
```
GET    /api/activities              # Get activities
POST   /api/activities              # Create activity
PUT    /api/activities/:id          # Update activity
DELETE /api/activities/:id          # Delete activity
```

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
