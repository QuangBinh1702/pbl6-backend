# 🎯 Detailed Phase Breakdown - Hybrid Chatbot Implementation

---

## 🔴 PHASE 1: Refactor Rule-based Chatbot (2-3 days)

### Overview
Extract existing chatbot logic from routes into clean service layer. Setup architecture for RAG integration.

### Deliverables
- ✅ Modular service architecture (testable)
- ✅ Rules stored in MongoDB (not hardcoded)
- ✅ Similarity-based matching (not exact match)
- ✅ RBAC integrated
- ✅ Logging + audit trail
- ✅ Backward compatible (same API, same behavior)

---

### PHASE 1 - TASK BREAKDOWN

#### **Task 1.1: Create MongoDB Models for Rules (0.5 days)**

**Files to Create:**
- `backend/src/models/chatbot_rule.model.js`
- `backend/src/models/chatbot_message.model.js`

**Model 1: chatbot_rule.model.js**
```js
// Schema:
{
  _id: ObjectId,
  tenantId: String,           // For multi-tenant support
  pattern: String,            // Main pattern keyword
  keywords: [String],         // Alternative patterns
  responseTemplate: String,   // Answer to return
  embedding: [Number],        // For similarity (128-256 dims)
  priority: Number,           // 1-10, higher = better
  allowedRoles: [String],     // ['student', 'staff'], empty = public
  type: String,               // 'faq' | 'guide' | 'rule'
  isActive: Boolean,
  createdBy: ObjectId,        // User ID
  createdAt: Date,
  updatedAt: Date
}
```

**Model 2: chatbot_message.model.js**
```js
// Schema (for logging):
{
  _id: ObjectId,
  userId: ObjectId,
  tenantId: String,
  query: String,              // User question
  answer: String,             // Bot answer
  source: String,             // 'rule' | 'rag' | 'fallback'
  scores: {
    ruleScore: Number,
    ragScore: Number
  },
  matchedRuleId: ObjectId,    // Which rule matched
  retrievedDocIds: [ObjectId], // Which docs retrieved (RAG)
  responseTime: Number,       // Milliseconds
  timestamp: Date
}
```

**Implementation Checklist:**
- [ ] Create both models with validation
- [ ] Add indexes: `tenantId`, `isActive`, `priority`
- [ ] Add composite index: `{ tenantId, isActive }`
- [ ] Test model creation

---

#### **Task 1.2: Refactor Route Layer (0.5 days)**

**File to Modify:**
- `backend/src/routes/chatbot.routes.js`

**Changes:**
```js
// OLD: Logic mixed with routes
router.post('/ask-anything', (req, res) => {
  // 50 lines of matching logic here
});

// NEW: Clean route → controller
router.post('/ask-anything', authMiddleware, chatbotController.askAnything);
router.post('/analyze-image', authMiddleware, chatbotController.analyzeImage);

// NEW: Admin routes for Phase 2
router.get('/rules', authMiddleware, rbacMiddleware('chatbot:manage'), chatbotController.listRules);
router.post('/rules', authMiddleware, rbacMiddleware('chatbot:manage'), chatbotController.createRule);
router.put('/rules/:id', authMiddleware, rbacMiddleware('chatbot:manage'), chatbotController.updateRule);
router.delete('/rules/:id', authMiddleware, rbacMiddleware('chatbot:manage'), chatbotController.deleteRule);
```

**Implementation Checklist:**
- [ ] Clean up route handlers
- [ ] Add RBAC checks
- [ ] Add input validation middleware
- [ ] Test routes with JWT token

---

#### **Task 1.3: Create Controller Layer (0.5 days)**

**File to Create:**
- `backend/src/controllers/chatbot.controller.js`

**Key Methods:**
```js
class ChatbotController {
  // Main endpoint
  async askAnything(req, res) {
    try {
      const { question } = req.body;
      const userContext = {
        id: req.user.id,
        roles: req.user.roles,
        tenantId: req.user.tenantId
      };
      
      // Call service
      const result = await chatbotService.handleUserMessage({
        user: userContext,
        text: question
      });
      
      // Log message
      await chatbotMessageModel.create({
        userId: req.user.id,
        tenantId: req.user.tenantId,
        query: question,
        answer: result.answer,
        source: result.source,
        scores: result.scores,
        responseTime: result.responseTime
      });
      
      return res.json({ success: true, data: result });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async analyzeImage(req, res) {
    // Similar to askAnything but processes image first
    // Extract text from image → feed to handleUserMessage()
  }

  // Admin endpoints for Phase 2
  async listRules(req, res) { }
  async createRule(req, res) { }
  async updateRule(req, res) { }
  async deleteRule(req, res) { }
}
```

**Implementation Checklist:**
- [ ] Implement all methods
- [ ] Add error handling
- [ ] Add input validation
- [ ] Test with real requests

---

#### **Task 1.4: Create Rule Engine Service (1 day)**

**File to Create:**
- `backend/src/services/ruleEngine.service.js`

**Key Logic:**
```js
class RuleEngineService {
  async match(question, userContext) {
    // 1. Load applicable rules (RBAC)
    const rules = await ChatbotRule.find({
      tenantId: userContext.tenantId,
      isActive: true,
      $or: [
        { allowedRoles: { $exists: false } },
        { allowedRoles: { $in: userContext.roles } }
      ]
    }).sort({ priority: -1 });
    
    if (!rules.length) return null;
    
    // 2. Normalize question
    const normalizedQ = this.normalizeText(question);
    
    // 3. Calculate similarity score for each rule
    let bestMatch = null;
    let bestScore = 0;
    
    for (const rule of rules) {
      const score = this.calculateSimilarity(
        normalizedQ,
        rule.keywords || [rule.pattern]
      );
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = rule;
      }
    }
    
    // 4. Apply threshold
    if (bestScore < CONFIG.RULE_MIN_CONFIDENCE) {
      return null;
    }
    
    // 5. Return result
    return {
      answer: bestMatch.responseTemplate,
      confidence: bestScore,
      matchedRuleId: bestMatch._id,
      source: 'rule'
    };
  }

  normalizeText(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[àáảãạăằắẳẵặâầấẩẫậ]/g, 'a')
      .replace(/[èéẻẽẹêềếểễệ]/g, 'e')
      // ... more Vietnamese diacritics handling
      .replace(/[ọỡơờớởỡợ]/g, 'o');
  }

  calculateSimilarity(query, keywords) {
    // Use string-similarity library
    let maxSimilarity = 0;
    
    keywords.forEach(keyword => {
      const sim = similarity.compareTwoStrings(query, keyword);
      maxSimilarity = Math.max(maxSimilarity, sim);
    });
    
    return maxSimilarity;
  }
}
```

