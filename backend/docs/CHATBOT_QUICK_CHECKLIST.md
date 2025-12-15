# ⚡ Quick Phase Checklist - Hybrid Chatbot

---

## 🔴 PHASE 1: Refactor (2-3 days)

### Day 1: Setup Foundation
- [ ] Create `chatbot_rule.model.js` (MongoDB model)
- [ ] Create `chatbot_message.model.js` (logging model)
- [ ] Create `chatbot.service.js` (orchestrator)
- [ ] Create `ruleEngine.service.js` (matching logic)
- [ ] Update `chatbot.routes.js` (clean endpoints)
- [ ] Create `chatbot.controller.js` (auth + validation)

### Day 2: Business Logic
- [ ] Implement `ruleEngine.match()` with similarity
- [ ] Implement `normalizeText()` (Vietnamese support)
- [ ] Implement `calculateSimilarity()` using `string-similarity`
- [ ] Implement `orchestrator.handleUserMessage()`
- [ ] Implement `fallback.service.js`
- [ ] Setup config file + .env variables

### Day 3: Test & Migration
- [ ] Install: `npm install string-similarity`
- [ ] Migrate rules: `node scripts/seed-rules.js`
- [ ] Unit tests (rule engine)
- [ ] Integration tests (orchestrator + API)
- [ ] Test RBAC enforcement
- [ ] Write documentation
- [ ] **Verify backward compatibility** ✅

**PHASE 1 DONE:** Architecture clean, tests passing, backward compatible

---

## 🟡 PHASE 2: RAG Integration (3-4 days)

### Day 1: Knowledge Base Setup
- [ ] Create `chatbot_document.model.js` (documents)
- [ ] Create `embedding.service.js` (vector generation)
- [ ] Create `rag.service.js` (retriever)
- [ ] Implement embedding generation (simple v1)
- [ ] Implement `cosineSimilarity()` calculation

### Day 2: Orchestration & Admin API
- [ ] Update orchestrator to call RAG service
- [ ] Add RBAC filtering in RAG queries
- [ ] Create admin routes for document CRUD:
  - [ ] `GET /api/chatbot/documents`
  - [ ] `POST /api/chatbot/documents`
  - [ ] `PUT /api/chatbot/documents/:id`
  - [ ] `DELETE /api/chatbot/documents/:id`
  - [ ] `POST /api/chatbot/documents/bulk-import`

### Day 2-3: Features & Seeding
- [ ] Add admin endpoints:
  - [ ] `POST /api/chatbot/test-query` (test tool)
  - [ ] `GET /api/chatbot/messages` (logs)
  - [ ] `GET /api/chatbot/analytics` (stats)
- [ ] Create knowledge base seed data
- [ ] Run seed script: `node scripts/seed-rag-documents.js`
- [ ] Verify docs in MongoDB with embeddings

### Day 3: Testing
- [ ] Unit tests for embedding service
- [ ] Unit tests for RAG retriever (vector search, RBAC)
- [ ] Integration tests for hybrid orchestration:
  - [ ] Rule match (confidence > threshold)
  - [ ] RAG fallback (when rule low confidence)
  - [ ] Fallback (when both low confidence)
- [ ] Admin API tests
- [ ] Logging tests

**PHASE 2 DONE:** Hybrid chatbot working, knowledge base seeded, admin API functional

---

## 🟡 PHASE 3: Hardening (2-3 days)

### Day 1: RBAC & Security
- [ ] Test data leakage scenarios (student trying to access staff-only doc)
- [ ] Test multi-tenant isolation (tenant A cannot see tenant B docs)
- [ ] Verify RBAC filters in vector search
- [ ] Review permission model
- [ ] Create security test suite

### Day 2: Monitoring & Observability
- [ ] Create analytics queries:
  - [ ] Engine usage % (rule vs RAG vs fallback)
  - [ ] Avg response time per engine
  - [ ] Unanswered questions (fallback usage)
- [ ] Add metrics collection to logs
- [ ] Create monitoring dashboard (simple Mongo queries or Grafana)
- [ ] Setup alerting (if response time > 3s)

### Day 3: Admin UI & Tuning
- [ ] Create React component for admin page:
  - [ ] Rules management table
  - [ ] Documents management table
  - [ ] Test input tool (see which engine fires + scores)
  - [ ] Logs viewer
  - [ ] Analytics charts
- [ ] Implement threshold tuning:
  - [ ] Analyze logs → identify low-confidence matches
  - [ ] Adjust `RULE_MIN_CONFIDENCE`, `RAG_MIN_CONFIDENCE` in config
  - [ ] Test A/B different thresholds
  - [ ] Config reloadable via UI or .env (no deploy)
- [ ] Error handling improvements:
  - [ ] Add timeouts on RAG calls
  - [ ] Graceful fallback if RAG timeout
  - [ ] User-friendly error messages

**PHASE 3 DONE:** Production-ready, secure, monitored, tuned, observable

---

## 🟢 PHASE 4: Scale & Optimize (Optional, 4-5 days)

