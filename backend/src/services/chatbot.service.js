// Chatbot Orchestrator Service - Main decision logic
const ruleEngineService = require('./ruleEngine.service');
const fallbackService = require('./fallback.service');
const ragService = require('./rag.service');
const ChatbotMessage = require('../models/chatbot_message.model');
const languageDetectionService = require('./languageDetection.service');
const CONFIG = require('../config/chatbot.config');

class ChatbotService {
  /**
   * Main entry point for handling user messages
   * Orchestrates decision between rule engine → RAG → fallback
   */
  async handleUserMessage({ user, text, metadata = {} }) {
    const startTime = Date.now();

    try {
      // Validate input
      if (!text || text.trim().length === 0) {
        const result = fallbackService.answer(text, 'empty_query');
        result.responseTime = Date.now() - startTime;
        return result;
      }

      // Phase 3: Detect language
      const langDetection = await languageDetectionService.detectLanguage(text);
      const detectedLang = langDetection.language;

      // User context for RBAC
      const userContext = {
        id: user.id || user._id,
        roles: user.roles || [],
        tenantId: user.tenantId || 'default'
      };

      // 1. Try rule-based matching first
      let ruleResult = null;
      let ragResult = null;

      if (CONFIG.ENABLE_RULES) {
        ruleResult = await ruleEngineService.match(text, userContext);
        
        if (ruleResult && ruleResult.confidence >= CONFIG.RULE_MIN_CONFIDENCE) {
          const response = {
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

          // Log the message (with language info)
          await this.logMessage(userContext, text, response, detectedLang, langDetection.confidence);

          return response;
        }
      }

      // 2. Try RAG (Phase 2)
      if (CONFIG.ENABLE_RAG) {
        try {
          ragResult = await ragService.retrieve(text, userContext);
          
          if (ragResult && ragResult.answer && ragResult.confidence >= CONFIG.RAG_MIN_CONFIDENCE) {
            const response = {
              answer: ragResult.answer,
              source: 'rag',
              confidence: ragResult.confidence,
              retrievedDocIds: ragResult.retrievedDocIds || [],
              responseTime: Date.now() - startTime,
              scores: {
                ruleScore: ruleResult?.confidence || 0,
                ragScore: ragResult.confidence
              }
            };

            // Log the message (with language info)
            await this.logMessage(userContext, text, response, detectedLang, langDetection.confidence, response.usedLLM);

            return response;
          }
        } catch (err) {
          console.error('RAG service error:', err.message);
          // Continue to fallback if RAG fails
        }
      }

      // 3. Fallback
      const fallbackResult = fallbackService.answer(text, 'no_match');
      fallbackResult.responseTime = Date.now() - startTime;
      fallbackResult.scores = {
        ruleScore: ruleResult?.confidence || 0,
        ragScore: ragResult?.confidence || 0
      };

      // Log the message (with language info)
      await this.logMessage(userContext, text, fallbackResult, detectedLang, langDetection.confidence);

      return fallbackResult;
    } catch (err) {
      console.error('Chatbot orchestrator error:', err.message);

      const errorResult = fallbackService.answer(text, 'error');
      errorResult.responseTime = Date.now() - startTime;
      errorResult.error = err.message;

      // Try to log even on error
      try {
        await this.logMessage(
          { id: user?.id || user?._id, roles: user?.roles || [], tenantId: user?.tenantId || 'default' },
          text,
          errorResult,
          detectedLang || 'unknown',
          langDetection?.confidence || 0
        );
      } catch (logErr) {
        console.error('Failed to log error message:', logErr.message);
      }

      return errorResult;
    }
  }

  /**
   * Log user message and response
   */
  async logMessage(userContext, query, result, detectedLang = 'unknown', langConfidence = 0, usedLLM = false) {
    try {
      const logEntry = new ChatbotMessage({
        userId: userContext.id,
        tenantId: userContext.tenantId,
        query,
        answer: result.answer,
        source: result.source,
        scores: result.scores || { ruleScore: 0, ragScore: 0 },
        matchedRuleId: result.matchedRuleId || null,
        retrievedDocIds: result.retrievedDocIds || [],
        responseTime: result.responseTime || 0,
        userRoles: userContext.roles,
        // Phase 3: Language detection info
        detectedLanguage: detectedLang,
        languageConfidence: langConfidence,
        // Phase 3: LLM usage tracking
        usedLLM: usedLLM || result.usedLLM || false,
        llmModel: usedLLM ? CONFIG.LLM_MODEL : null,
        timestamp: new Date()
      });

      await logEntry.save();
      return logEntry;
    } catch (err) {
      console.error('Error logging message:', err.message);
      // Don't throw - logging failure shouldn't block response
      return null;
    }
  }

  /**
   * Get chat history for user
   */
  async getChatHistory(userId, tenantId, options = {}) {
    try {
      const { limit = 20, page = 1 } = options;
      const skip = (page - 1) * limit;

      const messages = await ChatbotMessage.find({
        userId,
        tenantId
      })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const total = await ChatbotMessage.countDocuments({
        userId,
        tenantId
      });

      return {
        data: messages,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      };
    } catch (err) {
      console.error('Error in getChatHistory():', err.message);
      return {
        data: [],
        pagination: { total: 0, page: 1, limit: 20, pages: 0 }
      };
    }
  }

  /**
   * Get analytics
   */
  async getAnalytics(tenantId, timeRange = 'day') {
    try {
      const now = new Date();
      let startDate = new Date();

      if (timeRange === 'hour') {
        startDate.setHours(startDate.getHours() - 1);
      } else if (timeRange === 'day') {
        startDate.setDate(startDate.getDate() - 1);
      } else if (timeRange === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (timeRange === 'month') {
        startDate.setMonth(startDate.getMonth() - 1);
      }

      // Get messages in time range
      const messages = await ChatbotMessage.find({
        tenantId,
        timestamp: { $gte: startDate, $lte: now }
      }).lean();

      // Calculate stats
      const stats = {
        totalQueries: messages.length,
        bySource: {},
        avgResponseTime: 0,
        avgScores: {
          ruleScore: 0,
          ragScore: 0
        }
      };

      // Count by source
      const sources = ['rule', 'rag', 'fallback'];
      sources.forEach(source => {
        stats.bySource[source] = messages.filter(m => m.source === source).length;
      });

      // Calculate averages
      if (messages.length > 0) {
        const totalResponseTime = messages.reduce((sum, m) => sum + (m.responseTime || 0), 0);
        stats.avgResponseTime = Math.round(totalResponseTime / messages.length);

        const totalRuleScore = messages.reduce((sum, m) => sum + (m.scores?.ruleScore || 0), 0);
        stats.avgScores.ruleScore = Math.round((totalRuleScore / messages.length) * 100) / 100;

        const totalRagScore = messages.reduce((sum, m) => sum + (m.scores?.ragScore || 0), 0);
        stats.avgScores.ragScore = Math.round((totalRagScore / messages.length) * 100) / 100;
      }

      return stats;
    } catch (err) {
      console.error('Error in getAnalytics():', err.message);
      return {
        totalQueries: 0,
        bySource: { rule: 0, rag: 0, fallback: 0 },
        avgResponseTime: 0,
        avgScores: { ruleScore: 0, ragScore: 0 }
      };
    }
  }

  /**
   * Clear chat history (admin)
   */
  async clearChatHistory(userId, tenantId) {
    try {
      const result = await ChatbotMessage.deleteMany({
        userId,
        tenantId
      });

      return result.deletedCount;
    } catch (err) {
      console.error('Error clearing chat history:', err.message);
      throw err;
    }
  }
}

module.exports = new ChatbotService();
