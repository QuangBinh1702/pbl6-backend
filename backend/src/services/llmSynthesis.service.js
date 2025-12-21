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
    // Filter documents: phải có score >= 0.25 HOẶC có keyword score cao
    const relevantDocs = documents.filter(doc => {
      const score = doc.relevanceScore || 0;
      const keywordScore = doc.keywordScore || 0;
      return score >= 0.25 || keywordScore >= 0.2;
    });

    // Nếu không có document nào đủ liên quan, kiểm tra document tốt nhất
    let docsToUse;
    if (relevantDocs.length === 0) {
      const bestDoc = documents[0];
      const bestScore = bestDoc?.relevanceScore || 0;
      const bestKeywordScore = bestDoc?.keywordScore || 0;
      
      // Chỉ dùng nếu có score hợp lý
      if (bestScore >= 0.3 || bestKeywordScore >= 0.15) {
        docsToUse = [bestDoc];
      } else {
        // Không có document nào đủ liên quan
        return 'Xin lỗi, tôi không tìm thấy thông tin liên quan đến câu hỏi của bạn trong cơ sở dữ liệu.';
      }
    } else {
      docsToUse = relevantDocs.slice(0, 2); // Chỉ lấy top 2
    }

    const documentContext = docsToUse
      .map((doc, i) => `[Document ${i + 1}] ${doc.title}: ${doc.content}`)
      .join('\n\n');

    const systemPrompt = `You are a helpful assistant that answers questions based ONLY on the provided documents. 
Generate a clear, concise answer in the same language as the query.
If the documents don't contain enough information to answer the question, say "Tôi không tìm thấy thông tin liên quan đến câu hỏi này trong tài liệu."
Only use information from the provided documents. Do not make up information.
Always cite which document(s) you're referencing.`;

    const userPrompt = `Question: ${query}\n\nDocuments:\n${documentContext}\n\nAnswer (chỉ dựa trên documents được cung cấp):`;

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
    // Filter documents: phải có score >= 0.25 HOẶC có keyword score cao
    const relevantDocs = documents.filter(doc => {
      const score = doc.relevanceScore || 0;
      const keywordScore = doc.keywordScore || 0;
      return score >= 0.25 || keywordScore >= 0.2;
    });

    // Nếu không có document nào đủ liên quan, kiểm tra document tốt nhất
    let docsToUse;
    if (relevantDocs.length === 0) {
      const bestDoc = documents[0];
      const bestScore = bestDoc?.relevanceScore || 0;
      const bestKeywordScore = bestDoc?.keywordScore || 0;
      
      // Chỉ dùng nếu có score hợp lý
      if (bestScore >= 0.3 || bestKeywordScore >= 0.15) {
        docsToUse = [bestDoc];
      } else {
        // Không có document nào đủ liên quan
        return 'Xin lỗi, tôi không tìm thấy thông tin liên quan đến câu hỏi của bạn trong cơ sở dữ liệu.';
      }
    } else {
      docsToUse = relevantDocs.slice(0, 2); // Chỉ lấy top 2
    }

    const documentContext = docsToUse
      .map((doc, i) => `<document index="${i + 1}"><title>${doc.title}</title><content>${doc.content}</content></document>`)
      .join('\n\n');

    const systemPrompt = `You are a helpful assistant. Answer the question ONLY based on the provided documents.
Generate a clear, concise answer in the same language as the query.
If documents don't contain enough information to answer the question, say "Tôi không tìm thấy thông tin liên quan đến câu hỏi này trong tài liệu."
Only use information from the provided documents. Do not make up information.
Always cite which document(s) you're referencing.`;

    const userPrompt = `Question: ${query}\n\nDocuments:\n${documentContext}\n\nAnswer (chỉ dựa trên documents được cung cấp):`;

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
   * Chỉ lấy documents có relevance score cao và chứa keywords từ câu hỏi
   */
  _concatenateDocuments(documents) {
    if (!documents || documents.length === 0) {
      return 'Xin lỗi, tôi không tìm thấy thông tin liên quan đến câu hỏi của bạn trong cơ sở dữ liệu.';
    }

    // Filter documents: phải có score >= 0.25 HOẶC có keyword score cao
    const relevantDocs = documents.filter(doc => {
      const score = doc.relevanceScore || 0;
      const keywordScore = doc.keywordScore || 0;
      
      // Chỉ lấy documents có:
      // - Relevance score >= 0.25, HOẶC
      // - Keyword score >= 0.2 (có nhiều keywords khớp)
      return score >= 0.25 || keywordScore >= 0.2;
    });

    if (relevantDocs.length === 0) {
      // Kiểm tra document tốt nhất có đủ liên quan không
      const bestDoc = documents[0];
      const bestScore = bestDoc?.relevanceScore || 0;
      const bestKeywordScore = bestDoc?.keywordScore || 0;
      
      // Chỉ trả về nếu có score hợp lý
      if (bestScore >= 0.3 || bestKeywordScore >= 0.15) {
        return `**${bestDoc.title}**\n${bestDoc.content}`;
      }
      
      return 'Xin lỗi, tôi không tìm thấy thông tin liên quan đến câu hỏi của bạn trong cơ sở dữ liệu.';
    }

    // Chỉ lấy top 2 documents có relevance cao nhất (giảm từ 3 xuống 2)
    const topDocs = relevantDocs
      .slice(0, 2)
      .map(doc => `**${doc.title}**\n${doc.content}`)
      .join('\n\n---\n\n');

    const maxLen = CONFIG.MAX_RESPONSE_LENGTH || 2000;
    if (topDocs.length > maxLen) {
      return topDocs.substring(0, maxLen) + '...';
    }

    return topDocs;
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