### Trigger Phase 4 When:
- [ ] P95 latency > 2-3 seconds
- [ ] KB size > 10,000 documents
- [ ] QPS > 100 req/day
- [ ] Multi-tenant conflicts causing noisy neighbors

### Day 1-2: Background Embedding Jobs
- [ ] Setup Bull queue + Redis
- [ ] Create background worker for embeddings
- [ ] Add `needsEmbedding` flag to document model
- [ ] Implement async embedding generation
- [ ] Test with bulk import

### Day 2: Vector DB Upgrade
- [ ] Migrate to MongoDB Atlas Vector Search OR Pinecone
- [ ] Setup vector indexes
- [ ] Batch re-embed all documents
- [ ] Update RAG retriever to use dedicated vector search
- [ ] Performance benchmark (target: < 500ms p95)

### Day 3: Caching
- [ ] Setup Redis
- [ ] Cache frequent query → answer pairs (1hr TTL)
- [ ] Cache document chunk retrieval
- [ ] Monitor cache hit rate
- [ ] Implement cache invalidation on document update

### Day 4: Conversation Context
- [ ] Store recent messages per session
- [ ] Pass context in follow-up queries
- [ ] Reduce redundant vector searches
- [ ] Test multi-turn conversations

### Day 5: Semantic Router (Optional)
- [ ] Create query classifier (is it FAQ, knowledge, chit-chat?)
- [ ] Route FAQ → rule engine
- [ ] Route knowledge → RAG
- [ ] Route chit-chat → LLM/generic response
- [ ] Reduce unnecessary vector searches

**PHASE 4 DONE:** High-performance, scalable, ready for enterprise load

---

## 📝 File Structure After All Phases

```
backend/
├── src/
│   ├── models/
│   │   ├── chatbot_rule.model.js           (Phase 1)
│   │   ├── chatbot_document.model.js       (Phase 2)
│   │   └── chatbot_message.model.js        (Phase 1)
│   ├── controllers/
│   │   └── chatbot.controller.js           (Phase 1 + 2)
│   ├── services/
│   │   ├── chatbot.service.js              (Phase 1 + 2)
│   │   ├── ruleEngine.service.js           (Phase 1)
│   │   ├── rag.service.js                  (Phase 2)
│   │   └── fallback.service.js             (Phase 1)
│   ├── utils/
│   │   └── embedding.service.js            (Phase 2)
│   ├── routes/
│   │   └── chatbot.routes.js               (Phase 1 + 2)
│   ├── config/
│   │   └── chatbot.config.js               (Phase 1)
│   └── middlewares/
│       └── (existing auth, rbac)
├── tests/
│   ├── chatbot.test.js                     (Phase 1)
│   └── chatbot-rag.test.js                 (Phase 2)
├── scripts/
│   ├── seed-rules.js                       (Phase 1)
│   └── seed-rag-documents.js               (Phase 2)
├── seeds/
│   ├── initial-rules.json                  (Phase 1)
│   └── initial-documents.json              (Phase 2)
└── docs/
    ├── PHASE1_MIGRATION.md                 (Phase 1)
    └── PHASE2_MIGRATION.md                 (Phase 2)

frontend/
└── src/
    └── components/
        └── AdminChatbotPanel/              (Phase 3)
            ├── RuleManager.jsx
            ├── DocumentManager.jsx
            ├── TestTool.jsx
            └── Analytics.jsx
```

---

## 🔑 Key Files to Create/Modify

### Phase 1 (7 new files)
```
✨ NEW:
  - backend/src/models/chatbot_rule.model.js
  - backend/src/models/chatbot_message.model.js
  - backend/src/services/chatbot.service.js
  - backend/src/services/ruleEngine.service.js
  - backend/src/services/fallback.service.js
  - backend/src/config/chatbot.config.js
  - backend/scripts/seed-rules.js

📝 MODIFY:
  - backend/src/routes/chatbot.routes.js
  - backend/src/controllers/chatbot.controller.js (extract from routes)
  - .env
  - package.json (add string-similarity)
```

### Phase 2 (5 new files)
```
✨ NEW:
  - backend/src/models/chatbot_document.model.js
  - backend/src/services/rag.service.js
  - backend/src/utils/embedding.service.js
  - backend/scripts/seed-rag-documents.js
  - backend/seeds/initial-documents.json

📝 MODIFY:
  - backend/src/services/chatbot.service.js (add RAG call)
  - backend/src/routes/chatbot.routes.js (add admin routes)
  - backend/src/controllers/chatbot.controller.js (add admin handlers)
  - .env (add RAG config)
```

### Phase 3 (2 new files)
```
✨ NEW:
  - frontend/src/components/AdminChatbotPanel/AdminChatbotPanel.jsx
  - backend/docs/monitoring.md

📝 MODIFY:
  - backend/src/config/chatbot.config.js (add thresholds, monitoring)
  - backend/src/services/chatbot.service.js (add error handling)
```

### Phase 4 (Optional)
```
✨ NEW:
  - backend/src/workers/embedding.worker.js
  - backend/src/services/semanticRouter.service.js
  - backend/src/services/cache.service.js

📝 MODIFY:
  - backend/src/services/rag.service.js (use dedicated vector DB)
  - docker-compose.yml (add Redis)
  - package.json (bull, redis, etc)
```

