# 📚 Hướng Dẫn Tích Hợp API Toàn Bộ - Frontend React (Phases 1-4)

**Phiên bản**: 1.0 Complete  
**Ngày cập nhật**: 15/12/2025  
**Dành cho**: Frontend React Developers  
**Công nghệ**: React + Axios + JWT

---

## 📌 Mục Lục Chính

### Phase 1: Rule-Based Chatbot
- [Phase 1 - API Documentation](./PHASE1_API_DOCUMENTATION_VI.md)
- 7 User endpoints
- 7 Admin endpoints
- Rule Engine pattern matching

### Phase 2: Knowledge Base & RAG
- [Phase 2 - API Documentation](./PHASE2_API_DOCUMENTATION_VI.md)
- Document CRUD (5 endpoints)
- Semantic search with embeddings
- Hybrid rule + RAG answering

### Phase 3: Advanced Analytics & Feedback
- [Phase 3 - API Documentation](./PHASE3_API_DOCUMENTATION_VI.md)
- Feedback submission & management
- Advanced analytics dashboard
- Trending topics & performance metrics
- Enhanced image analysis
- Multi-language support

### Phase 4: Optimization & Refinement
- [Phase 4 - API Documentation](./PHASE4_API_DOCUMENTATION_VI.md)
- Feedback closure workflow (admin)
- Auto-categorization (LLM)
- Document deduplication
- Bulk import from multiple formats
- A/B testing framework
- Fine-tuning insights
- And 4 more features...

---

## 🚀 Quick Start

### Setup API Client (Giống cho tất cả phases)

```javascript
// File: src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
});

// Add token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
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

## 📡 API Endpoints Overview

### Base URL
```
http://localhost:3001/api/chatbot
```

### Phase 1 Endpoints (14 total)

#### User Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ask-anything` | Ask a question |
| POST | `/analyze-image` | Analyze image (upload) |
| GET | `/history` | Get chat history |

#### Admin Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/rules` | List all rules |
| POST | `/rules` | Create new rule |
| PUT | `/rules/:id` | Update rule |
| DELETE | `/rules/:id` | Delete rule |
| POST | `/test-query` | Test query (debug) |
| GET | `/analytics` | View analytics |
| GET | `/messages` | View message logs |

---

### Phase 2 Endpoints (10 total - 5 new)

#### Document Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/documents` | List documents |
| POST | `/documents` | Create document |
| GET | `/documents/:id` | Get document detail |
| PUT | `/documents/:id` | Update document |
| DELETE | `/documents/:id` | Delete document |

#### Testing
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/test-query` | Test rule + RAG |

---

### Phase 3 Endpoints (15 total - 6 new)

#### Feedback & Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/feedback` | Submit feedback |
| GET | `/feedback` | List feedback (admin) |
| GET | `/analytics/dashboard` | Main dashboard |
| GET | `/analytics/trending-topics` | Trending topics |
| GET | `/analytics/document-performance` | Document metrics |
| GET | `/analytics/issues-report` | Issues & problems |

---

### Phase 4 Endpoints (15 total - 10 new)

#### Feedback Closure (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/feedback/:id/response` | Submit admin response |
| POST | `/feedback/:id/close` | Close feedback |
| GET | `/feedback/pending` | Get pending feedback |

#### Auto-Categorization (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/documents/auto-categorize` | Auto categorize docs |

#### Similarity & Dedup (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/documents/:id/similar` | Find similar docs |
| POST | `/documents/deduplicate` | Deduplicate docs |

#### Bulk Import (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/documents/bulk-import` | Bulk import (JSON) |
| POST | `/documents/bulk-import-csv` | Bulk import (CSV) |

#### Embedding Cache (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/cache/warmup` | Warmup cache |
| GET | `/cache/stats` | Cache statistics |

#### A/B Testing (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/experiments` | Create A/B test |
| GET | `/experiments/:id/results` | Get test results |

