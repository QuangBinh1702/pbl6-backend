# 🔧 Chatbot Environment Setup - Phase 1

## Add to your `.env` file

```bash
# ============ CHATBOT CONFIGURATION (Phase 1) ============

# Feature flags
CHATBOT_ENABLE_RULES=true
CHATBOT_ENABLE_RAG=false
CHATBOT_RULE_PRIORITY_OVER_RAG=true

# Confidence thresholds (0-1)
# Rule must have at least this confidence to be used
CHATBOT_RULE_MIN_CONFIDENCE=0.35

# RAG will be enabled in Phase 2
CHATBOT_RAG_MIN_CONFIDENCE=0.15

# Logging
CHATBOT_LOG_MESSAGES=true
CHATBOT_LOG_SCORES=true

# RAG settings (Phase 2+)
CHATBOT_RAG_TOP_K=5
CHATBOT_RAG_TIMEOUT_MS=5000

# Maximum response length
CHATBOT_MAX_RESPONSE_LENGTH=2000

# ============ END CHATBOT CONFIG ============
```

## Default Values (if not specified in .env)

| Variable | Default Value | Purpose |
|----------|---------------|---------|
| `CHATBOT_ENABLE_RULES` | `true` | Enable rule-based matching |
| `CHATBOT_ENABLE_RAG` | `false` | Enable RAG (Phase 2) |
| `CHATBOT_RULE_MIN_CONFIDENCE` | `0.35` | Threshold for rule matching |
| `CHATBOT_RAG_MIN_CONFIDENCE` | `0.15` | Threshold for RAG matching |
| `CHATBOT_LOG_MESSAGES` | `true` | Log all queries |
| `CHATBOT_LOG_SCORES` | `true` | Log confidence scores |
| `CHATBOT_RAG_TOP_K` | `5` | Retrieve top-5 documents |
| `CHATBOT_RAG_TIMEOUT_MS` | `5000` | RAG timeout 5 seconds |

## Tuning Thresholds

### RULE_MIN_CONFIDENCE

**Current default: 0.35**

- **Lower (0.2)**: More matches, but lower accuracy
- **Higher (0.5)**: Fewer matches, but very accurate
- **Recommended range**: 0.30 - 0.40

**How to tune:**
1. Monitor logs: `GET /api/chatbot/analytics?timeRange=day`
2. Check: How many queries use fallback?
3. If too many fallback → lower threshold
4. If too many wrong matches → raise threshold

### RAG_MIN_CONFIDENCE

**Current default: 0.15 (for Phase 2)**

Lower than rule threshold because RAG is less confident but more flexible.

## Testing Your Setup

### 1. Verify Config Loads

```bash
cd backend
node -e "require('dotenv').config(); const cfg = require('./src/config/chatbot.config'); console.log('Config loaded:', cfg.ENABLE_RULES, cfg.RULE_MIN_CONFIDENCE)"
```

Expected output:
```
Config loaded: true 0.35
```

### 2. Seed Initial Rules

```bash
node scripts/seed-chatbot-rules.js
```

Expected output:
```
✓ Connected to MongoDB
✓ Seeded 8 chatbot rules

Total rules in database: 8

Seeded rules:
  1. hoạt động sắp tới (priority: 8, active: true)
  2. đăng ký hoạt động (priority: 9, active: true)
  ...
```

### 3. Start Server & Test

```bash
npm run dev
```

Then in another terminal:

```bash
# Login first to get JWT token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "student1", "password": "password123"}'
```

Copy the `token` from response, then:

```bash
# Test the chatbot
curl -X POST http://localhost:5000/api/chatbot/ask-anything \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"question": "Hoạt động sắp tới?"}'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "answer": "Để xem hoạt động sắp tới...",
    "source": "rule",
    "confidence": 0.95,
    "matchedRuleId": "...",
    "responseTime": 45,
    "scores": {
      "ruleScore": 0.95,
      "ragScore": null
    }
  }
}
```

## Configuration Validation

The app validates config on startup. Errors will be shown in console:

```
Error in .env:
  - RULE_MIN_CONFIDENCE must be between 0 and 1
  - RAG_MIN_CONFIDENCE must be between 0 and 1
  - RAG_TOP_K must be >= 1
```

Fix these before starting the server.

## Sample Complete .env Entry

```bash
# === EXISTING CONFIG (don't change) ===
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/pbl6
JWT_SECRET=your_secret_key
# ... other existing vars ...

# === NEW: CHATBOT CONFIG (Phase 1) ===
CHATBOT_ENABLE_RULES=true
CHATBOT_ENABLE_RAG=false
CHATBOT_RULE_PRIORITY_OVER_RAG=true
CHATBOT_RULE_MIN_CONFIDENCE=0.35
CHATBOT_RAG_MIN_CONFIDENCE=0.15
CHATBOT_LOG_MESSAGES=true
CHATBOT_LOG_SCORES=true
CHATBOT_RAG_TOP_K=5
CHATBOT_RAG_TIMEOUT_MS=5000
CHATBOT_MAX_RESPONSE_LENGTH=2000

# ... rest of your config ...
```

## Next Steps

1. ✅ Add env vars to `.env`
2. ✅ Run `node scripts/seed-chatbot-rules.js`
3. ✅ Start server: `npm run dev`
4. ✅ Test endpoints
5. ✅ Monitor logs: `GET /api/chatbot/analytics`
6. ⏭️ Phase 2: RAG integration (set `CHATBOT_ENABLE_RAG=true`)

---

**Need to adjust thresholds?**
1. Edit `.env`
2. Restart server (reads .env on startup)
3. Test again

No code changes needed!
