# Chatbot Quy Định - Trạng Thái Thực Hiện 
Use the oracle as much as possible

## ✅ Đã Hoàn Thành

### Phase 1: Setup & Dependencies
- [x] Cài đặt package `@google-cloud/vision`
- [x] Tạo file config: `/backend/src/config/google-vision.js`
- [x] Cập nhật `.env` với `GOOGLE_CREDENTIALS_PATH`
- [x] Upload Google Cloud credentials JSON

### Phase 2: Database Models
- [x] Tạo `Regulation` model (`/backend/src/models/regulation.model.js`)
  - Fields: title, description, category, keywords, image_urls, timestamps
  - Index: category, keywords, fulltext search
  
- [x] Tạo `ChatHistory` model (`/backend/src/models/chat_history.model.js`) - **EXPANDED**
  - OLD Fields: user_id, question, extracted_text, response, related_regulation_ids, query_type
  - NEW Fields: image_type, suggested_questions, query_context, user_feedback, related_activity_ids
  - Index: user_id + timestamp, query_type, user_feedback

### Phase 3: Backend Logic - **ORIGINAL** ✅
- [x] Tạo `chatbot.controller.js` (`/backend/src/controllers/chatbot.controller.js`)
  - `extractTextFromImage()` - Trích text từ ảnh (Google Vision)
  - `findRelatedRegulations()` - Tìm quy định liên quan
  - `createResponse()` - Format response
  - `analyzeImageAndRespond()` - API xử lý ảnh
  - `answerQuestion()` - API hỏi text
  - `getChatHistory()` - API lấy lịch
  - `getRegulations()` - API danh sách quy định

- [x] Tạo routes: `/backend/src/routes/chatbot.route.js`
  - `POST /api/chatbot/analyze-image` - Gửi ảnh
  - `POST /api/chatbot/ask` - Hỏi câu hỏi
  - `GET /api/chatbot/history` - Lịch chat
  - `GET /api/chatbot/regulations` - Danh sách quy định

- [x] Đăng ký route trong `/backend/src/app.js`

### Phase 3.5: Backend Logic - **ENHANCED** ✨ (NEW)
- [x] Tạo `chatbot.enhanced.controller.js` (`/backend/src/controllers/chatbot.enhanced.controller.js`)
  - `analyzeImageAndGetSuggestions()` - Upload ảnh → trích text + sinh suggested questions
  - `detectImageType()` - Phát hiện loại ảnh (document, poster, screenshot, photo)
  - `generateSuggestedQuestions()` - Sinh 3-4 câu hỏi gợi ý dựa vào nội dung + user context
  - `askAnything()` - Smart routing theo loại câu hỏi:
    - Activities → Trả về danh sách hoạt động sắp tới
    - Attendance/Points → Trả về điểm PVCD của user
    - Student Info → Trả về thông tin lớp/khoa/profile
    - Default → Tìm quy định liên quan
  - `getMyActivities()` - Lấy hoạt động của user
  - `getMyAttendance()` - Lấy điểm danh & PVCD của user
  - `getMyInfo()` - Lấy thông tin sinh viên (lớp, khoa, profile)
  - `getChatHistory()` - Lấy lịch chat
  - `submitFeedback()` - Người dùng feedback helpful/not helpful

- [x] Tạo routes: `/backend/src/routes/chatbot.enhanced.route.js`
  - `POST /api/chatbot/analyze-image` - Upload ảnh + sinh suggested questions
  - `POST /api/chatbot/ask-anything` - Hỏi bất kì (smart routing)
  - `GET /api/chatbot/my-activities` - Hoạt động của user
  - `GET /api/chatbot/my-attendance` - Điểm danh & PVCD của user
  - `GET /api/chatbot/my-info` - Thông tin sinh viên
  - `GET /api/chatbot/history` - Lịch chat
  - `POST /api/chatbot/feedback` - Submit feedback

- [x] Đăng ký route trong `/backend/src/app.js`

### Phase 4: Seed Data
- [x] Tạo `seed_regulations.js` - Script thêm dữ liệu
- [x] Chạy seed script - Thêm 7 quy định vào database:
  1. Quy định điểm danh
  2. Quy định nộp báo cáo
  3. Quy định hành vi
  4. Quy định tính điểm
  5. Quy định hoạt động bắt buộc
  6. Quy định xin phép
  7. Quy định chứng chỉ

### Phase 5: Frontend Widget - **NEW** ✨
- [x] Tạo React Chatbot Component (`/frontend/src/components/ChatBot/ChatBot.jsx`)
  - Floating button góc dưới phải
  - Minimizable/toggleable chat window
  - Message display (user + bot)
  - File upload support (image)
  - Suggested questions display
  - Typing indicator
  - Responsive design
  
- [x] Tạo CSS styling (`/frontend/src/components/ChatBot/ChatBot.css`)
  - Gradient header (xanh-tím)
  - Message bubbles (user/bot)
  - Suggested questions buttons
  - Regulations/activities lists
  - Input controls (text + file)
  - Mobile responsive
  
- [x] Tạo index file (`/frontend/src/components/ChatBot/index.js`)
- [x] Tạo integration guide (`/frontend/CHATBOT_INTEGRATION.md`)

### Phase 6: File Upload System
- [x] Multer middleware setup (`/backend/src/middlewares/upload.middleware.js`)
  - Local disk storage: `/public/uploads/`
  - Support JPEG, PNG, GIF, WebP
  - Max 5MB file size
  - Auto filename generation
  
- [x] Backend convert uploaded file → URL
  - Format: `http://localhost:5000/uploads/{filename}`

---

## 📋 Chưa Hoàn Thành

