# Hướng dẫn cấu hình Cloudinary cho Upload Files

## Vấn đề với Render.com

Khi deploy lên Render.com (hoặc các platform serverless khác), file system là **ephemeral** (tạm thời). Điều này có nghĩa là:
- File upload vào thư mục `public/uploads/` sẽ **bị mất** khi server restart hoặc redeploy
- Không thể lưu file trực tiếp trên server

## Giải pháp: Sử dụng Cloudinary

Code đã được cập nhật để tự động upload lên **Cloudinary** khi có cấu hình, và fallback về local storage khi không có (cho development).

## Cách setup Cloudinary

### 1. Tạo tài khoản Cloudinary (Miễn phí)

1. Truy cập: https://cloudinary.com/users/register/free
2. Đăng ký tài khoản miễn phí
3. Vào Dashboard → Settings → Access Keys

### 2. Lấy thông tin API

Trong Dashboard, bạn sẽ thấy:
- **Cloud Name**: Tên cloud của bạn
- **API Key**: Key để upload
- **API Secret**: Secret key (bảo mật)

### 3. Thêm vào Environment Variables

#### Trên Render.com:

1. Vào service của bạn trên Render
2. Settings → Environment Variables
3. Thêm 3 biến sau:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### Trong file `.env` (cho development):

Thêm vào file `.env` trong thư mục `backend/`:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Cài đặt package

Đã được thêm vào `package.json`, chạy:

```bash
npm install
```

## Cách hoạt động

### Khi có Cloudinary config:
1. File được upload lên Cloudinary
2. URL từ Cloudinary được lưu vào database
3. File local được xóa tự động
4. URL có dạng: `https://res.cloudinary.com/your-cloud/image/upload/...`

### Khi không có Cloudinary config (development):
1. File được lưu vào `public/uploads/`
2. URL local được lưu vào database
3. URL có dạng: `http://localhost:5000/uploads/filename.jpg`

## Lưu ý

- **Free tier Cloudinary**: 
  - 25GB storage
  - 25GB bandwidth/tháng
  - Đủ cho hầu hết các dự án nhỏ/trung bình

- **Bảo mật**: 
  - KHÔNG commit file `.env` lên Git
  - Chỉ thêm environment variables trên Render dashboard

- **Fallback**: 
  - Code tự động fallback về local storage nếu không có Cloudinary config
  - Không cần thay đổi code khi chuyển giữa local và production

## Test

Sau khi cấu hình, test upload file:
- Upload thành công → URL sẽ là Cloudinary URL
- Kiểm tra trong Cloudinary Dashboard → Media Library để xem file đã upload

