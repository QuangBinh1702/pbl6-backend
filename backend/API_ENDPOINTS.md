# API Endpoints Documentation

## Tổng quan

Tài liệu này mô tả tất cả các API endpoints có sẵn trong hệ thống quản lý hoạt động sinh viên.

Base URL: `/api`

## Authentication & Users

### Auth Routes (`/api/auth`)
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/register` - Đăng ký tài khoản
- `POST /api/auth/refresh` - Làm mới token

### User Routes (`/api/users`)
- `GET /api/users` - Lấy danh sách người dùng (admin, ctsv)
- `GET /api/users/:id` - Lấy chi tiết người dùng
- `POST /api/users` - Tạo tài khoản mới (admin, ctsv)
- `PUT /api/users/:id` - Cập nhật thông tin người dùng
- `DELETE /api/users/:id` - Xóa tài khoản (admin, ctsv)
- `PUT /api/users/:id/lock` - Khóa tài khoản (admin, ctsv)
- `PUT /api/users/:id/unlock` - Mở khóa tài khoản (admin, ctsv)
- `PUT /api/users/:id/role` - Phân quyền (admin, ctsv)
- `GET /api/users/:id/evidences` - Lấy minh chứng của người dùng

## Profiles

### Student Profile Routes (`/api/student-profiles`)
- `GET /api/student-profiles` - Lấy tất cả hồ sơ sinh viên (admin, ctsv, teacher)
- `GET /api/student-profiles/:id` - Lấy hồ sơ sinh viên theo ID
- `GET /api/student-profiles/user/:userId` - Lấy hồ sơ theo User ID
- `GET /api/student-profiles/student-number/:studentNumber` - Lấy hồ sơ theo mã sinh viên
- `GET /api/student-profiles/class/:classId/students` - Lấy sinh viên theo lớp
- `POST /api/student-profiles` - Tạo hồ sơ sinh viên mới (admin, ctsv)
- `PUT /api/student-profiles/:id` - Cập nhật hồ sơ sinh viên
- `DELETE /api/student-profiles/:id` - Xóa hồ sơ sinh viên (admin, ctsv)
- `PUT /api/student-profiles/:id/set-monitor` - Đặt làm lớp trưởng (admin, ctsv, teacher)
- `PUT /api/student-profiles/:id/remove-monitor` - Hủy lớp trưởng (admin, ctsv, teacher)

### Staff Profile Routes (`/api/staff-profiles`)
- `GET /api/staff-profiles` - Lấy tất cả hồ sơ cán bộ (admin, ctsv)
- `GET /api/staff-profiles/:id` - Lấy hồ sơ cán bộ theo ID
- `GET /api/staff-profiles/user/:userId` - Lấy hồ sơ theo User ID
- `GET /api/staff-profiles/staff-number/:staffNumber` - Lấy hồ sơ theo mã cán bộ
- `GET /api/staff-profiles/org-unit/:orgUnitId/staff` - Lấy cán bộ theo đơn vị
- `POST /api/staff-profiles` - Tạo hồ sơ cán bộ mới (admin, ctsv)
- `PUT /api/staff-profiles/:id` - Cập nhật hồ sơ cán bộ
- `DELETE /api/staff-profiles/:id` - Xóa hồ sơ cán bộ (admin, ctsv)

### Student Cohort Routes (`/api/student-cohorts`)
- `GET /api/student-cohorts` - Lấy tất cả sinh viên-khóa (admin, ctsv, teacher)
- `GET /api/student-cohorts/:id` - Lấy sinh viên-khóa theo ID
- `GET /api/student-cohorts/student/:studentId` - Lấy theo sinh viên
- `GET /api/student-cohorts/cohort/:cohortId` - Lấy theo khóa
- `POST /api/student-cohorts` - Tạo mới (admin, ctsv)
- `PUT /api/student-cohorts/:id` - Cập nhật (admin, ctsv)
- `DELETE /api/student-cohorts/:id` - Xóa (admin, ctsv)

### PVCD Record Routes (`/api/pvcd-records`)
- `GET /api/pvcd-records` - Lấy tất cả bản ghi PVCD (admin, ctsv, teacher)
- `GET /api/pvcd-records/:id` - Lấy bản ghi theo ID
- `GET /api/pvcd-records/student/:studentId` - Lấy theo sinh viên
- `GET /api/pvcd-records/year/:year` - Lấy theo năm (admin, ctsv, teacher)
- `POST /api/pvcd-records` - Tạo bản ghi mới (admin, ctsv)
- `PUT /api/pvcd-records/:id` - Cập nhật bản ghi (admin, ctsv)
- `PUT /api/pvcd-records/:id/points` - Cập nhật điểm (admin, ctsv)
- `DELETE /api/pvcd-records/:id` - Xóa bản ghi (admin, ctsv)

## Organization

### Faculty Routes (`/api/faculties`)
- `GET /api/faculties` - Lấy tất cả khoa
- `GET /api/faculties/:id` - Lấy khoa theo ID
- `GET /api/faculties/:id/classes` - Lấy danh sách lớp của khoa
- `POST /api/faculties` - Tạo khoa mới (admin, ctsv)
- `PUT /api/faculties/:id` - Cập nhật khoa (admin, ctsv)
- `DELETE /api/faculties/:id` - Xóa khoa (admin, ctsv)

### Field Routes (`/api/fields`)
- `GET /api/fields` - Lấy tất cả ngành học
- `GET /api/fields/:id` - Lấy ngành học theo ID
- `POST /api/fields` - Tạo ngành học mới (admin, ctsv)
- `PUT /api/fields/:id` - Cập nhật ngành học (admin, ctsv)
- `DELETE /api/fields/:id` - Xóa ngành học (admin, ctsv)

### Cohort Routes (`/api/cohorts`)
- `GET /api/cohorts` - Lấy tất cả khóa học
- `GET /api/cohorts/:id` - Lấy khóa học theo ID
- `GET /api/cohorts/year/:year` - Lấy khóa học theo năm
- `GET /api/cohorts/:id/classes` - Lấy danh sách lớp của khóa
- `GET /api/cohorts/:id/students` - Lấy danh sách sinh viên của khóa
- `POST /api/cohorts` - Tạo khóa học mới (admin, ctsv)
- `PUT /api/cohorts/:id` - Cập nhật khóa học (admin, ctsv)
- `DELETE /api/cohorts/:id` - Xóa khóa học (admin, ctsv)

### Class Routes (`/api/classes`)
- `GET /api/classes` - Lấy tất cả lớp học
- `GET /api/classes/:id` - Lấy lớp học theo ID
- `GET /api/classes/faculty/:facultyId/classes` - Lấy lớp theo khoa
- `GET /api/classes/cohort/:cohortId/classes` - Lấy lớp theo khóa
- `GET /api/classes/:id/students` - Lấy sinh viên trong lớp
- `POST /api/classes` - Tạo lớp học mới (admin, ctsv)
- `PUT /api/classes/:id` - Cập nhật lớp học (admin, ctsv)
- `DELETE /api/classes/:id` - Xóa lớp học (admin, ctsv)

### Organization Unit Routes (`/api/org-units`)
- `GET /api/org-units` - Lấy tất cả đơn vị tổ chức
- `GET /api/org-units/:id` - Lấy đơn vị theo ID
- `GET /api/org-units/type/:type` - Lấy đơn vị theo loại
- `GET /api/org-units/:id/staff` - Lấy cán bộ của đơn vị
- `POST /api/org-units` - Tạo đơn vị mới (admin, ctsv)
- `PUT /api/org-units/:id` - Cập nhật đơn vị (admin, ctsv)
- `DELETE /api/org-units/:id` - Xóa đơn vị (admin, ctsv)
- `PUT /api/org-units/:id/set-leader` - Đặt trưởng đơn vị (admin, ctsv)

## Activities

### Activity Routes (`/api/activities`)
- `GET /api/activities` - Lấy tất cả hoạt động
- `GET /api/activities/:id` - Lấy hoạt động theo ID
- `POST /api/activities` - Tạo hoạt động mới
- `PUT /api/activities/:id` - Cập nhật hoạt động
- `DELETE /api/activities/:id` - Xóa hoạt động
- `PUT /api/activities/:id/approve` - Phê duyệt hoạt động
- `PUT /api/activities/:id/reject` - Từ chối hoạt động
- `PUT /api/activities/:id/complete` - Hoàn thành hoạt động
- `POST /api/activities/:id/register` - Đăng ký tham gia
- `POST /api/activities/:id/attendance` - Điểm danh
- `POST /api/activities/:id/confirm` - Xác nhận hoạt động

### Registration Routes (`/api/registrations`)
- `GET /api/registrations` - Lấy tất cả đăng ký (admin, ctsv, teacher)
- `GET /api/registrations/my-registrations` - Lấy đăng ký của tôi
- `GET /api/registrations/:id` - Lấy đăng ký theo ID
- `GET /api/registrations/activity/:activityId` - Lấy đăng ký theo hoạt động
- `GET /api/registrations/user/:userId` - Lấy đăng ký theo người dùng
- `POST /api/registrations` - Tạo đăng ký mới
- `PUT /api/registrations/:id` - Cập nhật đăng ký
- `DELETE /api/registrations/:id` - Xóa đăng ký
- `PUT /api/registrations/:id/approve` - Phê duyệt đăng ký (admin, ctsv, teacher, union)
- `PUT /api/registrations/:id/reject` - Từ chối đăng ký (admin, ctsv, teacher, union)
- `PUT /api/registrations/:id/attend` - Đánh dấu đã tham dự (admin, ctsv, teacher, union)
- `PUT /api/registrations/:id/confirm` - Xác nhận đăng ký (admin, ctsv, teacher, union)

### Attendance Routes (`/api/attendances`)
- `GET /api/attendances` - Lấy tất cả điểm danh (admin, ctsv, teacher)
- `GET /api/attendances/:id` - Lấy điểm danh theo ID
- `GET /api/attendances/activity/:activityId` - Lấy điểm danh theo hoạt động
- `GET /api/attendances/student/:studentId` - Lấy điểm danh theo sinh viên
- `POST /api/attendances` - Tạo điểm danh mới (admin, ctsv, teacher, union)
- `PUT /api/attendances/:id` - Cập nhật điểm danh (admin, ctsv, teacher, union)
- `DELETE /api/attendances/:id` - Xóa điểm danh (admin, ctsv, teacher, union)
- `PUT /api/attendances/:id/verify` - Xác minh điểm danh (admin, ctsv, teacher, union)
- `PUT /api/attendances/:id/feedback` - Thêm phản hồi
- `POST /api/attendances/scan-qr` - Quét mã QR điểm danh

### Post Routes (`/api/posts`)
- `GET /api/posts` - Lấy tất cả bài đăng
- `GET /api/posts/:id` - Lấy bài đăng theo ID
- `GET /api/posts/activity/:activityId` - Lấy bài đăng theo hoạt động
- `POST /api/posts` - Tạo bài đăng mới (admin, ctsv, teacher, union)
- `PUT /api/posts/:id` - Cập nhật bài đăng (admin, ctsv, teacher, union)
- `DELETE /api/posts/:id` - Xóa bài đăng (admin, ctsv, teacher, union)

## Points & Feedback

### Point Routes (`/api/points`)
- `GET /api/points` - Lấy điểm của sinh viên
- `POST /api/points` - Thêm điểm
- `PUT /api/points/:id` - Cập nhật điểm

### Feedback Routes (`/api/feedback`)
- `GET /api/feedback` - Lấy tất cả phản hồi
- `POST /api/feedback` - Tạo phản hồi mới
- `PUT /api/feedback/:id/resolve` - Giải quyết phản hồi

### Evidence Routes (`/api/evidences`)
- `GET /api/evidences` - Lấy tất cả minh chứng
- `GET /api/evidences/:id` - Lấy minh chứng theo ID
- `POST /api/evidences` - Tạo minh chứng mới
- `PUT /api/evidences/:id` - Cập nhật minh chứng
- `PUT /api/evidences/:id/approve` - Phê duyệt minh chứng
- `PUT /api/evidences/:id/reject` - Từ chối minh chứng
- `DELETE /api/evidences/:id` - Xóa minh chứng

## Communication

### Notification Routes (`/api/notifications`)
- `GET /api/notifications` - Lấy thông báo
- `POST /api/notifications` - Tạo thông báo mới
- `PUT /api/notifications/:id/read` - Đánh dấu đã đọc

### Chat Routes (`/api/chats`)
- `GET /api/chats` - Lấy tin nhắn
- `POST /api/chats` - Gửi tin nhắn

## System

### Permission Routes (`/api/permissions`)
- Quản lý quyền hạn động (xem chi tiết trong permission.routes.js)

### Role Routes (`/api/roles`)
- `GET /api/roles` - Lấy tất cả vai trò (admin, ctsv)
- `GET /api/roles/:id` - Lấy vai trò theo ID (admin, ctsv)
- `GET /api/roles/name/:name` - Lấy vai trò theo tên (admin, ctsv)
- `GET /api/roles/:id/users` - Lấy người dùng theo vai trò (admin, ctsv)
- `POST /api/roles` - Tạo vai trò mới (admin)
- `PUT /api/roles/:id` - Cập nhật vai trò (admin)
- `DELETE /api/roles/:id` - Xóa vai trò (admin)
- `POST /api/roles/:id/permissions` - Thêm quyền vào vai trò (admin)
- `DELETE /api/roles/:id/permissions` - Xóa quyền khỏi vai trò (admin)

### Statistic Routes (`/api/statistics`)
- `GET /api/statistics` - Lấy thống kê hệ thống

## Authentication

Hầu hết các endpoints yêu cầu authentication token trong header:
```
Authorization: Bearer <token>
```

## Role-based Access Control

Các vai trò trong hệ thống:
- `admin` - Quản trị viên hệ thống
- `ctsv` - Cán bộ công tác sinh viên
- `teacher` - Giảng viên
- `union` - Cán bộ đoàn hội
- `student` - Sinh viên

## Response Format

### Success Response
```json
{
  "data": {},
  "message": "Success"
}
```

### Error Response
```json
{
  "message": "Error message"
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error


