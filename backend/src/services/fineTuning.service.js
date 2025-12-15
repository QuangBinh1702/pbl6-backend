// Fine-tuning Service - Fine-tuning on user feedback (Phase 4 - Feature 10)
const ChatbotFeedback = require('../models/chatbot_feedback.model');
const ChatbotDocument = require('../models/chatbot_document.model');
const ChatbotMessage = require('../models/chatbot_message.model');

class FineTuningService {
  /**
   * Get fine-tuning candidates from feedback
   */
  async getFineTuningCandidates(tenantId, options = {}) {
    try {
      const {
        minFeedbackCount = 5,
        minNegativeRating = 3,
        timeRange = 'month'
      } = options;

      const dateFilter = this._getDateFilter(timeRange);

      // Get feedback with issues/suggestions
      const feedbacks = await ChatbotFeedback.find({
        tenantId,
        timestamp: dateFilter,
        $or: [
          { issue: { $exists: true, $ne: null } },
          { suggestion: { $exists: true, $ne: null } }
        ]
      })
        .populate('messageId', 'query answer source')
        .lean();

      // Group by document/rule and analyze patterns
      const patterns = {};

      feedbacks.forEach(f => {
        const key = f.source;

        if (!patterns[key]) {
          patterns[key] = {
            source: key,
            totalFeedback: 0,
            issues: {},
            avgRating: 0,
            suggestions: [],
            examples: []
          };
        }

        patterns[key].totalFeedback++;
        patterns[key].avgRating += f.rating;

        if (f.issue) {
          patterns[key].issues[f.issue] = (patterns[key].issues[f.issue] || 0) + 1;
        }

        if (f.suggestion) {
          patterns[key].suggestions.push(f.suggestion);
        }

        if (patterns[key].examples.length < 3) {
          patterns[key].examples.push({
            query: f.query,
            rating: f.rating,
            issue: f.issue
          });
        }
      });

      // Calculate averages
      Object.values(patterns).forEach(p => {
        p.avgRating = Math.round((p.avgRating / p.totalFeedback) * 100) / 100;
      });

      // Filter candidates
      const candidates = Object.values(patterns)
        .filter(p => p.totalFeedback >= minFeedbackCount && p.avgRating <= minNegativeRating)
        .sort((a, b) => a.avgRating - b.avgRating);

      return candidates;
    } catch (err) {
      console.error('Error getting fine-tuning candidates:', err.message);
      return [];
    }
  }

  /**
   * Analyze document effectiveness
   */
  async analyzeDocumentEffectiveness(tenantId) {
    try {
      const documents = await ChatbotDocument.find({
        tenantId,
        isActive: true
      })
        .select('_id title retrievalCount avgConfidenceScore avgFeedbackRating feedbackCount')
        .lean();

      const analysis = documents.map(doc => ({
        documentId: doc._id,
        title: doc.title,
        retrievalCount: doc.retrievalCount || 0,
        avgConfidenceScore: Math.round((doc.avgConfidenceScore || 0) * 100) / 100,
        avgFeedbackRating: Math.round((doc.avgFeedbackRating || 0) * 100) / 100,
        feedbackCount: doc.feedbackCount || 0,
        effectiveScore: this._calculateEffectiveness(doc),
        recommendation: this._getRecommendation(doc)
      }));

      return analysis
        .sort((a, b) => a.effectiveScore - b.effectiveScore);
    } catch (err) {
      console.error('Error analyzing document effectiveness:', err.message);
      return [];
    }
  }