### Phase 7: Testing
- [ ] Test API `/api/chatbot/analyze-image` (upload ảnh + suggested questions)
- [ ] Test API `/api/chatbot/ask-anything` (smart routing)
- [ ] Test API `/api/chatbot/my-activities` (hoạt động của user)
- [ ] Test API `/api/chatbot/my-attendance` (điểm danh & PVCD)
- [ ] Test API `/api/chatbot/my-info` (thông tin sinh viên)
- [ ] Test API `/api/chatbot/history` (lịch chat)
- [ ] Test API `/api/chatbot/feedback` (user feedback)
- [ ] Test Frontend Widget - tất cả features
- [ ] Test file upload từ máy tính
- [ ] Test suggested questions generation

### Phase 8: Frontend Integration (Nếu cần)
- [ ] Import ChatBot component vào App.js hoặc Layout
- [ ] Cập nhật `REACT_APP_API_URL` environment variable
- [ ] Test integration với existing auth system
- [ ] Verify localStorage token được gửi

### Phase 9: Deployment
- [ ] Cập nhật credentials trên production
- [ ] Test trên production environment
- [ ] Setup `/public/uploads` folder trên server
- [ ] Verify CORS settings cho frontend domain

---

## 🔧 Hướng Dẫn Sử Dụng

### Start Backend Server
```bash
cd /d:/pbl6/backend
npm run dev
```

### Test API (Postman / cURL)

**1. Upload ảnh + Sinh suggested questions:**
```
POST http://localhost:5000/api/chatbot/analyze-image
Headers: Authorization: Bearer <token>
Body: FormData
  - image: <select file from computer>

Response:
{
  "success": true,
  "data": {
    "extracted_text": "...",
    "image_type": "document|poster|screenshot|photo",
    "suggested_questions": ["Câu hỏi 1?", "Câu hỏi 2?", ...]
  }
}
```

**2. Hỏi bất kì (Smart Routing):**
```
POST http://localhost:5000/api/chatbot/ask-anything
Headers: Authorization: Bearer <token>
Body: { "question": "hoạt động sắp tới là gì?" }

Response:
{
  "success": true,
  "data": {
    "response": "...",
    "query_type": "activity|attendance|info|text",
    "suggested_questions": [...],
    "activities": [...],
    "regulations": [...]
  }
}
```

**3. Lấy hoạt động của user:**
```
GET http://localhost:5000/api/chatbot/my-activities?limit=10&page=1
Headers: Authorization: Bearer <token>
```

**4. Lấy điểm danh & PVCD:**
```
GET http://localhost:5000/api/chatbot/my-attendance
Headers: Authorization: Bearer <token>
```

**5. Lấy thông tin sinh viên:**
```
GET http://localhost:5000/api/chatbot/my-info
Headers: Authorization: Bearer <token>
```

**6. Lấy lịch chat:**
```
GET http://localhost:5000/api/chatbot/history?limit=20&page=1
Headers: Authorization: Bearer <token>
```

**7. Submit feedback:**
```
POST http://localhost:5000/api/chatbot/feedback
Headers: Authorization: Bearer <token>
Body: {
  "chat_id": "...",
  "feedback": "helpful|not_helpful|partially_helpful",
  "comment": "optional feedback text"
}
```

### Integrate Widget vào Frontend

Xem file: `/frontend/CHATBOT_INTEGRATION.md`

Cách nhanh:
1. Copy ChatBot component folder
2. Import vào App.js: `import ChatBot from './components/ChatBot';`
3. Thêm `<ChatBot />` vào component
4. Setup `.env` với `REACT_APP_API_URL`
5. Done!

---

## 📝 Ghi Chú

### Backend
- **Google Vision API**: Yêu cầu image URL công khai hoặc local file upload (đã support)
- **Auth**: Tất cả endpoint `/api/chatbot/*` cần JWT token
- **Database**: 
  - Collection `regulation` có 7 quy định mẫu
  - Collection `chat_history` expand với fields mới
- **File Storage**: Upload files lưu vào `/backend/public/uploads/`
- **Smart Routing**: 
  - Nếu câu hỏi chứa "hoạt động" → query Activity collection
  - Nếu chứa "điểm/pvcd" → query Attendance + PvcdRecord
  - Nếu chứa "lớp/khoa" → query StudentProfile + Class
  - Otherwise → query Regulation

### Frontend Widget
- **Floating Button**: Góc dưới phải, có gradient background
- **Responsive**: Auto adjust trên mobile
- **Token**: Tự động lấy từ `localStorage.getItem('token')`
- **Environment**: Cần set `REACT_APP_API_URL` trong `.env`

### Cách Hoạt Động End-to-End
1. User nhấn 💬 button ở góc phải
2. User nhập câu hỏi hoặc upload ảnh
3. Frontend gửi request tới backend
4. Backend (smart routing):
   - Trích text từ ảnh (nếu có) → Google Vision
   - Nhận diện intent (activity/attendance/info/regulation)
   - Query DB tương ứng
   - Sinh 3-4 suggested questions
5. Frontend hiển thị response + suggested questions
6. User click suggested question → repeat từ bước 2
7. Chat history tự động lưu vào DB

---

## 🚀 Tiếp Theo

**Bước kế tiếp**: 
1. ✅ Test các API endpoint từ Postman
2. ✅ Integrate ChatBot component vào frontend
3. ✅ Test widget trên browser
4. ⚠️ Fine-tune suggested questions logic (nếu cần)
5. ⚠️ Add analytics/metrics (optional)
6. ⚠️ Deploy lên production

**Có vấn đề gì?** Kiểm tra:
- Token có hợp lệ không
- Backend server chạy bình thường không
- CORS settings có allow frontend domain không
- `/public/uploads` folder có tồn tại không
- Google Vision API credentials có valid không

---

**Status**: 🟢 Ready for Testing

**Last Updated**: 2025-11-26
