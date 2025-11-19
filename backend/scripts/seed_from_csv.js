/**
 * Script seed dữ liệu từ CSV file + tạo sample Activities & Registrations
 * Khôi phục dữ liệu ban đầu từ danh sách sinh viên
 * 
 * Dữ liệu:
 * - Import 1000+ sinh viên từ CSV file
 * - Tạo 4 activities mẫu
 * - Tạo multiple registrations cho sinh viên
 * - Tạo student_image (avatar URL)
 * 
 * Cloudinary Setup:
 * 1. Tạo account tại https://cloudinary.com
 * 2. Lấy CLOUDINARY_CLOUD_NAME từ dashboard
 * 3. Thêm vào .env file:
 *    CLOUDINARY_CLOUD_NAME=your_cloud_name
 * 
 * Chạy: node scripts/seed_from_csv.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Models
const User = require('../src/models/user.model');
const StudentProfile = require('../src/models/student_profile.model');
const Falcuty = require('../src/models/falcuty.model');
const Cohort = require('../src/models/cohort.model');
const Activity = require('../src/models/activity.model');
const OrgUnit = require('../src/models/org_unit.model');
const Field = require('../src/models/field.model');
const ActivityRegistration = require('../src/models/activity_registration.model');
const UserRole = require('../src/models/user_role.model');
const Role = require('../src/models/role.model');

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

// Parse CSV file
function parseCSVFile() {
  const csvPath = path.resolve(__dirname, '..', 'public', 'Danh sach sinh vien Gioi nam hoc 22-23 29-9-2023.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  
  const lines = csvContent
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter(line => line.trim().length > 0);

  // Skip header
  const dataLines = lines.slice(1);
  const students = [];

  for (const line of dataLines) {
    const cells = line.split(',');
    if (cells.length < 4) continue;

    const studentNumber = (cells[1] || '').trim();
    const fullName = (cells[2] || '').trim();
    const className = (cells[3] || '').trim();
    const facultyName = (cells[8] || cells[7] || cells[4] || '').trim();
    const gpa = parseFloat(cells[5]) || 0;

    if (!studentNumber || !fullName || !className) continue;

    students.push({
      student_number: studentNumber,
      full_name: fullName,
      className,
      facultyName,
      gpa
    });
  }

  return students;
}

// Derive cohort year from class name
function deriveCohortYearFromClassName(className) {
  if (!className || className.length < 2) return null;
  const prefix = className.slice(0, 2);
  const twoDigits = parseInt(prefix, 10);
  if (Number.isNaN(twoDigits)) return null;
  return 2000 + twoDigits;
}

// Generate random phone number (Việt Nam format)
function generatePhone() {
  const operators = ['32', '33', '34', '35', '36', '37', '38', '39', '70', '71', '72', '73', '74', '75', '76', '77', '78', '79', '80', '81', '82', '83', '84', '85', '86', '87', '88', '89', '90', '91', '92', '93', '94', '96', '97', '98', '99'];
  const operator = operators[Math.floor(Math.random() * operators.length)];
  const remaining = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  return `0${operator}${remaining}`;
}

// Generate random date of birth
function generateDateOfBirth(enrollmentYear) {
  const year = enrollmentYear - 19;
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1;
  return new Date(year, month - 1, day);
}

// Random gender
function getRandomGender() {
  return Math.random() > 0.5 ? 'Nam' : 'Nữ';
}

// Generate address (bịa)
function generateAddress() {
  const cities = ['Đà Nẵng', 'Hà Nội', 'TP. Hồ Chí Minh', 'Hải Phòng', 'Cần Thơ', 'Huế', 'Quảng Ninh', 'Bắc Ninh', 'Hưng Yên', 'Hải Dương'];
  const streets = ['Đường Nguyễn Tất Thành', 'Đường Trần Hưng Đạo', 'Đường Lê Đại Hành', 'Đường Phạm Văn Đồng', 'Đường Hoàng Minh Giám', 'Đường Cách Mạng Tháng Tám', 'Đường Lý Thái Tổ', 'Đường Võ Văn Kiệt', 'Đường Bạch Đằng', 'Đường Hàng Bông'];
  const number = Math.floor(Math.random() * 500) + 1;
  const city = cities[Math.floor(Math.random() * cities.length)];
  const street = streets[Math.floor(Math.random() * streets.length)];
  return `${number} ${street}, ${city}`;
}

// Generate student avatar URL (sử dụng DiceBear avatar service - miễn phí)
// Frontend có thể upload ảnh thực sau này để replace URL này
function generateStudentAvatarUrl(studentNumber) {
  // Dùng DiceBear avatar service (miễn phí, không cần Cloudinary)
  // Frontend upload ảnh thực → Cloudinary → update URL
  return `https://avatars.dicebear.com/api/adventurer/${studentNumber}.svg`;
}

// Ensure faculty exists
async function ensureFaculty(facultyName) {
  if (!facultyName || !facultyName.trim()) return null;
  const name = facultyName.trim();
  const existing = await Falcuty.findOne({ name });
  if (existing) return existing._id;
  const inserted = await Falcuty.create({ name });
  return inserted._id;
}

// Ensure cohort exists
async function ensureCohort(year) {
  if (!year) return null;
  const existing = await Cohort.findOne({ year });
  if (existing) return existing._id;
  const inserted = await Cohort.create({ year });
  return inserted._id;
}

// Ensure class exists
async function ensureClass(db, name, falcutyId, cohortId) {
  const col = db.collection('class');
  const existing = await col.findOne({ name });
  if (existing) return existing._id;
  const result = await col.insertOne({ name, falcuty_id: falcutyId || null, cohort_id: cohortId || null });
  return result.insertedId;
}

// Main seed function
async function seedDataFromCSV() {
  const db = mongoose.connection.db;
  
  try {
    console.log('═════════════════════════════════════════════════════════════');
    console.log('📥 SEED DỮ LIỆU TỪ CSV FILE');
    console.log('═════════════════════════════════════════════════════════════\n');

    // Step 1: Parse CSV
    console.log('📖 Đang parse CSV file...');
    const csvStudents = parseCSVFile();
    console.log(`✓ Đã parse ${csvStudents.length} sinh viên từ CSV\n`);

    // Step 2: Get student role
    console.log('👥 Đang import sinh viên...');
    const studentRole = await Role.findOne({ name: 'student' });
    if (!studentRole) {
      console.log('   ⚠️  Role "student" không tồn tại trong database');
      process.exit(1);
    }
    console.log(`   ✓ Role "student" found: ${studentRole._id}\n`);
    
    // Get unique classes and faculties
    const uniqueClasses = new Map();
    for (const student of csvStudents) {
      if (!uniqueClasses.has(student.className)) {
        uniqueClasses.set(student.className, {
          facultyName: student.facultyName,
          cohortYear: deriveCohortYearFromClassName(student.className)
        });
      }
    }

    // Ensure faculties and cohorts
    const classMap = new Map(); // className -> _id
    for (const [className, info] of uniqueClasses.entries()) {
      const falcutyId = await ensureFaculty(info.facultyName);
      const cohortId = await ensureCohort(info.cohortYear);
      const classId = await ensureClass(db, className, falcutyId, cohortId);
      classMap.set(className, classId);
    }

    // Insert students
    console.log('👤 Đang tạo User và StudentProfile...');
    let importedCount = 0;
    
    for (const csvStudent of csvStudents) {
      const classId = classMap.get(csvStudent.className);
      const email = `${csvStudent.student_number}@sv1.dut.udn.vn`.toLowerCase();
      
      try {
        // Check if student already exists
        let student = await StudentProfile.findOne({ student_number: csvStudent.student_number });
        let userId = null;
        
        // 1. TẠO/KIỂM TRA USER TRƯỚC (Username + Password = Student Number)
        let user = await User.findOne({ username: csvStudent.student_number });
        if (!user) {
          // Hash password trước khi lưu
          const hashedPassword = await bcrypt.hash(csvStudent.student_number, 10);
          
          user = await User.create({
            username: csvStudent.student_number,
            password_hash: hashedPassword,
            active: true,
            isLocked: false
          });

          // Gán role student cho user
          await UserRole.create({
            user_id: user._id,
            role_id: studentRole._id
          });
        }
        userId = user._id;
        
        if (!student) {
          // 2. TẠO STUDENT PROFILE VỚI USER_ID
          student = await StudentProfile.create({
            user_id: userId,
            student_number: csvStudent.student_number,
            full_name: csvStudent.full_name,
            date_of_birth: generateDateOfBirth(deriveCohortYearFromClassName(csvStudent.className)),
            gender: getRandomGender(),
            email,
            phone: generatePhone(),
            class_id: classId,
            student_image: generateStudentAvatarUrl(csvStudent.student_number),
            contact_address: generateAddress(),
            isClassMonitor: false
          });
        } else {
          // Update existing student with missing data
          const updates = {};
          
          // Nếu không có user_id, gán vào
          if (!student.user_id) {
            updates.user_id = userId;
          }
          
          if (!student.email) updates.email = email;
          if (!student.phone) updates.phone = generatePhone();
          if (!student.date_of_birth) updates.date_of_birth = generateDateOfBirth(deriveCohortYearFromClassName(csvStudent.className));
          if (!student.gender) updates.gender = getRandomGender();
          if (!student.student_image) updates.student_image = generateStudentAvatarUrl(csvStudent.student_number);
          if (!student.contact_address) updates.contact_address = generateAddress();
          if (!student.class_id) updates.class_id = classId;
          
          if (Object.keys(updates).length > 0) {
            student = await StudentProfile.findByIdAndUpdate(student._id, updates, { new: true });
          }
        }

        importedCount++;
        
        // Progress indicator
        if (importedCount % 100 === 0) {
          process.stdout.write(`\r   ⏳ Đã xử lý: ${importedCount}/${csvStudents.length}`);
        }
      } catch (err) {
        console.error(`\n✗ Lỗi xử lý sinh viên ${csvStudent.student_number}: ${err.message}`);
      }
    }

    console.log(`\r✓ Đã import/cập nhật ${importedCount} sinh viên\n`);

    // Step 3: Ensure org units and fields
    console.log('🏢 Đang setup org units và fields...');
    
    let orgUnit = await OrgUnit.findOne({ name: 'Đoàn trường' });
    if (!orgUnit) {
      orgUnit = await OrgUnit.create({ name: 'Đoàn trường' });
    }

    let field = await Field.findOne({ name: 'Lễ tết' });
    if (!field) {
      field = await Field.create({ name: 'Lễ tết' });
    }

    console.log(`✓ OrgUnit ID: ${orgUnit._id}`);
    console.log(`✓ Field ID: ${field._id}\n`);

    // Step 4: Create sample activities
    console.log('📋 Đang tạo sample activities...');
    
    const activities = [
      {
        title: 'AI Seminar',
        description: 'Tìm hiểu về AI và Machine Learning',
        location: 'A101',
        start_time: new Date('2024-02-15T14:00:00'),
        end_time: new Date('2024-02-15T17:00:00'),
        capacity: 100,
        registration_open: new Date('2024-02-01T00:00:00'),
        registration_close: new Date('2024-02-14T23:59:59'),
        status: 'approved',
        org_unit_id: orgUnit._id,
        field_id: field._id,
      },
      {
        title: 'Machine Learning Workshop',
        description: 'Workshop thực hành Machine Learning',
        location: 'B202',
        start_time: new Date('2024-02-20T09:00:00'),
        end_time: new Date('2024-02-20T12:00:00'),
        capacity: 50,
        registration_open: new Date('2024-02-05T00:00:00'),
        registration_close: new Date('2024-02-19T23:59:59'),
        status: 'approved',
        org_unit_id: orgUnit._id,
        field_id: field._id,
      },
      {
        title: 'Web Development Bootcamp',
        description: 'Khóa học phát triển web từ cơ bản đến nâng cao',
        location: 'C303',
        start_time: new Date('2024-03-01T08:00:00'),
        end_time: new Date('2024-03-01T17:00:00'),
        capacity: 80,
        registration_open: new Date('2024-02-15T00:00:00'),
        registration_close: new Date('2024-02-28T23:59:59'),
        status: 'approved',
        org_unit_id: orgUnit._id,
        field_id: field._id,
      },
      {
        title: 'Cloud Computing Masterclass',
        description: 'Tìm hiểu về Cloud Computing và DevOps',
        location: 'D404',
        start_time: new Date('2024-03-10T10:00:00'),
        end_time: new Date('2024-03-10T16:00:00'),
        capacity: 60,
        registration_open: new Date('2024-02-20T00:00:00'),
        registration_close: new Date('2024-03-09T23:59:59'),
        status: 'approved',
        org_unit_id: orgUnit._id,
        field_id: field._id,
      }
    ];

    const createdActivities = [];
    for (const activityData of activities) {
      let activity = await Activity.findOne({ title: activityData.title });
      if (!activity) {
        activity = await Activity.create(activityData);
      }
      createdActivities.push(activity);
      console.log(`✓ Activity: ${activity.title} (ID: ${activity._id})`);
    }
    console.log('');

    // Step 5: Create registrations
    console.log('📝 Đang tạo activity registrations...');
    
    // Get some random students for registration
    const students = await StudentProfile.find().limit(200);
    const statuses = ['pending', 'approved', 'rejected'];
    let registrationCount = 0;

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      
      // Random activity (2-3 per student)
      const activityCount = Math.floor(Math.random() * 2) + 2;
      const selectedActivities = [];
      
      for (let j = 0; j < activityCount; j++) {
        const activityIdx = (i + j) % createdActivities.length;
        selectedActivities.push(createdActivities[activityIdx]);
      }

      for (const activity of selectedActivities) {
        // Check if already registered
        const existing = await ActivityRegistration.findOne({
          activity_id: activity._id,
          student_id: student._id
        });

        if (!existing) {
          const status = statuses[Math.floor(Math.random() * statuses.length)];
          const registeredAt = new Date();
          
          const registrationData = {
            activity_id: activity._id,
            student_id: student._id,
            registered_at: registeredAt,
            status: status,
            approval_note: null,
            approved_by: null,
            approved_at: status === 'approved' ? new Date(registeredAt.getTime() + 3600000) : null,
            cancellation_reason: null,
            cancelled_at: null,
            cancelled_by: null,
            status_history: [
              {
                status: 'pending',
                changed_at: registeredAt,
                changed_by: null,
                reason: 'Initial registration'
              }
            ]
          };

          if (status === 'approved') {
            registrationData.status_history.push({
              status: 'approved',
              changed_at: registrationData.approved_at,
              changed_by: null,
              reason: 'Auto approved'
            });
          }

          if (status === 'rejected') {
            registrationData.status_history.push({
              status: 'rejected',
              changed_at: new Date(registeredAt.getTime() + 7200000),
              changed_by: null,
              reason: 'Capacity exceeded'
            });
          }

          await ActivityRegistration.create(registrationData);
          registrationCount++;
          }
          }
          }

    console.log(`✓ Đã tạo ${registrationCount} activity registrations\n`);

    // Summary
    console.log('═════════════════════════════════════════════════════════════');
    console.log('✅ SEED DỮ LIỆU HOÀN TẤT!');
    console.log('═════════════════════════════════════════════════════════════\n');

    console.log('📊 Thống kê:');
    console.log(`   ✓ Sinh viên: ${importedCount}`);
    console.log(`   ✓ Activities: ${createdActivities.length}`);
    console.log(`   ✓ Registrations: ${registrationCount}`);
    console.log(`   ✓ Lớp học: ${uniqueClasses.size}`);
    console.log('');

    console.log('💡 Dữ liệu mẫu:');
    if (students.length > 0) {
      console.log(`   - Student ID (sample): ${students[0]._id}`);
      console.log(`   - Student Number: ${students[0].student_number}`);
    }
    if (createdActivities.length > 0) {
      console.log(`   - Activity ID (sample): ${createdActivities[0]._id}`);
      console.log(`   - Activity: ${createdActivities[0].title}`);
    }
    console.log('\n');

  } catch (err) {
    console.error('✗ Lỗi seed dữ liệu:', err.message);
    console.error(err);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Kết nối MongoDB đã đóng');
    process.exit(0);
  }
}

// Run
connectDB().then(() => seedDataFromCSV());
