# 📚 Hướng Dẫn Tích Hợp API Phase 1 - Frontend React

**Phiên bản**: 1.0  
**Ngày cập nhật**: 15/12/2025  
**Dành cho**: Frontend React Developers  
**Công nghệ**: React + Axios + JWT

---

## 📌 Mục Lục

1. [Giới Thiệu Chung](#-giới-thiệu-chung)
2. [Xác Thực & Token](#-xác-thực--token)
3. [API Câu Hỏi Chính (Ask)](#-api-câu-hỏi-chính)
4. [API Lịch Chat](#-api-lịch-chat)
5. [API Quản Lý Rules (Admin)](#-api-quản-lý-rules-admin)
6. [API Test Query (Admin)](#-api-test-query-admin)
7. [API Analytics (Admin)](#-api-analytics-admin)
8. [API Xem Messages Log (Admin)](#-api-xem-messages-log-admin)
9. [Xử Lý Error Chung](#-xử-lý-error-chung)
10. [Best Practices cho React](#-best-practices-cho-react)

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
  "success": true | false,
  "data": { },
  "error": null | "Chi tiết lỗi",
  "message": "Mô tả chi tiết" // Nếu có
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
const response = await apiClient.get('/chatbot/history');

// POST
const response = await apiClient.post('/chatbot/ask-anything', {
  question: 'Hoạt động sắp tới là gì?'
});
```

---

# 📋 API CÂTROY

## 1️⃣ Tổng Quan

API này cho phép **người dùng hỏi câu hỏi** về các quy định, hoạt động, v.v. Hệ thống sẽ tìm kiếm trong quy tắc (rules) và trả về câu trả lời phù hợp nhất.

**Khi nào dùng**: Khi người dùng muốn hỏi câu hỏi về hệ thống

---

## 2️⃣ Endpoint: Hỏi Câu Hỏi

### Endpoint
```
POST /chatbot/ask-anything
```

### Headers
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

### Request Body
```json
{
  "question": "string - Câu hỏi của người dùng (bắt buộc)"
}
```

### Validation
- `question` là bắt buộc
- `question.trim().length` > 0 (không trống)

### Ví Dụ React (Axios)
```javascript
const askQuestion = async (question) => {
  try {
    const response = await apiClient.post('/chatbot/ask-anything', {
      question: question
    });
    
    console.log('Câu trả lời:', response.data.data);
    // Lưu vào chat history
    saveToChatHistory(response.data.data);
  } catch (error) {
    handleError(error);
  }
};

// Sử dụng trong component
const [question, setQuestion] = useState('');

const handleAsk = async () => {
  if (!question.trim()) {
    alert('Vui lòng nhập câu hỏi');
    return;
  }
  
  await askQuestion(question);
  setQuestion(''); // Clear input
};
```

### Response - Thành Công (200)
```json
{
  "success": true,
  "data": {
    "answer": "Hoạt động sắp tới bao gồm...",
    "source": "rule",
    "confidence": 0.95,
    "responseTime": 45,
    "matchedRuleId": "rule_123"
  }
}
```

### Response - Lỗi Validation (400)
```json
{
  "success": false,
  "error": "Vui lòng nhập câu hỏi"
}
```

### Error Handling
```javascript
const handleError = (error) => {
  if (error.response?.status === 400) {
    // Validation error
    alert(error.response.data.error || 'Dữ liệu không hợp lệ');
  } else if (error.response?.status === 401) {
    // Chưa đăng nhập
    redirectToLogin();
  } else if (error.response?.status === 500) {
    alert('Lỗi server, vui lòng thử lại sau');
  }
};
```

---

# 📚 API LỊCH CHAT

## 1️⃣ Tổng Quan

API này cho phép **xem lịch sử chat** của người dùng hiện tại. Hữu ích để người dùng xem lại các câu hỏi đã hỏi trước đó.

**Khi nào dùng**: Khi cần hiển thị lịch chat của user

---

## 2️⃣ Endpoint: Lấy Lịch Chat

### Endpoint
```
GET /chatbot/history
```

### Headers
```
Authorization: Bearer {access_token}
```

### Query Parameters
| Tên | Kiểu | Mặc định | Ý nghĩa |
|-----|------|---------|---------|
| limit | number | 20 | Số lượng items mỗi trang |
| page | number | 1 | Số trang (phân trang) |

### Ví Dụ React
```javascript
const getChatHistory = async (page = 1, limit = 20) => {
  try {
    const response = await apiClient.get('/chatbot/history', {
      params: { limit, page }
    });
    
    console.log('Lịch chat:', response.data.data);
    console.log('Phân trang:', response.data.pagination);
    
    return {
      data: response.data.data,
      pagination: response.data.pagination
    };
  } catch (error) {
    handleError(error);
    return null;
  }
};

// Sử dụng với pagination
const [page, setPage] = useState(1);
const [chatHistory, setChatHistory] = useState([]);
const [totalPages, setTotalPages] = useState(0);

useEffect(() => {
  const loadHistory = async () => {
    const result = await getChatHistory(page, 20);
    if (result) {
      setChatHistory(result.data);
      setTotalPages(result.pagination.pages);
    }
  };
  
  loadHistory();
}, [page]);
```

### Response - Thành Công (200)
```json
{
  "success": true,
  "data": [
    {
      "_id": "msg_123",
      "userId": "user_456",
      "query": "Hoạt động sắp tới là gì?",
      "answer": "Hoạt động sắp tới bao gồm...",
      "source": "rule",
      "scores": {
        "ruleScore": 0.95
      },
      "responseTime": 45,
      "timestamp": "2025-12-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "pages": 8
  }
}
```

---

# 🛠️ API QUẢN LÝ RULES (ADMIN)

## 1️⃣ Tổng Quan

Những API này cho phép **admin quản lý quy tắc (rules)** - thêm, sửa, xóa, xem danh sách. Quy tắc là những mẫu q&a được dùng để trả lời câu hỏi của người dùng.

**Khi nào dùng**: Chỉ dành cho admin/quản lý viên

---

## 2️⃣ Endpoint: Danh Sách Rules

### Endpoint
```
GET /chatbot/rules
```

### Headers
```
Authorization: Bearer {admin_token}
```

### Query Parameters
| Tên | Kiểu | Mặc định | Ý nghĩa |
|-----|------|---------|---------|
| isActive | boolean | - | Lọc rules hoạt động (true/false) |

### Ví Dụ React
```javascript
const getRules = async (isActive) => {
  try {
    const params = {};
    if (isActive !== undefined) {
      params.isActive = isActive;
    }
    
    const response = await apiClient.get('/chatbot/rules', {
      params
    });
    
    console.log('Danh sách rules:', response.data.data);
    return response.data.data;
  } catch (error) {
    handleError(error);
    return [];
  }
};

// Lấy rules hoạt động
const activeRules = await getRules(true);
```

### Response - Thành Công (200)
```json
{
  "success": true,
  "data": [
    {
      "_id": "rule_123",
      "pattern": "hoạt động sắp tới",
      "keywords": ["activities", "upcoming", "sắp"],
      "responseTemplate": "Hoạt động sắp tới bao gồm...",
      "priority": 8,
      "allowedRoles": [],
      "type": "faq",
      "isActive": true,
      "createdBy": "admin_001",
      "createdAt": "2025-12-10T15:00:00Z",
      "updatedAt": "2025-12-15T10:00:00Z"
    }
  ],
  "count": 5
}
```

---

## 3️⃣ Endpoint: Tạo Rule Mới

### Endpoint
```
POST /chatbot/rules
```

### Request Body
```json
{
  "pattern": "string - Từ khóa chính (bắt buộc)",
  "keywords": ["array", "of", "alternatives"],
  "responseTemplate": "string - Câu trả lời (bắt buộc)",
  "priority": "number - 1-10 (mặc định: 5)",
  "allowedRoles": ["array", "of", "roles"],
  "type": "string - faq|guide|rule (mặc định: faq)"
}
```

### Ví Dụ React
```javascript
const createRule = async (ruleData) => {
  try {
    const response = await apiClient.post('/chatbot/rules', {
      pattern: ruleData.pattern,
      keywords: ruleData.keywords.split(',').map(k => k.trim()),
      responseTemplate: ruleData.response,
      priority: parseInt(ruleData.priority) || 5,
      allowedRoles: ruleData.roles || [],
      type: ruleData.type || 'faq'
    });
    
    console.log('Rule created:', response.data.data);
    alert('Quy tắc được tạo thành công!');
    
    return response.data.data;
  } catch (error) {
    handleError(error);
    return null;
  }
};

// Form component
const [formData, setFormData] = useState({
  pattern: '',
  keywords: '',
  response: '',
  priority: '5',
  type: 'faq'
});

const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!formData.pattern || !formData.response) {
    alert('Vui lòng nhập Pattern và Response');
    return;
  }
  
  await createRule(formData);
  setFormData({ pattern: '', keywords: '', response: '', priority: '5', type: 'faq' });
};
```

### Response - Thành Công (201)
```json
{
  "success": true,
  "data": {
    "_id": "rule_123",
    "pattern": "hoạt động sắp tới",
    "keywords": ["activities"],
    "responseTemplate": "Hoạt động sắp tới là...",
    "priority": 8,
    "type": "faq",
    "isActive": true
  },
  "message": "Rule created successfully"
}
```

---

## 4️⃣ Endpoint: Cập Nhật Rule

### Endpoint
```
PUT /chatbot/rules/{ruleId}
```

### Request Body
```json
{
  "pattern": "string - Không bắt buộc",
  "keywords": ["array"],
  "responseTemplate": "string",
  "priority": "number",
  "allowedRoles": ["array"],
  "type": "string",
  "isActive": "boolean"
}
```

### Ví Dụ React
```javascript
const updateRule = async (ruleId, ruleData) => {
  try {
    const response = await apiClient.put(`/chatbot/rules/${ruleId}`, {
      pattern: ruleData.pattern,
      responseTemplate: ruleData.response,
      priority: parseInt(ruleData.priority),
      isActive: ruleData.isActive
    });
    
    alert('Quy tắc được cập nhật thành công!');
    return response.data.data;
  } catch (error) {
    handleError(error);
    return null;
  }
};
```

### Response - Thành Công (200)
```json
{
  "success": true,
  "data": {
    "_id": "rule_123",
    "pattern": "hoạt động sắp tới (updated)",
    "responseTemplate": "Updated response...",
    "priority": 9,
    "isActive": true,
    "updatedAt": "2025-12-15T10:30:00Z"
  },
  "message": "Rule updated successfully"
}
```

---

## 5️⃣ Endpoint: Xóa Rule

### Endpoint
```
DELETE /chatbot/rules/{ruleId}
```

### Ví Dụ React
```javascript
const deleteRule = async (ruleId) => {
  if (!window.confirm('Bạn chắc chắn muốn xóa quy tắc này?')) {
    return;
  }
  
  try {
    const response = await apiClient.delete(`/chatbot/rules/${ruleId}`);
    
    alert('Quy tắc được xóa thành công!');
    // Refresh list
    loadRules();
  } catch (error) {
    handleError(error);
  }
};
```

### Response - Thành Công (200)
```json
{
  "success": true,
  "message": "Rule deleted successfully"
}
```

---

# 🧪 API TEST QUERY (ADMIN)

## 1️⃣ Tổng Quan

API này cho phép **admin test một câu hỏi** để xem Rule Engine có match không. Rất hữu ích khi debug hoặc kiểm tra quy tắc mới.

**Khi nào dùng**: Khi muốn kiểm tra quy tắc trước khi deploy

---

## 2️⃣ Endpoint: Test Query

### Endpoint
```
POST /chatbot/test-query
```

### Request Body
```json
{
  "query": "string - Câu hỏi để test (bắt buộc)"
}
```

### Ví Dụ React
```javascript
const testQuery = async (query) => {
  try {
    const response = await apiClient.post('/chatbot/test-query', {
      query: query
    });
    
    console.log('Test result:');
    console.log('Rule match:', response.data.data.ruleMatch);
    console.log('RAG match:', response.data.data.ragMatch);
    
    return response.data.data;
  } catch (error) {
    handleError(error);
    return null;
  }
};

// Component test
const [query, setQuery] = useState('');
const [testResult, setTestResult] = useState(null);

const handleTest = async () => {
  if (!query.trim()) {
    alert('Vui lòng nhập câu hỏi để test');
    return;
  }
  
  const result = await testQuery(query);
  if (result) {
    setTestResult(result);
  }
};

// Display results
{testResult && (
  <div className="test-results">
    {testResult.ruleMatch && (
      <div className="rule-match">
        <h3>✅ Rule Match</h3>
        <p><strong>Câu trả lời:</strong> {testResult.ruleMatch.answer}</p>
        <p><strong>Confidence:</strong> {(testResult.ruleMatch.confidence * 100).toFixed(1)}%</p>
      </div>
    )}
    
    {testResult.ragMatch && (
      <div className="rag-match">
        <h3>✅ RAG Match</h3>
        <p><strong>Câu trả lời:</strong> {testResult.ragMatch.answer}</p>
      </div>
    )}
    
    {!testResult.ruleMatch && !testResult.ragMatch && (
      <p className="no-match">❌ Không tìm thấy match nào</p>
    )}
  </div>
)}
```

### Response - Thành Công (200)
```json
{
  "success": true,
  "data": {
    "query": "hoạt động sắp tới là gì",
    "ruleMatch": {
      "answer": "Hoạt động sắp tới bao gồm...",
      "confidence": 0.95,
      "matchedRuleId": "rule_123"
    },
    "ragMatch": null
  }
}
```

---

# 📊 API ANALYTICS (ADMIN)

## 1️⃣ Tổng Quan

API này cung cấp **thống kê sử dụng** của chatbot - số câu hỏi đã trả lời, độ chính xác, v.v. Giúp admin theo dõi hiệu suất hệ thống.

**Khi nào dùng**: Khi muốn xem số liệu thống kê, biểu đồ

---

## 2️⃣ Endpoint: Lấy Analytics

### Endpoint
```
GET /chatbot/analytics
```

### Query Parameters
| Tên | Kiểu | Mặc định | Ý nghĩa |
|-----|------|---------|---------|
| timeRange | string | day | hour / day / week / month |

### Ví Dụ React
```javascript
const getAnalytics = async (timeRange = 'day') => {
  try {
    const response = await apiClient.get('/chatbot/analytics', {
      params: { timeRange }
    });
    
    console.log('Analytics:', response.data.data);
    return response.data.data;
  } catch (error) {
    handleError(error);
    return null;
  }
};

// Component với dropdown
const [timeRange, setTimeRange] = useState('day');
const [analytics, setAnalytics] = useState(null);

useEffect(() => {
  const loadAnalytics = async () => {
    const data = await getAnalytics(timeRange);
    if (data) {
      setAnalytics(data);
    }
  };
  
  loadAnalytics();
}, [timeRange]);

return (
  <div>
    <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
      <option value="hour">Giờ</option>
      <option value="day">Ngày</option>
      <option value="week">Tuần</option>
      <option value="month">Tháng</option>
    </select>
    
    {analytics && (
      <div className="analytics-dashboard">
        <p>📊 Tổng câu hỏi: {analytics.totalQueries}</p>
        <p>✅ Tỉ lệ thành công: {(analytics.successRate * 100).toFixed(1)}%</p>
      </div>
    )}
  </div>
);
```

### Response - Thành Công (200)
```json
{
  "success": true,
  "data": {
    "totalQueries": 350,
    "successRate": 0.87,
    "averageResponseTime": 45,
    "topPatterns": ["hoạt động", "điểm danh", "đăng ký"],
    "timeRange": "day"
  }
}
```

---

# 📝 API XEM MESSAGES LOG (ADMIN)

## 1️⃣ Tổng Quan

API này cho phép **xem tất cả tin nhắn** từ tất cả người dùng (admin audit trail). Hữu ích để debug hoặc theo dõi hành vi người dùng.

**Khi nào dùng**: Khi admin muốn xem logs toàn hệ thống

---

## 2️⃣ Endpoint: Danh Sách Messages

### Endpoint
```
GET /chatbot/messages
```

### Query Parameters
| Tên | Kiểu | Mặc định | Ý nghĩa |
|-----|------|---------|---------|
| limit | number | 50 | Số lượng items mỗi trang |
| page | number | 1 | Số trang |
| source | string | - | Lọc theo nguồn (rule/rag/fallback) |
| userId | string | - | Lọc theo user ID |

### Ví Dụ React
```javascript
const getMessages = async (filters = {}) => {
  try {
    const response = await apiClient.get('/chatbot/messages', {
      params: {
        limit: filters.limit || 50,
        page: filters.page || 1,
        source: filters.source,
        userId: filters.userId
      }
    });
    
    return {
      data: response.data.data,
      pagination: response.data.pagination
    };
  } catch (error) {
    handleError(error);
    return null;
  }
};

// Component filter
const [filters, setFilters] = useState({
  source: '',
  userId: '',
  page: 1
});

const [messages, setMessages] = useState([]);
const [totalPages, setTotalPages] = useState(0);

useEffect(() => {
  const loadMessages = async () => {
    const result = await getMessages(filters);
    if (result) {
      setMessages(result.data);
      setTotalPages(result.pagination.pages);
    }
  };
  
  loadMessages();
}, [filters.page, filters.source]);
```

### Response - Thành Công (200)
```json
{
  "success": true,
  "data": [
    {
      "_id": "msg_123",
      "userId": "user_456",
      "query": "Hoạt động sắp tới?",
      "answer": "Hoạt động sắp tới bao gồm...",
      "source": "rule",
      "scores": {
        "ruleScore": 0.95
      },
      "timestamp": "2025-12-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 1500,
    "page": 1,
    "limit": 50,
    "pages": 30
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
  const errorMsg = error.response?.data?.error;
  showErrorMessage(errorMsg || "Dữ liệu không hợp lệ");
}
```

### 500 - Server Error
```javascript
// Lỗi server
if (error.response?.status === 500) {
  showErrorMessage("Lỗi server, vui lòng thử lại sau");
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
    const message = error.response.data?.error || 'Lỗi không xác định';
    
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
import { jwtDecode } from 'jwt-decode';

const useAuth = () => {
  const getToken = () => localStorage.getItem('token');
  
  const isTokenExpired = (token) => {
    try {
      const decoded = jwtDecode(token);
      return decoded.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  };
  
  const isAuthenticated = () => {
    const token = getToken();
    return token && !isTokenExpired(token);
  };
  
  const logout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };
  
  return { getToken, isAuthenticated, isTokenExpired, logout };
};

export default useAuth;
```

## 2️⃣ Loading & Error State

```javascript
const ChatComponent = () => {
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
      const response = await apiClient.get('/chatbot/history');
      setData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return <Spinner />;
  if (error) return <ErrorAlert message={error} />;
  if (!data) return <p>Không có dữ liệu</p>;
  
  return <ChatHistory items={data} />;
};
```

## 3️⃣ Pagination

```javascript
const MessageList = () => {
  const [page, setPage] = useState(1);
  const [messages, setMessages] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    loadMessages(page);
  }, [page]);
  
  const loadMessages = async (pageNum) => {
    try {
      setLoading(true);
      const response = await apiClient.get('/chatbot/messages', {
        params: { page: pageNum, limit: 20 }
      });
      
      setMessages(response.data.data);
      setTotalPages(response.data.pagination.pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <MessageTable items={messages} />
      {!loading && (
        <Pagination 
          current={page}
          total={totalPages}
          onChange={setPage}
        />
      )}
    </div>
  );
};
```

## 4️⃣ Debounce cho Search

```javascript
import debounce from 'lodash/debounce';

const SearchRules = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Debounced search function
  const debouncedSearch = debounce(async (term) => {
    if (!term.trim()) {
      setResults([]);
      return;
    }
    
    try {
      setLoading(true);
      // Simulate search - trong thực tế sẽ call API lọc
      const response = await apiClient.get('/chatbot/rules');
      const filtered = response.data.data.filter(rule =>
        rule.pattern.includes(term.toLowerCase())
      );
      setResults(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, 500); // Wait 500ms after user stops typing
  
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    debouncedSearch(term);
  };
  
  return (
    <div>
      <input 
        placeholder="Tìm quy tắc..."
        value={searchTerm}
        onChange={handleSearch}
      />
      {loading && <Spinner />}
      <RuleList items={results} />
    </div>
  );
};
```

## 5️⃣ Form Submission với Loading State

```javascript
const CreateRuleForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    pattern: '',
    keywords: '',
    responseTemplate: '',
    priority: '5',
    type: 'faq'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.pattern || !formData.responseTemplate) {
      setError('Vui lòng nhập Pattern và Response');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.post('/chatbot/rules', {
        pattern: formData.pattern,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
        responseTemplate: formData.responseTemplate,
        priority: parseInt(formData.priority),
        type: formData.type
      });
      
      alert('Quy tắc được tạo thành công!');
      
      // Reset form
      setFormData({
        pattern: '',
        keywords: '',
        responseTemplate: '',
        priority: '5',
        type: 'faq'
      });
      
      // Callback
      if (onSuccess) {
        onSuccess(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi tạo quy tắc');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {error && <ErrorAlert message={error} />}
      
      <input
        name="pattern"
        placeholder="Pattern (từ khóa chính)"
        value={formData.pattern}
        onChange={handleInputChange}
        disabled={loading}
        required
      />
      
      <input
        name="keywords"
        placeholder="Keywords (cách nhau bằng dấu phẩy)"
        value={formData.keywords}
        onChange={handleInputChange}
        disabled={loading}
      />
      
      <textarea
        name="responseTemplate"
        placeholder="Câu trả lời"
        value={formData.responseTemplate}
        onChange={handleInputChange}
        disabled={loading}
        required
      />
      
      <select
        name="priority"
        value={formData.priority}
        onChange={handleInputChange}
        disabled={loading}
      >
        <option value="5">Bình thường</option>
        <option value="8">Cao</option>
        <option value="9">Rất cao</option>
      </select>
      
      <button type="submit" disabled={loading}>
        {loading ? 'Đang tạo...' : 'Tạo quy tắc'}
      </button>
    </form>
  );
};
```

## 6️⃣ Request Cancellation

```javascript
const ChatSearchComponent = () => {
  const cancelTokenRef = useRef(null);
  
  const search = async (query) => {
    // Cancel previous request
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel('New search started');
    }
    
    // Create new cancel token
    cancelTokenRef.current = axios.CancelToken.source();
    
    try {
      const response = await apiClient.post('/chatbot/test-query', 
        { query },
        { cancelToken: cancelTokenRef.current.token }
      );
      
      return response.data;
    } catch (err) {
      if (axios.isCancel(err)) {
        console.log('Request cancelled:', err.message);
      } else {
        throw err;
      }
    }
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cancelTokenRef.current) {
        cancelTokenRef.current.cancel('Component unmounted');
      }
    };
  }, []);
  
  return <SearchInput onSearch={search} />;
};
```

## 7️⃣ Retry Logic

```javascript
const retryRequest = async (fn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      if (err.response?.status >= 500) {
        // Only retry on server errors
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      } else {
        throw err;
      }
    }
  }
};

// Usage
const loadData = async () => {
  try {
    const data = await retryRequest(
      () => apiClient.get('/chatbot/history'),
      3,
      1000
    );
    setData(data.data);
  } catch (err) {
    setError('Failed to load data');
  }
};
```

---

## 📞 Support & Documentation

- **Backend Server**: http://localhost:3001
- **API Documentation**: [Xem toàn bộ docs](./API_DOCUMENTATION.md)
- **Environment Setup**: [.env Config](./CHATBOT_ENV_SETUP.md)

---

**Created**: December 15, 2025  
**Version**: Phase 1 - Rule-Based Chatbot API