**Implementation Checklist:**
- [ ] Install `string-similarity` package
- [ ] Create RuleEngineService
- [ ] Implement normalizeText() with Vietnamese support
- [ ] Implement calculateSimilarity()
- [ ] Implement match() with RBAC
- [ ] Unit test each method

---

#### **Task 1.5: Create Orchestrator Service (1 day)**

**File to Create:**
- `backend/src/services/chatbot.service.js`

**Key Logic:**
```js
class ChatbotService {
  async handleUserMessage({ user, text, metadata = {} }) {
    const startTime = Date.now();
    
    try {
      // 1. Validate input
      if (!text || text.trim().length === 0) {
        return this.getFallbackResponse('empty_query');
      }
      
      // 2. Try rule-based matching
      const ruleResult = await this.ruleEngine.match(text, user);
      if (ruleResult && ruleResult.confidence >= CONFIG.RULE_MIN_CONFIDENCE) {
        return {
          answer: ruleResult.answer,
          source: 'rule',
          confidence: ruleResult.confidence,
          matchedRuleId: ruleResult.matchedRuleId,
          responseTime: Date.now() - startTime,
          scores: { ruleScore: ruleResult.confidence }
        };
      }
      
      // 3. For Phase 2: Try RAG
      // (For now, skip to fallback)
      
      // 4. Fallback response
      return {
        answer: this.getFallbackResponse('no_match'),
        source: 'fallback',
        confidence: 0,
        responseTime: Date.now() - startTime,
        scores: { ruleScore: ruleResult?.confidence || 0 }
      };
    } catch (err) {
      console.error('Chatbot error:', err);
      return {
        answer: this.getFallbackResponse('error'),
        source: 'fallback',
        error: err.message,
        responseTime: Date.now() - startTime
      };
    }
  }

  getFallbackResponse(type) {
    const responses = {
      empty_query: 'Vui lòng nhập câu hỏi của bạn.',
      no_match: 'Tôi chưa hiểu ý bạn. Bạn có thể nói cụ thể hơn không?',
      error: 'Có lỗi xảy ra. Vui lòng thử lại sau.',
      not_allowed: 'Bạn không có quyền sử dụng chức năng này.'
    };
    return responses[type] || responses.error;
  }
}
```

**Implementation Checklist:**
- [ ] Create ChatbotService
- [ ] Implement handleUserMessage() orchestration
- [ ] Implement getFallbackResponse()
- [ ] Add logging at each step
- [ ] Handle errors gracefully
- [ ] Unit test orchestration logic

---

#### **Task 1.6: Create Fallback Service (0.5 days)**

**File to Create:**
- `backend/src/services/fallback.service.js`

**Purpose:** Default responses when rule + RAG both fail

```js
class FallbackService {
  async answer(question, userContext) {
    // For Phase 1: Just return generic message
    // For Phase 2+: Could escalate to LLM or human support
    
    return {
      answer: 'Tôi chưa có thông tin về câu hỏi này. Vui lòng liên hệ với admin.',
      confidence: 0,
      source: 'fallback',
      suggestions: this.getSuggestions()
    };
  }

  getSuggestions() {
    return [
      'Hoạt động sắp tới là gì?',
      'Điểm PVCD của em bao nhiêu?',
      'Làm sao để đăng ký hoạt động?',
      'Lớp của em là gì?'
    ];
  }
}
```

**Implementation Checklist:**
- [ ] Create FallbackService
- [ ] Define suggestion list
- [ ] Test fallback behavior

---

#### **Task 1.7: Migrate Existing Rules to MongoDB (0.5 days)**

**Current Rules (Hardcoded):**
Identify existing rules from current chatbot code:
```js
// OLD: In memory/hardcoded
const intents = [
  {
    tag: 'upcoming_events',
    patterns: ['hoạt động sắp tới là gì', '...'],
    responses: ['Hoạt động sắp tới là...']
  },
  // ... more rules
];
```

**Migration Steps:**
1. Export all existing rules to JSON
2. Create seed script: `backend/scripts/seed-rules.js`
3. Run script to populate MongoDB
4. Verify data matches original behavior

**Seed Data File: `backend/seeds/initial-rules.json`**
```json
[
  {
    "tenantId": "global",
    "pattern": "hoạt động sắp tới",
    "keywords": [
      "hoạt động sắp tới là gì",
      "có hoạt động nào sắp diễn ra không",
      "hoạt động mới nhất"
    ],
    "responseTemplate": "Hoạt động sắp tới là Ngày hội Tình nguyện vào 20/12!",
    "priority": 5,
    "allowedRoles": [],
    "type": "faq",
    "isActive": true
  },
  {
    "tenantId": "global",
    "pattern": "điểm pvcd",
    "keywords": [
      "điểm pvcd của em bao nhiêu",
      "xem điểm pvcd",
      "pvcd của tôi là gì"
    ],
    "responseTemplate": "Bạn có thể xem điểm PVCD của mình tại mục Trang cá nhân → PVCD.",
    "priority": 5,
    "allowedRoles": ["student"],
    "type": "faq",
    "isActive": true
  }
]
```

**Implementation Checklist:**
- [ ] Collect all existing rules
- [ ] Create seed data file
- [ ] Create migration script
- [ ] Run migration
- [ ] Verify data in MongoDB
- [ ] Delete hardcoded rules from code

---

#### **Task 1.8: Add Config/Environment Setup (0.5 days)**

**File to Create:**
- `backend/src/config/chatbot.config.js`

**Content:**
```js
module.exports = {
  // Thresholds
  RULE_MIN_CONFIDENCE: parseFloat(process.env.CHATBOT_RULE_MIN_CONFIDENCE) || 0.35,
  RAG_MIN_CONFIDENCE: parseFloat(process.env.CHATBOT_RAG_MIN_CONFIDENCE) || 0.15,
  
  // Feature flags
  ENABLE_RULES: process.env.CHATBOT_ENABLE_RULES !== 'false',
  ENABLE_RAG: process.env.CHATBOT_ENABLE_RAG === 'true',
  ENABLE_LOGGING: process.env.CHATBOT_ENABLE_LOGGING !== 'false',
  
  // Performance
  MAX_RESPONSE_TIME_MS: parseInt(process.env.CHATBOT_MAX_RESPONSE_TIME) || 5000,
  MAX_RULES_RETURNED: parseInt(process.env.CHATBOT_MAX_RULES) || 100,
  
  // Multi-tenancy
  DEFAULT_TENANT_ID: process.env.CHATBOT_DEFAULT_TENANT || 'global',
  
  // Logging
  LOG_ALL_QUERIES: process.env.CHATBOT_LOG_ALL === 'true'
};
```

