# 📚 Chatbot API Documentation - For Frontend Integration

**Base URL:** `http://localhost:5000/api/chatbot`  
**Authentication:** Tất cả endpoints đều cần JWT token trong header

---

## 🔐 Authentication

Tất cả requests cần có header:
```
Authorization: Bearer <JWT_TOKEN>
```

Token được lấy từ login endpoint và lưu trong `localStorage.getItem('token')`

---

## 📋 Table of Contents

### **User Endpoints (Public)**
1. [POST /ask-anything](#1-post-ask-anything) - Hỏi chatbot
2. [POST /analyze-image](#2-post-analyze-image) - Upload và phân tích ảnh
3. [GET /history](#3-get-history) - Lấy lịch sử chat

### **Admin Endpoints (Management)**
4. [GET /rules](#4-get-rules) - Danh sách rules
5. [POST /rules](#5-post-rules) - Tạo rule mới
6. [PUT /rules/:id](#6-put-rulesid) - Cập nhật rule
7. [DELETE /rules/:id](#7-delete-rulesid) - Xóa rule
8. [GET /documents](#8-get-documents) - Danh sách documents
9. [POST /documents](#9-post-documents) - Tạo document mới
10. [GET /documents/:id](#10-get-documentsid) - Chi tiết document
11. [PUT /documents/:id](#11-put-documentsid) - Cập nhật document
12. [DELETE /documents/:id](#12-delete-documentsid) - Xóa document

### **Analytics & Monitoring**
13. [GET /analytics](#13-get-analytics) - Analytics cơ bản
14. [GET /analytics/dashboard](#14-get-analyticsdashboard) - Dashboard chi tiết
15. [GET /analytics/trending-topics](#15-get-analyticstrending-topics) - Trending topics
16. [GET /analytics/document-performance](#16-get-analyticsdocument-performance) - Document performance
17. [GET /analytics/issues-report](#17-get-analyticsissues-report) - Issues report
18. [GET /messages](#18-get-messages) - Danh sách messages (logs)
19. [POST /test-query](#19-post-test-query) - Test query (admin tool)

### **Feedback**
20. [POST /feedback](#20-post-feedback) - Submit feedback
21. [GET /feedback](#21-get-feedback) - Danh sách feedback

### **Phase 4: Advanced Features (Admin)**
22. [POST /feedback/:feedbackId/response](#22-post-feedbackfeedbackidresponse) - Admin response to feedback
23. [POST /feedback/:feedbackId/close](#23-post-feedbackfeedbackidclose) - Close feedback
24. [GET /feedback/pending](#24-get-feedbackpending) - Pending feedback
25. [POST /documents/auto-categorize](#25-post-documentsauto-categorize) - Auto-categorize documents
26. [GET /documents/:documentId/similar](#26-get-documentsdocumentidsimilar) - Find similar documents
27. [POST /documents/deduplicate](#27-post-documentsdeduplicate) - Deduplicate documents
28. [POST /documents/bulk-import](#28-post-documentsbulk-import) - Bulk import documents
29. [POST /documents/bulk-import-csv](#29-post-documentsbulk-import-csv) - Bulk import CSV
30. [POST /cache/warmup](#30-post-cachewarmup) - Warmup embedding cache
31. [GET /cache/stats](#31-get-cachestats) - Cache statistics
32. [POST /experiments](#32-post-experiments) - Create A/B test
33. [GET /experiments/:experimentId/results](#33-get-experimentsexperimentidresults) - A/B test results
34. [GET /dashboard](#34-get-dashboard) - User satisfaction dashboard
35. [GET /dashboard/satisfaction](#35-get-dashboardsatisfaction) - Satisfaction summary
36. [GET /dashboard/issues](#36-get-dashboardissues) - Issue tracking dashboard
37. [GET /fine-tuning/candidates](#37-get-fine-tuningcandidates) - Fine-tuning candidates
38. [GET /documents/analysis/effectiveness](#38-get-documentsanalysiseffectiveness) - Document effectiveness
39. [GET /insights/training](#39-get-insightstraining) - Training insights

---

## 🚀 API Endpoints

### **1. POST /ask-anything**

Hỏi chatbot một câu hỏi bất kỳ. Chatbot sẽ tự động quyết định dùng rule engine, RAG, hoặc fallback.

**URL:** `POST /api/chatbot/ask-anything`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <JWT_TOKEN>"
}
```

**Request Body:**
```json
{
  "question": "đăng ký hoạt động như thế nào?"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "answer": "Để đăng ký hoạt động: 1. Tìm hoạt động bạn quan tâm 2. Nhấp vào \"Đăng ký\" 3. Điền các thông tin yêu cầu 4. Chọn \"Xác nhận\" Bạn sẽ nhận được email xác nhận sau khi đăng ký thành công.",
    "source": "rule",
    "confidence": 0.79,
    "matchedRuleId": "65a1b2c3d4e5f6g7h8i9j0k1",
    "responseTime": 62,
    "scores": {
      "ruleScore": 0.79,
      "ragScore": null
    }
  }
}
```

**Response Error (400):**
```json
{
  "success": false,
  "error": "Vui lòng nhập câu hỏi"
}
```

**Response Error (500):**
```json
{
  "success": false,
  "error": "Có lỗi xảy ra. Vui lòng thử lại sau."
}
```

**Source Values:**
- `"rule"` - Trả lời từ rule engine
- `"rag"` - Trả lời từ RAG (knowledge base)
- `"fallback"` - Trả lời mặc định khi không match

**Frontend Example:**
```javascript
const askChatbot = async (question) => {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:5000/api/chatbot/ask-anything', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ question })
  });
  const data = await response.json();
  return data;
};
```

---

### **2. POST /analyze-image**

Upload ảnh và phân tích text từ ảnh (OCR). **Hiện tại trả về placeholder (501)**.

**URL:** `POST /api/chatbot/analyze-image`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request Body (FormData):**
```
FormData:
  image: <File>
```

**Response Success (200) - Khi enable:**
```json
{
  "success": true,
  "data": {
    "extracted_text": "Text extracted from image...",
    "image_type": "document",
    "suggested_questions": [
      "Câu hỏi gợi ý 1",
      "Câu hỏi gợi ý 2"
    ],
    "chat_id": "65a1b2c3d4e5f6g7h8i9j0k1"
  }
}
```

**Response Current (501):**
```json
{
  "success": false,
  "error": "Image analysis coming in Phase 2"
}
```

**Frontend Example:**
```javascript
const analyzeImage = async (imageFile) => {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('image', imageFile);
  
  const response = await fetch('http://localhost:5000/api/chatbot/analyze-image', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  const data = await response.json();
  return data;
};
```

---

### **3. GET /history**

Lấy lịch sử chat của user hiện tại.

**URL:** `GET /api/chatbot/history?limit=20&page=1`

**Query Parameters:**
- `limit` (optional, default: 20) - Số messages mỗi trang
- `page` (optional, default: 1) - Số trang

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "userId": "691d6f94e1cf629df3cbd49",
      "query": "đăng ký hoạt động",
      "answer": "Để đăng ký hoạt động...",
      "source": "rule",
      "confidence": 0.79,
      "scores": {
        "ruleScore": 0.79,
        "ragScore": null
      },
      "responseTime": 62,
      "timestamp": "2025-12-14T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 20,
    "pages": 2
  }
}
```

**Frontend Example:**
```javascript
const getChatHistory = async (page = 1, limit = 20) => {
  const token = localStorage.getItem('token');
  const response = await fetch(
    `http://localhost:5000/api/chatbot/history?limit=${limit}&page=${page}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  const data = await response.json();
  return data;
};
```

---

### **4. GET /rules**

Lấy danh sách tất cả rules (Admin).

**URL:** `GET /api/chatbot/rules?isActive=true`

**Query Parameters:**
- `isActive` (optional) - Filter: `"true"` hoặc `"false"`

**Response Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "pattern": "đăng ký hoạt động",
      "keywords": ["đăng ký", "register", "registration"],
      "responseTemplate": "Để đăng ký hoạt động: 1. Tìm hoạt động...",
      "priority": 5,
      "allowedRoles": [],
      "type": "faq",
      "isActive": true,
      "createdAt": "2025-12-14T10:00:00.000Z"
    }
  ],
  "count": 8
}
```

---

### **5. POST /rules**

Tạo rule mới (Admin).

**URL:** `POST /api/chatbot/rules`

**Request Body:**
```json
{
  "pattern": "điểm danh",
  "keywords": ["điểm danh", "attendance", "check-in"],
  "responseTemplate": "Để điểm danh tại sự kiện: 1. Tới địa điểm...",
  "priority": 7,
  "allowedRoles": ["student"],
  "type": "guide"
}
```

**Response Success (201):**
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "pattern": "điểm danh",
    "keywords": ["điểm danh", "attendance", "check-in"],
    "responseTemplate": "Để điểm danh tại sự kiện...",
    "priority": 7,
    "allowedRoles": ["student"],
    "type": "guide",
    "isActive": true,
    "createdAt": "2025-12-14T10:00:00.000Z"
  },
  "message": "Rule created successfully"
}
```

**Required Fields:**
- `pattern` (string) - Pattern chính
- `responseTemplate` (string) - Câu trả lời

**Optional Fields:**
- `keywords` (array) - Từ khóa thay thế
- `priority` (number, 1-10, default: 5)
- `allowedRoles` (array, default: []) - Empty = public
- `type` (string, default: "faq") - "faq" | "guide" | "rule"

---

### **6. PUT /rules/:id**

Cập nhật rule (Admin).

**URL:** `PUT /api/chatbot/rules/:id`

**Request Body:**
```json
{
  "pattern": "điểm danh cập nhật",
  "priority": 8,
  "isActive": true
}
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "pattern": "điểm danh cập nhật",
    "priority": 8,
    "isActive": true
  },
  "message": "Rule updated successfully"
}
```

---

### **7. DELETE /rules/:id**

Xóa rule (Admin).

**URL:** `DELETE /api/chatbot/rules/:id`

**Response Success (200):**
```json
{
  "success": true,
  "message": "Rule deleted successfully"
}
```

---

### **8. GET /documents**

Lấy danh sách documents trong knowledge base (Admin).

**URL:** `GET /api/chatbot/documents?limit=20&page=1&category=guide`

**Query Parameters:**
- `limit` (optional, default: 20)
- `page` (optional, default: 1)
- `category` (optional) - Filter: "faq" | "guide" | "policy" | "regulation" | "procedure" | "other"

**Response Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "title": "Hướng dẫn đăng ký hoạt động",
      "content": "Hướng dẫn đầy đủ về cách đăng ký...",
      "category": "guide",
      "tags": ["registration", "activity"],
      "allowedRoles": [],
      "priority": 5,
      "isActive": true,
      "createdAt": "2025-12-14T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
}
```

---

### **9. POST /documents**

Tạo document mới trong knowledge base (Admin).

**URL:** `POST /api/chatbot/documents`

**Request Body:**
```json
{
  "title": "Quy định PVCD",
  "content": "Mỗi sinh viên phải tham gia ít nhất 10 hoạt động PVCD...",
  "category": "regulation",
  "tags": ["PVCD", "regulation"],
  "allowedRoles": ["student"],
  "priority": 8
}
```

**Response Success (201):**
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "title": "Quy định PVCD",
    "content": "Mỗi sinh viên phải tham gia...",
    "category": "regulation",
    "tags": ["PVCD", "regulation"],
    "allowedRoles": ["student"],
    "priority": 8,
    "isActive": true,
    "embedding": [0.123, 0.456, ...],
    "createdAt": "2025-12-14T10:00:00.000Z"
  },
  "message": "Tài liệu created successfully"
}
```

**Required Fields:**
- `title` (string)
- `content` (string)

**Optional Fields:**
- `category` (string, default: "other")
- `tags` (array, default: [])
- `allowedRoles` (array, default: [])
- `priority` (number, default: 5)

---

### **10. GET /documents/:id**

Lấy chi tiết một document (Admin).

**URL:** `GET /api/chatbot/documents/:id`

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "title": "Quy định PVCD",
    "content": "Mỗi sinh viên phải tham gia...",
    "category": "regulation",
    "tags": ["PVCD"],
    "allowedRoles": ["student"],
    "priority": 8,
    "isActive": true,
    "embedding": [0.123, 0.456, ...],
    "createdAt": "2025-12-14T10:00:00.000Z",
    "updatedAt": "2025-12-14T10:00:00.000Z"
  }
}
```

**Response Error (404):**
```json
{
  "success": false,
  "error": "Tài liệu không tìm thấy"
}
```

---

### **11. PUT /documents/:id**

Cập nhật document (Admin).

**URL:** `PUT /api/chatbot/documents/:id`

**Request Body:**
```json
{
  "title": "Quy định PVCD (Cập nhật)",
  "content": "Nội dung cập nhật...",
  "isActive": false
}
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "title": "Quy định PVCD (Cập nhật)",
    "content": "Nội dung cập nhật...",
    "isActive": false
  },
  "message": "Tài liệu updated successfully"
}
```

---

### **12. DELETE /documents/:id**

Xóa document (Admin).

**URL:** `DELETE /api/chatbot/documents/:id`

**Response Success (200):**
```json
{
  "success": true,
  "message": "Tài liệu deleted successfully"
}
```

---

### **13. GET /analytics**

Lấy analytics cơ bản (Admin).

**URL:** `GET /api/chatbot/analytics?timeRange=day`

**Query Parameters:**
- `timeRange` (optional, default: "day") - "day" | "week" | "month"

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "totalQueries": 150,
    "ruleMatches": 120,
    "ragMatches": 20,
    "fallbacks": 10,
    "avgResponseTime": 62,
    "avgConfidence": 0.75
  },
  "timeRange": "day"
}
```

---

### **14. GET /analytics/dashboard**

Lấy dashboard analytics chi tiết (Admin).

**URL:** `GET /api/chatbot/analytics/dashboard?timeRange=day`

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalQueries": 150,
      "ruleMatches": 120,
      "ragMatches": 20,
      "fallbacks": 10
    },
    "performance": {
      "avgResponseTime": 62,
      "p95ResponseTime": 120,
      "avgConfidence": 0.75
    },
    "trends": {
      "queriesByDay": [...],
      "sourceDistribution": {...}
    }
  },
  "timeRange": "day"
}
```

---

### **15. GET /analytics/trending-topics**

Lấy trending topics (Admin).

**URL:** `GET /api/chatbot/analytics/trending-topics?limit=10`

**Query Parameters:**
- `limit` (optional, default: 10)

**Response Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "topic": "đăng ký hoạt động",
      "count": 45,
      "avgConfidence": 0.82
    },
    {
      "topic": "điểm danh",
      "count": 30,
      "avgConfidence": 0.88
    }
  ]
}
```

---

### **16. GET /analytics/document-performance**

Lấy document performance metrics (Admin).

**URL:** `GET /api/chatbot/analytics/document-performance?timeRange=day`

**Response Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "documentId": "65a1b2c3d4e5f6g7h8i9j0k1",
      "title": "Hướng dẫn đăng ký",
      "retrievalCount": 15,
      "avgConfidence": 0.75,
      "avgRating": 4.2
    }
  ],
  "timeRange": "day"
}
```

---

### **17. GET /analytics/issues-report**

Lấy issues report từ feedback (Admin).

**URL:** `GET /api/chatbot/analytics/issues-report`

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "totalIssues": 5,
    "lowRatings": 3,
    "unanswered": 2,
    "issues": [
      {
        "messageId": "65a1b2c3d4e5f6g7h8i9j0k1",
        "query": "Câu hỏi không được trả lời",
        "rating": 1,
        "issue": "Không tìm thấy câu trả lời",
        "timestamp": "2025-12-14T10:00:00.000Z"
      }
    ]
  }
}
```

---

### **18. GET /messages**

Lấy danh sách messages (logs) - Admin.

**URL:** `GET /api/chatbot/messages?limit=50&page=1&source=rule&userId=xxx`

**Query Parameters:**
- `limit` (optional, default: 50)
- `page` (optional, default: 1)
- `source` (optional) - Filter: "rule" | "rag" | "fallback"
- `userId` (optional) - Filter by user ID

**Response Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "userId": {
        "_id": "691d6f94e1cf629df3cbd49",
        "username": "102220095"
      },
      "query": "đăng ký hoạt động",
      "answer": "Để đăng ký hoạt động...",
      "source": "rule",
      "confidence": 0.79,
      "scores": {
        "ruleScore": 0.79,
        "ragScore": null
      },
      "responseTime": 62,
      "timestamp": "2025-12-14T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 50,
    "pages": 3
  }
}
```

---

### **19. POST /test-query**

Test một query để xem rule/RAG match (Admin tool).

**URL:** `POST /api/chatbot/test-query`

**Request Body:**
```json
{
  "query": "đăng ký hoạt động"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "query": "đăng ký hoạt động",
    "ruleMatch": {
      "answer": "Để đăng ký hoạt động...",
      "confidence": 0.79,
      "matchedRuleId": "65a1b2c3d4e5f6g7h8i9j0k1"
    },
    "ragMatch": {
      "answer": "Hướng dẫn đăng ký...",
      "confidence": 0.65,
      "retrievedDocIds": ["65a1b2c3d4e5f6g7h8i9j0k2"]
    }
  }
}
```

---

### **20. POST /feedback**

Submit feedback cho một câu trả lời.

**URL:** `POST /api/chatbot/feedback`

**Request Body:**
```json
{
  "messageId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "rating": 5,
  "issue": "Không có vấn đề",
  "suggestion": "Câu trả lời rất hữu ích",
  "isHelpful": true
}
```

**Required Fields:**
- `messageId` (string) - ID của message từ `/ask-anything`
- `rating` (number, 1-5) - Đánh giá

**Optional Fields:**
- `issue` (string) - Vấn đề gặp phải
- `suggestion` (string) - Gợi ý cải thiện
- `isHelpful` (boolean) - Có hữu ích không

**Response Success (201):**
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
    "messageId": "65a1b2c3d4e5f6g7h8i9j0k1",
    "userId": "691d6f94e1cf629df3cbd49",
    "rating": 5,
    "issue": "Không có vấn đề",
    "suggestion": "Câu trả lời rất hữu ích",
    "isHelpful": true,
    "createdAt": "2025-12-14T10:00:00.000Z"
  },
  "message": "Feedback submitted successfully"
}
```

**Frontend Example:**
```javascript
const submitFeedback = async (messageId, rating, issue, suggestion, isHelpful) => {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:5000/api/chatbot/feedback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      messageId,
      rating,
      issue,
      suggestion,
      isHelpful
    })
  });
  const data = await response.json();
  return data;
};
```

---

### **21. GET /feedback**

Lấy danh sách feedback (Admin).

**URL:** `GET /api/chatbot/feedback?limit=20&page=1&rating=5&source=rule`

**Query Parameters:**
- `limit` (optional, default: 20)
- `page` (optional, default: 1)
- `rating` (optional) - Filter by rating (1-5)
- `source` (optional) - Filter: "rule" | "rag" | "fallback"
- `issue` (optional) - Filter by issue type

**Response Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
      "messageId": "65a1b2c3d4e5f6g7h8i9j0k1",
      "userId": "691d6f94e1cf629df3cbd49",
      "rating": 5,
      "issue": null,
      "suggestion": "Câu trả lời rất hữu ích",
      "isHelpful": true,
      "createdAt": "2025-12-14T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 20,
    "pages": 2
  }
}
```

---

## 🔧 Common Response Formats

### **Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### **Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

### **Pagination Response:**
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

## 📝 Frontend Integration Examples

### **React Hook Example:**

```javascript
// hooks/useChatbot.js
import { useState } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const useChatbot = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const askQuestion = async (question) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/chatbot/ask-anything`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ question })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Lỗi khi gửi câu hỏi');
      }
      
      return data.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getHistory = async (page = 1, limit = 20) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/chatbot/history?limit=${limit}&page=${page}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Lỗi khi lấy lịch sử');
      }
      
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async (messageId, rating, issue, suggestion, isHelpful) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/chatbot/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messageId,
          rating,
          issue,
          suggestion,
          isHelpful
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Lỗi khi submit feedback');
      }
      
      return data.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    askQuestion,
    getHistory,
    submitFeedback,
    loading,
    error
  };
};
```

### **Usage in Component:**

```javascript
// components/ChatBot.jsx
import { useChatbot } from '../hooks/useChatbot';

const ChatBot = () => {
  const { askQuestion, getHistory, submitFeedback, loading, error } = useChatbot();
  const [messages, setMessages] = useState([]);

  const handleSend = async (question) => {
    try {
      const result = await askQuestion(question);
      
      // Add user message
      setMessages(prev => [...prev, {
        type: 'user',
        content: question,
        timestamp: new Date()
      }]);
      
      // Add bot response
      setMessages(prev => [...prev, {
        type: 'bot',
        content: result.answer,
        source: result.source,
        confidence: result.confidence,
        messageId: result._id, // For feedback
        timestamp: new Date()
      }]);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleFeedback = async (messageId, rating) => {
    try {
      await submitFeedback(messageId, rating);
      alert('Cảm ơn bạn đã phản hồi!');
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <div>
      {/* Chat UI */}
    </div>
  );
};
```

---

## 🎯 Important Notes

1. **Base URL:** Tất cả endpoints bắt đầu với `/api/chatbot`
2. **Authentication:** Tất cả requests cần JWT token
3. **Content-Type:** 
   - JSON requests: `application/json`
   - File upload: `multipart/form-data` (FormData)
4. **Error Handling:** Luôn check `response.ok` và `data.success`
5. **Pagination:** Sử dụng `limit` và `page` cho các list endpoints
6. **Source Values:** `"rule"` | `"rag"` | `"fallback"`

---

## 📊 Response Data Structure

### **ask-anything Response:**
```typescript
interface AskResponse {
  answer: string;              // Câu trả lời
  source: "rule" | "rag" | "fallback";  // Nguồn trả lời
  confidence: number;          // Độ tin cậy (0-1)
  matchedRuleId?: string;     // ID rule (nếu source = "rule")
  retrievedDocIds?: string[]; // ID documents (nếu source = "rag")
  responseTime: number;        // Thời gian xử lý (ms)
  scores: {
    ruleScore: number | null;
    ragScore: number | null;
  };
  _id?: string;               // Message ID (để submit feedback)
}
```

### **History Item:**
```typescript
interface ChatMessage {
  _id: string;
  userId: string;
  query: string;
  answer: string;
  source: "rule" | "rag" | "fallback";
  confidence: number;
  scores: {
    ruleScore: number | null;
    ragScore: number | null;
  };
  responseTime: number;
  timestamp: string;  // ISO date string
}
```

---

---

## 🚀 Phase 4: Advanced Features (Admin Only)

**Lưu ý:** Tất cả Phase 4 endpoints yêu cầu role `admin` (ngoại trừ một số endpoints public).

---

### **22. POST /feedback/:feedbackId/response**

Admin phản hồi feedback.

**URL:** `POST /api/chatbot/feedback/:feedbackId/response`

**Request Body:**
```json
{
  "response": "Cảm ơn bạn đã phản hồi. Chúng tôi đã cập nhật câu trả lời.",
  "actionTaken": "updated_rule",
  "tags": ["improved", "rule_update"]
}
```

**Response Success (200):**
```json
{
  "status": "success",
  "message": "Admin response submitted",
  "data": {
    "feedbackId": "65a1b2c3d4e5f6g7h8i9j0k1",
    "adminResponse": "Cảm ơn bạn đã phản hồi...",
    "actionTaken": "updated_rule",
    "tags": ["improved", "rule_update"],
    "respondedAt": "2025-12-14T10:00:00.000Z"
  }
}
```

---

### **23. POST /feedback/:feedbackId/close**

Đóng feedback issue.

**URL:** `POST /api/chatbot/feedback/:feedbackId/close`

**Request Body:**
```json
{
  "closureReason": "Đã được giải quyết"
}
```

**Response Success (200):**
```json
{
  "status": "success",
  "message": "Feedback closed",
  "data": {
    "feedbackId": "65a1b2c3d4e5f6g7h8i9j0k1",
    "status": "closed",
    "closureReason": "Đã được giải quyết",
    "closedAt": "2025-12-14T10:00:00.000Z"
  }
}
```

---

### **24. GET /feedback/pending**

Lấy danh sách feedback đang chờ xử lý.

**URL:** `GET /api/chatbot/feedback/pending?page=1&limit=20&priority=high`

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 20)
- `priority` (optional) - "high" | "medium" | "low"

**Response Success (200):**
```json
{
  "status": "success",
  "data": {
    "pending": [
      {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
        "messageId": "65a1b2c3d4e5f6g7h8i9j0k2",
        "rating": 1,
        "issue": "Câu trả lời không chính xác",
        "priority": "high",
        "createdAt": "2025-12-14T10:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 20
    }
  }
}
```

---

### **25. POST /documents/auto-categorize**

Tự động phân loại documents.

**URL:** `POST /api/chatbot/documents/auto-categorize`

**Request Body:**
```json
{
  "categoryFilter": ["other"]
}
```

**Response Success (200):**
```json
{
  "status": "success",
  "message": "Documents recategorized",
  "data": {
    "processed": 10,
    "updated": 8,
    "categories": {
      "faq": 3,
      "guide": 5
    }
  }
}
```

---

### **26. GET /documents/:documentId/similar**

Tìm documents tương tự.

**URL:** `GET /api/chatbot/documents/:documentId/similar`

**Response Success (200):**
```json
{
  "status": "success",
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
      "title": "Hướng dẫn tương tự",
      "similarity": 0.85
    }
  ]
}
```

---

### **27. POST /documents/deduplicate**

Loại bỏ documents trùng lặp.

**URL:** `POST /api/chatbot/documents/deduplicate`

**Request Body:**
```json
{
  "mergeStrategy": "keep_newest"
}
```

**Response Success (200):**
```json
{
  "status": "success",
  "message": "Deduplication complete",
  "data": {
    "duplicatesFound": 5,
    "merged": 5,
    "kept": 3
  }
}
```

---

### **28. POST /documents/bulk-import**

Import nhiều documents cùng lúc.

**URL:** `POST /api/chatbot/documents/bulk-import`

**Request Body:**
```json
{
  "documents": [
    {
      "title": "Document 1",
      "content": "Content 1...",
      "category": "guide"
    },
    {
      "title": "Document 2",
      "content": "Content 2...",
      "category": "faq"
    }
  ],
  "options": {
    "generateEmbeddings": true,
    "skipDuplicates": true
  }
}
```

**Response Success (200):**
```json
{
  "status": "success",
  "message": "Documents imported",
  "data": {
    "imported": 2,
    "skipped": 0,
    "errors": []
  }
}
```

---

### **29. POST /documents/bulk-import-csv**

Import documents từ CSV.

**URL:** `POST /api/chatbot/documents/bulk-import-csv`

**Request Body:**
```json
{
  "csvContent": "title,content,category\nDoc 1,Content 1,guide\nDoc 2,Content 2,faq",
  "options": {
    "generateEmbeddings": true
  }
}
```

**Response Success (200):**
```json
{
  "status": "success",
  "message": "CSV imported",
  "data": {
    "imported": 2,
    "errors": []
  }
}
```

---

### **30. POST /cache/warmup**

Warmup embedding cache.

**URL:** `POST /api/chatbot/cache/warmup`

**Request Body:**
```json
{
  "documentIds": ["65a1b2c3d4e5f6g7h8i9j0k1", "65a1b2c3d4e5f6g7h8i9j0k2"]
}
```

**Response Success (200):**
```json
{
  "status": "success",
  "message": "Embedding cache warmed up",
  "data": {
    "cached": 2,
    "cacheSize": 100
  }
}
```

---

### **31. GET /cache/stats**

Lấy thống kê cache.

**URL:** `GET /api/chatbot/cache/stats`

**Response Success (200):**
```json
{
  "status": "success",
  "data": {
    "size": 100,
    "hits": 850,
    "misses": 150,
    "hitRate": 0.85
  }
}
```

---

### **32. POST /experiments**

Tạo A/B test experiment.

**URL:** `POST /api/chatbot/experiments`

**Request Body:**
```json
{
  "name": "Test Rule vs RAG",
  "description": "Testing which performs better",
  "controlVersion": "rule",
  "treatmentVersion": "rag",
  "splitRatio": 0.5,
  "startDate": "2025-12-15T00:00:00.000Z",
  "endDate": "2025-12-20T23:59:59.000Z"
}
```

**Response Success (201):**
```json
{
  "status": "success",
  "message": "A/B test created",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "name": "Test Rule vs RAG",
    "status": "active",
    "createdAt": "2025-12-14T10:00:00.000Z"
  }
}
```

---

### **33. GET /experiments/:experimentId/results**

Lấy kết quả A/B test.

**URL:** `GET /api/chatbot/experiments/:experimentId/results`

**Response Success (200):**
```json
{
  "status": "success",
  "data": {
    "experimentId": "65a1b2c3d4e5f6g7h8i9j0k1",
    "control": {
      "participants": 50,
      "avgRating": 4.2,
      "avgConfidence": 0.75
    },
    "treatment": {
      "participants": 50,
      "avgRating": 4.5,
      "avgConfidence": 0.82
    },
    "winner": "treatment"
  }
}
```

---

### **34. GET /dashboard**

Lấy dashboard data (Phase 4).

**URL:** `GET /api/chatbot/dashboard?timeRange=day`

**Response Success (200):**
```json
{
  "status": "success",
  "data": {
    "overview": {
      "totalQueries": 150,
      "satisfactionRate": 0.85
    },
    "performance": {
      "avgResponseTime": 62
    }
  }
}
```

---

### **35. GET /dashboard/satisfaction**

Lấy satisfaction summary.

**URL:** `GET /api/chatbot/dashboard/satisfaction?timeRange=day`

**Response Success (200):**
```json
{
  "status": "success",
  "data": {
    "avgRating": 4.2,
    "ratingDistribution": {
      "5": 60,
      "4": 30,
      "3": 5,
      "2": 3,
      "1": 2
    },
    "satisfactionRate": 0.85
  }
}
```

---

### **36. GET /dashboard/issues**

Lấy issue tracking dashboard.

**URL:** `GET /api/chatbot/dashboard/issues`

**Response Success (200):**
```json
{
  "status": "success",
  "data": {
    "openIssues": 5,
    "resolvedIssues": 20,
    "issuesByPriority": {
      "high": 2,
      "medium": 2,
      "low": 1
    }
  }
}
```

---

### **37. GET /fine-tuning/candidates**

Lấy candidates cho fine-tuning.

**URL:** `GET /api/chatbot/fine-tuning/candidates?minFeedbackCount=5&minNegativeRating=2&timeRange=week`

**Query Parameters:**
- `minFeedbackCount` (optional, default: 5)
- `minNegativeRating` (optional, default: 2)
- `timeRange` (optional) - "day" | "week" | "month"

**Response Success (200):**
```json
{
  "status": "success",
  "data": [
    {
      "query": "Câu hỏi cần cải thiện",
      "currentAnswer": "Câu trả lời hiện tại",
      "feedbackCount": 10,
      "avgRating": 2.1,
      "suggestions": ["Cải thiện câu trả lời"]
    }
  ]
}
```

---

### **38. GET /documents/analysis/effectiveness**

Phân tích hiệu quả documents.

**URL:** `GET /api/chatbot/documents/analysis/effectiveness`

**Response Success (200):**
```json
{
  "status": "success",
  "data": [
    {
      "documentId": "65a1b2c3d4e5f6g7h8i9j0k1",
      "title": "Hướng dẫn đăng ký",
      "retrievalCount": 15,
      "avgConfidence": 0.75,
      "avgRating": 4.2,
      "effectiveness": "high"
    }
  ]
}
```

---

### **39. GET /insights/training**

Lấy training insights.

**URL:** `GET /api/chatbot/insights/training`

**Response Success (200):**
```json
{
  "status": "success",
  "data": {
    "topImprovements": [
      {
        "area": "Rule matching",
        "impact": "high",
        "recommendations": ["Thêm keywords", "Tăng priority"]
      }
    ],
    "trainingData": {
      "totalExamples": 100,
      "positiveExamples": 80,
      "negativeExamples": 20
    }
  }
}
```

---

## 📝 Phase 4 Response Format

**Lưu ý:** Phase 4 endpoints sử dụng format khác:
```json
{
  "status": "success" | "error",
  "message": "Optional message",
  "data": { ... }
}
```

Thay vì:
```json
{
  "success": true | false,
  "data": { ... }
}
```

---

**Document Version:** 1.0  
**Last Updated:** December 2025  
**Base URL:** `http://localhost:5000/api/chatbot`

---

*Tài liệu này dành cho Frontend team để tích hợp Chatbot API*

