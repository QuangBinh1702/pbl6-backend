// RAG (Retrieval-Augmented Generation) Service
// Handles knowledge base retrieval and document ranking
const ChatbotDocument = require('../models/chatbot_document.model');
const embeddingService = require('./embedding.service');
const advancedEmbeddingService = require('./advancedEmbedding.service');
const llmSynthesisService = require('./llmSynthesis.service');
const CONFIG = require('../config/chatbot.config');

class RAGService {
  /**
   * Main RAG retrieval method
   * Takes user query, finds relevant documents from knowledge base
   */
  async retrieve(query, userContext) {
    try {
      if (!query || query.trim().length === 0) {
        return {
          answer: '',
          confidence: 0,
          retrievedDocIds: [],
          documents: []
        };
      }

      // 1. Get query embedding (use advanced embedding if available)
      const queryEmbedding = CONFIG.USE_HUGGINGFACE_EMBEDDINGS === 'true'
        ? await advancedEmbeddingService.embed(query)
        : await embeddingService.embed(query);

      // 2. Get applicable documents (active + RBAC filtered)
      let applicableDocuments = await this._getApplicableDocuments(userContext);

      if (applicableDocuments.length === 0) {
        return {
          answer: '',
          confidence: 0,
          retrievedDocIds: [],
          documents: []
        };
      }

      // 2.5. Pre-filter: Nếu câu hỏi về quy định, loại bỏ documents về activities/guides ngay từ đầu
      const queryLower = query.toLowerCase();
      const isRegulationQuery = this._isRegulationQuery(queryLower);
      
      if (isRegulationQuery) {
        console.log(`📋 Câu hỏi về quy định: "${query}"`);
        console.log(`   Đang lọc ${applicableDocuments.length} documents...`);
        const beforeCount = applicableDocuments.length;
        
        applicableDocuments = applicableDocuments.filter(doc => {
          const docTags = Array.isArray(doc.tags) ? doc.tags : [];
          const docText = ((doc.title || '') + ' ' + (doc.content || '')).toLowerCase();
          
          // Loại bỏ activity documents
          const isActivity = doc.category === 'activity' || 
                            docTags.includes('activity') || 
                            docTags.includes('event');
          
          // Loại bỏ guide documents về "hoạt động sắp tới", "đăng ký hoạt động"
          const isGuideAboutActivities = doc.category === 'guide' && 
                                         (docTags.includes('hoạt động') || docTags.includes('đăng ký'));
          
          // Kiểm tra content có chứa keywords về activities không
          const hasActivityContent = docText.includes('hoạt động sắp tới') ||
                                    docText.includes('đăng ký hoạt động') ||
                                    docText.includes('truy cập mục') ||
                                    docText.includes('lọc theo danh mục') ||
                                    docText.includes('đăng nhập vào hệ thống') ||
                                    (docText.includes('truy cập') && docText.includes('hoạt động'));
          
          // Nếu là guide document và có content về activities → loại bỏ
          const isGuideWithActivityContent = doc.category === 'guide' && hasActivityContent;
          
          // Kiểm tra xem có phải là document về "hướng dẫn đăng ký hoạt động" không
          const isRegistrationGuide = doc.title && (
            doc.title.toLowerCase().includes('đăng ký hoạt động') ||
            doc.title.toLowerCase().includes('hướng dẫn đăng ký')
          );
          
          if (isActivity || isGuideAboutActivities || isGuideWithActivityContent || isRegistrationGuide) {
            console.log(`   🚫 Loại bỏ: "${doc.title}"`);
            console.log(`      - Category: ${doc.category}`);
            console.log(`      - Tags: ${docTags.join(', ')}`);
            console.log(`      - Reason: ${isActivity ? 'activity' : isGuideAboutActivities ? 'guide with activity tags' : isGuideWithActivityContent ? 'guide with activity content' : 'registration guide'}`);
            return false;
          }
          return true;
        });
        
        const removedCount = beforeCount - applicableDocuments.length;
        console.log(`   ✅ Đã loại bỏ ${removedCount} activity/guide documents`);
        console.log(`   ✅ Còn lại ${applicableDocuments.length} documents`);
        
        if (applicableDocuments.length === 0) {
          console.log(`❌ Không còn documents nào sau khi lọc activity/guide documents`);
          return {
            answer: '',
            confidence: 0,
            retrievedDocIds: [],
            documents: []
          };
        }
      }

      // 3. Score documents by relevance (embedding + keyword matching + category boost)
      // queryLower và isRegulationQuery đã được định nghĩa ở trên
      const queryKeywords = this._extractKeywords(queryLower);
      
      // Detect query type: regulation/documentation vs activities
      const isActivityQuery = this._isActivityQuery(queryLower);
      
      const scoredDocuments = applicableDocuments.map(doc => {
        // Calculate similarity to query
        const similarity = doc.embedding && doc.embedding.length > 0
          ? embeddingService.cosineSimilarity(queryEmbedding, doc.embedding)
          : 0;

        // Keyword matching bonus
        const docText = ((doc.title || '') + ' ' + (doc.content || '')).toLowerCase();
        const keywordMatches = this._countKeywordMatches(queryKeywords, docText);
        const keywordBonus = Math.min(keywordMatches / queryKeywords.length, 0.3); // Max 30% bonus
        
        // Category boost: Ưu tiên documents từ PDF (regulation) khi câu hỏi về quy định
        let categoryBoost = 1.0;
        if (isRegulationQuery) {
          // Nếu câu hỏi về quy định, boost documents có category "regulation"
          if (doc.category === 'regulation' || doc.tags?.includes('PDF') || doc.tags?.includes('imported')) {
            categoryBoost = 1.5; // Boost 50% cho regulation documents
          } else if (doc.category === 'activity' || doc.tags?.includes('activity')) {
            categoryBoost = 0.5; // Giảm score cho activity documents
          }
        } else if (isActivityQuery) {
          // Nếu câu hỏi về activities, boost activity documents
          if (doc.category === 'activity' || doc.tags?.includes('activity')) {
            categoryBoost = 1.3;
          }
        }
        
        // Boost score by priority
        const priorityBoost = 1 + ((doc.priority - 5) * 0.05);
        
        // Combine: embedding similarity + keyword bonus + category boost
        const finalScore = Math.min((similarity * 0.7 + keywordBonus * 0.3) * priorityBoost * categoryBoost, 1);

        return {
          ...doc.toObject ? doc.toObject() : doc,
          relevanceScore: finalScore,
          embeddingScore: similarity,
          keywordScore: keywordBonus,
          categoryBoost: categoryBoost
        };
      });

      // 4. Sort by relevance and take top K
      const sortedDocuments = scoredDocuments
        .sort((a, b) => b.relevanceScore - a.relevanceScore);
      
      // 5. Additional filtering: Check if top document actually contains relevant keywords
      // Nếu document tốt nhất không có keywords từ câu hỏi, có thể không liên quan
      const bestMatch = sortedDocuments[0];
      
      if (!bestMatch) {
        return {
          answer: '',
          confidence: 0,
          retrievedDocIds: [],
          documents: []
        };
      }
      
      // Kiểm tra xem document có chứa keywords quan trọng không
      const bestMatchText = ((bestMatch.title || '') + ' ' + (bestMatch.content || '')).toLowerCase();
      const hasImportantKeywords = this._hasImportantKeywords(queryLower, bestMatchText, queryKeywords);
      
      // Kiểm tra xem document có chứa nội dung không liên quan (như QR Code khi hỏi về điểm HDCD)
      const isIrrelevant = this._isIrrelevantContent(
        queryLower, 
        bestMatchText, 
        bestMatch.category, 
        bestMatch.tags || []
      );
      
      // Nếu document không liên quan hoặc không có keywords quan trọng và score thấp
      if (isIrrelevant || (!hasImportantKeywords && bestMatch.relevanceScore < 0.5)) {
        console.log(`⚠️  Top document không liên quan. Score: ${bestMatch.relevanceScore.toFixed(2)}, Irrelevant: ${isIrrelevant}, Category: ${bestMatch.category}`);
        // Bỏ qua document này, tìm document tiếp theo
        const nextBestMatch = sortedDocuments.find(doc => {
          const docText = ((doc.title || '') + ' ' + (doc.content || '')).toLowerCase();
          const isDocIrrelevant = this._isIrrelevantContent(
            queryLower, 
            docText, 
            doc.category, 
            doc.tags || []
          );
          return !isDocIrrelevant && 
                 this._hasImportantKeywords(queryLower, docText, queryKeywords);
        });
        
        if (!nextBestMatch) {
          // Không tìm thấy document nào liên quan
          console.log(`❌ Không tìm thấy document nào liên quan đến câu hỏi: "${query}"`);
          return {
            answer: '',
            confidence: 0,
            retrievedDocIds: [],
            documents: []
          };
        }
      }
      
      // Filter: Chỉ lấy documents có relevance score >= threshold HOẶC có keywords quan trọng
      // VÀ không phải là nội dung không liên quan
      // Nếu câu hỏi về quy định, ưu tiên documents từ PDF
      let topDocuments = sortedDocuments
        .filter(doc => {
          const docText = ((doc.title || '') + ' ' + (doc.content || '')).toLowerCase();
          const hasKeywords = this._hasImportantKeywords(queryLower, docText, queryKeywords);
          const isIrrelevant = this._isIrrelevantContent(
            queryLower, 
            docText, 
            doc.category, 
            doc.tags || []
          );
          
          // QUAN TRỌNG: Nếu câu hỏi về quy định và document là activity/guide về activities → LOẠI BỎ
          if (isRegulationQuery) {
            const docTags = Array.isArray(doc.tags) ? doc.tags : [];
            const isActivity = doc.category === 'activity' || docTags.includes('activity');
            const isGuideAboutActivities = doc.category === 'guide' && 
                                           (docTags.includes('hoạt động') || docTags.includes('đăng ký'));
            const hasActivityContent = docText.includes('hoạt động sắp tới') ||
                                      docText.includes('đăng ký hoạt động') ||
                                      docText.includes('truy cập mục') ||
                                      docText.includes('đăng nhập vào hệ thống');
            const isGuideWithActivityContent = doc.category === 'guide' && hasActivityContent;
            const isRegistrationGuide = doc.title && (
              doc.title.toLowerCase().includes('đăng ký hoạt động') ||
              doc.title.toLowerCase().includes('hướng dẫn đăng ký')
            );
            
            if (isActivity || isGuideAboutActivities || isGuideWithActivityContent || isRegistrationGuide) {
              console.log(`🚫 Filter: Loại bỏ activity/guide document: "${doc.title}" (category: ${doc.category})`);
              return false;
            }
          }
          
          // Phải có keywords quan trọng VÀ không phải nội dung không liên quan
          return !isIrrelevant && (doc.relevanceScore >= CONFIG.RAG_MIN_CONFIDENCE || hasKeywords);
        });
      
      // Nếu câu hỏi về quy định, ưu tiên documents từ PDF (regulation category)
      if (isRegulationQuery) {
        // Sắp xếp lại: documents từ PDF lên đầu
        topDocuments = topDocuments.sort((a, b) => {
          const aIsRegulation = a.category === 'regulation' || a.tags?.includes('PDF') || a.tags?.includes('imported');
          const bIsRegulation = b.category === 'regulation' || b.tags?.includes('PDF') || b.tags?.includes('imported');
          
          if (aIsRegulation && !bIsRegulation) return -1;
          if (!aIsRegulation && bIsRegulation) return 1;
          return b.relevanceScore - a.relevanceScore;
        });
      }
      
      topDocuments = topDocuments.slice(0, CONFIG.RAG_TOP_K);
      
      if (topDocuments.length === 0) {
        return {
          answer: '',
          confidence: 0,
          retrievedDocIds: [],
          documents: []
        };
      }
      
      // Update bestMatch to the filtered top document
      const finalBestMatch = topDocuments[0];
      
      if (finalBestMatch.relevanceScore < CONFIG.RAG_MIN_CONFIDENCE) {
        // Nếu score quá thấp, không trả về
        return {
          answer: '',
          confidence: 0,
          retrievedDocIds: topDocuments.map(d => d._id),
          documents: topDocuments
        };
      }

      // 6. Final check: Đảm bảo top document không phải là guide document về activities
      if (isRegulationQuery) {
        const finalDocText = ((finalBestMatch.title || '') + ' ' + (finalBestMatch.content || '')).toLowerCase();
        const finalDocTags = Array.isArray(finalBestMatch.tags) ? finalBestMatch.tags : [];
        
        const isFinalDocIrrelevant = this._isIrrelevantContent(
          queryLower,
          finalDocText,
          finalBestMatch.category,
          finalDocTags
        );
        
        if (isFinalDocIrrelevant) {
          console.log(`❌ Final check: Top document vẫn không liên quan: "${finalBestMatch.title}"`);
          // Tìm document tiếp theo không phải irrelevant
          const nextRelevantDoc = topDocuments.find(doc => {
            const docText = ((doc.title || '') + ' ' + (doc.content || '')).toLowerCase();
            const docTags = Array.isArray(doc.tags) ? doc.tags : [];
            return !this._isIrrelevantContent(queryLower, docText, doc.category, docTags);
          });
          
          if (!nextRelevantDoc) {
            console.log(`❌ Không tìm thấy document nào liên quan sau final check`);
            return {
              answer: '',
              confidence: 0,
              retrievedDocIds: topDocuments.map(d => d._id),
              documents: topDocuments
            };
          }
          
          // Sử dụng document tiếp theo
          const answer = await llmSynthesisService.synthesizeAnswer(query, [nextRelevantDoc]);
          return {
            answer,
            confidence: nextRelevantDoc.relevanceScore,
            retrievedDocIds: [nextRelevantDoc._id],
            documents: [nextRelevantDoc],
            bestMatchId: nextRelevantDoc._id,
            usedLLM: llmSynthesisService.isConfigured()
          };
        }
      }

      // 6. Synthesize answer from top documents (LLM or concatenation)
      const answer = await llmSynthesisService.synthesizeAnswer(query, topDocuments);
      const confidence = finalBestMatch.relevanceScore;
      const usedLLM = llmSynthesisService.isConfigured();

      // 7. Update document analytics
      topDocuments.forEach(doc => {
        ChatbotDocument.findByIdAndUpdate(
          doc._id,
          {
            $inc: { retrievalCount: 1 },
            lastRetrievedAt: new Date(),
            $set: { avgConfidenceScore: (doc.avgConfidenceScore || 0 + bestMatch.relevanceScore) / 2 }
          },
          { new: false }
        ).catch(err => console.error('Error updating doc analytics:', err.message));
      });

      return {
        answer,
        confidence,
        retrievedDocIds: topDocuments.map(d => d._id),
        documents: topDocuments,
        bestMatchId: finalBestMatch._id,
        usedLLM
      };
    } catch (err) {
      console.error('RAG retrieval error:', err.message);
      throw err;
    }
  }

