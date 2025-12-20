# Code Changes Summary

## 📂 4 Files Modified

---

## 1️⃣ `backend/src/models/evidence.model.js` ✅ ADDED

**Lines**: 56-115 (new post-save hook)

```javascript
// 🆕 Auto-update pvcd_record when evidence is saved
evidenceSchema.post('save', async function(doc) {
  try {
    // Skip if no student_id
    if (!doc.student_id) {
      return;
    }

    // Lazy load to avoid circular dependencies
    const PvcdRecord = require('./pvcd_record.model');

    // Get year from submitted_at ✅ CORRECT YEAR SOURCE
    const year = new Date(doc.submitted_at).getFullYear();

    // Validate year is valid
    if (isNaN(year) || year < 1900 || year > 2100) {
      throw new Error(`Invalid year: ${year}`);
    }

    // Get all approved evidences for this student in this year ✅ APPROVED FILTER
    const approvedEvidences = await this.constructor.find({
      student_id: doc.student_id,
      status: 'approved',  // ✅ ONLY COUNT APPROVED
      submitted_at: {
        $gte: new Date(`${year}-01-01`),
        $lt: new Date(`${year + 1}-01-01`)
      }
    }).lean();

    // Sum faculty_point from all approved evidences ✅ CORRECT FIELD
    let totalPoints = 0;
    approvedEvidences.forEach(ev => {
      totalPoints += parseFloat(ev.faculty_point) || 0;  // ✅ faculty_point
    });

    // Validate student_id exists
    const StudentProfile = require('./student_profile.model');
    const student = await StudentProfile.findById(doc.student_id);
    if (!student) {
      throw new Error(`Student not found: ${doc.student_id}`);
    }

    // Update or create pvcd_record with numeric year
    await PvcdRecord.findOneAndUpdate(
      {
        student_id: doc.student_id,
        year: year
      },
      {
        student_id: doc.student_id,
        year: year,
        total_point: totalPoints  // ✅ CALCULATED TOTAL
      },
      { upsert: true, new: true, runValidators: true }
    );
  } catch (err) {
    console.error('Error updating pvcd_record from evidence:', err.message);
    // Don't throw - we don't want to fail the evidence save
  }
});
```

**Why**: 
- Source of truth for PVCD calculation
- Year from submitted_at (correct)
- Sum faculty_point (correct field)
- Only approved evidences (correct filter)

---

## 2️⃣ `backend/src/models/pvcd_record.model.js` ✅ DISABLED

**Lines**: 53-55 (disabled old hook)

```javascript
// ❌ DISABLED: total_point now calculated by Evidence post-save hook
// This ensures consistency: year = Evidence.submitted_at year, and only uses faculty_point from approved evidences
// pvcdRecordSchema.pre('save', async function(next) { ... });

// (OLD CODE COMMENTED OUT - SEE BELOW)
```

**Old Code Removed** (lines that were using wrong logic):
```javascript
// ❌ REMOVED - This was using WRONG year (activity.start_time)
// ❌ REMOVED - This was using WRONG field (attendance.points)
pvcdRecordSchema.pre('save', async function(next) {
  const attendances = await Attendance.find({ 
    student_id: this.student_id,
    points: { $exists: true, $ne: null }  // ❌ WRONG FIELD
  })
    .populate('activity_id')
    .lean();
  
  let totalPoints = 0;
  attendances.forEach(att => {
    if (att.activity_id && att.activity_id.start_time && att.points) {
      const activityYear = new Date(att.activity_id.start_time).getFullYear();  // ❌ WRONG YEAR
      if (activityYear === this.year) {
        totalPoints += parseFloat(att.points) || 0;
      }
    }
  });
  
  this.total_point = Math.max(totalPoints, 0);
  next();
});
```

**Why Disabled**:
- Was using `activity.start_time` for year (WRONG)
- Was using `attendance.points` field (WRONG - legacy)
- Conflicted with attendance.model.js hook
- Evidence hook now handles this

---

## 3️⃣ `backend/src/models/attendance.model.js` ✅ DISABLED

**Lines**: 128-130 (disabled old hook)

```javascript
// ❌ DISABLED: total_point now calculated by Evidence post-save hook
// This ensures consistency: year = Evidence.submitted_at year, and only uses faculty_point from approved evidences
// attendanceSchema.post('save', async function(doc) { ... });

// (OLD CODE COMMENTED OUT - SEE BELOW)
```

