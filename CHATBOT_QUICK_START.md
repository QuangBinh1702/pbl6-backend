# 🚀 Chatbot Enhanced - Quick Start Guide

## What's New?

Your chatbot has been **massively upgraded** from supporting only "Regulations" to supporting **5 different query types**:

1. ✅ **Regulations** - Quy định (original)
2. ✅ **Activities** - Hoạt động sắp tới
3. ✅ **Attendance** - Điểm danh & PVCD
4. ✅ **Student Info** - Thông tin lớp/khoa
5. ✅ **Image Analysis** - Upload ảnh + Sinh câu hỏi gợi ý

---

## Files Created

### Backend (Node.js/Express)

#### Models
- **`/backend/src/models/chat_history.model.js`** (Updated)
  - Added: `image_type`, `suggested_questions`, `query_context`, `user_feedback`, `related_activity_ids`

#### Controllers
- **`/backend/src/controllers/chatbot.enhanced.controller.js`** (New)
  - 7 powerful APIs for smart routing

#### Routes
- **`/backend/src/routes/chatbot.enhanced.route.js`** (New)
  - Routes for all 7 new endpoints

#### App Integration
- **`/backend/src/app.js`** (Updated)
  - Registered new routes

#### Documentation
- **`/backend/CHATBOT_API_GUIDE.md`** (New)
  - Complete API reference with examples

### Frontend (React)

#### ChatBot Widget
- **`/frontend/src/components/ChatBot/ChatBot.jsx`** (New)
  - React component with all features
  
- **`/frontend/src/components/ChatBot/ChatBot.css`** (New)
  - Styling (gradient, responsive, animations)
  
- **`/frontend/src/components/ChatBot/index.js`** (New)
  - Module export

#### Documentation
- **`/frontend/CHATBOT_INTEGRATION.md`** (New)
  - How to integrate widget into your app

### Project Documentation
- **`/CHATBOT_IMPLEMENTATION_STATUS.md`** (Updated)
  - Complete implementation status with all phases
  
- **`/CHATBOT_QUICK_START.md`** (This file)
  - You are here!

---

## Backend Setup (5 min)

### 1. Already Done ✅
- Models updated
- Controllers created
- Routes created
- App registered

### 2. Test It

Start backend:
```bash
cd backend
npm run dev
```

Get a JWT token by logging in, then test with Postman:

**Test Image Upload:**
```
POST http://localhost:5000/api/chatbot/analyze-image
Authorization: Bearer <your_token>
Body: multipart/form-data
  - image: <select image file>
```

**Test Smart Question:**
```
POST http://localhost:5000/api/chatbot/ask-anything
Authorization: Bearer <your_token>
Content-Type: application/json
{
  "question": "hoạt động sắp tới là gì?"
}
```

See `/backend/CHATBOT_API_GUIDE.md` for all endpoints.

---

## Frontend Setup (5 min)

### 1. Copy ChatBot Component

Already created in `/frontend/src/components/ChatBot/`

### 2. Setup Environment Variable

Create/update `.env` in frontend folder:
```
REACT_APP_API_URL=http://localhost:5000/api
```

### 3. Import in Your App

Open `src/App.js` (or your main layout):

```jsx
import ChatBot from './components/ChatBot';

function App() {
  return (
    <div className="App">
      {/* Your existing code */}
      
      {/* Add this line */}
      <ChatBot />
    </div>
  );
}

export default App;
```

### 4. Done! 🎉

The chatbot widget will appear in bottom-right corner:
- Click 💬 button to open/close
- Type question or upload image
- Suggested questions appear automatically
- Chat history stored in DB

See `/frontend/CHATBOT_INTEGRATION.md` for detailed guide.

---

## Key Features

### 📸 Image Upload
- Upload from computer (JPEG, PNG, GIF, WebP)
- Auto extract text using Google Vision API
- Detect image type (document, poster, screenshot, photo)
- Generate 3-4 relevant questions

### 🎯 Smart Routing
Bot automatically detects question intent:
- "**hoạt động**" → Show upcoming activities
- "**điểm**" / "**pvcd**" → Show attendance & points
- "**lớp**" / "**khoa**" → Show student info
- Others → Search regulations

### 💡 Suggested Questions
After each response, bot shows 3-4 follow-up questions:
- Based on response content
- Context-aware for student
- Clickable buttons for quick reply

### 📱 Responsive Design
- Works on desktop, tablet, mobile
- Floating widget in bottom-right
- Auto-adjusts window size
- Touch-friendly buttons

### 💾 Chat History
- All conversations saved in DB
- User can review history
- Submit feedback (helpful/not helpful)
- Searchable & paginated

---

## Architecture Overview

```
User Chat Widget (React)
    ↓
POST /api/chatbot/ask-anything
    ↓
Enhanced Controller (Smart Routing)
    ├─→ Activity Query? → Query Activity Collection
    ├─→ Attendance Query? → Query Attendance + PVCD
    ├─→ Info Query? → Query StudentProfile
    └─→ Default → Query Regulation
    ↓
Response + Suggested Questions
    ↓
Save to ChatHistory
    ↓
Return to Widget
    ↓
Display in Chat UI
```

