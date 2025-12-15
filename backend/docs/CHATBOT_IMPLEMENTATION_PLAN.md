# 🤖 Hybrid Chatbot Implementation Plan (Rule-based + RAG)

**Dự án:** PBL6 - Activity Management System  
**Ngôn ngữ:** Node.js/Express + React + MongoDB  
**Mục tiêu:** Nâng cấp chatbot từ pattern-based sang hybrid (Rule-based + RAG)

---

## 📋 Tóm tắt Yêu cầu (Requirements)

### Nguồn Requirements
- Link ChatGPT: https://chatgpt.com/share/69357c4a-46f8-8001-807c-5be6dadc3e65

### Yêu cầu Chính
1. **Rule-based Matching** (Cách 1)
   - Hiểu câu hỏi không phải 100% khớp mẫu
   - Dùng NLP + cosine similarity
   - Trả lời theo pattern có sẵn nhanh chóng

2. **RAG (Retrieval-Augmented Generation)** (Cách 2)
   - Tạo knowledge base từ tài liệu quy định, hoạt động
   - Chatbot tự tìm kiếm thông tin phù hợp
   - Trả lời theo tài liệu thực tế, không phải hardcode

3. **Gộp Cả 2 Thành 1 API** (Cách 3)
   - 1 orchestrator quyết định sử dụng rule hay RAG
   - Nếu rule match tốt (confidence ≥ threshold) → dùng rule
   - Nếu không → dùng RAG
   - Nếu vẫn không → fallback response

---

## 🏗️ Kiến Trúc Đề Xuất

### High-level Architecture

