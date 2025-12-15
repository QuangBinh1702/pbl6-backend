// RAG (Retrieval-Augmented Generation) Service
// Handles knowledge base retrieval and document ranking
const ChatbotDocument = require('../models/chatbot_document.model');
const embeddingService = require('./embedding.service');
const advancedEmbeddingService = require('./advancedEmbedding.service');
const llmSynthesisService = require('./llmSynthesis.service');
const CONFIG = require('../config/chatbot.config');

class RAGService {
  /**
   * Main RAG retrieval method
   * Takes user query, finds relevant documents from knowledge base
   */
  async retrieve(query, userContext) {
    try {
      if (!query || query.trim().length === 0) {
        return {
          answer: '',
          confidence: 0,
          retrievedDocIds: [],
          documents: []
        };
      }

      // 1. Get query embedding (use advanced embedding if available)
      const queryEmbedding = CONFIG.USE_HUGGINGFACE_EMBEDDINGS === 'true'
        ? await advancedEmbeddingService.embed(query)
        : await embeddingService.embed(query);

      // 2. Get applicable documents (active + RBAC filtered)
      const applicableDocuments = await this._getApplicableDocuments(userContext);

      if (applicableDocuments.length === 0) {
        return {
          answer: '',
          confidence: 0,
          retrievedDocIds: [],
          documents: []
        };
      }

      // 3. Score documents by relevance
      const scoredDocuments = applicableDocuments.map(doc => {
        // Calculate similarity to query
        const similarity = doc.embedding && doc.embedding.length > 0
          ? embeddingService.cosineSimilarity(queryEmbedding, doc.embedding)
          : 0;

        // Boost score by priority
        const priorityBoost = 1 + ((doc.priority - 5) * 0.05);
        const finalScore = Math.min(similarity * priorityBoost, 1);

        return {
          ...doc.toObject ? doc.toObject() : doc,
          relevanceScore: finalScore
        };
      });

      // 4. Sort by relevance and take top K
      const topDocuments = scoredDocuments
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, CONFIG.RAG_TOP_K);

      // 5. Find best match with confidence threshold
      const bestMatch = topDocuments[0];
      
      if (!bestMatch || bestMatch.relevanceScore < CONFIG.RAG_MIN_CONFIDENCE) {
        return {
          answer: '',
          confidence: 0,
          retrievedDocIds: topDocuments.map(d => d._id),
          documents: topDocuments
        };
      }

      // 6. Synthesize answer from top documents (LLM or concatenation)
      const answer = await llmSynthesisService.synthesizeAnswer(query, topDocuments);
      const confidence = bestMatch.relevanceScore;
      const usedLLM = llmSynthesisService.isConfigured();

      // 7. Update document analytics
      topDocuments.forEach(doc => {
        ChatbotDocument.findByIdAndUpdate(
          doc._id,
          {
            $inc: { retrievalCount: 1 },
            lastRetrievedAt: new Date(),
            $set: { avgConfidenceScore: (doc.avgConfidenceScore || 0 + bestMatch.relevanceScore) / 2 }
          },
          { new: false }
        ).catch(err => console.error('Error updating doc analytics:', err.message));
      });

      return {
        answer,
        confidence,
        retrievedDocIds: topDocuments.map(d => d._id),
        documents: topDocuments,
        bestMatchId: bestMatch._id,
        usedLLM
      };
    } catch (err) {
      console.error('RAG retrieval error:', err.message);
      throw err;
    }
  }

  /**
   * Get documents applicable to user (RBAC filtering)
   */
  async _getApplicableDocuments(userContext) {
    try {
      // Build query: must be active, must be in same tenant
      const baseQuery = {
        tenantId: userContext.tenantId || 'default',
        isActive: true
      };

      // RBAC: if user has roles, filter by allowedRoles
      if (userContext.roles && userContext.roles.length > 0) {
        baseQuery.$or = [
          { allowedRoles: { $size: 0 } }, // No role restriction
          { allowedRoles: { $in: userContext.roles } } // User has one of allowed roles
        ];
      } else {
        // No roles, can only access unrestricted documents
        baseQuery.allowedRoles = { $size: 0 };
      }

      const documents = await ChatbotDocument.find(baseQuery)
        .sort({ priority: -1 })
        .lean();

      return documents;
    } catch (err) {
      console.error('Error getting applicable documents:', err.message);
      return [];
    }
  }

  /**
   * Compile answer from top retrieved documents
   */
  _compileAnswer(documents) {
    if (!documents || documents.length === 0) {
      return '';
    }

    // Simply concatenate top results with separator
    const contents = documents
      .slice(0, CONFIG.MAX_RETRIEVED_DOCS)
      .map(doc => doc.content)
      .join('\n\n---\n\n');

    // Limit response length
    if (contents.length > CONFIG.MAX_RESPONSE_LENGTH) {
      return contents.substring(0, CONFIG.MAX_RESPONSE_LENGTH) + '...';
    }

    return contents;
  }

  /**
   * Create or update document in knowledge base
   */
  async createDocument(data, userId) {
    try {
      const { title, content, category, tags, allowedRoles, priority, tenantId } = data;

      if (!title || !content) {
        throw new Error('Title and content are required');
      }

      // Generate embedding for content (use advanced embedding if available)
      const embedding = CONFIG.USE_HUGGINGFACE_EMBEDDINGS === 'true'
        ? await advancedEmbeddingService.embed(content)
        : await embeddingService.embed(content);

      const document = new ChatbotDocument({
        title,
        content,
        category: category || 'other',
        tags: tags || [],
        allowedRoles: allowedRoles || [],
        priority: priority || 5,
        embedding,
        tenantId: tenantId || 'default',
        createdBy: userId,
        updatedBy: userId
      });

      await document.save();
      return document;
    } catch (err) {
      console.error('Error creating document:', err.message);
      throw err;
    }
  }

  /**
   * Update existing document
   */
  async updateDocument(docId, data, userId) {
    try {
      const updateData = { ...data };
      updateData.updatedBy = userId;

      // If content changed, regenerate embedding
      if (data.content) {
        updateData.embedding = CONFIG.USE_HUGGINGFACE_EMBEDDINGS === 'true'
          ? await advancedEmbeddingService.embed(data.content)
          : await embeddingService.embed(data.content);
      }

      const document = await ChatbotDocument.findByIdAndUpdate(
        docId,
        updateData,
        { new: true, runValidators: true }
      );

      if (!document) {
        throw new Error('Document not found');
      }

      return document;
    } catch (err) {
      console.error('Error updating document:', err.message);
      throw err;
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(docId) {
    try {
      const result = await ChatbotDocument.findByIdAndDelete(docId);
      if (!result) {
        throw new Error('Document not found');
      }
      return result;
    } catch (err) {
      console.error('Error deleting document:', err.message);
      throw err;
    }
  }

  /**
   * Get document by ID
   */
  async getDocument(docId) {
    try {
      return await ChatbotDocument.findById(docId).lean();
    } catch (err) {
      console.error('Error getting document:', err.message);
      throw err;
    }
  }

  /**
   * List all documents (paginated)
   */
  async listDocuments(tenantId, options = {}) {
    try {
      const { limit = 20, page = 1, category, isActive = true } = options;
      const skip = (page - 1) * limit;

      const query = {
        tenantId: tenantId || 'default',
        isActive
      };

      if (category) {
        query.category = category;
      }

      const [documents, total] = await Promise.all([
        ChatbotDocument.find(query)
          .sort({ priority: -1, createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        ChatbotDocument.countDocuments(query)
      ]);

      return {
        data: documents,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      };
    } catch (err) {
      console.error('Error listing documents:', err.message);
      return {
        data: [],
        pagination: { total: 0, page: 1, limit: 20, pages: 0 }
      };
    }
  }
}

module.exports = new RAGService();
