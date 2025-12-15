# 🔧 Chatbot Testing - Issues Fixed

**Date**: 15/12/2025  
**Status**: ✅ Ready to Test  

---

## ❌ Issues Found

### 1. **jq Command Not Found** (FIXED ✅)
**Problem**: `QUICK_TEST_COMMANDS.sh` fails because `jq` JSON parser not installed on Windows
```bash
QUICK_TEST_COMMANDS.sh: line 11: jq: command not found
```

**Solution**: Created 2 alternatives:
- ✅ `QUICK_TEST_COMMANDS_FIXED.sh` - Bash script without jq
- ✅ `quick-test-fixed.ps1` - PowerShell version
- ✅ `backend/scripts/test-rules.js` - Node.js version (recommended)

### 2. **Image Upload Not Working** (FIXED ✅)
**Problem**: Image upload feature in frontend had no backend endpoint
- Frontend showed image upload button & preview
- But NO API endpoint `/api/chatbot/analyze-image` on backend
- Images were logged as user messages but not analyzed

**Solution**: Removed image upload feature until backend is ready
- Deleted image handlers from `ChatInterface.jsx`
- Removed image preview UI from `ChatInterface.css`
- Removed image input references
- Status: ✅ Cleaned up

### 3. **Test Data Not Seeding** (NEEDS VERIFICATION)
**Problem**: Rules table might be empty (that's why chatbot says "sorry")
- Bash script had jq failures, couldn't verify if rules were created
- Token extraction failed silently

**Solution**: Use Node.js script to reliably seed rules
```bash
cd backend && node scripts/test-rules.js
```

---

## 📋 Files Created/Fixed

### New Scripts
| File | Purpose | How to Run |
|------|---------|-----------|
| `QUICK_TEST_COMMANDS_FIXED.sh` | Bash test (no jq) | `bash QUICK_TEST_COMMANDS_FIXED.sh` |
| `quick-test-fixed.ps1` | PowerShell test | `powershell -File quick-test-fixed.ps1` |
| `backend/scripts/test-rules.js` | Node.js test (best) | `cd backend && node scripts/test-rules.js` |
| `backend/scripts/seed-test-user-simple.js` | Create test user | `cd backend && node scripts/seed-test-user-simple.js` |

### Modified Files
| File | Changes |
|------|---------|
| `frontend/src/components/ChatInterface.jsx` | ✂️ Removed image upload code |
| `frontend/src/styles/ChatInterface.css` | ✂️ Removed image preview styles |

---

## 🚀 How to Test Now

### Step 1: Create Test User
```bash
cd backend
node scripts/seed-test-user-simple.js
# Output: ✅ Test user created! Username: test, Password: password123
```

### Step 2: Seed Chatbot Rules
```bash
cd backend
node scripts/test-rules.js
```
This will:
- ✅ Get auth token
- ✅ Create 6 test rules (hoạt động, giờ đăng ký, etc.)
- ✅ Test 3 sample questions
- ✅ Show confidence & source for each answer

### Step 3: Start Frontend
```bash
cd frontend
npm start
# Opens http://localhost:3000
```

### Step 4: Login & Chat
1. Go to http://localhost:3000
2. Username: `test`
3. Password: `password123`
4. Ask a question like "Hoạt động sắp tới là gì?"
5. Should see answer (not "sorry...")

---

## 🧪 What Gets Tested

### Rules Being Seeded
```javascript
1. Pattern: "hoạt động sắp tới"
   Keywords: ["hoạt động", "sắp tới", "tới"]
   
2. Pattern: "giờ đăng ký hoạt động"
   Keywords: ["giờ", "đăng ký", "mở"]
   
3. Pattern: "địa điểm diễn ra hoạt động"
   Keywords: ["địa điểm", "nơi", "tại"]
   
4. Pattern: "yêu cầu tham gia hoạt động"
   Keywords: ["yêu cầu", "điều kiện", "cần"]
   
5. Pattern: "cách đăng ký hoạt động qua web"
   Keywords: ["đăng ký", "web", "cách"]
   
6. Pattern: "liên hệ hỗ trợ"
   Keywords: ["liên hệ", "hỗ trợ", "gọi", "email"]
```

### Sample Test Questions
- "Hoạt động sắp tới là gì?" → Should match Rule 1
- "Giờ đăng ký hoạt động là mấy giờ?" → Should match Rule 2
- "Cách đăng ký hoạt động qua web?" → Should match Rule 5

### Expected Responses
```json
{
  "success": true,
  "data": {
    "answer": "Các hoạt động sắp tới bao gồm: ...",
    "source": "rule",
    "confidence": 0.85-0.95,
    "messageId": "msg_123"
  }
}
```

---

## ⚠️ Important Notes

### Why Image Upload Was Removed
- Backend had NO endpoint for image analysis
- Feature was placeholder from Phase 1
- Will be re-added in Phase 2 when backend has:
  - `/api/chatbot/analyze-image` endpoint
  - Image file storage (Cloudinary or similar)
  - Image analysis service (optional: use vision AI)

### Why Test User Script?
- Original bash script couldn't verify if token was obtained
- Need bcrypt-hashed password for security
- Simple script creates basic test account for demo purposes

### What Chatbot Needs to Work
```
1. Backend running (:5000) ✅
2. Rules in database ✅ (will be seeded)
3. User account ✅ (will be created)
4. Frontend running (:3000) ✅
5. Proper JWT token ✅ (will be obtained)
```

---

## 🔍 Troubleshooting

### "Command not found" for node
→ Node.js not installed or not in PATH
→ Install from nodejs.org

### "Cannot connect to MongoDB"
→ Check `.env` has correct `MONGODB_URI`
→ Check MongoDB server is running
→ Check credentials are correct

### "User not found" after creating test user
→ Maybe script didn't run properly
→ Try again: `node backend/scripts/seed-test-user-simple.js`

### Still getting "sorry" messages
→ Rules might not have been seeded
→ Run: `cd backend && node scripts/test-rules.js`
→ Check terminal output for "✓ Success"

### Image upload button missing
→ Correct! Feature removed until backend is ready
→ Will be re-added in Phase 2

---

## ✅ Quick Checklist

Before you test:
- [ ] Backend running on http://localhost:5000
- [ ] MongoDB connected (check .env)
- [ ] Frontend ready at http://localhost:3000 (not started yet)
- [ ] Test user created
- [ ] Rules seeded

Ready to test:
- [ ] Run test-rules.js to verify everything works
- [ ] Start frontend
- [ ] Login with test/password123
- [ ] Ask a question
- [ ] See answer (not "sorry") ✅

---

## 📚 Related Files
- [TEST_PLAN_COMPLETE.md](d:/pbl6/TEST_PLAN_COMPLETE.md) - Full 12 test cases
- [SOLUTION_SUMMARY.md](d:/pbl6/SOLUTION_SUMMARY.md) - Original analysis
- [QUICK_TEST_COMMANDS_FIXED.sh](d:/pbl6/QUICK_TEST_COMMANDS_FIXED.sh) - Bash alternative

---

**Next Steps**: 
1. Create test user
2. Seed rules
3. Start frontend
4. Test chat
5. Run full TEST_PLAN_COMPLETE.md tests
6. Document results
7. Ready for Phase 2!
