# Chatbot Enhanced API Guide

## Endpoint Overview

### Base URL
```
http://localhost:5000/api/chatbot
```

### Authentication
All endpoints (except `/regulations` GET) require JWT token:
```
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints

### 1. Upload Image & Get Suggestions
```http
POST /analyze-image
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body:
- image: <file> (required, max 5MB)

Response 200:
{
  "success": true,
  "data": {
    "extracted_text": "Mô tả quy định điểm danh...",
    "image_type": "document", // or "poster", "screenshot", "photo", "unknown"
    "suggested_questions": [
      "Quy định về điểm danh như thế nào?",
      "Làm sao để đạt điểm tối đa?",
      "..."
    ],
    "chat_id": "507f1f77bcf86cd799439011"
  }
}

Response 400:
{
  "error": "Vui lòng upload file hoặc cung cấp image_url"
}

Response 500:
{
  "error": "Không thể xử lý ảnh. Vui lòng thử lại."
}
```

---

### 2. Ask Anything (Smart Routing)
```http
POST /ask-anything
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  "question": "Hoạt động sắp tới là gì?"
}

Response 200:
{
  "success": true,
  "data": {
    "response": "Tìm thấy 3 hoạt động sắp tới:\n\n1. **Hội thảo...",
    "suggested_questions": [
      "Làm sao để đăng ký hoạt động?",
      "..."
    ],
    "query_type": "activity", // or "attendance", "info", "text"
    "regulations": [],
    "activities": [
      {
        "id": "507f...",
        "title": "Hội thảo khoa học",
        "description": "...",
        "location": "Phòng A101",
        "start_time": "2025-12-01T14:00:00.000Z"
      }
    ]
  }
}

Error Examples:
- "Không tìm thấy hồ sơ sinh viên của bạn." (nếu user không phải sinh viên)
- "Hiện chưa có hoạt động nào sắp tới." (nếu không có activity nào)
```

---

### 3. Get My Activities
```http
GET /my-activities?limit=10&page=1&status=all
Authorization: Bearer <token>

Query Parameters:
- limit: (optional, default 10) số bản ghi mỗi trang
- page: (optional, default 1) số trang
- status: (optional, default "all") 
  - "approved", "pending", "in_progress", "completed", "rejected", "cancelled", or "all"

Response 200:
{
  "success": true,
  "data": [
    {
      "_id": "507f...",
      "title": "Hội thảo khoa học",
      "description": "...",
      "location": "Phòng A101",
      "start_time": "2025-12-01T14:00:00.000Z",
      "capacity": 100,
      "status": "approved"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "pages": 3
  }
}
```

---

### 4. Get My Attendance & PVCD Points
```http
GET /my-attendance
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": {
    "total_verified": 5,
    "pvcd_points": 45,
    "attendance_records": [
      {
        "activity": "Hội thảo khoa học",
        "scanned_at": "2025-11-20T14:30:00.000Z",
        "points": 10
      }
    ]
  }
}

Response 404:
{
  "error": "Không tìm thấy hồ sơ sinh viên"
}
```

---

### 5. Get My Information
```http
GET /my-info
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": {
    "full_name": "Nguyễn Văn A",
    "student_number": "2021010001",
    "email": "a@student.edu.vn",
    "phone": "0912345678",
    "class": "CNTT-K65-A",
    "enrollment_year": 2021,
    "date_of_birth": "2003-05-15",
    "gender": "Nam",
    "contact_address": "123 Đường ABC, TP. HCM",
    "is_class_monitor": false
  }
}
```

---

### 6. Get Chat History
```http
GET /history?limit=20&page=1
Authorization: Bearer <token>

Query Parameters:
- limit: (optional, default 20)
- page: (optional, default 1)

