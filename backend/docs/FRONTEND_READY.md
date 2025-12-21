# 🎨 Frontend Ready - API Available

## ✅ API Endpoint Ready

```
GET /api/statistic/pvcd-breakdown?student_id=<ID>&year=<YEAR>
```

---

## 📋 What Frontend Gets

### Summary Section
```
Tổng điểm: 30
  Hoạt động: 10
  Minh chứng: 20
```

### Breakdown Section
```
Loại | Tên | Ngày | Điểm
-----|------|------|------
Hoạt động | Chuyên xe... | 15/01/2025 | 10
Minh chứng | Sắp xếp... | 10/02/2025 | 20
Hoạt động | Hội thảo AI | 01/10/2025 | 10
```

---

## 🔗 Response Structure

**Main fields**:
- `summary` - Total & counts
- `breakdown` - Attendance + Evidence split
- `sources` - Organized by type
- `combined_list` - All items sorted by date ✅ (use this for table)

---

## 💻 Code Examples

### React
```javascript
const [data, setData] = useState(null);

useEffect(() => {
  fetch(`/api/statistic/pvcd-breakdown?student_id=${studentId}&year=2025`)
    .then(r => r.json())
    .then(res => setData(res.data));
}, [studentId]);

// Display
<h3>{data.summary.total_point} điểm</h3>
<table>
  {data.combined_list.map(item => (
    <tr>
      <td>{item.type === 'attendance' ? '🎓' : '📋'}</td>
      <td>{item.title}</td>
      <td>{item.points}</td>
    </tr>
  ))}
</table>
```

### Vue
```vue
<div>
  <h3>{{ data.summary.total_point }} điểm</h3>
  <table>
    <tr v-for="item in data.combined_list" :key="item._id">
      <td>{{ item.type === 'attendance' ? '🎓 Hoạt động' : '📋 Minh chứng' }}</td>
      <td>{{ item.title }}</td>
      <td>{{ item.points }}</td>
    </tr>
  </table>
</div>
```

---

## 📊 Response Example (Real Data)

```json
{
  "success": true,
  "data": {
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
    "combined_list": [
      {
        "type": "evidence",
        "title": "Sắp xếp lễ tình nguyện",
        "points": 20,
        "date": "2025-02-10T09:00:00.000Z"
      },
      {
        "type": "attendance",
        "title": "Chuyên xe về quê ăn tết",
        "points": 10,
        "date": "2025-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

---

## 🎯 Quick Integration Steps

1. **Call API**
   ```javascript
   const response = await fetch(
     `/api/statistic/pvcd-breakdown?student_id=${studentId}&year=2025`
   );
   const { data } = await response.json();
   ```

2. **Display Summary**
   ```javascript
   <div>Tổng: {data.summary.total_point}</div>
   <div>Hoạt động: {data.breakdown.attendance_points}</div>
   <div>Minh chứng: {data.breakdown.evidence_points}</div>
   ```

3. **Display Table**
   ```javascript
   <table>
     {data.combined_list.map(item => (
       <tr>
         <td>{item.type === 'attendance' ? 'Hoạt động' : 'Minh chứng'}</td>
         <td>{item.title}</td>
         <td>{item.points}</td>
       </tr>
     ))}
   </table>
   ```

---

## 📚 Full Documentation

See: **API_FRONTEND_GUIDE.md** for complete reference

---

## ✨ Key Points

✅ **Endpoint**: `/api/statistic/pvcd-breakdown`  
✅ **Method**: GET  
✅ **Parameters**: `student_id`, `year` (optional)  
✅ **Response**: JSON with summary + breakdown + combined list  
✅ **Combined list**: Sorted by date (newest first)  
✅ **Types**: Includes both "attendance" and "evidence"  
✅ **Points**: From `attendance.points` + `evidence.faculty_point`  

---

## 🚀 Ready to Use

API is fully implemented and tested. Frontend can start integration immediately!

**Test endpoint first**:
```bash
curl "http://localhost:5000/api/statistic/pvcd-breakdown?student_id=691d63565bcc1aa642a2f078&year=2025"
```
