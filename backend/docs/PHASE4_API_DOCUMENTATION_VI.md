# 📚 Hướng Dẫn Tích Hợp API Phase 4 - Frontend React

**Phiên bản**: 1.0  
**Ngày cập nhật**: 15/12/2025  
**Dành cho**: Frontend React Developers  
**Công nghệ**: React + Axios + JWT

---

## 📌 Mục Lục

1. [Giới Thiệu Chung](#-giới-thiệu-chung)
2. [Xác Thực & Token](#-xác-thực--token)
3. [API Feedback Closure (Quản Lý Phản Hồi)](#-api-feedback-closure)
4. [API Auto-Categorization (Tự Động Phân Loại)](#-api-auto-categorization)
5. [API Similarity Detection (Phát Hiện Trùng Lặp)](#-api-similarity-detection)
6. [API Bulk Import (Nhập Hàng Loạt)](#-api-bulk-import)
7. [API Embedding Cache (Bộ Nhớ Cache)](#-api-embedding-cache)
8. [API A/B Testing (Thử Nghiệm AB)](#-api-ab-testing)
9. [API Dashboard (Bảng Điều Khiển)](#-api-dashboard)
10. [API Fine-tuning (Tinh Chỉnh)](#-api-fine-tuning)
11. [Xử Lý Error Chung](#-xử-lý-error-chung)
12. [Best Practices cho React](#-best-practices-cho-react)

---

## 🎯 Giới Thiệu Chung

### API Base URL
```
http://localhost:3001/api/chatbot
```

### Response Format Chung
Tất cả API trả về format JSON sau:
```json
{
  "status": "success" | "error",
  "message": "Mô tả chi tiết",
  "data": { },
  "error": null | "Chi tiết lỗi"
}
```

### HTTP Status Codes
- **200**: Thành công (GET, POST, PUT)
- **201**: Tạo mới thành công (POST)
- **400**: Request không hợp lệ (validation error)
- **401**: Chưa xác thực (không có token hoặc token hết hạn)
- **403**: Không có quyền (không phải admin)
- **404**: Tài nguyên không tìm thấy
- **500**: Lỗi server

---

## 🔐 Xác Thực & Token

### Cách Sử Dụng Token
Tất cả API (trừ login/register) cần token JWT trong header `Authorization`:

```javascript
// File: src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
});

// Thêm token vào mỗi request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Xử lý token hết hạn
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token hết hạn, redirect login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### Sử Dụng trong Component
```javascript
import apiClient from '../services/api';

// GET
const response = await apiClient.get('/chatbot/dashboard');

// POST
const response = await apiClient.post('/chatbot/feedback/123/response', {
  response: 'Thank you for feedback'
});
```

---

# 📋 API FEEDBACK CLOSURE

## 1️⃣ Tổng Quan

API này dùng để **quản lý phản hồi người dùng**:
- Cấp quản trị viên có thể **trả lời** phản hồi
- **Đóng** phản hồi sau khi xử lý
- **Xem** danh sách phản hồi chờ review

**Khi nào dùng**: Khi cần quản lý feedback từ người dùng (chỉ admin)

---

## 2️⃣ Endpoint 1: Trả Lời Phản Hồi

### Endpoint
```
POST /chatbot/feedback/{feedbackId}/response
```

### Headers
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

### Path Parameters
| Tên | Kiểu | Bắt buộc | Ý nghĩa |
|-----|------|----------|---------|
| feedbackId | string | ✅ | ID của feedback cần trả lời |

### Request Body
```json
{
  "response": "string - Nội dung trả lời từ admin",
  "actionTaken": "string - Hành động đã thực hiện (tùy chọn)",
  "tags": ["array", "of", "tags"]  // Tùy chọn
}
```

### Ví Dụ React (Axios)
```javascript
const submitAdminResponse = async (feedbackId) => {
  try {
    const response = await apiClient.post(
      `/chatbot/feedback/${feedbackId}/response`,
      {
        response: "Chúng tôi đã cải thiện điểm này. Vui lòng thử lại.",
        actionTaken: "Updated document",
        tags: ["urgent", "fixed", "documentation"]
      }
    );
    
    console.log("Trả lời thành công:", response.data);
    // Refresh danh sách feedback
    loadPendingFeedback();
  } catch (error) {
    handleError(error);
  }
};
```

### Response - Thành Công (200)
```json
{
  "status": "success",
  "message": "Admin response submitted",
  "data": {
    "_id": "feedback123",
    "messageId": "msg456",
    "userId": "user789",
    "rating": 2,
    "query": "Tại sao câu trả lời không rõ ràng?",
    "answer": "Đó là câu trả lời chi tiết...",
    "adminNotes": "Chúng tôi đã cải thiện điểm này.",
    "isReviewed": true,
    "adminId": "admin001",
    "reviewedAt": "2025-12-15T10:30:00Z",
    "adminResponse": {
      "actionTaken": "Updated document",
      "tags": ["urgent", "fixed"],
      "timestamp": "2025-12-15T10:30:00Z"
    }
  }
}
```

### Response - Thất Bại (400)
```json
{
  "status": "error",
  "message": "Feedback not found",
  "data": null,
  "error": "Không tìm thấy feedback với ID này"
}
```

### Error Handling cho Frontend
```javascript
const handleAdminResponseError = (error) => {
  if (error.response?.status === 400) {
    // Feedback không tìm thấy
    alert("Phản hồi không tìm thấy");
  } else if (error.response?.status === 401) {
    // Chưa đăng nhập
    redirectToLogin();
  } else if (error.response?.status === 403) {
    // Không phải admin
    alert("Bạn không có quyền trả lời phản hồi");
  } else {
    alert("Lỗi server, vui lòng thử lại");
  }
};
```

---

## 3️⃣ Endpoint 2: Đóng Phản Hồi

### Endpoint
```
POST /chatbot/feedback/{feedbackId}/close
```

### Path Parameters
| Tên | Kiểu | Bắt buộc | Ý nghĩa |
|-----|------|----------|---------|
| feedbackId | string | ✅ | ID của feedback cần đóng |

### Request Body
```json
{
  "closureReason": "resolved" | "duplicate" | "invalid" | "working_as_intended" | "other"
}
```

### Ví Dụ React
```javascript
const closeFeedback = async (feedbackId, reason) => {
  try {
    const response = await apiClient.post(
      `/chatbot/feedback/${feedbackId}/close`,
      {
        closureReason: reason // "resolved"
      }
    );
    
    console.log("Đóng feedback thành công");
    loadPendingFeedback(); // Refresh danh sách
  } catch (error) {
    console.error("Lỗi:", error.response?.data?.message);
  }
};

// Sử dụng
closeFeedback('feedback123', 'resolved');
```

### Response - Thành Công (200)
```json
{
  "status": "success",
  "message": "Feedback closed",
  "data": {
    "_id": "feedback123",
    "isClosed": true,
    "closureReason": "resolved",
    "closedAt": "2025-12-15T10:35:00Z"
  }
}
```

---

## 4️⃣ Endpoint 3: Lấy Danh Sách Phản Hồi Chờ Review

### Endpoint
```
GET /chatbot/feedback/pending
```

### Headers
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

### Query Parameters
| Tên | Kiểu | Bắt buộc | Ý nghĩa |
|-----|------|----------|---------|
| page | number | ❌ | Trang (default: 1) |
| limit | number | ❌ | Số items/trang (default: 20) |
| priority | string | ❌ | "high" / "medium" / "low" / "all" |

### Ví Dụ React
```javascript
const [pendingFeedback, setPendingFeedback] = useState([]);
const [currentPage, setCurrentPage] = useState(1);

const loadPendingFeedback = async (page = 1, priority = 'high') => {
  try {
    const response = await apiClient.get('/chatbot/feedback/pending', {
      params: {
        page,
        limit: 20,
        priority  // 'high' = rating <= 2, 'low' = rating >= 4
      }
    });
    
    setPendingFeedback(response.data.data);
    setCurrentPage(page);
  } catch (error) {
    console.error("Lỗi:", error);
  }
};

// Gọi API
useEffect(() => {
  loadPendingFeedback(1, 'high'); // Tải feedback ưu tiên cao
}, []);
```

### Response - Thành Công (200)
```json
{
  "status": "success",
  "data": {
    "data": [
      {
        "_id": "feedback001",
        "messageId": "msg001",
        "userId": "user001",
        "query": "Tại sao câu trả lời không rõ ràng?",
        "answer": "...",
        "source": "rag",
        "rating": 1,
        "issue": "unclear",
        "suggestion": "Hãy dùng ngôn ngữ đơn giản hơn",
        "isReviewed": false,
        "isClosed": false,
        "timestamp": "2025-12-14T14:30:00Z",
        "userId": {
          "_id": "user001",
          "email": "user@example.com",
          "name": "Nguyễn Văn A"
        }
      }
    ],
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 20,
      "pages": 3
    }
  }
}
```

---

# 🏷️ API AUTO-CATEGORIZATION

## Tổng Quan
API này **tự động phân loại tài liệu** bằng LLM AI:
- Phân loại: FAQ, Guide, Policy, Regulation, Procedure
- Tự động thêm tags
- Xử lý hàng loạt

**Khi nào dùng**: Lúc cập nhật tài liệu hàng loạt (admin only)

---

## Endpoint: Tự Động Phân Loại

### Endpoint
```
POST /chatbot/documents/auto-categorize
```

### Request Body
```json
{
  "categoryFilter": "faq" // Tùy chọn: chỉ phân loại lại 1 category
}
```

### Ví Dụ React
```javascript
const autoCategorizeDocs = async () => {
  try {
    setLoading(true);
    const response = await apiClient.post(
      '/chatbot/documents/auto-categorize',
      {
        categoryFilter: 'faq' // Hoặc không gửi để phân loại tất cả
      }
    );
    
    console.log("Kết quả phân loại:", response.data.data);
    // Updated: 45, Failed: 2
    showSuccessMessage(`Đã cập nhật ${response.data.data.updated} tài liệu`);
  } catch (error) {
    showErrorMessage(error.response?.data?.message);
  } finally {
    setLoading(false);
  }
};
```

### Response - Thành Công (200)
```json
{
  "status": "success",
  "message": "Documents recategorized",
  "data": {
    "total": 100,
    "updated": 45,
    "failed": 2,
    "changes": [
      {
        "documentId": "doc123",
        "oldCategory": "other",
        "newCategory": "faq",
        "tagsAdded": ["frequently-asked", "help"]
      }
    ]
  }
}
```

---

# 🔍 API SIMILARITY DETECTION

## Tổng Quan
API phát hiện **tài liệu trùng lặp**:
- Tìm tài liệu giống nhau
- Tự động hợp nhất
- Xóa duplicates

**Khi nào dùng**: Quản lý quality tài liệu

---

## Endpoint 1: Tìm Tài Liệu Giống Nhau

### Endpoint
```
GET /chatbot/documents/{documentId}/similar
```

### Path Parameters
| Tên | Kiểu | Bắt buộc | Ý nghĩa |
|-----|------|----------|---------|
| documentId | string | ✅ | ID tài liệu cần so sánh |

### Ví Dụ React
```javascript
const findSimilarDocuments = async (documentId) => {
  try {
    const response = await apiClient.get(
      `/chatbot/documents/${documentId}/similar`
    );
    
    console.log("Tài liệu giống:", response.data.data);
    // Hiển thị danh sách
  } catch (error) {
    console.error("Lỗi:", error);
  }
};
```

### Response - Thành Công (200)
```json
{
  "status": "success",
  "data": [
    {
      "documentId": "doc456",
      "title": "FAQ Tương Tự",
      "category": "faq",
      "contentSimilarity": 0.85,
      "embeddingSimilarity": 0.82,
      "combinedScore": 0.84
    },
    {
      "documentId": "doc789",
      "title": "Hướng Dẫn Liên Quan",
      "category": "guide",
      "contentSimilarity": 0.72,
      "embeddingSimilarity": 0.68,
      "combinedScore": 0.71
    }
  ]
}
```

---

## Endpoint 2: Tự Động Hợp Nhất Trùng Lặp

### Endpoint
```
POST /chatbot/documents/deduplicate
```

### Request Body
```json
{
  "mergeStrategy": "keep_latest" // Giữ tài liệu mới nhất
}
```

### Ví Dụ React
```javascript
const deduplicateDocuments = async () => {
  try {
    const response = await apiClient.post(
      '/chatbot/documents/deduplicate',
      {
        mergeStrategy: 'keep_latest'
      }
    );
    
    const result = response.data.data;
    alert(`Tìm ${result.duplicatesFound} cặp trùng, xóa ${result.archived}`);
  } catch (error) {
    console.error("Lỗi:", error);
  }
};
```

### Response - Thành Công (200)
```json
{
  "status": "success",
  "message": "Deduplication complete",
  "data": {
    "duplicatesFound": 12,
    "merged": 8,
    "archived": 4,
    "failed": 0
  }
}
```

---

# 📤 API BULK IMPORT

## Tổng Quan
API **nhập hàng loạt** tài liệu từ:
- JSON array
- CSV file
- JSONL format

**Khi nào dùng**: Import từ nguồn bên ngoài

---

## Endpoint 1: Nhập từ JSON

### Endpoint
```
POST /chatbot/documents/bulk-import
```

### Request Body
```json
{
  "documents": [
    {
      "title": "FAQ: Cách Đăng Nhập",
      "content": "Nội dung tài liệu...",
      "category": "faq",
      "tags": ["login", "help"],
      "priority": 5
    }
  ],
  "options": {
    "autoEmbed": true,
    "autoCategory": true,
    "autoTag": true,
    "deDuplicate": true
  }
}
```

### Ví Dụ React
```javascript
const importDocuments = async (files) => {
  try {
    setLoading(true);
    
    const documents = [
      {
        title: "Cách Đặt Lịch",
        content: "Nhấn vào nút Đặt Lịch trên trang chủ...",
        category: "guide"
      }
    ];
    
    const response = await apiClient.post(
      '/chatbot/documents/bulk-import',
      {
        documents,
        options: {
          autoEmbed: true,
          autoCategory: true,
          autoTag: true,
          deDuplicate: true
        }
      }
    );
    
    console.log(response.data.data);
    // { imported: 90, failed: 2, duplicates: 8 }
  } catch (error) {
    showErrorMessage(error.response?.data?.message);
  } finally {
    setLoading(false);
  }
};
```

### Response - Thành Công (200)
```json
{
  "status": "success",
  "message": "Documents imported",
  "data": {
    "total": 100,
    "imported": 90,
    "failed": 2,
    "duplicates": 8,
    "errors": [
      {
        "index": 5,
        "error": "Missing title or content"
      }
    ]
  }
}
```

---

## Endpoint 2: Nhập từ CSV

### Endpoint
```
POST /chatbot/documents/bulk-import-csv
```

### Request Body
```json
{
  "csvContent": "title,content,category\nFAQ 1,Content 1,faq\nGuide 1,Content 2,guide",
  "options": {
    "autoEmbed": true,
    "autoCategory": false,
    "autoTag": true,
    "deDuplicate": true
  }
}
```

### Ví Dụ React
```javascript
const importFromCSV = async (csvFile) => {
  try {
    const text = await csvFile.text();
    
    const response = await apiClient.post(
      '/chatbot/documents/bulk-import-csv',
      {
        csvContent: text,
        options: {
          autoEmbed: true,
          autoCategory: true,
          autoTag: true,
          deDuplicate: true
        }
      }
    );
    
    console.log("Import result:", response.data.data);
  } catch (error) {
    console.error("Lỗi import:", error);
  }
};

// Sử dụng
<input 
  type="file" 
  accept=".csv"
  onChange={(e) => importFromCSV(e.target.files[0])}
/>
```

### Response - Thành Công (200)
```json
{
  "status": "success",
  "message": "CSV imported",
  "data": {
    "total": 50,
    "imported": 48,
    "failed": 2,
    "duplicates": 0
  }
}
```

---

# 💾 API EMBEDDING CACHE

## Tổng Quan
API quản lý **cache embeddings** để tối ưu hiệu năng:
- Warm-up cache
- Xem thống kê cache

**Khi nào dùng**: Tối ưu performance (admin)

---

## Endpoint 1: Khởi Động Cache

### Endpoint
```
POST /chatbot/cache/warmup
```

### Request Body
```json
{
  "documentIds": ["doc1", "doc2"] // Tùy chọn, nếu không gửi = tất cả
}
```

### Ví Dụ React
```javascript
const warmupCache = async () => {
  try {
    const response = await apiClient.post(
      '/chatbot/cache/warmup',
      {
        documentIds: [] // Warmup tất cả
      }
    );
    
    const { total, cached, reembedded } = response.data.data;
    console.log(`Đã cache ${total} tài liệu`);
  } catch (error) {
    console.error("Lỗi:", error);
  }
};
```

### Response - Thành Công (200)
```json
{
  "status": "success",
  "message": "Embedding cache warmed up",
  "data": {
    "total": 200,
    "cached": 150,
    "reembedded": 50
  }
}
```

---

## Endpoint 2: Xem Thống Kê Cache

### Endpoint
```
GET /chatbot/cache/stats
```

### Ví Dụ React
```javascript
const [cacheStats, setCacheStats] = useState(null);

useEffect(() => {
  const fetchCacheStats = async () => {
    const response = await apiClient.get('/chatbot/cache/stats');
    setCacheStats(response.data.data);
  };
  
  fetchCacheStats();
}, []);

// Render
{cacheStats && (
  <div>
    <p>Hit Rate: {cacheStats.hitRate}</p>
    <p>Utilization: {cacheStats.utilization}</p>
  </div>
)}
```

### Response - Thành Công (200)
```json
{
  "status": "success",
  "data": {
    "hits": 1250,
    "misses": 350,
    "evictions": 45,
    "hitRate": "78.12%",
    "size": 850,
    "maxSize": 1000,
    "utilization": "85.00%"
  }
}
```

---

# 🧪 API A/B TESTING

## Tổng Quan
API **tạo và quản lý A/B test**:
- Tạo experiment
- Xem kết quả

**Khi nào dùng**: Test phiên bản mới của câu trả lời

---

## Endpoint 1: Tạo Experiment

### Endpoint
```
POST /chatbot/experiments
```

### Request Body
```json
{
  "name": "Tên của experiment",
  "description": "Mô tả chi tiết",
  "controlVersion": "v1",
  "treatmentVersion": "v2",
  "splitRatio": 50,
  "startDate": "2025-12-15",
  "endDate": "2025-12-22"
}
```

### Ví Dụ React
```javascript
const createABTest = async () => {
  try {
    const response = await apiClient.post(
      '/chatbot/experiments',
      {
        name: "Test Định Dạng Câu Trả Lời Mới",
        description: "So sánh cách trình bày thông tin",
        controlVersion: "old_format",
        treatmentVersion: "new_format",
        splitRatio: 50, // 50% user nhận control, 50% nhận treatment
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0]
      }
    );
    
    console.log("Experiment tạo thành công:", response.data.data);
    // { id: "exp_123", status: "active" }
  } catch (error) {
    console.error("Lỗi:", error);
  }
};
```

### Response - Thành Công (201)
```json
{
  "status": "success",
  "message": "A/B test created",
  "data": {
    "id": "exp_1702638600000_abc123def",
    "name": "Test Định Dạng Câu Trả Lời Mới",
    "status": "active",
    "controlVersion": "old_format",
    "treatmentVersion": "new_format",
    "splitRatio": 50,
    "startDate": "2025-12-15T00:00:00Z",
    "endDate": "2025-12-22T00:00:00Z"
  }
}
```

---

## Endpoint 2: Lấy Kết Quả Experiment

### Endpoint
```
GET /chatbot/experiments/{experimentId}/results
```

### Path Parameters
| Tên | Kiểu | Bắt buộc | Ý nghĩa |
|-----|------|----------|---------|
| experimentId | string | ✅ | ID của experiment |

### Ví Dụ React
```javascript
const getABTestResults = async (experimentId) => {
  try {
    const response = await apiClient.get(
      `/chatbot/experiments/${experimentId}/results`
    );
    
    const { control, treatment, winner, statisticalSignificance } = response.data.data;
    
    console.log(`Winner: ${winner}`);
    console.log(`Control avg rating: ${control.avgRating}`);
    console.log(`Treatment avg rating: ${treatment.avgRating}`);
    
    if (statisticalSignificance.significant) {
      console.log("Kết quả có ý nghĩa thống kê!");
    }
  } catch (error) {
    console.error("Lỗi:", error);
  }
};
```

### Response - Thành Công (200)
```json
{
  "status": "success",
  "data": {
    "experimentId": "exp_1702638600000_abc123def",
    "name": "Test Định Dạng Câu Trả Lời",
    "status": "active",
    "control": {
      "count": 215,
      "avgRating": 3.8,
      "sampleSize": 215
    },
    "treatment": {
      "count": 220,
      "avgRating": 4.2,
      "sampleSize": 220
    },
    "winner": "treatment",
    "statisticalSignificance": {
      "significant": true,
      "confidence": 0.95
    },
    "confidenceLevel": 0.95
  }
}
```

---

# 📊 API DASHBOARD

## Tổng Quan
API lấy **dữ liệu dashboard** để hiển thị:
- Tổng quan metrics
- Sự hài lòng người dùng
- Vấn đề cần giải quyết

**Khi nào dùng**: Load dữ liệu cho dashboard

---

## Endpoint 1: Lấy Tất Cả Dữ Liệu Dashboard

### Endpoint
```
GET /chatbot/dashboard
```

### Query Parameters
| Tên | Kiểu | Bắt buộc | Giá trị |
|-----|------|----------|--------|
| timeRange | string | ❌ | "day" / "week" / "month" (default: "week") |

### Ví Dụ React
```javascript
const [dashboardData, setDashboardData] = useState(null);

useEffect(() => {
  const fetchDashboard = async () => {
    try {
      const response = await apiClient.get('/chatbot/dashboard', {
        params: {
          timeRange: 'week'
        }
      });
      
      setDashboardData(response.data.data);
    } catch (error) {
      console.error("Lỗi:", error);
    }
  };
  
  fetchDashboard();
}, []);

// Render
{dashboardData && (
  <div>
    <h2>Tổng câu hỏi: {dashboardData.summary.totalQueries}</h2>
    <h2>Đánh giá trung bình: {dashboardData.summary.avgRating}/5</h2>
  </div>
)}
```

### Response - Thành Công (200)
```json
{
  "status": "success",
  "data": {
    "summary": {
      "totalQueries": 1250,
      "totalFeedback": 320,
      "feedbackRate": 25,
      "avgRating": 3.85
    },
    "satisfaction": {
      "avgRating": 3.85,
      "positivePercentage": 68,
      "satisfiedCount": 218
    },
    "sourceDistribution": {
      "rule": {
        "count": 400,
        "percentage": 32
      },
      "rag": {
        "count": 650,
        "percentage": 52
      },
      "fallback": {
        "count": 200,
        "percentage": 16
      }
    },
    "responseTimeStats": {
      "avgTime": 245,
      "minTime": 50,
      "maxTime": 2500
    },
    "documentPerformance": [
      {
        "documentId": "doc123",
        "title": "Hướng dẫn đặt lịch",
        "retrievalCount": 45
      }
    ],
    "userEngagement": {
      "activeUsers": 180,
      "avgQueriesPerUser": 6.94,
      "feedbackParticipationRate": 25
    },
    "trends": [
      {
        "date": "2025-12-08",
        "count": 150
      }
    ]
  }
}
```

---

## Endpoint 2: Lấy Dữ Liệu Hài Lòng Người Dùng

### Endpoint
```
GET /chatbot/dashboard/satisfaction
```

### Query Parameters
| Tên | Kiểu | Giá trị |
|-----|------|--------|
| timeRange | string | "week" / "month" |

### Ví Dụ React
```javascript
const fetchSatisfactionData = async () => {
  const response = await apiClient.get(
    '/chatbot/dashboard/satisfaction',
    {
      params: { timeRange: 'month' }
    }
  );
  
  const data = response.data.data;
  console.log(`NPS Score: ${data.nps}`); // -100 đến 100
  console.log(`Đánh giá trung bình: ${data.avgRating}`);
};
```

### Response - Thành Công (200)
```json
{
  "status": "success",
  "data": {
    "totalRatings": 320,
    "avgRating": 3.85,
    "nps": 42,
    "ratingDistribution": {
      "1": 35,
      "2": 45,
      "3": 110,
      "4": 98,
      "5": 32
    },
    "sentimentBreakdown": {
      "positive": 41,
      "neutral": 34,
      "negative": 25
    }
  }
}
```

---

## Endpoint 3: Lấy Dữ Liệu Vấn Đề

### Endpoint
```
GET /chatbot/dashboard/issues
```

### Ví Dụ React
```javascript
const fetchIssuesDashboard = async () => {
  const response = await apiClient.get(
    '/chatbot/dashboard/issues'
  );
  
  const issues = response.data.data;
  // Render bảng các vấn đề theo mức độ
};
```

### Response - Thành Công (200)
```json
{
  "status": "success",
  "data": {
    "incomplete": {
      "count": 45,
      "avgRating": 2.3,
      "percentage": 14,
      "examples": [
        {
          "query": "Cách thanh toán?",
          "source": "rag",
          "rating": 2,
          "suggestion": "Thêm nhiều chi tiết về phương thức thanh toán"
        }
      ]
    },
    "unclear": {
      "count": 38,
      "avgRating": 2.4,
      "percentage": 12,
      "examples": [...]
    }
  }
}
```

---

# 🔧 API FINE-TUNING

## Tổng Quan
API phân tích **phản hồi để cải thiện**:
- Tìm tài liệu cần cập nhật
- Phân tích hiệu quả tài liệu
- Lấy insights từ feedback

**Khi nào dùng**: Tối ưu hóa tài liệu dựa trên feedback

---

## Endpoint 1: Tìm Candidates Cần Cải Thiện

### Endpoint
```
GET /chatbot/fine-tuning/candidates
```

### Query Parameters
| Tên | Kiểu | Giá trị |
|-----|------|--------|
| minFeedbackCount | number | Số feedback tối thiểu (default: 5) |
| minNegativeRating | number | Rating tối đa coi là "xấu" (default: 3) |
| timeRange | string | "week" / "month" / "quarter" |

### Ví Dụ React
```javascript
const findCandidatesForImprovement = async () => {
  try {
    const response = await apiClient.get(
      '/chatbot/fine-tuning/candidates',
      {
        params: {
          minFeedbackCount: 5,
          minNegativeRating: 3,
          timeRange: 'month'
        }
      }
    );
    
    console.log("Candidates cần cải thiện:", response.data.data);
  } catch (error) {
    console.error("Lỗi:", error);
  }
};
```

### Response - Thành Công (200)
```json
{
  "status": "success",
  "data": [
    {
      "source": "rag",
      "totalFeedback": 12,
      "avgRating": 2.5,
      "issues": {
        "incomplete": 5,
        "unclear": 4,
        "irrelevant": 3
      },
      "suggestions": [
        "Thêm ví dụ cụ thể",
        "Viết lại rõ ràng hơn"
      ],
      "examples": [...]
    }
  ]
}
```

---

## Endpoint 2: Phân Tích Hiệu Quả Tài Liệu

### Endpoint
```
GET /chatbot/documents/analysis/effectiveness
```

### Ví Dụ React
```javascript
const analyzeDocumentEffectiveness = async () => {
  const response = await apiClient.get(
    '/chatbot/documents/analysis/effectiveness'
  );
  
  const docs = response.data.data;
  
  // Lọc tài liệu cần revise
  const needsRevision = docs.filter(d => d.recommendation === 'revise');
  console.log(`${needsRevision.length} tài liệu cần sửa`);
};
```

### Response - Thành Công (200)
```json
{
  "status": "success",
  "data": [
    {
      "documentId": "doc123",
      "title": "Hướng dẫn thanh toán",
      "retrievalCount": 150,
      "avgConfidenceScore": 0.82,
      "avgFeedbackRating": 3.5,
      "feedbackCount": 28,
      "effectiveScore": 1.2,
      "recommendation": "monitor"
    },
    {
      "documentId": "doc456",
      "title": "FAQ xóa tài khoản",
      "retrievalCount": 45,
      "avgConfidenceScore": 0.45,
      "avgFeedbackRating": 2.1,
      "feedbackCount": 18,
      "effectiveScore": 3.8,
      "recommendation": "revise"
    }
  ]
}
```

---

## Endpoint 3: Lấy Training Insights

### Endpoint
```
GET /chatbot/insights/training
```

### Ví Dụ React
```javascript
const getTrainingInsights = async () => {
  const response = await apiClient.get(
    '/chatbot/insights/training'
  );
  
  const insights = response.data.data;
  
  console.log(`Tổng feedback: ${insights.totalFeedback}`);
  console.log(`Vấn đề hàng đầu:`, insights.topImprovementAreas);
  console.log(`Sources thành công:`, insights.successSources);
};
```

### Response - Thành Công (200)
```json
{
  "status": "success",
  "data": {
    "totalFeedback": 420,
    "avgRating": 3.75,
    "topImprovementAreas": [
      {
        "area": "incomplete",
        "count": 85
      },
      {
        "area": "unclear",
        "count": 62
      }
    ],
    "successSources": [
      {
        "source": "rule",
        "count": 280
      },
      {
        "source": "rag",
        "count": 140
      }
    ],
    "userSuggestions": [
      {
        "suggestion": "Thêm video hướng dẫn",
        "source": "faq",
        "rating": 2
      }
    ]
  }
}
```

---

# ⚠️ Xử Lý Error Chung

## Các Lỗi Phổ Biến

### 401 - Unauthorized
```javascript
// Khi token hết hạn hoặc không có token
if (error.response?.status === 401) {
  localStorage.removeItem('token');
  window.location.href = '/login';
}
```

### 403 - Forbidden
```javascript
// Khi user không phải admin
if (error.response?.status === 403) {
  showErrorMessage("Bạn không có quyền truy cập tài nguyên này");
}
```

### 400 - Bad Request
```javascript
// Validation error, dữ liệu gửi không hợp lệ
if (error.response?.status === 400) {
  const errorMsg = error.response?.data?.message;
  showErrorMessage(errorMsg || "Dữ liệu không hợp lệ");
}
```

### 500 - Server Error
```javascript
// Lỗi server
if (error.response?.status === 500) {
  showErrorMessage("Lỗi server, vui lòng thử lại sau");
  // Log error
  console.error("Server error:", error.response?.data);
}
```

## Error Handler Tổng Quát
```javascript
// File: src/utils/errorHandler.js
export const handleApiError = (error) => {
  if (error.response) {
    // Server trả về response error
    const status = error.response.status;
    const message = error.response.data?.message || 'Lỗi không xác định';
    
    switch (status) {
      case 400:
        return { title: 'Dữ liệu không hợp lệ', message };
      case 401:
        localStorage.removeItem('token');
        window.location.href = '/login';
        return { title: 'Phiên hết hạn', message: 'Vui lòng đăng nhập lại' };
      case 403:
        return { title: 'Không có quyền', message };
      case 404:
        return { title: 'Không tìm thấy', message };
      case 500:
        return { title: 'Lỗi server', message };
      default:
        return { title: 'Lỗi', message };
    }
  } else if (error.request) {
    // Request được gửi nhưng không có response
    return { 
      title: 'Lỗi kết nối',
      message: 'Không thể kết nối tới server'
    };
  } else {
    // Lỗi khi setup request
    return {
      title: 'Lỗi',
      message: error.message
    };
  }
};

// Sử dụng
try {
  const response = await apiClient.get('/api/...');
} catch (error) {
  const { title, message } = handleApiError(error);
  showErrorMessage(message);
}
```

---

# 💡 Best Practices cho React

## 1️⃣ Quản Lý Token Properly

```javascript
// src/hooks/useAuth.js
const useAuth = () => {
  const getToken = () => localStorage.getItem('token');
  
  const isTokenExpired = (token) => {
    // Decode JWT và check exp
    const decoded = jwtDecode(token);
    return decoded.exp * 1000 < Date.now();
  };
  
  const isAuthenticated = () => {
    const token = getToken();
    return token && !isTokenExpired(token);
  };
  
  return { getToken, isAuthenticated };
};
```

## 2️⃣ Loading & Error State

```javascript
const MyComponent = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/chatbot/dashboard');
      setData(response.data.data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return <Spinner />;
  if (error) return <ErrorAlert error={error} />;
  if (!data) return <p>Không có dữ liệu</p>;
  
  return <Dashboard data={data} />;
};
```

## 3️⃣ Pagination

```javascript
const FeedbackList = () => {
  const [page, setPage] = useState(1);
  const [feedback, setFeedback] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  
  useEffect(() => {
    loadFeedback(page);
  }, [page]);
  
  const loadFeedback = async (pageNum) => {
    const response = await apiClient.get('/chatbot/feedback/pending', {
      params: { page: pageNum, limit: 20, priority: 'high' }
    });
    
    setFeedback(response.data.data);
    setTotalPages(response.data.pagination.pages);
  };
  
  return (
    <div>
      <FeedbackTable items={feedback} />
      <Pagination 
        current={page}
        total={totalPages}
        onChange={setPage}
      />
    </div>
  );
};
```

## 4️⃣ Debounce cho Search

```javascript
import debounce from 'lodash/debounce';

const SearchDocuments = () => {
  const [results, setResults] = useState([]);
  
  const searchAPI = debounce(async (keyword) => {
    // Không gọi API nếu keyword quá ngắn
    if (keyword.length < 2) {
      setResults([]);
      return;
    }
    
    const response = await apiClient.get('/chatbot/documents/search', {
      params: { q: keyword }
    });
    setResults(response.data.data);
  }, 500); // Chờ 500ms sau khi user stop typing
  
  const handleSearch = (e) => {
    searchAPI(e.target.value);
  };
  
  return (
    <div>
      <input onChange={handleSearch} placeholder="Tìm tài liệu..." />
      <ResultList items={results} />
    </div>
  );
};
```

## 5️⃣ Form Submission dengan Loading State

```javascript
const FeedbackForm = ({ feedbackId }) => {
  const [formData, setFormData] = useState({
    response: '',
    actionTaken: '',
    tags: []
  });
  const [submitting, setSubmitting] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      await apiClient.post(
        `/chatbot/feedback/${feedbackId}/response`,
        formData
      );
      
      showSuccessMessage('Trả lời thành công!');
      // Reset form
      setFormData({ response: '', actionTaken: '', tags: [] });
    } catch (error) {
      showErrorMessage(error.response?.data?.message);
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={formData.response}
        onChange={(e) => setFormData({
          ...formData,
          response: e.target.value
        })}
        disabled={submitting}
      />
      <button type="submit" disabled={submitting}>
        {submitting ? 'Đang gửi...' : 'Gửi Trả Lời'}
      </button>
    </form>
  );
};
```

## 6️⃣ Request Cancellation

```javascript
import axios from 'axios';

const MyComponent = () => {
  const cancelTokenRef = useRef(null);
  
  useEffect(() => {
    // Cleanup khi unmount
    return () => {
      if (cancelTokenRef.current) {
        cancelTokenRef.current.cancel('Component unmounted');
      }
    };
  }, []);
  
  const fetchData = async () => {
    try {
      cancelTokenRef.current = axios.CancelToken.source();
      
      const response = await apiClient.get('/chatbot/dashboard', {
        cancelToken: cancelTokenRef.current.token
      });
      
      // Handle response
    } catch (error) {
      if (!axios.isCancel(error)) {
        // Không phải cancel error
        console.error(error);
      }
    }
  };
};
```

## 7️⃣ Retry Logic cho Failed Requests

```javascript
export const retryRequest = async (
  requestFn,
  maxRetries = 3,
  delay = 1000
) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      // Không retry nếu là client error
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error;
      }
      
      // Chờ trước khi retry
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError;
};

// Sử dụng
const fetchDashboard = async () => {
  const data = await retryRequest(
    () => apiClient.get('/chatbot/dashboard'),
    3,
    1000
  );
  return data;
};
```

---

# 📝 Tóm Tắt Nhanh

| API | Phương Thức | URL | Quyền |
|-----|------------|-----|-------|
| Trả lời feedback | POST | `/feedback/{id}/response` | Admin |
| Đóng feedback | POST | `/feedback/{id}/close` | Admin |
| Danh sách feedback | GET | `/feedback/pending` | Admin |
| Tự động phân loại | POST | `/documents/auto-categorize` | Admin |
| Tìm giống nhau | GET | `/documents/{id}/similar` | User |
| Hợp nhất duplicate | POST | `/documents/deduplicate` | Admin |
| Import JSON/CSV | POST | `/documents/bulk-import*` | Admin |
| Cache stats | GET | `/cache/stats` | Admin |
| Tạo A/B test | POST | `/experiments` | Admin |
| Kết quả A/B test | GET | `/experiments/{id}/results` | User |
| Dashboard | GET | `/dashboard` | User |
| Dashboard hài lòng | GET | `/dashboard/satisfaction` | User |
| Dashboard issues | GET | `/dashboard/issues` | User |
| Candidates improve | GET | `/fine-tuning/candidates` | Admin |
| Effectiveness docs | GET | `/documents/analysis/effectiveness` | Admin |
| Training insights | GET | `/insights/training` | Admin |

---

## 📞 Hỗ Trợ & Câu Hỏi

Nếu gặp vấn đề khi tích hợp:

1. **Check lại headers** - Đặc biệt là `Authorization` header
2. **Validate request body** - Sử dụng console để debug
3. **Check response status** - Các status code để hiểu lỗi
4. **Kiểm tra token** - Token có hết hạn không?
5. **Logs server** - Request có tới server không?

**Liên hệ Backend**: Hãy cung cấp:
- HTTP method & URL
- Headers gửi
- Request body
- Response status & message
- Timestamp của lỗi

---

**📚 Tài Liệu này được cập nhật lần cuối: 15/12/2025**

Hãy giữ tài liệu này trong dự án và reference khi cần. Good luck! 🚀
