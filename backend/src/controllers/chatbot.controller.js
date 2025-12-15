// Chatbot Controller - Auth, validation, and orchestration
const chatbotService = require('../services/chatbot.service');
const ruleEngineService = require('../services/ruleEngine.service');
const ragService = require('../services/rag.service');
const feedbackService = require('../services/feedback.service');
const analyticsService = require('../services/analytics.service');
const ChatbotMessage = require('../models/chatbot_message.model');

/**
 * Main endpoint: Ask chatbot a question
 */
async function askAnything(req, res) {
  try {
    const { question } = req.body;
    const userId = req.user._id || req.user.id;

    // Validation
    if (!question) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng nhập câu hỏi'
      });
    }

    if (question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Câu hỏi không thể trống'
      });
    }

    // User context for service
    const userContext = {
      id: userId,
      roles: req.user.roles || [],
      tenantId: req.user.tenantId || 'default'
    };

    // Handle the message through orchestrator
    const result = await chatbotService.handleUserMessage({
      user: userContext,
      text: question
    });

    return res.json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error('Error in askAnything:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Có lỗi xảy ra. Vui lòng thử lại sau.'
    });
  }
}

/**
 * Analyze image and extract text → ask question
 */
async function analyzeImage(req, res) {
  try {
    // For Phase 2+: integrate with Google Vision or similar
    // For now, this is backward compatibility with existing image analysis
    return res.status(501).json({
      success: false,
      error: 'Image analysis coming in Phase 2'
    });
  } catch (err) {
    console.error('Error in analyzeImage:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Có lỗi xảy ra. Vui lòng thử lại sau.'
    });
  }
}

/**
 * Get chat history for current user
 */
async function getChatHistory(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const tenantId = req.user.tenantId || 'default';
    const { limit = 20, page = 1 } = req.query;

    const result = await chatbotService.getChatHistory(userId, tenantId, {
      limit: parseInt(limit),
      page: parseInt(page)
    });

    return res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (err) {
    console.error('Error in getChatHistory:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Không thể lấy lịch chat'
    });
  }
}

/**
 * Admin: List all rules
 */
async function listRules(req, res) {
  try {
    const tenantId = req.user.tenantId || 'default';
    const { isActive } = req.query;

    const filters = {};
    if (isActive !== undefined) {
      filters.isActive = isActive === 'true';
    }

    const rules = await ruleEngineService.getAllRules(tenantId, filters);

    return res.json({
      success: true,
      data: rules,
      count: rules.length
    });
  } catch (err) {
    console.error('Error in listRules:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Không thể lấy danh sách rules'
    });
  }
}

/**
 * Admin: Create new rule
 */
async function createRule(req, res) {
  try {
    const { pattern, keywords, responseTemplate, priority, allowedRoles, type } = req.body;
    const tenantId = req.user.tenantId || 'default';
    const userId = req.user._id || req.user.id;

    // Validation
    if (!pattern || !responseTemplate) {
      return res.status(400).json({
        success: false,
        error: 'Pattern và responseTemplate là bắt buộc'
      });
    }

    const ruleData = {
      pattern,
      keywords: keywords || [],
      responseTemplate,
      priority: priority || 5,
      allowedRoles: allowedRoles || [],
      type: type || 'faq',
      createdBy: userId
    };

    const rule = await ruleEngineService.createRule(ruleData, tenantId);

    return res.status(201).json({
      success: true,
      data: rule,
      message: 'Rule created successfully'
    });
  } catch (err) {
    console.error('Error in createRule:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Không thể tạo rule'
    });
  }
}

/**
 * Admin: Update rule
 */
async function updateRule(req, res) {
  try {
    const { id } = req.params;
    const { pattern, keywords, responseTemplate, priority, allowedRoles, type, isActive } = req.body;

    const ruleData = {
      pattern,
      keywords,
      responseTemplate,
      priority,
      allowedRoles,
      type,
      isActive
    };

    // Remove undefined fields
    Object.keys(ruleData).forEach(key => ruleData[key] === undefined && delete ruleData[key]);

    const rule = await ruleEngineService.updateRule(id, ruleData);

    return res.json({
      success: true,
      data: rule,
      message: 'Rule updated successfully'
    });
  } catch (err) {
    console.error('Error in updateRule:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Không thể cập nhật rule'
    });
  }
}

/**
 * Admin: Delete rule
 */