```
┌─────────────────────────────────────────────────────────┐
│               ROUTE LAYER (Express)                     │
│  POST /api/chatbot/ask-anything                         │
│  POST /api/chatbot/analyze-image                        │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│            CONTROLLER LAYER                             │
│  • Validate JWT + RBAC                                  │
│  • Extract req.user context                             │
│  • Call chatService.handleUserMessage()                 │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│            SERVICE LAYER (Orchestrator)                 │
│                                                         │
│  chatService.handleUserMessage()                        │
│    1. Normalize text input                              │
│    2. Try rule-based matching                           │
│       ├─ If confidence ≥ RULE_MIN_CONFIDENCE → use it   │
│       └─ Else continue to RAG                           │
│    3. Try RAG retrieval                                 │
│       ├─ If confidence ≥ RAG_MIN_CONFIDENCE → use it    │
│       └─ Else continue to fallback                      │
│    4. Fallback answer                                   │
│    5. Log decision + scores                             │
└─────────────────────────────────────────────────────────┘
        ↓                       ↓                    ↓
┌──────────────────┐  ┌──────────────────┐  ┌─────────────┐
│ Rule Engine      │  │ RAG Service      │  │ Fallback    │
│                  │  │                  │  │ Service     │
│ • Load rules     │  │ • Embed query    │  │             │
│ • Pattern match  │  │ • Vector search  │  │ • Generic   │
│ • Similarity     │  │ • Compose prompt │  │   response  │
│ • RBAC filter    │  │ • Call LLM       │  │ • Escalate  │
│ • Confidence     │  │ • RBAC filter    │  │             │
│   score          │  │ • Confidence     │  │             │
│                  │  │   score          │  │             │
└──────────────────┘  └──────────────────┘  └─────────────┘
        ↓                       ↓                    ↓
┌──────────────────────────────────────────────────────────┐
│              DATA LAYER (MongoDB)                        │
│                                                          │
│  Collections:                                           │
│  • chatbot_rules                                        │
│    { _id, tenantId, pattern, embedding, response,      │
│      priority, allowedRoles, isActive }                │
│                                                         │
│  • chatbot_documents                                    │
│    { _id, tenantId, title, content, embedding,         │
│      tags, allowedRoles, type }                        │
│                                                         │
│  • chatbot_messages (logging)                          │
│    { _id, userId, tenantId, query, answer,             │
│      source: 'rule'|'rag'|'fallback', scores,          │
│      timestamp }                                       │
└──────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Component | File | Tanggung Jawab |
|-----------|------|---|
| Route | `src/routes/chatbot.routes.js` | HTTP endpoints |
| Controller | `src/controllers/chatbot.controller.js` | Auth, input validation |
| Service (Orchestrator) | `src/services/chatbot.service.js` | Decide rule vs RAG vs fallback |
| Rule Engine | `src/services/ruleEngine.service.js` | Pattern matching + similarity |
| RAG Service | `src/services/rag.service.js` | Embedding, search, LLM prompt |
| Fallback Service | `src/services/fallback.service.js` | Default responses, escalation |
| Models | `src/models/` | `chatbot_rule.js`, `chatbot_document.js`, `chatbot_message.js` |
| Utils | `src/utils/` | Embedding helper, similarity calc, text normalization |
| Config | `src/config/` | Thresholds, API keys, environment variables |

---

## 🔧 Design Principles & Best Practices

### 1. Single Orchestrator Pattern
**❌ Bad:** Hai API riêng biệt → inconsistent behavior
```js
POST /api/chatbot/ask-rule
POST /api/chatbot/ask-rag
```

**✅ Good:** Một orchestrator quyết định:
```js
async handleUserMessage({ user, text, metadata }) {
  const ruleResult = await ruleEngine.match(text, user);
  if (ruleResult.confidence >= CONFIG.RULE_MIN_CONFIDENCE) {
    return { ...ruleResult, source: 'rule' };
  }
  
  const ragResult = await ragService.retrieveAndAnswer(text, user);
  if (ragResult.confidence >= CONFIG.RAG_MIN_CONFIDENCE) {
    return { ...ragResult, source: 'rag' };
  }
  
  return await fallbackService.answer(text, user);
}
```

### 2. Config-Driven Thresholds
**`.env` hoặc MongoDB config:**
```
RULE_MIN_CONFIDENCE=0.35
RAG_MIN_CONFIDENCE=0.15
ENABLE_RAG=true
ENABLE_RULES=true
RULE_PRIORITY_OVER_RAG=true  // Khi cả 2 high confidence, dùng rule
```

→ Cho phép tuning mà không cần deploy lại

### 3. Always Log Decisions
```js
// Log: { userId, query, ruleScore, ragScore, source, chosenEngine }
// Dùng để debug + tune thresholds
await chatbotMessageModel.create({
  userId: user.id,
  tenantId: user.tenantId,
  query: text,
  answer: result.answer,
  source: result.source,
  scores: {
    ruleScore: ruleResult?.score,
    ragScore: ragResult?.score,
  },
  timestamp: new Date()
});
```

### 4. RBAC Integration
**Rule Engine:**
```js
// Filter rules based on user's role + tenant
const applicableRules = await chatbotRuleModel.find({
  tenantId: user.tenantId,
  isActive: true,
  $or: [
    { allowedRoles: { $exists: false } },  // Public rules
    { allowedRoles: { $in: user.roles } }   // User's roles
  ]
});
```

**RAG Retriever:**
```js
// Filter documents in vector search
const relevantDocs = await chatbotDocumentModel.find({
  tenantId: user.tenantId,
  $or: [
    { allowedRoles: { $exists: false } },
    { allowedRoles: { $in: user.roles } }
  ]
  // Vector similarity + filters
});
```

### 5. Stateless & Scalable
- ✅ Lưu conversation history trong MongoDB
- ✅ Không dùng in-memory state
- ✅ Cho phép horizontal scaling với load balancer

---

## 📊 Comparison: Rule-based vs RAG

| Tính Năng | Rule-based | RAG |
|-----------|-----------|-----|
| **Nguồn Trả Lời** | Pattern code | Tài liệu thực |
| **Cập Nhật Content** | Fix code + deploy | Upload tài liệu |
| **Câu Hỏi Lạ** | ❌ Không | ✅ Có (qua suy luận) |
| **Tốc Độ** | ⚡ Nhanh | 🐢 Chậm hơn (LLM) |
| **Độ Chính Xác** | 🎯 Cao (trong scope) | 📚 Cao (nếu KB tốt) |
| **Bảo Trì** | 😰 Khó (code) | 😊 Dễ (docs) |
| **Linh Hoạt** | 🔴 Thấp | 🟢 Cao |
| **Cần Training?** | Không | Không |

→ **Kết luận:** Kết hợp = tốt nhất cho cả speed & flexibility

---

## 🚀 4 PHASE IMPLEMENTATION PLAN

### **PHASE 1: Refactor Rule-based Chatbot (S-M, 2-3 days)**

**Mục tiêu:** Sạch code + setup architecture sẵn sàng cho RAG

**Tasks:**

1. **Refactor existing chatbot logic into services**
   - Extract logic từ route → `chatService`
   - Tạo `ruleEngine.service.js` riêng
   - Giữ nguyên functionality hiện tại

2. **Create MongoDB models for rules**
   - Model: `chatbot_rule.js`
   - Fields: `pattern`, `embedding`, `responseTemplate`, `priority`, `allowedRoles`, `tenantId`, `isActive`
   - Migration: convert existing hardcoded rules → Mongo docs

3. **Implement NLP-based rule matching**
   - Dùng `string-similarity` library
   - Cosine similarity matching (không phải exact match)
   - Return: `{ answer, confidence, matchedRuleId, source: 'rule' }`

4. **Add confidence thresholding**
   - Config: `RULE_MIN_CONFIDENCE` (default 0.35)
   - Log: `{ ruleScore, chosenRule, timestamp }`

5. **Integrate JWT + RBAC**
   - `authMiddleware` verify token
   - Filter rules by `allowedRoles` + `tenantId`
   - Pass `userContext` to services

6. **Organize logging**
   - Create `chatbot_messages` collection
   - Log every query + decision

**Deliverables:**
- ✅ Clean service layer architecture
- ✅ Rule engine hoạt động với similarity matching
- ✅ Existing behavior preserved
- ✅ Logging + audit trail
- ✅ RBAC integrated

**Verification:**
```bash
# Test endpoints
curl -X POST http://localhost:5000/api/chatbot/ask-anything \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"question": "Hoạt động sắp tới?"}'

