// Script import PDF theo từng trang - Best practice để tránh memory issue
// Mỗi trang được xử lý độc lập, parser được destroy ngay sau khi đọc xong
// Sử dụng: node scripts/import-pdf-by-page.js <path-to-pdf-file>
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const ChatbotDocument = require('../src/models/chatbot_document.model');
const embeddingService = require('../src/services/embedding.service');
const advancedEmbeddingService = require('../src/services/advancedEmbedding.service');
const CONFIG = require('../src/config/chatbot.config');

const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_NAME || 'pbl6';

// Cấu hình
const CHUNK_SIZE = 400; // Số từ mỗi chunk (nếu trang quá dài)
const OVERLAP_SIZE = 40;

/**
 * Chia text thành chunks nếu quá dài
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
 * Đọc text từ một trang cụ thể của PDF
 * Best practice: Tạo parser mới cho mỗi trang và destroy ngay sau khi đọc
 */
async function readPageText(pdfPath, pageNumber) {
  const { PDFParse } = require('pdf-parse');
  const dataBuffer = fs.readFileSync(pdfPath);
  
  // Tạo parser mới cho trang này
  const parser = new PDFParse({ 
    data: dataBuffer,
    verbosity: 0 // Giảm verbosity để tiết kiệm memory
  });
  
  try {
    // Đọc chỉ trang này
    const result = await parser.getText({
      first: pageNumber,
      last: pageNumber,
      pageJoiner: '\n',
      lineEnforce: true
    });
    
    return result.text || '';
  } finally {
    // QUAN TRỌNG: Destroy parser ngay để giải phóng memory
    await parser.destroy();
  }
}

/**
 * Lấy số trang của PDF (cách nhẹ nhất)
 */
async function getPDFPageCount(pdfPath) {
  const { PDFParse } = require('pdf-parse');
  const dataBuffer = fs.readFileSync(pdfPath);
  
  const parser = new PDFParse({ 
    data: dataBuffer,
    verbosity: 0
  });
  
  try {
    const info = await parser.getInfo();
    return info.total;
  } finally {
    await parser.destroy();
  }
}

/**
 * Import PDF vào knowledge base - Xử lý từng trang một
 */
async function importPDFByPage(pdfPath, options = {}) {
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
    const fileSize = (fs.statSync(pdfPath).size / 1024 / 1024).toFixed(2);
    console.log(`📄 File: ${pdfTitle}`);
    console.log(`   Size: ${fileSize} MB\n`);

    // Lấy số trang
    console.log(`📊 Đang đếm số trang...`);
    const totalPages = await getPDFPageCount(pdfPath);
    console.log(`✅ PDF có ${totalPages} trang\n`);

    // Cấu hình
    const tenantId = options.tenantId || 'default';
    const category = options.category || 'regulation';
    const tags = options.tags || ['PDF', 'imported'];
    const allowedRoles = options.allowedRoles || [];
    const priority = options.priority || 7;

    // Xử lý từng trang một
    console.log(`🔄 Đang xử lý từng trang...\n`);
    let totalDocuments = 0;
    let totalChunks = 0;
    
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      try {
        console.log(`📖 [${pageNum}/${totalPages}] Đang đọc trang ${pageNum}...`);
        
        // Đọc text từ trang này
        const pageText = await readPageText(pdfPath, pageNum);
        
        if (!pageText || pageText.trim().length === 0) {
          console.log(`   ⚠️  Trang ${pageNum} không có text, bỏ qua\n`);
          continue;
        }
        
        console.log(`   ✅ Đã đọc ${pageText.length} ký tự`);
        
        // Chia thành chunks nếu trang quá dài
        const chunks = splitIntoChunks(pageText, CHUNK_SIZE, OVERLAP_SIZE);
        console.log(`   📦 Chia thành ${chunks.length} chunk(s)`);
        
        // Import từng chunk
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          totalChunks++;
          
          const chunkTitle = chunks.length === 1 
            ? `${pdfTitle} - Trang ${pageNum}`
            : `${pdfTitle} - Trang ${pageNum} - Phần ${i + 1}/${chunks.length}`;
          
          process.stdout.write(`   [${totalChunks}] Đang xử lý...`);
          
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
              tags: [...tags, `page-${pageNum}`, `chunk-${totalChunks}`],
              allowedRoles,
              priority,
              embedding,
              isActive: true
            });
            
            await document.save();
            totalDocuments++;
            
            console.log(` ✅`);
          } catch (err) {
            console.log(` ❌ Lỗi: ${err.message}`);
            continue;
          }
        }
        
        console.log(`   ✅ Hoàn thành trang ${pageNum}\n`);
        
        // Giải phóng memory sau mỗi trang
        if (global.gc && pageNum % 5 === 0) {
          global.gc();
        }
        
      } catch (err) {
        console.error(`   ❌ Lỗi khi xử lý trang ${pageNum}:`, err.message);
        console.log(`   ⏭️  Bỏ qua và tiếp tục với trang tiếp theo\n`);
        continue;
      }
    }

    console.log(`\n✅ Hoàn thành! Đã import ${totalDocuments} documents từ ${totalPages} trang`);
    console.log(`\n📊 Tóm tắt:`);
    console.log(`   - File: ${pdfTitle}`);
    console.log(`   - Số trang: ${totalPages}`);
    console.log(`   - Tổng số chunks: ${totalChunks}`);
    console.log(`   - Documents đã tạo: ${totalDocuments}`);

    await mongoose.connection.close();
    console.log('\n✅ Đã đóng kết nối database');
    
    return { success: true, documentsCreated: totalDocuments, totalPages };
    
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
    console.log('  node scripts/import-pdf-by-page.js <path-to-pdf>');
    console.log('\nVí dụ:');
    console.log('  node scripts/import-pdf-by-page.js "public/uploads/quy-dinh.pdf"');
    process.exit(1);
  }

  const options = {
    tenantId: 'default',
    category: 'regulation',
    tags: ['PDF', 'imported'],
    allowedRoles: [],
    priority: 7
  };

  importPDFByPage(pdfPath, options)
    .then(result => {
      console.log('\n✅ Import thành công!');
      process.exit(0);
    })
    .catch(err => {
      console.error('\n❌ Import thất bại:', err.message);
      process.exit(1);
    });
}

module.exports = { importPDFByPage, readPageText, getPDFPageCount };