async function deleteRule(req, res) {
  try {
    const { id } = req.params;

    await ruleEngineService.deleteRule(id);

    return res.json({
      success: true,
      message: 'Rule deleted successfully'
    });
  } catch (err) {
    console.error('Error in deleteRule:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Không thể xóa rule'
    });
  }
}

/**
 * Admin: Test a query against rules
 */
async function testQuery(req, res) {
  try {
    const { query } = req.body;
    const tenantId = req.user.tenantId || 'default';

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query là bắt buộc'
      });
    }

    const userContext = {
      id: req.user._id || req.user.id,
      roles: req.user.roles || [],
      tenantId
    };

    // Test rule engine
    const ruleResult = await ruleEngineService.match(query, userContext);

    // Test RAG engine
    let ragResult = null;
    try {
      ragResult = await ragService.retrieve(query, userContext);
    } catch (err) {
      console.error('RAG test error:', err.message);
    }

    return res.json({
      success: true,
      data: {
        query,
        ruleMatch: ruleResult ? {
          answer: ruleResult.answer,
          confidence: ruleResult.confidence,
          matchedRuleId: ruleResult.matchedRuleId
        } : null,
        ragMatch: ragResult && ragResult.answer ? {
          answer: ragResult.answer,
          confidence: ragResult.confidence,
          retrievedDocIds: ragResult.retrievedDocIds
        } : null
      }
    });
  } catch (err) {
    console.error('Error in testQuery:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Không thể test query'
    });
  }
}

/**
 * Admin: Get chat analytics
 */
async function getAnalytics(req, res) {
  try {
    const tenantId = req.user.tenantId || 'default';
    const { timeRange = 'day' } = req.query;

    const stats = await chatbotService.getAnalytics(tenantId, timeRange);

    return res.json({
      success: true,
      data: stats,
      timeRange
    });
  } catch (err) {
    console.error('Error in getAnalytics:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Không thể lấy analytics'
    });
  }
}

/**
 * Admin: List chat messages
 */
async function listMessages(req, res) {
  try {
    const tenantId = req.user.tenantId || 'default';
    const { limit = 50, page = 1, source, userId } = req.query;
    const skip = (page - 1) * limit;

    const filter = { tenantId };
    if (source) filter.source = source;
    if (userId) filter.userId = userId;

    const messages = await ChatbotMessage.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'username')
      .lean();

    const total = await ChatbotMessage.countDocuments(filter);

    return res.json({
      success: true,
      data: messages,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error in listMessages:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Không thể lấy danh sách messages'
    });
  }
}

/**
 * Admin: List knowledge base documents
 */
async function listDocuments(req, res) {
  try {
    const tenantId = req.user.tenantId || 'default';
    const { limit = 20, page = 1, category } = req.query;

    const result = await ragService.listDocuments(tenantId, {
      limit: parseInt(limit),
      page: parseInt(page),
      category,
      isActive: true
    });

    return res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (err) {
    console.error('Error in listDocuments:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Không thể lấy danh sách tài liệu'
    });
  }
}

/**
 * Admin: Create knowledge base document
 */
async function createDocument(req, res) {
  try {
    const { title, content, category, tags, allowedRoles, priority } = req.body;
    const tenantId = req.user.tenantId || 'default';
    const userId = req.user._id || req.user.id;

    // Validation
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Title và content là bắt buộc'
      });
    }

    const documentData = {
      title,
      content,
      category: category || 'other',
      tags: tags || [],
      allowedRoles: allowedRoles || [],
      priority: priority || 5,
      tenantId
    };

    const document = await ragService.createDocument(documentData, userId);

    return res.status(201).json({
      success: true,
      data: document,
      message: 'Tài liệu created successfully'
    });
  } catch (err) {
    console.error('Error in createDocument:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Không thể tạo tài liệu'
    });
  }
}

/**
 * Admin: Update knowledge base document
 */
async function updateDocument(req, res) {
  try {
    const { id } = req.params;
    const { title, content, category, tags, allowedRoles, priority, isActive } = req.body;
    const userId = req.user._id || req.user.id;

    const documentData = {
      title,
      content,
      category,
      tags,
      allowedRoles,
      priority,
      isActive
    };

    // Remove undefined fields
    Object.keys(documentData).forEach(key => documentData[key] === undefined && delete documentData[key]);

    const document = await ragService.updateDocument(id, documentData, userId);

    return res.json({
      success: true,
      data: document,
      message: 'Tài liệu updated successfully'
    });
  } catch (err) {
    console.error('Error in updateDocument:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Không thể cập nhật tài liệu'
    });
  }
}

