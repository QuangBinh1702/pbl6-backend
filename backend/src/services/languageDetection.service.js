// Language Detection and Translation Service
const axios = require('axios');

class LanguageDetectionService {
  constructor() {
    this.googleKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    // Common language codes map
    this.langMap = {
      'vi': 'Vietnamese',
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'ko': 'Korean'
    };
  }

  /**
   * Detect language from text
   */
  async detectLanguage(text) {
    try {
      if (!text || text.trim().length === 0) {
        return { language: 'unknown', confidence: 0 };
      }

      // Use Google Cloud Translation API if available
      if (this.googleKey) {
        try {
          return await this._detectWithGoogle(text);
        } catch (err) {
          console.warn('Google detection failed, using fallback:', err.message);
        }
      }

      // Fallback: simple heuristic detection
      return this._detectByHeuristic(text);
    } catch (err) {
      console.error('Language detection error:', err.message);
      return { language: 'unknown', confidence: 0 };
    }
  }

  /**
   * Translate text to target language
   */
  async translate(text, targetLanguage = 'en') {
    try {
      if (!text || text.trim().length === 0) {
        return { originalText: text, translatedText: '', targetLanguage };
      }

      // Use Google Cloud Translation API if available
      if (this.googleKey) {
        try {
          return await this._translateWithGoogle(text, targetLanguage);
        } catch (err) {
          console.warn('Google translation failed:', err.message);
        }
      }

      // Return original text if translation not available
      return { originalText: text, translatedText: text, targetLanguage };
    } catch (err) {
      console.error('Translation error:', err.message);
      return { originalText: text, translatedText: text, targetLanguage };
    }
  }

  /**
   * Detect with Google Cloud Translation API
   */
  async _detectWithGoogle(text) {
    const response = await axios.post(
      'https://translation.googleapis.com/language/translate/v2/detect',
      { q: text },
      {
        params: { key: this.googleKey }
      }
    );

    if (response.data?.detections?.[0]?.[0]) {
      const detection = response.data.detections[0][0];
      return {
        language: detection.language,
        confidence: detection.confidence || 0
      };
    }

    return { language: 'unknown', confidence: 0 };
  }

  /**
   * Translate with Google Cloud Translation API
   */
  async _translateWithGoogle(text, targetLanguage) {
    const response = await axios.post(
      'https://translation.googleapis.com/language/translate/v2',
      {
        q: text,
        target: targetLanguage
      },
      {
        params: { key: this.googleKey }
      }
    );

    if (response.data?.data?.translations?.[0]?.translatedText) {
      return {
        originalText: text,
        translatedText: response.data.data.translations[0].translatedText,
        targetLanguage,
        sourceLanguage: response.data.data.translations[0].detectedSourceLanguage
      };
    }

    return { originalText: text, translatedText: text, targetLanguage };
  }

  /**
   * Simple heuristic language detection (Vietnamese markers)
   */
  _detectByHeuristic(text) {
    // Vietnamese markers
    if (/(ă|â|ê|ô|ơ|ư|đ|à|á|ả|ã|ạ|ằ|ắ|ẳ|ẵ|ặ)/.test(text)) {
      return { language: 'vi', confidence: 0.9 };
    }

    // English - common English words
    if (/(hello|thank|please|yes|no|question|answer|help|what|how|why)/i.test(text)) {
      return { language: 'en', confidence: 0.7 };
    }

    // Default to English
    return { language: 'en', confidence: 0.5 };
  }

  /**
   * Normalize text for query regardless of language
   */
  normalizeText(text, language = null) {
    if (!text) return '';

    let normalized = text.toLowerCase().trim();

    // Language-specific normalization
    switch (language) {
      case 'vi':
        // Vietnamese: preserve diacritics, remove extra spaces
        normalized = normalized.replace(/\s+/g, ' ');
        break;
      case 'en':
      default:
        // English: standard normalization
        normalized = normalized.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ');
        break;
    }

    return normalized;
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages() {
    return this.langMap;
  }
}

module.exports = new LanguageDetectionService();
