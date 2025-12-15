// Seed script - Populate initial chatbot rules and documents
require('dotenv').config();
const mongoose = require('mongoose');
const ChatbotRule = require('../src/models/chatbot_rule.model');
const ChatbotDocument = require('../src/models/chatbot_document.model');
const embeddingService = require('../src/services/embedding.service');

const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_NAME || 'pbl6';

// Initial rules - extracted from current hardcoded logic
const initialRules = [
  {
    tenantId: 'default',
    pattern: 'hoạt động sắp tới',
    keywords: ['hoạt động sắp tới', 'next activities', 'upcoming events', 'sự kiện tới', 'active event'],
    responseTemplate: `Để xem hoạt động sắp tới, vui lòng đăng nhập vào hệ thống và truy cập mục "Hoạt động". 
Bạn có thể lọc theo danh mục để tìm các hoạt động phù hợp với bạn.`,
    priority: 8,
    allowedRoles: [],
    type: 'faq',
    isActive: true
  },

  {
    tenantId: 'default',
    pattern: 'đăng ký hoạt động',
    keywords: ['đăng ký', 'register activity', 'join activity', 'tham gia', 'sign up'],
    responseTemplate: `Để đăng ký hoạt động:
1. Tìm hoạt động bạn quan tâm
2. Nhấp vào "Đăng ký"
3. Điền các thông tin yêu cầu
4. Chọn "Xác nhận"

Bạn sẽ nhận được email xác nhận sau khi đăng ký thành công.`,
    priority: 9,
    allowedRoles: [],
    type: 'guide',
    isActive: true
  },

  {
    tenantId: 'default',
    pattern: 'yêu cầu cấp bằng cấp',
    keywords: ['cấp bằng', 'cert', 'diploma', 'certificate request', 'yêu cầu bằng cấp'],
    responseTemplate: `Để yêu cầu cấp bằng cấp:
1. Đảm bảo bạn đã tham gia đủ hoạt động bắt buộc
2. Truy cập mục "Yêu cầu bằng cấp"
3. Chọn loại bằng cấp
4. Nộp yêu cầu

Yêu cầu sẽ được xử lý trong vòng 3-5 ngày làm việc.`,
    priority: 8,
    allowedRoles: ['student'],
    type: 'guide',
    isActive: true
  },

  {
    tenantId: 'default',
    pattern: 'quản lý hoạt động',
    keywords: ['quản lý', 'manage', 'create activity', 'tạo hoạt động', 'activity management'],
    responseTemplate: `Để quản lý hoạt động (dành cho nhân viên):
1. Truy cập mục "Quản lý hoạt động"
2. Nhấp "Tạo hoạt động mới"
3. Điền các thông tin cần thiết
4. Thiết lập yêu cầu tham gia và mục tiêu
5. Lưu và công bố hoạt động

Sau khi tạo, bạn có thể theo dõi số người đăng ký.`,
    priority: 8,
    allowedRoles: ['staff', 'admin'],
    type: 'guide',
    isActive: true
  },

  {
    tenantId: 'default',
    pattern: 'điểm danh',
    keywords: ['điểm danh', 'attendance', 'check in', 'QR', 'qr code'],
    responseTemplate: `Để điểm danh tại sự kiện:
1. Tới địa điểm sự kiện
2. Scan mã QR được cung cấp
3. Xác nhận sự có mặt của bạn

Điểm danh phải được thực hiện tại thời gian diễn ra sự kiện.`,
    priority: 8,
    allowedRoles: [],
    type: 'guide',
    isActive: true
  },

  {
    tenantId: 'default',
    pattern: 'nộp bằng chứng',
    keywords: ['nộp', 'submit', 'evidence', 'bằng chứng', 'upload'],
    responseTemplate: `Để nộp bằng chứng hoạt động:
1. Vào chi tiết hoạt động
2. Chọn "Nộp bằng chứng"
3. Tải lên hình ảnh hoặc tài liệu
4. Thêm mô tả (nếu cần)
5. Xác nhận nộp

Bằng chứng phải được nộp trong 7 ngày sau hoạt động.`,
    priority: 7,
    allowedRoles: ['student'],
    type: 'guide',
    isActive: true
  },

  {
    tenantId: 'default',
    pattern: 'quy định tham gia',
    keywords: ['quy định', 'rules', 'requirements', 'yêu cầu', 'điều kiện'],
    responseTemplate: `Quy định tham gia hoạt động:
- Sinh viên phải là thành viên tổ chức
- Tham gia đủ số lần hoạt động bắt buộc
- Nộp bằng chứng đầy đủ
- Tuân thủ quy tắc ứng xử của tổ chức

Vui lòng liên hệ bộ phận tổ chức để biết thêm chi tiết.`,
    priority: 7,
    allowedRoles: [],
    type: 'rule',
    isActive: true
  },

  {
    tenantId: 'default',
    pattern: 'hỗ trợ trực tuyến',
    keywords: ['hỗ trợ', 'support', 'giúp đỡ', 'help', 'liên hệ'],
    responseTemplate: `Để nhận hỗ trợ:
📧 Email: support@organization.com
📱 Điện thoại: (86) 1234-5678
⏰ Thời gian: Thứ 2 - Thứ 6, 9:00 - 17:00

Bạn cũng có thể gửi tin nhắn qua hệ thống này để được hỗ trợ nhanh chóng.`,
    priority: 5,
    allowedRoles: [],
    type: 'faq',
    isActive: true
  }
  ];

  // Initial knowledge base documents (for Phase 2 RAG)
  const initialDocuments = [
  {
   tenantId: 'default',
   title: 'Hướng dẫn đăng ký hoạt động - Chi tiết',
   content: `Hướng dẫn đầy đủ về cách đăng ký hoạt động trong hệ thống.

  Các bước đăng ký:
  1. Đăng nhập vào hệ thống với tài khoản của bạn
  2. Truy cập trang "Hoạt động" hoặc "Activities"
  3. Duyệt qua danh sách các hoạt động sắp tới
  4. Chọn hoạt động bạn quan tâm
  5. Nhấp vào nút "Đăng ký" hoặc "Register"
  6. Điền các thông tin bắt buộc (nếu có)
  7. Xem lại thông tin của bạn
  8. Nhấp "Xác nhận" để hoàn tất đăng ký

  Sau khi đăng ký:
  - Bạn sẽ nhận được email xác nhận
  - Hoạt động sẽ xuất hiện trong "Hoạt động của tôi"
  - Bạn có thể hủy đăng ký trước hạn cuối cùng
  - Kiểm tra hạn cuối cùng để nộp bằng chứng

  Lưu ý quan trọng:
  - Chỉ đăng ký hoạt động mà bạn có thể tham gia
  - Kiểm tra yêu cầu về trình độ hoặc kỹ năng
  - Đảm bảo bạn có đủ thời gian để tham gia hoạt động`,
   category: 'guide',
   tags: ['đăng ký', 'hoạt động', 'hướng dẫn'],
   allowedRoles: [],
   priority: 9
  },

  {
   tenantId: 'default',
   title: 'Quy trình cấp bằng cấp - Yêu cầu và Điều kiện',
   content: `Hướng dẫn chi tiết về quá trình cấp bằng cấp.

  Yêu cầu chung:
  - Hoàn thành yêu cầu tham gia hoạt động tối thiểu
  - Tham gia tất cả các hoạt động bắt buộc
  - Nộp bằng chứng đầy đủ
  - Không bỏ hoạt động đã đăng ký mà không có lý do chính đáng
  - Tuân thủ quy tắc ứng xử

  Quy trình cấp bằng:
  1. Đảm bảo bạn đã hoàn thành tất cả yêu cầu
  2. Truy cập "Yêu cầu bằng cấp" trong menu chính
  3. Chọn loại bằng cấp bạn muốn yêu cầu
  4. Nộp đơn yêu cầu
  5. Chờ xử lý (thường 3-5 ngày làm việc)
  6. Kiểm tra trạng thái yêu cầu

  Thời gian xử lý:
  - Yêu cầu thường được xử lý trong 3-5 ngày làm việc
  - Bạn sẽ nhận được email thông báo kết quả
  - Bằng cấp được cấp sau khi phê duyệt

  Liên hệ hỗ trợ:
  - Nếu yêu cầu bị từ chối, bạn sẽ nhận được lý do cụ thể
  - Liên hệ bộ phận tổ chức để được hỗ trợ thêm`,
   category: 'policy',
   tags: ['bằng cấp', 'yêu cầu', 'quy trình'],
   allowedRoles: ['student'],
   priority: 8
  },

  {
   tenantId: 'default',
   title: 'Hệ thống điểm danh QR Code',
   content: `Hướng dẫn sử dụng hệ thống điểm danh QR code.

  Chuẩn bị:
  - Chuẩn bị thiết bị di động (điện thoại thông minh)
  - Cài đặt ứng dụng hoặc sử dụng web browser
  - Đảm bảo kết nối internet

  Quy trình điểm danh:
  1. Tới địa điểm hoạt động đúng giờ
  2. Tìm mã QR được cung cấp (có thể trên giấy, màn hình, tường)
  3. Mở ứng dụng hoặc camera điện thoại
  4. Quét mã QR
  5. Xác nhận sự có mặt
  6. Kiểm tra xác nhận thành công

  Lưu ý quan trọng:
  - Điểm danh chỉ khả dụng trong thời gian hoạt động
  - Quét mã QR bên ngoài thời gian sẽ không được tính
  - Nếu có sự cố, liên hệ nhân viên tại chỗ
  - Không được chia sẻ mã QR cho người khác

  Xử lý sự cố:
  - Nếu quét không thành công, thử lại
  - Nếu mã bị lỗi, liên hệ nhân viên tại chỗ
  - Yêu cầu điểm danh thủ công nếu cần`,
   category: 'guide',
   tags: ['điểm danh', 'QR code', 'kỹ thuật'],
   allowedRoles: [],
   priority: 8
  },

  {
   tenantId: 'default',
   title: 'Nộp bằng chứng hoạt động - Hướng dẫn Chi tiết',
   content: `Hướng dẫn về cách nộp bằng chứng cho hoạt động đã tham gia.

  Loại bằng chứng chấp nhận:
  - Hình ảnh (JPG, PNG, GIF)
  - Tài liệu (PDF, Word, Excel)
  - Video (MP4, MOV - nếu được phép)
  - Tham gia trực tiếp (tự động qua điểm danh)

  Quy trình nộp bằng chứng:
  1. Vào chi tiết hoạt động đã tham gia
  2. Chọn "Nộp bằng chứng" hoặc "Submit Evidence"
  3. Tải lên file bằng chứng
  4. Thêm mô tả (nếu cần)
  5. Xem lại thông tin
  6. Nhấp "Xác nhận nộp"

  Yêu cầu về file:
  - Kích thước file: tối đa 10MB
  - Định dạng hình ảnh: JPG, PNG
  - Định dạng tài liệu: PDF, DOC
  - Chất lượng: rõ ràng, có thể đọc được

  Thời hạn nộp:
  - Bằng chứng phải được nộp trong 7 ngày sau hoạt động
  - Nộp muộn hơn 7 ngày có thể bị từ chối
  - Không có lý do chính đáng sẽ không được gia hạn

  Lưu ý quan trọng:
  - Bằng chứng phải liên quan đến hoạt động
  - Không được làm giả hoặc sửa đổi bằng chứng
  - Sử dụng hình ảnh/tài liệu rõ ràng
  - Nếu bị từ chối, bạn có thể nộp lại`,
   category: 'guide',
   tags: ['bằng chứng', 'nộp', 'hướng dẫn'],
   allowedRoles: ['student'],
   priority: 7
  },

  {
   tenantId: 'default',
   title: 'Quản lý hoạt động - Dành cho Nhân viên',
   content: `Hướng dẫn quản lý hoạt động dành cho nhân viên tổ chức.

  Tạo hoạt động mới:
  1. Truy cập "Quản lý hoạt động" trong menu quản trị
  2. Nhấp "Tạo hoạt động mới"
  3. Điền thông tin cơ bản:
  - Tên hoạt động
  - Mô tả chi tiết
  - Ngày giờ diễn ra
  - Địa điểm
  - Số người tối đa
  4. Thiết lập yêu cầu:
  - Các hoạt động tiên quyết
  - Trình độ tối thiểu
  - Kỹ năng yêu cầu
  5. Lưu và công bố

  Quản lý đăng ký:
  - Xem danh sách người đã đăng ký
  - Chấp nhận hoặc từ chối đăng ký
  - Gửi thông báo cho người đăng ký
  - Quản lý danh sách chờ

  Điểm danh:
  - Tạo mã QR cho hoạt động
  - In hoặc hiển thị mã QR
  - Xem danh sách điểm danh
  - Xác nhận điểm danh thủ công nếu cần

  Bằng chứng:
  - Xem bằng chứng được nộp
  - Phê duyệt hoặc từ chối bằng chứng
  - Yêu cầu nộp lại nếu cần
  - Giải thích lý do từ chối

  Báo cáo:
  - Xem thống kê tham gia
  - Xuất danh sách tham gia
  - Theo dõi tỷ lệ hoàn thành`,
   category: 'guide',
   tags: ['quản lý', 'hoạt động', 'nhân viên'],
   allowedRoles: ['staff', 'admin'],
   priority: 8
  }
  ];

  async function seedRules() {
  try {
    // Connect to MongoDB (same way as add_student_roles.js)
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    console.log(`📍 Connecting to database: ${dbName}\n`);
    await mongoose.connect(mongoUri, { dbName });
    console.log(`✓ MongoDB connected to database: ${mongoose.connection.name}\n`);

    // Seed rules
    console.log('\n=== SEEDING RULES ===');
    const rulesResult = await ChatbotRule.insertMany(initialRules, { ordered: false });
    console.log(`✓ Seeded ${rulesResult.length} chatbot rules`);

    // Print rules summary
    const ruleCount = await ChatbotRule.countDocuments({ tenantId: 'default' });
    console.log(`Total rules in database: ${ruleCount}`);

    const rules = await ChatbotRule.find({ tenantId: 'default' }).select('pattern priority isActive').lean();
    console.log('Rules:');
    rules.forEach((rule, idx) => {
      console.log(`  ${idx + 1}. ${rule.pattern} (priority: ${rule.priority}, active: ${rule.isActive})`);
    });

    // Seed knowledge base documents (Phase 2)
    console.log('\n=== SEEDING KNOWLEDGE BASE DOCUMENTS ===');
    
    // Generate embeddings for documents
    const docsWithEmbeddings = await Promise.all(
      initialDocuments.map(async (doc) => {
        const embedding = await embeddingService.embed(doc.content);
        return {
          ...doc,
          embedding
        };
      })
    );

    const docsResult = await ChatbotDocument.insertMany(docsWithEmbeddings, { ordered: false });
    console.log(`✓ Seeded ${docsResult.length} knowledge base documents`);

    // Print documents summary
    const docCount = await ChatbotDocument.countDocuments({ tenantId: 'default' });
    console.log(`Total documents in database: ${docCount}`);

    const docs = await ChatbotDocument.find({ tenantId: 'default' }).select('title category priority isActive').lean();
    console.log('Documents:');
    docs.forEach((doc, idx) => {
      console.log(`  ${idx + 1}. ${doc.title} (category: ${doc.category}, priority: ${doc.priority}, active: ${doc.isActive})`);
    });

    await mongoose.connection.close();
    console.log('\n✓ Seed completed successfully (Rules + Documents)');
    process.exit(0);
  } catch (err) {
    console.error('✗ Seed error:', err.message);
    if (err.code === 11000) {
      console.error('Note: Duplicate entries detected. To reseed, delete existing documents first.');
    }
    await mongoose.connection.close();
    process.exit(1);
  }
}

seedRules();
