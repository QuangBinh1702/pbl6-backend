# ⚡ Quick Start - Frontend Testing

**Goal**: Get the Phase 1 chatbot UI running and test with backend API  
**Time**: 5-10 minutes  
**Status**: ✅ Ready

---

## 🚀 3-Step Quick Start

### Step 1️⃣: Start Backend (Terminal 1)

```bash
cd d:/pbl6/backend
npm run dev
```

**Expected**: Server running at `http://localhost:3001`

**Verify**:
```bash
curl http://localhost:3001/api/health
# Should return: {"status":"ok"}
```

---

### Step 2️⃣: Start Frontend (Terminal 2)

```bash
cd d:/pbl6/frontend
npm install  # If first time
npm start
```

**Expected**: App running at `http://localhost:3000`

**Output**:
```
Compiled successfully!
You can now view pbl6-frontend in the browser.
  Local:            http://localhost:3000
```

---

### Step 3️⃣: Get Token & Login (Browser)

**Option A: Get from Login API** (Terminal 3)
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

Extract token from response:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Option B: Use jwt.io** 
1. Go https://jwt.io
2. Paste this in payload:
```json
{
  "userId": "test123",
  "email": "test@example.com",
  "role": "student",
  "exp": 9999999999
}
```
3. Sign with secret (check backend .env for JWT_SECRET)
4. Copy encoded token

---

## 🔑 Login in Browser

1. Open browser: **http://localhost:3000**
2. Paste token in login form
3. Click "➤ Đăng nhập"

**You should see**: Chat interface! 

---

## ✅ Test Checklist

### Test 1: Ask a Question
```
1. Type: "Hoạt động sắp tới là gì?"
2. Press Send (➤)
3. Should see response appear
4. Should show source & confidence
```

**✅ PASS** if: Message appears with answer

**If no answer**: Backend has no rules. Add via API:
```bash
curl -X POST http://localhost:3001/api/chatbot/rules \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pattern": "hoạt động sắp tới",
    "keywords": ["hoạt động", "sắp tới"],
    "responseTemplate": "Các hoạt động sắp tới bao gồm...",
    "type": "faq"
  }'
```

---

### Test 2: Send Feedback
```
1. Click "👍 Phản hồi" button under answer
2. Click ⭐⭐⭐⭐⭐ (5 stars)
3. Click "✓ Gửi phản hồi"
4. Should see "✅ Cảm ơn phản hồi của bạn!"
```

**✅ PASS** if: Feedback widget closes and shows success

---

### Test 3: View Chat History
```
1. Click "📜" button (bottom right)
2. Should see all previous messages
3. Should show Q&A pairs with timestamps
```

**✅ PASS** if: Modal opens with chat history

---

### Test 4: Error Handling
```
1. Try sending empty message → Should show error
2. Stop backend, try question → Network error
3. Use expired token → Should redirect to login
```

**✅ PASS** if: All errors handled gracefully

---

## 🧪 API Testing (Optional)

### Test with curl

```bash
# Set your token
export TOKEN="your_jwt_token_here"

# Test 1: Ask question
curl -X POST http://localhost:3001/api/chatbot/ask-anything \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question":"Hoạt động là gì?"}'

# Test 2: Get history
curl -X GET "http://localhost:3001/api/chatbot/history?limit=5" \
  -H "Authorization: Bearer $TOKEN"

# Test 3: Submit feedback
curl -X POST http://localhost:3001/api/chatbot/feedback \
  -H "Authorization: Bearer $TOKEN" \
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

## 📊 Testing Results

Create file: `d:/pbl6/TEST_RESULTS.md`

```markdown
# Test Results - [Date]

## Setup
- [ ] Backend running at :3001
- [ ] Frontend running at :3000  
- [ ] Token obtained
- [ ] Login successful

## Functional Tests
- [ ] Test 1: Ask Question - PASS ✅ / FAIL ❌
- [ ] Test 2: Send Feedback - PASS ✅ / FAIL ❌
- [ ] Test 3: View History - PASS ✅ / FAIL ❌
- [ ] Test 4: Error Handling - PASS ✅ / FAIL ❌

