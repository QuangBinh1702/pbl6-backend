// Script generate embeddings cho các documents chưa có embedding
// Sử dụng: node scripts/generate-embeddings-for-documents.js
require('dotenv').config();
const mongoose = require('mongoose');
const ChatbotDocument = require('../src/models/chatbot_document.model');
const embeddingService = require('../src/services/embedding.service');
const advancedEmbeddingService = require('../src/services/advancedEmbedding.service');
const CONFIG = require('../src/config/chatbot.config');

const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_NAME || 'pbl6';

/**
 * Generate embeddings cho documents chưa có
 */
async function generateEmbeddingsForDocuments(options = {}) {
  try {
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    console.log(`📍 Kết nối database: ${dbName}\n`);
    await mongoose.connect(mongoUri, { dbName });
    console.log(`✅ Đã kết nối database\n`);

    // Tìm documents chưa có embedding
    const query = {
      $or: [
        { embedding: { $size: 0 } },
        { embedding: { $exists: false } }
      ]
    };
    
    if (options.tags && options.tags.length > 0) {
      query.tags = { $in: options.tags };
    }
    
    const documents = await ChatbotDocument.find(query).select('_id title content embedding');
    const total = documents.length;
    
    if (total === 0) {
      console.log('✅ Không có documents nào cần generate embedding');
      await mongoose.connection.close();
      return { success: true, processed: 0 };
    }
    
    console.log(`📋 Tìm thấy ${total} documents cần generate embedding\n`);
    console.log(`🔄 Đang generate embeddings...\n`);

    let success = 0;
    let failed = 0;
    
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      process.stdout.write(`   [${i + 1}/${total}] ${doc.title.substring(0, 50)}...`);
      
      try {
        if (!doc.content || doc.content.trim().length === 0) {
          console.log(` ⚠️  Không có content`);
          failed++;
          continue;
        }
        
        // Generate embedding
        const embedding = CONFIG.USE_HUGGINGFACE_EMBEDDINGS === 'true'
          ? await advancedEmbeddingService.embed(doc.content)
          : await embeddingService.embed(doc.content);
        
        // Update document
        await ChatbotDocument.findByIdAndUpdate(doc._id, {
          embedding: embedding
        });
        
        success++;
        console.log(` ✅`);
        
        // Giải phóng memory
        if (global.gc && i % 10 === 0) {
          global.gc();
        }
        
      } catch (err) {
        console.log(` ❌ Lỗi: ${err.message}`);
        failed++;
        continue;
      }
    }

    console.log(`\n✅ Hoàn thành!`);
    console.log(`   - Thành công: ${success}/${total}`);
    console.log(`   - Thất bại: ${failed}/${total}`);

    await mongoose.connection.close();
    console.log('\n✅ Đã đóng kết nối database');
    
    return { success: true, processed: success, failed };
    
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
  const tags = process.argv[2] ? process.argv[2].split(',') : null;
  
  const options = {
    tags: tags || ['PDF', 'imported'] // Chỉ generate cho documents có tag này
  };

  generateEmbeddingsForDocuments(options)
    .then(result => {
      console.log('\n✅ Generate embeddings thành công!');
      process.exit(0);
    })
    .catch(err => {
      console.error('\n❌ Generate embeddings thất bại:', err.message);
      process.exit(1);
    });
}

module.exports = { generateEmbeddingsForDocuments };