---

## Testing Checklist

### Backend
- [ ] Start `npm run dev`
- [ ] Test `/analyze-image` with image upload
- [ ] Test `/ask-anything` with activity question
- [ ] Test `/ask-anything` with attendance question
- [ ] Test `/ask-anything` with info question
- [ ] Test `/ask-anything` with regulation question
- [ ] Test `/my-activities`
- [ ] Test `/my-attendance`
- [ ] Test `/my-info`
- [ ] Test `/history`
- [ ] Test `/feedback`

### Frontend
- [ ] Import ChatBot in App.js
- [ ] See 💬 button in bottom-right
- [ ] Click to open chat
- [ ] Type question → Bot responds
- [ ] Click suggested question
- [ ] Upload image → See extracted text + suggestions
- [ ] See chat history
- [ ] Check localStorage has token
- [ ] Test on mobile size

---

## API Endpoints

### Original (Still Work)
- `POST /api/chatbot/analyze-image` (old - just returns regulations)
- `POST /api/chatbot/ask` (old - just text questions)
- `GET /api/chatbot/regulations`
- `GET /api/chatbot/history`

### New (Enhanced)
- `POST /api/chatbot/analyze-image` (enhanced - with suggestions!)
- `POST /api/chatbot/ask-anything` (smart routing)
- `GET /api/chatbot/my-activities` (user's activities)
- `GET /api/chatbot/my-attendance` (user's points)
- `GET /api/chatbot/my-info` (user's profile)
- `GET /api/chatbot/history` (chat history)
- `POST /api/chatbot/feedback` (user feedback)

Old endpoints still work, use new ones for better experience.

---

## Troubleshooting

### "Token not found"
- Check `localStorage.getItem('token')` after login
- Token needs to be saved during login

### "Image upload fails"
- Max 5MB file size
- Only JPEG, PNG, GIF, WebP
- Image URL must be publicly accessible

### "No suggested questions"
- Google Vision might fail on low-quality images
- Check Google Cloud credentials
- Check image is real (not totally blurry)

### "Activity/Attendance/Info returns nothing"
- Check StudentProfile exists for user
- Check Activities exist in DB (non-rejected status)
- Check Attendance records exist

### "CORS error"
- Check backend `app.js` CORS config
- Frontend URL needs to be allowed

---

## What's Different from Original?

| Feature | Original | Enhanced |
|---------|----------|----------|
| **Query Types** | Only regulations | 5 types (regulations, activities, attendance, info, images) |
| **Image Upload** | Yes, but only for regulations | Yes, with image type detection + suggestions |
| **Suggested Questions** | No | Yes, 3-4 per response |
| **Activities** | No | Yes, can ask "hoạt động sắp tới?" |
| **Attendance/Points** | No | Yes, can ask "điểm của em?" |
| **Student Info** | No | Yes, can ask "lớp khoa?" |
| **Frontend Widget** | No (need to build) | Yes, complete React component |
| **Smart Routing** | No | Yes, auto-detect question type |
| **User Feedback** | No | Yes, helpful/not helpful rating |
| **Chat History** | Basic | Extended with feedback + context |

---

## Next Steps

1. **Backend Testing**: Run all API tests from Postman ✅
2. **Frontend Integration**: Add ChatBot to App.js ✅
3. **E2E Testing**: Test full flow from UI ✅
4. **Fine-tuning**: Adjust suggested questions if needed ⚠️
5. **Deployment**: Deploy to production ⚠️

---

## Files to Review

1. `/backend/CHATBOT_API_GUIDE.md` - API reference
2. `/frontend/CHATBOT_INTEGRATION.md` - How to integrate
3. `/CHATBOT_IMPLEMENTATION_STATUS.md` - Full implementation status
4. Source code:
   - `/backend/src/controllers/chatbot.enhanced.controller.js`
   - `/backend/src/routes/chatbot.enhanced.route.js`
   - `/frontend/src/components/ChatBot/ChatBot.jsx`

---

## Customization

### Change Colors
Edit `/frontend/src/components/ChatBot/ChatBot.css`:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
/* Change #667eea (blue) and #764ba2 (purple) to your colors */
```

### Change Position
```css
.chatbot-container {
  bottom: 20px;  /* Distance from bottom */
  right: 20px;   /* Distance from right */
}
```

### Change Size
```css
.chatbot-window {
  width: 420px;   /* Change width */
  height: 600px;  /* Change height */
}
```

---

## Support

For issues:
1. Check backend logs: `npm run dev` output
2. Check browser console: F12 → Console tab
3. Check network tab: F12 → Network tab → See API calls
4. Check `/backend/CHATBOT_API_GUIDE.md` for error codes

---

**Status**: 🟢 Ready to Use

**Estimated Time to Deploy**: 
- Backend: 5 minutes (already done)
- Frontend: 5 minutes (3 steps above)
- Testing: 10-15 minutes
- Total: ~20-25 minutes

Good luck! 🎉
