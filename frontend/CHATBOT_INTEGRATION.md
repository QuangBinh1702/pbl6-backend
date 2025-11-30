# Hướng Dẫn Integrate ChatBot Widget

## 1. Setup

Chatbot Widget đã được tạo trong `/frontend/src/components/ChatBot/`

### File cần có:
- `ChatBot.jsx` - Main component
- `ChatBot.css` - Styling
- `index.js` - Export

## 2. Cách Sử Dụng

### Option A: Import và sử dụng trong App.js

```jsx
import ChatBot from './components/ChatBot';

function App() {
  return (
    <div className="App">
      {/* Your existing code */}
      
      {/* Add ChatBot widget */}
      <ChatBot />
    </div>
  );
}

export default App;
```

### Option B: Sử dụng trong Layout/Shell Component

```jsx
import ChatBot from './components/ChatBot';

function Layout({ children }) {
  return (
    <div className="layout">
      {children}
      <ChatBot />
    </div>
  );
}

export default Layout;
```

## 3. Environment Variables

Tạo file `.env` trong `frontend/` folder (hoặc cập nhật existing):

```env
REACT_APP_API_URL=http://localhost:5000/api
```

Hoặc cho production:

```env
REACT_APP_API_URL=https://your-api-domain.com/api
```

## 4. Authentication

ChatBot sẽ tự động lấy token từ `localStorage.getItem('token')`.

Đảm bảo token được lưu sau khi login:

```javascript
// Sau khi login thành công
localStorage.setItem('token', jwtToken);
```

## 5. Backend Setup

Các endpoint được sử dụng bởi widget:

### Upload ảnh + Sinh suggested questions
```
POST /api/chatbot/analyze-image
Headers: Authorization: Bearer {token}
Body: FormData (file: image)
```

### Hỏi bất kì (text)
```
POST /api/chatbot/ask-anything
Headers: Authorization: Bearer {token}, Content-Type: application/json
Body: { "question": "..." }
```

**Phản hồi đều chứa:**
- `response` - Trả lời từ bot
- `suggested_questions` - 3-4 câu hỏi gợi ý tiếp theo
- `regulations` - Danh sách quy định liên quan (nếu có)
- `activities` - Danh sách hoạt động (nếu có)

## 6. Features

✅ **Floating Button** - Góc dưới phải, có thể toggle mở/đóng

✅ **Image Upload** - Gửi ảnh từ máy tính (hỗ trợ JPEG, PNG, GIF, WebP)

✅ **Suggested Questions** - Gợi ý 3-4 câu hỏi dựa vào nội dung ảnh/trả lời

✅ **Smart Routing** - Tự động nhận diện loại câu hỏi:
- Hoạt động → Lấy danh sách hoạt động
- Điểm/PVCD → Lấy thông tin điểm danh
- Thông tin lớp/khoa → Lấy info sinh viên
- Quy định → Tìm quy định liên quan

✅ **Message History** - Lưu lịch chat trong UI

✅ **Typing Indicator** - Hiển thị "đang gõ..." khi chờ response

✅ **Responsive** - Tự động responsive trên mobile

## 7. Customization

### Đổi màu sắc

Mở `ChatBot.css` và đổi các gradient colors:

```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

Thay đổi `#667eea` (xanh) và `#764ba2` (tím) thành màu bạn muốn.

### Đổi kích thước window

```css
.chatbot-window {
  width: 420px;    /* Thay đổi độ rộng */
  height: 600px;   /* Thay đổi chiều cao */
}
```

### Đổi vị trí button

```css
.chatbot-container {
  bottom: 20px;    /* Khoảng cách từ dưới */
  right: 20px;     /* Khoảng cách từ phải */
}
```

## 8. Troubleshooting

### Token không được gửi
- Kiểm tra `localStorage.getItem('token')` có giá trị không
- Kiểm tra token có hợp lệ không (chưa hết hạn)

### CORS error
- Backend cần có CORS allow frontend domain

### Image upload không hoạt động
- Kiểm tra backend `multer` middleware
- Kiểm tra `public/uploads/` folder tồn tại
- Kiểm tra file size < 5MB

### Suggested questions không hiển thị
- Kiểm tra backend đã trả về `suggested_questions` field
- Kiểm tra image_url có public accessible không

## 9. Production Deployment

### Frontend (React)
```bash
npm run build
# Deploy build/ folder
```

### Backend
- Cập nhật `REACT_APP_API_URL` để point tới production API
- Ensure `/uploads` folder writable trên server
- Ensure Google Cloud Vision API credentials configured

---

**Status**: ✅ Ready to use

**Last Updated**: 2025
