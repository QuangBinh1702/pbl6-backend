# 🧪 Kế Hoạch Testing Chi Tiết - Phase 1 Chatbot

**Ngày**: 15/12/2025  
**Status**: ✅ Ready to Execute  
**Time**: 30-45 phút

---

## 📋 Test Cases Chi Tiết

### TEST 1️⃣: Setup & Connection ✅
**Mục đích**: Xác nhận backend, frontend, database hoạt động

```
STEP 1: Verify Backend Running
  curl -s http://localhost:5000/api/health
  Expected: { "status": "ok" }
  
STEP 2: Login & Get Token
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"password123"}'
  
  Copy token from response.data.token
  Save to: TEST_TOKEN (use in all requests)
  
STEP 3: Verify Frontend Loads
  Open http://localhost:3000 in browser
  Expected: Login form appears
  
STEP 4: Paste Token & Login
  In browser input, paste token
  Click "➤ Đăng nhập"
  Expected: See chat interface
```

---

### TEST 2️⃣: Seed Test Rules to Database
**Mục đích**: Thêm dữ liệu test để chatbot trả lời được

```bash
# Run these curl commands to create sample rules:

export TOKEN="your_token_here"

# Rule 1: Hoạt động sắp tới
curl -X POST http://localhost:5000/api/chatbot/rules \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pattern": "hoạt động sắp tới",
    "keywords": ["hoạt động", "sắp tới", "tới"],
    "responseTemplate": "Các hoạt động sắp tới bao gồm: 1) Tập huấn kỹ năng lãnh đạo (15/12), 2) Hội thảo startup (20/12), 3) Gala bế mạc năm (25/12)",
    "priority": 8,
    "type": "faq"
  }'

# Rule 2: Giờ đăng ký
curl -X POST http://localhost:5000/api/chatbot/rules \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pattern": "giờ đăng ký hoạt động",
    "keywords": ["giờ", "đăng ký", "mở"],
    "responseTemplate": "Thời gian đăng ký hoạt động: Từ 8:00 AM - 5:00 PM hàng ngày, có thể đăng ký qua website hoặc tại quầy tiếp nhận",
    "priority": 8,
    "type": "faq"
  }'

# Rule 3: Địa điểm
curl -X POST http://localhost:5000/api/chatbot/rules \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pattern": "địa điểm diễn ra hoạt động",
    "keywords": ["địa điểm", "nơi", "tại"],
    "responseTemplate": "Các hoạt động chủ yếu diễn ra tại: Nhà hát A (400 chỗ), Phòng hội họp B (100 chỗ), Sân vận động C",
    "priority": 7,
    "type": "faq"
  }'

# Rule 4: Yêu cầu tham gia
curl -X POST http://localhost:5000/api/chatbot/rules \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pattern": "yêu cầu tham gia hoạt động",
    "keywords": ["yêu cầu", "điều kiện", "cần"],
    "responseTemplate": "Yêu cầu tham gia: Là sinh viên đang học, có hộp công dân, hoạt động tích cực, không vi phạm kỷ luật",
    "priority": 8,
    "type": "faq"
  }'

# Rule 5: Đăng ký qua web
curl -X POST http://localhost:5000/api/chatbot/rules \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pattern": "cách đăng ký hoạt động qua web",
    "keywords": ["đăng ký", "web", "cách"],
    "responseTemplate": "Cách đăng ký: 1) Đăng nhập tài khoản, 2) Vào mục 'Hoạt động', 3) Click 'Đăng ký' trên hoạt động muốn tham gia, 4) Xác nhận thông tin và gửi",
    "priority": 9,
    "type": "faq"
  }'

# Rule 6: Hỗ trợ
curl -X POST http://localhost:5000/api/chatbot/rules \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pattern": "liên hệ hỗ trợ",
    "keywords": ["liên hệ", "hỗ trợ", "gọi", "email"],
    "responseTemplate": "Liên hệ hỗ trợ: ☎️ 0123-456-789 (8:00-17:00 hàng ngày), 📧 support@university.edu.vn, 📍 Phòng 101, Tòa A",
    "priority": 7,
    "type": "faq"
  }'
```

**Expected**: Mỗi request trả về 201 Created với rule ID

---

### TEST 3️⃣: Basic Chat - Hỏi Câu Hỏi
**Mục đích**: Verify basic Q&A flow

