# Test Plan: PVCD Total_Point Fix

## Implementation Summary

✅ **Changes Made**:

1. **evidence.model.js** - Added post-save hook
   - Triggers when Evidence is saved
   - Calculates year from `submitted_at`
   - Sums `faculty_point` from all approved evidences in that year
   - Creates/updates PVCD record

2. **pvcd_record.model.js** - Disabled old pre-save hook
   - Removed logic that used `activity.start_time` for year (WRONG)
   - Removed logic that used `attendance.points` (WRONG)

3. **attendance.model.js** - Disabled old post-save hook
   - Removed logic that used `attendance.scanned_at` for year (WRONG)

4. **Backfill script** - `scripts/backfill_pvcd_from_evidence.js`
   - Deletes all old PVCD records
   - Recalculates from Evidence table
   - Creates clean PVCD records

## Test Scenarios

### Scenario 1: Basic Sum (10 + 20 = 30)
**Setup**:
```
Student: 691d63565bcc1aa642a2f078
Evidence 1: faculty_point = 10, submitted_at = 2025-01-15, status = pending
Evidence 2: faculty_point = 20, submitted_at = 2025-02-10, status = pending
```

**Action**: 
- Approve both evidences (set status = 'approved')

**Expected**:
- PVCD record created: { student_id, year: 2025, total_point: 30 }
- Dashboard shows **30 điểm** ✅

**Verification**:
```javascript
// In MongoDB shell or Node script:
db.pvcd_record.findOne({ student_id: ObjectId("691d63565bcc1aa642a2f078"), year: 2025 })
// Should show: { ..., total_point: 30 }
```

---

### Scenario 2: Year Separation
**Setup**:
```
Student: Same as above
Evidence 1: faculty_point = 10, submitted_at = 2024-12-01, status = approved
Evidence 2: faculty_point = 20, submitted_at = 2025-01-15, status = approved
```

**Expected**:
- PVCD 2024: { year: 2024, total_point: 10 }
- PVCD 2025: { year: 2025, total_point: 20 }
- NOT: { year: 2025, total_point: 30 }

**Verification**:
```javascript
db.pvcd_record.find({ student_id: ObjectId("691d63565bcc1aa642a2f078") })
// Should show 2 records with different years
```

---

### Scenario 3: Multiple Approved (30 điểm cộng lại)
**Setup**:
```
Same year (2025), all approved:
- Evidence 1: 10 points
- Evidence 2: 20 points  
- Evidence 3: 5 points
```

**Expected**:
- PVCD: { year: 2025, total_point: 35 }

**Verification**:
```javascript
db.pvcd_record.findOne({ student_id: ObjectId("691d63565bcc1aa642a2f078"), year: 2025 })
// Should show total_point: 35
```

---

### Scenario 4: Only Approved Counted
**Setup**:
```
Evidence 1: 10 points, status = approved
Evidence 2: 20 points, status = pending (NOT approved)
```

**Expected**:
- PVCD: { year: 2025, total_point: 10 }
- NOT 30 (pending not counted)

**Verification**:
```javascript
db.pvcd_record.findOne({ student_id: ObjectId("691d63565bcc1aa642a2f078"), year: 2025 })
// Should show total_point: 10
```

---

### Scenario 5: Reject & Recalculate
**Setup**:
```
Evidence 1: 10 points, approved
Evidence 2: 20 points, approved
PVCD = 30
```

**Action**:
- Reject Evidence 2 (set status = 'rejected')

**Expected**:
- PVCD updated: { year: 2025, total_point: 10 }
- (rejected not counted)

---

## Execution Steps

### Step 1: Backup Database
```bash
# Backup current DB before running backfill
mongodump --uri="mongodb://..." --out=./backup_before_pvcd_fix
```

### Step 2: Run Backfill Script
```bash
cd backend
node scripts/backfill_pvcd_from_evidence.js
```

**Expected Output**:
```
✅ Connected to MongoDB
📊 Found 123 approved evidences with faculty_point > 0
🔢 Found 89 student-year combinations
🗑️  Deleted 45 old PVCD records
✅ Created 89 new PVCD records
✏️  Updated 0 existing PVCD records
📈 Total PVCD records in DB: 89
...
✅ Backfill completed successfully!
```

### Step 3: Manual Tests

#### Test 3.1: Check specific student
```javascript
// Node script or MongoDB shell
const PvcdRecord = require('./src/models/pvcd_record.model');
const record = await PvcdRecord.findOne({ 
  student_id: ObjectId("691d63565bcc1aa642a2f078"), 
  year: 2025 
}).populate('student_id');
console.log(record.total_point); // Should be 30
```

#### Test 3.2: Check all year 2025 students
```javascript
const records = await PvcdRecord.find({ year: 2025 }).lean();
console.log(`Total students with PVCD 2025: ${records.length}`);
records.forEach(r => {
  console.log(`  ${r.student_id}: ${r.total_point} points`);
});
```

#### Test 3.3: Test API endpoint
```bash
# Login as student
curl -X GET http://localhost:5000/api/statistic/dashboard?year=2025 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should show correct total_point in response
```

### Step 4: Frontend Test

1. **Login** as student `691d63565bcc1aa642a2f078`
2. **Navigate** to "Điểm phục vụ cộng đồng"
3. **Verify**: Shows **30 điểm** (not 20)
4. **Check**: Table shows 2 approved evidences (10 + 20)

### Step 5: Edge Cases

#### Test 5.1: Student with 0 evidences
```javascript
const emptyRecord = await PvcdRecord.findOne({ 
  student_id: ObjectId("some_empty_student"), 
  year: 2025 
});
console.log(emptyRecord); // Should be null or have total_point: 0
```

#### Test 5.2: Faculty_point = 0
```javascript
// Create evidence with faculty_point: 0
// Should NOT create PVCD record (skip in post-save if <= 0)
```

---

## Rollback Plan

If issues occur:

```bash
# Restore from backup
mongorestore --uri="mongodb://..." ./backup_before_pvcd_fix

# Revert code changes
git checkout backend/src/models/evidence.model.js
git checkout backend/src/models/pvcd_record.model.js
git checkout backend/src/models/attendance.model.js

# Restart server
npm run dev
```

---

## Checklist

- [ ] All model files modified (evidence, pvcd_record, attendance)
- [ ] No syntax errors (run `npm install` and check)
- [ ] Database backed up
- [ ] Run backfill script successfully
- [ ] Test Scenario 1 (basic sum)
- [ ] Test Scenario 2 (year separation)
- [ ] Test Scenario 3 (multiple approved)
- [ ] Test Scenario 4 (only approved counted)
- [ ] Test Scenario 5 (reject & recalculate)
- [ ] Frontend test with actual student
- [ ] API test with curl/Postman
- [ ] Edge cases tested

---

## Key Points

✅ **Source of Truth**: Evidence table (approved evidences only)  
✅ **Year Definition**: Year of `Evidence.submitted_at`  
✅ **Points Used**: `faculty_point` field  
✅ **Auto-Update**: Evidence post-save hook triggers PVCD update  
✅ **Consistency**: Only one calculation path (Evidence post-save)