# Check logs
db.chatbot_messages.find().sort({ _id: -1 }).limit(5)
```

---

### **PHASE 2: Introduce Basic RAG (M-L, 3-4 days)**

**Mục tiêu:** Add knowledge base search + combine với rule-based

**Tasks:**

1. **Design knowledge base schema**
   - Model: `chatbot_document.js`
   - Fields:
     ```js
     {
       _id: ObjectId,
       tenantId: String,
       type: 'faq' | 'regulation' | 'activity' | 'guide',
       title: String,
       content: String,
       embedding: [Number],  // Vector 1536 dim (từ embedding API)
       tags: [String],
       allowedRoles: [String],
       createdAt: Date,
       updatedAt: Date
     }
     ```

2. **Create document ingestion endpoints (admin)**
   ```
   POST   /api/chatbot/documents          (Create)
   GET    /api/chatbot/documents          (List)
   PUT    /api/chatbot/documents/:id      (Update)
   DELETE /api/chatbot/documents/:id      (Delete)
   POST   /api/chatbot/documents/bulk     (CSV upload)
   ```

3. **Implement embedding generation**
   - Trên save/update tự động generate embedding
   - Dùng `string-similarity` cho v1 (simple), sau upgrade sang embedding API
   - Hook: `chatbot_document.pre('save', generateEmbedding)`

4. **Build RAG retriever**
   - File: `ragService.js`
   - Công việc:
     1. Normalize user query
     2. Generate query embedding
     3. Vector search: cosine similarity với all docs
     4. Filter by `tenantId` + `allowedRoles`
     5. Top-k results → compose context
     6. (Tuỳ) Call LLM với context để tạo answer
   - Return: `{ answer, confidence, retrievedDocIds, source: 'rag' }`

5. **Integrate RAG into orchestrator**
   ```js
   async handleUserMessage({ user, text }) {
     // Step 1: Try rule-based
     const ruleResult = await ruleEngine.match(text, user);
     if (ruleResult.confidence >= CONFIG.RULE_MIN_CONFIDENCE) {
       return { ...ruleResult, source: 'rule' };
     }
     
     // Step 2: Try RAG
     const ragResult = await ragService.retrieveAndAnswer(text, user);
     if (ragResult.confidence >= CONFIG.RAG_MIN_CONFIDENCE) {
       return { ...ragResult, source: 'rag' };
     }
     
     // Step 3: Fallback
     return await fallbackService.answer(text, user);
   }
   ```

6. **Update logging**
   - Log: `{ ruleScore, ragScore, source, retrievedDocIds }`
   - Cho phép debug + threshold tuning

**Knowledge Base Examples (Seed Data):**

```js
// Quy định PVCD
{
  type: 'regulation',
  title: 'Quy định điểm PVCD',
  content: 'Mỗi sinh viên phải tham gia ít nhất 10 hoạt động PVCD...',
  tags: ['PVCD', 'regulation'],
  allowedRoles: ['student', 'staff']
}

