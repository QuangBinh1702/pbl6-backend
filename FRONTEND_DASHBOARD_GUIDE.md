# Frontend Dashboard Implementation Guide

## Overview
The backend API for the admin dashboard is now complete. This guide shows how to implement the frontend dashboard page based on the image you provided.

---

## Dashboard Components Needed

Based on your screenshot, the dashboard should include:

### 1. Header Section
- **Title:** "Dashboard (năm hợp năm 2025)"
- **Year Selector:** Dropdown to select year (e.g., 2025)
- **Total Activities:** Display "Tổng số hoạt động từ năm: 328"

### 2. Monthly Activities Chart
- **Type:** Bar Chart (vertical bars)
- **Title:** "Hoạt động theo tháng"
- **X-axis:** Th1, Th2, Th3, Th4, Th5, Th6, Th7, Th8, Th9, Th10, Th11, Th12
- **Y-axis:** Number of activities (0-30+)
- **Color:** Blue bars

### 3. Activities by Organization (Pie Chart)
- **Type:** Pie Chart
- **Title:** "Hoạt động theo đơn vị tổ chức"
- **Data:** Shows distribution of activities across organizations
- **Colors:** Multiple distinct colors (green, blue, red, yellow, orange, purple, light blue)

### 4. Community Points by Faculty (Bar Chart)
- **Type:** Horizontal Bar Chart
- **Title:** "Điểm phục vụ cộng đồng theo khoa"
- **X-axis:** Faculty names (Khoa CNTT, Khoa Điện, Khoa Cơ khí, Khoa Hóa, Khoa Kinh tế)
- **Y-axis:** Average community points (0-100)
- **Color:** Teal/Green bars

---

## API Integration

### Endpoint
```
GET /api/statistics/dashboard-by-year?year=2025
```

### Response Structure
```javascript
{
  "success": true,
  "message": "Dashboard statistics retrieved successfully",
  "data": [{
    "year": 2025,
    "activity": {
      "monthly": [
        { "month": "Th1", "totalActivities": 12 },
        { "month": "Th2", "totalActivities": 9 },
        // ... 12 months total
      ],
      "byOrganization": [
        { "organization": "CLB Tình Nguyện", "totalActivities": 42 },
        { "organization": "Đoàn Khoa CNTT", "totalActivities": 31 },
        // ... all organizations
      ]
    },
    "communityPoint": [
      { "faculty": "Khoa CNTT", "avgCPoint": 82 },
      { "faculty": "Khoa Điện - Điện tử", "avgCPoint": 75 },
      // ... all faculties
    ]
  }]
}
```

---

## Recommended Chart Libraries

### Option 1: Chart.js (Most Popular)
```bash
npm install chart.js react-chartjs-2
```

### Option 2: Recharts (React Native)
```bash
npm install recharts
```

### Option 3: ECharts
```bash
npm install echarts apache-echarts
```

### Option 4: Plotly.js
```bash
npm install plotly.js react-plotly.js
```

---

## Sample Implementation (React + Chart.js)

### DashboardPage.jsx
```jsx
import React, { useState, useEffect } from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import axios from 'axios';
import './Dashboard.css';

const DashboardPage = () => {
  const [year, setYear] = useState(2025);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData(year);
  }, [year]);

  const fetchDashboardData = async (selectedYear) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `/api/statistics/dashboard-by-year?year=${selectedYear}`
      );
      if (response.data.success) {
        setData(response.data.data[0]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Đang tải...</div>;
  if (error) return <div className="error">Lỗi: {error}</div>;
  if (!data) return <div>Không có dữ liệu</div>;

  // Prepare data for monthly chart
  const monthlyChartData = {
    labels: data.activity.monthly.map(m => m.month),
    datasets: [{
      label: 'Số hoạt động',
      data: data.activity.monthly.map(m => m.totalActivities),
      backgroundColor: '#2196F3',
      borderColor: '#1976D2',
      borderWidth: 1
    }]
  };

  // Prepare data for organization pie chart
  const orgChartData = {
    labels: data.activity.byOrganization.map(o => o.organization),
    datasets: [{
      data: data.activity.byOrganization.map(o => o.totalActivities),
      backgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
        '#FF9F40', '#FF6384'
      ]
    }]
  };

  // Prepare data for community points
  const communityChartData = {
    labels: data.communityPoint.map(f => f.faculty),
    datasets: [{
      label: 'Điểm trung bình',
      data: data.communityPoint.map(f => f.avgCPoint),
      backgroundColor: '#4DB8A8',
      borderColor: '#388B7F',
      borderWidth: 1
    }]
  };

  const totalActivities = data.activity.monthly.reduce(
    (sum, m) => sum + m.totalActivities,
    0
  );

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard {year}</h1>
        <div className="year-selector">
          <label>Chọn năm:</label>
          <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
            {[2020, 2021, 2022, 2023, 2024, 2025].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="total-activities">
          <h3>Tổng số hoạt động từ năm: {totalActivities}</h3>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="chart-section">
          <h3>Hoạt động theo tháng</h3>
          <Bar data={monthlyChartData} options={{ responsive: true }} />
        </div>

        <div className="chart-section">
          <h3>Hoạt động theo đơn vị tổ chức</h3>
          <Pie data={orgChartData} options={{ responsive: true }} />
        </div>

        <div className="chart-section full-width">
          <h3>Điểm phục vụ cộng đồng theo khoa</h3>
          <Bar 
            data={communityChartData} 
            options={{
              responsive: true,
              indexAxis: 'y'
            }} 
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
```