**Update `.env` file:**
```
CHATBOT_RULE_MIN_CONFIDENCE=0.35
CHATBOT_RAG_MIN_CONFIDENCE=0.15
CHATBOT_ENABLE_RULES=true
CHATBOT_ENABLE_RAG=false
CHATBOT_ENABLE_LOGGING=true
CHATBOT_MAX_RESPONSE_TIME=5000
```

**Implementation Checklist:**
- [ ] Create config file
- [ ] Update .env with all variables
- [ ] Add to gitignore
- [ ] Test loading config

---

#### **Task 1.9: Integration Tests (1 day)**

**Test File to Create:**
- `backend/tests/chatbot.test.js`

**Test Cases:**
```js
describe('PHASE 1: Rule-based Chatbot', () => {
  
  beforeAll(async () => {
    // Setup: connect to test DB
    // Seed initial rules
  });

  describe('RuleEngineService', () => {
    it('should match exact patterns', async () => {
      const result = await ruleEngine.match(
        'hoạt động sắp tới là gì',
        mockUser
      );
      expect(result.confidence).toBeGreaterThan(0.9);
      expect(result.answer).toBeDefined();
    });

    it('should match similar patterns (not exact)', async () => {
      const result = await ruleEngine.match(
        'Có cái hoạt động gì sắp tới không?',
        mockUser
      );
      expect(result.confidence).toBeGreaterThan(0.35);
    });

    it('should NOT match low similarity', async () => {
      const result = await ruleEngine.match(
        'asdfghjkl random gibberish',
        mockUser
      );
      expect(result).toBeNull();
    });

    it('should enforce RBAC: student cannot access staff-only rule', async () => {
      const studentUser = { ...mockUser, roles: ['student'] };
      // Create a staff-only rule
      const result = await ruleEngine.match('staff-only-question', studentUser);
      expect(result).toBeNull();
    });

    it('should enforce tenant isolation', async () => {
      const otherTenantUser = {
        ...mockUser,
        tenantId: 'other-tenant'
      };
      const result = await ruleEngine.match(
        'hoạt động sắp tới là gì',
        otherTenantUser
      );
      expect(result).toBeNull(); // No rules for other tenant
    });
  });

  describe('ChatbotService Orchestrator', () => {
    it('should return rule result when confident', async () => {
      const result = await chatbotService.handleUserMessage({
        user: mockUser,
        text: 'hoạt động sắp tới?'
      });
      expect(result.source).toBe('rule');
      expect(result.confidence).toBeGreaterThan(0.35);
    });

    it('should return fallback when no match', async () => {
      const result = await chatbotService.handleUserMessage({
        user: mockUser,
        text: 'xyz complete gibberish'
      });
      expect(result.source).toBe('fallback');
    });

    it('should handle empty query', async () => {
      const result = await chatbotService.handleUserMessage({
        user: mockUser,
        text: ''
      });
      expect(result.source).toBe('fallback');
      expect(result.answer).toContain('vui lòng');
    });

    it('should log message to DB', async () => {
      await chatbotService.handleUserMessage({
        user: mockUser,
        text: 'test question'
      });
      
      const log = await ChatbotMessage.findOne({
        query: 'test question'
      });
      expect(log).toBeDefined();
    });
  });

  describe('API Endpoints', () => {
    it('POST /api/chatbot/ask-anything should return answer', async () => {
      const response = await request(app)
        .post('/api/chatbot/ask-anything')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ question: 'hoạt động sắp tới?' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.answer).toBeDefined();
    });

    it('POST /api/chatbot/ask-anything should reject without auth', async () => {
      const response = await request(app)
        .post('/api/chatbot/ask-anything')
        .send({ question: 'hoạt động?' });
      
      expect(response.status).toBe(401);
    });
  });

  afterAll(async () => {
    // Cleanup
  });
});
```

**Implementation Checklist:**
- [ ] Setup test environment (Jest + MongoDB Memory Server)
- [ ] Write all test cases
- [ ] Run tests and verify passing
- [ ] Check code coverage (target: >80%)
- [ ] Add to CI/CD pipeline

---

#### **Task 1.10: Documentation & Migration Guide (0.5 days)**

**Files to Create:**
- `backend/docs/PHASE1_MIGRATION.md`

**Content:**
```md
# Phase 1: Migration Guide

## How to Run Phase 1 Locally

1. Install dependencies:
   \`\`\`bash
   npm install string-similarity
   \`\`\`

2. Update environment variables:
   \`\`\`bash
   cp .env.example .env
   # Edit values as needed
   \`\`\`

3. Run database migration:
   \`\`\`bash
   node backend/scripts/seed-rules.js
   \`\`\`

4. Verify rules in MongoDB:
   \`\`\`bash
   mongosh
   > use pbl6_dev
   > db.chatbot_rules.find().pretty()
   \`\`\`

5. Run tests:
   \`\`\`bash
   npm test -- chatbot.test.js
   \`\`\`

6. Start server:
   \`\`\`bash
   npm run dev
   \`\`\`

7. Test API:
   \`\`\`bash
   curl -X POST http://localhost:5000/api/chatbot/ask-anything \
     -H "Authorization: Bearer <your-token>" \
     -H "Content-Type: application/json" \
     -d '{"question": "hoạt động sắp tới?"}'
   \`\`\`

## Backward Compatibility

✅ Existing API endpoint unchanged  
✅ Same response format  
✅ Existing behavior preserved  
✅ No frontend changes needed
```

**Implementation Checklist:**
- [ ] Write migration guide
- [ ] Add to README
- [ ] Document breaking changes (if any)
- [ ] Create rollback procedure

---

### PHASE 1 Summary

