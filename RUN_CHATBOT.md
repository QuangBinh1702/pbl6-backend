# 🚀 How to Run Chatbot App

## Quick Start (5 minutes)

### Step 1: Install Frontend (1 min)
```bash
cd frontend
npm install
```

### Step 2: Terminal 1 - Start Backend
```bash
cd backend
npm run dev
```
✅ Backend runs at `http://localhost:5000`

### Step 3: Terminal 2 - Start Frontend  
```bash
cd frontend
npm start
```
✅ Frontend opens at `http://localhost:3000` (auto)

### Step 4: Login & Test
1. Use your PBL6 account to login
2. See **💬 button** in bottom-right corner
3. Click to open chatbot
4. Try:
   - Type question: "hoạt động sắp tới là gì?"
   - Upload image from computer
   - Click suggested questions

---

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend loads at http://localhost:3000
- [ ] Login page appears
- [ ] Can login with valid credentials
- [ ] Dashboard shows after login
- [ ] 💬 button visible in bottom-right
- [ ] Can open/close chatbot
- [ ] Can type questions
- [ ] Bot responds with answer + suggestions
- [ ] Can upload image
- [ ] Suggested questions are clickable

---

## API Endpoints Being Used

| Action | Endpoint | Purpose |
|--------|----------|---------|
| Login | `POST /api/auth/login` | Get JWT token |
| Ask Question | `POST /api/chatbot/ask-anything` | Send question, get answer |
| Upload Image | `POST /api/chatbot/analyze-image` | Upload image, extract text |
| Get Activities | `GET /api/chatbot/my-activities` | User's activities |
| Get Attendance | `GET /api/chatbot/my-attendance` | User's PVCD points |
| Get Info | `GET /api/chatbot/my-info` | User's profile |

---

## If Something Goes Wrong

### Frontend won't start
```bash
# Delete node_modules and reinstall
rm -rf frontend/node_modules
cd frontend
npm install
npm start
```

### CORS error
- Backend is running? Check port 5000
- Check `.env` has correct `REACT_APP_API_URL`

### Login fails
- Username/password correct?
- Backend running? (`npm run dev`)
- Check browser console for errors

### Chatbot doesn't respond
- Check browser console for errors
- Check network tab (F12) to see API calls
- Verify token is in request headers
- Backend logs should show request

### Port already in use
```bash
# Kill process on port 3000
# Windows: Find PID and kill it
# Or use different port:
PORT=3001 npm start
```

---

## File Locations

| Purpose | Location |
|---------|----------|
| Backend API | `/backend/src/` |
| Chatbot Component | `/frontend/src/components/ChatBot/` |
| Login Page | `/frontend/src/pages/Login.jsx` |
| Dashboard | `/frontend/src/pages/Dashboard.jsx` |
| App Main | `/frontend/src/App.jsx` |

---

## Important Files

### To Change API URL
Edit `/frontend/.env`:
```env
REACT_APP_API_URL=http://your-backend-url:5000/api
```

### To Customize Colors
Edit `/frontend/src/components/ChatBot/ChatBot.css` or `/frontend/src/pages/Login.css`

Change gradient colors:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

---

## Production Deployment

### Backend
- Deploy to Render, Heroku, VPS, etc.
- Set environment variables
- Ensure `/public/uploads` is writable
- Enable CORS for frontend domain

### Frontend
```bash
npm run build
# Deploy build/ folder to Vercel, Netlify, etc.
```

Update `.env` with production API URL before building.

---

**Status**: ✅ Ready to run!

**Estimated Time**: 5-10 minutes

**Next Action**: Run the 3 steps above!