```
FRONTEND TEST:
  1. Chat interface đã hiển thị
  2. Type: "Hoạt động sắp tới là gì?"
  3. Click send (➤)
  
  ✅ PASS if:
     - Câu hỏi hiển thị bên trái (user message)
     - Bot trả lời hiển thị bên phải
     - Thấy badge "RULE 95%" (source + confidence)
     - Input field được clear
     
  ❌ FAIL if:
     - Hiện "Xin lỗi, tôi không tìm thấy..."
     - Có error message
     - Input không clear

BACKEND TEST (curl):
  curl -X POST http://localhost:5000/api/chatbot/ask-anything \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"question":"Giờ đăng ký hoạt động là mấy giờ?"}'
    
  ✅ PASS if response:
  {
    "success": true,
    "data": {
      "answer": "Thời gian đăng ký hoạt động...",
      "source": "rule",
      "confidence": 0.92
    }
  }
```

---

### TEST 4️⃣: Multiple Questions in Sequence
**Mục đích**: Verify chat history accumulates

```
FRONTEND:
  Ask 5 questions:
    Q1: "Hoạt động sắp tới là gì?"
    Q2: "Giờ đăng ký là mấy giờ?"
    Q3: "Địa điểm diễn ra ở đâu?"
    Q4: "Yêu cầu tham gia là gì?"
    Q5: "Cách đăng ký qua web?"
    
  ✅ PASS if:
     - All 5 Q&A pairs display correctly
     - Chat scrolls down automatically
     - Each answer shows confidence score
     - No duplicate messages
```

---

### TEST 5️⃣: Feedback System - Positive Rating (5 Stars)
**Mục đích**: Submit positive feedback

```
FRONTEND:
  1. Ask a question
  2. Receive answer
  3. Click "👍 Phản hồi" button
  4. Rating widget appears
  5. Click ⭐⭐⭐⭐⭐ (5 stars)
  6. Click "✓ Gửi phản hồi"
  
  ✅ PASS if:
     - Widget closes
     - Alert: "✅ Cảm ơn phản hồi của bạn!"
     - Message disappears from feedback
     
  ❌ FAIL if:
     - Widget doesn't appear
     - Stars not clickable
     - Alert doesn't show
     - Widget stays open

BACKEND TEST (curl):
  curl -X POST http://localhost:5000/api/chatbot/feedback \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "messageId": "msg_123",
      "rating": 5,
      "issue": null,
      "suggestion": null,
      "isHelpful": true
    }'
    
  ✅ PASS if: { "success": true, "data": { "_id": "...", "rating": 5 } }
```

---

### TEST 6️⃣: Feedback System - Negative Rating with Issue (2 Stars)
**Mục đích**: Submit feedback with problem report

```
FRONTEND:
  1. Ask question
  2. Click "👍 Phản hồi"
  3. Click ⭐⭐ (2 stars)
  4. Issue dropdown appears (should show 5 options):
     - "Câu trả lời không đầy đủ"
     - "Câu trả lời không rõ ràng"
     - "Câu trả lời không chính xác"
     - "Không liên quan đến câu hỏi"
     - "Khác"
  5. Select: "Câu trả lời không đầy đủ"
  6. Type suggestion: "Cần thêm thông tin về giờ mở cửa"
  7. Click "✓ Gửi phản hồi"
  
  ✅ PASS if:
     - Issue dropdown only shows when rating < 4
     - Can select issue
     - Suggestion textarea shows
     - Feedback submitted
     - Widget closes
     
  ❌ FAIL if:
     - Dropdown doesn't appear
     - Can't select issue
     - Textarea readonly

BACKEND TEST (curl):
  curl -X POST http://localhost:5000/api/chatbot/feedback \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "messageId": "msg_456",
      "rating": 2,
      "issue": "incomplete",
      "suggestion": "Cần thêm thông tin về giờ mở cửa",
      "isHelpful": false
    }'
```

---

### TEST 7️⃣: Chat History Modal
**Mục đích**: View chat history

```
FRONTEND:
  1. Ask 3+ questions
  2. Click "📜" button (bottom right)
  3. Modal appears with title "Lịch sử chat"
  4. Should see:
     - Previous questions
     - Answers
     - Timestamp (e.g., "2 phút trước")
     - Source badge (RULE/RAG)
     - Confidence score
  
  ✅ PASS if:
     - Modal opens
     - Shows all Q&A pairs
     - Pagination shows (if > 20 items)
     - Close button works
     - Correct timestamps
     
BACKEND TEST:
  curl -X GET "http://localhost:5000/api/chatbot/history?limit=10&page=1" \
    -H "Authorization: Bearer $TOKEN"
    
  ✅ PASS if returns:
  {
    "success": true,
    "data": [
      {
        "query": "...",
        "answer": "...",
        "source": "rule",
        "timestamp": "2024-12-15T..."
      }
    ],
    "pagination": {
      "total": X,
      "page": 1,
      "limit": 10,
      "pages": Y
    }
  }
```

---