| Task | Duration | Dependency |
|------|----------|-----------|
| 1.1: Models | 0.5d | - |
| 1.2: Routes | 0.5d | 1.1 |
| 1.3: Controller | 0.5d | 1.2 |
| 1.4: Rule Engine | 1d | 1.1, 1.3 |
| 1.5: Orchestrator | 1d | 1.4 |
| 1.6: Fallback | 0.5d | 1.5 |
| 1.7: Migration | 0.5d | 1.1, 1.5 |
| 1.8: Config | 0.5d | - |
| 1.9: Tests | 1d | 1.4, 1.5 |
| 1.10: Docs | 0.5d | All |
| **TOTAL** | **2-3 days** | |

### Verification Checklist
- [ ] All models created and indexed
- [ ] All services created and tested
- [ ] All routes working (200 responses)
- [ ] RBAC enforcement verified
- [ ] Rules migrated to MongoDB
- [ ] Test suite passing (>80% coverage)
- [ ] Backward compatible (same API response)
- [ ] Logging functional
- [ ] Documentation complete

---

---

## 🟡 PHASE 2: Introduce RAG (3-4 days)

### Overview
Add knowledge base, embeddings, RAG retriever. Combine with rule engine into single orchestrator.

### Deliverables
- ✅ Knowledge base CRUD endpoints
- ✅ Embedding generation on document save
- ✅ RAG retriever service
- ✅ Hybrid orchestrator (rule → RAG → fallback)
- ✅ Admin document management
- ✅ Updated logging with scores
- ✅ Seed knowledge base data

---

### PHASE 2 - TASK BREAKDOWN

#### **Task 2.1: Create Knowledge Base Model (0.5 days)**

**File to Create:**
- `backend/src/models/chatbot_document.model.js`

**Schema:**
```js
{
  _id: ObjectId,
  tenantId: String,
  type: String,                  // 'faq' | 'regulation' | 'activity' | 'guide' | 'manual'
  title: String,
  content: String,               // Main content
  summary: String,               // Short summary for display
  keywords: [String],            // User-defined search keywords
  embedding: [Number],           // Vector from embedding model (1536 dims for OpenAI)
  embeddingModel: String,        // Track which model created this ('string-sim' | 'openai' | etc)
  tags: [String],                // For filtering
  allowedRoles: [String],        // RBAC: ['student', 'staff']
  source: String,                // Where doc came from: 'admin_upload' | 'activity_db' | 'regulation_db'
  sourceId: ObjectId,            // Reference to original doc (if from DB)
  needsEmbedding: Boolean,       // Flag for background job (Phase 4)
  isActive: Boolean,
  views: Number,                 // Analytics
  createdBy: ObjectId,           // Admin who created
  createdAt: Date,
  updatedAt: Date
}
```

**Implementation Checklist:**
- [ ] Create model with validation
- [ ] Add indexes: `tenantId`, `isActive`, `tags`
- [ ] Add composite index: `{ tenantId, isActive, allowedRoles }`
- [ ] Add vector index (if using MongoDB Atlas)

---

#### **Task 2.2: Create Embedding Utility Service (1 day)**

**File to Create:**
- `backend/src/utils/embedding.util.js`

**Implementation:**
```js
class EmbeddingService {
  /**
   * For Phase 2 (MVP): Use simple string similarity based on keywords
   * For Phase 3+: Upgrade to OpenAI API or local embeddings
   */
  
  async generateEmbedding(text) {
    // Phase 2: Simple keyword-based (no API needed)
    // Phase 3+: Call OpenAI/local model
    
    if (CONFIG.EMBEDDING_MODEL === 'string-sim') {
      return this.generateSimpleEmbedding(text);
    }
    
    if (CONFIG.EMBEDDING_MODEL === 'openai') {
      return this.generateOpenAIEmbedding(text);
    }
  }

  generateSimpleEmbedding(text) {
    // Extract keywords and create simple 256-dim vector
    // Not real embeddings, but works for Phase 2
    // Use: tokenize → TF-IDF → vector
    
    const tokenizer = new natural.WordTokenizer();
    const tokens = tokenizer.tokenize(text.toLowerCase());
    
    // Create simple hash-based vector
    const vector = new Array(256).fill(0);
    tokens.forEach(token => {
      const hash = this.simpleHash(token) % 256;
      vector[hash] += 1;
    });
    
    // Normalize
    const magnitude = Math.sqrt(vector.reduce((a, b) => a + b*b, 0));
    return vector.map(v => magnitude > 0 ? v / magnitude : 0);
  }

  async generateOpenAIEmbedding(text) {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float'
    });
    
    return response.data[0].embedding;
  }

  // Calculate cosine similarity
  cosineSimilarity(vec1, vec2) {
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      magnitude1 += vec1[i] * vec1[i];
      magnitude2 += vec2[i] * vec2[i];
    }
    
    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);
    
    if (magnitude1 === 0 || magnitude2 === 0) return 0;
    return dotProduct / (magnitude1 * magnitude2);
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}
```

**Config for embeddings:**
```js
// backend/src/config/chatbot.config.js
module.exports = {
  ...existing config,
  
  // Embedding
  EMBEDDING_MODEL: process.env.CHATBOT_EMBEDDING_MODEL || 'string-sim', // 'string-sim' | 'openai'
  EMBEDDING_DIMENSION: process.env.CHATBOT_EMBEDDING_DIM || 256,
  
  // Vector search
  VECTOR_SEARCH_TOP_K: 5,
  VECTOR_SEARCH_MIN_SIMILARITY: 0.1
};
```

**Implementation Checklist:**
- [ ] Create EmbeddingService
- [ ] Implement simple embedding generator (Phase 2)
- [ ] Implement cosine similarity
- [ ] Add to config
- [ ] Unit test embedding generation
- [ ] Test similarity calculations

---

#### **Task 2.3: Create RAG Retriever Service (1 day)**

**File to Create:**
- `backend/src/services/rag.service.js`

