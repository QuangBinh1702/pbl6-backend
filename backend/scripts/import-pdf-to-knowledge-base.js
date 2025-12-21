// Script để import PDF vào Knowledge Base cho RAG
// Sử dụng: node scripts/import-pdf-to-knowledge-base.js <path-to-pdf-file>
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const mongoose = require('mongoose');
const ChatbotDocument = require('../src/models/chatbot_document.model');
const embeddingService = require('../src/services/embedding.service');
const advancedEmbeddingService = require('../src/services/advancedEmbedding.service');
const CONFIG = require('../src/config/chatbot.config');

const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_NAME || 'pbl6';

// Cấu hình
const CHUNK_SIZE = 500; // Số từ mỗi chunk (giảm để tránh memory issue)
const OVERLAP_SIZE = 50; // Số từ overlap giữa các chunks để không mất context

/**
 * Chia text thành các chunks nhỏ hơn
 */
function splitIntoChunks(text, chunkSize = CHUNK_SIZE, overlapSize = OVERLAP_SIZE) {
  const words = text.split(/\s+/);
  const chunks = [];
  
  if (words.length <= chunkSize) {
    return [text];
  }
  
  let start = 0;
  while (start < words.length) {
    const end = Math.min(start + chunkSize, words.length);
    const chunk = words.slice(start, end).join(' ');
    chunks.push(chunk);
    
    // Di chuyển với overlap để không mất context
    start = end - overlapSize;
    if (start >= words.length) break;
  }
  
  return chunks;
}

/**
 * Tạo title từ chunk (lấy câu đầu tiên hoặc từ khóa)
 */
function generateTitle(chunk, index, totalChunks, pdfTitle) {
  // Lấy câu đầu tiên làm title
  const firstSentence = chunk.split(/[.!?。]/)[0].trim();
  if (firstSentence.length > 0 && firstSentence.length < 100) {
    return `${pdfTitle} - Phần ${index + 1}/${totalChunks}: ${firstSentence.substring(0, 80)}`;
  }
  
  // Nếu không có câu rõ ràng, lấy 50 từ đầu
  const words = chunk.split(/\s+/).slice(0, 50).join(' ');
  return `${pdfTitle} - Phần ${index + 1}/${totalChunks}: ${words.substring(0, 80)}...`;
}

/**
 * Extract text từ PDF
 */
async function extractTextFromPDF(pdfPath) {
  try {
    console.log(`📄 Đang đọc PDF: ${pdfPath}`);
    const dataBuffer = fs.readFileSync(pdfPath);
    
    // Sử dụng PDFParse class với options để giảm memory
    const parser = new PDFParse({ 
      data: dataBuffer,
      verbosity: 0 // Giảm verbosity để tiết kiệm memory
    });
    
    // Chỉ lấy text, không lấy images hay tables
    const pdfData = await parser.getText({
      pageJoiner: '\n', // Đơn giản hóa
      lineEnforce: true
    });
    
    console.log(`✅ Đã đọc PDF thành công:`);
    console.log(`   - Số trang: ${pdfData.total}`);
    console.log(`   - Số ký tự: ${pdfData.text.length}`);
    
    // Cleanup parser để giải phóng memory
    await parser.destroy();
    
    return {
      text: pdfData.text,
      title: path.basename(pdfPath, '.pdf'),
      numPages: pdfData.total
    };
  } catch (err) {
    console.error('❌ Lỗi khi đọc PDF:', err.message);
    throw err;
  }
}

/**
 * Import PDF vào knowledge base
 */