  /**
   * Extract keywords from query (remove common words)
   */
  _extractKeywords(query) {
    const commonWords = new Set([
      'là', 'gì', 'của', 'và', 'hoặc', 'cho', 'với', 'từ', 'đến', 'trong', 'trên', 'dưới',
      'có', 'không', 'được', 'bị', 'sẽ', 'đã', 'đang', 'cần', 'phải', 'nên', 'bao', 'nhiêu',
      'thế', 'nào', 'ai', 'đâu', 'khi', 'nếu', 'thì', 'mà', 'để', 'về', 'theo', 'như',
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had',
      'do', 'does', 'did', 'will', 'would', 'should', 'could', 'can', 'may', 'might'
    ]);
    
    const words = query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !commonWords.has(w));
    
    return [...new Set(words)]; // Remove duplicates
  }

  /**
   * Count how many keywords from query appear in document text
   */
  _countKeywordMatches(keywords, docText) {
    if (!keywords || keywords.length === 0) return 0;
    
    let matches = 0;
    keywords.forEach(keyword => {
      if (docText.includes(keyword)) {
        matches++;
      }
    });
    
    return matches;
  }

  /**
   * Kiểm tra xem câu hỏi có phải về quy định/PDF không
   */
  _isRegulationQuery(query) {
    const regulationKeywords = [
      'mục đích', 'nguyên tắc', 'quy định', 'quyết định', 'ban hành',
      'phạm vi', 'đối tượng', 'áp dụng', 'điều chỉnh', 'điều', 'khoản',
      'sinh viên hệ', 'điểm hdcd', 'tích lũy điểm', 'đánh giá', 'ghi nhận',
      'trách nhiệm', 'quyền lợi', 'vi phạm', 'xử lý', 'khiếu nại',
      'phòng ctsv', 'công tác sinh viên', 'đơn vị chủ trì'
    ];
    
    return regulationKeywords.some(keyword => query.includes(keyword));
  }

  /**
   * Kiểm tra xem câu hỏi có phải về activities (sự kiện) không
   */
  _isActivityQuery(query) {
    const activityKeywords = [
      'hoạt động sắp tới', 'đăng ký hoạt động', 'tham gia hoạt động',
      'danh sách hoạt động', 'lịch hoạt động', 'hoạt động nào',
      'hoạt động ở đâu', 'hoạt động khi nào'
    ];
    
    return activityKeywords.some(keyword => query.includes(keyword));
  }

  /**
   * Kiểm tra xem document có chứa nội dung không liên quan không
   * Ví dụ: Câu hỏi về "điểm HDCD" nhưng document về "điểm danh QR Code"
   * Hoặc: Câu hỏi về "mục đích" nhưng document về "hoạt động sắp tới"
   */
  _isIrrelevantContent(query, docText, docCategory = null, docTags = []) {
    // Nếu câu hỏi về điểm HDCD/tích lũy điểm nhưng document về QR Code/điểm danh
    if ((query.includes('điểm hdcd') || query.includes('tích lũy điểm') || query.includes('điểm tối thiểu')) &&
        (docText.includes('qr code') || docText.includes('điểm danh') || docText.includes('quét mã'))) {
      // Kiểm tra xem document có chứa "hdcd" hoặc "tích lũy" không
      if (!docText.includes('hdcd') && !docText.includes('tích lũy')) {
        return true; // Không liên quan
      }
    }
    
    // QUAN TRỌNG: Nếu câu hỏi về mục đích/quy định/nguyên tắc
    if (query.includes('mục đích') || query.includes('quy định') || query.includes('nguyên tắc') || 
        query.includes('ban hành') || query.includes('quyết định') || query.includes('phạm vi')) {
      
      // Nếu document có category "activity" hoặc tags "activity" → KHÔNG LIÊN QUAN
      if (docCategory === 'activity' || docTags.includes('activity')) {
        return true; // Loại bỏ hoàn toàn
      }
      
      // Nếu document có category "guide" và tags về "hoạt động", "đăng ký" → KHÔNG LIÊN QUAN
      if (docCategory === 'guide' && (docTags.includes('hoạt động') || docTags.includes('đăng ký'))) {
        return true; // Loại bỏ hoàn toàn
      }
      
      // Nếu document có title về "đăng ký hoạt động" hoặc "hướng dẫn đăng ký" → KHÔNG LIÊN QUAN
      // (Kiểm tra này cần được thêm vào hàm, nhưng vì không có title parameter, ta kiểm tra trong docText)
      if (docText.includes('hướng dẫn đăng ký hoạt động') || 
          docText.includes('đăng ký hoạt động - chi tiết')) {
        return true;
      }
      
      // Nếu document về "hoạt động sắp tới", "đăng ký hoạt động", "tham gia hoạt động"
      // nhưng KHÔNG có từ khóa về quy định/mục đích → KHÔNG LIÊN QUAN
      const hasActivityKeywords = docText.includes('hoạt động sắp tới') || 
                                   docText.includes('đăng ký hoạt động') ||
                                   docText.includes('tham gia hoạt động') ||
                                   docText.includes('danh sách hoạt động') ||
                                   docText.includes('lịch hoạt động') ||
                                   docText.includes('truy cập mục') ||
                                   docText.includes('lọc theo danh mục') ||
                                   docText.includes('đăng nhập vào hệ thống') ||
                                   (docText.includes('truy cập') && docText.includes('hoạt động')) ||
                                   (docText.includes('đăng nhập') && docText.includes('hoạt động'));
      
      const hasRegulationKeywords = docText.includes('mục đích') || 
                                    docText.includes('quy định') || 
                                    docText.includes('nguyên tắc') ||
                                    docText.includes('ban hành') ||
                                    docText.includes('quyết định') ||
                                    docText.includes('phạm vi') ||
                                    docText.includes('điều chỉnh') ||
                                    docText.includes('kết nối và phục vụ cộng đồng') ||
                                    docText.includes('phục vụ cộng đồng');
      
      // Nếu có keywords về activities nhưng KHÔNG có keywords về quy định → KHÔNG LIÊN QUAN
      if (hasActivityKeywords && !hasRegulationKeywords) {
        return true; // Không liên quan - đây là document về activities, không phải về mục đích/quy định
      }
      
      // Nếu là guide document và có content về activities → KHÔNG LIÊN QUAN
      if (docCategory === 'guide' && hasActivityKeywords && !hasRegulationKeywords) {
        return true;
      }
    }
    
    // Nếu câu hỏi về hệ đào tạo/năm nhưng document không có thông tin này
    if ((query.includes('hệ đào tạo') || (query.includes('hệ') && query.includes('năm'))) &&
        !docText.includes('hệ đào tạo') && !docText.includes('năm')) {
      return true;
    }
    
    return false;
  }

  /**
   * Check if document contains important keywords from query
   * Phân biệt các từ khóa quan trọng để tránh match sai
   */
  _hasImportantKeywords(query, docText, keywords) {
    if (!keywords || keywords.length === 0) return false;
    
    // Extract important keywords (longer words, numbers, specific terms)
    // Loại bỏ các từ chung chung như "điểm" (có thể là "điểm danh" hoặc "điểm HDCD")
    const importantKeywords = keywords.filter(kw => 
      kw.length >= 4 || /^\d+$/.test(kw) || 
      ['hệ', 'năm', 'sinh viên', 'hdcd', 'tích lũy', 'tối thiểu', 'đào tạo'].includes(kw)
    );
    
    // Kiểm tra các cụm từ quan trọng trong câu hỏi
    const importantPhrases = [
      'điểm hdcd',
      'tích lũy điểm',
      'hệ đào tạo',
      'sinh viên hệ',
      'tối thiểu',
      'điểm tối thiểu'
    ];
    
    // Check if document contains important phrases from query
    const hasImportantPhrase = importantPhrases.some(phrase => {
      if (query.includes(phrase)) {
        return docText.includes(phrase) || 
               docText.includes(phrase.replace(/\s+/g, '')) ||
               (phrase.includes('điểm hdcd') && docText.includes('điểm') && docText.includes('hdcd'));
      }
      return false;
    });
    
    if (hasImportantPhrase) {
      return true;
    }
    
    if (importantKeywords.length === 0) {
      // If no important keywords, check if at least 60% of keywords match
      const matchCount = this._countKeywordMatches(keywords, docText);
      return matchCount >= Math.ceil(keywords.length * 0.6);
    }
    
    // Check if at least 2 important keywords appear (tăng từ 1 lên 2)
    const matchedImportant = importantKeywords.filter(kw => docText.includes(kw));
    return matchedImportant.length >= 2;
  }

  /**
   * Get documents applicable to user (RBAC filtering)
   */
  async _getApplicableDocuments(userContext) {
    try {
      // Build query: must be active, must be in same tenant
      const baseQuery = {
        tenantId: userContext.tenantId || 'default',
        isActive: true
      };

      // RBAC: if user has roles, filter by allowedRoles
      if (userContext.roles && userContext.roles.length > 0) {
        baseQuery.$or = [
          { allowedRoles: { $size: 0 } }, // No role restriction
          { allowedRoles: { $in: userContext.roles } } // User has one of allowed roles
        ];
      } else {
        // No roles, can only access unrestricted documents
        baseQuery.allowedRoles = { $size: 0 };
      }

      const documents = await ChatbotDocument.find(baseQuery)
        .sort({ priority: -1 })
        .lean();

      return documents;
    } catch (err) {
      console.error('Error getting applicable documents:', err.message);
      return [];
    }
  }

  /**
   * Compile answer from top retrieved documents
   */
  _compileAnswer(documents) {
    if (!documents || documents.length === 0) {
      return '';
    }

    // Simply concatenate top results with separator
    const contents = documents
      .slice(0, CONFIG.MAX_RETRIEVED_DOCS)
      .map(doc => doc.content)
      .join('\n\n---\n\n');

    // Limit response length
    if (contents.length > CONFIG.MAX_RESPONSE_LENGTH) {
      return contents.substring(0, CONFIG.MAX_RESPONSE_LENGTH) + '...';
    }

    return contents;
  }

  /**
   * Create or update document in knowledge base
   */
  async createDocument(data, userId) {
    try {
      const { title, content, category, tags, allowedRoles, priority, tenantId } = data;

      if (!title || !content) {
        throw new Error('Title and content are required');
      }

      // Generate embedding for content (use advanced embedding if available)
      const embedding = CONFIG.USE_HUGGINGFACE_EMBEDDINGS === 'true'
        ? await advancedEmbeddingService.embed(content)
        : await embeddingService.embed(content);

      const document = new ChatbotDocument({
        title,
        content,
        category: category || 'other',
        tags: tags || [],
        allowedRoles: allowedRoles || [],
        priority: priority || 5,
        embedding,
        tenantId: tenantId || 'default',
        createdBy: userId,
        updatedBy: userId
      });

      await document.save();
      return document;
    } catch (err) {
      console.error('Error creating document:', err.message);
      throw err;
    }
  }

  /**
   * Update existing document
   */
  async updateDocument(docId, data, userId) {
    try {
      const updateData = { ...data };
      updateData.updatedBy = userId;

      // If content changed, regenerate embedding
      if (data.content) {
        updateData.embedding = CONFIG.USE_HUGGINGFACE_EMBEDDINGS === 'true'
          ? await advancedEmbeddingService.embed(data.content)
          : await embeddingService.embed(data.content);
      }

      const document = await ChatbotDocument.findByIdAndUpdate(
        docId,
        updateData,
        { new: true, runValidators: true }
      );

      if (!document) {
        throw new Error('Document not found');
      }

      return document;
    } catch (err) {
      console.error('Error updating document:', err.message);
      throw err;
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(docId) {
    try {
      const result = await ChatbotDocument.findByIdAndDelete(docId);
      if (!result) {
        throw new Error('Document not found');
      }
      return result;
    } catch (err) {
      console.error('Error deleting document:', err.message);
      throw err;
    }
  }

  /**
   * Get document by ID
   */
  async getDocument(docId) {
    try {
      return await ChatbotDocument.findById(docId).lean();
    } catch (err) {
      console.error('Error getting document:', err.message);
      throw err;
    }
  }

  /**
   * List all documents (paginated)
   */
  async listDocuments(tenantId, options = {}) {
    try {
      const { limit = 20, page = 1, category, isActive = true } = options;
      const skip = (page - 1) * limit;

      const query = {
        tenantId: tenantId || 'default',
        isActive
      };

      if (category) {
        query.category = category;
      }

      const [documents, total] = await Promise.all([
        ChatbotDocument.find(query)
          .sort({ priority: -1, createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        ChatbotDocument.countDocuments(query)
      ]);

      return {
        data: documents,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      };
    } catch (err) {
      console.error('Error listing documents:', err.message);
      return {
        data: [],
        pagination: { total: 0, page: 1, limit: 20, pages: 0 }
      };
    }
  }
}

module.exports = new RAGService();
