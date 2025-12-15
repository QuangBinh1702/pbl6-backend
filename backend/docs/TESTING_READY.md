# ✅ Chatbot Testing - Tất Cả Sẵn Sàng

**Ngày**: 15/12/2025  
**Status**: 🟢 **READY TO TEST**

---

## 🎯 Tại Sao Chatbot Không Trả Lời?

**Root Cause**: Backend chưa có rules trong database.

### Solution
Backend yêu cầu dữ liệu rules để trả lời. Phải **thêm test rules** bằng API.

---

## 📋 Kế Hoạch Test Chi Tiết

Tất cả test cases đã viết ở: **[TEST_PLAN_COMPLETE.md](./TEST_PLAN_COMPLETE.md)**

### Tóm tắt 12 test:
1. ✅ Setup & Connection
2. ✅ Seed Rules to Database (6 rules)
3. ✅ Basic Chat - Hỏi câu hỏi
4. ✅ Multiple Questions
5. ✅ Positive Feedback (5 sao)
6. ✅ Negative Feedback với Issue
7. ✅ Chat History Modal
8. ✅ Error - Empty Input
9. ✅ Error - Network Down
10. ✅ Error - Token Expiration
11. ✅ UI/UX Responsive
12. ✅ **Image Upload** (NEW!)

---

## 🖼️ Image Upload - Tính Năng Mới

### Thêm vào Frontend:
- **📷 Tải ảnh lên**: Click button để chọn file
- **Ctrl+V dán ảnh**: Copy-paste trực tiếp từ clipboard
- **Preview ảnh**: Xem trước trước khi gửi
- **Hỗ trợ**: PNG, JPG, GIF, WebP (max 5MB)

### Cách dùng:
```
Frontend:
  1. Click 📷 button → chọn ảnh
  2. Hoặc Ctrl+V dán ảnh
  3. Preview hiển thị
  4. Click "✓ Gửi ảnh"
  5. Bot phân tích ảnh
  
File thay đổi:
  ✅ ChatInterface.jsx (thêm image upload logic)
  ✅ ChatInterface.css (thêm preview UI)
```

---

## ⚡ Quick Start - 5 Bước

### Step 1: Start Backend (đã chạy rồi)
```bash
# Terminal 1 (already running)
# Backend at :5000
curl http://localhost:5000/api/health
# Should return: {"status":"ok"}
```

### Step 2: Get Token
```bash
# Terminal 3
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' | jq -r '.data.token'

# Save token to: $TOKEN
export TOKEN="your_token_here"
```

### Step 3: Seed 6 Test Rules
```bash
# Copy-paste each rule creation curl command from TEST_PLAN_COMPLETE.md
# Use $TOKEN in place of Bearer token

# Example (Rule 1):
curl -X POST http://localhost:5000/api/chatbot/rules \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pattern": "hoạt động sắp tới",
    "keywords": ["hoạt động", "sắp tới"],
    "responseTemplate": "Các hoạt động sắp tới...",
    "priority": 8,
    "type": "faq"
  }'
```

### Step 4: Start Frontend
```bash
# Terminal 2
cd d:\pbl6\frontend
npm install  # if first time
npm start
# Browser: http://localhost:3000
```

### Step 5: Test in Browser
```
1. Paste token in login form
2. Click "➤ Đăng nhập"
3. Ask: "Hoạt động sắp tới là gì?"
4. ✅ Should see answer!
5. Test feedback, history, image upload, etc.
```

---

## 📊 Expected Test Results

### After Seeding Rules:
- ✅ Basic Q&A works
- ✅ Confidence score 80%+ (rules are high confidence)
- ✅ Chat history saves
- ✅ Feedback accepts 1-5 stars
- ✅ Issue dropdown shows when rating < 4
- ✅ Image upload accepts PNG/JPG

### Response Format:
```json
{
  "success": true,
  "data": {
    "answer": "Các hoạt động sắp tới...",
    "source": "rule",
    "confidence": 0.95,
    "messageId": "msg_123",
    "responseTime": 45
  }
}
```

