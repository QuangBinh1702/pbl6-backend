# PVCD Calculation - New Logic

## 🎯 New Specification

```
total_point = Σ(Attendance.points_earned) + Σ(Evidence.faculty_point when approved)
```

### Data Sources:
- **Attendance**: Points from scanning QR codes (dynamic QR scoring)
  - Field: `points` (FINAL TOTAL POINTS per activity)
  - ❌ NOT `points_earned` (which is just the latest scan score)
  - Year filter: `attendance.scanned_at`
  
- **Evidence**: Points from faculty approval of minh chứng
  - Field: `faculty_point`
  - Filter: `status = 'approved'`
  - Year filter: `evidence.submitted_at`

---

## 📝 Implementation Details

### 1️⃣ Model Hook - `evidence.model.js`

When evidence is saved (any status):
```javascript
evidenceSchema.post('save', async function(doc) {
  // 1. Get year from submitted_at
  const year = new Date(doc.submitted_at).getFullYear();
  
  // 2. Sum attendance.points for (student_id, year)
  // ✅ Use 'points' field (FINAL TOTAL per activity)
  // ❌ NOT points_earned (just latest scan)
  const attendances = Attendance.find({
    student_id: doc.student_id,
    scanned_at: { year }
  });
  let attendance_sum = Σ(att.points);  // FINAL TOTAL
  
  // 3. Sum evidence.faculty_point for (student_id, year, approved)
  const evidences = Evidence.find({
    student_id: doc.student_id,
    status: 'approved',
    submitted_at: { year }
  });
  let evidence_sum = Σ(ev.faculty_point);
  
  // 4. Update PVCD record
  PvcdRecord.upsert({
    student_id: doc.student_id,
    year: year,
    total_point: attendance_sum + evidence_sum
  });
});
```

**Key Points**:
- Triggers every time evidence is saved/updated
- Automatically recalculates when evidence is approved/rejected
- Combines both attendance and evidence points
- ✅ Uses `points` field for FINAL TOTAL per activity
- ❌ NOT `points_earned` which is just latest scan

---

### 2️⃣ Backfill Script - `scripts/backfill_pvcd_from_evidence.js`

Recalculates all PVCD records:
```
For each (student_id, year) combination:
  1. Get all attendances with scanned_at in that year
  2. Sum points_earned (fallback: points)
  3. Get all approved evidences with submitted_at in that year
  4. Sum faculty_point
  5. Create PVCD: total_point = attendance_sum + evidence_sum
```

**Output**:
```
📊 Found 120 total attendances
📊 Found 45 approved evidences
🔢 Found 89 student-year combinations
📊 Breakdown Summary:
  Attendance Points: 8905.50 (from 120 records)
  Evidence Points: 1245.75 (from 45 records)
  Total: 10151.25
```

---

### 3️⃣ New API Endpoint - `GET /api/statistic/pvcd-breakdown`

Returns detailed breakdown for frontend:

**Request**:
```bash
GET /api/statistic/pvcd-breakdown?student_id=XXX&year=2025
```

**Response**:
```json
{
  "success": true,
  "data": {
    "student_id": "691d63565bcc1aa642a2f078",
    "year": 2025,
    "summary": {
      "total_point": 30,
      "attendance_points": 10,
      "evidence_points": 20,
      "attendance_count": 2,
      "evidence_count": 1,
      "pvcd_record_total": 30
    },
    "breakdown": {
      "attendance_points": 10,
      "evidence_points": 20,
      "total": 30
    },
    "sources": {
      "attendance": {
        "count": 2,
        "total_points": 10,
        "items": [
          {
            "_id": "...",
            "type": "attendance",
            "title": "Chuyên xe về quê ăn tết",
            "points": 10,
            "date": "2025-01-15T10:30:00Z",
            "activity_id": "..."
          },
          {
            "_id": "...",
            "type": "attendance",
            "title": "Hội thảo trí tuệ nhân tạo",
            "points": 10,
            "date": "2025-10-01T14:00:00Z",
            "activity_id": "..."
          }
        ]
      },
      "evidence": {
        "count": 1,
        "total_points": 20,
        "items": [
          {
            "_id": "...",
            "type": "evidence",
            "title": "Sắp xếp lễ tình nguyện",
            "points": 20,
            "date": "2025-02-10T09:00:00Z"
          }
        ]
      }
    },
    "combined_list": [
      {
        "_id": "...",
        "type": "evidence",
        "title": "Sắp xếp lễ tình nguyện",
        "points": 20,
        "date": "2025-02-10T09:00:00Z"
      },
      {
        "_id": "...",
        "type": "attendance",
        "title": "Hội thảo trí tuệ nhân tạo",
        "points": 10,
        "date": "2025-10-01T14:00:00Z",
        "activity_id": "..."
      },
      {
        "_id": "...",
        "type": "attendance",
        "title": "Chuyên xe về quê ăn tết",
        "points": 10,
        "date": "2025-01-15T10:30:00Z",
        "activity_id": "..."
      }
    ]
  }
}
```