**Implementation:**
```js
class RAGService {
  async retrieveAndAnswer(question, userContext) {
    try {
      // 1. Generate query embedding
      const queryEmbedding = await embeddingService.generateEmbedding(question);
      
      // 2. Retrieve relevant documents with RBAC filter
      const documents = await this.searchDocuments(queryEmbedding, userContext);
      
      if (!documents.length) {
        return null;
      }
      
      // 3. Calculate confidence from top doc
      const topDoc = documents[0];
      const confidence = Math.max(...documents.map(d => d.similarity));
      
      // 4. For Phase 2: Simple concatenation
      // For Phase 3+: Call LLM to generate natural answer
      const answer = this.composeAnswer(documents);
      
      return {
        answer: answer,
        confidence: confidence,
        retrievedDocIds: documents.map(d => d._id),
        documentCount: documents.length,
        topDocTitle: topDoc.title,
        source: 'rag'
      };
    } catch (err) {
      console.error('RAG error:', err);
      return null;
    }
  }

  async searchDocuments(queryEmbedding, userContext) {
    // 1. Filter by RBAC
    const filter = {
      tenantId: userContext.tenantId,
      isActive: true,
      $or: [
        { allowedRoles: { $exists: false } },
        { allowedRoles: { $in: userContext.roles } }
      ]
    };
    
    // 2. Get all docs and calculate similarity
    const allDocs = await ChatbotDocument.find(filter);
    
    const docsWithScore = allDocs
      .map(doc => ({
        ...doc.toObject(),
        similarity: embeddingService.cosineSimilarity(
          queryEmbedding,
          doc.embedding
        )
      }))
      .filter(doc => doc.similarity >= CONFIG.VECTOR_SEARCH_MIN_SIMILARITY)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, CONFIG.VECTOR_SEARCH_TOP_K);
    
    return docsWithScore;
  }

  composeAnswer(documents) {
    // Phase 2: Simple concatenation with highlights
    // Phase 3+: Use LLM to generate natural answer
    
    const highlighted = documents
      .map((doc, idx) => `[${idx + 1}] ${doc.title}\n${doc.content}`)
      .join('\n\n');
    
    return `Dựa trên kiến thức trong hệ thống:\n\n${highlighted}`;
  }

  async generateNaturalAnswer(question, documents) {
    // Phase 3+: Call LLM
    const context = documents.map(d => d.content).join('\n\n');
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Bạn là trợ lý ảo hữu ích. Trả lời dựa CHỈ trên context được cung cấp. Nếu không có thông tin, nói "Tôi không có thông tin về điều này".'
        },
        {
          role: 'user',
          content: `Context:\n${context}\n\nCâu hỏi: ${question}`
        }
      ],
      max_tokens: 500,
      temperature: 0.3
    });
    
    return response.choices[0].message.content;
  }
}
```

**Implementation Checklist:**
- [ ] Create RAGService
- [ ] Implement searchDocuments() with RBAC
- [ ] Implement composeAnswer()
- [ ] Test vector search
- [ ] Test RBAC filtering
- [ ] Unit tests for retrieval

---

#### **Task 2.4: Update Orchestrator to Use RAG (0.5 days)**

**File to Modify:**
- `backend/src/services/chatbot.service.js`

**Changes:**
```js
class ChatbotService {
  async handleUserMessage({ user, text, metadata = {} }) {
    const startTime = Date.now();
    
    try {
      if (!text || text.trim().length === 0) {
        return this.getFallbackResponse('empty_query');
      }
      
      // 1. Try rule-based matching
      const ruleResult = await this.ruleEngine.match(text, user);
      if (ruleResult && ruleResult.confidence >= CONFIG.RULE_MIN_CONFIDENCE) {
        return {
          answer: ruleResult.answer,
          source: 'rule',
          confidence: ruleResult.confidence,
          matchedRuleId: ruleResult.matchedRuleId,
          responseTime: Date.now() - startTime,
          scores: {
            ruleScore: ruleResult.confidence,
            ragScore: null
          }
        };
      }
      
      // 2. Try RAG (NEW in Phase 2)
      if (CONFIG.ENABLE_RAG) {
        const ragResult = await this.ragService.retrieveAndAnswer(text, user);
        if (ragResult && ragResult.confidence >= CONFIG.RAG_MIN_CONFIDENCE) {
          return {
            answer: ragResult.answer,
            source: 'rag',
            confidence: ragResult.confidence,
            retrievedDocIds: ragResult.retrievedDocIds,
            responseTime: Date.now() - startTime,
            scores: {
              ruleScore: ruleResult?.confidence || 0,
              ragScore: ragResult.confidence
            }
          };
        }
      }
      
      // 3. Fallback
      return {
        answer: this.getFallbackResponse('no_match'),
        source: 'fallback',
        confidence: 0,
        responseTime: Date.now() - startTime,
        scores: {
          ruleScore: ruleResult?.confidence || 0,
          ragScore: null
        }
      };
    } catch (err) {
      console.error('Chatbot error:', err);
      return {
        answer: this.getFallbackResponse('error'),
        source: 'fallback',
        error: err.message,
        responseTime: Date.now() - startTime
      };
    }
  }
}
```

**Implementation Checklist:**
- [ ] Update orchestrator
- [ ] Add RAG call in decision flow
- [ ] Add RAG to score logging
- [ ] Test rule → RAG fallthrough
- [ ] Test confidence thresholds

---

#### **Task 2.5: Create Admin API Endpoints (1 day)**

**File to Modify:**
- `backend/src/routes/chatbot.routes.js`

**New Routes:**
```js
// Document management (admin only)
router.get('/documents', 
  authMiddleware, 
  rbacMiddleware('chatbot:manage'), 
  chatbotController.listDocuments);

router.post('/documents',
  authMiddleware,
  rbacMiddleware('chatbot:manage'),
  validateBody(['title', 'content', 'type']),
  chatbotController.createDocument);

router.put('/documents/:id',
  authMiddleware,
  rbacMiddleware('chatbot:manage'),
  chatbotController.updateDocument);

router.delete('/documents/:id',
  authMiddleware,
  rbacMiddleware('chatbot:manage'),
  chatbotController.deleteDocument);

router.post('/documents/bulk-import',
  authMiddleware,
  rbacMiddleware('chatbot:manage'),
  upload.single('file'),
  chatbotController.bulkImportDocuments);

// Test endpoint (admin only)
router.post('/test-query',
  authMiddleware,
  rbacMiddleware('chatbot:manage'),
  chatbotController.testQuery);

// Logs/analytics
router.get('/messages',
  authMiddleware,
  rbacMiddleware('chatbot:view-logs'),
  chatbotController.listMessages);

router.get('/analytics',
  authMiddleware,
  rbacMiddleware('chatbot:view-logs'),
  chatbotController.getAnalytics);
```

