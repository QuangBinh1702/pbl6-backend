/**
 * Migration Script: Thêm trường position (chức vụ) vào staff_profile
 * Script này sẽ thêm trường position vào tất cả các staff profile hiện có
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_NAME || 'Community_Activity_Management';
  
  await mongoose.connect(mongoUri, { dbName });
  console.log(`✅ Kết nối database: ${dbName}\n`);
  return mongoose.connection.db;
}

// Hàm xác định position dựa trên staff_number và full_name
function getPositionForStaff(staffNumber, fullName) {
  if (!staffNumber) return 'Nhân viên';
  
  const staffNum = staffNumber.toUpperCase();
  
  // Dựa vào mã số để xác định chức vụ
  if (staffNum.startsWith('CTSV')) {
    return 'Trưởng phòng'; // Cán bộ CTSV thường là trưởng phòng
  } else if (staffNum.startsWith('DOAN')) {
    return 'Trưởng phòng'; // Cán bộ Đoàn trường
  } else if (staffNum.startsWith('KHOA')) {
    return 'Trưởng khoa'; // Cán bộ Khoa
  } else if (staffNum.startsWith('GV')) {
    return 'Giảng viên'; // Giảng viên
  } else if (staffNum.includes('TRUONG')) {
    return 'Trưởng phòng';
  } else if (staffNum.includes('PHO')) {
    return 'Phó phòng';
  } else if (staffNum.includes('THU_KY') || staffNum.includes('THUKY')) {
    return 'Thư kí';
  }
  
  // Mặc định
  return 'Nhân viên';
}

async function main() {
  try {
    const db = await connectDB();
    const col = db.collection('staff_profile');
    
    console.log('📊 Đang kiểm tra staff profiles...\n');
    
    // Lấy tất cả staff profiles
    const staffProfiles = await col.find({}).toArray();
    const totalCount = staffProfiles.length;
    console.log(`   Tổng số staff profiles: ${totalCount}\n`);
    
    if (totalCount === 0) {
      console.log('⚠️  Không có staff profile nào trong database!\n');
      await mongoose.connection.close();
      return;
    }
    
    console.log('🔄 Đang cập nhật position cho từng staff profile...\n');
    
    let updatedCount = 0;
    const positions = [];
    
    // Cập nhật từng staff profile
    for (const staff of staffProfiles) {
      const staffNumber = staff.staff_number || '';
      const fullName = staff.full_name || '';
      
      // Xác định position
      let position = staff.position;
      
      // Nếu chưa có position hoặc là null, gán giá trị mẫu
      if (!position || position === null) {
        position = getPositionForStaff(staffNumber, fullName);
        
        // Cập nhật trong database
        await col.updateOne(
          { _id: staff._id },
          { $set: { position: position } }
        );
        
        updatedCount++;
        positions.push({
          staff_number: staffNumber,
          full_name: fullName,
          position: position
        });
        
        console.log(`   ✓ ${staffNumber} - ${fullName}: ${position}`);
      } else {
        console.log(`   - ${staffNumber} - ${fullName}: ${position} (đã có)`);
        positions.push({
          staff_number: staffNumber,
          full_name: fullName,
          position: position
        });
      }
    }
    
    console.log(`\n✅ Hoàn thành!`);
    console.log(`   - Tổng số staff profiles: ${totalCount}`);
    console.log(`   - Đã cập nhật position: ${updatedCount} staff profiles\n`);
    
    console.log('📋 Danh sách chức vụ:');
    positions.forEach(p => {
      console.log(`   • ${p.staff_number} - ${p.full_name}: ${p.position}`);
    });
    console.log('');
    
    await mongoose.connection.close();
    console.log('✅ Đã đóng kết nối database\n');
    
  } catch (err) {
    console.error('❌ Lỗi:', err);
    await mongoose.connection.close();
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log('🎉 Migration hoàn tất!\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Lỗi khi chạy migration:', err);
    mongoose.connection.close();
    process.exit(1);
  });