### Dashboard.css
```css
.dashboard-container {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.dashboard-header {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.dashboard-header h1 {
  margin: 0 0 20px 0;
  color: #333;
}

.year-selector {
  margin-bottom: 15px;
}

.year-selector label {
  margin-right: 10px;
  font-weight: bold;
}

.year-selector select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.total-activities {
  background-color: #e3f2fd;
  padding: 15px;
  border-radius: 4px;
  border-left: 4px solid #2196F3;
}

.total-activities h3 {
  margin: 0;
  color: #1976D2;
}

.dashboard-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.chart-section {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.chart-section.full-width {
  grid-column: 1 / -1;
}

.chart-section h3 {
  margin-top: 0;
  color: #333;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 10px;
}

.loading, .error {
  text-align: center;
  padding: 40px;
  font-size: 16px;
}

.error {
  color: #d32f2f;
  background-color: #ffebee;
  border-radius: 4px;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .dashboard-content {
    grid-template-columns: 1fr;
  }
  
  .chart-section {
    grid-column: 1;
  }
}
```

---

## Data Transformation Examples

### Transform for Bar Chart (Monthly)
```javascript
const monthlyData = response.data.data[0].activity.monthly.map(item => ({
  month: item.month,
  activities: item.totalActivities
}));
```

### Transform for Pie Chart (Organizations)
```javascript
const orgData = response.data.data[0].activity.byOrganization.map(item => ({
  name: item.organization,
  value: item.totalActivities
}));
```

### Transform for Bar Chart (Community Points)
```javascript
const communityData = response.data.data[0].communityPoint.map(item => ({
  faculty: item.faculty,
  avgPoints: item.avgCPoint
}));
```

---

## Features to Implement

### Essential
- [x] API integration
- [ ] Year selector with dynamic data loading
- [ ] Monthly activities bar chart
- [ ] Organization pie chart
- [ ] Community points horizontal bar chart
- [ ] Total activities display
- [ ] Error handling and loading states

### Nice to Have
- [ ] Export data to CSV/PDF
- [ ] Date range picker (more flexible than year)
- [ ] Filter by organization
- [ ] Compare years side by side
- [ ] Detailed statistics modal
- [ ] Responsive design for mobile
- [ ] Chart animations
- [ ] Legend customization

---

## Testing Checklist

Before deploying, verify:
- [ ] Year selector changes data correctly
- [ ] All three charts render properly
- [ ] Chart data matches API response
- [ ] Error messages display correctly
- [ ] Loading state shows while fetching
- [ ] Responsive on different screen sizes
- [ ] No console errors
- [ ] API calls are made correctly

---

## Common Issues & Solutions

### Issue: Chart not rendering
**Solution:** Ensure Chart.js library is properly imported and chart type is correct

### Issue: Data not updating on year change
**Solution:** Verify useEffect dependency array includes year, and fetch function is called

### Issue: API 404 error
**Solution:** Verify API route is mounted in Express app at `/api/statistics`

### Issue: CORS errors
**Solution:** Ensure backend has proper CORS middleware configured

---

## Related API Documentation

See `API_DOCUMENTATION.md` for complete API reference including:
- Endpoint URL
- Query parameters
- Response format
- Error handling

---

## Integration with Existing Dashboard

If you have an existing dashboard structure:
1. Add the statistics route
2. Create new Dashboard component
3. Add navigation link in sidebar
4. Import and render the component

Example routing:
```jsx
<Route path="/admin/dashboard" element={<DashboardPage />} />
```

---

**Note:** All chart titles and labels should match Vietnamese terminology used in your system for consistency.