**Controller implementations:**
```js
class ChatbotController {
  // Documents
  async listDocuments(req, res) {
    const docs = await ChatbotDocument.find({
      tenantId: req.user.tenantId
    }).sort({ createdAt: -1 });
    
    return res.json({ success: true, data: docs });
  }

  async createDocument(req, res) {
    const { title, content, type, tags, allowedRoles } = req.body;
    
    // Generate embedding
    const embedding = await embeddingService.generateEmbedding(content);
    
    const doc = await ChatbotDocument.create({
      tenantId: req.user.tenantId,
      title,
      content,
      type,
      tags: tags || [],
      allowedRoles: allowedRoles || [],
      embedding,
      embeddingModel: CONFIG.EMBEDDING_MODEL,
      createdBy: req.user.id
    });
    
    return res.json({ success: true, data: doc });
  }

  async updateDocument(req, res) {
    const { title, content, type, tags, allowedRoles } = req.body;
    
    // Regenerate embedding if content changed
    let embedding = undefined;
    if (content) {
      embedding = await embeddingService.generateEmbedding(content);
    }
    
    const doc = await ChatbotDocument.findByIdAndUpdate(
      req.params.id,
      {
        title,
        content,
        type,
        tags,
        allowedRoles,
        ...(embedding && { embedding, embeddingModel: CONFIG.EMBEDDING_MODEL })
      },
      { new: true }
    );
    
    return res.json({ success: true, data: doc });
  }

  async deleteDocument(req, res) {
    await ChatbotDocument.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Deleted' });
  }

  async bulkImportDocuments(req, res) {
    const file = req.file;
    
    // Parse CSV/JSON
    const docs = parseUploadFile(file);
    
    // Generate embeddings for all
    for (const doc of docs) {
      doc.embedding = await embeddingService.generateEmbedding(doc.content);
      doc.tenantId = req.user.tenantId;
      doc.createdBy = req.user.id;
    }
    
    await ChatbotDocument.insertMany(docs);
    
    return res.json({ 
      success: true, 
      message: `Imported ${docs.length} documents` 
    });
  }

  async testQuery(req, res) {
    const { query } = req.body;
    
    const result = await chatbotService.handleUserMessage({
      user: {
        id: req.user.id,
        roles: req.user.roles,
        tenantId: req.user.tenantId
      },
      text: query
    });
    
    return res.json({ 
      success: true, 
      data: {
        ...result,
        explanation: `Used ${result.source} engine with ${(result.confidence * 100).toFixed(1)}% confidence`
      }
    });
  }

  async listMessages(req, res) {
    const { limit = 50, skip = 0, source, userId } = req.query;
    
    let filter = { tenantId: req.user.tenantId };
    if (source) filter.source = source;
    if (userId) filter.userId = userId;
    
    const messages = await ChatbotMessage.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));
    
    return res.json({ success: true, data: messages });
  }

  async getAnalytics(req, res) {
    const { period = '7d' } = req.query;
    
    const startDate = new Date();
    if (period === '7d') startDate.setDate(startDate.getDate() - 7);
    else if (period === '30d') startDate.setDate(startDate.getDate() - 30);
    
    const stats = await ChatbotMessage.aggregate([
      {
        $match: {
          tenantId: req.user.tenantId,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 },
          avgResponseTime: { $avg: '$responseTime' }
        }
      }
    ]);
    
    return res.json({ success: true, data: stats });
  }
}
```

**Implementation Checklist:**
- [ ] Add document CRUD endpoints
- [ ] Implement bulk import
- [ ] Add test query endpoint
- [ ] Add logs/analytics endpoints
- [ ] Add RBAC checks on all admin routes
- [ ] Test all endpoints

---

#### **Task 2.6: Seed Knowledge Base Data (0.5 days)**

**File to Create:**
- `backend/seeds/initial-documents.json`

**Content:**
```json
[
  {
    "tenantId": "global",
    "type": "regulation",
    "title": "Quy định Điểm PVCD",
    "content": "Mỗi sinh viên phải tham gia ít nhất 10 hoạt động PVCD mỗi kỳ học. Điểm PVCD tính theo số giờ tham gia, tối đa 100 điểm mỗi năm học. Hoạt động được chia thành các mức: PVCD (0.5 điểm), hoạt động xã hội (1-2 điểm), hoạt động khác (0.5-1 điểm).",
    "tags": ["PVCD", "điểm", "quy định"],
    "allowedRoles": [],
    "type": "regulation"
  },
  {
    "tenantId": "global",
    "type": "guide",
    "title": "Hướng dẫn Đăng ký Hoạt động",
    "content": "Sinh viên đăng ký hoạt động thông qua ứng dụng PVCD. Bước 1: Vào mục Hoạt động. Bước 2: Chọn hoạt động muốn tham gia. Bước 3: Click nút 'Đăng ký'. Bước 4: Chờ phê duyệt từ người quản lý (thường trong 24-48 giờ). Nếu hoạt động không yêu cầu phê duyệt, bạn sẽ được tham gia ngay.",
    "tags": ["đăng ký", "hướng dẫn"],
    "allowedRoles": ["student"],
    "type": "guide"
  },
  {
    "tenantId": "global",
    "type": "activity",
    "title": "Ngày hội Tình nguyện 20/12",
    "content": "Ngày hội Tình nguyện được tổ chức hàng năm vào ngày 20/12. Năm nay (2024) có các hoạt động: (1) Hiến máu tình nguyện - 2 điểm, (2) Dọn vệ sinh môi trường - 1.5 điểm, (3) Gây quỹ cộng đồng - 1 điểm. Địa điểm: Sân vận động trường. Thời gian: 8h-12h. Sinh viên có thể đăng ký các hoạt động khác nhau.",
    "tags": ["hoạt động", "tình nguyện", "sắp tới"],
    "allowedRoles": [],
    "type": "activity"
  },
  {
    "tenantId": "global",
    "type": "faq",
    "title": "Các câu hỏi thường gặp",
    "content": "Q: Làm sao để xem điểm PVCD của tôi? A: Vào Trang cá nhân → PVCD → Xem chi tiết. Q: Hoạt động nào có thể giúp tăng điểm nhanh? A: Hoạt động xã hội (1-2 điểm) và các hoạt động đặc biệt (lên đến 5 điểm). Q: Nếu bỏ hoạt động sau khi đăng ký có bị trừ điểm không? A: Không bị trừ, nhưng sẽ bị chốt danh sách có mặt.",
    "tags": ["FAQ", "câu hỏi"],
    "allowedRoles": [],
    "type": "faq"
  }
]
```

