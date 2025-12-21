# API Guide for Frontend - PVCD Breakdown

## 🔗 API Endpoint

```
GET /api/statistic/pvcd-breakdown?student_id=<ID>&year=<YEAR>
```

---

## 📋 Request Parameters

| Parameter | Type | Required | Example | Description |
|-----------|------|----------|---------|-------------|
| `student_id` | ObjectId | ✅ Yes | `691d63565bcc1aa642a2f078` | Student's MongoDB ID |
| `year` | Number | ❌ No | `2025` | Academic year (defaults to current year) |

---

## 📤 Request Example

```bash
curl -X GET "http://localhost:5000/api/statistic/pvcd-breakdown?student_id=691d63565bcc1aa642a2f078&year=2025" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📥 Response Format

### Success Response (200 OK)
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
            "_id": "507f1f77bcf86cd799439011",
            "type": "attendance",
            "title": "Chuyên xe về quê ăn tết 0d",
            "points": 10,
            "date": "2025-01-15T10:30:00.000Z",
            "activity_id": "607f1f77bcf86cd799439020"
          },
          {
            "_id": "507f1f77bcf86cd799439012",
            "type": "attendance",
            "title": "Hội thảo Trí tuệ nhân tạo - AI",
            "points": 10,
            "date": "2025-10-01T14:00:00.000Z",
            "activity_id": "607f1f77bcf86cd799439021"
          }
        ]
      },
      
      "evidence": {
        "count": 1,
        "total_points": 20,
        "items": [
          {
            "_id": "607f1f77bcf86cd799439030",
            "type": "evidence",
            "title": "Sắp xếp lễ tình nguyện",
            "points": 20,
            "date": "2025-02-10T09:00:00.000Z"
          }
        ]
      }
    },
    
    "combined_list": [
      {
        "_id": "607f1f77bcf86cd799439030",
        "type": "evidence",
        "title": "Sắp xếp lễ tình nguyện",
        "points": 20,
        "date": "2025-02-10T09:00:00.000Z"
      },
      {
        "_id": "507f1f77bcf86cd799439012",
        "type": "attendance",
        "title": "Hội thảo Trí tuệ nhân tạo - AI",
        "points": 10,
        "date": "2025-10-01T14:00:00.000Z",
        "activity_id": "607f1f77bcf86cd799439021"
      },
      {
        "_id": "507f1f77bcf86cd799439011",
        "type": "attendance",
        "title": "Chuyên xe về quê ăn tết 0d",
        "points": 10,
        "date": "2025-01-15T10:30:00.000Z",
        "activity_id": "607f1f77bcf86cd799439020"
      }
    ]
  }
}
```

### Error Response (400)
```json
{
  "success": false,
  "message": "Invalid student_id"
}
```

### Error Response (500)
```json
{
  "success": false,
  "message": "Internal server error details"
}
```

---

## 🎨 Frontend Usage Examples

