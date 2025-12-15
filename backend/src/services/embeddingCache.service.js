// Embedding Cache Service - Cache optimization for embeddings (Phase 4 - Feature 6)
const ChatbotDocument = require('../models/chatbot_document.model');
const advancedEmbeddingService = require('./advancedEmbedding.service');

class EmbeddingCacheService {
  constructor() {
    this.cache = new Map(); // Map<contentHash, embedding>
    this.cacheStats = {
      hits: 0,
      misses: 0,
      evictions: 0
    };
    this.maxCacheSize = parseInt(process.env.EMBEDDING_CACHE_SIZE || 1000);
    this.ttl = parseInt(process.env.EMBEDDING_CACHE_TTL || 86400000); // 24 hours
  }

  /**
   * Get or create embedding with caching
   */
  async getEmbedding(text) {
    try {
      const hash = this._hashText(text);

      // Check cache
      const cached = this.cache.get(hash);
      if (cached && !this._isExpired(cached)) {
        this.cacheStats.hits++;
        return cached.embedding;
      }

      if (cached) {
        this.cache.delete(hash);
      }

      // Cache miss - generate embedding
      this.cacheStats.misses++;
      const embedding = await advancedEmbeddingService.embedText(text);

      // Store in cache
      this._setCache(hash, embedding);

      return embedding;
    } catch (err) {
      console.error('Error getting embedding:', err.message);
      throw err;
    }
  }

  /**
   * Batch get embeddings with caching
   */
  async getEmbeddingsBatch(texts) {
    try {
      const results = [];
      const textsToEmbed = [];
      const textsToEmbedIndices = [];

      // Check cache for each text
      texts.forEach((text, index) => {
        const hash = this._hashText(text);
        const cached = this.cache.get(hash);

        if (cached && !this._isExpired(cached)) {
          results[index] = cached.embedding;
          this.cacheStats.hits++;
        } else {
          textsToEmbed.push(text);
          textsToEmbedIndices.push(index);
          this.cacheStats.misses++;
        }
      });

      // Embed uncached texts
      if (textsToEmbed.length > 0) {
        const embeddings = await advancedEmbeddingService.embedTextsBatch(textsToEmbed);

        embeddings.forEach((embedding, i) => {
          const originalIndex = textsToEmbedIndices[i];
          const hash = this._hashText(textsToEmbed[i]);

          results[originalIndex] = embedding;
          this._setCache(hash, embedding);
        });
      }

      return results;
    } catch (err) {
      console.error('Error getting embeddings batch:', err.message);
      throw err;
    }
  }

  /**
   * Warm up cache with documents
   */
  async warmupCache(tenantId, documentIds = []) {
    try {
      const filter = { tenantId, isActive: true };
      if (documentIds.length > 0) {
        filter._id = { $in: documentIds };
      }

      const documents = await ChatbotDocument.find(filter)
        .select('content embedding')
        .lean();

      const warmed = {
        total: 0,
        cached: 0,
        reembedded: 0
      };

      for (const doc of documents) {
        const hash = this._hashText(doc.content);

        if (!this.cache.has(hash)) {
          let embedding = doc.embedding || [];

          if (embedding.length === 0) {
            embedding = await advancedEmbeddingService.embedText(doc.content);
          }

          this._setCache(hash, embedding);
          warmed.reembedded++;
        } else {
          warmed.cached++;
        }

        warmed.total++;
      }

      return warmed;
    } catch (err) {
      console.error('Error warming up cache:', err.message);
      throw err;
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    const before = this.cache.size;
    this.cache.clear();
    this.cacheStats.evictions += before;

    return {
      cleared: before,
      remaining: this.cache.size
    };
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.cacheStats.hits + this.cacheStats.misses;
    const hitRate = total > 0 ? (this.cacheStats.hits / total * 100).toFixed(2) : 0;

    return {
      ...this.cacheStats,
      hitRate: `${hitRate}%`,
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      utilization: `${((this.cache.size / this.maxCacheSize) * 100).toFixed(2)}%`
    };
  }

  /**
   * Evict expired entries
   */
  evictExpired() {
    let evicted = 0;

    for (const [hash, entry] of this.cache) {
      if (this._isExpired(entry)) {
        this.cache.delete(hash);
        evicted++;
      }
    }

    this.cacheStats.evictions += evicted;
    return evicted;
  }

  /**
   * Helper: set cache with LRU eviction if needed
   */
  _setCache(hash, embedding) {
    if (this.cache.size >= this.maxCacheSize) {
      // Remove oldest entry (simple FIFO, could be LRU)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      this.cacheStats.evictions++;
    }

    this.cache.set(hash, {
      embedding,
      timestamp: Date.now()
    });
  }

  /**
   * Helper: hash text content
   */
  _hashText(text) {
    const crypto = require('crypto');
    return crypto
      .createHash('sha256')
      .update(text)
      .digest('hex');
  }

  /**
   * Helper: check if cache entry is expired
   */
  _isExpired(entry) {
    return Date.now() - entry.timestamp > this.ttl;
  }
}

module.exports = new EmbeddingCacheService();