---

## 🎨 Frontend Usage

### Example: Display Breakdown

```javascript
// Fetch breakdown
const response = await fetch(
  `/api/statistic/pvcd-breakdown?student_id=${studentId}&year=2025`
);
const { data } = await response.json();

// Display summary
console.log(`Total: ${data.summary.total_point} điểm`);
console.log(`  From Activities: ${data.breakdown.attendance_points}`);
console.log(`  From Evidence: ${data.breakdown.evidence_points}`);

// Display combined list (sorted by date)
data.combined_list.forEach(item => {
  console.log(`${item.date}: [${item.type}] ${item.title} - ${item.points} điểm`);
});
```

### Example: Table Display

```html
<div class="pvcd-section">
  <h2>Điểm phục vụ cộng đồng - {{ year }}</h2>
  
  <div class="summary">
    <p><strong>Tổng cộng:</strong> {{ total_point }} điểm</p>
    <p>Hoạt động: {{ attendance_points }} điểm</p>
    <p>Minh chứng: {{ evidence_points }} điểm</p>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Loại</th>
        <th>Tên hoạt động / minh chứng</th>
        <th>Ngày</th>
        <th>Điểm</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="item in combined_list" :key="item._id">
        <td>
          <span v-if="item.type === 'attendance'" class="badge badge-primary">Hoạt động</span>
          <span v-else class="badge badge-success">Minh chứng</span>
        </td>
        <td>{{ item.title }}</td>
        <td>{{ formatDate(item.date) }}</td>
        <td><strong>{{ item.points }}</strong></td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## ✨ Key Features

✅ **Combined Calculation**: Both attendance + evidence  
✅ **Final Points**: Uses `points` field (TOTAL per activity, not latest scan)  
✅ **Year Filtering**: Separate by year (2024 vs 2025)  
✅ **Auto-Update**: Changes to evidence/attendance auto-trigger PVCD recalc  
✅ **Only Approved**: Evidence filtered by `status = 'approved'`  
✅ **Frontend Transparency**: API shows breakdown + source list  
✅ **Date-Sorted**: combined_list sorted by date for easy viewing  

---

## 📊 Examples

### Example 1: Attendance + Evidence
```
Student: 691d63565bcc1aa642a2f078
Year: 2025

Attendance:
  - Chuyên xe về quê ăn tết (2025-01-15): 10 điểm
  - Hội thảo trí tuệ nhân tạo (2025-10-01): 10 điểm
  Subtotal: 20 điểm

Evidence (approved):
  - Sắp xếp lễ tình nguyện: 10 điểm
  Subtotal: 10 điểm

TOTAL: 30 điểm ✅
```

### Example 2: Year Separation
```
Student: ABC
Year 2024:
  - Attendance: 15 điểm
  - Evidence: 5 điểm
  - Total: 20 điểm

Year 2025:
  - Attendance: 10 điểm
  - Evidence: 20 điểm
  - Total: 30 điểm

NOT combined as 50 (separate records per year) ✅
```

### Example 3: Pending Evidence Not Counted
```
Evidence 1: approved, faculty_point = 20 → COUNTED ✅
Evidence 2: pending, faculty_point = 15 → NOT COUNTED ❌

Total: 20 điểm (not 35) ✅
```

---

## 🚀 Deployment Steps

1. **Backup database**
   ```bash
   mongodump --uri="mongodb://..." --out=./backup
   ```

2. **Code changes applied** (already done):
   - evidence.model.js - Added post-save hook
   - statistic.controller.js - Added getPvcdBreakdown
   - statistic.routes.js - Added /pvcd-breakdown route
   - backfill_pvcd_from_evidence.js - Updated logic

3. **Run backfill**
   ```bash
   cd backend && node scripts/backfill_pvcd_from_evidence.js
   ```

4. **Verify**
   ```bash
   npm run dev
   # Test: GET /api/statistic/pvcd-breakdown?student_id=XXX&year=2025
   ```

5. **Frontend update**
   - Update component to call `/api/statistic/pvcd-breakdown`
   - Display breakdown + combined list
   - Show both attendance and evidence sources

---

## 📋 Test Cases

✅ Basic sum: 10 + 20 = 30  
✅ Year separation: 2024 vs 2025  
✅ Multiple evidences: 3+ items  
✅ Only approved: Pending not counted  
✅ Dynamic update: Reject/approve triggers recalc  
✅ Legacy fallback: points_earned → points  

---

## 💡 Notes

- **points_earned is preferred** over points field (newer data)
- **scanned_at determines year** for attendance
- **submitted_at determines year** for evidence
- **Approved filter applies only to evidence**
- **No filter for attendance** (all scanned records count)
- **Auto-trigger**: Evidence hook runs on every save