// Hướng dẫn đăng ký
{
  type: 'guide',
  title: 'Cách đăng ký hoạt động',
  content: 'Sinh viên có thể đăng ký hoạt động thông qua...',
  tags: ['registration', 'guide'],
  allowedRoles: ['student']
}

// Hoạt động sắp tới
{
  type: 'activity',
  title: 'Ngày hội Tình nguyện 20/12',
  content: 'Gồm các phần: hiến máu, dọn vệ sinh...',
  tags: ['upcoming', 'volunteer'],
  allowedRoles: ['student', 'staff']
}
```

**Deliverables:**
- ✅ Knowledge base schema + models
- ✅ Admin CRUD endpoints for documents
- ✅ RAG retriever service
- ✅ Hybrid orchestrator (rule + RAG)
- ✅ Integrated logging with scores
- ✅ Initial seed data

**Verification:**
```bash
# Create document
curl -X POST http://localhost:5000/api/chatbot/documents \
  -H "Authorization: Bearer <admin-token>" \
  -d '{"title": "...", "content": "...", "type": "faq"}'

# Test hybrid chatbot
curl -X POST http://localhost:5000/api/chatbot/ask-anything \
  -H "Authorization: Bearer <token>" \
  -d '{"question": "Quy định PVCD?"}'

# Check logs
db.chatbot_messages.aggregate([
  { $match: { createdAt: { $gte: new Date(Date.now() - 1000*60*5) } } },
  { $group: { _id: '$source', count: { $sum: 1 } } }
])
```

---

### **PHASE 3: Harden RBAC, Observability, Tuning (M, 2-3 days)**

**Mục tiêu:** Production-ready dengan safety + monitoring

**Tasks:**

1. **Strict RBAC enforcement**
   - ✅ Rule engine filters by `allowedRoles` + `tenantId`
   - ✅ RAG retriever strict filters in vector query
   - ✅ No data leakage between tenants
   - Test: malicious role/tenant → verify 0 data returned

2. **Metrics & Monitoring**
   - Dashboard (dùng existing monitoring tool hoặc simple Mongo queries):
     - Total requests / day
     - Engine usage % (rule vs RAG vs fallback)
     - Avg latency per engine
     - Top unanswered questions (fallback usage)
     - User satisfaction (từ feedback future)

3. **Admin UI for Rule/Document Management**
   - React component / Admin page
   - CRUD rules + documents
   - Test input: input question → see which engine + scores fire
   - View logs + trends

4. **Threshold Tuning Based on Data**
   - Analyze logs → adjust `RULE_MIN_CONFIDENCE`, `RAG_MIN_CONFIDENCE`
   - A/B test different thresholds
   - Config reloadable via `.env` hoặc admin panel (no deploy)

5. **Error Handling & Graceful Degradation**
   - If RAG fails (embedding/LLM timeout) → fallback immediately
   - Set timeouts on all external calls
   - Return useful error to user: "Service temporarily unavailable"

6. **Audit Trail**
   - Log `{ userId, roles, query, answer, source, docIds, timestamp }`
   - Dùng để debug permission issues

**Deliverables:**
- ✅ Strict RBAC verified (no data leakage)
- ✅ Monitoring dashboard
- ✅ Admin management UI
- ✅ Tuned thresholds based on real data
- ✅ Error handling + graceful degradation
- ✅ Full audit trail

**Verification:**
```bash
# Test RBAC: student tries to access staff-only doc
curl -X POST /api/chatbot/ask-anything \
  -H "Authorization: Bearer <student-token>" \
  -d '{"question": "...staff-only question..."}'
# → Expect: should not retrieve staff docs, fallback answer