### React Example
```javascript
import { useState, useEffect } from 'react';

function PvcdBreakdown({ studentId, year = 2025 }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `/api/statistic/pvcd-breakdown?student_id=${studentId}&year=${year}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        
        if (!response.ok) throw new Error('Failed to fetch');
        
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId, year]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No data found</div>;

  return (
    <div className="pvcd-section">
      <h2>Điểm Phục Vụ Cộng Đồng - {data.year}</h2>
      
      {/* Summary */}
      <div className="summary-card">
        <div className="total">
          <h3>{data.summary.total_point} điểm</h3>
          <p>Tổng cộng</p>
        </div>
        <div className="breakdown">
          <div>
            <span className="label">Hoạt động:</span>
            <span className="value">{data.breakdown.attendance_points}</span>
          </div>
          <div>
            <span className="label">Minh chứng:</span>
            <span className="value">{data.breakdown.evidence_points}</span>
          </div>
        </div>
      </div>

      {/* Combined Table */}
      <table className="pvcd-table">
        <thead>
          <tr>
            <th>Loại</th>
            <th>Tên hoạt động / Minh chứng</th>
            <th>Ngày</th>
            <th>Điểm</th>
          </tr>
        </thead>
        <tbody>
          {data.combined_list.map((item) => (
            <tr key={item._id}>
              <td>
                {item.type === 'attendance' ? (
                  <span className="badge badge-primary">Hoạt động</span>
                ) : (
                  <span className="badge badge-success">Minh chứng</span>
                )}
              </td>
              <td>{item.title}</td>
              <td>{new Date(item.date).toLocaleDateString('vi-VN')}</td>
              <td className="points">{item.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PvcdBreakdown;
```

### Vue Example
```vue
<template>
  <div class="pvcd-section">
    <h2>Điểm Phục Vụ Cộng Đồng - {{ year }}</h2>
    
    <!-- Summary -->
    <div class="summary-card" v-if="data">
      <div class="total">
        <h3>{{ data.summary.total_point }} điểm</h3>
        <p>Tổng cộng</p>
      </div>
      <div class="breakdown">
        <div>
          <span class="label">Hoạt động:</span>
          <span class="value">{{ data.breakdown.attendance_points }}</span>
        </div>
        <div>
          <span class="label">Minh chứng:</span>
          <span class="value">{{ data.breakdown.evidence_points }}</span>
        </div>
      </div>
    </div>

    <!-- Combined Table -->
    <table class="pvcd-table" v-if="data">
      <thead>
        <tr>
          <th>Loại</th>
          <th>Tên hoạt động / Minh chứng</th>
          <th>Ngày</th>
          <th>Điểm</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in data.combined_list" :key="item._id">
          <td>
            <span 
              v-if="item.type === 'attendance'" 
              class="badge badge-primary"
            >
              Hoạt động
            </span>
            <span v-else class="badge badge-success">Minh chứng</span>
          </td>
          <td>{{ item.title }}</td>
          <td>{{ formatDate(item.date) }}</td>
          <td class="points">{{ item.points }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  props: {
    studentId: String,
    year: { type: Number, default: 2025 }
  },
  data() {
    return {
      data: null,
      loading: true,
      error: null
    }
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    async fetchData() {
      try {
        const response = await fetch(
          `/api/statistic/pvcd-breakdown?student_id=${this.studentId}&year=${this.year}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        const result = await response.json();
        this.data = result.data;
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },
    formatDate(date) {
      return new Date(date).toLocaleDateString('vi-VN');
    }
  }
}
</script>
```

---

## 📊 Data Structure Details

### `summary` Object
```javascript
{
  total_point: 30,              // Total PVCD points
  attendance_points: 10,        // Sum of attendance points
  evidence_points: 20,          // Sum of evidence points
  attendance_count: 2,          // Number of attendance records
  evidence_count: 1,            // Number of evidence records
  pvcd_record_total: 30         // Total from PVCD table (for verification)
}
```

### `breakdown` Object
```javascript
{
  attendance_points: 10,        // Attendance subtotal
  evidence_points: 20,          // Evidence subtotal
  total: 30                     // Grand total
}
```

### Attendance Item
```javascript
{
  _id: "507f1f77bcf86cd799439011",
  type: "attendance",           // Always "attendance"
  title: "Chuyên xe về quê ăn tết 0d",  // Activity name
  points: 10,                   // Points for this activity
  date: "2025-01-15T10:30:00.000Z",     // Scan date
  activity_id: "607f1f77bcf86cd799439020" // Activity ID
}
```

### Evidence Item
```javascript
{
  _id: "607f1f77bcf86cd799439030",
  type: "evidence",             // Always "evidence"
  title: "Sắp xếp lễ tình nguyện",    // Evidence title
  points: 20,                   // Faculty points
  date: "2025-02-10T09:00:00.000Z"    // Submitted date
}
```

### `combined_list`
- Array of all items (attendance + evidence)
- **Sorted by date descending** (newest first)
- Mixed type: includes both attendance and evidence
- **For displaying in a timeline/table**

---

## 🎯 Common Use Cases

### 1. Display Simple Breakdown
```javascript
const { summary } = data;
console.log(`Tổng điểm: ${summary.total_point}`);
console.log(`  Hoạt động: ${summary.attendance_points}`);
console.log(`  Minh chứng: ${summary.evidence_points}`);
```

### 2. Display All Items in Table
```javascript
// Use combined_list - already sorted by date
data.combined_list.forEach(item => {
  console.log(`${item.date}: [${item.type}] ${item.title} - ${item.points} pts`);
});
```

### 3. Group by Type
```javascript
const attendance = data.sources.attendance.items;
const evidence = data.sources.evidence.items;

// Render separately
renderAttendanceTable(attendance);
renderEvidenceTable(evidence);
```

### 4. Display Progress Bar
```javascript
const percentage = (data.summary.evidence_points / data.summary.total_point) * 100;
console.log(`Evidence: ${percentage.toFixed(1)}%`);
```

---

## ⚡ Tips for Frontend

✅ **Use `combined_list`** for timeline/activity log display  
✅ **Use `summary`** for quick stats display  
✅ **Use `sources`** to group by type separately  
✅ **Check `pvcd_record_total`** to verify calculation  
✅ **Format dates** in Vietnamese locale  
✅ **Use color/badge** to distinguish attendance vs evidence  
✅ **Sort by date** (already done in combined_list)  

---

## 🔒 Authentication

This endpoint requires JWT token in Authorization header:
```javascript
headers: {
  'Authorization': `Bearer ${token}`
}
```

---

## 📌 Notes

- Response is always in Vietnamese
- Dates are in ISO 8601 format (UTC)
- Points are numbers (not strings)
- `combined_list` is pre-sorted by date (descending)
- All IDs are MongoDB ObjectIDs
