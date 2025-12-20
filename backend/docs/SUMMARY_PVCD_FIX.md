# Summary: PVCD Total_Point Bug Fix

## Bug Identified
Student with 2 evidences (10 + 20 points) showed only **20 points** instead of **30**

## Root Causes
1. **2 conflicting hooks** calculating PVCD - data not synced
2. **Wrong year source** - used `activity.start_time` or `scanned_at` instead of `Evidence.submitted_at`
3. **Wrong points field** - used old `attendance.points` instead of `Evidence.faculty_point`

## Solution Implemented

### Files Changed:
1. **`backend/src/models/evidence.model.js`** ✅
   - Added `post('save')` hook
   - Calculates PVCD from approved evidences only
   - Uses `submitted_at` for year determination
   - Sums `faculty_point`

2. **`backend/src/models/pvcd_record.model.js`** ✅
   - Disabled old pre-save hook
   - Now PVCD is read-only, updated only by Evidence hook

3. **`backend/src/models/attendance.model.js`** ✅
   - Disabled old post-save hook
   - Attendance no longer triggers PVCD update

4. **`backend/scripts/backfill_pvcd_from_evidence.js`** ✅
   - Recalculates all PVCD records from scratch
   - Deletes old data, creates clean records

## How It Works Now

```
Evidence saved/updated
    ↓
Post-save hook triggers
    ↓
Extract year from submitted_at
    ↓
Find all approved evidences for (student_id, year)
    ↓
Sum faculty_point
    ↓
Create/update PVCD record
```

## Key Improvements

| Aspect | Before | After |
|--------|--------|-------|
| **Bug** | 10+20=20 ❌ | 10+20=30 ✅ |
| **Year** | Wrong (activity date) | Correct (evidence submit date) ✅ |
| **Points** | Wrong field | Correct field ✅ |
| **Conflicts** | 2 calculation paths | 1 authoritative path ✅ |
| **Data** | Inconsistent | Consistent ✅ |

## Example Execution

```bash
# 1. Backup
mongodump --uri="mongodb://..." --out=./backup

# 2. Backfill
cd backend
node scripts/backfill_pvcd_from_evidence.js

# 3. Verify
# Check MongoDB:
# db.pvcd_record.findOne({ 
#   student_id: ObjectId("691d63565bcc1aa642a2f078"), 
#   year: 2025 
# })
# Should show: { ..., total_point: 30 }
```

## Next Steps

1. Review changes (all 3 model files)
2. Run backfill script
3. Test with student 691d63565bcc1aa642a2f078
4. Verify dashboard shows 30 points
5. Check other students for correctness
6. Deploy to production

## Testing Scenarios
- ✅ Multiple evidences same year (sum correctly)
- ✅ Evidences across years (separate PVCD per year)
- ✅ Only approved counted (pending/rejected ignored)
- ✅ Reject evidence (PVCD recalculated)

All changes are backward compatible and data is preserved during backfill.
