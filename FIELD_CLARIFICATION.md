# Field Clarification: points vs points_earned

## 🎯 Correct Understanding

### `points_earned` ❌ (WRONG for PVCD)
- **Definition**: Points from the **latest/most recent scan** of QR code
- **Example**: Student scans QR 3 times, gets 8, 9, 10 → `points_earned = 10` (latest)
- **Use case**: Tracking each individual scan attempt
- **For PVCD**: ❌ NOT what we want (would only count latest scan)

### `points` ✅ (CORRECT for PVCD)
- **Definition**: **FINAL TOTAL POINTS** allocated for that activity
- **Example**: Activity is worth 10 points → `points = 10` (regardless of how many scans)
- **Use case**: Final score that should count toward PVCD
- **For PVCD**: ✅ This is what we want

---

## 🔍 Why This Matters

### Scenario: Student scans same QR multiple times
```
Activity: "Community service day" (worth 10 points)

Student scans QR 3 times:
  1st scan → points_earned: 5 (calculated)
  2nd scan → points_earned: 8 (calculated)  
  3rd scan → points_earned: 10 (calculated - LATEST)

attendance.points_earned = 10 (latest scan)
attendance.points = 10 (final activity total)
```

**For PVCD counting**:
- ❌ Using `points_earned`: Would get 10 (latest)
- ✅ Using `points`: Would get 10 (correct final)

Seems same here, but...

### Better Scenario: Multiple activities same student
```
Student attends 2 activities:

Activity 1 (scanned once):
  - points_earned: 10
  - points: 10

Activity 2 (scanned 3 times):
  - points_earned: 10 (latest scan)
  - points: 10 (final activity total)

PVCD Calculation:
❌ If using points_earned: Could be unreliable (depends on scan order)
✅ If using points: Always correct (final total per activity)
```

---

## ✅ Code Changes Made

### Before (WRONG)
```javascript
const points = att.points_earned != null ? att.points_earned : att.points;
attendancePoints += parseFloat(points) || 0;
```

### After (CORRECT)
```javascript
// Use 'points' field (FINAL TOTAL per activity)
attendancePoints += parseFloat(att.points) || 0;
```

---

## 📝 Files Updated

✅ `evidence.model.js` - Line 88: Use `att.points`  
✅ `backfill_pvcd_from_evidence.js` - Line 70: Use `att.points`  
✅ `statistic.controller.js` - Line 598: Use `att.points`  
✅ `PVCD_NEW_LOGIC.md` - Updated documentation  
✅ `QUICK_REFERENCE.md` - Updated formula  

---

## 🎓 Summary

| Field | Meaning | For PVCD |
|-------|---------|----------|
| `points_earned` | Latest scan score | ❌ Wrong |
| `points` | Final activity total | ✅ Correct |

**Always use `points` for PVCD calculation** ✅
