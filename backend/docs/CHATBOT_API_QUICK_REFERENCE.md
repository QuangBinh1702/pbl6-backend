# 🚀 Chatbot API - Quick Reference for Frontend

**Base URL:** `http://localhost:5000/api/chatbot`  
**Auth Header:** `Authorization: Bearer <JWT_TOKEN>`

---

## 📌 Most Used Endpoints

### **1. Ask Question (Main)**
```javascript
POST /api/chatbot/ask-anything
Body: { "question": "đăng ký hoạt động" }
Response: { success: true, data: { answer, source, confidence, ... } }
```

### **2. Get Chat History**
```javascript
GET /api/chatbot/history?limit=20&page=1
Response: { success: true, data: [...], pagination: {...} }
```

### **3. Submit Feedback**
```javascript
POST /api/chatbot/feedback
Body: { messageId, rating, issue, suggestion, isHelpful }
Response: { success: true, data: {...} }
```

---

## 📋 All Endpoints Summary

| # | Method | Endpoint | Purpose | Auth |
|---|--------|----------|---------|------|
| 1 | POST | `/ask-anything` | Hỏi chatbot | ✅ |
| 2 | POST | `/analyze-image` | Upload ảnh (501 placeholder) | ✅ |
| 3 | GET | `/history` | Lịch sử chat | ✅ |
| 4 | GET | `/rules` | Danh sách rules | ✅ Admin |
| 5 | POST | `/rules` | Tạo rule | ✅ Admin |
| 6 | PUT | `/rules/:id` | Cập nhật rule | ✅ Admin |
| 7 | DELETE | `/rules/:id` | Xóa rule | ✅ Admin |
| 8 | GET | `/documents` | Danh sách documents | ✅ Admin |
| 9 | POST | `/documents` | Tạo document | ✅ Admin |
| 10 | GET | `/documents/:id` | Chi tiết document | ✅ Admin |
| 11 | PUT | `/documents/:id` | Cập nhật document | ✅ Admin |
| 12 | DELETE | `/documents/:id` | Xóa document | ✅ Admin |
| 13 | GET | `/analytics` | Analytics cơ bản | ✅ Admin |
| 14 | GET | `/analytics/dashboard` | Dashboard chi tiết | ✅ Admin |
| 15 | GET | `/analytics/trending-topics` | Trending topics | ✅ Admin |
| 16 | GET | `/analytics/document-performance` | Document performance | ✅ Admin |
| 17 | GET | `/analytics/issues-report` | Issues report | ✅ Admin |
| 18 | GET | `/messages` | Danh sách messages | ✅ Admin |
| 19 | POST | `/test-query` | Test query | ✅ Admin |
| 20 | POST | `/feedback` | Submit feedback | ✅ |
| 21 | GET | `/feedback` | Danh sách feedback | ✅ Admin |

**Phase 4 Endpoints:** Xem file đầy đủ `CHATBOT_API_DOCUMENTATION_FOR_FRONTEND.md`

---

## 🔧 Common Request/Response Patterns

### **Success Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

### **Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

### **Pagination:**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
```

---

## 📝 Frontend Integration Example

```javascript
// api/chatbot.js
const API_BASE = 'http://localhost:5000/api/chatbot';

export const askChatbot = async (question) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/ask-anything`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ question })
  });
  return await res.json();
};

export const getHistory = async (page = 1, limit = 20) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/history?page=${page}&limit=${limit}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await res.json();
};

export const submitFeedback = async (messageId, rating, issue, suggestion, isHelpful) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ messageId, rating, issue, suggestion, isHelpful })
  });
  return await res.json();
};
```

---

**Full Documentation:** `CHATBOT_API_DOCUMENTATION_FOR_FRONTEND.md`