# Check monitoring
curl http://localhost:5000/api/chatbot/analytics?period=7d
```

---

### **PHASE 4: Scalability & Advanced Features (L, optional, 4-5 days)**

**Mục tiêu:** Handle higher load, larger KB, separate concern

**Tasks (Optional - only if needed):**

1. **Background job for embeddings**
   - Use Bull queue + Redis (or simple cron for small scale)
   - Workflow:
     1. Admin uploads document
     2. Save to Mongo (without embedding)
     3. Set `needsEmbedding: true`
     4. Background job processes async
     5. Update embedding + clear flag
   - Pro: Don't block API on slow embedding calls

2. **Dedicated Vector Search**
   - MongoDB Atlas Vector Search (if using Atlas)
   - Or: Pinecone, Weaviate, PGVector
   - Benefit: Much faster for large KB (10k+ docs)

3. **Caching hotspots**
   - Redis cache for:
     - Frequent query → answer pairs
     - Popular document chunks by ID
   - TTL: 1 hour (configurable)

4. **Conversation context handling**
   - Store recent messages in session
   - Use context for follow-up questions
   - Reduce redundant vector searches

5. **Semantic router (optional)**
   - Lightweight classifier:
     - FAQ-like → route to rule engine
     - Knowledge-seek → route to RAG
     - Chit-chat → route to LLM
   - Reduces unnecessary vector searches

6. **Separate Chatbot Microservice (if needed)**
   - Standalone Node/Express app
   - Independent scaling
   - Own database/cache
   - Called by main backend via `/chat/query` API

**Deliverables (optional):**
- ✅ Background embedding jobs
- ✅ Dedicated vector search (if KB large)
- ✅ Redis caching
- ✅ Conversation context
- ✅ Semantic router (optional)
- ✅ Microservice separation (if needed)

**When to trigger Phase 4:**
- ⚠️ P95 latency > 2-3 seconds
- ⚠️ KB > 10k documents
- ⚠️ Multi-tenant load causing noisy neighbors
- ⚠️ Ops complexity requires independent deployment

---

## 📝 Technology Stack & Dependencies

### New Libraries to Install

```bash
# Rule-based + similarity
npm install string-similarity

# NLP & tokenization (optional for v1, recommended for v2)
npm install natural vi-tokenizer

# Embedding (if using external service)
npm install openai  # or @langchain/core for framework

# Queue + background jobs (Phase 4)
npm install bull redis

# Caching (Phase 3+)
npm install redis

# Existing (already in PBL6)
# - axios (HTTP requests)
# - mongoose (MongoDB ORM)
# - jsonwebtoken (JWT)
# - bcryptjs (password hashing)
# - express (web framework)
```

### External Services (Optional)

| Service | Phase | Purpose |
|---------|-------|---------|
| OpenAI API | 2+ | Embeddings + LLM completion (optional) |
| Google Cloud Vertex AI | 2+ | Alternative to OpenAI |
| Pinecone | 4 | Dedicated vector DB (if scaling) |
| MongoDB Atlas Vector Search | 4 | Native vector search (if using Atlas) |
| Redis | 3+ | Caching + session management |

---

## 🧪 Testing Strategy

### Unit Tests

```js
// Test rule engine
describe('ruleEngine', () => {
  it('should match similar patterns', async () => {
    const result = await ruleEngine.match('Hoạt động sắp tới?', mockUser);
    expect(result.confidence).toBeGreaterThan(0.35);
    expect(result.answer).toBeDefined();
  });
  
  it('should filter rules by RBAC', async () => {
    const result = await ruleEngine.match('staff-only question', studentUser);
    expect(result).toBeNull();
  });
});

// Test RAG service
describe('ragService', () => {
  it('should retrieve relevant documents', async () => {
    const result = await ragService.retrieveAndAnswer('Quy định PVCD?', mockUser);
    expect(result.confidence).toBeGreaterThan(0.15);
    expect(result.retrievedDocIds.length).toBeGreaterThan(0);
  });
});
```

### Integration Tests

```js
// Test orchestrator
describe('chatbot orchestrator', () => {
  it('should prefer rule over RAG when rule confidence high', async () => {
    const result = await chatService.handleUserMessage({
      user: mockUser,
      text: 'exact rule match'
    });
    expect(result.source).toBe('rule');
  });
  
  it('should fallback when neither rule nor RAG confident', async () => {
    const result = await chatService.handleUserMessage({
      user: mockUser,
      text: 'completely random gibberish 的な 😀'
    });
    expect(result.source).toBe('fallback');
  });
});
```

### Manual Testing (QA)

```
1. Test each rule + document retrieval manually
2. Test boundary cases:
   - Empty query
   - Very long query
   - Non-Vietnamese text
   - Multiple languages mixed
3. RBAC testing:
   - Staff-only content not visible to students
   - Tenant isolation
4. Performance:
   - Latency per engine
   - Concurrent load testing