**Migration script: `backend/scripts/seed-rag-documents.js`**
```js
const mongoose = require('mongoose');
const ChatbotDocument = require('../src/models/chatbot_document.model');
const embeddingService = require('../src/services/embedding.service');
const docs = require('../seeds/initial-documents.json');

async function seedDocuments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Generate embeddings for all docs
    for (const doc of docs) {
      doc.embedding = await embeddingService.generateEmbedding(doc.content);
      doc.embeddingModel = 'string-sim'; // v1
    }
    
    // Insert
    await ChatbotDocument.insertMany(docs);
    console.log(`✅ Seeded ${docs.length} documents`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
}

seedDocuments();
```

**Implementation Checklist:**
- [ ] Create seed data file
- [ ] Create migration script
- [ ] Run script locally
- [ ] Verify docs in MongoDB
- [ ] Check embeddings generated

---

#### **Task 2.7: Integration Tests for RAG (1 day)**

**Test File to Create/Modify:**
- `backend/tests/chatbot-rag.test.js`

**Test Cases:**
```js
describe('PHASE 2: RAG Integration', () => {
  
  beforeAll(async () => {
    // Setup test DB + seed docs
    await seedTestDocuments();
  });

  describe('EmbeddingService', () => {
    it('should generate embedding', async () => {
      const embedding = await embeddingService.generateEmbedding('Quy định PVCD');
      expect(embedding).toBeInstanceOf(Array);
      expect(embedding.length).toBe(CONFIG.EMBEDDING_DIMENSION);
    });

    it('should calculate cosine similarity', () => {
      const vec1 = [1, 0, 0];
      const vec2 = [1, 0, 0];
      const sim = embeddingService.cosineSimilarity(vec1, vec2);
      expect(sim).toBeCloseTo(1.0);
    });
  });

  describe('RAGService', () => {
    it('should retrieve relevant documents', async () => {
      const result = await ragService.retrieveAndAnswer(
        'Quy định điểm PVCD là gì?',
        mockUser
      );
      
      expect(result).not.toBeNull();
      expect(result.confidence).toBeGreaterThan(0.1);
      expect(result.retrievedDocIds.length).toBeGreaterThan(0);
    });

    it('should enforce RBAC: not return staff-only docs', async () => {
      const studentUser = { ...mockUser, roles: ['student'] };
      const result = await ragService.retrieveAndAnswer(
        'Staff-only question',
        studentUser
      );
      
      // Should not retrieve staff-only doc
      expect(result?.documentCount).toBe(0);
    });

    it('should return null if low confidence', async () => {
      const result = await ragService.retrieveAndAnswer(
        'asdfghjkl completely gibberish',
        mockUser
      );
      
      expect(result).toBeNull();
    });
  });

  describe('Hybrid Orchestrator', () => {
    it('should prefer rule over RAG when rule confident', async () => {
      // "hoạt động sắp tới" should match rule (high conf)
      const result = await chatbotService.handleUserMessage({
        user: mockUser,
        text: 'hoạt động sắp tới là gì?'
      });
      
      expect(result.source).toBe('rule');
    });

    it('should use RAG when rule not confident', async () => {
      // "Quy định tham gia..." is not a rule pattern
      const result = await chatbotService.handleUserMessage({
        user: mockUser,
        text: 'Quy định tham gia PVCD là gì vậy?'
      });
      
      expect(result.source).toBe('rag');
      expect(result.confidence).toBeGreaterThan(0.15);
    });

    it('should fallback when neither rule nor RAG match', async () => {
      const result = await chatbotService.handleUserMessage({
        user: mockUser,
        text: 'xyz123 random noise'
      });
      
      expect(result.source).toBe('fallback');
    });

    it('should log all decisions with scores', async () => {
      await chatbotService.handleUserMessage({
        user: mockUser,
        text: 'test query'
      });
      
      const log = await ChatbotMessage.findOne({
        query: 'test query'
      });
      
      expect(log.source).toBeDefined();
      expect(log.scores.ruleScore).toBeDefined();
      expect(log.scores.ragScore).toBeDefined();
    });
  });

  describe('Admin API Endpoints', () => {
    it('POST /api/chatbot/documents should create doc with embedding', async () => {
      const response = await request(app)
        .post('/api/chatbot/documents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Doc',
          content: 'This is test content',
          type: 'faq'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.data.embedding).toBeDefined();
    });

    it('GET /api/chatbot/documents should list all docs', async () => {
      const response = await request(app)
        .get('/api/chatbot/documents')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('POST /api/chatbot/test-query should show scores', async () => {
      const response = await request(app)
        .post('/api/chatbot/test-query')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ query: 'hoạt động?' });
      
      expect(response.status).toBe(200);
      expect(response.body.data.source).toBeDefined();
      expect(response.body.data.explanation).toBeDefined();
    });

    it('GET /api/chatbot/analytics should return stats', async () => {
      const response = await request(app)
        .get('/api/chatbot/analytics?period=7d')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });
});
```

**Implementation Checklist:**
- [ ] Write all RAG tests
- [ ] Test vector search + RBAC
- [ ] Test hybrid orchestration
- [ ] Test admin endpoints
- [ ] Run tests and verify passing
- [ ] Check code coverage (target: >80%)

---

#### **Task 2.8: Documentation & Migration Guide (0.5 days)**

**File to Create:**
- `backend/docs/PHASE2_MIGRATION.md`

