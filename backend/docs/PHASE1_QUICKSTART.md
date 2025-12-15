# 🚀 Phase 1 Quick Start Guide

## ⚡ TL;DR - Get Running in 5 Minutes

### 1. Add to `.env` (backend root)
```bash
CHATBOT_ENABLE_RULES=true
CHATBOT_RULE_MIN_CONFIDENCE=0.35
CHATBOT_LOG_MESSAGES=true
```

### 2. Seed rules
```bash
cd backend
node scripts/seed-chatbot-rules.js
```

### 3. Start server
```bash
npm run dev
```

### 4. Test
```bash
# Get token
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"student1","password":"password123"}' \
  | grep -o '"token":"[^"]*' | head -1 | cut -d'"' -f4)

# Ask question
curl -X POST http://localhost:5000/api/chatbot/ask-anything \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question":"Hoạt động sắp tới?"}'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "answer": "Để xem hoạt động sắp tới...",
    "source": "rule",
    "confidence": 0.95,
    "responseTime": 45
  }
}
```

---

## 📋 What Was Implemented

### New Services
| File | Purpose |
|------|---------|
| `ruleEngine.service.js` | Pattern matching with fuzzy string similarity |
| `chatbot.service.js` | Main orchestrator (rules → RAG → fallback) |
| `fallback.service.js` | Default responses |

### New Models
| File | Purpose |
|------|---------|
| `chatbot_rule.model.js` | Store rules in MongoDB |
| `chatbot_message.model.js` | Log queries & responses |

### New Controllers & Routes
| File | Purpose |
|------|---------|
| `chatbot.controller.js` | Handle API requests |
| `chatbot.routes.js` | Define endpoints |

### New Config
| File | Purpose |
|------|---------|
| `chatbot.config.js` | Configuration + environment variables |

### New Utilities
| File | Purpose |
|------|---------|
| `seed-chatbot-rules.js` | Populate initial 8 rules |
| `ruleEngine.test.js` | Test skeleton |

---

## 📡 API Endpoints

### User Endpoints (need JWT token)

**Ask Question**
```
POST /api/chatbot/ask-anything
Content-Type: application/json
Authorization: Bearer <token>

{"question": "Hoạt động sắp tới?"}
```

Response: `{ answer, source, confidence, responseTime }`

**Get History**
```
GET /api/chatbot/history?limit=20&page=1
```

### Admin Endpoints

**Manage Rules**
```
GET    /api/chatbot/rules
POST   /api/chatbot/rules
PUT    /api/chatbot/rules/:id
DELETE /api/chatbot/rules/:id
```

**Test Query**
```
POST /api/chatbot/test-query
{"query": "Hoạt động sắp tới"}
```

Shows which rule matches + confidence score.

**View Analytics**
```
GET /api/chatbot/analytics?timeRange=day
```

Shows usage: how many used rule vs fallback, avg response time, etc.

---

## 🔧 Configuration

All config is in `.env` file. No code changes needed to tune!

```bash
# Enable/disable
CHATBOT_ENABLE_RULES=true              # Use rule engine
CHATBOT_ENABLE_RAG=false               # Phase 2

# Thresholds (0-1)
CHATBOT_RULE_MIN_CONFIDENCE=0.35       # How confident must rule be?
CHATBOT_RAG_MIN_CONFIDENCE=0.15        # (Phase 2)

# Logging
CHATBOT_LOG_MESSAGES=true              # Save queries to DB
CHATBOT_LOG_SCORES=true                # Save confidence scores
```

### How to Tune Threshold

Lower `CHATBOT_RULE_MIN_CONFIDENCE` → more matches, lower accuracy
Higher → fewer matches, higher accuracy

Recommended: **0.30 - 0.40**

Change `.env` → restart server → test again. No code deploy needed!

---

## 📊 What Gets Logged

Every query is saved to MongoDB `chatbot_message` collection:

```json
{
  "_id": "...",
  "userId": "...",
  "tenantId": "default",
  "query": "Hoạt động sắp tới?",
  "answer": "Để xem hoạt động sắp tới...",
  "source": "rule",
  "scores": {
    "ruleScore": 0.95,
    "ragScore": null
  },
  "matchedRuleId": "...",
  "responseTime": 45,
  "timestamp": "2025-12-14T10:30:00Z"
}
```

View logs:
```
GET /api/chatbot/messages?limit=50&page=1
```

---

## 🎯 Initial Rules (8 rules seeded)

1. **hoạt động sắp tới** (priority 8) → For everyone
2. **đăng ký hoạt động** (priority 9) → For everyone
3. **yêu cầu cấp bằng cấp** (priority 8) → Students only
4. **quản lý hoạt động** (priority 8) → Staff only
5. **điểm danh** (priority 8) → For everyone
6. **nộp bằng chứng** (priority 7) → Students only
7. **quy định tham gia** (priority 7) → For everyone
8. **hỗ trợ trực tuyến** (priority 5) → For everyone

See seed script: `scripts/seed-chatbot-rules.js`

---

## 🔐 RBAC Support

Rules can be restricted by role:

```js
// Public rule - everyone can use
{
  pattern: "hoạt động sắp tới",
  allowedRoles: []  // empty = public
}

// Student-only rule
{
  pattern: "yêu cầu cấp bằng cấp",
  allowedRoles: ["student"]
}

// Staff-only rule
{
  pattern: "quản lý hoạt động",
  allowedRoles: ["staff", "admin"]
}
```

Student can't access staff rules - automatically filtered.

---

## 📈 Monitoring

Check how well rules are working:

```
GET /api/chatbot/analytics?timeRange=day
```

Response shows:
- Total queries today
- How many matched rule vs fallback
- Average response time
- Average confidence scores

Use this to decide: do I need to tune thresholds?

---

## ✅ Backward Compatibility

✅ Old API still works (not removed)
✅ New API in parallel 
✅ Identical responses
✅ Same database models

You can switch between old/new routes anytime without breaking existing code.

---

## 🐛 Troubleshooting

**Q: Rules not matching?**
A: Check `/api/chatbot/test-query` endpoint to see confidence score. If low, lower `CHATBOT_RULE_MIN_CONFIDENCE` in `.env`.

**Q: Getting fallback response?**
A: Run test-query, check the score. Might be below threshold.

**Q: Too many wrong matches?**
A: Raise threshold in `.env`.

**Q: Seed script failed?**
A: Make sure MongoDB is running and `MONGODB_URI` in `.env` is correct.

---

## 📚 Full Documentation

- **Setup:** `backend/docs/CHATBOT_ENV_SETUP.md`
- **API Docs:** `backend/docs/PHASE1_MIGRATION.md`
- **Completion:** `PHASE1_COMPLETION_CHECKLIST.md`
- **Implementation Plan:** `CHATBOT_IMPLEMENTATION_PLAN.md`

---

## 🚦 Next Steps

1. ✅ Add `.env` vars
2. ✅ Run seed script
3. ✅ Start server
4. ✅ Test endpoints
5. 📊 Monitor logs
6. 🎚️ Tune thresholds
7. ✨ Phase 2: RAG integration

---

**Ready to go!** 🚀

Questions? Check the full documentation links above.
