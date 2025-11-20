# Chatbot Quy Định - Trạng Thái Thực Hiện

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
  
- [x] Tạo `ChatHistory` model (`/backend/src/models/chat_history.model.js`)
  - Fields: user_id, question, extracted_text, response, related_regulation_ids, query_type
  - Index: user_id + timestamp

### Phase 3: Backend Logic
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

---

## 📋 Chưa Hoàn Thành

### Phase 5: Testing
- [ ] Test API `/api/chatbot/ask` (hỏi text)
- [ ] Test API `/api/chatbot/analyze-image` (gửi ảnh)
- [ ] Test API `/api/chatbot/history` (lấy lịch)
- [ ] Test API `/api/chatbot/regulations` (danh sách quy định)

### Phase 6: Frontend (Nếu cần)
- [ ] Tạo UI chat simple (React/Vue)
- [ ] Upload ảnh + preview
- [ ] Hiển thị response từ bot
- [ ] Lịch chat cũ

### Phase 7: Deploy
- [ ] Cập nhật credentials trên production
- [ ] Test trên production environment

---

## 🔧 Hướng Dẫn Sử Dụng

### Start Server
```bash
cd /d:/pbl6/backend
npm run dev
```

### Test API (Postman)

**1. Hỏi câu hỏi văn bản:**
```
POST http://localhost:5000/api/chatbot/ask
Headers: Authorization: Bearer <token>
Body: { "question": "quy định về điểm danh như thế nào?" }
```

**2. Gửi ảnh:**
```
POST http://localhost:5000/api/chatbot/analyze-image
Headers: Authorization: Bearer <token>
Body: { "image_url": "https://example.com/image.jpg" }
```

**3. Lấy lịch chat:**
```
GET http://localhost:5000/api/chatbot/history?page=1&limit=20
Headers: Authorization: Bearer <token>
```

**4. Danh sách quy định:**
```
GET http://localhost:5000/api/chatbot/regulations?category=attendance
```

---

## 📝 Ghi Chú

- **Google Vision API**: Yêu cầu image URL công khai (không phải local file)
- **Auth**: Tất cả endpoint `/api/chatbot/*` cần token JWT (trừ GET /regulations)
- **Database**: Collection `regulation` đã có 7 quy định mẫu
- **Cách hoạt động**:
  1. User gửi ảnh/câu hỏi
  2. Backend trích text (nếu là ảnh)
  3. Tìm quy định có keywords trùng
  4. Trả lời + lưu lịch

---

## 🚀 Tiếp Theo

**Bước kế tiếp**: 
1. Test các API endpoint
2. Nếu OK → tạo frontend UI
3. Nếu cần điều chỉnh → update controller/routes