#### Fine-tuning Insights
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/fine-tuning/candidates` | Get improvement candidates |
| GET | `/documents/analysis/effectiveness` | Document effectiveness |
| GET | `/insights/training` | Training insights |

---

## 🔐 Authentication

### Token Management
```javascript
// Check if token is valid
const isTokenValid = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  try {
    const decoded = jwtDecode(token);
    return decoded.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

// Get token from storage
const getToken = () => localStorage.getItem('token');

// Save token after login
const saveToken = (token) => localStorage.setItem('token', token);

// Clear token on logout
const logout = () => {
  localStorage.removeItem('token');
  window.location.href = '/login';
};
```

### RBAC (Role-Based Access Control)

Some endpoints require specific roles:
- **Admin**: Feedback closure, auto-categorization, A/B testing, fine-tuning
- **Staff**: Document management, analytics
- **Student**: Ask questions, submit feedback, view own history

---

## 📊 Response Format

### Standard Success Response
```json
{
  "success": true,
  "data": { },
  "message": "Operation successful"
}
```

### Standard Error Response
```json
{
  "success": false,
  "error": "Description of error",
  "message": "User-friendly message"
}
```

### With Pagination
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
```

---

## ⚠️ HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | OK | Success |
| 201 | Created | Resource created |
| 400 | Bad Request | Validate input |
| 401 | Unauthorized | Redirect to login |
| 403 | Forbidden | Check user role |
| 404 | Not Found | Handle not found |
| 500 | Server Error | Retry or show error |

---

## 💡 Usage Patterns

### Pattern 1: Simple GET Request
```javascript
const loadData = async () => {
  try {
    const response = await apiClient.get('/chatbot/history', {
      params: { limit: 20, page: 1 }
    });
    
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};
```

### Pattern 2: POST with Data
```javascript
const createItem = async (itemData) => {
  try {
    const response = await apiClient.post('/chatbot/documents', {
      title: itemData.title,
      content: itemData.content,
      category: itemData.category
    });
    
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};
```

### Pattern 3: File Upload
```javascript
const uploadImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await apiClient.post(
      '/chatbot/analyze-image',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};
```

### Pattern 4: Error Handling
```javascript
const handleError = (error) => {
  if (error.response) {
    // Server returned error status
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        alert(data.error || 'Invalid data');
        break;
      case 401:
        logout();
        break;
      case 403:
        alert('You do not have permission');
        break;
      case 500:
        alert('Server error, please try again');
        break;
      default:
        alert('Unknown error');
    }
  } else if (error.request) {
    alert('Network error, check your connection');
  } else {
    alert('Error: ' + error.message);
  }
};
```

---

## 🎣 Reusable Hooks

### useApi Hook
```javascript
// src/hooks/useApi.js
import { useState, useCallback } from 'react';
import apiClient from '../services/api';

const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const request = useCallback(async (method, url, data = null, config = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      let response;
      
      if (method === 'GET') {
        response = await apiClient.get(url, config);
      } else if (method === 'POST') {
        response = await apiClient.post(url, data, config);
      } else if (method === 'PUT') {
        response = await apiClient.put(url, data, config);
      } else if (method === 'DELETE') {
        response = await apiClient.delete(url, config);
      }
      
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'An error occurred';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { loading, error, request };
};

export default useApi;
```

### Usage Example
```javascript
const MyComponent = () => {
  const { loading, error, request } = useApi();
  
  const handleCreate = async (data) => {
    try {
      const result = await request('POST', '/chatbot/documents', data);
      alert('Created successfully!');
    } catch (err) {
      // Error already in state
    }
  };
  
  return (
    <div>
      {loading && <Spinner />}
      {error && <ErrorAlert message={error} />}
      <button onClick={() => handleCreate({...})}>Create</button>
    </div>
  );
};
```

---

## 📱 By Use Case

### Use Case 1: User Asking Questions
**Phase Required**: Phase 1+
**Endpoints**: POST `/ask-anything`
**Response**: Answer, confidence, source

### Use Case 2: Admin Managing Content
**Phase Required**: Phase 2+
**Endpoints**: 
- GET `/documents` - List
- POST `/documents` - Create
- PUT `/documents/:id` - Update
- DELETE `/documents/:id` - Delete

### Use Case 3: User Providing Feedback
**Phase Required**: Phase 3+
**Endpoints**: POST `/feedback`
**Data**: Rating (1-5), issue type, suggestion

### Use Case 4: Admin Reviewing Analytics
**Phase Required**: Phase 3+
**Endpoints**:
- GET `/analytics/dashboard` - Overview
- GET `/analytics/trending-topics` - Trends
- GET `/analytics/document-performance` - Metrics
- GET `/analytics/issues-report` - Problems

### Use Case 5: Admin Closing Feedback
**Phase Required**: Phase 4+
**Endpoints**:
- GET `/feedback/pending` - List pending
- POST `/feedback/:id/response` - Add response
- POST `/feedback/:id/close` - Close ticket

### Use Case 6: Auto-Improving System
**Phase Required**: Phase 4+
**Endpoints**:
- POST `/documents/auto-categorize` - Auto tag
- POST `/documents/deduplicate` - Remove duplicates
- GET `/fine-tuning/candidates` - Find improvements

---

## 🔄 Common Workflows

### Workflow 1: Basic Q&A (Phase 1)
```
1. User types question
   POST /ask-anything
   
2. System returns answer
   Rule Engine matches
   Returns: answer, confidence, source
   
3. Display to user
```

### Workflow 2: Search with RAG (Phase 2)
```
1. User types question
   POST /ask-anything
   
2. System searches
   Rule Engine → No match
   RAG Engine → Finds documents
   Returns: answer + document IDs
   
3. Display answer + source docs
```

### Workflow 3: Feedback & Analytics (Phase 3)
```
1-2. User asks question (same as above)

3. Show feedback widget
   User rates 1-5 stars
   
4. User submits feedback
   POST /feedback
   
5. Admin views analytics
   GET /analytics/dashboard
   GET /analytics/trending-topics
   
6. Admin reviews issues
   GET /analytics/issues-report
```

### Workflow 4: Feedback Closure (Phase 4)
```
1-4. Feedback submission (same as above)

5. Admin reviews pending
   GET /feedback/pending
   
6. Admin provides response
   POST /feedback/:id/response
   
7. Admin closes ticket
   POST /feedback/:id/close
   
8. System improves based on feedback
   Use fine-tuning endpoints
```

---

## 🛠️ Environment Setup

### .env Configuration
```bash
# API Configuration
REACT_APP_API_BASE_URL=http://localhost:3001/api

# Feature Flags (match backend)
REACT_APP_ENABLE_RAG=true
REACT_APP_ENABLE_FEEDBACK=true
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_LLM=false

# Limits
REACT_APP_API_TIMEOUT=10000
REACT_APP_MAX_FILE_SIZE=5242880  # 5MB
```

### Usage in Code
```javascript
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';
const ENABLE_FEEDBACK = process.env.REACT_APP_ENABLE_FEEDBACK === 'true';
```

---

## 📊 Component Examples

### Example 1: Chat Component
```javascript
const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSend = async () => {
    if (!input.trim()) return;
    
    setMessages(prev => [...prev, { type: 'user', text: input }]);
    setLoading(true);
    
    try {
      const response = await apiClient.post('/chatbot/ask-anything', {
        question: input
      });
      
      setMessages(prev => [...prev, {
        type: 'bot',
        text: response.data.data.answer,
        messageId: response.data.data._id
      }]);
      
      setInput('');
    } catch (err) {
      setMessages(prev => [...prev, { type: 'error', text: 'Error' }]);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="chatbot">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`msg msg-${msg.type}`}>
            {msg.text}
          </div>
        ))}
      </div>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={handleSend} disabled={loading}>Send</button>
    </div>
  );
};
```

### Example 2: Analytics Dashboard
```javascript
const Dashboard = () => {
  const [data, setData] = useState(null);
  const [range, setRange] = useState('day');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const response = await apiClient.get('/chatbot/analytics/dashboard', {
        params: { timeRange: range }
      });
      setData(response.data.data);
      setLoading(false);
    };
    load();
  }, [range]);
  
  if (loading) return <Spinner />;
  
  return (
    <div className="dashboard">
      <select value={range} onChange={(e) => setRange(e.target.value)}>
        <option value="hour">Hour</option>
        <option value="day">Day</option>
        <option value="week">Week</option>
        <option value="month">Month</option>
      </select>
      
      <div className="stats">
        <Card title="Total Queries" value={data?.totalQueries} />
        <Card title="Success Rate" value={`${(data?.successRate * 100).toFixed(1)}%`} />
        <Card title="Avg Response" value={`${data?.avgResponseTime}ms`} />
        <Card title="Avg Rating" value={`${data?.avgRating?.toFixed(2)}⭐`} />
      </div>
    </div>
  );
};
```

---

## 🆘 Troubleshooting

### Token Issues
```javascript
// Check token validity
const token = localStorage.getItem('token');
if (!token) {
  window.location.href = '/login';
}

// Check token expiration
const decoded = jwtDecode(token);
if (decoded.exp * 1000 < Date.now()) {
  // Token expired
  logout();
}
```

### Network Issues
```javascript
// Check network connectivity
const isOnline = navigator.onLine;

// Add retry logic
const retryRequest = async (fn, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
};
```

### CORS Issues
```javascript
// If CORS errors occur, check backend CORS config
// Backend should have:
// app.use(cors({ origin: process.env.FRONTEND_URL }));
```

---

## 📚 Detailed Documentation

For detailed API documentation by phase, see:

1. **[Phase 1 API Documentation](./PHASE1_API_DOCUMENTATION_VI.md)**
   - Rule Engine fundamentals
   - Basic Q&A
   - Admin rule management

2. **[Phase 2 API Documentation](./PHASE2_API_DOCUMENTATION_VI.md)**
   - Knowledge base management
   - RAG system integration
   - Semantic search

3. **[Phase 3 API Documentation](./PHASE3_API_DOCUMENTATION_VI.md)**
   - Feedback system
   - Advanced analytics
   - Image analysis
   - Multi-language support

4. **[Phase 4 API Documentation](./PHASE4_API_DOCUMENTATION_VI.md)**
   - Feedback closure workflow
   - Auto-categorization
   - Document deduplication
   - Bulk operations
   - A/B testing
   - Fine-tuning insights

---

## 🎓 Learning Path

1. **Start with Phase 1**: Learn basic question-answering
2. **Add Phase 2**: Expand with knowledge base
3. **Enable Phase 3**: Add user feedback and analytics
4. **Deploy Phase 4**: Optimize and refine the system

---

## 📞 Support

- **Backend Server**: http://localhost:3001
- **API Base**: http://localhost:3001/api/chatbot
- **Issues**: Check error response messages
- **Logs**: Check browser console and backend logs

---

**Version**: 1.0 Complete  
**Last Updated**: December 15, 2025  
**Status**: ✅ Ready for Production

For questions or issues, refer to the detailed phase documentation above.
