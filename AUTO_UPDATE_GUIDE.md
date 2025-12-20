# Auto-Update PVCD - Implementation Guide

## 🎯 What It Does

Khi bạn **thêm/xóa/sửa** attendance hoặc evidence → **total_point tự động recalculate**

### Example
```
Student A: total_point = 57

Scenario 1: Xóa 1 attendance (10 điểm)
  → total_point tự động → 47

Scenario 2: Thêm 1 evidence approved (15 điểm)
  → total_point tự động → 62

Scenario 3: Sửa evidence status từ approved → pending
  → total_point tự động → 52
```

---

## 🔧 Technical Implementation

### Hooks Added

#### 1️⃣ Attendance Delete Hook
**File**: `attendance.model.js` (lines 143-199)

```javascript
attendanceSchema.post('findOneAndDelete', async function(doc) {
  // 1. Get student_id and year from deleted record
  // 2. Recalculate attendance points (remaining records)
  // 3. Recalculate evidence points
  // 4. Update PVCD: total = attendance + evidence
});
```

**Triggers on**:
- `Attendance.findByIdAndDelete(id)`
- `Attendance.findOneAndDelete({...})`

#### 2️⃣ Evidence Delete Hook
**File**: `evidence.model.js` (lines 137-199)

```javascript
evidenceSchema.post('findOneAndDelete', async function(doc) {
  // 1. Get student_id and year from deleted record
  // 2. Recalculate attendance points
  // 3. Recalculate evidence points (remaining approved records)
  // 4. Update PVCD: total = attendance + evidence
});
```

**Triggers on**:
- `Evidence.findByIdAndDelete(id)`
- `Evidence.findOneAndDelete({...})`

#### 3️⃣ Evidence Save Hook (Existing)
**File**: `evidence.model.js` (lines 56-135)

Already has post-save hook that:
- Triggers when evidence is created/updated
- Automatically recalculates PVCD
- Works for any status change (pending → approved, etc.)

---

## ✨ Coverage

| Operation | Auto-Update |
|-----------|------------|
| **Create Attendance** | ✅ Via post-save (from controller) |
| **Update Attendance** | ✅ Via post-save (from controller) |
| **Delete Attendance** | ✅ Via post-delete hook |
| **Create Evidence** | ✅ Via post-save hook |
| **Update Evidence** | ✅ Via post-save hook |
| **Delete Evidence** | ✅ Via post-delete hook |
| **Change Evidence Status** | ✅ Via post-save hook |

---

## 🔄 Flow Diagram

```
User Action
    ↓
Delete Attendance/Evidence
    ↓
findOneAndDelete() executes
    ↓
post('findOneAndDelete') hook triggers
    ↓
Recalculate:
  - Remaining attendance points
  - Remaining approved evidence points
    ↓
Update PVCD record:
  total_point = attendance + evidence
    ↓
Console log: "[PVCD Auto-Update] ..."
    ↓
Database updated ✅
```

---

## 📊 Example Scenarios

### Scenario 1: Delete Attendance
```
Before:
  Student: 691d...
  Year: 2025
  Attendance: Activity 1 (10 pts) + Activity 2 (10 pts) = 20 pts
  Evidence: Evidence 1 (15 pts) = 15 pts
  total_point: 35 pts

Action: Delete Activity 2 attendance

After:
  Attendance: Activity 1 (10 pts) = 10 pts
  Evidence: Evidence 1 (15 pts) = 15 pts
  total_point: 25 pts ✅ (auto-updated)

Log: [PVCD Auto-Update] Deleted attendance for student 691d...: total_point recalculated to 25
```

### Scenario 2: Delete Evidence
```
Before:
  total_point: 35 pts (10 + 15 + 10)

Action: Delete Evidence 1 (15 pts)

After:
  total_point: 20 pts ✅ (auto-updated)

Log: [PVCD Auto-Update] Deleted evidence for student 691d...: total_point recalculated to 20
```

### Scenario 3: Change Evidence Status
```
Before:
  Evidence 1: status = pending, faculty_point = 20
  total_point: 15 pts (15 from approved, 0 from pending)

Action: Update Evidence 1 status → approved (via post-save hook)

After:
  Evidence 1: status = approved, faculty_point = 20
  total_point: 35 pts ✅ (auto-updated via save hook)
```

---

## 🧪 Testing Auto-Update