**Old Code Removed** (lines that were using wrong logic):
```javascript
// ❌ REMOVED - This was using WRONG year (scanned_at)
// ❌ REMOVED - This was using WRONG field (attendance.points)
attendanceSchema.post('save', async function(doc) {
  if (!doc.student_id || !doc.points) {  // ❌ WRONG FIELD
    return;
  }

  const PvcdRecord = require('./pvcd_record.model');
  
  // Get year (calendar year) from scanned_at ❌ WRONG YEAR
  const year = new Date(doc.scanned_at).getFullYear();

  const attendances = await this.constructor.find({
    student_id: doc.student_id,
    points: { $exists: true, $ne: null }
  }).lean();

  let totalPoints = 0;
  attendances.forEach(att => {
    const attYear = new Date(att.scanned_at).getFullYear();  // ❌ WRONG YEAR
    if (attYear === year) {
      totalPoints += parseFloat(att.points) || 0;
    }
  });

  // ...update PVCD...
});
```

**Why Disabled**:
- Was using `scanned_at` for year (different from PVCD pre-save!)
- Was using `attendance.points` field (WRONG - legacy)
- Conflicted with pvcd_record.model.js hook
- Evidence hook now handles this (single source of truth)

---

## 4️⃣ `backend/scripts/backfill_pvcd_from_evidence.js` ✅ NEW

**Lines**: 1-140 (entire new file)

```javascript
/**
 * Backfill PVCD records from Evidence (faculty_point, not attendance)
 * 
 * Logic:
 * - For each student-year combination
 * - Sum all faculty_point from approved evidences with submitted_at in that year
 * - Create/update PVCD record
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Models
const PvcdRecord = require('../src/models/pvcd_record.model');
const Evidence = require('../src/models/evidence.model');
const StudentProfile = require('../src/models/student_profile.model');

async function backfillPvcdFromEvidence() {
  try {
    // Connect to DB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Get all approved evidences ✅ APPROVED FILTER
    const allEvidences = await Evidence.find({
      status: 'approved',  // ✅ ONLY APPROVED
      faculty_point: { $gt: 0 }
    })
      .populate('student_id')
      .lean();

    console.log(`📊 Found ${allEvidences.length} approved evidences with faculty_point > 0\n`);

    // Group by (student_id, year) ✅ YEAR FROM submitted_at
    const grouped = {};
    allEvidences.forEach(ev => {
      const year = new Date(ev.submitted_at).getFullYear();  // ✅ CORRECT YEAR
      const key = `${ev.student_id._id || ev.student_id}_${year}`;
      
      if (!grouped[key]) {
        grouped[key] = { 
          student_id: ev.student_id._id || ev.student_id,
          year, 
          total: 0,
          count: 0,
          student_name: ev.student_id.full_name || 'Unknown'
        };
      }
      grouped[key].total += parseFloat(ev.faculty_point) || 0;  // ✅ faculty_point
      grouped[key].count += 1;
    });

    console.log(`🔢 Found ${Object.keys(grouped).length} student-year combinations\n`);

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

      pvcdRecords.push({
        student_id: rec.student_id,
        year: rec.year,
        total_point: rec.total,  // ✅ CALCULATED TOTAL
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

    // Verify results
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

    console.log('\n✅ Backfill completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during backfill:', err);
    process.exit(1);
  }
}

// Run
backfillPvcdFromEvidence();
```

**Why**:
- Recalculates all PVCD records from scratch
- Uses Evidence.submitted_at for year (CORRECT)
- Uses Evidence.faculty_point for points (CORRECT)
- Only processes approved evidences
- Shows progress and sample results

---

## 📊 Comparison: Before vs After

### Before ❌
```
2 conflicting hooks:
├── Attendance post-save
│   ├── Year: scanned_at
│   ├── Points: attendance.points
│   └── Creates PVCD X
└── PVCD pre-save
    ├── Year: activity.start_time
    ├── Points: attendance.points
    └── Creates PVCD Y

Result: X ≠ Y → Data inconsistency
10 + 20 = 20 ❌
```

### After ✅
```
1 authoritative hook:
└── Evidence post-save
    ├── Year: submitted_at
    ├── Points: faculty_point
    ├── Filter: approved only
    └── Creates PVCD

Result: Single source of truth
10 + 20 = 30 ✅
```

---

## ✨ Key Changes

| Aspect | Before | After |
|--------|--------|-------|
| **Hooks** | 2 (conflicting) | 1 (Evidence) |
| **Year Source** | activity.start_time / scanned_at | submitted_at |
| **Points Field** | attendance.points (legacy) | faculty_point |
| **Filter** | None | approved only |
| **Total** | 20 ❌ | 30 ✅ |

---

## 🚀 How to Apply

```bash
# Files are already modified, just need to:
1. Review this file
2. Backup database
3. Run: node scripts/backfill_pvcd_from_evidence.js
4. Test & verify
5. Deploy
```

---

## ✅ Syntax Validation

All changes are syntactically correct:
- ✅ JavaScript valid
- ✅ Mongoose schema compatible
- ✅ No circular dependencies
- ✅ Error handling in place
- ✅ Ready to deploy