---

## 📦 Dependencies to Install

### Phase 1
```bash
npm install string-similarity
```

### Phase 2
```bash
npm install natural vi-tokenizer
# (optional for better NLP)
```

### Phase 3
```bash
# No new deps
```

### Phase 4 (Optional)
```bash
npm install bull redis
npm install @langchain/core  # (if upgrading to LLM)
npm install openai  # (if using OpenAI embeddings)
```

---

## ✅ Acceptance Criteria by Phase

### Phase 1 ✅
```
MUST:
  - Existing chatbot API works identically
  - Rules stored in MongoDB (not hardcoded)
  - RBAC enforcement working (verified by tests)
  - Similarity matching works (not exact match)
  - Logging functional (every query logged)
  - Tests passing (>80% code coverage)

NICE TO HAVE:
  - Vietnamese text normalization
  - Priority-based rule matching
```

### Phase 2 ✅
```
MUST:
  - Documents CRUD endpoints working
  - Embeddings generated on save
  - Hybrid orchestration (rule → RAG → fallback)
  - Admin API tested
  - Knowledge base seeded
  - RBAC enforced in RAG search
  - Tests passing (>80% coverage)

NICE TO HAVE:
  - Bulk import endpoint
  - Test query tool for admins
  - Analytics dashboard
```

### Phase 3 ✅
```
MUST:
  - RBAC strictly verified (no data leakage)
  - Monitoring dashboard showing key metrics
  - Thresholds tuned based on real logs
  - Error handling graceful (no crashes)
  - Audit trail complete
  - Admin UI for rule/doc management

NICE TO HAVE:
  - A/B testing framework
  - Custom alerting rules
  - Performance benchmarking
```

### Phase 4 ✅ (If triggered)
```
MUST:
  - Background embedding jobs working
  - Vector search < 500ms p95 latency
  - Caching reducing response time
  - Conversation context working
  - Ready for 1000+ QPS

NICE TO HAVE:
  - Semantic router improving accuracy
  - Microservice separation (if needed)
  - Custom vector DB monitoring
```

---

## 🧪 Testing Checklist

### Phase 1 Tests
- [ ] Rule matching exact patterns
- [ ] Rule matching similar patterns (similarity > 0.35)
- [ ] Rule NOT matching low similarity (fallback)
- [ ] RBAC: student cannot access staff-only rules
- [ ] Tenant isolation (can't access other tenant rules)
- [ ] Logging: every query is logged
- [ ] API: POST /ask-anything returns correct response
- [ ] API: Requires JWT token (401 without auth)

### Phase 2 Tests
- [ ] Embedding generation works
- [ ] Cosine similarity calculated correctly
- [ ] RAG retrieves relevant documents
- [ ] RAG respects RBAC (no staff docs for students)
- [ ] Hybrid: rule match → source='rule'
- [ ] Hybrid: no rule, RAG match → source='rag'
- [ ] Hybrid: neither match → source='fallback'
- [ ] Logging: scores for both engines
- [ ] Admin: create document with embedding
- [ ] Admin: delete document
- [ ] Admin: list documents
- [ ] Admin: test query tool shows scores

### Phase 3 Tests
- [ ] RBAC: student cannot query staff-only knowledge
- [ ] Multi-tenant: tenant A cannot see tenant B knowledge
- [ ] Monitoring: dashboard shows stats
- [ ] Threshold tuning: can change thresholds via config
- [ ] Error handling: graceful response if RAG timeout
- [ ] Audit trail: userId, roles logged per query

### Phase 4 Tests (If done)
- [ ] Background jobs embedding documents
- [ ] Vector search latency < 500ms
- [ ] Cache hit rate > 70% for repeat queries
- [ ] Conversation context maintained across turns
- [ ] Load test: 100+ concurrent users

---

## 📅 Execution Timeline

```
Week 1, Days 1-3: PHASE 1 (Refactor)
├─ Mon-Tue: Setup + Unit Tests
├─ Wed: Migration + Verification
└─ DONE: Clean architecture, tests passing

Week 1, Days 4-5 + Week 2, Days 1-2: PHASE 2 (RAG)
├─ Thu-Fri: Knowledge base setup
├─ Mon-Tue: Orchestration + Admin API
├─ Wed: Seeding + Testing
└─ DONE: Hybrid system working

Week 2, Days 3-5: PHASE 3 (Hardening)
├─ Wed: RBAC verification + Security
├─ Thu: Monitoring setup
├─ Fri: Admin UI + Tuning
└─ DONE: Production-ready

PHASE 4 (Optional): As needed
├─ Trigger: When metrics show need
└─ Timeline: 4-5 days if triggered
```

---

## 📞 What to Do Next

1. **Review this plan** with your team
2. **Confirm:** Can you start Phase 1 this week?
3. **Assign:** Who will work on each component?
4. **Setup:** Create GitHub issues for each task
5. **Kick off:** Start Phase 1 with Task 1.1

---

**Last Updated:** Dec 14, 2025  
**Version:** 1.0  
**Status:** 📋 Ready to Execute