### Test 1: Delete Attendance
```bash
# Before deletion
curl "http://localhost:5000/api/statistic/pvcd-breakdown?student_id=691d...&year=2025"
# Response: total_point: 35

# Delete via MongoDB or API
db.attendance.deleteOne({ _id: ObjectId("...") })

# After deletion (should auto-update)
curl "http://localhost:5000/api/statistic/pvcd-breakdown?student_id=691d...&year=2025"
# Response: total_point: 25 ✅

# Check logs
# Should show: [PVCD Auto-Update] Deleted attendance for student 691d...: total_point recalculated to 25
```

### Test 2: Delete Evidence
```bash
# Before deletion
curl "http://localhost:5000/api/statistic/pvcd-breakdown?student_id=691d...&year=2025"
# Response: total_point: 35

# Delete via MongoDB
db.evidence.deleteOne({ _id: ObjectId("...") })

# After deletion (should auto-update)
curl "http://localhost:5000/api/statistic/pvcd-breakdown?student_id=691d...&year=2025"
# Response: total_point: 20 ✅

# Check logs
# Should show: [PVCD Auto-Update] Deleted evidence for student 691d...: total_point recalculated to 20
```

### Test 3: Change Evidence Status (Save Hook)
```bash
# Update evidence status from pending to approved
db.evidence.updateOne(
  { _id: ObjectId("...") },
  { $set: { status: "approved" } }
)

# Logs should show: [PVCD Auto-Update] ... (from post-save hook)

# Verify via API
curl "http://localhost:5000/api/statistic/pvcd-breakdown?student_id=691d...&year=2025"
# total_point should be updated ✅
```

---

## ⚙️ How It Works

### Delete Hook Logic
```javascript
post('findOneAndDelete', async function(doc) {
  // doc = the deleted record

  // Step 1: Get year from the deleted record
  const year = new Date(doc.scanned_at).getFullYear(); // or submitted_at for evidence

  // Step 2: Get all REMAINING records for this student/year
  const remaining = await Model.find({
    student_id: doc.student_id,
    date_field: { in year }
  });

  // Step 3: Sum points from remaining records
  let total = remaining.reduce((sum, r) => sum + r.points, 0);

  // Step 4: Update PVCD
  await PvcdRecord.findOneAndUpdate(
    { student_id, year },
    { total_point: total },
    { upsert: true }
  );
});
```

### Save Hook Logic (Existing)
```javascript
post('save', async function(doc) {
  // doc = the saved/updated record

  // Step 1-3: Same as delete, but queries ALL records (not just remaining)
  // This works for both new and updated records

  // Step 4: Update PVCD
  await PvcdRecord.findOneAndUpdate(
    { student_id, year },
    { total_point: total },
    { upsert: true }
  );
});
```

---

## 📝 Implementation Details

### Attendance Delete Hook
- Triggers: `findOneAndDelete()`
- Gets year from: `doc.scanned_at`
- Sums: `att.points` (FINAL points)
- Updates: PVCD record

### Evidence Delete Hook
- Triggers: `findOneAndDelete()`
- Gets year from: `doc.submitted_at`
- Filters: Only approved evidence
- Sums: `ev.faculty_point`
- Updates: PVCD record

### Evidence Save Hook (Existing)
- Triggers: Any save/update
- Gets year from: `doc.submitted_at`
- Filters: Only approved evidence
- Sums: Both attendance + approved evidence
- Updates: PVCD record

---

## ✅ Console Output

When auto-update happens, you'll see logs like:

```
[PVCD Auto-Update] Deleted attendance for student 691d63565bcc1aa642a2f078: total_point recalculated to 25
[PVCD Auto-Update] Deleted evidence for student 691d63565bcc1aa642a2f078: total_point recalculated to 10
```

---

## ⚠️ Important Notes

✅ **No bulk delete support**: Delete hooks work with `findOneAndDelete()` only
- If you use `deleteMany()` or raw MongoDB delete, hooks won't trigger
- For bulk operations, need separate bulk recalculation job

✅ **Performance**: Each delete triggers recalculation
- Good for small datasets
- For very large datasets, consider batching

✅ **Error handling**: Errors are logged but don't fail the delete
- PVCD will be recalculated, but delete still succeeds

✅ **Year-based**: Recalculation is per year
- Deleting 2024 record only affects 2024 PVCD
- 2025 PVCD unaffected

---

## 🎯 Summary

| Action | Hook Type | Trigger | Auto-Update |
|--------|-----------|---------|------------|
| Create Attendance | post-save | save() | ✅ |
| Update Attendance | post-save | save() | ✅ |
| Delete Attendance | post-delete | findOneAndDelete() | ✅ |
| Create Evidence | post-save | save() | ✅ |
| Update Evidence | post-save | save() | ✅ |
| Delete Evidence | post-delete | findOneAndDelete() | ✅ |

**All PVCD changes are automatically reflected in real-time!** 🚀
