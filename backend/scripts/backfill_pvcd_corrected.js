/**
 * Backfill PVCD records - CORRECTED VERSION
 * 
 * Logic:
 * - For each (student_id, year) combination
 * - Sum MAX(points) per activity from attendance (handle multiple QR scans)
 * - Sum faculty_point from approved evidences
 * - total_point = attendance_sum + evidence_sum
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Models
const PvcdRecord = require('../src/models/pvcd_record.model');
const Evidence = require('../src/models/evidence.model');
const Attendance = require('../src/models/attendance.model');
const StudentProfile = require('../src/models/student_profile.model');

async function backfillPvcdCorrected() {
  try {
    // Connect to DB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    // Get all attendances & evidences
    const allAttendances = await Attendance.find({
      scanned_at: { $exists: true, $ne: null }
    })
      .populate('student_id')
      .lean();

    const allEvidences = await Evidence.find({
      status: 'approved',
      submitted_at: { $exists: true, $ne: null }
    })
      .populate('student_id')
      .lean();

    console.log(`📊 Found ${allAttendances.length} total attendances`);
    console.log(`📊 Found ${allEvidences.length} approved evidences\n`);

    // ========================================
    // STEP 1: Process ATTENDANCES
    // ========================================
    
    // Group by (student_id, year, activity_id) and get MAX points
    console.log('🔄 Processing attendances (grouping by activity)...');
    const attendancesByActivity = {};
    
    allAttendances.forEach(att => {
      const year = new Date(att.scanned_at).getFullYear();
      const studentId = (att.student_id._id || att.student_id).toString();
      const activityId = (att.activity_id || '').toString();
      const points = parseFloat(att.points) || 0;
      
      // Key: student_id_year_activity_id
      const key = `${studentId}_${year}_${activityId}`;

      if (!attendancesByActivity[key]) {
        attendancesByActivity[key] = {
          student_id: studentId,
          year,
          activity_id: activityId,
          max_points: points,
          scan_count: 1
        };
      } else {
        // Keep the MAX points for this activity
        if (points > attendancesByActivity[key].max_points) {
          attendancesByActivity[key].max_points = points;
        }
        attendancesByActivity[key].scan_count += 1;
      }
    });

    console.log(`✅ Grouped into ${Object.keys(attendancesByActivity).length} unique (student, year, activity) combinations\n`);

    // ========================================
    // STEP 2: Group by (student_id, year)
    // ========================================
    
    console.log('🔄 Aggregating by student and year...');
    const grouped = {};

    // Add attendance data
    Object.values(attendancesByActivity).forEach(act => {
      const key = `${act.student_id}_${act.year}`;

      if (!grouped[key]) {
        grouped[key] = {
          student_id: act.student_id,
          year: act.year,
          attendance_points: 0,
          evidence_points: 0,
          attendance_activities: 0,
          evidence_count: 0,
          student_name: 'Unknown'
        };
      }

      // Add MAX points for this activity
      grouped[key].attendance_points += act.max_points;
      grouped[key].attendance_activities += 1;
    });

    // Add evidence data
    allEvidences.forEach(ev => {
      const year = new Date(ev.submitted_at).getFullYear();
      const studentId = (ev.student_id._id || ev.student_id).toString();
      const key = `${studentId}_${year}`;

      if (!grouped[key]) {
        grouped[key] = {
          student_id: studentId,
          year,
          attendance_points: 0,
          evidence_points: 0,
          attendance_activities: 0,
          evidence_count: 0,
          student_name: ev.student_id.full_name || 'Unknown'
        };
      }

      grouped[key].evidence_points += parseFloat(ev.faculty_point) || 0;
      grouped[key].evidence_count += 1;
    });

    console.log(`🔢 Found ${Object.keys(grouped).length} student-year combinations\n`);

    // ========================================
    // STEP 3: Create/Update PVCD records
    // ========================================

    // Clear old PVCD records
    const deleteResult = await PvcdRecord.deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} old PVCD records\n`);

    // Batch insert new PVCD records
    const pvcdRecords = [];
    const groupedArray = Object.values(grouped);

    for (const rec of groupedArray) {
      // Verify student exists
      const student = await StudentProfile.findById(rec.student_id);
      if (!student) {
        console.warn(`⚠️  Student not found: ${rec.student_id}`);
        continue;
      }

      // total_point = attendance_points + evidence_points
      const totalPoints = rec.attendance_points + rec.evidence_points;

      pvcdRecords.push({
        student_id: rec.student_id,
        year: rec.year,
        total_point: totalPoints,
        start_year: new Date(`${rec.year}-01-01`),
        end_year: new Date(`${rec.year}-12-31`)
      });
    }

    // Upsert all records
    let created = 0;
    let updated = 0;

    for (const record of pvcdRecords) {
      const result = await PvcdRecord.findOneAndUpdate(
        {
          student_id: record.student_id,
          year: record.year
        },
        record,
        { upsert: true, new: true }
      );

      if (result.isNew || result.__v === 0) {
        created++;
      } else {
        updated++;
      }
    }

    console.log(`✅ Created ${created} new PVCD records`);
    console.log(`✏️  Updated ${updated} existing PVCD records\n`);

    // ========================================
    // STEP 4: Verify & Display Results
    // ========================================

    const finalCount = await PvcdRecord.countDocuments();
    console.log(`📈 Total PVCD records in DB: ${finalCount}`);

    // Sample output
    const samples = await PvcdRecord.find()
      .limit(10)
      .populate('student_id', 'full_name student_number')
      .lean();

    console.log('\n📋 Sample PVCD records:');
    samples.forEach((rec, i) => {
      console.log(
        `  ${i + 1}. ${rec.student_id.full_name} (${rec.student_id.student_number}) - ${rec.year}: ${rec.total_point} điểm`
      );
    });

    // Log breakdown summary
    console.log('\n📊 Breakdown Summary:');
    let totalAttendancePoints = 0;
    let totalEvidencePoints = 0;
    let totalActivities = 0;
    let totalEvidence = 0;
    
    groupedArray.forEach(rec => {
      totalAttendancePoints += rec.attendance_points;
      totalEvidencePoints += rec.evidence_points;
      totalActivities += rec.attendance_activities;
      totalEvidence += rec.evidence_count;
    });
    
    console.log(`  Attendance: ${totalAttendancePoints.toFixed(2)} điểm (from ${totalActivities} activities, after MAX per activity)`);
    console.log(`  Evidence: ${totalEvidencePoints.toFixed(2)} điểm (from ${totalEvidence} approved records)`);
    console.log(`  Total: ${(totalAttendancePoints + totalEvidencePoints).toFixed(2)} điểm`);
    console.log(`  Student-Year Records: ${Object.keys(grouped).length}`);

    console.log('\n✅ Backfill completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during backfill:', err);
    process.exit(1);
  }
}

// Run
backfillPvcdCorrected();