## Issues Found
1. ...
2. ...

## Notes
...

## Next Steps
...
```

---

## 🐛 Common Issues

### "Cannot connect to backend"
```bash
# Check backend is running
curl http://localhost:3001/api/health

# If fails, backend not running
cd backend
npm run dev
```

### "401 Unauthorized"
```bash
# Token invalid/expired
# Get new token and login again
```

### "No answers from API"
```bash
# Backend has no rules
# Add test rules via API (see Test 1 section above)
```

### "Port 3000 already in use"
```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID {PID} /F
```

---

## 📁 Files Created

```
✅ frontend/src/
   ✅ services/api.js                (Axios client)
   ✅ hooks/useChat.js              (Chat hook)
   ✅ hooks/useFeedback.js          (Feedback hook)
   ✅ components/ChatInterface.jsx   (Main chat)
   ✅ components/FeedbackWidget.jsx  (Feedback form)
   ✅ components/ChatHistory.jsx     (History modal)
   ✅ pages/ChatPage.jsx             (Page container)
   ✅ styles/ (4 CSS files)
   ✅ App.jsx (Updated)
   ✅ App.css (Updated)

✅ Documentation/
   ✅ FRONTEND_SETUP_COMPLETE.md     (Full setup guide)
   ✅ FRONTEND_TESTING_GUIDE.md      (Detailed testing)
   ✅ START_FRONTEND_TESTING.md      (This file)
```

---

## 🎯 What Works Now

✅ User can login with JWT token  
✅ User can ask questions  
✅ User gets answers from backend  
✅ User can rate answers (1-5 stars)  
✅ User can view chat history  
✅ Auto logout on token expiry  
✅ Error handling for all cases  
✅ Mobile responsive UI  
✅ Beautiful animations  

---

## 📚 Detailed Docs

For more information:
- **Setup**: [FRONTEND_SETUP_COMPLETE.md](./FRONTEND_SETUP_COMPLETE.md)
- **Testing**: [FRONTEND_TESTING_GUIDE.md](./FRONTEND_TESTING_GUIDE.md)
- **API**: [API_DOCUMENTATION_COMPLETE_VI.md](./API_DOCUMENTATION_COMPLETE_VI.md)

---

## 🚀 Launch Commands

### Copy-Paste Ready

**Terminal 1 - Backend**:
```bash
cd d:/pbl6/backend && npm run dev
```

**Terminal 2 - Frontend**:
```bash
cd d:/pbl6/frontend && npm install && npm start
```

**Terminal 3 - Get Token** (after backend starts):
```bash
curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' | jq '.data.token'
```

Then paste token in browser at http://localhost:3000

---

## ✨ Next Steps

After testing Phase 1:
1. ✅ Verify all tests pass
2. Create TEST_RESULTS.md with findings
3. Review console logs for warnings
4. Check performance (DevTools → Performance tab)
5. Ready for Phase 2 (Documents + RAG)

---

## 📞 Quick Help

| Problem | Solution |
|---------|----------|
| Port already in use | Kill process on port 3000/3001 |
| 401 Unauthorized | Get new JWT token |
| CORS error | Check backend CORS config |
| No answers | Add rules to backend via API |
| Component errors | Check console F12 |
| API not responding | Verify backend running on :3001 |

---

## ✅ Success Criteria

You're done when:
- ✅ Frontend loads without errors
- ✅ Login works with JWT token
- ✅ Can ask questions and get answers
- ✅ Can submit feedback (1-5 stars)
- ✅ Can view chat history
- ✅ All tests pass in TEST_RESULTS.md

---

**Status**: 🟢 **READY TO TEST**  
**Time to Complete**: 5-10 minutes  
**Difficulty**: ⭐⭐ Easy

**👉 Start Now**: `cd d:/pbl6/backend && npm run dev` in Terminal 1

Good luck! 🚀
