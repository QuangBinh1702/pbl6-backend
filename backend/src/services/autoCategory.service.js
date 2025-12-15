// Auto-Categorization Service - LLM-based document categorization (Phase 4 - Feature 2)
const ChatbotDocument = require('../models/chatbot_document.model');
const llmSynthesisService = require('./llmSynthesis.service');

class AutoCategoryService {
  constructor() {
    this.categories = ['faq', 'guide', 'policy', 'regulation', 'procedure', 'other'];
    this.enableAutoCategory = process.env.ENABLE_AUTO_CATEGORY === 'true';
  }

  /**
   * Auto-categorize a document using LLM
   */
  async categorizeDocument(content, title) {
    try {
      if (!this.enableAutoCategory) {
        return 'other';
      }

      const prompt = `Analyze this document and categorize it into ONE of these categories: ${this.categories.join(', ')}.

Title: ${title}
Content: ${content.substring(0, 500)}...

Respond with ONLY the category name, nothing else.`;

      const category = await llmSynthesisService.synthesizeAnswer(prompt, []);
      
      // Validate the response
      const normalizedCategory = category.toLowerCase().trim();
      if (this.categories.includes(normalizedCategory)) {
        return normalizedCategory;
      }

      return 'other';
    } catch (err) {
      console.error('Error auto-categorizing document:', err.message);
      return 'other';
    }
  }

  /**
   * Auto-tag documents using LLM
   */
  async generateTags(content, title, limit = 5) {
    try {
      if (!this.enableAutoCategory) {
        return [];
      }

      const prompt = `Generate ${limit} relevant tags for this document. Return ONLY comma-separated tags.

Title: ${title}
Content: ${content.substring(0, 500)}...`;

      const tagsResponse = await llmSynthesisService.synthesizeAnswer(prompt, []);
      const tags = tagsResponse
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0 && t.length < 50)
        .slice(0, limit);

      return tags;
    } catch (err) {
      console.error('Error generating tags:', err.message);
      return [];
    }
  }

  /**
   * Suggest category from query context
   */
  async suggestCategoryFromQuery(query, recentMessages = []) {
    try {
      if (!this.enableAutoCategory) {
        return 'other';
      }

      const context = recentMessages
        .slice(-3)
        .map(m => m.query)
        .join(' | ');

      const prompt = `Based on this user query and context, suggest the most relevant category: ${this.categories.join(', ')}.

Context: ${context}
Query: ${query}

Respond with ONLY the category name.`;

      const category = await llmSynthesisService.synthesizeAnswer(prompt, []);
      const normalizedCategory = category.toLowerCase().trim();

      return this.categories.includes(normalizedCategory) ? normalizedCategory : 'other';
    } catch (err) {
      console.error('Error suggesting category:', err.message);
      return 'other';
    }
  }

  /**
   * Bulk recategorize documents
   */
  async bulkRecategorize(tenantId, categoryFilter = null) {
    try {
      const filter = { tenantId, isActive: true };
      if (categoryFilter) filter.category = categoryFilter;

      const documents = await ChatbotDocument.find(filter).lean();
      const results = {
        total: documents.length,
        updated: 0,
        failed: 0,
        changes: []
      };

      for (const doc of documents) {
        try {
          const newCategory = await this.categorizeDocument(doc.content, doc.title);
          const newTags = await this.generateTags(doc.content, doc.title);

          if (newCategory !== doc.category) {
            await ChatbotDocument.findByIdAndUpdate(
              doc._id,
              {
                category: newCategory,
                tags: newTags
              }
            );

            results.updated++;
            results.changes.push({
              documentId: doc._id,
              oldCategory: doc.category,
              newCategory,
              tagsAdded: newTags
            });
          }
        } catch (err) {
          results.failed++;
          console.error(`Failed to recategorize ${doc._id}:`, err.message);
        }
      }

      return results;
    } catch (err) {
      console.error('Error bulk recategorizing:', err.message);
      throw err;
    }
  }

  /**
   * Get category statistics
   */
  async getCategoryStats(tenantId) {
    try {
      const stats = {};
      
      for (const category of this.categories) {
        const count = await ChatbotDocument.countDocuments({
          tenantId,
          category,
          isActive: true
        });
        stats[category] = count;
      }

      const total = Object.values(stats).reduce((sum, count) => sum + count, 0);
      stats.total = total;
      stats.uncategorized = stats.other;

      return stats;
    } catch (err) {
      console.error('Error getting category stats:', err.message);
      return {};
    }
  }
}

module.exports = new AutoCategoryService();
