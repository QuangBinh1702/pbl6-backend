// Rule Engine Service - Pattern matching with similarity
const stringSimilarity = require('string-similarity');
const ChatbotRule = require('../models/chatbot_rule.model');
const CONFIG = require('../config/chatbot.config');

class RuleEngineService {
  /**
   * Match user question against rules
   * Returns: { answer, confidence, matchedRuleId, source: 'rule' } or null
   */
  async match(question, userContext) {
    try {
      if (!question || question.trim().length === 0) {
        return null;
      }

      // 1. Load applicable rules (RBAC + tenant)
      const rules = await this.getApplicableRules(userContext);

      if (!rules.length) {
        return null;
      }

      // 2. Normalize question
      const normalizedQ = this.normalizeText(question);

      // 3. Calculate similarity score for each rule
      let bestMatch = null;
      let bestScore = 0;

      for (const rule of rules) {
        const score = this.calculateSimilarity(
          normalizedQ,
          rule.keywords && rule.keywords.length > 0 ? rule.keywords : [rule.pattern]
        );

        // Consider priority in scoring
        const adjustedScore = score * (1 + (rule.priority - 5) * 0.05);

        if (adjustedScore > bestScore) {
          bestScore = adjustedScore;
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
    } catch (err) {
      console.error('Error in RuleEngine.match():', err.message);
      return null;
    }
  }

  /**
   * Get rules applicable to user (RBAC + tenant filtering)
   */
  async getApplicableRules(userContext) {
    try {
      const rules = await ChatbotRule.find({
        tenantId: userContext.tenantId,
        isActive: true,
        $or: [
          { allowedRoles: { $exists: false } },
          { allowedRoles: { $size: 0 } },
          { allowedRoles: { $in: userContext.roles || [] } }
        ]
      }).sort({ priority: -1 }).lean();

      return rules;
    } catch (err) {
      console.error('Error in getApplicableRules():', err.message);
      return [];
    }
  }

  /**
   * Normalize Vietnamese text: lowercase, trim, remove diacritics, extra spaces
   */
  normalizeText(text) {
    if (!text) return '';

    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      // Vietnamese diacritics mapping
      .replace(/[àáảãạăằắẳẵặâầấẩẫậ]/g, 'a')
      .replace(/[èéẻẽẹêềếểễệ]/g, 'e')
      .replace(/[ìíỉĩị]/g, 'i')
      .replace(/[òóỏõọôồốổỗộơờớởỡợ]/g, 'o')
      .replace(/[ùúủũụưừứửữự]/g, 'u')
      .replace(/[ỳýỷỹỵ]/g, 'y')
      .replace(/[đ]/g, 'd')
      // Remove punctuation
      .replace(/[.,!?;:'"()\-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Calculate similarity between query and keywords
   * Returns max similarity score (0-1)
   */
  calculateSimilarity(query, keywords) {
    if (!keywords || keywords.length === 0) {
      return 0;
    }

    let maxSimilarity = 0;

    keywords.forEach(keyword => {
      if (keyword && keyword.trim().length > 0) {
        // Normalize keyword too
        const normalizedKeyword = this.normalizeText(keyword);
        const similarity = stringSimilarity.compareTwoStrings(query, normalizedKeyword);

        // Also check for substring matches (bonus)
        let substringBonus = 0;
        if (query.includes(normalizedKeyword) || normalizedKeyword.includes(query)) {
          substringBonus = 0.1;
        }

        const adjustedSimilarity = Math.min(1, similarity + substringBonus);
        maxSimilarity = Math.max(maxSimilarity, adjustedSimilarity);
      }
    });

    return maxSimilarity;
  }

  /**
   * Get all rules (admin)
   */
  async getAllRules(tenantId, filters = {}) {
    try {
      const query = { tenantId };

      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
      }

      if (filters.type) {
        query.type = filters.type;
      }

      const rules = await ChatbotRule.find(query)
        .sort({ priority: -1, createdAt: -1 })
        .lean();

      return rules;
    } catch (err) {
      console.error('Error in getAllRules():', err.message);
      return [];
    }
  }

  /**
   * Create new rule
   */
  async createRule(ruleData, tenantId) {
    try {
      const rule = new ChatbotRule({
        ...ruleData,
        tenantId
      });

      await rule.save();
      return rule;
    } catch (err) {
      console.error('Error in createRule():', err.message);
      throw err;
    }
  }

  /**
   * Update rule
   */
  async updateRule(ruleId, ruleData) {
    try {
      const rule = await ChatbotRule.findByIdAndUpdate(
        ruleId,
        { ...ruleData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      return rule;
    } catch (err) {
      console.error('Error in updateRule():', err.message);
      throw err;
    }
  }

  /**
   * Delete rule
   */
  async deleteRule(ruleId) {
    try {
      await ChatbotRule.findByIdAndDelete(ruleId);
      return true;
    } catch (err) {
      console.error('Error in deleteRule():', err.message);
      throw err;
    }
  }
}

module.exports = new RuleEngineService();
