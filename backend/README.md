# 🎓 Community Activity Management Backend

Backend API cho hệ thống quản lý hoạt động cộng đồng với **Hệ thống Phân Quyền Chi Tiết** và tích hợp AI Chatbot.

## 📋 Mục lục

- [Tổng quan](#-tổng-quan)
- [Tính năng](#-tính-năng)
- [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
- [Cài đặt](#-cài-đặt)
- [Cấu hình](#-cấu-hình)
- [Chạy ứng dụng](#-chạy-ứng-dụng)
- [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
- [API Documentation](#-api-documentation)
- [Hệ thống phân quyền](#-hệ-thống-phân-quyền)
- [Testing](#-testing)
- [Troubleshooting](#-troubleshooting)
- [Tech Stack](#-tech-stack)
- [Tài liệu tham khảo](#-tài-liệu-tham-khảo)

---

## 🎯 Tổng quan

Hệ thống quản lý hoạt động cộng đồng là một nền tảng toàn diện cho phép quản lý các hoạt động sinh viên, điểm danh, minh chứng, và tích hợp chatbot AI để hỗ trợ người dùng. Backend được xây dựng trên Node.js và Express.js với MongoDB làm cơ sở dữ liệu.

### Đặc điểm nổi bật

- ✅ RESTful API với cấu trúc rõ ràng
- ✅ Hệ thống phân quyền chi tiết (Permission-based)
- ✅ JWT Authentication & Authorization
- ✅ QR Code Attendance System
- ✅ File Upload với Cloudinary
- ✅ AI Chatbot Integration
- ✅ Email Service (Nodemailer)
- ✅ Real-time Notifications
- ✅ Comprehensive Statistics & Reporting

---

## ✨ Tính năng

### 🔐 Authentication & Authorization
- Đăng nhập/Đăng ký với JWT
- Quên mật khẩu qua Email
- Đổi mật khẩu
- Quản lý session và token

### 👥 User Management
- Quản lý người dùng (Students, Staff, Admin)
- Student Profile & Staff Profile
- Bulk user creation từ Excel
- User-cohort mapping
- PVCD (Phục vụ cộng đồng) records

### 🎯 Activity Management
- Tạo, cập nhật, xóa hoạt động
- Đăng ký tham gia hoạt động
- Quản lý danh sách đăng ký
- Activity eligibility rules
- Activity posts & announcements

### ✅ Attendance System
- QR Code generation và scanning
- Geofence-based attendance
- Attendance sessions
- Real-time attendance tracking
- Attendance statistics

### 📝 Evidence Management
- Upload minh chứng (images, PDFs)
- Evidence approval workflow
- Cloudinary integration
- Evidence validation

### 📊 Points & Feedback
- Point calculation system
- Student feedback
- Activity feedback
- Point history tracking

### 💬 Communication
- Real-time notifications
- Chat system
- Notification read tracking

### 🤖 AI Chatbot
- Rule-based responses
- RAG (Retrieval-Augmented Generation)
- LLM integration (OpenAI, Claude)
- Document embedding
- Language detection
- Analytics & feedback

### 🏫 Organization Management
- Faculty management
- Field of study
- Cohort & Class management
- Organization units

### ⚙️ System Administration
- Permission system
- Role management
- Statistics & Reports
- System configuration

---

## 💻 Yêu cầu hệ thống

### Prerequisites

- **Node.js**: >= 14.0.0
- **MongoDB**: >= 4.4.0
- **npm**: >= 6.0.0 (hoặc yarn >= 1.22.0)

### Recommended Tools

- **MongoDB Compass** hoặc **MongoDB Atlas** (cho database management)
- **Postman** (cho API testing)
- **Git** (cho version control)

---

## 🚀 Cài đặt

### 1. Clone repository

```bash
git clone <repository-url>
cd backend
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình Environment Variables

Tạo file `.env` trong thư mục `backend/`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
HOST=0.0.0.0

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/pbl6
MONGODB_NAME=pbl6

# JWT Configuration
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d

# Email Configuration (for forgot password)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
FRONTEND_URL=http://localhost:3000

# Cloudinary Configuration (for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google Vision API (for OCR/Image processing)
GOOGLE_CREDENTIALS_PATH=./src/config/google-credentials.json

# Chatbot Configuration (Optional)
CHATBOT_ENABLE_RULES=true
CHATBOT_ENABLE_RAG=true
CHATBOT_USE_LLM_FOR_RAG=false
OPENAI_API_KEY=your_openai_key
CLAUDE_API_KEY=your_claude_key
HUGGINGFACE_API_KEY=your_hf_key
```

### 4. Test kết nối MongoDB

```bash
node test_connection.js
```

### 5. Seed dữ liệu ban đầu

```bash
# Seed permissions system
node seed_permissions.js

# Seed sample data (optional)
node src/seed_sample_data.js
```

---

## ⚙️ Cấu hình

### Environment Variables Chi Tiết

#### Server Configuration
| Variable | Mô tả | Mặc định | Bắt buộc |
|----------|-------|----------|----------|
| `PORT` | Port server chạy | `5000` | ❌ |
| `NODE_ENV` | Môi trường (`development`, `production`) | `development` | ❌ |
| `HOST` | Host binding | `0.0.0.0` | ❌ |

#### Database Configuration
| Variable | Mô tả | Mặc định | Bắt buộc |
|----------|-------|----------|----------|
| `MONGODB_URI` | MongoDB connection string | - | ✅ |
| `MONGODB_NAME` | Database name | `pbl6` | ❌ |

#### Authentication
| Variable | Mô tả | Mặc định | Bắt buộc |
|----------|-------|----------|----------|
| `JWT_SECRET` | Secret key cho JWT | - | ✅ |
| `JWT_EXPIRE` | Token expiration time | `7d` | ❌ |

#### Email Service
| Variable | Mô tả | Mặc định | Bắt buộc |
|----------|-------|----------|----------|
| `EMAIL_USER` | Email address | - | ⚠️* |
| `EMAIL_PASS` | App password | - | ⚠️* |
| `FRONTEND_URL` | Frontend URL cho reset password | - | ⚠️* |

*Bắt buộc nếu sử dụng tính năng quên mật khẩu

**Lưu ý**: Để sử dụng tính năng quên mật khẩu:
1. Tạo App Password cho Gmail: [Hướng dẫn](https://support.google.com/accounts/answer/185833)
2. Điền `EMAIL_USER` và `EMAIL_PASS` vào file `.env`
3. Đặt `FRONTEND_URL` là URL của frontend application

#### Cloudinary (File Upload)
| Variable | Mô tả | Mặc định | Bắt buộc |
|----------|-------|----------|----------|
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | - | ⚠️* |
| `CLOUDINARY_API_KEY` | Cloudinary API key | - | ⚠️* |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | - | ⚠️* |

*Bắt buộc nếu sử dụng tính năng upload file

#### Chatbot Configuration (Optional)
Các biến môi trường cho chatbot có thể được cấu hình trong `src/config/chatbot.config.js`. Xem [CHATBOT_API_GUIDE.md](./CHATBOT_API_GUIDE.md) để biết chi tiết.

---

## 🏃 Chạy ứng dụng

### Development Mode

```bash
npm run dev
```

Server sẽ chạy với nodemon, tự động restart khi có thay đổi code.

### Production Mode

```bash
npm start
```

Server sẽ chạy trên port được cấu hình trong `.env` (mặc định: `5000`).

### Kiểm tra server

Mở browser và truy cập:
- API Base URL: `http://localhost:5000/api`
- Health check: `http://localhost:5000/api/health` (nếu có)

---

## 🏗️ Kiến trúc hệ thống

### Cấu trúc thư mục

```
backend/
├── src/
│   ├── models/              # Mongoose schemas (34+ models)
│   │   ├── user.model.js
│   │   ├── student_profile.model.js
│   │   ├── staff_profile.model.js
│   │   ├── activity.model.js
│   │   ├── attendance.model.js
│   │   ├── permission.model.js
│   │   └── ...
│   │
│   ├── controllers/         # Business logic (25+ controllers)
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── activity.controller.js
│   │   ├── attendance.controller.js
│   │   ├── chatbot.controller.js
│   │   └── ...
│   │
│   ├── routes/              # API routes (26+ route files)
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── activity.routes.js
│   │   ├── chatbot.routes.js
│   │   └── ...
│   │
│   ├── middlewares/         # Express middlewares
│   │   ├── auth.middleware.js
│   │   ├── check_permission.middleware.js
│   │   ├── error.middleware.js
│   │   ├── upload-cloudinary.middleware.js
│   │   └── ...
│   │
│   ├── services/            # Business services (19+ services)
│   │   ├── chatbot services
│   │   ├── embedding services
│   │   └── ...
│   │
│   ├── config/              # Configuration files
│   │   ├── db.js
│   │   ├── app.config.js
│   │   ├── chatbot.config.js
│   │   └── ...
│   │
│   ├── utils/               # Utility functions
│   │   ├── email.util.js
│   │   ├── qr.util.js
│   │   ├── cloudinary.util.js
│   │   └── ...
│   │
│   ├── app.js               # Express app configuration
│   └── server.js            # Server entry point
│
├── public/                  # Static files & test pages
│   ├── test-*.html         # Test pages
│   └── uploads/            # Local uploads (if not using Cloudinary)
│
├── scripts/                 # Utility scripts
├── tests/                   # Test files
│
├── API_ENDPOINTS.md        # Complete API documentation
├── CHATBOT_API_GUIDE.md    # Chatbot API guide
├── CLOUDINARY_SETUP.md     # Cloudinary setup guide
├── PERMISSION_SYSTEM.md    # Permission system documentation
├── Postman_Collection_v2.json
├── package.json
└── README.md
```

### Data Flow

```
Client Request
    ↓
Routes (routes/)
    ↓
Auth Middleware (auth.middleware.js)
    ↓
Permission Middleware (check_permission.middleware.js)
    ↓
Controller (controllers/)
    ↓
Service (services/) [Optional]
    ↓
Model (models/)
    ↓
MongoDB
```

### Database Schema Overview

- **Users**: User accounts và authentication
- **Student Profiles**: Thông tin sinh viên
- **Staff Profiles**: Thông tin cán bộ
- **Activities**: Hoạt động cộng đồng
- **Registrations**: Đăng ký tham gia
- **Attendances**: Điểm danh
- **Evidences**: Minh chứng
- **Permissions**: Hệ thống phân quyền
- **Roles**: Vai trò người dùng
- **Notifications**: Thông báo
- **Chats**: Tin nhắn
- Và nhiều models khác...

---

## 📡 API Documentation

### Base URL

```
Development: http://localhost:5000/api
Production:  https://your-domain.com/api
```

### API Modules

#### 🔐 Authentication & Users
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/forgot-password` - Quên mật khẩu
- `POST /api/auth/reset-password` - Reset mật khẩu
- `GET /api/auth/profile` - Lấy thông tin profile
- `POST /api/auth/change-password` - Đổi mật khẩu
- `GET /api/users` - Danh sách users
- `GET /api/users/:id` - Chi tiết user
- `POST /api/users` - Tạo user (Admin)
- `PUT /api/users/:id` - Cập nhật user
- `DELETE /api/users/:id` - Xóa user

#### 🎯 Activities
- `GET /api/activities` - Danh sách hoạt động
- `GET /api/activities/:id` - Chi tiết hoạt động
- `POST /api/activities` - Tạo hoạt động
- `PUT /api/activities/:id` - Cập nhật hoạt động
- `DELETE /api/activities/:id` - Xóa hoạt động
- `POST /api/activities/:id/register` - Đăng ký tham gia
- `GET /api/activities/:id/registrations` - Danh sách đăng ký

#### ✅ Attendance
- `GET /api/attendances` - Danh sách điểm danh
- `POST /api/attendances` - Tạo điểm danh
- `GET /api/attendances/qr/:activityId` - Generate QR code
- `POST /api/attendances/scan` - Scan QR code
- `GET /api/attendances/sessions` - Attendance sessions

#### 📝 Evidence
- `GET /api/evidences` - Danh sách minh chứng
- `POST /api/evidences` - Upload minh chứng
- `PUT /api/evidences/:id/approve` - Duyệt minh chứng
- `PUT /api/evidences/:id/reject` - Từ chối minh chứng

#### 💬 Communication
- `GET /api/notifications` - Danh sách thông báo
- `POST /api/notifications` - Tạo thông báo
- `PUT /api/notifications/:id/read` - Đánh dấu đã đọc
- `GET /api/chats` - Danh sách chat
- `POST /api/chats` - Gửi tin nhắn

#### 🤖 Chatbot
- `POST /api/chatbot/message` - Gửi tin nhắn đến chatbot
- `GET /api/chatbot/history` - Lịch sử chat
- `POST /api/chatbot/feedback` - Gửi feedback

#### ⚙️ System
- `GET /api/permissions` - Danh sách permissions
- `POST /api/permissions/users/:userId/grant/:permId` - Cấp quyền
- `GET /api/roles` - Danh sách roles
- `GET /api/statistics` - Thống kê

### Xem chi tiết

Xem **[API_ENDPOINTS.md](./API_ENDPOINTS.md)** để biết đầy đủ tất cả endpoints với request/response examples.

### Postman Collection

Import file `Postman_Collection_v2.json` vào Postman để test API nhanh chóng.

---

## 🛡️ Hệ thống phân quyền

### Tổng quan

Hệ thống phân quyền chi tiết cho phép kiểm soát quyền truy cập ở mức độ hành động (action-level), không chỉ ở mức độ tài nguyên (resource-level).

### Cấu trúc

```
User ←→ UserPermission ←→ Permission
                              ↓
                        PermissionDetails (Actions)
```

### Permission Model

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

### UserPermission Model

```javascript
{
  id_user: ObjectId,      // User reference
  id_per: ObjectId,       // Permission reference
  licensed: true,         // Granted or revoked
  granted_at: Date,
  expires_at: Date        // null = permanent
}
```

### Sử dụng Middleware

```javascript
const { checkPermission } = require('./middlewares/check_permission.middleware');

// Protect route với permission và action
router.post('/activities',
  authMiddleware,
  checkPermission('ACTIVITY_MANAGEMENT', 'CREATE'),
  activityController.create
);
```

### API Endpoints

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

### Tài liệu chi tiết

- **[PERMISSION_SYSTEM.md](./PERMISSION_SYSTEM.md)** - Hướng dẫn chi tiết về hệ thống phân quyền
- **[PERMISSION_USAGE.md](./PERMISSION_USAGE.md)** - Cách sử dụng Permission Models

---

## 🧪 Testing

### Test kết nối MongoDB

```bash
node test_connection.js
```

### Test API với cURL

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user1","password":"password123"}'

# Get permissions (với token)
curl http://localhost:5000/api/permissions \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create activity
curl -X POST http://localhost:5000/api/activities \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Activity Name","description":"Description"}'
```

### Test với Postman

1. Import file `Postman_Collection_v2.json` vào Postman
2. Set environment variables:
   - `base_url`: `http://localhost:5000/api`
   - `token`: JWT token sau khi login
3. Chạy các requests trong collection

### Test Pages

Các file HTML test trong thư mục `public/`:
- `test-login.html` - Test đăng nhập
- `test-auth.html` - Test authentication
- `test-permission.html` - Test permissions
- `test-attendance.html` - Test attendance
- Và nhiều test pages khác...

---

## 🔧 Troubleshooting

### Lỗi kết nối MongoDB

**Vấn đề**: `MongoServerError: connect ECONNREFUSED`

**Giải pháp**:
```bash
# Kiểm tra MongoDB đã chạy chưa
mongosh

# Hoặc restart MongoDB service
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl restart mongod
# hoặc
brew services restart mongodb-community
```

**Kiểm tra connection string**:
- Đảm bảo `MONGODB_URI` trong `.env` đúng format
- Format: `mongodb://localhost:27017/pbl6` hoặc `mongodb+srv://user:pass@cluster.mongodb.net/dbname`

### Port đã được sử dụng

**Vấn đề**: `Error: listen EADDRINUSE: address already in use :::5000`

**Giải pháp**:
```bash
# Tìm process đang sử dụng port 5000
# Windows
netstat -ano | findstr :5000

# Linux/Mac
lsof -i :5000

# Kill process hoặc thay đổi PORT trong .env
```

### Permission không hoạt động

**Kiểm tra checklist**:
1. ✅ User đã được gán permission chưa? (`UserPermission` document tồn tại)
2. ✅ `licensed = true` trong `UserPermission`?
3. ✅ `expires_at` còn hạn? (hoặc `null` = permanent)
4. ✅ `check_action = true` cho action đó trong `Permission.details`?
5. ✅ Token JWT hợp lệ và chưa hết hạn?
6. ✅ Middleware `checkPermission` được gọi đúng thứ tự?

**Debug**:
```javascript
// Thêm log trong check_permission.middleware.js
console.log('Checking permission:', permissionName, actionCode);
console.log('User permissions:', userPermissions);
```

### Email không gửi được

**Vấn đề**: Email reset password không được gửi

**Giải pháp**:
1. Kiểm tra `EMAIL_USER` và `EMAIL_PASS` trong `.env`
2. Đảm bảo đã tạo App Password (không phải mật khẩu thường)
3. Kiểm tra Gmail "Less secure app access" đã bật (nếu cần)
4. Xem logs trong console để biết lỗi cụ thể

### Cloudinary upload lỗi

**Vấn đề**: Upload file lên Cloudinary thất bại

**Giải pháp**:
1. Kiểm tra 3 biến môi trường Cloudinary đã được set
2. Verify credentials trong Cloudinary dashboard
3. Kiểm tra file size limits (Cloudinary free tier: 10MB)
4. Xem [CLOUDINARY_SETUP.md](./CLOUDINARY_SETUP.md) để biết chi tiết

### JWT Token invalid

**Vấn đề**: `JsonWebTokenError: invalid token`

**Giải pháp**:
1. Đảm bảo token được gửi trong header: `Authorization: Bearer <token>`
2. Kiểm tra `JWT_SECRET` trong `.env` giống với lúc tạo token
3. Token có thể đã hết hạn, cần login lại
4. Format token đúng: không có khoảng trắng, không có prefix sai

---

## 🛠️ Tech Stack

### Core Technologies

- **Node.js** (>= 14.0.0) - JavaScript runtime
- **Express.js** (^4.18.2) - Web framework
- **MongoDB** (>= 4.4.0) - NoSQL database
- **Mongoose** (^8.0.0) - MongoDB ODM

### Authentication & Security

- **jsonwebtoken** (^9.0.0) - JWT authentication
- **bcryptjs** (^2.4.3) - Password hashing
- **cors** (^2.8.5) - Cross-origin resource sharing

### File Handling

- **multer** (^2.0.2) - File upload middleware
- **cloudinary** (^1.41.3) - Cloud storage
- **xlsx** (^0.18.5) - Excel file processing
- **pdf-parse** (^2.4.5) - PDF parsing

### Utilities

- **qrcode** (^1.5.4) - QR code generation
- **nodemailer** (^6.9.0) - Email service
- **axios** (^1.13.2) - HTTP client
- **morgan** (^1.10.0) - HTTP request logger
- **dotenv** (^16.0.0) - Environment variables
- **string-similarity** (^4.0.4) - String similarity

### AI & ML

- **@google-cloud/vision** (^5.3.4) - Google Vision API

### Development Tools

- **nodemon** (^3.0.0) - Auto-restart development server

---

## 📚 Tài liệu tham khảo

### Documentation Files

- **[API_ENDPOINTS.md](./API_ENDPOINTS.md)** - Complete API documentation
- **[CHATBOT_API_GUIDE.md](./CHATBOT_API_GUIDE.md)** - Chatbot integration guide
- **[CLOUDINARY_SETUP.md](./CLOUDINARY_SETUP.md)** - Cloudinary configuration
- **[PERMISSION_SYSTEM.md](./PERMISSION_SYSTEM.md)** - Permission system details
- **[PERMISSION_USAGE.md](./PERMISSION_USAGE.md)** - Permission usage guide
- **[QUICKSTART.md](./QUICKSTART.md)** - Quick start guide
- **[MONGODB_SETUP.md](./MONGODB_SETUP.md)** - MongoDB setup guide
- **[API_EXAMPLES.md](./API_EXAMPLES.md)** - API examples with cURL

### External Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [Express.js Documentation](https://expressjs.com/)
- [JWT.io](https://jwt.io/) - JWT debugger
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Node.js Documentation](https://nodejs.org/docs/)

---

## 🌱 Seed Data

### Seed Permissions

```bash
node seed_permissions.js
```

Tạo 5 permissions mẫu:
1. `ACTIVITY_MANAGEMENT` - Quản lý hoạt động
2. `USER_MANAGEMENT` - Quản lý người dùng
3. `ATTENDANCE_MANAGEMENT` - Quản lý điểm danh
4. `EVIDENCE_MANAGEMENT` - Quản lý minh chứng
5. `REPORT_VIEW` - Xem báo cáo

### Seed Sample Data

```bash
node src/seed_sample_data.js
```

Tạo dữ liệu mẫu cho testing (users, activities, etc.)

---

## 👥 Team

**PBL6 - Community Activity Management System**

---

## 📄 License

MIT License

---

## 🚀 Quick Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run production server
npm start

# Test MongoDB connection
node test_connection.js

# Seed permissions
node seed_permissions.js
```

---

**📚 Xem thêm**: Các file `.md` trong thư mục này để biết chi tiết về từng module  
**❓ Hỗ trợ**: Mở issue hoặc liên hệ team để được hỗ trợ
