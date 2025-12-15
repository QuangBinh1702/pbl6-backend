# 📚 Hướng Dẫn Tích Hợp API Phase 2 - Frontend React

**Phiên bản**: 1.0  
**Ngày cập nhật**: 15/12/2025  
**Dành cho**: Frontend React Developers  
**Công nghệ**: React + Axios + JWT

---

## 📌 Mục Lục

1. [Giới Thiệu Chung](#-giới-thiệu-chung)
2. [Xác Thực & Token](#-xác-thực--token)
3. [API Quản Lý Documents (Tài Liệu)](#-api-quản-lý-documents)
4. [API Test Query với RAG](#-api-test-query-với-rag)
5. [Xử Lý Error Chung](#-xử-lý-error-chung)
6. [Best Practices cho React](#-best-practices-cho-react)

---

## 🎯 Giới Thiệu Chung

### API Base URL
```
http://localhost:3001/api/chatbot
```

### Phase 2 Features
- **Knowledge Base**: Lưu trữ tài liệu/bài viết
- **RAG System**: Tìm kiếm tài liệu dựa trên embedding (vector similarity)
- **Hybrid Answering**: Kết hợp Rule Engine (Phase 1) + RAG (Phase 2)
- **Semantic Search**: Tìm kiếm theo ý nghĩa, không chỉ từ khóa

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

### Setup API Client (Giống Phase 1)
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
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

# 📚 API QUẢN LÝ DOCUMENTS

## 1️⃣ Tổng Quan

API này cho phép **tạo, xem, sửa, xóa tài liệu** trong Knowledge Base. Tài liệu là những bài viết, hướng dẫn được dùng để trả lời câu hỏi của người dùng thông qua RAG.

**Khi nào dùng**: Khi quản lý cơ sở dữ liệu kiến thức (chỉ admin)

---

## 2️⃣ Endpoint: Danh Sách Documents

### Endpoint
```
GET /chatbot/documents
```

### Headers
```
Authorization: Bearer {access_token}
```

### Query Parameters
| Tên | Kiểu | Mặc định | Ý nghĩa |
|-----|------|---------|---------|
| limit | number | 20 | Số lượng items mỗi trang |
| page | number | 1 | Số trang |
| category | string | - | Lọc theo danh mục (faq, guide, rule, etc.) |

### Ví Dụ React
```javascript
const getDocuments = async (filters = {}) => {
  try {
    const response = await apiClient.get('/chatbot/documents', {
      params: {
        limit: filters.limit || 20,
        page: filters.page || 1,
        category: filters.category
      }
    });
    
    return {
      data: response.data.data,
      pagination: response.data.pagination
    };
  } catch (error) {
    console.error('Error fetching documents:', error);
    return null;
  }
};

// Component
const [page, setPage] = useState(1);
const [category, setCategory] = useState('');
const [documents, setDocuments] = useState([]);
const [totalPages, setTotalPages] = useState(0);

useEffect(() => {
  const loadDocuments = async () => {
    const result = await getDocuments({ page, category });
    if (result) {
      setDocuments(result.data);
      setTotalPages(result.pagination.pages);
    }
  };
  
  loadDocuments();
}, [page, category]);

return (
  <div>
    <select value={category} onChange={(e) => setCategory(e.target.value)}>
      <option value="">Tất cả danh mục</option>
      <option value="faq">FAQ</option>
      <option value="guide">Hướng dẫn</option>
      <option value="rule">Quy định</option>
    </select>
    
    <DocumentTable documents={documents} />
    
    <Pagination 
      current={page}
      total={totalPages}
      onChange={setPage}
    />
  </div>
);
```

### Response - Thành Công (200)
```json
{
  "success": true,
  "data": [
    {
      "_id": "doc_123",
      "title": "Cách đăng ký hoạt động",
      "content": "Để đăng ký hoạt động, bạn cần...",
      "category": "guide",
      "tags": ["registration", "activity"],
      "priority": 8,
      "isActive": true,
      "createdAt": "2025-12-10T15:00:00Z",
      "updatedAt": "2025-12-15T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
}
```

---

## 3️⃣ Endpoint: Tạo Document

### Endpoint
```
POST /chatbot/documents
```

### Headers
```
Authorization: Bearer {admin_token}
Content-Type: application/json
```

### Request Body
```json
{
  "title": "string - Tiêu đề (bắt buộc)",
  "content": "string - Nội dung (bắt buộc)",
  "category": "string - faq|guide|rule (mặc định: other)",
  "tags": ["array", "of", "tags"],
  "allowedRoles": ["array", "of", "roles"],
  "priority": "number - 1-10 (mặc định: 5)"
}
```

### Ví Dụ React
```javascript
const createDocument = async (docData) => {
  try {
    const response = await apiClient.post('/chatbot/documents', {
      title: docData.title,
      content: docData.content,
      category: docData.category || 'other',
      tags: docData.tags.split(',').map(t => t.trim()),
      priority: parseInt(docData.priority) || 5,
      allowedRoles: docData.roles || []
    });
    
    console.log('Document created:', response.data.data);
    alert('Tài liệu được tạo thành công!');
    
    return response.data.data;
  } catch (error) {
    alert(error.response?.data?.error || 'Lỗi tạo tài liệu');
    return null;
  }
};

// Form component
const DocumentForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'guide',
    tags: '',
    priority: '5'
  });
  const [loading, setLoading] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content) {
      alert('Vui lòng nhập tiêu đề và nội dung');
      return;
    }
    
    setLoading(true);
    try {
      const result = await createDocument(formData);
      if (result) {
        setFormData({
          title: '',
          content: '',
          category: 'guide',
          tags: '',
          priority: '5'
        });
        if (onSuccess) onSuccess(result);
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        name="title"
        placeholder="Tiêu đề tài liệu"
        value={formData.title}
        onChange={handleChange}
        disabled={loading}
        required
      />
      
      <textarea
        name="content"
        placeholder="Nội dung chi tiết"
        value={formData.content}
        onChange={handleChange}
        disabled={loading}
        required
        rows="8"
      />
      
      <select
        name="category"
        value={formData.category}
        onChange={handleChange}
        disabled={loading}
      >
        <option value="faq">FAQ</option>
        <option value="guide">Hướng dẫn</option>
        <option value="rule">Quy định</option>
        <option value="other">Khác</option>
      </select>
      
      <input
        name="tags"
        placeholder="Tags (cách nhau bằng dấu phẩy)"
        value={formData.tags}
        onChange={handleChange}
        disabled={loading}
      />
      
      <select
        name="priority"
        value={formData.priority}
        onChange={handleChange}
        disabled={loading}
      >
        <option value="5">Bình thường</option>
        <option value="8">Cao</option>
        <option value="9">Rất cao</option>
      </select>
      
      <button type="submit" disabled={loading}>
        {loading ? 'Đang tạo...' : 'Tạo tài liệu'}
      </button>
    </form>
  );
};
```

### Response - Thành Công (201)
```json
{
  "success": true,
  "data": {
    "_id": "doc_123",
    "title": "Cách đăng ký hoạt động",
    "content": "Để đăng ký hoạt động, bạn cần...",
    "category": "guide",
    "tags": ["registration"],
    "priority": 8,
    "isActive": true,
    "createdAt": "2025-12-15T10:30:00Z"
  },
  "message": "Tài liệu created successfully"
}
```

---

## 4️⃣ Endpoint: Lấy Chi Tiết Document

### Endpoint
```
GET /chatbot/documents/{documentId}
```

### Ví Dụ React
```javascript
const getDocument = async (docId) => {
  try {
    const response = await apiClient.get(`/chatbot/documents/${docId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching document:', error);
    return null;
  }
};

// Component detail view
const DocumentDetail = ({ docId }) => {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadDocument = async () => {
      const doc = await getDocument(docId);
      setDocument(doc);
      setLoading(false);
    };
    
    loadDocument();
  }, [docId]);
  
  if (loading) return <Spinner />;
  if (!document) return <p>Không tìm thấy tài liệu</p>;
  
  return (
    <div className="document-detail">
      <h1>{document.title}</h1>
      <p className="meta">
        Danh mục: {document.category} | 
        Độ ưu tiên: {document.priority}
      </p>
      <div className="content">{document.content}</div>
      <div className="tags">
        {document.tags.map(tag => (
          <span key={tag} className="tag">{tag}</span>
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
  "data": {
    "_id": "doc_123",
    "title": "Cách đăng ký hoạt động",
    "content": "Để đăng ký hoạt động...",
    "category": "guide",
    "tags": ["registration", "activity"],
    "priority": 8,
    "isActive": true,
    "embedding": [0.234, 0.567, ...],
    "createdAt": "2025-12-10T15:00:00Z",
    "updatedAt": "2025-12-15T10:00:00Z"
  }
}
```

---

## 5️⃣ Endpoint: Cập Nhật Document

### Endpoint
```
PUT /chatbot/documents/{documentId}
```

### Request Body
```json
{
  "title": "string - Không bắt buộc",
  "content": "string",
  "category": "string",
  "tags": ["array"],
  "allowedRoles": ["array"],
  "priority": "number",
  "isActive": "boolean"
}
```

### Ví Dụ React
```javascript
const updateDocument = async (docId, docData) => {
  try {
    const response = await apiClient.put(`/chatbot/documents/${docId}`, {
      title: docData.title,
      content: docData.content,
      category: docData.category,
      priority: parseInt(docData.priority),
      isActive: docData.isActive
    });
    
    alert('Tài liệu được cập nhật thành công!');
    return response.data.data;
  } catch (error) {
    alert(error.response?.data?.error || 'Lỗi cập nhật tài liệu');
    return null;
  }
};

// Edit form
const EditDocumentForm = ({ docId, initialData, onSuccess }) => {
  const [formData, setFormData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await updateDocument(docId, formData);
      if (result && onSuccess) {
        onSuccess(result);
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* form fields same as create */}
      <button type="submit" disabled={loading}>
        {loading ? 'Đang cập nhật...' : 'Cập nhật'}
      </button>
    </form>
  );
};
```

### Response - Thành Công (200)
```json
{
  "success": true,
  "data": {
    "_id": "doc_123",
    "title": "Updated title",
    "content": "Updated content...",
    "category": "guide",
    "updatedAt": "2025-12-15T10:30:00Z"
  },
  "message": "Tài liệu updated successfully"
}
```

---

## 6️⃣ Endpoint: Xóa Document

### Endpoint
```
DELETE /chatbot/documents/{documentId}
```

### Ví Dụ React
```javascript
const deleteDocument = async (docId) => {
  if (!window.confirm('Bạn chắc chắn muốn xóa tài liệu này?')) {
    return false;
  }
  
  try {
    await apiClient.delete(`/chatbot/documents/${docId}`);
    alert('Tài liệu được xóa thành công!');
    return true;
  } catch (error) {
    alert(error.response?.data?.error || 'Lỗi xóa tài liệu');
    return false;
  }
};

// In document list
const DocumentTable = ({ documents, onDelete }) => {
  const handleDeleteClick = async (docId) => {
    const success = await deleteDocument(docId);
    if (success) {
      onDelete(docId);
    }
  };
  
  return (
    <table>
      <tbody>
        {documents.map(doc => (
          <tr key={doc._id}>
            <td>{doc.title}</td>
            <td>{doc.category}</td>
            <td>
              <button onClick={() => handleDeleteClick(doc._id)}>
                Xóa
              </button>
            </td>
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
  "message": "Tài liệu deleted successfully"
}
```

---

# 🧪 API TEST QUERY VỚI RAG

## 1️⃣ Tổng Quan

API này cho phép **test một câu hỏi** để thấy cả Rule Engine và RAG System trả lời như thế nào. Rất hữu ích để debug hoặc kiểm tra hiệu suất hệ thống.

**Khi nào dùng**: Khi muốn kiểm tra hybrid answering

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
    
    return response.data.data;
  } catch (error) {
    console.error('Test error:', error);
    return null;
  }
};

// Test component
const QueryDebugger = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const handleTest = async () => {
    if (!query.trim()) {
      alert('Vui lòng nhập câu hỏi');
      return;
    }
    
    setLoading(true);
    try {
      const data = await testQuery(query);
      if (data) {
        setResult(data);
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="query-debugger">
      <input
        placeholder="Nhập câu hỏi để test..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleTest()}
        disabled={loading}
      />
      <button onClick={handleTest} disabled={loading}>
        {loading ? 'Đang test...' : 'Test'}
      </button>
      
      {result && (
        <div className="results">
          {result.ruleMatch && (
            <div className="rule-result">
              <h3>✅ Rule Match</h3>
              <p><strong>Câu trả lời:</strong> {result.ruleMatch.answer}</p>
              <p><strong>Confidence:</strong> {(result.ruleMatch.confidence * 100).toFixed(1)}%</p>
              <p><strong>Rule ID:</strong> {result.ruleMatch.matchedRuleId}</p>
            </div>
          )}
          
          {result.ragMatch && (
            <div className="rag-result">
              <h3>🤖 RAG Match</h3>
              <p><strong>Câu trả lời:</strong> {result.ragMatch.answer}</p>
              <p><strong>Confidence:</strong> {(result.ragMatch.confidence * 100).toFixed(1)}%</p>
              <p><strong>Documents:</strong> {result.ragMatch.retrievedDocIds.length}</p>
              <div className="docs">
                {result.ragMatch.retrievedDocIds.map(docId => (
                  <span key={docId} className="doc-id">{docId}</span>
                ))}
              </div>
            </div>
          )}
          
          {!result.ruleMatch && !result.ragMatch && (
            <div className="no-match">
              ❌ Không tìm thấy match nào - sẽ dùng fallback response
            </div>
          )}
        </div>
      )}
    </div>
  );
};
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
    "ragMatch": {
      "answer": "Dựa trên tài liệu, hoạt động sắp tới...",
      "confidence": 0.87,
      "retrievedDocIds": ["doc_456", "doc_789"]
    }
  }
}
```

### Response - Không Match (200)
```json
{
  "success": true,
  "data": {
    "query": "câu hỏi lạ lùng",
    "ruleMatch": null,
    "ragMatch": null
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

### 403 - Forbidden (Không phải admin)
```javascript
if (error.response?.status === 403) {
  alert('Bạn không có quyền quản lý tài liệu');
}
```

### 400 - Bad Request
```javascript
if (error.response?.status === 400) {
  const message = error.response?.data?.error;
  alert(message || 'Dữ liệu không hợp lệ');
}
```

### 404 - Not Found
```javascript
if (error.response?.status === 404) {
  alert('Tài liệu không tìm thấy');
}
```

---

# 💡 Best Practices cho React

## 1️⃣ Document Management Hook

```javascript
// src/hooks/useDocuments.js
import { useState, useCallback } from 'react';
import apiClient from '../services/api';

const useDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  
  const listDocuments = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/chatbot/documents', {
        params: filters
      });
      setDocuments(response.data.data);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi tải tài liệu');
    } finally {
      setLoading(false);
    }
  }, []);
  
  const createDocument = useCallback(async (docData) => {
    try {
      const response = await apiClient.post('/chatbot/documents', docData);
      setDocuments(prev => [response.data.data, ...prev]);
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi tạo tài liệu');
      throw err;
    }
  }, []);
  
  const updateDocument = useCallback(async (docId, docData) => {
    try {
      const response = await apiClient.put(`/chatbot/documents/${docId}`, docData);
      setDocuments(prev => 
        prev.map(d => d._id === docId ? response.data.data : d)
      );
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi cập nhật tài liệu');
      throw err;
    }
  }, []);
  
  const deleteDocument = useCallback(async (docId) => {
    try {
      await apiClient.delete(`/chatbot/documents/${docId}`);
      setDocuments(prev => prev.filter(d => d._id !== docId));
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi xóa tài liệu');
      throw err;
    }
  }, []);
  
  return {
    documents,
    loading,
    error,
    pagination,
    listDocuments,
    createDocument,
    updateDocument,
    deleteDocument
  };
};

export default useDocuments;
```

## 2️⃣ Usage trong Component

```javascript
import useDocuments from '../hooks/useDocuments';

const DocumentManager = () => {
  const {
    documents,
    loading,
    error,
    pagination,
    listDocuments,
    createDocument,
    deleteDocument
  } = useDocuments();
  
  useEffect(() => {
    listDocuments({ limit: 20, page: 1 });
  }, [listDocuments]);
  
  const handleCreate = async (formData) => {
    try {
      await createDocument(formData);
      alert('Tài liệu tạo thành công!');
    } catch (err) {
      console.error(err);
    }
  };
  
  const handleDelete = async (docId) => {
    if (window.confirm('Xóa tài liệu?')) {
      try {
        await deleteDocument(docId);
        alert('Tài liệu đã xóa!');
      } catch (err) {
        console.error(err);
      }
    }
  };
  
  return (
    <div>
      {error && <ErrorAlert message={error} />}
      
      <CreateDocumentForm onSuccess={handleCreate} />
      
      {loading ? (
        <Spinner />
      ) : (
        <>
          <DocumentTable 
            documents={documents} 
            onDelete={handleDelete}
          />
          <Pagination {...pagination} />
        </>
      )}
    </div>
  );
};
```

## 3️⃣ Loading & Error Boundaries

```javascript
// src/components/DocumentListSafe.js
const DocumentListSafe = () => {
  const {
    documents,
    loading,
    error,
    listDocuments
  } = useDocuments();
  
  useEffect(() => {
    listDocuments();
  }, []);
  
  if (error) {
    return (
      <div className="error-container">
        <h2>Lỗi tải dữ liệu</h2>
        <p>{error}</p>
        <button onClick={() => listDocuments()}>
          Thử lại
        </button>
      </div>
    );
  }
  
  if (loading) {
    return <Spinner fullPage />;
  }
  
  if (documents.length === 0) {
    return (
      <div className="empty-state">
        <p>Không có tài liệu nào</p>
        <a href="/admin/documents/create">Tạo tài liệu đầu tiên</a>
      </div>
    );
  }
  
  return <DocumentTable documents={documents} />;
};

export default DocumentListSafe;
```

## 4️⃣ Bulk Actions

```javascript
const DocumentBulkActions = ({ documents, onSuccess }) => {
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelected(documents.map(d => d._id));
    } else {
      setSelected([]);
    }
  };
  
  const handleSelectOne = (docId) => {
    setSelected(prev => 
      prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };
  
  const handleBulkDelete = async () => {
    if (!window.confirm(`Xóa ${selected.length} tài liệu?`)) {
      return;
    }
    
    setLoading(true);
    try {
      await Promise.all(
        selected.map(docId => apiClient.delete(`/chatbot/documents/${docId}`))
      );
      alert(`Đã xóa ${selected.length} tài liệu`);
      setSelected([]);
      onSuccess?.();
    } catch (err) {
      alert('Lỗi xóa một số tài liệu');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <div className="bulk-actions">
        <label>
          <input 
            type="checkbox"
            checked={selected.length === documents.length && documents.length > 0}
            onChange={handleSelectAll}
            disabled={documents.length === 0}
          />
          Chọn tất cả
        </label>
        
        {selected.length > 0 && (
          <button 
            onClick={handleBulkDelete}
            disabled={loading}
            className="btn-danger"
          >
            Xóa {selected.length} mục
          </button>
        )}
      </div>
      
      <table>
        <tbody>
          {documents.map(doc => (
            <tr key={doc._id}>
              <td>
                <input
                  type="checkbox"
                  checked={selected.includes(doc._id)}
                  onChange={() => handleSelectOne(doc._id)}
                />
              </td>
              <td>{doc.title}</td>
              <td>{doc.category}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

---

## 📞 Support & Documentation

- **Backend Server**: http://localhost:3001
- **API Documentation**: [Xem toàn bộ docs](./API_DOCUMENTATION.md)
- **Phase 1 Docs**: [Phase 1 API](./PHASE1_API_DOCUMENTATION_VI.md)

---

**Created**: December 15, 2025  
**Version**: Phase 2 - RAG & Knowledge Base API
