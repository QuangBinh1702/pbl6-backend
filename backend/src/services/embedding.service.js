// Embedding Service - Convert text to vectors
const CONFIG = require('../config/chatbot.config');

class EmbeddingService {
  /**
   * Generate embedding for text
   * Phase 2 uses simple TF-IDF style embedding
   * Phase 2+ can integrate with OpenAI, HuggingFace, etc.
   */
  async embed(text) {
    try {
      if (!text || typeof text !== 'string') {
        throw new Error('Text must be a non-empty string');
      }

      // Simple embedding: TF-IDF-like vector from text
      // For Phase 2: Use simple approach (word frequency)
      // For Phase 3+: Replace with actual embedding model (OpenAI API, HuggingFace, etc.)
      const embedding = this._generateSimpleEmbedding(text);
      
      return embedding;
    } catch (err) {
      console.error('Error generating embedding:', err.message);
      throw err;
    }
  }

  /**
   * Batch embed multiple texts
   */
  async embedBatch(texts) {
    try {
      if (!Array.isArray(texts)) {
        throw new Error('Texts must be an array');
      }

      const embeddings = await Promise.all(
        texts.map(text => this.embed(text))
      );

      return embeddings;
    } catch (err) {
      console.error('Error in batch embedding:', err.message);
      throw err;
    }
  }

  /**
   * Simple embedding generation (TF-based)
   * Creates a vector representation based on word frequency
   * Dimension: configurable via CONFIG.EMBEDDING_DIMENSION
   */
  _generateSimpleEmbedding(text) {
    const dimension = CONFIG.EMBEDDING_DIMENSION || 256;
    
    // Normalize text
    const normalized = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .trim();
    
    // Split into words
    const words = normalized.split(/\s+/).filter(w => w.length > 0);
    
    // Create vocabulary (hash map of words to indices)
    const vocab = this._hashWordsToIndices(words, dimension);
    
    // Create vector: count word frequencies in hash buckets
    const vector = new Array(dimension).fill(0);
    
    words.forEach(word => {
      const index = vocab[word] || this._hashWord(word, dimension);
      vector[index] += 1;
    });
    
    // Normalize vector (L2 normalization)
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= magnitude;
      }
    }
    
    return vector;
  }

  /**
   * Hash word to vocabulary index
   * Simple hash function: sum of char codes mod dimension
   */
  _hashWord(word, dimension) {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = ((hash << 5) - hash) + word.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) % dimension;
  }

  /**
   * Create word-to-index mapping
   */
  _hashWordsToIndices(words, dimension) {
    const vocab = {};
    const uniqueWords = [...new Set(words)];
    
    uniqueWords.forEach(word => {
      vocab[word] = this._hashWord(word, dimension);
    });
    
    return vocab;
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  cosineSimilarity(vec1, vec2) {
    if (!Array.isArray(vec1) || !Array.isArray(vec2)) {
      return 0;
    }

    if (vec1.length !== vec2.length) {
      return 0;
    }

    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      mag1 += vec1[i] * vec1[i];
      mag2 += vec2[i] * vec2[i];
    }

    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);

    if (mag1 === 0 || mag2 === 0) {
      return 0;
    }

    return dotProduct / (mag1 * mag2);
  }
}

module.exports = new EmbeddingService();
