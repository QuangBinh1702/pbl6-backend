# Phase 2 Quick Start - RAG System

**Phase 2 Status**: ✅ COMPLETE

## 🚀 Quick Setup

### 1. Enable RAG in Environment
```bash
# .env or .env.local
CHATBOT_ENABLE_RAG=true
CHATBOT_RAG_MIN_CONFIDENCE=0.15
CHATBOT_RAG_TOP_K=5
```

### 2. Seed Knowledge Base
```bash
cd backend
node scripts/seed-chatbot-rules.js
```

### 3. Start Server
```bash
npm start
# or dev mode:
npm run dev
```

---

## 📡 API Usage

### Ask Chatbot
```bash
POST /api/chatbot/ask-anything
Content-Type: application/json
Authorization: Bearer {token}

{
  "question": "hoạt động sắp tới là gì?"
}

Response:
{
  "success": true,
  "data": {
    "answer": "...",
    "source": "rag",
    "confidence": 0.87,
    "responseTime": 45
  }
}
```

### Manage Documents (Admin)
```bash
# List documents
GET /api/chatbot/documents?limit=20&page=1

# Create document
POST /api/chatbot/documents
{
  "title": "...",
  "content": "...",
  "category": "guide",
  "tags": ["tag1"],
  "priority": 8
}

# Get document
GET /api/chatbot/documents/{id}

# Update document
PUT /api/chatbot/documents/{id}
{ "title": "...", "content": "..." }

# Delete document
DELETE /api/chatbot/documents/{id}
```

### Test Query (shows rule + RAG)
```bash
POST /api/chatbot/test-query
{
  "query": "hoạt động sắp tới"
}

Response shows both matches:
{
  "ruleMatch": { ... },
  "ragMatch": { ... }
}
```

---

## 📊 What Got Added

**New Models**:
- `ChatbotDocument` - Knowledge base storage with embeddings

**New Services**:
- `embedding.service.js` - Text → Vector conversion
- `rag.service.js` - Semantic search & retrieval

**New Endpoints** (5 total):
- List, Create, Get, Update, Delete documents

**New Data**:
- 5 seed documents with Vietnamese content
- Auto-generated embeddings

---

## 🔍 How It Works

```
User: "hoạt động sắp tới là gì?"
  ↓
RuleEngine: Matches "hoạt động sắp tới" (rules), confidence 0.85
  ↓ If confidence < 0.35 threshold
RAGService: Searches knowledge base, finds 5 documents
  - Calculates similarity to query embedding
  - Returns best match if confidence > 0.15
  ↓ If RAG also fails
FallbackService: "Xin lỗi, tôi không hiểu câu hỏi này"
  ↓
LogMessage: Saves query, answer, source, scores to MongoDB
```

---

## 🎯 Key Features

✅ Semantic search (embedding-based, not keyword)
✅ Priority & role-based filtering
✅ Confidence scoring
✅ Fallback system
✅ Complete audit trail
✅ Vietnamese support (built-in)

---

## 📝 Configuration

See `backend/src/config/chatbot.config.js`:
- `ENABLE_RAG` - Enable/disable RAG
- `RAG_MIN_CONFIDENCE` - Minimum score for RAG answer (0-1)
- `RAG_TOP_K` - Number of documents to retrieve
- `EMBEDDING_DIMENSION` - Vector size (256 default)

---

## 🔧 Troubleshooting

**No RAG results**:
- Check `CHATBOT_ENABLE_RAG=true`
- Verify documents exist: `GET /api/chatbot/documents`
- Check confidence threshold not too high

**Wrong documents retrieved**:
- Increase `RAG_TOP_K` to get more candidates
- Lower `RAG_MIN_CONFIDENCE` threshold
- Update document content to be more relevant

**High response time**:
- Normal: 50-200ms for embedding + similarity
- Check database indexes
- Consider caching embeddings

---

## 📚 Files Overview

**Knowledge Base**:
```
backend/src/models/chatbot_document.model.js
  └─ Document schema with embedding field

backend/src/services/embedding.service.js
  └─ Text → Vector (TF-based, upgradeable)

backend/src/services/rag.service.js
  └─ Retrieval, ranking, CRUD operations

backend/scripts/seed-chatbot-rules.js
  └─ Initial 5 documents + embeddings
```

**Integration**:
```
backend/src/services/chatbot.service.js
  └─ Rules → RAG → Fallback orchestration

backend/src/controllers/chatbot.controller.js
  └─ 5 new endpoints for document management

backend/src/routes/chatbot.routes.js
  └─ 5 new API routes
```

---

**✅ Ready to test! Enable RAG and seed documents to get started.**
