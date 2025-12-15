# 📋 Phase 1 Migration Guide - Hybrid Chatbot Refactor

## Overview
Phase 1 refactors the existing chatbot logic from hardcoded routes into a clean service-based architecture. The goal is to maintain **100% backward compatibility** while organizing code for RAG integration in Phase 2.

## What Changed

### ✅ New Files Created
1. **Models**
   - `src/models/chatbot_rule.model.js` - MongoDB schema for rules
   - `src/models/chatbot_message.model.js` - Logging schema

2. **Services**
   - `src/services/ruleEngine.service.js` - Pattern matching with similarity
   - `src/services/chatbot.service.js` - Orchestrator (main decision logic)
   - `src/services/fallback.service.js` - Default responses

3. **Config & Controller**
   - `src/config/chatbot.config.js` - Configuration with env variables
   - `src/controllers/chatbot.controller.js` - Request handling + validation

4. **Routes**
   - `src/routes/chatbot.routes.js` - Clean API endpoints

5. **Scripts**
   - `scripts/seed-chatbot-rules.js` - Populate initial rules
   - `tests/ruleEngine.test.js` - Unit test skeleton

## API Endpoints

### User Endpoints (all require authentication)

**POST `/api/chatbot/ask-anything`**
- Ask a question
- Request body: `{ question: string }`
- Response: `{ success, data: { answer, source, confidence, responseTime } }`

```bash
curl -X POST http://localhost:5000/api/chatbot/ask-anything \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"question": "Hoạt động sắp tới?"}'
```

**GET `/api/chatbot/history`**
- Get user's chat history
- Query params: `limit`, `page`
- Response: `{ success, data: [...], pagination }`

```bash
curl http://localhost:5000/api/chatbot/history?limit=20&page=1 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Admin Endpoints

**GET `/api/chatbot/rules`**
- List all rules for tenant
- Query params: `isActive` (true/false)

**POST `/api/chatbot/rules`**
- Create new rule
- Body: `{ pattern, keywords, responseTemplate, priority, allowedRoles, type }`

**PUT `/api/chatbot/rules/:id`**
- Update rule
- Body: same as POST

**DELETE `/api/chatbot/rules/:id`**
- Delete rule

**POST `/api/chatbot/test-query`**
- Test a query against rules (for debugging)
- Body: `{ query: string }`
- Response: Shows which rule matches and score

**GET `/api/chatbot/analytics`**
- Get chatbot usage analytics
- Query params: `timeRange` (hour, day, week, month)
- Response: Stats on rule vs RAG vs fallback usage

**GET `/api/chatbot/messages`**
- List chat messages (admin logs)
- Query params: `limit`, `page`, `source` (rule/rag/fallback), `userId`

## Configuration

### Environment Variables

```bash
# Feature flags
CHATBOT_ENABLE_RULES=true
CHATBOT_ENABLE_RAG=false  # Will be enabled in Phase 2
CHATBOT_RULE_PRIORITY_OVER_RAG=true

# Confidence thresholds (0-1)
CHATBOT_RULE_MIN_CONFIDENCE=0.35
CHATBOT_RAG_MIN_CONFIDENCE=0.15

# Logging
CHATBOT_LOG_MESSAGES=true
CHATBOT_LOG_SCORES=true

# RAG settings (Phase 2)
CHATBOT_RAG_TOP_K=5
CHATBOT_RAG_TIMEOUT_MS=5000
```

These are loaded in `src/config/chatbot.config.js`.

## How to Seed Initial Rules

```bash
# From backend directory
node scripts/seed-chatbot-rules.js
```

Output:
```
✓ Connected to MongoDB
✓ Seeded 8 chatbot rules

Total rules in database: 8

Seeded rules:
  1. hoạt động sắp tới (priority: 8, active: true)
  2. đăng ký hoạt động (priority: 9, active: true)
  3. yêu cầu cấp bằng cấp (priority: 8, active: true)
  ...
```

## How It Works

### Decision Flow

```
User Question
    ↓
Controller validates + extracts user context (auth, roles, tenant)
    ↓
ChatbotService.handleUserMessage()
    ├─ Try RuleEngine.match()
    │   ├─ Load applicable rules (filter by RBAC + tenant)
    │   ├─ Normalize question (Vietnamese diacritics)
    │   ├─ Calculate similarity with string-similarity library
    │   ├─ Apply priority weighting
    │   └─ Check confidence threshold (≥ 0.35 default)
    │
    ├─ If rule matched: return { answer, source='rule', confidence, ... }
    │
    ├─ Try RAG (Phase 2)
    │   ├─ If not implemented: skip
    │   └─ If implemented: similar flow to rules
    │
    ├─ Fallback: return generic response
    │
    └─ Log to MongoDB
        (userId, query, answer, source, scores, timestamp)
