// Similarity Detection Service - Document deduplication & similarity (Phase 4 - Features 3 & 9)
const ChatbotDocument = require('../models/chatbot_document.model');
const stringSimilarity = require('string-similarity');
const advancedEmbeddingService = require('./advancedEmbedding.service');

class SimilarityService {
  constructor() {
    this.similarityThreshold = parseFloat(process.env.SIMILARITY_THRESHOLD || 0.75);
    this.enableSimilarityDetection = process.env.ENABLE_SIMILARITY_DETECTION === 'true';
  }

  /**
   * Detect duplicate/similar documents
   */
  async findSimilarDocuments(documentId, tenantId) {
    try {
      const document = await ChatbotDocument.findById(documentId).lean();
      if (!document) {
        throw new Error('Document not found');
      }

      const otherDocs = await ChatbotDocument.find({
        tenantId,
        _id: { $ne: documentId },
        isActive: true
      }).lean();

      if (otherDocs.length === 0) {
        return [];
      }

      const similarDocs = [];

      for (const otherDoc of otherDocs) {
        // Content-based similarity
        const contentSimilarity = stringSimilarity.compareTwoStrings(
          document.content.substring(0, 500),
          otherDoc.content.substring(0, 500)
        );

        // Embedding-based similarity (if available)
        let embeddingSimilarity = 0;
        if (document.embedding && document.embedding.length > 0 && 
            otherDoc.embedding && otherDoc.embedding.length > 0) {
          embeddingSimilarity = this._cosineSimilarity(document.embedding, otherDoc.embedding);
        }

        // Combined score
        const combinedScore = (contentSimilarity * 0.6) + (embeddingSimilarity * 0.4);

        if (combinedScore >= this.similarityThreshold) {
          similarDocs.push({
            documentId: otherDoc._id,
            title: otherDoc.title,
            category: otherDoc.category,
            contentSimilarity: Math.round(contentSimilarity * 100) / 100,
            embeddingSimilarity: Math.round(embeddingSimilarity * 100) / 100,
            combinedScore: Math.round(combinedScore * 100) / 100
          });
        }
      }

      return similarDocs.sort((a, b) => b.combinedScore - a.combinedScore);
    } catch (err) {
      console.error('Error finding similar documents:', err.message);
      return [];
    }
  }

  /**
   * Automatically merge or deduplicate documents
   */
  async deduplicateDocuments(tenantId, mergeStrategy = 'keep_latest') {
    try {
      const documents = await ChatbotDocument.find({
        tenantId,
        isActive: true
      }).lean();

      const duplicates = [];
      const processed = new Set();
      const results = {
        duplicatesFound: 0,
        merged: 0,
        archived: 0,
        failed: 0
      };

      for (let i = 0; i < documents.length; i++) {
        if (processed.has(documents[i]._id.toString())) continue;

        for (let j = i + 1; j < documents.length; j++) {
          if (processed.has(documents[j]._id.toString())) continue;

          const similarity = stringSimilarity.compareTwoStrings(
            documents[i].content.substring(0, 500),
            documents[j].content.substring(0, 500)
          );

          if (similarity >= this.similarityThreshold) {
            results.duplicatesFound++;

            try {
              if (mergeStrategy === 'keep_latest') {
                const keepDoc = documents[i].updatedAt > documents[j].updatedAt ? documents[i] : documents[j];
                const archiveDoc = keepDoc === documents[i] ? documents[j] : documents[i];

                // Archive the older one
                await ChatbotDocument.findByIdAndUpdate(
                  archiveDoc._id,
                  { isActive: false }
                );

                results.archived++;
                processed.add(archiveDoc._id.toString());
              }
            } catch (err) {
              results.failed++;
              console.error(`Failed to deduplicate: ${err.message}`);
            }
          }
        }

        processed.add(documents[i]._id.toString());
      }

      return results;
    } catch (err) {
      console.error('Error deduplicating documents:', err.message);
      throw err;
    }
  }

  /**
   * Find and suggest merges for similar documents
   */
  async suggestMerges(tenantId, limit = 10) {
    try {
      const documents = await ChatbotDocument.find({
        tenantId,
        isActive: true
      }).lean();

      const suggestions = [];

      for (let i = 0; i < documents.length; i++) {
        for (let j = i + 1; j < documents.length; j++) {
          const similarity = stringSimilarity.compareTwoStrings(
            documents[i].content.substring(0, 500),
            documents[j].content.substring(0, 500)
          );

          if (similarity >= this.similarityThreshold) {
            suggestions.push({
              doc1: {
                id: documents[i]._id,
                title: documents[i].title,
                category: documents[i].category
              },
              doc2: {
                id: documents[j]._id,
                title: documents[j].title,
                category: documents[j].category
              },
              similarity: Math.round(similarity * 100) / 100,
              recommendation: similarity > 0.9 ? 'archive' : 'review'
            });
          }
        }
      }

      return suggestions
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
    } catch (err) {
      console.error('Error suggesting merges:', err.message);
      return [];
    }
  }

  /**
   * Cosine similarity between two vectors
   */
  _cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) return 0;

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      magnitudeA += vecA[i] * vecA[i];
      magnitudeB += vecB[i] * vecB[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) return 0;

    return dotProduct / (magnitudeA * magnitudeB);
  }
}

module.exports = new SimilarityService();
