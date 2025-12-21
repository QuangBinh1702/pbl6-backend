// Script đơn giản để import PDF vào Knowledge Base
// Sử dụng: node scripts/import-pdf-simple.js <path-to-pdf-file>
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const ChatbotDocument = require('../src/models/chatbot_document.model');
const embeddingService = require('../src/services/embedding.service');
const advancedEmbeddingService = require('../src/services/advancedEmbedding.service');
const CONFIG = require('../src/config/chatbot.config');

// Thử import pdf-parse theo nhiều cách
let pdfParse;
try {
  // Cách 1: Thử default export
  pdfParse = require('pdf-parse');
  if (typeof pdfParse !== 'function' && pdfParse.default) {
    pdfParse = pdfParse.default;
  }
  // Cách 2: Thử PDFParse class
  if (typeof pdfParse !== 'function' && pdfParse.PDFParse) {
    pdfParse = pdfParse.PDFParse;
  }
} catch (err) {
  console.error('❌ Không thể load pdf-parse:', err.message);
  process.exit(1);
}

const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_NAME || 'pbl6';

// Cấu hình
const CHUNK_SIZE = 300; // Giảm xuống để tránh memory issue
const OVERLAP_SIZE = 30;

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
 * Lấy số trang của PDF - Dùng cách đơn giản nhất
 */
async function getPDFPageCount(pdfPath) {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    // Thử dùng pdf-parse function trực tiếp
    const pdfParseFunc = require('pdf-parse');
    
    // Nếu là object, thử tìm function
    let parseFunc = pdfParseFunc;
    if (typeof pdfParseFunc !== 'function') {
      if (pdfParseFunc.default) parseFunc = pdfParseFunc.default;
      else if (pdfParseFunc.pdfParse) parseFunc = pdfParseFunc.pdfParse;
    }
    
    if (typeof parseFunc !== 'function') {
      // Fallback: dùng PDFParse class nhưng chỉ lấy info
      const { PDFParse } = require('pdf-parse');
      const parser = new PDFParse({ data: dataBuffer, verbosity: 0 });
      const info = await parser.getInfo();
      await parser.destroy();
      return info.total;
    }
    
    // Dùng function trực tiếp
    const data = await parseFunc(dataBuffer, { max: 1 }); // Chỉ parse 1 trang để lấy info
    return data.numpages;
  } catch (err) {
    console.error('❌ Lỗi khi đếm số trang:', err.message);
    // Fallback: giả sử 20 trang nếu không đếm được
    return 20;
  }
}

/**
 * Extract text từ một batch trang của PDF
 * Dùng pdf-parse function với options first/last
 */
async function extractTextFromPDFPages(pdfPath, firstPage, lastPage) {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    
    // Thử dùng pdf-parse function trực tiếp với options
    const pdfParseFunc = require('pdf-parse');
    let parseFunc = pdfParseFunc;
    if (typeof pdfParseFunc !== 'function') {
      if (pdfParseFunc.default) parseFunc = pdfParseFunc.default;
      else if (pdfParseFunc.pdfParse) parseFunc = pdfParseFunc.pdfParse;
    }
    
    if (typeof parseFunc === 'function') {
      // Dùng function với options
      const data = await parseFunc(dataBuffer, {
        first: firstPage,
        last: lastPage
      });
      return data.text || '';
    }
    
    // Fallback: dùng PDFParse class
    const { PDFParse } = require('pdf-parse');
    const parser = new PDFParse({ 
      data: dataBuffer,
      verbosity: 0
    });
    
    const result = await parser.getText({
      first: firstPage,
      last: lastPage,
      pageJoiner: '\n',
      lineEnforce: true
    });
    
    await parser.destroy();
    return result.text || '';
    
  } catch (err) {
    console.error(`❌ Lỗi khi đọc trang ${firstPage}-${lastPage}:`, err.message);
    throw err;
  }
}

/**
 * Import PDF vào knowledge base - Xử lý theo từng batch trang
 */
async function importPDF(pdfPath, options = {}) {
  try {
    // Kết nối database
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    console.log(`📍 Kết nối database: ${dbName}\n`);
    await mongoose.connect(mongoUri, { dbName });
    console.log(`✅ Đã kết nối database\n`);

    // Kiểm tra file
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
    const PAGES_PER_BATCH = options.pagesPerBatch || 1; // Xử lý 1 trang một lần để tránh memory issue

    // Xử lý từng batch trang
    console.log(`🔄 Đang xử lý PDF theo từng batch (${PAGES_PER_BATCH} trang/batch)...\n`);
    let totalDocuments = 0;
    let chunkIndex = 0;
    
    for (let startPage = 1; startPage <= totalPages; startPage += PAGES_PER_BATCH) {
      const endPage = Math.min(startPage + PAGES_PER_BATCH - 1, totalPages);
      
      console.log(`📖 Đang đọc trang ${startPage}-${endPage}/${totalPages}...`);
      
      try {
        // Đọc text từ batch trang này
        const batchText = await extractTextFromPDFPages(pdfPath, startPage, endPage);
        
        if (!batchText || batchText.trim().length === 0) {
          console.log(`   ⚠️  Không có text trong trang ${startPage}-${endPage}, bỏ qua\n`);
          continue;
        }
        
        console.log(`   ✅ Đã đọc ${batchText.length} ký tự`);
        
        // Chia batch text thành chunks
        const chunks = splitIntoChunks(batchText, CHUNK_SIZE, OVERLAP_SIZE);
        console.log(`   📦 Chia thành ${chunks.length} chunks`);
        
        // Import từng chunk
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          chunkIndex++;
          const chunkTitle = `${pdfTitle} - Trang ${startPage}-${endPage} - Phần ${i + 1}/${chunks.length}`;
          
          process.stdout.write(`   [${chunkIndex}] Đang xử lý chunk ${i + 1}/${chunks.length}...`);
          
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
              tags: [...tags, `page-${startPage}-${endPage}`, `chunk-${chunkIndex}`],
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
        
        console.log(`   ✅ Hoàn thành batch trang ${startPage}-${endPage}\n`);
        
        // Giải phóng memory sau mỗi batch
        if (global.gc) {
          global.gc();
        }
        
      } catch (err) {
        console.error(`   ❌ Lỗi khi xử lý trang ${startPage}-${endPage}:`, err.message);
        console.log(`   ⏭️  Bỏ qua và tiếp tục với batch tiếp theo\n`);
        continue;
      }
    }

    console.log(`\n✅ Hoàn thành! Đã import ${totalDocuments} documents từ ${totalPages} trang`);
    console.log(`\n📊 Tóm tắt:`);
    console.log(`   - File: ${pdfTitle}`);
    console.log(`   - Số trang: ${totalPages}`);
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
    console.log('  node scripts/import-pdf-simple.js <path-to-pdf>');
    console.log('\nVí dụ:');
    console.log('  node scripts/import-pdf-simple.js "public/uploads/quy-dinh.pdf"');
    process.exit(1);
  }

  const options = {
    tenantId: 'default',
    category: 'regulation',
    tags: ['PDF', 'imported'],
    allowedRoles: [],
    priority: 7,
    pagesPerBatch: 1 // Xử lý 1 trang một lần để tránh memory issue
  };

  importPDF(pdfPath, options)
    .then(result => {
      console.log('\n✅ Import thành công!');
      process.exit(0);
    })
    .catch(err => {
      console.error('\n❌ Import thất bại:', err.message);
      process.exit(1);
    });
}

module.exports = { importPDF, extractTextFromPDFPages, getPDFPageCount };

