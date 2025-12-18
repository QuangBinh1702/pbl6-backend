# Frontend Setup - Hướng Dẫn Cài Đặt

## Yêu Cầu Hệ Thống
- Node.js (v14 trở lên)
- npm (v6 trở lên)

## Các Bước Cài Đặt

### 1. Mở Thư Mục Frontend
```bash
cd frontend
```

### 2. Cài Đặt Dependencies
```bash
npm install
```

### 3. Chạy Development Server
```bash
npm start
```
- Server sẽ chạy tại: `http://localhost:3000`

### 4. Xây Dựng Production Build
```bash
npm run build
```

### 5. Chạy Tests
```bash
npm test
```

Để chạy một test cụ thể:
```bash
npm test -- --testNamePattern="tên test"
```

## Cấu Trúc Thư Mục
```
frontend/
├── src/
│   ├── components/     # Các component tái sử dụng
│   ├── pages/          # Các trang chính
│   ├── styles/         # CSS modules
│   └── services/       # API services
├── package.json
└── requiments.md       # File này
```

## Ghi Chú
- Sử dụng ES6 imports cho frontend
- Naming: camelCase cho variables/functions, PascalCase cho components
- Đảm bảo backend server đang chạy trước khi sử dụng frontend