5. Admin UI:
   - Create/edit/delete rules
   - Bulk upload documents
   - View logs + trends
```

---

## 📊 Timeline & Effort Estimate

| Phase | Duration | Effort | Priority |
|-------|----------|--------|----------|
| **1** | 2-3 days | Small-Medium | 🔴 Critical |
| **2** | 3-4 days | Medium-Large | 🔴 Critical |
| **3** | 2-3 days | Medium | 🟡 High |
| **4** | 4-5 days | Large | 🟢 Optional |
| **Total** | ~10-14 days | | |

**Critical Path:** Phase 1 → Phase 2 (must be sequential)  
**Phase 3 & 4:** Can run in parallel after Phase 2

---

## 🎯 Success Criteria

### Phase 1 ✅
- [ ] Existing rule-based chatbot works identically (backward compatible)
- [ ] Code organized in services (testable + maintainable)
- [ ] Rules stored in MongoDB (not hardcoded)
- [ ] Similarity matching works (not exact match only)
- [ ] RBAC integrated
- [ ] Logging functional

### Phase 2 ✅
- [ ] Knowledge base CRUD working
- [ ] Embeddings generated on document save
- [ ] RAG retriever returns relevant docs
- [ ] Hybrid orchestrator makes correct decision (rule vs RAG)
- [ ] Logs show source + scores
- [ ] Fallback response works

### Phase 3 ✅
- [ ] RBAC verified (no data leakage)
- [ ] Monitoring dashboard shows key metrics
- [ ] Admin UI functional for rules + docs
- [ ] Thresholds tuned based on real data
- [ ] Error handling graceful (no crashes)
- [ ] Audit trail complete

### Phase 4 ✅ (If triggered)
- [ ] Background jobs working
- [ ] Vector search fast (< 500ms p95)
- [ ] Caching reduces latency
- [ ] Conversation context preserved
- [ ] Separate microservice deployment (if chosen)

---

## 🚨 Potential Pitfalls & Mitigations

| Pitfall | Symptom | Solution |
|---------|---------|----------|
| **Bad thresholds** | Users get RAG answers when perfect rule exists | Log scores, tune env vars, A/B test |
| **RAG too slow** | Multi-second latency on searches | Add timeouts, reduce top-k, cache |
| **Data leakage** | Staff docs visible to students | Strict RBAC filters, test with malicious roles |
| **Embedding drift** | Changing embedding model breaks similarity | Version embeddings, batch re-embed |
| **Rule explosion** | Too many overlapping rules | Require priority, group by category |
| **LLM hallucination** | RAG response doesn't match KB | Use strict system prompt: "Answer only from context" |
| **Multi-tenant conflicts** | Tenant A sees tenant B docs | Always filter by `tenantId` first |
| **High ops complexity** | Hard to debug + maintain | Monitor + log everything, use metrics |

---

## 📚 Reference Docs

- [Requirements Link](https://chatgpt.com/share/69357c4a-46f8-8001-807c-5be6dadc3e65)
- [PBL6 Architecture](./API_DOCUMENTATION.md)
- [Current Chatbot Code](./CHATBOT_TONG_HOP.md)

---

## 📞 Next Steps

1. **Confirm Plan** ← You are here
2. **Gather Stakeholder Approval** on phases + timeline
3. **Start Phase 1** (Refactor rule engine)
4. **Create GitHub Issues** for each task
5. **Set up CI/CD** for testing
6. **Review after each phase** before proceeding to next

---

## 📝 Questions to Answer

1. **Do you want to use OpenAI/LLM for RAG answer generation, or just retrieve + concatenate docs?**
   - With LLM: More natural answers, costs money, slower
   - Without LLM: Just retrieval, faster, free, but less flexible

2. **Knowledge base sources:**
   - Pull from existing Activity, Regulation, FAQ data in Mongo?
   - Upload via admin UI?
   - Both?

3. **Priority for Phase 3 + 4:**
   - Need Phase 3 (monitoring + tuning) before production?
   - Phase 4 (scaling) - wait until traffic > 100 req/day?

4. **Admin UI scope:**
   - Just rule/document CRUD?
   - Include logs viewer + test input tool?
   - Full analytics dashboard?

---

**Prepared by:** Amp (AI Assistant)  
**Date:** Dec 14, 2025  
**Status:** 📋 Pending Approval