---

## 🔧 Debugging

### Problem: Still No Answer?
```bash
# Check if rules were created
curl -X GET "http://localhost:5000/api/chatbot/rules" \
  -H "Authorization: Bearer $TOKEN"
# Should return: { "success": true, "data": [ rules array ] }

# If empty, re-run rule creation
```

### Problem: Token Invalid?
```bash
# Re-get token
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' | jq '.data.token'
```

### Problem: Port Already In Use?
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID {PID} /F
```

---

## 📁 Files Changed

### New Files:
- ✅ `TEST_PLAN_COMPLETE.md` - Chi tiết 12 test cases
- ✅ `TESTING_READY.md` - File này

### Modified Files:
- ✅ `frontend/src/components/ChatInterface.jsx` - Thêm image upload
- ✅ `frontend/src/styles/ChatInterface.css` - Thêm preview UI

### Documentation:
- ✅ `START_FRONTEND_TESTING.md` - Quick start
- ✅ `FRONTEND_TESTING_GUIDE.md` - Detailed testing
- ✅ `API_DOCUMENTATION_COMPLETE_VI.md` - All 31 APIs

---

## ✨ Tính Năng Chatbot Phase 1

### ✅ Đã Có:
- [x] Text-based Q&A
- [x] Rule engine matching
- [x] Chat history with pagination
- [x] Feedback system (1-5 stars)
- [x] Issue categorization
- [x] Responsive UI
- [x] **NEW: Image upload**
- [x] **NEW: Paste image (Ctrl+V)**
- [x] Error handling
- [x] Auto logout on 401

### 🚧 Phase 2+ (Not Yet):
- [ ] Knowledge base documents
- [ ] Semantic search (RAG)
- [ ] Analytics dashboard
- [ ] Image analysis
- [ ] LLM integration

---

## 🎓 Test Workflow

```
1. Read TEST_PLAN_COMPLETE.md
   ↓
2. Start Backend + Frontend + Get Token
   ↓
3. Seed 6 Rules to Database
   ↓
4. Run TEST 1-12:
   - TEST 3: Basic Chat ✅
   - TEST 4: Multiple Q&A ✅
   - TEST 5: Positive Feedback ✅
   - TEST 6: Negative Feedback ✅
   - TEST 7: History ✅
   - TEST 8-11: Error handling ✅
   - TEST 12: Image Upload ✅
   ↓
5. Record Results in TEST_PLAN_COMPLETE.md
   ↓
6. ✨ Ready for Phase 2!
```

---

## 📞 Quick Commands Checklist

```bash
# Copy-paste ready commands:

# 1. Start backend (Terminal 1)
cd d:\pbl6\backend && npm run dev

# 2. Get token (Terminal 3)
export TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' | jq -r '.data.token')

echo $TOKEN

# 3. Seed one rule
curl -X POST http://localhost:5000/api/chatbot/rules \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pattern": "hoạt động sắp tới",
    "keywords": ["hoạt động", "sắp tới"],
    "responseTemplate": "Các hoạt động sắp tới bao gồm...",
    "priority": 8,
    "type": "faq"
  }'

# 4. Start frontend (Terminal 2)
cd d:\pbl6\frontend && npm start

# 5. Test question via curl
curl -X POST http://localhost:5000/api/chatbot/ask-anything \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question":"Hoạt động sắp tới là gì?"}'
```

---

## 🎯 Success Criteria

You're done when:
- ✅ Backend returns answers (not "sorry...")
- ✅ Chat displays user question + bot answer
- ✅ Feedback widget works (1-5 stars)
- ✅ Issue dropdown shows for low ratings
- ✅ Chat history shows all messages
- ✅ Image upload button visible
- ✅ Can paste image with Ctrl+V
- ✅ Image preview shows

---

**Version**: 1.0  
**Status**: ✅ **READY TO TEST NOW**  
**Time to Complete Tests**: 30-45 minutes  
**Difficulty**: ⭐ Easy

🚀 **Start with TEST_PLAN_COMPLETE.md**
