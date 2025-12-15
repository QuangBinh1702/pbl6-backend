# 🧪 Frontend Testing Guide - Phase 1 Chatbot

**Phiên bản**: 1.0  
**Ngày**: 15/12/2025  
**Status**: ✅ Ready to Test

---

## 📚 Nội Dung

1. [Setup](#setup)
2. [Tạo JWT Token cho Testing](#tạo-jwt-token)
3. [Chạy Frontend](#chạy-frontend)
4. [Test Cases](#test-cases)
5. [Debugging](#debugging)
6. [API Testing Tools](#api-testing-tools)

---

## Setup

### Prerequisites
- Node.js 14+ đã cài
- Backend running tại `http://localhost:3001`
- MongoDB running

### Bước 1: Cài Dependencies

```bash
cd frontend
npm install
```

### Bước 2: Cấu hình .env

File `.env` đã được tạo sẵn:
```
REACT_APP_API_BASE_URL=http://localhost:3001/api
```

### Bước 3: Start Backend

```bash
cd backend
npm run dev
# Server should run at http://localhost:3001
```

---

## Tạo JWT Token cho Testing

### Option 1: Thông qua Login API

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... }
  }
}
```

### Option 2: Tạo Token Mock (để development)

Nếu chưa có auth service, tạo token với payload:
```javascript
// Using an online JWT debugger: https://jwt.io
// Payload:
{
  "userId": "user123",
  "email": "user@example.com",
  "role": "student",
  "iat": 1702641600,
  "exp": 1702728000  // 24 hours later
}

// Secret: your_jwt_secret (phải match backend)
// Encoded Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Option 3: Sử dụng Backend Route

Backend nên có endpoint tạo test token:
```bash
curl -X POST http://localhost:3001/api/test/create-token \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_1",
    "role": "student"
  }'
```

---

## Chạy Frontend

### Terminal 1: Start Development Server

```bash
cd frontend
npm start
```

Output:
```
Compiled successfully!

You can now view pbl6-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000

Note that the development build is not optimized.
```

### Truy cập ứng dụng

1. Mở browser: `http://localhost:3000`
2. Bạn sẽ thấy login screen
3. Dán JWT token vào input field
4. Click "Đăng nhập"

---

## Test Cases

### Test 1: Basic Chat - Hỏi Câu Hỏi

**Kịch bản**:
1. Đăng nhập bằng token
2. Nhập câu hỏi: "Hoạt động sắp tới là gì?"
3. Nhấn gửi
4. Xem response

**Expected Result**:
✅ Thấy câu trả lời từ Rule Engine
✅ Hiển thị source (rule/rag/llm)
✅ Hiển thị confidence score
✅ Input field được clear

**Console Checks**:
```javascript
// Mở DevTools (F12)
// Console tab
// Kiểm tra:
// ✅ Không có error messages
// ✅ Request thành công (status 200)
// ✅ Response có structure: {success: true, data: {...}}
```

---

### Test 2: Feedback Widget - Gửi Phản Hồi

**Kịch bản**:
1. Nhập câu hỏi và nhận câu trả lời
2. Click "👍 Phản hồi"
3. Chọn 5 sao (⭐⭐⭐⭐⭐)
4. Click "Gửi phản hồi"

**Expected Result**:
✅ Feedback widget hiển thị
✅ Rating stars có thể click
✅ Alert "Cảm ơn phản hồi của bạn!"
✅ Widget biến mất sau submit

**Database Check** (MongoDB):
```javascript
// Terminal, connect to MongoDB:
mongo
use pbl6
db.feedback.find().pretty()
// Kiểm tra: phải có record với rating: 5
```

---

### Test 3: Feedback with Issue - Phản Hồi Có Vấn Đề

**Kịch bản**:
1. Hỏi một câu hỏi
2. Click "👍 Phản hồi"
3. Chọn 2 sao
4. Chọn issue: "Câu trả lời không đầy đủ"
5. Nhập gợi ý: "Thêm thông tin về giờ"
6. Submit

**Expected Result**:
✅ Issue dropdown xuất hiện khi rating < 4
✅ Có thể chọn issue type
✅ Suggestion textarea hoạt động
✅ Feedback được submit thành công

**API Call** (DevTools Network tab):
```
POST /chatbot/feedback
Request Body:
{
  messageId: "msg_123",
  rating: 2,
  issue: "incomplete",
  suggestion: "Thêm thông tin về giờ",
  isHelpful: false
}

Response:
{
  success: true,
  data: { _id: "feedback_123", ... }
}
```

---

### Test 4: Chat History - Xem Lịch Sử

**Kịch bản**:
1. Hỏi 3-4 câu hỏi
2. Click "📜" button (bottom right)
3. Xem danh sách lịch sử chat
4. Kiểm tra phân trang (nếu có)

**Expected Result**:
✅ Modal hiển thị
✅ Liệt kê tất cả câu hỏi + câu trả lời
✅ Hiển thị timestamp
✅ Hiển thị source
✅ Close button hoạt động

**API Call** (DevTools Network):
```
GET /chatbot/history?limit=20&page=1

Response:
{
  success: true,
  data: [
    {
      _id: "msg_1",
      question: "...",
      answer: "...",
      source: "rule",
      timestamp: "2025-12-15T10:00:00Z"
    }
  ],
  pagination: {
    total: 5,
    page: 1,
    limit: 20,
    pages: 1
  }
}
```

---

### Test 5: Error Handling - Xử Lý Lỗi

#### 5a: Invalid Question
**Kịch bản**:
1. Nhập chỉ khoảng trắng
2. Click Send

**Expected Result**:
❌ Alert: "Vui lòng nhập câu hỏi"
❌ Không gửi request

#### 5b: Server Error
**Kịch bản**:
1. Stop backend server
2. Hỏi câu hỏi
3. Xem error

**Expected Result**:
❌ Hiển thị error message: "Lỗi kết nối đến server"
❌ Không crash app
❌ Có thể retry

#### 5c: 401 Unauthorized
**Kịch bản**:
1. Dùng token hết hạn
2. Hỏi câu hỏi

**Expected Result**:
❌ Redirected to login
❌ Token bị xóa từ localStorage
❌ Có thể đăng nhập lại

---

### Test 6: UI/UX - Giao Diện

#### Loading States
- ✅ Loading spinner khi đang gửi request
- ✅ Input disabled khi loading
- ✅ Send button disabled khi loading

#### Message Display
- ✅ User messages căn phải, màu xanh
- ✅ Bot messages căn trái, màu trắng
- ✅ Messages auto-scroll to bottom
- ✅ Emojis hiển thị đúng

#### Responsive Design
- ✅ Mobile size (320px): Responsive
- ✅ Tablet size (768px): Responsive
- ✅ Desktop size (1024px): Responsive

---

## Debugging

### Console Errors Check

Open DevTools (F12) → Console tab

**Expected**: Không có errors
**If error**:
```javascript
// Check 1: API connection
fetch('http://localhost:3001/api/health')
  .then(r => r.json())
  .then(d => console.log(d))

// Check 2: Token validity
const token = localStorage.getItem('token');
console.log('Token:', token);

// Check 3: API client setup
import apiClient from './services/api';
apiClient.get('/chatbot/history')
  .then(r => console.log(r.data))
  .catch(e => console.error(e))
```

### Network Tab

DevTools → Network tab

**Check cada API call**:
- ✅ Status code 200/201
- ✅ Response JSON is valid
- ✅ Authorization header present: `Bearer {token}`
- ✅ Request body correct

### Redux DevTools (nếu dùng Redux)

Chưa implement, skip for now.

### React DevTools

DevTools → Components tab

**Check component state**:
- ✅ `messages` array has correct structure
- ✅ `loading` boolean correct
- ✅ `error` message if any

---

## API Testing Tools

### Option 1: Postman

**Setup**:
1. Download Postman: https://www.postman.com/downloads/
2. Create new Collection: "PBL6 Chatbot"
3. Add requests:

#### Request 1: Ask Question

```
Method: POST
URL: http://localhost:3001/api/chatbot/ask-anything
Headers:
  Authorization: Bearer {your_token}
  Content-Type: application/json

Body (JSON):
{
  "question": "Hoạt động sắp tới là gì?"
}
```

Click Send → Check response

#### Request 2: Get History

```
Method: GET
URL: http://localhost:3001/api/chatbot/history?limit=20&page=1
Headers:
  Authorization: Bearer {your_token}
```

#### Request 3: Submit Feedback

```
Method: POST
URL: http://localhost:3001/api/chatbot/feedback
Headers:
  Authorization: Bearer {your_token}
  Content-Type: application/json

Body:
{
  "messageId": "msg_from_ask_response",
  "rating": 5,
  "issue": null,
  "suggestion": null,
  "isHelpful": true
}
```

---

### Option 2: curl Command Line

```bash
# 1. Ask Question
curl -X POST http://localhost:3001/api/chatbot/ask-anything \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"question":"Hoạt động sắp tới là gì?"}'

# 2. Get History
curl -X GET "http://localhost:3001/api/chatbot/history?limit=20&page=1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 3. Submit Feedback
curl -X POST http://localhost:3001/api/chatbot/feedback \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "messageId":"msg_123",
    "rating":5,
    "issue":null,
    "suggestion":null,
    "isHelpful":true
  }'
```

---

### Option 3: Thunder Client (VS Code Extension)

1. Install extension: "Thunder Client"
2. Create new request
3. Copy requests từ Postman

---

## Component Test Coverage

### ChatInterface.jsx ✅
- ✅ Send question
- ✅ Display message (user/bot)
- ✅ Loading state
- ✅ Error message
- ✅ Clear chat
- ✅ Show feedback button
- ✅ Auto scroll

### FeedbackWidget.jsx ✅
- ✅ Rate 1-5 stars
- ✅ Show issue dropdown (rating < 4)
- ✅ Suggestion textarea
- ✅ Submit feedback
- ✅ Close widget
- ✅ Error handling

### ChatHistory.jsx ✅
- ✅ Open/close modal
- ✅ Load history
- ✅ Display pagination
- ✅ Navigate pages
- ✅ Loading state
- ✅ Error state

### Hooks Tests ✅
- ✅ `useChat()` - askQuestion, getChatHistory
- ✅ `useFeedback()` - submitFeedback

---

## Troubleshooting

### "CORS Error"
**Solution**: Backend CORS config
```javascript
// backend/index.js
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

### "401 Unauthorized"
**Solution**:
1. Check token expiration: `jwt.io`
2. Check backend JWT_SECRET matches
3. Re-login with valid token

### "Cannot GET /api/chatbot/..."
**Solution**:
1. Backend routes not defined
2. Check `backend/src/routes/` files
3. Check server is running on port 3001

### "Empty responses"
**Solution**:
1. Check Rules in database
2. Check MongoDB connection
3. Check backend logs: `npm run dev` output

---

## Performance Checks

### API Response Time

**Goal**: < 500ms

**Check** (DevTools Network):
- POST /ask-anything: typically 200-400ms
- GET /history: typically 100-200ms
- POST /feedback: typically 50-100ms

### Network Requests

**Goal**: Minimal requests

**Current**:
- Per question: 1 POST (ask-anything)
- Per feedback: 1 POST (feedback)
- History load: 1 GET (history)

### Memory Usage

**Goal**: < 100MB

**Check** (DevTools → Memory):
- Record heap snapshot
- Check component unmounting
- Check no memory leaks

---

## Test Results Template

```markdown
# Test Results - [Date]

## Setup
- [ ] Backend running: http://localhost:3001
- [ ] Frontend running: http://localhost:3000
- [ ] Token valid and set
- [ ] MongoDB connected

## Test Cases
- [ ] Test 1: Basic Chat - PASS/FAIL
- [ ] Test 2: Feedback Widget - PASS/FAIL
- [ ] Test 3: Feedback with Issue - PASS/FAIL
- [ ] Test 4: Chat History - PASS/FAIL
- [ ] Test 5a: Invalid Question - PASS/FAIL
- [ ] Test 5b: Server Error - PASS/FAIL
- [ ] Test 5c: 401 Unauthorized - PASS/FAIL
- [ ] Test 6: UI/UX - PASS/FAIL

## Performance
- API response time: ___ms
- Memory usage: ___MB
- Network requests: ___

## Issues Found
1. ...
2. ...

## Notes
...
```

---

## Next Steps

After testing Phase 1:
1. ✅ Frontend UI complete
2. Next: Test Phase 2 (Documents, RAG)
3. Then: Test Phase 3 (Analytics, Advanced)
4. Finally: Test Phase 4 (Optimization)

---

**Created**: December 15, 2025  
**Status**: ✅ Ready to Test
**Version**: 1.0 - Phase 1 UI Complete
