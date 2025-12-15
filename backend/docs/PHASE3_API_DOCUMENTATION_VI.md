# 📚 Hướng Dẫn Tích Hợp API Phase 3 - Frontend React

**Phiên bản**: 1.0  
**Ngày cập nhật**: 15/12/2025  
**Dành cho**: Frontend React Developers  
**Công nghệ**: React + Axios + JWT

---

## 📌 Mục Lục

1. [Giới Thiệu Chung](#-giới-thiệu-chung)
2. [Xác Thực & Token](#-xác-thực--token)
3. [API Submit Feedback](#-api-submit-feedback)
4. [API Feedback Management (Admin)](#-api-feedback-management-admin)
5. [API Analytics Dashboard](#-api-analytics-dashboard)
6. [API Trending Topics](#-api-trending-topics)
7. [API Document Performance](#-api-document-performance)
8. [API Issues Report](#-api-issues-report)
9. [Enhanced Image Analysis](#-enhanced-image-analysis)
10. [Enhanced Ask Anything](#-enhanced-ask-anything)
11. [Xử Lý Error Chung](#-xử-lý-error-chung)
12. [Best Practices cho React](#-best-practices-cho-react)

---

## 🎯 Giới Thiệu Chung

### API Base URL
```
http://localhost:3001/api/chatbot
```

### Phase 3 Features
- **Advanced Embeddings**: HuggingFace integration cho semantic search tốt hơn
- **LLM Synthesis**: OpenAI/Claude tổng hợp câu trả lời từ tài liệu
- **Multi-language Support**: Tự động detect ngôn ngữ + dịch
- **Advanced Analytics**: Dashboard chi tiết với trending topics, metrics
- **User Feedback Loop**: Rating system + issue tracking + improvements

### Response Format Chung
```json
{
  "success": true | false,
  "data": { },
  "error": null | "Chi tiết lỗi",
  "message": "Mô tả chi tiết"
}
```

---

## 🔐 Xác Thực & Token

### Setup API Client (Giống Phase 1-2)
```javascript
// File: src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

# 💬 API SUBMIT FEEDBACK

## 1️⃣ Tổng Quan

API này cho phép **người dùng gửi phản hồi** về chất lượng câu trả lời - rating, report vấn đề, suggestions. Dữ liệu này rất quan trọng để cải thiện hệ thống.

**Khi nào dùng**: Sau khi user nhận được câu trả lời, cho họ gửi feedback

---

## 2️⃣ Endpoint: Submit Feedback

### Endpoint
```
POST /chatbot/feedback
```

### Headers
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

### Request Body
```json
{
  "messageId": "string - ID của message nhận được (bắt buộc)",
  "rating": "number - 1-5 stars (bắt buộc)",
  "issue": "string - Vấn đề (incomplete|unclear|inaccurate|irrelevant|other)",
  "suggestion": "string - Gợi ý cải thiện (tùy chọn)",
  "isHelpful": "boolean - Câu trả lời có giúp ích không"
}
```

### Ví Dụ React
```javascript
const submitFeedback = async (feedbackData) => {
  try {
    const response = await apiClient.post('/chatbot/feedback', {
      messageId: feedbackData.messageId,
      rating: feedbackData.rating,
      issue: feedbackData.issue,
      suggestion: feedbackData.suggestion,
      isHelpful: feedbackData.isHelpful
    });
    
    console.log('Feedback submitted:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('Error submitting feedback:', error);
    throw error;
  }
};

// Feedback widget (hiển thị sau mỗi answer)
const FeedbackWidget = ({ messageId, onClose }) => {
  const [rating, setRating] = useState(0);
  const [issue, setIssue] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Vui lòng chọn rating');
      return;
    }
    
    setLoading(true);
    try {
      await submitFeedback({
        messageId,
        rating,
        issue: issue || null,
        suggestion: suggestion || null,
        isHelpful: rating >= 4
      });
      
      alert('Cảm ơn phản hồi của bạn!');
      onClose?.();
    } catch (err) {
      alert('Lỗi gửi phản hồi');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="feedback-widget">
      <h4>Bạn cảm thấy câu trả lời này thế nào?</h4>
      
      <div className="rating">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            className={`star ${rating >= star ? 'active' : ''}`}
            onClick={() => setRating(star)}
            disabled={loading}
          >
            ⭐
          </button>
        ))}
      </div>
      
      {rating > 0 && rating < 4 && (
        <div className="issue-selection">
          <label>Vấn đề gặp phải:</label>
          <select 
            value={issue} 
            onChange={(e) => setIssue(e.target.value)}
            disabled={loading}
          >
            <option value="">-- Chọn vấn đề --</option>
            <option value="incomplete">Câu trả lời không đầy đủ</option>
            <option value="unclear">Câu trả lời không rõ ràng</option>
            <option value="inaccurate">Câu trả lời không chính xác</option>
            <option value="irrelevant">Câu trả lời không liên quan</option>
            <option value="other">Vấn đề khác</option>
          </select>
        </div>
      )}
      
      <textarea
        placeholder="Gợi ý cải thiện (tùy chọn)..."
        value={suggestion}
        onChange={(e) => setSuggestion(e.target.value)}
        disabled={loading}
        rows="3"
      />
      
      <div className="actions">
        <button 
          onClick={handleSubmit} 
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'Đang gửi...' : 'Gửi phản hồi'}
        </button>
        <button 
          onClick={onClose}
          disabled={loading}
          className="btn-secondary"
        >
          Bỏ qua
        </button>
      </div>
    </div>
  );
};
```

### Response - Thành Công (201)
```json
{
  "success": true,
  "data": {
    "_id": "feedback_123",
    "messageId": "msg_456",
    "userId": "user_789",
    "rating": 4,
    "issue": "incomplete",
    "suggestion": "Thêm thêm chi tiết về quy trình đăng ký",
    "isHelpful": true,
    "createdAt": "2025-12-15T10:30:00Z"
  },
  "message": "Feedback submitted successfully"
}
```

---

# 🛠️ API FEEDBACK MANAGEMENT (ADMIN)

## 1️⃣ Tổng Quan

API này cho phép **admin xem tất cả feedback** từ người dùng, cơ sở để cải thiện câu trả lời.

**Khi nào dùng**: Khi admin muốn quản lý feedback

---

## 2️⃣ Endpoint: Danh Sách Feedback

### Endpoint
```
GET /chatbot/feedback
```

### Headers
```
Authorization: Bearer {admin_token}
```

### Query Parameters
| Tên | Kiểu | Mặc định | Ý nghĩa |
|-----|------|---------|---------|
| limit | number | 20 | Số lượng items mỗi trang |
| page | number | 1 | Số trang |
| rating | number | - | Lọc theo rating (1-5) |
| source | string | - | Lọc theo nguồn (rule/rag) |
| issue | string | - | Lọc theo loại vấn đề |

### Ví Dụ React
```javascript
const getFeedback = async (filters = {}) => {
  try {
    const response = await apiClient.get('/chatbot/feedback', {
      params: {
        limit: filters.limit || 20,
        page: filters.page || 1,
        rating: filters.rating,
        source: filters.source,
        issue: filters.issue
      }
    });
    
    return {
      data: response.data.data,
      pagination: response.data.pagination
    };
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return null;
  }
};

// Feedback list component
const FeedbackList = () => {
  const [filters, setFilters] = useState({
    rating: '',
    issue: '',
    page: 1
  });
  const [feedback, setFeedback] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    loadFeedback();
  }, [filters.rating, filters.issue, filters.page]);
  
  const loadFeedback = async () => {
    setLoading(true);
    const result = await getFeedback(filters);
    if (result) {
      setFeedback(result.data);
      setTotalPages(result.pagination.pages);
    }
    setLoading(false);
  };
  
  return (
    <div className="feedback-management">
      <div className="filters">
        <select 
          value={filters.rating}
          onChange={(e) => setFilters({...filters, rating: e.target.value, page: 1})}
        >
          <option value="">Tất cả Rating</option>
          <option value="1">1 sao - Rất tệ</option>
          <option value="2">2 sao - Tệ</option>
          <option value="3">3 sao - Trung bình</option>
          <option value="4">4 sao - Tốt</option>
          <option value="5">5 sao - Rất tốt</option>
        </select>
        
        <select
          value={filters.issue}
          onChange={(e) => setFilters({...filters, issue: e.target.value, page: 1})}
        >
          <option value="">Tất cả vấn đề</option>
          <option value="incomplete">Không đầy đủ</option>
          <option value="unclear">Không rõ ràng</option>
          <option value="inaccurate">Không chính xác</option>
          <option value="irrelevant">Không liên quan</option>
        </select>
      </div>
      
      {loading ? (
        <Spinner />
      ) : (
        <>
          <FeedbackTable 
            items={feedback}
            onRefresh={loadFeedback}
          />
          <Pagination 
            current={filters.page}
            total={totalPages}
            onChange={(page) => setFilters({...filters, page})}
          />
        </>
      )}
    </div>
  );
};

// Feedback table row detail
const FeedbackTable = ({ items }) => {
  return (
    <table className="feedback-table">
      <thead>
        <tr>
          <th>User</th>
          <th>Rating</th>
          <th>Issue</th>
          <th>Suggestion</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        {items.map(fb => (
          <tr key={fb._id}>
            <td>{fb.userId?.username || 'Unknown'}</td>
            <td>
              <span className={`rating-badge rating-${fb.rating}`}>
                {'⭐'.repeat(fb.rating)}
              </span>
            </td>
            <td>
              {fb.issue ? (
                <span className="issue-badge">{fb.issue}</span>
              ) : (
                '-'
              )}
            </td>
            <td>{fb.suggestion?.substring(0, 50)}...</td>
            <td>{new Date(fb.createdAt).toLocaleDateString('vi-VN')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

### Response - Thành Công (200)
```json
{
  "success": true,
  "data": [
    {
      "_id": "feedback_123",
      "messageId": "msg_456",
      "userId": {
        "_id": "user_789",
        "username": "student_01"
      },
      "rating": 2,
      "issue": "incomplete",
      "suggestion": "Thêm thêm chi tiết về quy trình",
      "isHelpful": false,
      "createdAt": "2025-12-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 245,
    "page": 1,
    "limit": 20,
    "pages": 13
  }
}
```

---

# 📊 API ANALYTICS DASHBOARD

## 1️⃣ Tổng Quan

API này cung cấp **dashboard analytics toàn diện** - overview của toàn bộ hệ thống, bao gồm queries, ratings, response times, v.v.

**Khi nào dùng**: Khi hiển thị dashboard chính cho admin

---

## 2️⃣ Endpoint: Dashboard

### Endpoint
```
GET /chatbot/analytics/dashboard
```

### Query Parameters
| Tên | Kiểu | Mặc định | Ý nghĩa |
|-----|------|---------|---------|
| timeRange | string | day | hour / day / week / month |

### Ví Dụ React
```javascript
const getDashboard = async (timeRange = 'day') => {
  try {
    const response = await apiClient.get('/chatbot/analytics/dashboard', {
      params: { timeRange }
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return null;
  }
};

// Dashboard component
const AnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState('day');
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      const data = await getDashboard(timeRange);
      setDashboard(data);
      setLoading(false);
    };
    
    loadDashboard();
  }, [timeRange]);
  
  if (loading) return <Spinner />;
  if (!dashboard) return <p>Không thể tải dashboard</p>;
  
  return (
    <div className="dashboard">
      <div className="time-range-selector">
        <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
          <option value="hour">Giờ</option>
          <option value="day">Ngày</option>
          <option value="week">Tuần</option>
          <option value="month">Tháng</option>
        </select>
      </div>
      
      <div className="metrics-grid">
        <MetricCard 
          title="Tổng Queries"
          value={dashboard.totalQueries}
          icon="📊"
        />
        <MetricCard 
          title="Tỉ lệ Thành công"
          value={`${(dashboard.successRate * 100).toFixed(1)}%`}
          icon="✅"
        />
        <MetricCard 
          title="Avg Response Time"
          value={`${dashboard.avgResponseTime}ms`}
          icon="⚡"
        />
        <MetricCard 
          title="Avg Rating"
          value={dashboard.avgRating?.toFixed(2) || 'N/A'}
          icon="⭐"
        />
      </div>
      
      <div className="charts">
        <SourceDistributionChart data={dashboard.sourceDistribution} />
        <ResponseTimeChart data={dashboard.responseTimeStats} />
      </div>
    </div>
  );
};

// Reusable metric card
const MetricCard = ({ title, value, icon, trend }) => (
  <div className="metric-card">
    <div className="icon">{icon}</div>
    <div className="content">
      <p className="title">{title}</p>
      <p className="value">{value}</p>
      {trend && <p className="trend">{trend}</p>}
    </div>
  </div>
);
```

### Response - Thành Công (200)
```json
{
  "success": true,
  "data": {
    "totalQueries": 1250,
    "totalFeedback": 350,
    "feedbackRate": 0.28,
    "avgRating": 3.8,
    "successRate": 0.87,
    "avgResponseTime": 145,
    "sourceDistribution": {
      "rule": {
        "count": 850,
        "percentage": 68
      },
      "rag": {
        "count": 350,
        "percentage": 28
      },
      "fallback": {
        "count": 50,
        "percentage": 4
      }
    },
    "responseTimeStats": {
      "avg": 145,
      "min": 23,
      "max": 2340
    },
    "documentPerformance": [
      {
        "documentId": "doc_123",
        "title": "Đăng ký hoạt động",
        "retrievalCount": 45,
        "avgRating": 4.2
      }
    ]
  }
}
```

---

# 🔥 API TRENDING TOPICS

## 1️⃣ Tổng Quan

API này trả về **những câu hỏi phổ biến nhất** - giúp admin hiểu người dùng quan tâm gì nhất.

**Khi nào dùng**: Hiển thị trending topics / popular searches

---

## 2️⃣ Endpoint: Trending Topics

### Endpoint
```
GET /chatbot/analytics/trending-topics
```

### Query Parameters
| Tên | Kiểu | Mặc định | Ý nghĩa |
|-----|------|---------|---------|
| limit | number | 10 | Số topic trả về |

### Ví Dụ React
```javascript
const getTrendingTopics = async (limit = 10) => {
  try {
    const response = await apiClient.get('/chatbot/analytics/trending-topics', {
      params: { limit }
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Error fetching trending topics:', error);
    return [];
  }
};

// Component
const TrendingTopics = () => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const loadTopics = async () => {
      setLoading(true);
      const data = await getTrendingTopics(10);
      setTopics(data);
      setLoading(false);
    };
    
    loadTopics();
  }, []);
  
  if (loading) return <Spinner />;
  
  return (
    <div className="trending-topics">
      <h2>🔥 Trending Topics</h2>
      <div className="topics-list">
        {topics.map((topic, index) => (
          <div key={index} className="topic-item">
            <span className="rank">#{index + 1}</span>
            <div className="topic-content">
              <p className="topic-text">{topic.topic}</p>
              <div className="stats">
                <span className="count">📊 {topic.count} lần</span>
                <span className="rating">⭐ {topic.avgRating?.toFixed(1) || 'N/A'}</span>
              </div>
            </div>
            <div className="trend-bar">
              <div 
                className="trend-fill"
                style={{width: `${(topic.count / topics[0].count) * 100}%`}}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Response - Thành Công (200)
```json
{
  "success": true,
  "data": [
    {
      "topic": "hoạt động sắp tới",
      "count": 125,
      "avgRating": 4.1
    },
    {
      "topic": "đăng ký hoạt động",
      "count": 98,
      "avgRating": 3.9
    },
    {
      "topic": "điểm danh",
      "count": 87,
      "avgRating": 3.7
    }
  ]
}
```

---

# 📈 API DOCUMENT PERFORMANCE

## 1️⃣ Tổng Quan

API này cung cấp **hiệu suất của từng tài liệu** - được retrieve bao nhiêu lần, rating trung bình, v.v. Giúp xác định tài liệu nào cần cải thiện.

**Khi nào dùng**: Khi muốn optimize cơ sở dữ liệu kiến thức

---

## 2️⃣ Endpoint: Document Performance

### Endpoint
```
GET /chatbot/analytics/document-performance
```

### Query Parameters
| Tên | Kiểu | Mặc định | Ý nghĩa |
|-----|------|---------|---------|
| timeRange | string | day | hour / day / week / month |

### Ví Dụ React
```javascript
const getDocumentPerformance = async (timeRange = 'day') => {
  try {
    const response = await apiClient.get('/chatbot/analytics/document-performance', {
      params: { timeRange }
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Error fetching document performance:', error);
    return [];
  }
};

// Component
const DocumentPerformanceTable = () => {
  const [timeRange, setTimeRange] = useState('day');
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const loadPerformance = async () => {
      setLoading(true);
      const data = await getDocumentPerformance(timeRange);
      setPerformance(data);
      setLoading(false);
    };
    
    loadPerformance();
  }, [timeRange]);
  
  if (loading) return <Spinner />;
  
  return (
    <div className="document-performance">
      <h2>📈 Document Performance</h2>
      
      <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
        <option value="hour">Giờ</option>
        <option value="day">Ngày</option>
        <option value="week">Tuần</option>
        <option value="month">Tháng</option>
      </select>
      
      <table>
        <thead>
          <tr>
            <th>Tài liệu</th>
            <th>Lần Retrieve</th>
            <th>Avg Rating</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {performance.map(doc => (
            <tr key={doc._id}>
              <td>
                <strong>{doc.title}</strong>
                <p className="category">{doc.category}</p>
              </td>
              <td>
                <span className="badge">{doc.retrievalCount}</span>
              </td>
              <td>
                {doc.avgRating ? (
                  <span className="rating">
                    {'⭐'.repeat(Math.round(doc.avgRating))}
                    {doc.avgRating.toFixed(1)}
                  </span>
                ) : (
                  'N/A'
                )}
              </td>
              <td>
                {doc.avgRating >= 4 ? (
                  <span className="status good">✅ Tốt</span>
                ) : doc.avgRating >= 3 ? (
                  <span className="status ok">⚠️ OK</span>
                ) : (
                  <span className="status poor">❌ Cần cải thiện</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

### Response - Thành Công (200)
```json
{
  "success": true,
  "data": [
    {
      "_id": "doc_123",
      "title": "Cách đăng ký hoạt động",
      "category": "guide",
      "retrievalCount": 145,
      "avgConfidenceScore": 0.85,
      "avgRating": 4.1,
      "feedbackCount": 28
    },
    {
      "_id": "doc_456",
      "title": "Quy định điểm danh",
      "category": "rule",
      "retrievalCount": 89,
      "avgConfidenceScore": 0.78,
      "avgRating": 3.4,
      "feedbackCount": 15
    }
  ]
}
```

---

# ⚠️ API ISSUES REPORT

## 1️⃣ Tổng Quan

API này trả về **báo cáo lỗi/vấn đề** - những vấn đề phổ biến được report bởi users, giúp prioritize cải thiện.

**Khi nào dùng**: Khi cần xác định cần cải thiện những gì

---

## 2️⃣ Endpoint: Issues Report

### Endpoint
```
GET /chatbot/analytics/issues-report
```

### Ví Dụ React
```javascript
const getIssuesReport = async () => {
  try {
    const response = await apiClient.get('/chatbot/analytics/issues-report');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching issues:', error);
    return null;
  }
};

// Component
const IssuesReport = () => {
  const [issues, setIssues] = useState(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const loadIssues = async () => {
      setLoading(true);
      const data = await getIssuesReport();
      setIssues(data);
      setLoading(false);
    };
    
    loadIssues();
  }, []);
  
  if (loading) return <Spinner />;
  if (!issues) return <p>Không có dữ liệu</p>;
  
  return (
    <div className="issues-report">
      <h2>⚠️ Issues Report</h2>
      
      {Object.entries(issues).map(([issueType, data]) => (
        <div key={issueType} className="issue-section">
          <h3>{getIssueLabel(issueType)}</h3>
          <div className="issue-stats">
            <p>Số lần report: <strong>{data.count}</strong></p>
            <p>Rating trung bình: <strong>{data.avgRating.toFixed(1)} ⭐</strong></p>
          </div>
          
          <div className="examples">
            <h4>Ví dụ:</h4>
            <ul>
              {data.examples?.slice(0, 3).map((example, i) => (
                <li key={i}>"{example}"</li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
};

const getIssueLabel = (type) => {
  const labels = {
    'incomplete': '❌ Không đầy đủ',
    'unclear': '❓ Không rõ ràng',
    'inaccurate': '⚠️ Không chính xác',
    'irrelevant': '🔄 Không liên quan',
    'other': '📝 Khác'
  };
  return labels[type] || type;
};
```

### Response - Thành Công (200)
```json
{
  "success": true,
  "data": {
    "incomplete": {
      "count": 45,
      "avgRating": 2.1,
      "examples": [
        "Câu trả lời không nói về...",
        "Cần thêm chi tiết về..."
      ]
    },
    "unclear": {
      "count": 32,
      "avgRating": 2.3,
      "examples": [
        "Không hiểu câu trả lời...",
        "Viết rõ ràng hơn..."
      ]
    },
    "inaccurate": {
      "count": 15,
      "avgRating": 1.9,
      "examples": [
        "Thông tin sai...",
        "Khác với thực tế..."
      ]
    }
  }
}
```

---

# 📸 ENHANCED IMAGE ANALYSIS

## 1️⃣ Tổng Quan

API này cho phép **upload hình ảnh** (poster, document, screenshot) và hệ thống sẽ trích text + tự động sinh suggested questions để user hỏi tiếp theo.

**Khi nào dùng**: Khi người dùng muốn upload ảnh đối với câu hỏi

---

## 2️⃣ Endpoint: Analyze Image

### Endpoint
```
POST /chatbot/analyze-image
```

### Headers
```
Authorization: Bearer {access_token}
Content-Type: multipart/form-data
```

### Request (Multipart Form Data)
```
image: File (ảnh, bắt buộc) - JPEG, PNG
image_url: string (hoặc dùng URL thay vì upload file)
```

### Ví Dụ React
```javascript
const analyzeImage = async (fileOrUrl) => {
  try {
    const formData = new FormData();
    
    if (fileOrUrl instanceof File) {
      formData.append('image', fileOrUrl);
    } else {
      formData.append('image_url', fileOrUrl);
    }
    
    const response = await apiClient.post('/chatbot/analyze-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
};

// Image upload component
const ImageUploadWidget = ({ onSuccess }) => {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB
      alert('Ảnh quá lớn (max 5MB)');
      return;
    }
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
    
    // Upload
    setLoading(true);
    try {
      const result = await analyzeImage(file);
      if (result) {
        onSuccess?.(result);
      }
    } catch (err) {
      alert('Lỗi xử lý ảnh');
    } finally {
      setLoading(false);
    }
  };
  
  const handleUrlInput = async (url) => {
    if (!url) return;
    
    setLoading(true);
    try {
      const result = await analyzeImage(url);
      if (result) {
        onSuccess?.(result);
      }
    } catch (err) {
      alert('Lỗi xử lý ảnh từ URL');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="image-upload-widget">
      {preview && (
        <div className="preview">
          <img src={preview} alt="preview" />
        </div>
      )}
      
      <div className="upload-area">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={loading}
          style={{ display: 'none' }}
        />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="btn-upload"
        >
          {loading ? '📸 Đang xử lý...' : '📸 Upload ảnh'}
        </button>
        
        <p>hoặc</p>
        
        <input
          type="url"
          placeholder="Dán URL ảnh tại đây..."
          onBlur={(e) => e.target.value && handleUrlInput(e.target.value)}
          disabled={loading}
        />
      </div>
    </div>
  );
};
```

### Response - Thành Công (200)
```json
{
  "success": true,
  "data": {
    "extracted_text": "Ảnh chứa thông tin về quy định đăng ký hoạt động",
    "image_type": "document",
    "suggested_questions": [
      "Làm sao để đăng ký hoạt động?",
      "Hoạt động sắp tới là gì?",
      "Deadline đăng ký là bao giờ?"
    ],
    "chat_id": "chat_789"
  }
}
```

---

# 💬 ENHANCED ASK ANYTHING

## 1️⃣ Tổng Quan

API này cho phép **hỏi câu hỏi thông thường**, nhưng cải thiện so với Phase 1-2:
- Tự động detect ngôn ngữ
- Tích hợp LLM synthesis cho câu trả lời tốt hơn
- Trả về suggested questions cải thiện
- Support advanced embedding cho tìm kiếm

**Khi nào dùng**: Khi user hỏi câu hỏi bình thường

---

## 2️⃣ Endpoint: Ask Question

### Endpoint
```
POST /chatbot/ask-anything
```

### Request Body
```json
{
  "question": "string - Câu hỏi (bắt buộc)"
}
```

### Enhanced Response Includes
- `answer`: Câu trả lời (có thể từ Rule, RAG, hoặc LLM)
- `language`: Ngôn ngữ detected (vi, en, etc.)
- `confidence`: Độ tin cậy
- `source`: Nguồn (rule/rag/llm/fallback)
- `suggestedQuestions`: Suggested follow-up questions

### Ví Dụ React
```javascript
const askQuestion = async (question) => {
  try {
    const response = await apiClient.post('/chatbot/ask-anything', {
      question
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Error asking question:', error);
    throw error;
  }
};

// Chat component (Phase 3 enhanced)
const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleAsk = async () => {
    if (!input.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, {
      type: 'user',
      content: input
    }]);
    
    setLoading(true);
    try {
      const result = await askQuestion(input);
      
      // Add bot message with rich data
      setMessages(prev => [...prev, {
        type: 'bot',
        content: result.answer,
        source: result.source,
        confidence: result.confidence,
        language: result.language,
        messageId: result._id,
        suggestedQuestions: result.suggestedQuestions
      }]);
      
      setInput('');
    } catch (err) {
      setMessages(prev => [...prev, {
        type: 'error',
        content: 'Lỗi xử lý câu hỏi, vui lòng thử lại'
      }]);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="chat-interface">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message message-${msg.type}`}>
            {msg.type === 'bot' && (
              <>
                <p className="content">{msg.content}</p>
                <div className="meta">
                  <span className="source">{msg.source}</span>
                  <span className="confidence">
                    {(msg.confidence * 100).toFixed(0)}% confident
                  </span>
                </div>
                <FeedbackWidget 
                  messageId={msg.messageId}
                  answer={msg.content}
                />
              </>
            )}
            {msg.type === 'user' && <p>{msg.content}</p>}
            {msg.type === 'error' && <p className="error">{msg.content}</p>}
          </div>
        ))}
      </div>
      
      <div className="input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
          placeholder="Nhập câu hỏi..."
          disabled={loading}
        />
        <button onClick={handleAsk} disabled={loading}>
          {loading ? '⏳' : '➤'}
        </button>
      </div>
    </div>
  );
};
```

### Response - Thành Công (200)
```json
{
  "success": true,
  "data": {
    "_id": "msg_123",
    "answer": "Hoạt động sắp tới bao gồm các buổi tập luyện...",
    "source": "rag_llm",
    "confidence": 0.89,
    "language": "vi",
    "responseTime": 234,
    "suggestedQuestions": [
      "Làm sao để đăng ký?",
      "Địa điểm là ở đâu?",
      "Thời gian bắt đầu là mấy giờ?"
    ]
  }
}
```

---

# ⚠️ Xử Lý Error Chung

## Các Lỗi Phổ Biến

### 401 - Unauthorized
```javascript
if (error.response?.status === 401) {
  localStorage.removeItem('token');
  window.location.href = '/login';
}
```

### 403 - Forbidden
```javascript
if (error.response?.status === 403) {
  alert('Bạn không có quyền truy cập');
}
```

### 400 - Bad Request
```javascript
if (error.response?.status === 400) {
  alert(error.response?.data?.error || 'Dữ liệu không hợp lệ');
}
```

### 500 - Server Error
```javascript
if (error.response?.status === 500) {
  alert('Lỗi server, vui lòng thử lại sau');
}
```

---

# 💡 Best Practices cho React

## 1️⃣ Analytics Hook

```javascript
// src/hooks/useAnalytics.js
const useAnalytics = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const loadDashboard = useCallback(async (timeRange = 'day') => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/chatbot/analytics/dashboard', {
        params: { timeRange }
      });
      setDashboard(response.data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi tải analytics');
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { dashboard, loading, error, loadDashboard };
};
```

## 2️⃣ Feedback Hook

```javascript
// src/hooks/useFeedback.js
const useFeedback = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const submitFeedback = useCallback(async (feedbackData) => {
    try {
      const response = await apiClient.post('/chatbot/feedback', feedbackData);
      return response.data.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Lỗi submit feedback');
    }
  }, []);
  
  const listFeedback = useCallback(async (filters) => {
    setLoading(true);
    try {
      const response = await apiClient.get('/chatbot/feedback', {
        params: filters
      });
      setFeedback(response.data.data);
      return response.data.pagination;
    } catch (err) {
      console.error('Error loading feedback:', err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { feedback, loading, submitFeedback, listFeedback };
};
```

## 3️⃣ Realtime Data Updates

```javascript
// Auto-refresh analytics mỗi 30 giây
useEffect(() => {
  const interval = setInterval(async () => {
    await loadDashboard(timeRange);
  }, 30000);
  
  return () => clearInterval(interval);
}, [timeRange, loadDashboard]);
```

---

## 📞 Support & Documentation

- **Backend Server**: http://localhost:3001
- **Phase 1 Docs**: [Phase 1 API](./PHASE1_API_DOCUMENTATION_VI.md)
- **Phase 2 Docs**: [Phase 2 API](./PHASE2_API_DOCUMENTATION_VI.md)

---

**Created**: December 15, 2025  
**Version**: Phase 3 - Advanced Analytics & Feedback Loop API
