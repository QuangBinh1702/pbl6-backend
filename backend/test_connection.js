require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('🔄 Đang kết nối MongoDB...');
    console.log(`📍 URI: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/pbl6'}`);
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pbl6', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Kết nối MongoDB thành công!');
    
    // Lấy thông tin server
    const serverInfo = await mongoose.connection.db.admin().serverInfo();
    console.log(`\n📊 MongoDB Server Version: ${serverInfo.version}`);
    
    // List databases
    const admin = mongoose.connection.db.admin();
    const { databases } = await admin.listDatabases();
    console.log('\n📚 Databases có sẵn:');
    databases.forEach(db => {
      console.log(`  - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    
    // List collections trong database hiện tại
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`\n📁 Collections trong database "${mongoose.connection.db.databaseName}":`);
    if (collections.length === 0) {
      console.log('  (chưa có collection nào - chạy seed script để tạo dữ liệu)');
    } else {
      for (const col of collections) {
        const count = await mongoose.connection.db.collection(col.name).countDocuments();
        console.log(`  - ${col.name} (${count} documents)`);
      }
    }
    
    // Test models
    console.log('\n🧪 Test Models:');
    try {
      const Permission = require('./src/models/permission.model');
      const UserPermission = require('./src/models/user_permission.model');
      console.log('  ✅ Permission model - OK');
      console.log('  ✅ UserPermission model - OK');
      
      // Count documents
      const permCount = await Permission.countDocuments();
      const userPermCount = await UserPermission.countDocuments();
      console.log(`\n📈 Thống kê:`);
      console.log(`  - Permissions: ${permCount}`);
      console.log(`  - User Permissions: ${userPermCount}`);
      
      if (permCount > 0) {
        console.log('\n📋 Permissions mẫu:');
        const perms = await Permission.find().limit(3).select('name_per description details');
        perms.forEach(p => {
          console.log(`  - ${p.name_per}: ${p.details.length} actions`);
        });
      }
    } catch (modelError) {
      console.log('  ⚠️  Lỗi khi load models:', modelError.message);
    }
    
    console.log('\n💡 Tips:');
    console.log('  - Chạy seed: node src/seed_permission_system.js');
    console.log('  - Start server: npm run dev');
    console.log('  - Xem hướng dẫn: cat PERMISSION_USAGE.md');
    
  } catch (error) {
    console.error('\n❌ Lỗi kết nối MongoDB:');
    console.error(`   ${error.message}`);
    console.error('\n🔧 Giải pháp:');
    console.error('   1. Kiểm tra MongoDB đã chạy: mongosh');
    console.error('   2. Kiểm tra MONGODB_URI trong file .env');
    console.error('   3. Kiểm tra port 27017 có available không');
    console.error('   4. Restart MongoDB service');
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n👋 Đã đóng kết nối MongoDB');
    }
    process.exit(0);
  }
}

testConnection();