  /**
   * Suggest document improvements
   */
  async suggestImprovements(documentId) {
    try {
      const document = await ChatbotDocument.findById(documentId).lean();
      if (!document) {
        throw new Error('Document not found');
      }

      // Get feedback for this document
      const feedbacks = await ChatbotFeedback.find({
        $expr: { $in: [documentId, '$retrievedDocIds'] }
      }).lean();

      const issues = {};
      const suggestions = [];

      feedbacks.forEach(f => {
        if (f.issue) {
          issues[f.issue] = (issues[f.issue] || 0) + 1;
        }
        if (f.suggestion) {
          suggestions.push(f.suggestion);
        }
      });

      const improvements = {
        documentId,
        currentTitle: document.title,
        currentLength: document.content.length,
        totalFeedback: feedbacks.length,
        topIssues: Object.entries(issues)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([issue, count]) => ({ issue, count })),
        suggestions: suggestions.slice(0, 5),
        recommendations: []
      };

      // Generate recommendations
      if (document.content.length < 100) {
        improvements.recommendations.push('Content too short - expand with more details');
      }

      if (document.content.length > 2000) {
        improvements.recommendations.push('Content too long - consider splitting or summarizing');
      }

      if (document.avgFeedbackRating < 3) {
        improvements.recommendations.push('Low feedback rating - consider major revision');
      }

      if (issues.unclear) {
        improvements.recommendations.push('Users find it unclear - use simpler language');
      }

      if (issues.incomplete) {
        improvements.recommendations.push('Users report incomplete info - add more details');
      }

      return improvements;
    } catch (err) {
      console.error('Error suggesting improvements:', err.message);
      throw err;
    }
  }

  /**
   * Get training insights from feedback
   */
  async getTrainingInsights(tenantId) {
    try {
      const recentFeedback = await ChatbotFeedback.find({
        tenantId,
        timestamp: { $gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }).lean();

      const insights = {
        totalFeedback: recentFeedback.length,
        avgRating: 0,
        improvementAreas: {},
        successPatterns: {},
        userSuggestions: []
      };

      let totalRating = 0;

      recentFeedback.forEach(f => {
        totalRating += f.rating;

        // Track issues as improvement areas
        if (f.issue) {
          insights.improvementAreas[f.issue] = 
            (insights.improvementAreas[f.issue] || 0) + 1;
        }

        // Track high ratings as success patterns
        if (f.rating >= 4) {
          const source = f.source;
          insights.successPatterns[source] = 
            (insights.successPatterns[source] || 0) + 1;
        }

        // Collect suggestions
        if (f.suggestion && insights.userSuggestions.length < 10) {
          insights.userSuggestions.push({
            suggestion: f.suggestion,
            source: f.source,
            rating: f.rating
          });
        }
      });

      insights.avgRating = recentFeedback.length > 0 ? 
        Math.round((totalRating / recentFeedback.length) * 100) / 100 : 0;

      // Convert to sorted arrays
      insights.topImprovementAreas = Object.entries(insights.improvementAreas)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([area, count]) => ({ area, count }));

      insights.successSources = Object.entries(insights.successPatterns)
        .sort((a, b) => b[1] - a[1])
        .map(([source, count]) => ({ source, count }));

      delete insights.improvementAreas;
      delete insights.successPatterns;

      return insights;
    } catch (err) {
      console.error('Error getting training insights:', err.message);
      return {};
    }
  }

  /**
   * Helper: calculate document effectiveness score
   */
  _calculateEffectiveness(doc) {
    const scoreComponents = [];

    if (doc.retrievalCount > 0) {
      scoreComponents.push(Math.min(doc.avgConfidenceScore || 0, 1));
    }

    if (doc.feedbackCount > 0) {
      scoreComponents.push((doc.avgFeedbackRating || 0) / 5);
    }

    if (scoreComponents.length === 0) return 5;

    const avg = scoreComponents.reduce((a, b) => a + b, 0) / scoreComponents.length;
    return Math.round((1 - avg) * 10) / 2; // Invert: lower score = better
  }

  /**
   * Helper: get recommendation based on metrics
   */
  _getRecommendation(doc) {
    if (!doc.retrievalCount && !doc.feedbackCount) {
      return 'not_used';
    }

    if ((doc.avgFeedbackRating || 0) < 3) {
      return 'revise';
    }

    if ((doc.avgConfidenceScore || 0) < 0.5) {
      return 'improve_relevance';
    }

    if (doc.retrievalCount > 50 && (doc.avgFeedbackRating || 0) >= 4) {
      return 'keep';
    }

    return 'monitor';
  }

  /**
   * Helper: get date filter
   */
  _getDateFilter(timeRange) {
    const now = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1);
    }

    return { $gte: startDate, $lte: now };
  }
}

module.exports = new FineTuningService();
