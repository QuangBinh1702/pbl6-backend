/**
 * Backfill PVCD records from Attendance + Evidence
 * 
 * Logic:
 * BƯỚC 1: Kiểm tra Attendance
 *   - Nếu có dữ liệu Attendance → Tạo PVCD records với total_point = attendance_points
 * 
 * BƯỚC 2: Kiểm tra Evidence (minh chứng đã được chấp nhận)
 *   - Nếu có Evidence đã approve → Cộng thêm faculty_point vào total_point
 *   - Nếu chưa có PVCD record cho (student_id, year) → Tạo mới
 * 
 * ⚠️ CHỈ SỬ DỤNG DỮ LIỆU THỰC TỪ DATABASE - KHÔNG TẠO DỮ LIỆU GIẢ
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Models
const PvcdRecord = require('../src/models/pvcd_record.model');
const Evidence = require('../src/models/evidence.model');
const Attendance = require('../src/models/attendance.model');
const StudentProfile = require('../src/models/student_profile.model');

// Connect to MongoDB
async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_NAME || 'Community_Activity_Management';
    console.log(`📍 Connecting to: ${dbName}\n`);
    await mongoose.connect(mongoUri, { dbName });
    console.log('✅ MongoDB connected\n');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
}

async function backfillPvcdFromEvidence() {
  try {
    console.log('═════════════════════════════════════════════════════════════');
    console.log('🔄 BACKFILL PVCD RECORDS TỪ DỮ LIỆU THỰC');
    console.log('═════════════════════════════════════════════════════════════\n');

    // Clear old PVCD records
    const deleteResult = await PvcdRecord.deleteMany({});
    console.log(`🗑️  Đã xóa ${deleteResult.deletedCount} PVCD records cũ\n`);

    // ============================================================
    // BƯỚC 1: XỬ LÝ ATTENDANCE - TẠO PVCD RECORDS TỪ ATTENDANCE
    // ============================================================
    console.log('═════════════════════════════════════════════════════════════');
    console.log('📋 BƯỚC 1: KIỂM TRA VÀ TẠO PVCD RECORDS TỪ ATTENDANCE');
    console.log('═════════════════════════════════════════════════════════════\n');

    console.log('📥 Đang lấy dữ liệu Attendance từ database...');
    const allAttendances = await Attendance.find({
      scanned_at: { $exists: true, $ne: null },
      student_id: { $exists: true, $ne: null }
    })
      .populate('student_id')
      .lean();

    console.log(`📊 Tìm thấy ${allAttendances.length} attendance records (có scanned_at)\n`);

    if (allAttendances.length === 0) {
      console.log('⚠️  Không có dữ liệu Attendance trong database!\n');
    } else {

      // Group Attendance by (student_id, year)
      const attendanceGrouped = {};
      let skippedAttendances = 0;

      console.log('🔄 Đang xử lý attendance records...');
      allAttendances.forEach(att => {
        // Validate: phải có student_id và scanned_at hợp lệ
        if (!att.student_id || !att.scanned_at) {
          skippedAttendances++;
          return;
        }

        const studentId = att.student_id._id || att.student_id;
        if (!studentId) {
          skippedAttendances++;
          return;
        }

        const scannedDate = new Date(att.scanned_at);
        if (isNaN(scannedDate.getTime())) {
          skippedAttendances++;
          return;
        }

        const year = scannedDate.getFullYear();
        const key = `${studentId}_${year}`;

        if (!attendanceGrouped[key]) {
          attendanceGrouped[key] = {
            student_id: studentId,
            year,
            attendance_points: 0,
            attendance_count: 0,
            student_name: att.student_id?.full_name || 'Unknown'
          };
        }

        // Use 'points' field (FINAL TOTAL POINTS per activity)
        const points = parseFloat(att.points) || 0;
        attendanceGrouped[key].attendance_points += points;
        attendanceGrouped[key].attendance_count += 1;
      });

      if (skippedAttendances > 0) {
        console.log(`   ⚠️  Bỏ qua ${skippedAttendances} attendance records không hợp lệ`);
      }

      console.log(`🔢 Tìm thấy ${Object.keys(attendanceGrouped).length} student-year combinations từ Attendance\n`);

      // Tạo PVCD records từ Attendance
      console.log('🔄 Đang tạo PVCD records từ Attendance...\n');
      let attendanceCreated = 0;
      let skippedStudents = 0;

      for (const rec of Object.values(attendanceGrouped)) {
        // Verify student exists in database
        const student = await StudentProfile.findById(rec.student_id);
        if (!student) {
          console.warn(`⚠️  Student không tồn tại: ${rec.student_id}`);
          skippedStudents++;
          continue;
        }

        // Validate year
        if (!rec.year || rec.year < 1900 || rec.year > 2100) {
          console.warn(`⚠️  Năm không hợp lệ: ${rec.year} cho student ${rec.student_id}`);
          skippedStudents++;
          continue;
        }

        // Tạo PVCD record với total_point = attendance_points
        const result = await PvcdRecord.findOneAndUpdate(
          {
            student_id: rec.student_id,
            year: rec.year
          },
          {
            student_id: rec.student_id,
            year: rec.year,
            total_point: rec.attendance_points,  // ✅ CHỈ ĐIỂM TỪ ATTENDANCE
            start_year: new Date(`${rec.year}-01-01`),
            end_year: new Date(`${rec.year}-12-31`)
          },
          { upsert: true, new: true }
        );

        if (result.isNew || result.__v === 0) {
          attendanceCreated++;
        }
      }

      if (skippedStudents > 0) {
        console.log(`⚠️  Đã bỏ qua ${skippedStudents} records do student không tồn tại`);
      }

      console.log(`✅ Đã tạo ${attendanceCreated} PVCD records từ Attendance\n`);
    }

    // ============================================================
    // BƯỚC 2: XỬ LÝ EVIDENCE - CỘNG THÊM ĐIỂM VÀO TOTAL_POINT
    // ============================================================
    console.log('═════════════════════════════════════════════════════════════');
    console.log('📋 BƯỚC 2: KIỂM TRA EVIDENCE VÀ CỘNG ĐIỂM VÀO TOTAL_POINT');
    console.log('═════════════════════════════════════════════════════════════\n');

    console.log('📥 Đang lấy dữ liệu Evidence (đã approve) từ database...');
    const allEvidences = await Evidence.find({
      status: 'approved',
      submitted_at: { $exists: true, $ne: null },
      student_id: { $exists: true, $ne: null }
    })
      .populate('student_id')
      .lean();

    console.log(`📊 Tìm thấy ${allEvidences.length} evidence records (đã approved)\n`);

    if (allEvidences.length === 0) {
      console.log('⚠️  Không có Evidence đã approve trong database!\n');
    } else {
      // Group Evidence by (student_id, year)
      const evidenceGrouped = {};
      let skippedEvidences = 0;

      console.log('🔄 Đang xử lý evidence records...');
      allEvidences.forEach(ev => {
        // Validate: phải có student_id và submitted_at hợp lệ
        if (!ev.student_id || !ev.submitted_at) {
          skippedEvidences++;
          return;
        }

        const studentId = ev.student_id._id || ev.student_id;
        if (!studentId) {
          skippedEvidences++;
          return;
        }

        const submittedDate = new Date(ev.submitted_at);
        if (isNaN(submittedDate.getTime())) {
          skippedEvidences++;
          return;
        }

        const year = submittedDate.getFullYear();
        const key = `${studentId}_${year}`;

        if (!evidenceGrouped[key]) {
          evidenceGrouped[key] = {
            student_id: studentId,
            year,
            evidence_points: 0,
            evidence_count: 0,
            student_name: ev.student_id?.full_name || 'Unknown'
          };
        }

        const facultyPoint = parseFloat(ev.faculty_point) || 0;
        evidenceGrouped[key].evidence_points += facultyPoint;
        evidenceGrouped[key].evidence_count += 1;
      });

      if (skippedEvidences > 0) {
        console.log(`   ⚠️  Bỏ qua ${skippedEvidences} evidence records không hợp lệ`);
      }

      console.log(`🔢 Tìm thấy ${Object.keys(evidenceGrouped).length} student-year combinations từ Evidence\n`);

      // Cộng thêm điểm Evidence vào PVCD records
      console.log('🔄 Đang cộng thêm điểm Evidence vào PVCD records...\n');
      let evidenceUpdated = 0;
      let evidenceCreated = 0;
      let skippedEvidenceStudents = 0;

      for (const rec of Object.values(evidenceGrouped)) {
        // Verify student exists in database
        const student = await StudentProfile.findById(rec.student_id);
        if (!student) {
          console.warn(`⚠️  Student không tồn tại: ${rec.student_id}`);
          skippedEvidenceStudents++;
          continue;
        }

        // Validate year
        if (!rec.year || rec.year < 1900 || rec.year > 2100) {
          console.warn(`⚠️  Năm không hợp lệ: ${rec.year} cho student ${rec.student_id}`);
          skippedEvidenceStudents++;
          continue;
        }

        // Tìm PVCD record hiện có
        const existingRecord = await PvcdRecord.findOne({
          student_id: rec.student_id,
          year: rec.year
        });

        if (existingRecord) {
          // Cộng thêm điểm Evidence vào total_point
          const newTotalPoint = (existingRecord.total_point || 0) + rec.evidence_points;
          await PvcdRecord.findOneAndUpdate(
            {
              student_id: rec.student_id,
              year: rec.year
            },
            {
              total_point: newTotalPoint  // ✅ CỘNG THÊM ĐIỂM EVIDENCE
            }
          );
          evidenceUpdated++;
        } else {
          // Nếu chưa có PVCD record, tạo mới với điểm Evidence
          await PvcdRecord.create({
            student_id: rec.student_id,
            year: rec.year,
            total_point: rec.evidence_points,  // ✅ CHỈ ĐIỂM TỪ EVIDENCE
            start_year: new Date(`${rec.year}-01-01`),
            end_year: new Date(`${rec.year}-12-31`)
          });
          evidenceCreated++;
        }
      }

      if (skippedEvidenceStudents > 0) {
        console.log(`⚠️  Đã bỏ qua ${skippedEvidenceStudents} records do student không tồn tại`);
      }

      console.log(`✅ Đã cập nhật ${evidenceUpdated} PVCD records (cộng thêm điểm Evidence)`);
      console.log(`✅ Đã tạo ${evidenceCreated} PVCD records mới (chỉ có điểm Evidence)\n`);
    }

    // ============================================================
    // THỐNG KÊ KẾT QUẢ
    // ============================================================
    console.log('═════════════════════════════════════════════════════════════');
    console.log('📊 THỐNG KÊ KẾT QUẢ');
    console.log('═════════════════════════════════════════════════════════════\n');

    // Verify results
    const finalCount = await PvcdRecord.countDocuments();
    console.log(`📈 Tổng số PVCD records trong database: ${finalCount}`);

    // Sample output
    const samples = await PvcdRecord.find()
      .limit(10)
      .populate('student_id', 'full_name student_number')
      .lean();

    if (samples.length > 0) {
      console.log('\n📋 Mẫu PVCD records:');
      samples.forEach((rec, i) => {
        console.log(
          `  ${i + 1}. ${rec.student_id?.full_name || 'N/A'} (${rec.student_id?.student_number || 'N/A'}) - ${rec.year}: ${rec.total_point} điểm`
        );
      });
    }

    console.log('\n═════════════════════════════════════════════════════════════');
    console.log('✅ HOÀN TẤT! Tất cả dữ liệu được tạo từ database thực');
    console.log('═════════════════════════════════════════════════════════════\n');

  } catch (err) {
    console.error('❌ Lỗi trong quá trình backfill:', err);
    console.error(err);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Kết nối MongoDB đã đóng');
    process.exit(0);
  }
}

// Run
connectDB().then(() => backfillPvcdFromEvidence());