### TEST 8️⃣: Error Handling - Empty Question
**Mục đích**: Verify input validation

```
FRONTEND:
  1. Click send without typing
  
  ✅ PASS if: Show error "Vui lòng nhập câu hỏi"
  
  2. Type only spaces, click send
  
  ✅ PASS if: Same error
```

---

### TEST 9️⃣: Error Handling - Network Error
**Mục đích**: Verify error gracefully handled

```
FRONTEND:
  1. Stop backend (Ctrl+C on backend terminal)
  2. Try asking a question
  
  ✅ PASS if:
     - Show loading spinner briefly
     - Show error: "Không thể kết nối đến server"
     - Chat still usable after
     - Can retry after restarting backend
```

---

### TEST 🔟: Error Handling - Token Expiration
**Mục đích**: Verify 401 handling

```
FRONTEND:
  1. Login normally
  2. Go to browser DevTools → Application → LocalStorage
  3. Edit token: Remove last 10 characters (corrupt it)
  4. Try asking question
  
  ✅ PASS if:
     - Show error or redirect to login
     - Page redirects to login form automatically
     - Need to login again
```

---

### TEST 1️⃣1️⃣: UI/UX - Responsive Design
**Mục đích**: Mobile compatibility

```
DESKTOP (1920x1080):
  ✅ Chat takes full width
  ✅ Buttons clearly visible
  ✅ No text cutoff
  
TABLET (768x1024):
  ✅ Chat displays properly
  ✅ Input field accessible
  ✅ History modal fits
  
MOBILE (375x667):
  ✅ Chat interface readable
  ✅ Keyboard doesn't cover input
  ✅ Buttons tap-friendly (44px+)
```

---

### TEST 1️⃣2️⃣: Image Upload (IMAGE FEATURE)
**Mục đích**: Test image analysis

```
FRONTEND:
  1. See "📷 Tải ảnh lên" button
  2. Click to open file picker
  3. Select image file (PNG/JPG)
  4. Image preview appears
  5. Click "Gửi ảnh"
  
  ✅ PASS if:
     - Image displays in chat
     - User message shows "📷 [Image]"
     - Bot analyzes and responds
     - Shows confidence and source
```

---

## 📊 Test Execution Checklist

```markdown
# Test Execution Results - [Date]

## Phase 1: Setup
- [ ] Backend running (http://localhost:5000)
- [ ] Frontend running (http://localhost:3000)
- [ ] Token obtained
- [ ] Login successful

## Phase 2: Rules Seeding
- [ ] Rule 1 (hoạt động sắp tới) - Created ✅
- [ ] Rule 2 (giờ đăng ký) - Created ✅
- [ ] Rule 3 (địa điểm) - Created ✅
- [ ] Rule 4 (yêu cầu) - Created ✅
- [ ] Rule 5 (cách đăng ký) - Created ✅
- [ ] Rule 6 (liên hệ) - Created ✅

## Phase 3: Functional Tests
- [ ] TEST 3: Basic Chat - PASS ✅ / FAIL ❌
- [ ] TEST 4: Multiple Questions - PASS ✅ / FAIL ❌
- [ ] TEST 5: Positive Feedback - PASS ✅ / FAIL ❌
- [ ] TEST 6: Negative Feedback - PASS ✅ / FAIL ❌
- [ ] TEST 7: Chat History - PASS ✅ / FAIL ❌
- [ ] TEST 8: Empty Input - PASS ✅ / FAIL ❌
- [ ] TEST 9: Network Error - PASS ✅ / FAIL ❌
- [ ] TEST 10: Token Expiration - PASS ✅ / FAIL ❌
- [ ] TEST 11: Responsive Design - PASS ✅ / FAIL ❌
- [ ] TEST 12: Image Upload - PASS ✅ / FAIL ❌

## Issues Found
1. ...
2. ...

## Performance
- API Response Time: ___ms (goal: <500ms)
- Frontend Load Time: ___ms
- Memory Usage: ___MB

## Sign-off
- Tested By: ___________
- Date: ___________
- Status: ✅ READY FOR PRODUCTION / ❌ NEEDS FIXES
```

---

## 🚀 Quick Test Commands

All in one terminal session:

```bash
# Terminal 1: Start backend (already running at :5000)
# (skip if already running)

# Terminal 2: Get token
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' | jq -r '.data.token')

echo "Token: $TOKEN"

# Seed rules (one by one, copy-paste each)
# Use $TOKEN in place of Bearer token

# Terminal 3: Start frontend
cd d:\pbl6\frontend && npm start

# Browser: http://localhost:3000
# Paste token and login
```

---

**Version**: 1.0  
**Created**: December 15, 2025  
**Status**: ✅ Ready to Execute
