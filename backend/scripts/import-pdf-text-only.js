// Script import PDF chỉ lưu text, không generate embedding ngay
// Embedding sẽ được generate sau khi import xong
// Sử dụng: node scripts/import-pdf-text-only.js <path-to-pdf-file>
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const ChatbotDocument = require('../src/models/chatbot_document.model');

const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_NAME || 'pbl6';

// Cấu hình
const CHUNK_SIZE = 500; // Số từ mỗi chunk
const OVERLAP_SIZE = 50;

/**
 * Chia text thành chunks
 */
function splitIntoChunks(text, chunkSize = CHUNK_SIZE, overlapSize = OVERLAP_SIZE) {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  
  if (words.length <= chunkSize) {
    return [text];
  }
  
  const chunks = [];
  let start = 0;
  
  while (start < words.length) {
    const end = Math.min(start + chunkSize, words.length);
    const chunk = words.slice(start, end).join(' ');
    chunks.push(chunk);
    
    start = end - overlapSize;
    if (start >= words.length) break;
  }
  
  return chunks;
}

/**
 * Import PDF - Chỉ lưu text, không generate embedding
 */
async function importPDFTextOnly(pdfPath, options = {}) {
  try {
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    console.log(`📍 Kết nối database: ${dbName}\n`);
    await mongoose.connect(mongoUri, { dbName });
    console.log(`✅ Đã kết nối database\n`);

    if (!fs.existsSync(pdfPath)) {
      throw new Error(`File không tồn tại: ${pdfPath}`);
    }
    
    const pdfTitle = path.basename(pdfPath, '.pdf');
    console.log(`📄 File: ${pdfTitle}\n`);

    // Đọc PDF - dùng PDFParse class
    console.log(`📖 Đang đọc PDF (có thể mất vài phút cho file lớn)...`);
    const dataBuffer = fs.readFileSync(pdfPath);
    
    const { PDFParse } = require('pdf-parse');
    const parser = new PDFParse({ 
      data: dataBuffer,
      verbosity: 0
    });
    
    // Đọc toàn bộ text
    const result = await parser.getText();
    const pdfData = {
      text: result.text,
      numpages: result.total
    };
    
    await parser.destroy();
    
    console.log(`✅ Đã đọc PDF:`);
    console.log(`   - Số trang: ${pdfData.numpages}`);
    console.log(`   - Số ký tự: ${pdfData.text.length}\n`);

    if (!pdfData.text || pdfData.text.trim().length === 0) {
      throw new Error('PDF không có nội dung text');
    }

    // Chia thành chunks
    console.log(`📦 Đang chia nội dung thành chunks...`);
    const chunks = splitIntoChunks(pdfData.text, CHUNK_SIZE, OVERLAP_SIZE);
    console.log(`✅ Đã chia thành ${chunks.length} chunks\n`);

    // Cấu hình
    const tenantId = options.tenantId || 'default';
    const category = options.category || 'regulation';
    const tags = options.tags || ['PDF', 'imported', 'no-embedding'];
    const allowedRoles = options.allowedRoles || [];
    const priority = options.priority || 7;

    // Import từng chunk (KHÔNG generate embedding)
    console.log(`🔄 Đang import vào database (không generate embedding)...`);
    const documents = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkTitle = `${pdfTitle} - Phần ${i + 1}/${chunks.length}`;
      
      process.stdout.write(`   [${i + 1}/${chunks.length}] Đang lưu...`);
      
      try {
        // Tạo document KHÔNG có embedding
        const document = new ChatbotDocument({
          tenantId,
          title: chunkTitle,
          content: chunk,
          category,
          tags: [...tags, `chunk-${i + 1}`],
          allowedRoles,
          priority,
          embedding: [], // Empty embedding - sẽ generate sau
          isActive: true
        });
        
        await document.save();
        documents.push(document);
        
        console.log(` ✅`);
      } catch (err) {
        console.log(` ❌ Lỗi: ${err.message}`);
        continue;
      }
    }

    console.log(`\n✅ Hoàn thành! Đã import ${documents.length} documents (chưa có embedding)`);
    console.log(`\n📊 Tóm tắt:`);
    console.log(`   - File: ${pdfTitle}`);
    console.log(`   - Số trang: ${pdfData.numpages}`);
    console.log(`   - Số chunks: ${chunks.length}`);
    console.log(`   - Documents đã tạo: ${documents.length}`);
    console.log(`\n⚠️  Lưu ý: Các documents chưa có embedding.`);
    console.log(`   Chạy script generate-embeddings.js sau để tạo embeddings.`);

    await mongoose.connection.close();
    console.log('\n✅ Đã đóng kết nối database');
    
    return { success: true, documentsCreated: documents.length };
    
  } catch (err) {
    console.error('\n❌ Lỗi:', err.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    throw err;
  }
}

// Main
if (require.main === module) {
  const pdfPath = process.argv[2];
  
  if (!pdfPath) {
    console.error('❌ Vui lòng cung cấp đường dẫn đến file PDF');
    console.log('\nCách sử dụng:');
    console.log('  node scripts/import-pdf-text-only.js <path-to-pdf>');
    process.exit(1);
  }

  const options = {
    tenantId: 'default',
    category: 'regulation',
    tags: ['PDF', 'imported'],
    allowedRoles: [],
    priority: 7
  };

  importPDFTextOnly(pdfPath, options)
    .then(result => {
      console.log('\n✅ Import thành công!');
      process.exit(0);
    })
    .catch(err => {
      console.error('\n❌ Import thất bại:', err.message);
      process.exit(1);
    });
}

module.exports = { importPDFTextOnly };

