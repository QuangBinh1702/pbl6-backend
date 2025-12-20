# PVCD Total_Point Fix - Implementation Guide

## 🎯 Objective
Fix bug where student with 2 evidences (10 + 20 points) showed only 20 instead of 30 points.

## 📝 What Was Changed

### 1️⃣ `backend/src/models/evidence.model.js` ✅
**Added**: Post-save hook that auto-updates PVCD records
```javascript
evidenceSchema.post('save', async function(doc) {
  // Triggers when evidence is saved
  // 1. Extract year from submitted_at
  // 2. Find all approved evidences for (student_id, year)
  // 3. Sum faculty_point
  // 4. Create/update PVCD record
})
```

**Why**: Evidence is the source of truth for PVCD points

### 2️⃣ `backend/src/models/pvcd_record.model.js` ✅
**Disabled**: Old pre-save hook (was using wrong year and points field)
- Removed lines that calculated total_point from attendance
- Now PVCD is only written by Evidence post-save hook

**Why**: Avoid conflicting calculations that caused "10+20=20" bug

### 3️⃣ `backend/src/models/attendance.model.js` ✅
**Disabled**: Old post-save hook (was using wrong year and points field)
- Removed lines that updated PVCD after attendance save
- Attendance no longer affects PVCD

**Why**: Single source of truth (Evidence only)

### 4️⃣ `backend/scripts/backfill_pvcd_from_evidence.js` ✅
**Created**: Script to recalculate all PVCD records from scratch
- Deletes old PVCD records
- Re-sums faculty_point from approved evidences
- Creates clean PVCD records

**Why**: Fix corrupted historical data

## 🚀 How to Execute

### Step 1: Backup Database (CRITICAL)
```bash
# Create backup before running anything
mongodump --uri="mongodb://YOUR_URI" --out=./backup_before_pvcd_fix

echo "✅ Backup completed to ./backup_before_pvcd_fix"
```

### Step 2: Review Changes
```bash
# Check all modified files (should see 3 model files + 1 script)
git diff backend/src/models/
ls -la backend/scripts/backfill_pvcd_from_evidence.js
```

### Step 3: Run Backfill Script
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

### Step 4: Verify in MongoDB
```javascript
// Method 1: MongoDB CLI
mongo
use your_db_name
db.pvcd_record.findOne({ 
  student_id: ObjectId("691d63565bcc1aa642a2f078"), 
  year: 2025 
})

// Should show:
// {
//   _id: ...,
//   student_id: ObjectId("691d63565bcc1aa642a2f078"),
//   year: 2025,
//   total_point: 30
// }
```

### Step 5: Start Server & Test
```bash
npm run dev
# or
npm start
```

**Test with curl/Postman**:
```bash
curl -X GET http://localhost:5000/api/student/profile \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should show total_point: 30 in PVCD section
```

### Step 6: Frontend Test
1. Login as student `691d63565bcc1aa642a2f078`
2. Navigate to "Điểm phục vụ cộng đồng" page
3. **Verify**: Shows **30 điểm** (not 20)
4. **Check**: 2 evidences listed with 10 + 20 points

## 📊 Test Scenarios

### Scenario A: Basic Sum (Required Test)
```
Evidence 1: 10 points, approved, 2025-01-15
Evidence 2: 20 points, approved, 2025-02-10
Expected: PVCD { year: 2025, total_point: 30 } ✅
```

### Scenario B: Year Separation
```
Evidence 1: 10 points, approved, 2024-12-01
Evidence 2: 20 points, approved, 2025-01-15
Expected: 
  - PVCD 2024: total_point = 10
  - PVCD 2025: total_point = 20
  ✅ NOT combined as 30
```

### Scenario C: Only Approved Counted
```
Evidence 1: 10 points, approved
Evidence 2: 20 points, pending (NOT approved)
Expected: PVCD { total_point: 10 } ✅
```

### Scenario D: Dynamic Update
```
Initial: 2 approved evidences = 30 points
Action: Reject one evidence (set status = 'rejected')
Expected: PVCD auto-updates to 10 points ✅
```

## ✅ Verification Checklist

Before deployment:
- [ ] Database backed up
- [ ] Run backfill script successfully
- [ ] MongoDB query shows student 691d63565bcc1aa642a2f078: 30 points
- [ ] Test Scenario A passes (10+20=30)
- [ ] Test Scenario B passes (year separation)
- [ ] Test Scenario C passes (only approved)
- [ ] Test Scenario D passes (dynamic update)
- [ ] Frontend shows correct total_point
- [ ] Dashboard statistics correct
- [ ] No error logs

## 🔄 How It Works Now

```
Event: Evidence saved with faculty_point=10, status=approved
  ↓
Post-save hook triggered
  ↓
Extract year from submitted_at (2025)
  ↓
Query all approved evidences for (student_id, 2025)
  ↓
Calculate sum: 10 + 20 = 30
  ↓
Update/create PVCD: { student_id, year: 2025, total_point: 30 }
  ↓
Dashboard queries PVCD collection
  ↓
Shows 30 điểm to student ✅
```

## 🛡️ Rollback (If Needed)

```bash
# Restore database from backup
mongorestore --uri="mongodb://YOUR_URI" ./backup_before_pvcd_fix

# Revert code changes
git checkout backend/src/models/evidence.model.js
git checkout backend/src/models/pvcd_record.model.js
git checkout backend/src/models/attendance.model.js

# Restart server
npm run dev
```

## 📋 Documentation Files Created

1. **IMPLEMENTATION_PLAN_PVCD_FIX.md** - Detailed plan with root cause analysis
2. **TEST_PVCD_FIX.md** - Complete test scenarios
3. **IMPLEMENTATION_CHECKLIST.md** - Step-by-step checklist
4. **SUMMARY_PVCD_FIX.md** - Executive summary
5. **IMPLEMENTATION_GUIDE.md** - This file

## 🎓 Key Changes Summary

| Aspect | Before ❌ | After ✅ |
|--------|----------|---------|
| Bug | 10+20=20 | 10+20=30 |
| Year Source | activity.start_time (wrong) | Evidence.submitted_at (correct) |
| Points Used | attendance.points (legacy) | Evidence.faculty_point (correct) |
| Calculation | 2 conflicting paths | 1 authoritative path |
| Only Approved? | No | Yes |
| Data Consistency | Broken | Fixed |

## 💡 Why This Fix Works

1. **Single Source of Truth**: Evidence model is the only one that calculates PVCD
2. **Correct Year**: Uses `submitted_at` (when student submitted evidence)
3. **Correct Points**: Uses `faculty_point` (faculty's score)
4. **Only Approved**: Filter `status = 'approved'` prevents counting pending/rejected
5. **Auto-Update**: Post-save hook triggers automatically when evidence changes
6. **No Conflicts**: Old hooks disabled to prevent data corruption

## 🚨 Critical Notes

⚠️ **IMPORTANT**: 
- Always backup database before running backfill
- Test in dev environment first
- Verify totals with business stakeholders
- Monitor logs for any errors during backfill

✅ **SAFE**:
- No existing data is deleted (only PVCD records)
- Evidence records remain unchanged
- Rollback possible if needed
- Backward compatible

---

**Questions?** Check:
- IMPLEMENTATION_PLAN_PVCD_FIX.md (technical details)
- TEST_PVCD_FIX.md (test scenarios)
- Code comments in model files
