# Multi-QR Fix - Handling Multiple Scans per Activity

## 🎯 The Problem

When 2 or more QR codes are created for **same activity**:

```
Activity X (worth 10 points total):
  ├─ QR Code 1
  │   └─ Student A scans → Attendance record #1 (scan_order=1, points=5)
  └─ QR Code 2
      └─ Student A scans → Attendance record #2 (scan_order=2, points=10)

❌ OLD LOGIC (WRONG):
   Cộng: 5 + 10 = 15 điểm (SAI! Activity chỉ được 10 điểm)

✅ NEW LOGIC (CORRECT):
   MAX(5, 10) = 10 điểm (Đúng! Lấy điểm cao nhất)
```

### Why This Matters
- System allows multiple QR codes per activity for flexibility
- Each QR scan creates separate attendance record
- But should count **MAX score** (highest attempt), not sum all attempts
- Just like exam: 3 attempts, use highest score

---

## 🔧 Implementation

### Key Changes

1. **Group by activity_id**
   - Don't sum all attendance records directly
   - Group them by activity first

2. **Take MAX points per activity**
   - For each activity, find highest points from all scans
   - Ignore lower scores from other QR scans

3. **Sum the MAX values**
   - Add up all the max-per-activity scores

### Code Logic

```javascript
// ✅ CORRECT APPROACH
const activityPointsMap = {};

// For each attendance record
attendances.forEach(att => {
  const actId = att.activity_id.toString();
  const points = att.points;
  
  // Keep the MAX points for this activity
  if (!activityPointsMap[actId] || points > activityPointsMap[actId]) {
    activityPointsMap[actId] = points;
  }
});

// Sum the MAX points
let total = 0;
Object.values(activityPointsMap).forEach(maxPoints => {
  total += maxPoints;
});
```

---

## 📝 Files Modified

### 1. **evidence.model.js** (post-save hook)
- Lines 77-104
- Groups attendance by activity_id
- Takes MAX points per activity
- Recalculates PVCD automatically

### 2. **attendance.model.js** (delete hook)
- Lines 146-177
- Same logic for when attendance is deleted
- Ensures PVCD stays correct

### 3. **evidence.model.js** (delete hook)
- Lines 162-188
- Same logic for when evidence is deleted

### 4. **statistic.controller.js** (getPvcdBreakdown)
- Lines 590-625
- Groups by activity in response
- Shows scan_count (number of scans per activity)

### 5. **backfill_pvcd_corrected.js** (NEW script)
- Complete rewrite with correct grouping logic
- Handles multiple QR per activity properly

---

## 📊 Example Walkthrough

### Setup
```
Student A participates in Activity X (10 points max):
  - Scans QR 1 at time T1 → points = 5 (1 out of 2 QRs = 50%)
  - Scans QR 2 at time T2 → points = 10 (2 out of 2 QRs = 100%)

Evidence: Submits minh chứng with 20 faculty points (approved)
```

### Calculation

**Old (Wrong)**:
```
attendance: 5 + 10 = 15
evidence: 20
total: 35 ❌
```

**New (Correct)**:
```
Step 1: Group by activity
  Activity X: [5, 10]

Step 2: Take MAX per activity
  Activity X: MAX(5, 10) = 10

Step 3: Sum max values
  attendance: 10

Step 4: Add evidence
  evidence: 20

Step 5: Total
  total: 10 + 20 = 30 ✅
```

---

## 🚀 How to Use New Backfill

```bash
# Run new corrected backfill script
cd backend
node scripts/backfill_pvcd_corrected.js
```

**Output**:
```
✅ Connected to MongoDB
📊 Found 150 total attendances
📊 Found 45 approved evidences

🔄 Processing attendances (grouping by activity)...
✅ Grouped into 120 unique (student, year, activity) combinations

🔄 Aggregating by student and year...
🔢 Found 45 student-year combinations

🗑️  Deleted 30 old PVCD records
✅ Created 45 new PVCD records
✏️  Updated 0 existing PVCD records

📈 Total PVCD records in DB: 45

📊 Breakdown Summary:
  Attendance: 450.00 điểm (from 120 activities, after MAX per activity)
  Evidence: 900.00 điểm (from 45 approved records)
  Total: 1350.00 điểm
  Student-Year Records: 45

✅ Backfill completed successfully!
```

---

## ✨ Response Format (API)

When returning attendance in `combined_list`:
```json
{
  "type": "attendance",
  "title": "Activity name",
  "points": 10,  // MAX points from all QR scans
  "date": "2025-01-15T10:30:00Z",
  "activity_id": "...",
  "scan_count": 2  // Number of QR scans for this activity
}
```

The `scan_count` shows how many times the student scanned for that activity.

---

## 🎯 Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Multiple QRs** | Sum all scans ❌ | Take MAX per activity ✅ |
| **Example** | 5 + 10 = 15 ❌ | MAX(5, 10) = 10 ✅ |
| **Logic** | Simple sum | Group → Max → Sum |
| **Accuracy** | Wrong for multi-QR | Correct ✅ |
| **Backfill** | Old script | backfill_pvcd_corrected.js |

---

## 🧪 Test Cases

### Test 1: Single Activity, Multiple QRs
```
Activity: "Community Day" (10 pts)
  QR1 scan: 5 pts
  QR2 scan: 10 pts
  QR3 scan: 8 pts

Expected: 10 pts ✅ (not 23)
```

### Test 2: Multiple Activities, Some Multi-QR
```
Activity 1: 5 pts (1 QR)
Activity 2: 10 pts (3 QRs but best is 10)
Activity 3: 8 pts (2 QRs but best is 8)

Expected: 5 + 10 + 8 = 23 pts ✅
```

### Test 3: Delete One QR Scan
```
Before: Activity has 3 scans (5, 8, 10) → Using MAX(10)

Delete the 10-point scan: Now has (5, 8) → Recalculate to MAX(8)

Expected: total_point decreases by 2 ✅ (auto-updated)
```

---

## 📌 Important Notes

✅ Works with existing hooks (post-save, post-delete)  
✅ Backward compatible (single QR still works correctly)  
✅ Auto-updates when adding/deleting scans  
✅ Year-based filtering still applies  
✅ Approved evidence filtering still applies  

---

## 🔗 Related

- **AUTO_UPDATE_GUIDE.md** - How auto-updates work
- **PVCD_NEW_LOGIC.md** - Complete PVCD specification
- **API_FRONTEND_GUIDE.md** - Response format details