Response 200:
{
  "success": true,
  "data": [
    {
      "_id": "507f...",
      "user_id": "507f...",
      "question": "Hoạt động sắp tới là gì?",
      "response": "Tìm thấy...",
      "query_type": "activity",
      "suggested_questions": ["...", "..."],
      "user_feedback": null,
      "timestamp": "2025-11-26T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
}
```

---

### 7. Submit User Feedback
```http
POST /feedback
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  "chat_id": "507f1f77bcf86cd799439011",
  "feedback": "helpful", // or "not_helpful", "partially_helpful"
  "comment": "Trả lời rất hữu ích!"
}

Response 200:
{
  "success": true,
  "data": {
    "_id": "507f...",
    "user_feedback": "helpful",
    "feedback_comment": "Trả lời rất hữu ích!",
    ...
  }
}

Response 400:
{
  "error": "chat_id và feedback là bắt buộc"
}
```

---

## Query Type Detection Logic

Bot tự động detect intent dựa vào keywords trong câu hỏi:

| Keyword | Type | Action |
|---------|------|--------|
| "hoạt động" (không có "quy định") | `activity` | Query Activity collection, return sắp tới |
| "điểm", "pvcd", "điểm danh" | `attendance` | Query Attendance + PvcdRecord, return điểm |
| "lớp", "khoa", "thông tin", "email" | `info` | Query StudentProfile, return thông tin |
| Others | `text` | Query Regulation collection |

---

## Image Type Detection

Bot phát hiện loại ảnh qua Google Vision Label Detection:

| Detected Label | Type | Suggested Questions |
|----------------|------|-------------------|
| document, paper, text | `document` | "Tài liệu này liên quan quy định nào?" |
| poster, flyer | `poster` | "Làm sao để đăng ký hoạt động này?" |
| screenshot, computer, screen | `screenshot` | "Ảnh này là về cái gì?" |
| Others | `photo` | Generic suggestions |

---

## Suggested Questions Generation

Bot sinh 3-4 câu hỏi dựa vào:
1. **Content keywords** - Keywords trong extracted text hoặc question
2. **Image type** - Loại ảnh được detect
3. **User context** - Có user_id thì add user-specific questions

Ví dụ:
- Text chứa "điểm" → Gợi ý "Làm sao để xem điểm PVCD?"
- Image type = "poster" → Gợi ý "Làm sao để đăng ký hoạt động này?"
- Image type = "document" → Gợi ý "Tài liệu này liên quan quy định nào?"

---

## Error Handling

### Common Error Codes

| Status | Error | Cause | Solution |
|--------|-------|-------|----------|
| 400 | "Vui lòng upload file..." | No image or URL | Provide either file or image_url |
| 400 | "Vui lòng cung cấp câu hỏi" | Missing question field | Include "question" in body |
| 404 | "Không tìm thấy hồ sơ sinh viên" | Student profile missing | Ensure user has StudentProfile |
| 500 | "Không thể xử lý ảnh..." | Google Vision error | Check image URL is public/accessible |
| 401 | "Unauthorized" | Invalid/missing token | Include valid JWT token |

### Token Validation

All protected endpoints check:
1. Token exists in Authorization header
2. Token format: `Bearer <token>`
3. Token is valid JWT
4. Token not expired
5. User exists in database

If token missing or invalid → 401 error

---

## Rate Limiting

Currently no rate limiting. 

For production, recommend:
- 10 requests/minute per user
- 100 MB uploads/day per user
- 1000 max chat history records per user

---

## Database Schema

### ChatHistory Extended

```javascript
{
  _id: ObjectId,
  user_id: ObjectId (ref: User),
  question: String,
  extracted_text: String,
  response: String,
  
  // New fields
  related_regulation_ids: [ObjectId],
  related_activity_ids: [ObjectId],
  image_url: String,
  image_type: String, // "document", "poster", "screenshot", "photo", "unknown"
  suggested_questions: [String],
  query_type: String, // "text", "image", "activity", "attendance", "info"
  query_context: {
    activity_id: ObjectId,
    student_id: ObjectId,
    class_id: ObjectId
  },
  user_feedback: String, // "helpful", "not_helpful", "partially_helpful", null
  feedback_comment: String,
  
  timestamp: Date
}
```

---

## Testing Checklist

- [ ] Upload JPEG/PNG/GIF image from computer
- [ ] Verify extracted_text is not empty
- [ ] Verify image_type is detected correctly
- [ ] Verify 3-4 suggested_questions are generated
- [ ] Test each query type: activity, attendance, info, text
- [ ] Test with invalid token → 401
- [ ] Test with student_id mismatch → handle gracefully
- [ ] Test file > 5MB → 400 error
- [ ] Test file type not image → 400 error
- [ ] Test suggested questions are clickable
- [ ] Test feedback submission works
- [ ] Verify chat history pagination works

---

**Version**: 1.0  
**Last Updated**: 2025-11-26
