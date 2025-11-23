/**
 * Thêm các trường founded_date, achievements, description vào bảng org_unit
 * 
 * Chạy: node scripts/add_org_unit_fields.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Models
const OrgUnit = require('../src/models/org_unit.model');

// Connect to MongoDB
async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_NAME || 'Community_Activity_Management';
    console.log(`📍 Connecting to: ${dbName}\n`);
    await mongoose.connect(mongoUri, { dbName });
    console.log('✓ MongoDB connected\n');
  } catch (err) {
    console.error('✗ MongoDB connection error:', err.message);
    process.exit(1);
  }
}

// Main function
async function addOrgUnitFields() {
  try {
    console.log('═════════════════════════════════════════════════════════════');
    console.log('🏢 THÊM TRƯỜNG VÀO BẢNG ORG_UNIT');
    console.log('═════════════════════════════════════════════════════════════\n');

    // Step 1: Kiểm tra các trường cần thêm
    console.log('🔍 Kiểm tra schema org_unit...');
    const orgUnitCollection = mongoose.connection.collection('org_unit');
    const sampleDoc = await orgUnitCollection.findOne({});
    
    const missingFields = [];
    if (!sampleDoc || sampleDoc.founded_date === undefined) {
      missingFields.push('founded_date');
    }
    if (!sampleDoc || sampleDoc.achievements === undefined) {
      missingFields.push('achievements');
    }
    if (!sampleDoc || sampleDoc.description === undefined) {
      missingFields.push('description');
    }

    if (missingFields.length === 0) {
      console.log('   ⚠️  Tất cả các trường đã tồn tại trong database\n');
    } else {
      console.log(`   ✓ Sẽ thêm các trường: ${missingFields.join(', ')}\n`);
    }

    // Step 2: Lấy tất cả org_unit
    console.log('🏢 Tìm tất cả org_unit...');
    const allOrgUnits = await OrgUnit.find();
    console.log(`   ✓ Tìm thấy ${allOrgUnits.length} org_unit\n`);

    // Data mẫu cho các org_unit
    const sampleData = {
      'Khoa Công Nghệ Thông Tin': {
        founded_date: new Date('2000-01-01'),
        achievements: [
          'Top 3 Quốc Gia Về Tré 2020',
          'Tổ chức 50+ workshop trong 3 năm gần nhất',
          'Hợp tác cùng Google Developer Group Việt Nam - 2024'
        ],
        description: 'Khoa Công Nghệ Thông Tin - Trung tâm đào tạo lập trình viên chất lượng cao, với cơ sở vật chất hiện đại và giảng viên giàu kinh nghiệm. Chuyên đào tạo các ngành: Khoa học máy tính, Kỹ thuật phần mềm, An toàn thông tin.'
      },
      'Phòng Đào tạo': {
        founded_date: new Date('1995-06-15'),
        achievements: [
          'Quản lý 150+ lớp học hàng năm',
          'Tỷ lệ sinh viên tốt nghiệp đạt loại giỏi: 45%',
          'Cải cách quy trình đào tạo năm 2023'
        ],
        description: 'Phòng Đào tạo - Bộ phận chịu trách nhiệm quản lý các chương trình học, xây dựng thứ tự khai giảng và công tác tài vụ học sinh. Đảm bảo chất lượng đào tạo theo tiêu chuẩn quốc tế.'
      },
      'Đoàn trường': {
        founded_date: new Date('2005-09-20'),
        achievements: [
          'Tổ chức 100+ sự kiện sinh viên mỗi năm',
          'Cộng tác viên: 500+ sinh viên tích cực',
          'Giải thưởng Đoàn Thanh niên xuất sắc 2023'
        ],
        description: 'Đoàn trường - Tổ chức Đoàn Thanh niên Cộng sản Hồ Chí Minh của trường. Tổ chức các hoạt động rèn luyện, nâng cao ý thức xã hội và kỹ năng lãnh đạo cho sinh viên.'
      }
    };

    // Step 3: Cập nhật các trường với dữ liệu mẫu
    console.log('📝 Cập nhật các trường cho org_unit...\n');
    let updated = 0;

    for (const orgUnit of allOrgUnits) {
      const updateData = {};
      let needsUpdate = false;

      // Thêm founded_date nếu chưa có
      if (!orgUnit.founded_date) {
        updateData.founded_date = sampleData[orgUnit.name]?.founded_date || null;
        needsUpdate = true;
      }

      // Thêm achievements nếu chưa có
      if (!orgUnit.achievements || orgUnit.achievements.length === 0) {
        updateData.achievements = sampleData[orgUnit.name]?.achievements || [];
        needsUpdate = true;
      }

      // Thêm description nếu chưa có
      if (!orgUnit.description || orgUnit.description === '') {
        updateData.description = sampleData[orgUnit.name]?.description || '';
        needsUpdate = true;
      }

      if (needsUpdate) {
        await OrgUnit.findByIdAndUpdate(
          orgUnit._id,
          updateData,
          { new: true }
        );
        updated++;
        console.log(`   ✓ ${orgUnit.name}`);
      }
    }

    console.log();

    // Summary
    console.log('═════════════════════════════════════════════════════════════');
    console.log('✅ HOÀN TẤT!');
    console.log('═════════════════════════════════════════════════════════════\n');

    console.log('📊 Thống kê:');
    console.log(`   ✓ Tổng org_unit: ${allOrgUnits.length}`);
    console.log(`   ✓ Org_unit đã được cập nhật: ${updated}`);
    console.log(`   ✓ Org_unit đã có đầy đủ trường: ${allOrgUnits.length - updated}`);
    console.log();

  } catch (err) {
    console.error('✗ Lỗi:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Kết nối MongoDB đã đóng');
    process.exit(0);
  }
}

// Run
connectDB().then(() => addOrgUnitFields());
