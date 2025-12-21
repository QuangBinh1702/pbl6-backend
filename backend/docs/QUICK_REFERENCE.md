# Quick Reference - PVCD New Logic

## 📌 Formula

```
total_point = Σ(attendance.points) + Σ(evidence.faculty_point for approved)

Where:
- attendance.points = FINAL TOTAL per activity (not latest scan)
- evidence.faculty_point = faculty approved points
```

---

## 📂 Files Modified (5 total)

```
✅ evidence.model.js          - Added post-save hook
✅ attendance.model.js        - Disabled old hook
✅ backfill script            - Updated for attendance + evidence
✅ statistic.controller.js    - Added getPvcdBreakdown endpoint
✅ statistic.routes.js        - Added /pvcd-breakdown route
```

---

## 🔗 API Endpoint

```bash
GET /api/statistic/pvcd-breakdown?student_id=XXX&year=2025
```

**Response includes**:
- `summary` - Total & counts
- `breakdown` - Attendance + Evidence split
- `sources` - Detailed lists
- `combined_list` - Sorted by date

---

## 🎯 Key Logic Points

| Item | Value |
|------|-------|
| **Attendance Field** | `points` (FINAL TOTAL per activity) |
| **❌ NOT** | `points_earned` (just latest scan) |
| **Attendance Year** | `scanned_at` |
| **Evidence Field** | `faculty_point` |
| **Evidence Year** | `submitted_at` |
| **Evidence Filter** | `status = 'approved'` |

---

## 📊 Example

**Student with 2 activities (10 pts each) + 1 evidence (10 pts)**:

```
Attendance:
  - Activity 1: 10 points (2025-01-15)
  - Activity 2: 10 points (2025-10-01)
  Subtotal: 20 points

Evidence (approved):
  - Evidence 1: 10 points (2025-02-10)
  Subtotal: 10 points

TOTAL: 30 points ✅
```

---

## 🚀 Deploy (3 commands)

```bash
# 1. Backup
mongodump --uri="mongodb://..." --out=./backup

# 2. Backfill
cd backend && node scripts/backfill_pvcd_from_evidence.js

# 3. Test
npm run dev && curl "http://localhost:5000/api/statistic/pvcd-breakdown?student_id=XXX&year=2025"
```

---

## 🧪 Test Cases

✅ 10 + 20 = 30 (both sources)  
✅ Year separation (2024 ≠ 2025)  
✅ Only approved evidence  
✅ Pending/rejected not counted  
✅ Auto-update on evidence change  

---

## 💡 Frontend Change

Old:
```javascript
total_point: 30
```

New:
```javascript
{
  total: 30,
  attendance: 10,
  evidence: 20,
  items: [
    { type: 'attendance', title: '...', points: 10 },
    { type: 'evidence', title: '...', points: 20 }
  ]
}
```

---

## 📚 Full Docs

See: **PVCD_NEW_LOGIC.md** for detailed specs & examples
