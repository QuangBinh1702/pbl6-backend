// Advanced Embedding Service - Real embedding models support
const axios = require('axios');
const CONFIG = require('../config/chatbot.config');
const embeddingService = require('./embedding.service');

class AdvancedEmbeddingService {
  constructor() {
    this.useHuggingFace = CONFIG.USE_HUGGINGFACE_EMBEDDINGS === 'true';
    this.hfToken = process.env.HUGGINGFACE_API_KEY;
    this.hfModel = process.env.HUGGINGFACE_MODEL || 'sentence-transformers/all-MiniLM-L6-v2';
  }

  /**
   * Get embedding - delegates to real model or fallback to simple
   */
  async embed(text) {
    try {
      if (!text || typeof text !== 'string') {
        throw new Error('Text must be a non-empty string');
      }

      // Try HuggingFace if configured
      if (this.useHuggingFace && this.hfToken) {
        try {
          return await this._embedWithHuggingFace(text);
        } catch (err) {
          console.warn('HuggingFace embedding failed, falling back to simple:', err.message);
        }
      }

      // Fallback to simple embedding
      return embeddingService.embed(text);
    } catch (err) {
      console.error('Error in advanced embedding:', err.message);
      // Always fall back to simple embedding on error
      return embeddingService.embed(text);
    }
  }

  /**
   * Batch embed with real models
   */
  async embedBatch(texts) {
    try {
      if (!Array.isArray(texts)) {
        throw new Error('Texts must be an array');
      }

      // Use HuggingFace if available and enabled
      if (this.useHuggingFace && this.hfToken) {
        try {
          return await this._embedBatchWithHuggingFace(texts);
        } catch (err) {
          console.warn('Batch HuggingFace embedding failed, using fallback:', err.message);
        }
      }

      // Fallback to simple batch embedding
      return embeddingService.embedBatch(texts);
    } catch (err) {
      console.error('Error in batch advanced embedding:', err.message);
      return embeddingService.embedBatch(texts);
    }
  }

  /**
   * Embed with HuggingFace Inference API
   */
  async _embedWithHuggingFace(text) {
    const response = await axios.post(
      `https://api-inference.huggingface.co/pipeline/feature-extraction/${this.hfModel}`,
      { inputs: text },
      {
        headers: {
          Authorization: `Bearer ${this.hfToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (Array.isArray(response.data)) {
      // Normalize vector
      const vec = response.data;
      const mag = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
      return mag > 0 ? vec.map(v => v / mag) : vec;
    }

    throw new Error('Invalid HuggingFace response format');
  }

  /**
   * Batch embed with HuggingFace
   */
  async _embedBatchWithHuggingFace(texts) {
    const response = await axios.post(
      `https://api-inference.huggingface.co/pipeline/feature-extraction/${this.hfModel}`,
      { inputs: texts },
      {
        headers: {
          Authorization: `Bearer ${this.hfToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (Array.isArray(response.data)) {
      return response.data.map(vec => {
        const mag = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
        return mag > 0 ? vec.map(v => v / mag) : vec;
      });
    }

    throw new Error('Invalid HuggingFace batch response format');
  }

  /**
   * Calculate cosine similarity (delegate to existing)
   */
  cosineSimilarity(vec1, vec2) {
    return embeddingService.cosineSimilarity(vec1, vec2);
  }
}

module.exports = new AdvancedEmbeddingService();