/**
 * Admin: Delete knowledge base document
 */
async function deleteDocument(req, res) {
  try {
    const { id } = req.params;

    await ragService.deleteDocument(id);

    return res.json({
      success: true,
      message: 'Tài liệu deleted successfully'
    });
  } catch (err) {
    console.error('Error in deleteDocument:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Không thể xóa tài liệu'
    });
  }
}

/**
 * Admin: Get single document
 */
async function getDocument(req, res) {
  try {
    const { id } = req.params;

    const document = await ragService.getDocument(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Tài liệu không tìm thấy'
      });
    }

    return res.json({
      success: true,
      data: document
    });
  } catch (err) {
    console.error('Error in getDocument:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Không thể lấy tài liệu'
    });
  }
}

/**
 * Phase 3: Submit feedback for an answer
 */
async function submitFeedback(req, res) {
  try {
    const { messageId, rating, issue, suggestion, isHelpful } = req.body;
    const userId = req.user._id || req.user.id;

    // Validation
    if (!messageId || !rating) {
      return res.status(400).json({
        success: false,
        error: 'Message ID và rating là bắt buộc'
      });
    }

    const feedback = await feedbackService.submitFeedback(
      { messageId, rating, issue, suggestion, isHelpful },
      userId
    );

    return res.status(201).json({
      success: true,
      data: feedback,
      message: 'Feedback submitted successfully'
    });
  } catch (err) {
    console.error('Error submitting feedback:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Không thể submit feedback'
    });
  }
}

/**
 * Phase 3: Get feedback list (admin)
 */
async function listFeedback(req, res) {
  try {
    const tenantId = req.user.tenantId || 'default';
    const { limit = 20, page = 1, rating, source, issue } = req.query;

    const result = await feedbackService.listFeedback(tenantId, {
      limit: parseInt(limit),
      page: parseInt(page),
      rating,
      source,
      issue
    });

    return res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (err) {
    console.error('Error listing feedback:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Không thể lấy danh sách feedback'
    });
  }
}

/**
 * Phase 3: Get advanced analytics dashboard
 */
async function getDashboard(req, res) {
  try {
    const tenantId = req.user.tenantId || 'default';
    const { timeRange = 'day' } = req.query;

    const dashboard = await analyticsService.getDashboard(tenantId, timeRange);

    return res.json({
      success: true,
      data: dashboard,
      timeRange
    });
  } catch (err) {
    console.error('Error getting dashboard:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Không thể lấy dashboard'
    });
  }
}

/**
 * Phase 3: Get trending topics
 */
async function getTrendingTopics(req, res) {
  try {
    const tenantId = req.user.tenantId || 'default';
    const { limit = 10 } = req.query;

    const topics = await analyticsService.getTrendingTopics(tenantId, parseInt(limit));

    return res.json({
      success: true,
      data: topics
    });
  } catch (err) {
    console.error('Error getting trending topics:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Không thể lấy trending topics'
    });
  }
}

/**
 * Phase 3: Get document performance metrics
 */
async function getDocumentPerformance(req, res) {
  try {
    const tenantId = req.user.tenantId || 'default';
    const { timeRange = 'day' } = req.query;

    const performance = await analyticsService.getDocumentPerformance(tenantId, timeRange);

    return res.json({
      success: true,
      data: performance,
      timeRange
    });
  } catch (err) {
    console.error('Error getting document performance:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Không thể lấy document performance'
    });
  }
}

/**
 * Phase 3: Get issues report
 */
async function getIssuesReport(req, res) {
  try {
    const tenantId = req.user.tenantId || 'default';

    const issues = await feedbackService.getIssuesReport(tenantId);

    return res.json({
      success: true,
      data: issues
    });
  } catch (err) {
    console.error('Error getting issues report:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Không thể lấy issues report'
    });
  }
}

module.exports = {
  askAnything,
  analyzeImage,
  getChatHistory,
  listRules,
  createRule,
  updateRule,
  deleteRule,
  testQuery,
  getAnalytics,
  listMessages,
  listDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  getDocument,
  // Phase 3: Feedback and analytics
  submitFeedback,
  listFeedback,
  getDashboard,
  getTrendingTopics,
  getDocumentPerformance,
  getIssuesReport
};
