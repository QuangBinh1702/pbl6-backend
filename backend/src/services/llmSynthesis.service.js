// LLM Synthesis Service - Answer generation with LLM
const axios = require('axios');
const CONFIG = require('../config/chatbot.config');

class LLMSynthesisService {
  constructor() {
    this.openaiKey = process.env.OPENAI_API_KEY;
    this.claudeKey = process.env.CLAUDE_API_KEY;
    this.useLLM = CONFIG.USE_LLM_FOR_RAG === 'true';
    this.llmModel = CONFIG.LLM_MODEL || 'gpt-3.5-turbo';
  }

  /**
   * Synthesize answer from retrieved documents using LLM
   */
  async synthesizeAnswer(query, documents) {
    try {
      if (!this.useLLM) {
        // Fallback: concatenate documents
        return this._concatenateDocuments(documents);
      }

      if (!documents || documents.length === 0) {
        return '';
      }

      // Determine which LLM to use
      if (this.llmModel.includes('gpt') && this.openaiKey) {
        return await this._synthesizeWithOpenAI(query, documents);
      } else if (this.llmModel.includes('claude') && this.claudeKey) {
        return await this._synthesizeWithClaude(query, documents);
      }

      // Fallback if no API key configured
      console.warn('LLM API key not configured, using concatenation');
      return this._concatenateDocuments(documents);
    } catch (err) {
      console.error('LLM synthesis error:', err.message);
      // Fallback on error
      return this._concatenateDocuments(documents);
    }
  }

  /**
   * Synthesize with OpenAI GPT
   */
  async _synthesizeWithOpenAI(query, documents) {
    const documentContext = documents
      .map((doc, i) => `[Document ${i + 1}] ${doc.title}: ${doc.content}`)
      .join('\n\n');

    const systemPrompt = `You are a helpful assistant that answers questions based ONLY on the provided documents. 
Generate a clear, concise answer in the same language as the query.
If the documents don't contain enough information, say so.
Always cite which document(s) you're referencing.`;

    const userPrompt = `Question: ${query}\n\nDocuments:\n${documentContext}\n\nAnswer:`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: this.llmModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: parseFloat(CONFIG.LLM_TEMPERATURE || '0.3'),
        max_tokens: parseInt(CONFIG.LLM_MAX_TOKENS || '500'),
        top_p: 0.9
      },
      {
        headers: {
          Authorization: `Bearer ${this.openaiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data?.choices?.[0]?.message?.content) {
      return response.data.choices[0].message.content;
    }

    throw new Error('Invalid OpenAI response');
  }

  /**
   * Synthesize with Claude
   */
  async _synthesizeWithClaude(query, documents) {
    const documentContext = documents
      .map((doc, i) => `<document index="${i + 1}"><title>${doc.title}</title><content>${doc.content}</content></document>`)
      .join('\n\n');

    const systemPrompt = `You are a helpful assistant. Answer the question ONLY based on the provided documents.
Generate a clear, concise answer in the same language as the query.
If documents don't contain enough information, say so.
Always cite which document(s) you're referencing.`;

    const userPrompt = `Question: ${query}\n\nDocuments:\n${documentContext}\n\nAnswer:`;

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: this.llmModel,
        max_tokens: parseInt(CONFIG.LLM_MAX_TOKENS || '500'),
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      },
      {
        headers: {
          'x-api-key': this.claudeKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data?.content?.[0]?.text) {
      return response.data.content[0].text;
    }

    throw new Error('Invalid Claude response');
  }

  /**
   * Concatenate documents (fallback when LLM is not available)
   */
  _concatenateDocuments(documents) {
    if (!documents || documents.length === 0) {
      return '';
    }

    const contents = documents
      .slice(0, CONFIG.MAX_RETRIEVED_DOCS || 10)
      .map(doc => `**${doc.title}**\n${doc.content}`)
      .join('\n\n---\n\n');

    const maxLen = CONFIG.MAX_RESPONSE_LENGTH || 2000;
    if (contents.length > maxLen) {
      return contents.substring(0, maxLen) + '...';
    }

    return contents;
  }

  /**
   * Check if LLM is properly configured
   */
  isConfigured() {
    return this.useLLM && (
      (this.llmModel.includes('gpt') && this.openaiKey) ||
      (this.llmModel.includes('claude') && this.claudeKey)
    );
  }
}

module.exports = new LLMSynthesisService();
