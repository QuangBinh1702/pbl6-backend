const mongoose = require('mongoose');
const Regulation = require('./src/models/regulation.model');
require('dotenv').config();

const regulations = [
  {
    title: 'Quy định về điểm danh hoạt động',
    description: 'Sinh viên phải có mặt đúng giờ. Muộn trên 15 phút sẽ được coi là vắng mặt. Mỗi lần vắng mặt sẽ bị trừ điểm học tập.',
    category: 'attendance',
    keywords: ['điểm danh', 'giờ', 'muộn', 'vắng mặt', 'mặt', 'hoạt động']
  },
  {
    title: 'Quy định nộp báo cáo hoạt động',
    description: 'Báo cáo phải được nộp trong vòng 3 ngày sau khi hoạt động kết thúc. Báo cáo trễ sẽ bị trừ 20% điểm.',
    category: 'submission',
    keywords: ['báo cáo', 'nộp', 'submission', 'deadline', 'trễ']
  },
  {
    title: 'Quy định hành vi trong hoạt động',
    description: 'Sinh viên phải có thái độ tôn trọng, không gây rối hay làm ảnh hưởng đến hoạt động. Vi phạm sẽ bị cảnh cáo hoặc kỷ luật.',
    category: 'behavior',
    keywords: ['hành vi', 'tôn trọng', 'gây rối', 'kỷ luật', 'cảnh cáo']
  },
  {
    title: 'Quy định tính điểm học tập từ hoạt động',
    description: 'Mỗi hoạt động có thể có điểm từ 1-10. Tổng điểm học tập = tổng điểm từ tất cả hoạt động / số hoạt động. Điểm tối đa là 100.',
    category: 'points',
    keywords: ['điểm', 'tính điểm', 'points', 'học tập', 'tổng']
  },
  {
    title: 'Quy định hoạt động bắt buộc',
    description: 'Sinh viên bắt buộc phải tham gia tối thiểu 1 hoạt động bắt buộc mỗi học kỳ. Không tham gia sẽ bị cảnh cáo.',
    category: 'general',
    keywords: ['bắt buộc', 'phải', 'tham gia', 'hoạt động', 'học kỳ']
  },
  {
    title: 'Quy định xin phép vắng hoạt động',
    description: 'Để xin phép vắng, sinh viên phải nộp đơn trước 24 giờ kèm theo giấy tờ chứng minh (bệnh tật, gia đình...). Phép sẽ được xem xét bởi lớp trưởng.',
    category: 'general',
    keywords: ['xin phép', 'vắng', 'đơn', 'giấy chứng minh', 'lớp trưởng']
  },
  {
    title: 'Quy định chứng chỉ hoạt động',
    description: 'Sau khi hoàn thành hoạt động, sinh viên sẽ nhận được chứng chỉ điện tử từ hệ thống. Chứng chỉ có thể được tải về dưới dạng PDF.',
    category: 'general',
    keywords: ['chứng chỉ', 'certificate', 'hoàn thành', 'tải', 'PDF']
  }
];

async function seedRegulations() {
  try {
    // Kết nối MongoDB
    const mongoUri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_NAME || 'Community_Activity_Management';
    
    await mongoose.connect(mongoUri, { dbName });

    console.log('Connected to MongoDB');

    // Xóa các quy định cũ (tùy chọn)
    // await Regulation.deleteMany({});

    // Thêm quy định mới
    const result = await Regulation.insertMany(regulations);
    console.log(`Successfully added ${result.length} regulations`);

    process.exit(0);
  } catch (err) {
    console.error('Error seeding regulations:', err.message);
    process.exit(1);
  }
}

seedRegulations();
