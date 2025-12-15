// Bulk Import Service - Import documents from external sources (Phase 4 - Feature 4)
const ChatbotDocument = require('../models/chatbot_document.model');
const advancedEmbeddingService = require('./advancedEmbedding.service');
const autoCategoryService = require('./autoCategory.service');

class BulkImportService {
  /**
   * Import documents from array
   */
  async importDocuments(documents, tenantId, userId, options = {}) {
    try {
      const {
        autoEmbed = true,
        autoCategory = true,
        autoTag = true,
        deDuplicate = true
      } = options;

      const results = {
        total: documents.length,
        imported: 0,
        failed: 0,
        duplicates: 0,
        errors: []
      };

      // Check for duplicates if enabled
      let existingDocs = [];
      if (deDuplicate) {
        existingDocs = await ChatbotDocument.find({
          tenantId,
          isActive: true
        }).select('title content').lean();
      }

      for (let i = 0; i < documents.length; i++) {
        try {
          const doc = documents[i];

          // Validate required fields
          if (!doc.title || !doc.content) {
            results.failed++;
            results.errors.push({
              index: i,
              error: 'Missing title or content'
            });
            continue;
          }

          // Check for duplicates
          if (deDuplicate) {
            const isDuplicate = existingDocs.some(existing => 
              existing.title === doc.title || existing.content === doc.content
            );

            if (isDuplicate) {
              results.duplicates++;
              continue;
            }
          }

          // Auto-embed if enabled
          let embedding = doc.embedding || [];
          if (autoEmbed && embedding.length === 0) {
            embedding = await advancedEmbeddingService.embedText(doc.content);
          }

          // Auto-categorize if enabled
          let category = doc.category || 'other';
          if (autoCategory) {
            category = await autoCategoryService.categorizeDocument(doc.content, doc.title);
          }

          // Auto-tag if enabled
          let tags = doc.tags || [];
          if (autoTag && tags.length === 0) {
            tags = await autoCategoryService.generateTags(doc.content, doc.title);
          }

          // Create document
          const newDoc = new ChatbotDocument({
            tenantId,
            title: doc.title,
            content: doc.content,
            category,
            embedding,
            tags,
            priority: doc.priority || 5,
            allowedRoles: doc.allowedRoles || [],
            relatedRuleIds: doc.relatedRuleIds || [],
            createdBy: userId
          });

          await newDoc.save();
          results.imported++;
        } catch (err) {
          results.failed++;
          results.errors.push({
            index: i,
            title: documents[i].title,
            error: err.message
          });
        }
      }

      return results;
    } catch (err) {
      console.error('Error importing documents:', err.message);
      throw err;
    }
  }

  /**
   * Import from CSV format
   */
  async importFromCSV(csvContent, tenantId, userId, options = {}) {
    try {
      const lines = csvContent.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        throw new Error('CSV must have header and at least one row');
      }

      const header = lines[0].split(',').map(h => h.trim().toLowerCase());
      const documents = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const doc = {};

        header.forEach((col, index) => {
          doc[col] = values[index] || '';
        });

        if (doc.title && doc.content) {
          documents.push(doc);
        }
      }

      return await this.importDocuments(documents, tenantId, userId, options);
    } catch (err) {
      console.error('Error importing from CSV:', err.message);
      throw err;
    }
  }

  /**
   * Import from JSON Lines format
   */
  async importFromJSONLines(jsonlContent, tenantId, userId, options = {}) {
    try {
      const documents = [];
      const lines = jsonlContent.split('\n').filter(line => line.trim());

      for (const line of lines) {
        try {
          const doc = JSON.parse(line);
          if (doc.title && doc.content) {
            documents.push(doc);
          }
        } catch (err) {
          console.error(`Failed to parse JSON line: ${err.message}`);
        }
      }

      return await this.importDocuments(documents, tenantId, userId, options);
    } catch (err) {
      console.error('Error importing from JSONL:', err.message);
      throw err;
    }
  }

  /**
   * Get import history
   */
  async getImportHistory(tenantId, limit = 20) {
    try {
      const imports = await ChatbotDocument.find({
        tenantId,
        createdAt: { $gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
        .select('title category createdBy createdAt')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return imports;
    } catch (err) {
      console.error('Error getting import history:', err.message);
      return [];
    }
  }

  /**
   * Validate import data before import
   */
  async validateImportData(documents) {
    try {
      const validation = {
        total: documents.length,
        valid: 0,
        invalid: 0,
        errors: [],
        warnings: []
      };

      documents.forEach((doc, index) => {
        // Check required fields
        if (!doc.title || !doc.content) {
          validation.invalid++;
          validation.errors.push({
            index,
            field: !doc.title ? 'title' : 'content',
            message: 'Required field missing'
          });
          return;
        }

        // Check field lengths
        if (doc.title.length > 500) {
          validation.warnings.push({
            index,
            field: 'title',
            message: 'Title exceeds 500 characters'
          });
        }

        // Check content length
        if (doc.content.length < 20) {
          validation.warnings.push({
            index,
            field: 'content',
            message: 'Content is very short (< 20 characters)'
          });
        }

        validation.valid++;
      });

      return validation;
    } catch (err) {
      console.error('Error validating import data:', err.message);
      throw err;
    }
  }
}

module.exports = new BulkImportService();
