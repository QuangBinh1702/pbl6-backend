/**
 * Import JSON data from pbl6_json folder to MongoDB
 * Handles $oid and $date format conversion
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const JSON_DIR = 'C:\\Users\\ADMIN\\Downloads\\pbl6_json';
const DB_NAME = 'Community_Activity_Management';

// Collection mapping (JSON file name → MongoDB collection name)
const COLLECTION_MAPPING = {
  'Community_Activity_Management.user.json': 'users',
  'Community_Activity_Management.role.json': 'roles',
  'Community_Activity_Management.permission.json': 'permissions',
  'Community_Activity_Management.org_unit.json': 'orgunits',
  'Community_Activity_Management.falcuty.json': 'falcuties',
  'Community_Activity_Management.field.json': 'fields',
  'Community_Activity_Management.cohort.json': 'cohorts',
  'Community_Activity_Management.class.json': 'classes',
  'Community_Activity_Management.student_profile.json': 'studentprofiles',
  'Community_Activity_Management.staff_profile.json': 'staffprofiles',
  'Community_Activity_Management.student_cohort.json': 'studentcohorts',
  'Community_Activity_Management.activity.json': 'activities',
  'Community_Activity_Management.activity_eligiblity.json': 'activity_eligiblities',
  'Community_Activity_Management.activity_registration.json': 'activityregistrations',
  'Community_Activity_Management.attendance.json': 'attendances',
  'Community_Activity_Management.evidence.json': 'evidences',
  'Community_Activity_Management.pvcd_record.json': 'pvcdrecords',
  'Community_Activity_Management.post.json': 'posts',
  'Community_Activity_Management.student_feedback.json': 'studentfeedbacks',
  'Community_Activity_Management.role_permission.json': 'role_permissions',
  'Community_Activity_Management.user_role.json': 'userroles'
};

// Import order (to respect foreign key constraints)
const IMPORT_ORDER = [
  'user',
  'role',
  'permission',
  'org_unit',
  'falcuty',
  'field',
  'cohort',
  'class',
  'student_profile',
  'staff_profile',
  'student_cohort',
  'activity',
  'activity_eligiblity',
  'activity_registration',
  'attendance',
  'evidence',
  'pvcd_record',
  'post',
  'student_feedback',
  'role_permission',
  'user_role'
];

/**
 * Convert MongoDB extended JSON format to native types
 */
function convertExtendedJSON(obj) {
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => convertExtendedJSON(item));
  }
  
  if (typeof obj === 'object') {
    // Handle $oid
    if (obj.$oid) {
      try {
        return new mongoose.Types.ObjectId(obj.$oid);
      } catch (e) {
        console.warn(`Invalid ObjectId: ${obj.$oid}`);
        return obj.$oid;
      }
    }
    
    // Handle $date
    if (obj.$date) {
      return new Date(obj.$date);
    }
    
    // Recursively convert nested objects
    const converted = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertExtendedJSON(value);
    }
    return converted;
  }
  
  return obj;
}

/**
 * Import a single JSON file
 */
async function importFile(fileName, collectionName, db) {
  try {
    const filePath = path.join(JSON_DIR, fileName);
    
    if (!fs.existsSync(filePath)) {
      console.log(`  ⚠️  File not found: ${fileName}`);
      return 0;
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    let data = JSON.parse(fileContent);
    
    if (!Array.isArray(data)) {
      data = [data];
    }
    
    if (data.length === 0) {
      console.log(`  ⏭️  No data in ${fileName}`);
      return 0;
    }
    
    // Convert extended JSON format
    const convertedData = data.map(doc => convertExtendedJSON(doc));
    
    // Get collection
    const collection = db.collection(collectionName);
    
    // Delete existing data (optional - comment out to preserve)
    await collection.deleteMany({});
    
    // Insert data
    const result = await collection.insertMany(convertedData, { ordered: false });
    
    return result.insertedCount;
  } catch (err) {
    console.error(`  ❌ Error importing ${fileName}:`, err.message);
    return 0;
  }
}

/**
 * Main import function
 */
async function importAllData() {
  try {
    console.log('\n' + '='.repeat(70));
    console.log('📥 IMPORTING JSON DATA TO MONGODB');
    console.log('='.repeat(70) + '\n');
    
    console.log(`📂 Source directory: ${JSON_DIR}`);
    console.log(`🗄️  Target database: ${DB_NAME}\n`);
    
    // Connect to MongoDB
    console.log('⏳ Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, { dbName: DB_NAME });
    const db = mongoose.connection.db;
    console.log('✅ Connected!\n');
    
    let totalImported = 0;
    const summary = [];
    
    // Import files in order
    for (const shortName of IMPORT_ORDER) {
      const fileName = `Community_Activity_Management.${shortName}.json`;
      const collectionName = COLLECTION_MAPPING[fileName];
      
      if (!collectionName) {
        console.log(`⏭️  Skipping ${shortName} (no mapping)`);
        continue;
      }
      
      console.log(`📄 Importing ${shortName}...`);
      const count = await importFile(fileName, collectionName, db);
      
      totalImported += count;
      summary.push({ collection: collectionName, count });
      
      if (count > 0) {
        console.log(`  ✅ Imported ${count} documents\n`);
      }
    }
    
    console.log('='.repeat(70));
    console.log('✅ IMPORT COMPLETED!');
    console.log('='.repeat(70));
    
    console.log('\n📊 Summary:');
    summary.forEach(({ collection, count }) => {
      if (count > 0) {
        console.log(`  ${collection}: ${count} documents`);
      }
    });
    console.log(`\n  Total: ${totalImported} documents imported`);
    
    // Verify import
    console.log('\n🔍 Verifying collections...');
    const collections = await db.listCollections().toArray();
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`  ${col.name}: ${count} documents`);
    }
    
    console.log('\n💡 Next steps:');
    console.log('  1. Run: node seed_new_permission_data.js (to setup permission system)');
    console.log('  2. Run: node test_new_permission_system.js (to test)');
    console.log('  3. Start server: npm run dev\n');
    
  } catch (err) {
    console.error('\n❌ Import failed:', err.message);
    console.error(err.stack);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Connection closed\n');
  }
}

// Run import
importAllData();

