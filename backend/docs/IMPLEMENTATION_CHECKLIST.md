# Implementation Checklist: PVCD Total_Point Fix

## Files Modified

### ✅ 1. Evidence Model - Add Post-Save Hook
**File**: `backend/src/models/evidence.model.js`
- [x] Added post-save hook
- [x] Extracts year from `submitted_at`
- [x] Filters only `status = 'approved'`
- [x] Sums `faculty_point` from all approved evidences in that year
- [x] Creates/updates PVCD record with `{ student_id, year, total_point }`
- [x] Error handling (doesn't fail if error)

### ✅ 2. PVCD Record Model - Disable Old Hook
**File**: `backend/src/models/pvcd_record.model.js`
- [x] Disabled pre-save hook (commented out lines 53-85)
- [x] Removed logic using `activity.start_time` for year
- [x] Removed logic summing `attendance.points`
- [x] Added comment explaining why disabled

### ✅ 3. Attendance Model - Disable Old Hook
**File**: `backend/src/models/attendance.model.js`
- [x] Disabled post-save hook (commented out lines 128-188)
- [x] Removed logic using `attendance.scanned_at` for year
- [x] Removed logic summing `attendance.points`
- [x] Added comment explaining why disabled

### ✅ 4. Backfill Script
**File**: `backend/scripts/backfill_pvcd_from_evidence.js`
- [x] Connects to MongoDB
- [x] Gets all approved evidences with `faculty_point > 0`
- [x] Groups by (student_id, year)
- [x] Deletes old PVCD records
- [x] Creates new PVCD records with correct totals
- [x] Verifies students exist
- [x] Shows sample results

## Testing

### Phase 1: Code Validation
- [ ] Check Node.js syntax (run `npm install`)
- [ ] No circular dependency errors
- [ ] Models load without errors

### Phase 2: Database Backup & Backfill
- [ ] Backup MongoDB before running backfill
- [ ] Run backfill script: `node scripts/backfill_pvcd_from_evidence.js`
- [ ] Verify output shows success
- [ ] Check PVCD record count

### Phase 3: Manual Testing
- [ ] Query student 691d63565bcc1aa642a2f078
- [ ] Verify PVCD 2025 shows 30 points (not 20)
- [ ] Test multiple students with multiple evidences
- [ ] Test year separation (2024 vs 2025)

### Phase 4: Functional Testing
- [ ] Frontend: Login and check "Điểm phục vụ cộng đồng"
- [ ] Should show correct total_point
- [ ] Dashboard statistics should reflect new totals
- [ ] Chatbot should report correct PVCD points

### Phase 5: Edge Cases
- [ ] Student with 0 evidences → PVCD: total_point = 0
- [ ] Pending evidences → NOT counted
- [ ] Reject evidence → PVCD recalculated (total decreased)
- [ ] Approve rejected evidence → PVCD recalculated (total increased)

## Rollback Plan
If needed:
```bash
# 1. Restore DB from backup
mongorestore --uri="mongodb://..." ./backup

# 2. Revert code
git checkout backend/src/models/

# 3. Restart
npm run dev
```

## What Changed

| Component | Before | After |
|-----------|--------|-------|
| **Year Source** | `activity.start_time` or `scanned_at` | `Evidence.submitted_at` ✅ |
| **Points Field** | `attendance.points` (legacy) | `Evidence.faculty_point` ✅ |
| **Calculation Place** | 2 places (conflicting) | 1 place (Evidence post-save) ✅ |
| **Only Approved?** | No (all attendance) | Yes (only approved) ✅ |
| **Example** | 10+20=20 ❌ | 10+20=30 ✅ |

## Commands

```bash
# Backup database
mongodump --uri="mongodb://..." --out=./backup_before_pvcd_fix

# Run backfill (in backend directory)
node scripts/backfill_pvcd_from_evidence.js

# Verify results (Node script or MongoDB shell)
db.pvcd_record.findOne({ student_id: ObjectId("691d63565bcc1aa642a2f078"), year: 2025 })

# Should show:
# { _id: ..., student_id: ..., year: 2025, total_point: 30 }
```

## Sign-Off

- [ ] All files modified correctly
- [ ] Backfill script runs successfully
- [ ] Tests pass
- [ ] Ready for production
