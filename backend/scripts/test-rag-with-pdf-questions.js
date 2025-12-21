// Script test RAG với các câu hỏi về PDF
// Sử dụng: node scripts/test-rag-with-pdf-questions.js
require('dotenv').config();
const mongoose = require('mongoose');
const ragService = require('../src/services/rag.service');

const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_NAME || 'pbl6';

// Danh sách câu hỏi test về PDF - Dựa trên nội dung thực tế của PDF
const testQuestions = [
  // Câu hỏi về quy định chung (Trang 1-3)
  'Quy định về tham gia kết nối và phục vụ cộng đồng được ban hành bởi ai?',
  'Quy định này có số quyết định là gì?',
  'Quy định này áp dụng cho đối tượng nào?',
  'Phạm vi điều chỉnh của quy định này là gì?',
  
  // Câu hỏi về mục đích và nguyên tắc (Trang 3-4)
  'Mục đích của hoạt động kết nối và phục vụ cộng đồng là gì?',
  'Yêu cầu và nguyên tắc thực hiện kết nối và phục vụ cộng đồng như thế nào?',
  'Hoạt động cộng đồng phải tuân thủ những gì?',
  
  // Câu hỏi về nội dung hoạt động (Trang 5-7)
  'Nội dung hoạt động cộng đồng bao gồm những lĩnh vực nào?',
  'Hoạt động về đào tạo và đảm bảo chất lượng giáo dục là gì?',
  'Hoạt động về môi trường và phát triển bền vững bao gồm những gì?',
  'Hoạt động công tác xã hội là gì?',
  'Có những hoạt động nào về hỗ trợ thiên tai dịch bệnh không?',
  
  // Câu hỏi về tổ chức và quản lý (Trang 7-8)
  'Ai chịu trách nhiệm tổ chức hoạt động cộng đồng?',
  'Phòng Công tác Sinh viên có vai trò gì trong hoạt động cộng đồng?',
  'Các khoa và tổ chức đoàn thể có thể triển khai hoạt động như thế nào?',
  'Các hoạt động phải được thông báo như thế nào?',
  
  // Câu hỏi về điểm số và đánh giá (Trang 8-9)
  'Sinh viên hệ đào tạo 5 năm cần tích lũy tối thiểu bao nhiêu điểm HDCD?',
  'Sinh viên hệ đào tạo 4 năm cần tích lũy tối thiểu bao nhiêu điểm HDCD?',
  'Sinh viên học vượt tiến độ thì điểm tích lũy HDCD tối thiểu được tính như thế nào?',
  'Cách tính điểm quy đổi HDCD như thế nào?',
  'Ai có trách nhiệm đánh giá và ghi nhận kết quả tham gia HDCD?',
  'Thời gian đánh giá kết quả tham gia HDCD được thực hiện như thế nào?',
  
  // Câu hỏi về quyền lợi và trách nhiệm (Trang 10+)
  'Sinh viên có quyền lợi gì khi tham gia hoạt động cộng đồng?',
  'Trách nhiệm của sinh viên khi tham gia hoạt động cộng đồng là gì?',
  'Sinh viên vi phạm khi tham gia HDCD sẽ bị xử lý như thế nào?',
  'Đơn vị chủ trì tổ chức hoạt động có trách nhiệm gì?',
  
  // Câu hỏi cụ thể về nội dung PDF
  'Quy định này được ban hành theo quyết định số bao nhiêu?',
  'Trường Đại học Bách khoa thuộc Đại học nào?',
  'Có những hình thức khen thưởng nào cho sinh viên tham gia?',
  'Sinh viên có được cấp giấy chứng nhận khi tham gia không?'
];

async function testRAGWithQuestions() {
  try {
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    console.log(`📍 Kết nối database: ${dbName}\n`);
    await mongoose.connect(mongoUri, { dbName });
    console.log(`✅ Đã kết nối database\n`);

    const userContext = {
      tenantId: 'default',
      roles: []
    };

    console.log(`🧪 Bắt đầu test ${testQuestions.length} câu hỏi về PDF...\n`);
    console.log('='.repeat(80));

    let totalQuestions = 0;
    let foundDocuments = 0;
    let highConfidence = 0;
    let pdfDocumentsFound = 0;

    for (let i = 0; i < testQuestions.length; i++) {
      const question = testQuestions[i];
      totalQuestions++;
      
      console.log(`\n[${i + 1}/${testQuestions.length}] Câu hỏi: ${question}`);
      
      try {
        const result = await ragService.retrieve(question, userContext);
        
        if (result.documents && result.documents.length > 0) {
          foundDocuments++;
          
          // Kiểm tra có document từ PDF không
          const hasPDFDoc = result.documents.some(doc => 
            doc.title && doc.title.includes('3337 QD BH')
          );
          
          if (hasPDFDoc) {
            pdfDocumentsFound++;
          }
          
          // Kiểm tra confidence
          if (result.confidence >= 0.3) {
            highConfidence++;
          }
          
          console.log(`   ✅ Confidence: ${result.confidence.toFixed(3)}`);
          console.log(`   📄 Documents: ${result.documents.length}`);
          
          // Hiển thị top document
          if (result.documents[0]) {
            const topDoc = result.documents[0];
            const isPDF = topDoc.title && topDoc.title.includes('3337 QD BH');
            const marker = isPDF ? '📄 PDF' : '📝 Other';
            console.log(`   ${marker} Top: ${topDoc.title.substring(0, 60)}...`);
            console.log(`      Score: ${topDoc.relevanceScore?.toFixed(3) || 'N/A'}`);
          }
          
          if (result.answer && result.answer.length > 0) {
            console.log(`   💬 Answer: ${result.answer.substring(0, 100)}...`);
          }
        } else {
          console.log(`   ❌ Không tìm thấy documents`);
        }
        
      } catch (err) {
        console.log(`   ❌ Lỗi: ${err.message}`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n📊 TÓM TẮT KẾT QUẢ TEST:\n');
    console.log(`   Tổng số câu hỏi: ${totalQuestions}`);
    console.log(`   Tìm thấy documents: ${foundDocuments}/${totalQuestions} (${(foundDocuments/totalQuestions*100).toFixed(1)}%)`);
    console.log(`   Confidence >= 0.3: ${highConfidence}/${totalQuestions} (${(highConfidence/totalQuestions*100).toFixed(1)}%)`);
    console.log(`   Tìm thấy từ PDF: ${pdfDocumentsFound}/${totalQuestions} (${(pdfDocumentsFound/totalQuestions*100).toFixed(1)}%)`);
    
    await mongoose.connection.close();
    console.log('\n✅ Đã đóng kết nối database');
    
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
  testRAGWithQuestions()
    .then(() => {
      console.log('\n✅ Test hoàn thành!');
      process.exit(0);
    })
    .catch(err => {
      console.error('\n❌ Test thất bại:', err.message);
      process.exit(1);
    });
}

module.exports = { testQuestions, testRAGWithQuestions };

