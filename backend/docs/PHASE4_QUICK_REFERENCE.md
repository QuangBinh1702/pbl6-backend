# Phase 4 Quick Reference - API Endpoints & Usage

## 🎯 All 10 Features Implemented

### Feature 1: Feedback Closure Workflow
```javascript
// Admin submits response to feedback
POST /api/chatbot/feedback/{feedbackId}/response
{
  "response": "We've fixed this issue",
  "actionTaken": "Updated document",
  "tags": ["urgent", "fixed"]
}

// Admin closes feedback
POST /api/chatbot/feedback/{feedbackId}/close
{
  "closureReason": "resolved" // resolved|duplicate|invalid|working_as_intended|other
}

// Get pending feedback for review (with priority)
GET /api/chatbot/feedback/pending?priority=high&page=1&limit=20
```

### Feature 2: Auto-Categorization
```javascript
// Bulk recategorize all documents
POST /api/chatbot/documents/auto-categorize
{
  "categoryFilter": "faq" // optional - only recategorize specific category
}

// Returns:
{
  "total": 100,
  "updated": 45,
  "failed": 2,
  "changes": [...]
}
```

### Feature 3: Similarity Detection & Deduplication
```javascript
// Find similar documents
GET /api/chatbot/documents/{documentId}/similar

// Deduplicate (archive duplicates)
POST /api/chatbot/documents/deduplicate
{
  "mergeStrategy": "keep_latest"
}

// Returns:
{
  "duplicatesFound": 5,
  "merged": 3,
  "archived": 2
}
```

### Feature 4: Bulk Import
```javascript
// Import from JSON array
POST /api/chatbot/documents/bulk-import
{
  "documents": [
    {
      "title": "FAQ Item",
      "content": "Answer here",
      "category": "faq",
      "tags": ["help"]
    }
  ],
  "options": {
    "autoEmbed": true,
    "autoCategory": true,
    "autoTag": true,
    "deDuplicate": true
  }
}

// Import from CSV
POST /api/chatbot/documents/bulk-import-csv
{
  "csvContent": "title,content,category\nQuestion,Answer,faq",
  "options": { ... }
}
```

### Feature 5: Real-time Analytics (WebSocket)
```javascript
// Service is ready for Socket.io integration
const realtime = require('./services/realtime.service');

// Register client
realtime.registerClient(socketId, userId);

// Subscribe to analytics updates
realtime.subscribeToAnalytics(socketId, 'dashboard');

// Broadcast updates
realtime.broadcastAnalyticsUpdate(data, 'dashboard');

// Listen to events
realtime.on('flush_analytics', (batch) => {
  // Process batch
});
```

### Feature 6: Embedding Cache
```javascript
// Warm up cache with documents
POST /api/chatbot/cache/warmup
{
  "documentIds": ["doc1", "doc2"] // optional
}

// Get cache statistics
GET /api/chatbot/cache/stats

// Returns:
{
  "hits": 150,
  "misses": 45,
  "evictions": 2,
  "hitRate": "76.92%",
  "size": 145,
  "maxSize": 1000,
  "utilization": "14.50%"
}
```

### Feature 7: A/B Testing
```javascript
// Create experiment
POST /api/chatbot/experiments
{
  "name": "New Answer Format",
  "description": "Testing improved answer structure",
  "controlVersion": "v1",
  "treatmentVersion": "v2",
  "splitRatio": 50,
  "startDate": "2025-12-15",
  "endDate": "2025-12-22"
}

// Get results (includes winner determination)
GET /api/chatbot/experiments/{experimentId}/results

// Returns:
{
  "experimentId": "exp_123",
  "control": {
    "count": 100,
    "avgRating": 3.8,
    "sampleSize": 100
  },
  "treatment": {
    "count": 102,
    "avgRating": 4.2,
    "sampleSize": 102
  },
  "winner": "treatment",
  "statisticalSignificance": { "significant": true, "confidence": 0.95 }
}
```

### Feature 8: User Satisfaction Dashboard
```javascript
// Get comprehensive dashboard
GET /api/chatbot/dashboard?timeRange=week
// Returns: summary, satisfaction, sourceDistribution, responseTimeStats, documentPerformance, userEngagement, trends

// Get satisfaction summary with NPS
GET /api/chatbot/dashboard/satisfaction?timeRange=month
// Returns: totalRatings, avgRating, nps, ratingDistribution, sentimentBreakdown

// Get issue tracking dashboard
GET /api/chatbot/dashboard/issues
// Returns: grouped issues with counts, avgRating, suggestions, examples
```

