// Script import PDF - Chỉ lưu text thô, KHÔNG generate embedding
// Best practice: Tách riêng việc đọc PDF và generate embedding để tránh memory issue
// Sử dụng: node scripts/import-pdf-raw.js <path-to-pdf-file>
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const ChatbotDocument = require('../src/models/chatbot_document.model');

const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_NAME || 'pbl6';

/**
 * Import PDF - Chỉ lưu text, KHÔNG generate embedding
 * Mỗi trang = 1 document (hoặc chia nhỏ nếu trang quá dài)
 */
async function importPDFRaw(pdfPath, options = {}) {
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

    // Đọc PDF - dùng cách đơn giản nhất, chỉ lấy text
    console.log(`📖 Đang đọc PDF (có thể mất vài phút)...`);
    const dataBuffer = fs.readFileSync(pdfPath);
    
    const { PDFParse } = require('pdf-parse');
    const parser = new PDFParse({ 
      data: dataBuffer,
      verbosity: 0
    });
    
    // Đọc toàn bộ text
    const result = await parser.getText();
    const totalPages = result.total;
    const fullText = result.text;
    
    await parser.destroy();
    
    console.log(`✅ Đã đọc PDF:`);
    console.log(`   - Số trang: ${totalPages}`);
    console.log(`   - Số ký tự: ${fullText.length}\n`);

    if (!fullText || fullText.trim().length === 0) {
      throw new Error('PDF không có nội dung text');
    }

    // Chia text theo trang (dựa vào pageJoiner hoặc chia đều)
    // Nếu có pageJoiner, split theo đó
    const pageSeparator = result.pages && result.pages.length > 0 
      ? null // Đã có pages riêng
      : '\n-- page_number of total_number --'; // Default separator
    
    let pageTexts = [];
    if (result.pages && result.pages.length > 0) {
      // Nếu có pages riêng, dùng luôn
      pageTexts = result.pages.map(p => p.text);
    } else {
      // Chia text thành các phần (giả sử mỗi phần ~2000 ký tự)
      const charsPerPage = Math.ceil(fullText.length / totalPages);
      for (let i = 0; i < totalPages; i++) {
        const start = i * charsPerPage;
        const end = Math.min(start + charsPerPage, fullText.length);
        pageTexts.push(fullText.substring(start, end));
      }
    }

    console.log(`📦 Đã chia thành ${pageTexts.length} phần\n`);

    // Cấu hình
    const tenantId = options.tenantId || 'default';
    const category = options.category || 'regulation';
    const tags = options.tags || ['PDF', 'imported', 'no-embedding'];
    const allowedRoles = options.allowedRoles || [];
    const priority = options.priority || 7;

    // Import từng phần (KHÔNG generate embedding)
    console.log(`🔄 Đang import vào database (không generate embedding)...\n`);
    let totalDocuments = 0;
    
    for (let i = 0; i < pageTexts.length; i++) {
      const pageText = pageTexts[i].trim();
      
      if (!pageText || pageText.length === 0) {
        continue;
      }
      
      const pageNum = i + 1;
      const docTitle = `${pdfTitle} - Trang ${pageNum}`;
      
      process.stdout.write(`   [${pageNum}/${pageTexts.length}] Đang lưu...`);
      
      try {
        // Tạo document KHÔNG có embedding
        const document = new ChatbotDocument({
          tenantId,
          title: docTitle,
          content: pageText,
          category,
          tags: [...tags, `page-${pageNum}`],
          allowedRoles,
          priority,
          embedding: [], // Empty - sẽ generate sau
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

    console.log(`\n✅ Hoàn thành! Đã import ${totalDocuments} documents (chưa có embedding)`);
    console.log(`\n📊 Tóm tắt:`);
    console.log(`   - File: ${pdfTitle}`);
    console.log(`   - Số trang: ${totalPages}`);
    console.log(`   - Documents đã tạo: ${totalDocuments}`);
    console.log(`\n⚠️  Lưu ý: Các documents chưa có embedding.`);
    console.log(`   Chạy script sau để generate embeddings:`);
    console.log(`   node scripts/generate-embeddings-for-documents.js`);

    await mongoose.connection.close();
    console.log('\n✅ Đã đóng kết nối database');
    
    return { success: true, documentsCreated: totalDocuments };
    
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
    console.log('  node scripts/import-pdf-raw.js <path-to-pdf>');
    process.exit(1);
  }

  const options = {
    tenantId: 'default',
    category: 'regulation',
    tags: ['PDF', 'imported'],
    allowedRoles: [],
    priority: 7
  };

  importPDFRaw(pdfPath, options)
    .then(result => {
      console.log('\n✅ Import thành công!');
      process.exit(0);
    })
    .catch(err => {
      console.error('\n❌ Import thất bại:', err.message);
      process.exit(1);
    });
}

module.exports = { importPDFRaw };

