# Frontend Setup Guide

## 1️⃣ Install Dependencies

```bash
cd frontend
npm install
```

⏱️ Mất ~3-5 phút (phụ thuộc vào tốc độ mạng)

## 2️⃣ Configure Environment

File `.env` đã được tạo:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

✅ Nếu backend chạy ở port khác, cập nhật ở đây.

## 3️⃣ Start Frontend

**Terminal 1: Backend**
```bash
cd backend
npm run dev
```

**Terminal 2: Frontend**
```bash
cd frontend
npm start
```

✅ Browser sẽ tự động mở `http://localhost:3000`

## 4️⃣ Login

- Dùng username/password đã có trong hệ thống PBL6
- Token sẽ lưu vào `localStorage`

## 5️⃣ Test Chatbot

- Bạn sẽ thấy **💬 button** góc dưới phải
- Click để mở chatbot
- Hỏi câu hỏi hoặc upload ảnh

---

## File Structure

```
frontend/
├── public/
│   └── index.html          - HTML entry point
├── src/
│   ├── components/
│   │   └── ChatBot/        - Chatbot widget component
│   ├── pages/
│   │   ├── Login.jsx       - Login page
│   │   ├── Login.css       - Login styling
│   │   ├── Dashboard.jsx   - Dashboard page
│   │   └── Dashboard.css   - Dashboard styling
│   ├── App.jsx             - Main app component
│   ├── App.css             - App styling
│   └── index.js            - React entry point
├── .env                    - Environment variables
├── package.json            - Dependencies
├── SETUP.md               - This file
└── CHATBOT_INTEGRATION.md  - Chatbot integration guide
```

---

## Features

✅ **Login Page** - Authenticate với hệ thống PBL6
✅ **Dashboard** - Xem thông tin cá nhân & hoạt động
✅ **Chatbot Widget** - Hỏi đáp & upload ảnh
✅ **Responsive** - Tự động responsive trên mobile

---

## Pages

### 1. Login Page
- Nhập username/password
- Lưu token vào localStorage
- Redirect đến Dashboard

### 2. Dashboard
- Hiển thị thông tin cá nhân
- Hiển thị điểm PVCD & hoạt động
- Button Logout ở header
- Gợi ý dùng chatbot

### 3. Chatbot (Global Widget)
- Floating button góc phải
- Mở/đóng chat window
- Gọi API backend
- Lưu history

---

## Troubleshooting

### npm install fails
```bash
# Clear cache
npm cache clean --force

# Retry
npm install
```

### Port 3000 already in use
```bash
# Kill process on port 3000
# Windows: netstat -ano | findstr :3000
# Then: taskkill /PID <PID> /F

# Or use different port
PORT=3001 npm start
```

### CORS error
- Check backend CORS config in `app.js`
- Ensure frontend URL is allowed

### Token not persisting
- Check `localStorage.getItem('token')` in browser console
- Ensure login endpoint returns `token` field

### Chatbot API fails
- Check backend is running: `npm run dev` in `/backend`
- Check `REACT_APP_API_URL` in `.env`
- Check token validity

---

## Build for Production

```bash
npm run build
```

Creates optimized build in `build/` folder.

Deploy to:
- Vercel
- Netlify
- GitHub Pages
- Your own server

---

**Status**: ✅ Ready to run

**Next Steps**: 
1. `npm install`
2. Start backend: `npm run dev` (in `/backend`)
3. Start frontend: `npm start` (in `/frontend`)
4. Login & test chatbot!