### Feature 9: Automatic Deduplication
```javascript
// Integrated with Feature 3 - see above
// Automatically identifies and archives duplicate documents
```

### Feature 10: Fine-tuning on Feedback
```javascript
// Get candidates that need improvement
GET /api/chatbot/fine-tuning/candidates?minFeedbackCount=5&timeRange=month

// Analyze document effectiveness
GET /api/chatbot/documents/analysis/effectiveness

// Returns:
{
  "documentId": "doc_123",
  "title": "FAQ Item",
  "retrievalCount": 150,
  "avgConfidenceScore": 0.82,
  "avgFeedbackRating": 3.9,
  "effectiveScore": 0.5,
  "recommendation": "keep"
}

// Get training insights
GET /api/chatbot/insights/training

// Returns:
{
  "totalFeedback": 245,
  "avgRating": 3.8,
  "topImprovementAreas": [ { "area": "incomplete", "count": 35 } ],
  "successSources": [ { "source": "rag", "count": 120 } ],
  "userSuggestions": [...]
}
```

---

## 🔌 Configuration

All Phase 4 features are configurable via environment variables:

```bash
# Feature flags
CHATBOT_ENABLE_FEEDBACK_CLOSURE=true
CHATBOT_ENABLE_AUTO_CATEGORY=true
CHATBOT_ENABLE_SIMILARITY_DETECTION=true
CHATBOT_ENABLE_REALTIME_ANALYTICS=false
CHATBOT_ENABLE_EMBEDDING_CACHE=true
CHATBOT_ENABLE_AB_TESTING=true

# Similarity threshold (0-1)
CHATBOT_SIMILARITY_THRESHOLD=0.75

# Analytics buffering
CHATBOT_ANALYTICS_BUFFER_SIZE=10
CHATBOT_ANALYTICS_FLUSH_INTERVAL=5000

# Embedding cache
CHATBOT_EMBEDDING_CACHE_SIZE=1000
CHATBOT_EMBEDDING_CACHE_TTL=86400000 # 24 hours
```

---

## 📊 Database Collections

New/Updated collections:
- `chatbot_feedback` - Extended with closure workflow
- `chatbot_document` - Extended with dedup & A/B testing
- `chatbot_message` - Extended with experiment tracking

---

## 🛡️ Security & RBAC

All admin routes require `admin` role:
- `POST /feedback/{id}/response` - Admin only
- `POST /feedback/{id}/close` - Admin only
- `GET /feedback/pending` - Admin only
- `POST /documents/auto-categorize` - Admin only
- `POST /documents/deduplicate` - Admin only
- `POST /documents/bulk-import*` - Admin only
- `POST /experiments` - Admin only
- `POST /cache/warmup` - Admin only

User-accessible routes:
- `GET /dashboard` - Authenticated
- `GET /dashboard/satisfaction` - Authenticated
- `GET /dashboard/issues` - Authenticated
- `GET /documents/{id}/similar` - Authenticated
- `GET /experiments/{id}/results` - Authenticated

---

## 🚀 Getting Started

1. **Enable features** in your `.env` file
2. **Import documents** using bulk import
3. **Create A/B tests** to experiment with improvements
4. **Monitor dashboard** for user satisfaction trends
5. **Review fine-tuning candidates** for document improvements
6. **Close feedback** with admin response workflow

---

## 📈 Performance Tips

1. **Embedding Cache**: Warm up frequently used documents
2. **Bulk Operations**: Use batch endpoints, not individual operations
3. **Real-time Analytics**: Buffer analytics before processing
4. **Deduplication**: Run during off-peak hours
5. **A/B Testing**: Use sufficient split ratio for statistical significance

---

## 🔗 Dependencies

All Phase 4 features use:
- Existing `llmSynthesis.service.js` for LLM calls
- Existing `advancedEmbedding.service.js` for embeddings
- Existing MongoDB/Mongoose setup
- `string-similarity` npm package (already installed)
- Native Node.js `crypto` module

**No additional dependencies required!**

---

**Phase 4 Implementation Complete** ✅
**Date**: December 15, 2025