**Content:**
```md
# Phase 2: RAG Integration

## What's New

- Knowledge base (documents) management
- Embeddings + vector search
- Hybrid rule-based + RAG orchestration
- Admin API for document CRUD
- Analytics + logging improvements

## Database Setup

### New Collections

1. `chatbot_documents` - Knowledge base
   - Stores title, content, embeddings
   - Indexed by tenantId, type, tags

2. Updated `chatbot_messages` - Logging
   - Now logs: source, ruleScore, ragScore, retrievedDocIds

### Migration Steps

1. Create new models:
   \`\`\`bash
   # Models are auto-created by Mongoose on first write
   \`\`\`

2. Seed knowledge base:
   \`\`\`bash
   node backend/scripts/seed-rag-documents.js
   \`\`\`

3. Verify in MongoDB:
   \`\`\`bash
   mongosh
   > use pbl6_dev
   > db.chatbot_documents.find().pretty()
   > db.chatbot_messages.find().pretty()
   \`\`\`

## Config Changes

Add to `.env`:
\`\`\`
CHATBOT_ENABLE_RAG=true
CHATBOT_RAG_MIN_CONFIDENCE=0.15
CHATBOT_EMBEDDING_MODEL=string-sim
CHATBOT_EMBEDDING_DIM=256
\`\`\`

## New Endpoints

### Admin: Document Management
\`\`\`
GET    /api/chatbot/documents
POST   /api/chatbot/documents
PUT    /api/chatbot/documents/:id
DELETE /api/chatbot/documents/:id
POST   /api/chatbot/documents/bulk-import
\`\`\`

### Admin: Testing & Analytics
\`\`\`
POST   /api/chatbot/test-query
GET    /api/chatbot/messages?limit=50&skip=0
GET    /api/chatbot/analytics?period=7d
\`\`\`

## Testing

Run tests:
\`\`\`bash
npm test -- chatbot-rag.test.js
\`\`\`

Test hybrid behavior:
\`\`\`bash
# Rule should match
curl http://localhost:5000/api/chatbot/ask-anything \
  -H "Authorization: Bearer $token" \
  -d '{"question": "hoạt động sắp tới?"}'
# → source: "rule"

# RAG should match
curl http://localhost:5000/api/chatbot/ask-anything \
  -H "Authorization: Bearer $token" \
  -d '{"question": "Quy định điểm PVCD?"}'
# → source: "rag"
\`\`\`

## Performance Notes

- Vector search: ~50-200ms (depends on doc count)
- Embedding generation: ~10-50ms (with string-sim)
- Total response: <1s for most queries
```

**Implementation Checklist:**
- [ ] Write Phase 2 migration guide
- [ ] Document new endpoints
- [ ] Add config examples
- [ ] Document testing procedures
- [ ] Update README with new features

---

### PHASE 2 Summary

| Task | Duration | Dependency |
|------|----------|-----------|
| 2.1: Document Model | 0.5d | - |
| 2.2: Embedding Service | 1d | - |
| 2.3: RAG Service | 1d | 2.1, 2.2 |
| 2.4: Update Orchestrator | 0.5d | 2.3 |
| 2.5: Admin API | 1d | 2.1 |
| 2.6: Seed Data | 0.5d | 2.1 |
| 2.7: Tests | 1d | All |
| 2.8: Docs | 0.5d | All |
| **TOTAL** | **3-4 days** | |

### Verification Checklist
- [ ] Document model created + indexed
- [ ] Embeddings generated for all docs
- [ ] RAG retriever working + tested
- [ ] Hybrid orchestration working
- [ ] RBAC enforced in vector search
- [ ] Admin CRUD endpoints working
- [ ] Analytics/logging functional
- [ ] Tests passing (>80% coverage)
- [ ] Knowledge base seeded
- [ ] Documentation complete

---

---

## 🟡 PHASE 3: Harden, Monitor, Tune (2-3 days)

### Overview
Production-hardening: strict RBAC, monitoring, observability, threshold tuning based on real data.

### Key Activities
- RBAC verification & enforcement
- Metrics dashboard
- Admin management UI (frontend component)
- Threshold tuning procedure
- Error handling + graceful degradation
- Audit trail + security review

---

### PHASE 3 - HIGH-LEVEL TASKS

1. **Strict RBAC Verification**
   - Test data leakage scenarios
   - Multi-tenant isolation
   - Role-based document filtering

2. **Monitoring & Metrics**
   - Dashboard: engine usage, latency, unanswered questions
   - Logging: audit trail with userId, roles, docIds

3. **Admin UI (React)**
   - Rule/document management page
   - Test input tool (see which engine fires)
   - Logs viewer
   - Analytics charts

4. **Threshold Tuning**
   - Analyze logs → adjust thresholds
   - Config reload (no deploy)

5. **Error Handling**
   - Timeouts on external calls
   - Graceful degradation
   - User-friendly error messages

---

---

## 🟢 PHASE 4: Scale & Optimize (4-5 days, Optional)

### Overview
Advanced features for production at scale: background jobs, vector DB, caching, semantic routing.

### High-Level Tasks

1. **Background Embedding Jobs**
   - Bull queue + Redis
   - Async embedding generation

2. **Dedicated Vector Search**
   - MongoDB Atlas Vector Search or Pinecone
   - Fast retrieval for 10k+ docs

3. **Caching Layer**
   - Redis cache for frequent queries
   - TTL-based invalidation

4. **Conversation Context**
   - Short conversation history
   - Context-aware follow-ups

5. **Semantic Router (Optional)**
   - Classify query type
   - Route to appropriate engine

6. **Microservice Separation (Optional)**
   - Standalone chatbot service
   - Independent scaling

---

## 📊 Complete Timeline

```
PHASE 1: Refactor           ████████████ 2-3 days
  ├─ Models, Services, Tests
  └─ Migration complete

PHASE 2: RAG Integration     ███████████████ 3-4 days
  ├─ Knowledge base, Embeddings
  ├─ Hybrid orchestration
  └─ Admin endpoints + seed data

PHASE 3: Hardening         ████████████ 2-3 days
  ├─ RBAC verification
  ├─ Monitoring dashboard
  └─ Threshold tuning

PHASE 4: Scaling           █████████████████ 4-5 days (OPTIONAL)
  ├─ Background jobs
  ├─ Vector DB upgrade
  └─ Caching + context

TOTAL: 10-15 days
```

---

## 🎯 Success Criteria by Phase

### Phase 1 ✅
- [ ] Backward compatible
- [ ] Rules in MongoDB
- [ ] RBAC working
- [ ] Logging functional
- [ ] Tests >80% coverage

### Phase 2 ✅
- [ ] Documents CRUD working
- [ ] Embeddings generated
- [ ] Hybrid orchestration
- [ ] Admin API functional
- [ ] Tests passing

### Phase 3 ✅
- [ ] RBAC strictly enforced
- [ ] Monitoring dashboard
- [ ] Thresholds tuned
- [ ] Error handling robust
- [ ] Audit trail complete

### Phase 4 ✅ (If triggered)
- [ ] Background jobs working
- [ ] Vector search < 500ms p95
- [ ] Caching reducing latency
- [ ] Conversation context working
- [ ] Ready for high load

---

**Document Version:** 1.0  
**Date:** Dec 14, 2025  
**Status:** 📋 Ready for Implementation