```

### Key Components

**RuleEngineService**
- `match(question, userContext)` - Main matching function
- `normalizeText(text)` - Remove diacritics, lowercase, etc.
- `calculateSimilarity(query, keywords)` - Cosine similarity using string-similarity
- `getApplicableRules(userContext)` - RBAC filtering
- CRUD: `getAllRules()`, `createRule()`, `updateRule()`, `deleteRule()`

**ChatbotService (Orchestrator)**
- `handleUserMessage()` - Main entry point
- `logMessage()` - Save to MongoDB
- `getChatHistory()` - Retrieve user's history
- `getAnalytics()` - Usage statistics

**FallbackService**
- `getFallbackResponse(reason)` - Generic responses
- `answer()` - Create fallback result
- `suggestEscalation()` - Escalate to support

## Testing

### Run Unit Tests
```bash
npm test -- tests/ruleEngine.test.js
```

### Manual Testing

**Test 1: Basic Q&A**
```bash
curl -X POST http://localhost:5000/api/chatbot/ask-anything \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question": "Hoạt động sắp tới?"}'
```

Expected: Should match "hoạt động sắp tới" rule with confidence > 0.35

**Test 2: Fuzzy Matching**
```bash
curl -X POST http://localhost:5000/api/chatbot/ask-anything \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question": "Có hoạt động nào sắp diễn ra không?"}'
```

Expected: Should still match despite wording differences

**Test 3: RBAC**
```bash
# Login as student, ask staff-only question
curl -X POST http://localhost:5000/api/chatbot/ask-anything \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question": "Cách quản lý hoạt động?"}'
```

Expected: Fallback response (rule requires 'staff' role)

**Test 4: Admin Test Query**
```bash
curl -X POST http://localhost:5000/api/chatbot/test-query \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "Hoạt động sắp tới"}'
```

Response should show:
```json
{
  "success": true,
  "data": {
    "query": "Hoạt động sắp tới",
    "ruleMatch": {
      "answer": "...",
      "confidence": 0.95,
      "matchedRuleId": "..."
    },
    "ragMatch": null
  }
}
```

## Backward Compatibility

✅ **Old endpoint still works** (if still mounted):
- Original `/api/chatbot/ask` code still handles questions
- Responses have same format
- User sees no difference

✅ **New endpoint** (`/api/chatbot/ask-anything`):
- Uses refactored service architecture
- Identical behavior to old endpoint
- Ready for Phase 2 RAG integration

## Migration Checklist

- [x] Create MongoDB models
- [x] Create service layer (rule engine, orchestrator, fallback)
- [x] Create controller layer
- [x] Create new routes (clean, organized)
- [x] Create config file with env variables
- [x] Install string-similarity dependency
- [x] Create seed script with 8 initial rules
- [x] Create unit test skeleton
- [x] Test backward compatibility
- [x] Document API endpoints

## Next Steps

After Phase 1 approval:
1. **Test thoroughly** with real users
2. **Monitor** rule matching accuracy
3. **Tune thresholds** based on logs
4. **Phase 2**: Integrate RAG system

## Troubleshooting

### Rules not matching
- Check threshold: `CHATBOT_RULE_MIN_CONFIDENCE` (default 0.35)
- Verify rule is active: `isActive: true`
- Check RBAC: `allowedRoles` includes user's role or is empty
- Test with `/api/chatbot/test-query` endpoint

### Logging not working
- Verify MongoDB connection: check `MONGODB_URI`
- Check `CHATBOT_LOG_MESSAGES=true` in .env
- Check logs: `ChatbotMessage` collection in MongoDB

### High latency
- Default threshold is reasonable (< 100ms for rule matching)
- If slow: reduce rule count or optimize normalizeText()

## Files Structure After Phase 1

```
backend/
├── src/
│   ├── models/
│   │   ├── chatbot_rule.model.js          ✅ NEW
│   │   ├── chatbot_message.model.js       ✅ NEW
│   │   └── ... (existing models)
│   ├── controllers/
│   │   ├── chatbot.controller.js          ✅ NEW (refactored)
│   │   └── ... (existing)
│   ├── services/
│   │   ├── chatbot.service.js             ✅ NEW
│   │   ├── ruleEngine.service.js          ✅ NEW
│   │   ├── fallback.service.js            ✅ NEW
│   │   └── ... (existing)
│   ├── routes/
│   │   ├── chatbot.routes.js              ✅ NEW (refactored)
│   │   └── ... (existing)
│   ├── config/
│   │   ├── chatbot.config.js              ✅ NEW
│   │   └── ... (existing)
│   └── ... (other existing files)
├── scripts/
│   ├── seed-chatbot-rules.js              ✅ NEW
│   └── ... (existing scripts)
├── tests/
│   ├── ruleEngine.test.js                 ✅ NEW
│   └── ... (existing tests)
├── docs/
│   ├── PHASE1_MIGRATION.md                ✅ THIS FILE
│   └── ... (existing docs)
└── ... (existing files)
```

---

## Performance Metrics (Phase 1)

Expected performance (after seeding rules):
- Rule matching: < 50ms per query
- Logging: < 20ms per query
- Total response time: < 150ms

Monitor with: `GET /api/chatbot/analytics?timeRange=day`

---

**Last Updated:** Dec 14, 2025  
**Status:** ✅ Phase 1 Complete  
**Next Phase:** Phase 2 - RAG Integration