async function importPDFToKnowledgeBase(pdfPath, options = {}) {
  try {
    // Kết nối database
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    console.log(`📍 Kết nối database: ${dbName}\n`);
    await mongoose.connect(mongoUri, { dbName });
    console.log(`✅ Đã kết nối database: ${mongoose.connection.name}\n`);

    // Extract text từ PDF
    const { text, title: pdfTitle, numPages } = await extractTextFromPDF(pdfPath);
    
    if (!text || text.trim().length === 0) {
      throw new Error('PDF không có nội dung text');
    }

    // Chia thành chunks
    console.log(`\n📦 Đang chia nội dung thành chunks...`);
    const chunks = splitIntoChunks(text, CHUNK_SIZE, OVERLAP_SIZE);
    console.log(`✅ Đã chia thành ${chunks.length} chunks\n`);

    // Cấu hình import
    const tenantId = options.tenantId || 'default';
    const category = options.category || 'regulation';
    const tags = options.tags || ['PDF', 'imported', pdfTitle];
    const allowedRoles = options.allowedRoles || [];
    const priority = options.priority || 7;

    // Generate embeddings và tạo documents
    console.log(`🔄 Đang generate embeddings và import vào database...`);
    const documents = [];
    
    // Xử lý từng chunk một để tránh memory issue
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkTitle = generateTitle(chunk, i, chunks.length, pdfTitle);
      
      console.log(`   [${i + 1}/${chunks.length}] Đang xử lý: ${chunkTitle.substring(0, 60)}...`);
      
      try {
        // Generate embedding
        const embedding = CONFIG.USE_HUGGINGFACE_EMBEDDINGS === 'true'
          ? await advancedEmbeddingService.embed(chunk)
          : await embeddingService.embed(chunk);
        
        // Tạo document
        const document = new ChatbotDocument({
          tenantId,
          title: chunkTitle,
          content: chunk,
          category,
          tags: [...tags, `chunk-${i + 1}`],
          allowedRoles,
          priority,
          embedding,
          isActive: true
        });
        
        await document.save();
        documents.push(document);
        
        console.log(`   ✅ Đã import chunk ${i + 1}/${chunks.length}`);
        
        // Force garbage collection hint (nếu có)
        if (global.gc && i % 5 === 0) {
          global.gc();
        }
      } catch (err) {
        console.error(`   ❌ Lỗi khi xử lý chunk ${i + 1}:`, err.message);
        // Tiếp tục với chunk tiếp theo
        continue;
      }
    }

    console.log(`\n✅ Hoàn thành! Đã import ${documents.length} documents từ PDF`);
    console.log(`\n📊 Tóm tắt:`);
    console.log(`   - File PDF: ${path.basename(pdfPath)}`);
    console.log(`   - Số trang: ${numPages}`);
    console.log(`   - Số chunks: ${chunks.length}`);
    console.log(`   - Documents đã tạo: ${documents.length}`);
    console.log(`   - Category: ${category}`);
    console.log(`   - Tags: ${tags.join(', ')}`);
    
    // Hiển thị danh sách documents đã tạo
    console.log(`\n📋 Danh sách documents:`);
    documents.forEach((doc, idx) => {
      console.log(`   ${idx + 1}. ${doc.title}`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Đã đóng kết nối database');
    
    return {
      success: true,
      documentsCreated: documents.length,
      chunks: chunks.length,
      pdfTitle,
      numPages
    };
    
  } catch (err) {
    console.error('\n❌ Lỗi:', err.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

// Main
if (require.main === module) {
  const pdfPath = process.argv[2];
  
  if (!pdfPath) {
    console.error('❌ Vui lòng cung cấp đường dẫn đến file PDF');
    console.log('\nCách sử dụng:');
    console.log('  node scripts/import-pdf-to-knowledge-base.js <path-to-pdf> [options]');
    console.log('\nVí dụ:');
    console.log('  node scripts/import-pdf-to-knowledge-base.js public/uploads/quy-dinh.pdf');
    console.log('\nOptions (có thể chỉnh trong code):');
    console.log('  - category: regulation, guide, policy, faq, procedure, other');
    console.log('  - tags: array of tags');
    console.log('  - priority: 1-10 (default: 7)');
    console.log('  - allowedRoles: array of roles');
    process.exit(1);
  }

  // Kiểm tra file tồn tại
  if (!fs.existsSync(pdfPath)) {
    console.error(`❌ File không tồn tại: ${pdfPath}`);
    process.exit(1);
  }

  // Options (có thể customize)
  const options = {
    tenantId: 'default',
    category: 'regulation', // regulation, guide, policy, faq, procedure, other
    tags: ['PDF', 'imported'],
    allowedRoles: [], // [] = public, ['student'] = chỉ student, etc.
    priority: 7 // 1-10
  };

  importPDFToKnowledgeBase(pdfPath, options)
    .then(result => {
      console.log('\n✅ Import thành công!');
      process.exit(0);
    })
    .catch(err => {
      console.error('\n❌ Import thất bại:', err.message);
      process.exit(1);
    });
}

module.exports = { importPDFToKnowledgeBase, extractTextFromPDF };

