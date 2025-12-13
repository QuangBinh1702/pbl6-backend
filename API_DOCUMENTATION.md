# API Documentation - New & Updated Endpoints

## 1. Dashboard Statistics by Year (Task 2)
**Endpoint:** `GET /api/statistics/dashboard-by-year?year=2025`

**Query Parameters:**
- `year` (required, number): The year to get statistics for (e.g., 2025)

**Response:**
```json
{
  "success": true,
  "message": "Dashboard statistics retrieved successfully",
  "data": [
    {
      "year": 2025,
      "activity": {
        "monthly": [
          { "month": "Th1", "totalActivities": 12 },
          { "month": "Th2", "totalActivities": 9 },
          ...
        ],
        "byOrganization": [
          { "organization": "CLB Tình Nguyện", "totalActivities": 42 },
          { "organization": "Đoàn Khoa CNTT", "totalActivities": 31 },
          ...
        ]
      },
      "communityPoint": [
        { "faculty": "Khoa CNTT", "avgCPoint": 82 },
        { "faculty": "Khoa Điện - Điện tử", "avgCPoint": 75 },
        ...
      ]
    }
  ]
}
```

---

## 2. Organization CRUD - Create (Task 9)
**Endpoint:** `POST /api/org-units`

**Request Body:**
```json
{
  "name": "CLB Lập Trình",
  "founded_date": "2020-09-15",
  "description": "Câu lạc bộ cho những lập trình viên trẻ",
  "achievements": [
    "Giải nhất hackathon 2023",
    "Đạt chứng chỉ ISO"
  ],
  "leader_id": "mongodb_id_of_staff_profile"
}
```

**Validation Rules:**
- `name` (required, string): Non-empty organization name
- `founded_date` (optional, ISO date): Cannot be in the future
- `description` (optional, string): Text description
- `achievements` (optional, array): Array of achievement strings
- `leader_id` (optional, string): Must reference existing StaffProfile

**Response:**
```json
{
  "success": true,
  "message": "Tổ chức được tạo thành công",
  "data": {
    "_id": "org_id",
    "name": "CLB Lập Trình",
    "founded_date": "2020-09-15T00:00:00Z",
    "description": "Câu lạc bộ cho những lập trình viên trẻ",
    "achievements": ["Giải nhất hackathon 2023", "Đạt chứng chỉ ISO"],
    "leader_id": {...},
    "type": "club"
  }
}
```

---

## 3. Organization CRUD - Update (Task 9)
**Endpoint:** `PUT /api/org-units/:id`

**Request Body:** (All fields optional)
```json
{
  "name": "CLB Lập Trình & AI",
  "founded_date": "2020-09-15",
  "description": "Câu lạc bộ phát triển kỹ năng lập trình và AI",
  "achievements": [
    "Giải nhất hackathon 2023",
    "Đạt chứng chỉ ISO",
    "Top 10 competition 2024"
  ],
  "leader_id": "new_staff_id"
}
```

**Response:** Same as create

---

## 4. Create Multiple Users (Task 10)
**Endpoint:** `POST /api/users/bulk/create`

**Request Body:**
```json
{
  "users": [
    {
      "username": "student001",
      "password": "password123",
      "email": "student001@university.edu.vn",
      "role": "student",
      "isLocked": false
    },
    {
      "username": "student002",
      "password": "password456",
      "email": "student002@university.edu.vn",
      "role": "student"
    }
  ]
}
```

**Validation Rules:**
- Maximum 100 users per request
- Each user must have `username`, `password`, `email`
- Email format validation
- Username and email must be unique globally and within batch
- `role` defaults to 'student' if not provided
- `isLocked` defaults to false if not provided

**Response:**
```json
{
  "success": true,
  "message": "Created 2 users",
  "data": {
    "created": 2,
    "failed": 0,
    "results": [
      {
        "index": 0,
        "success": true,
        "user": {
          "_id": "user_id",
          "username": "student001",
          "email": "student001@university.edu.vn",
          "role": "student",
          "isLocked": false
        }
      }
    ]
  }
}
```

---

## 5. Create Single User (Updated - Task 10)
**Endpoint:** `POST /api/users`

**Request Body:**
```json
{
  "username": "newstudent",
  "password": "securepass123",
  "email": "newstudent@university.edu.vn",
  "role": "student",
  "isLocked": false
}
```

**Validation Rules:**
- All fields required: `username`, `password`, `email`
- Email format validation required
- Username and email must be unique

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "_id": "user_id",
    "username": "newstudent",
    "email": "newstudent@university.edu.vn",
    "role": "student",
    "isLocked": false
  }
}
```

---

## 6. Create Activity with Requirements (Updated - Task 5)
**Endpoint:** `POST /api/activities`

**Request Body:**
```json
{
  "title": "Workshop Data Science",
  "description": "Workshop về Data Science cơ bản",
  "location": "Hội trường F",
  "start_time": "2025-12-10T11:00:00.000Z",
  "end_time": "2025-12-10T16:00:00.000Z",
  "capacity": 30,
  "org_unit_id": "org_id",
  "field_id": "field_id",
  "requires_approval": true,
  "requirements": [
    {
      "type": "faculty",
      "id": "faculty_id"
    },
    {
      "type": "cohort",
      "id": "cohort_id"
    }
  ]
}
```

**Note:** Requirements are now properly saved when creating activities

---

## 7. Suggest Activity with Requirements (Updated - Task 5)
**Endpoint:** `POST /api/activities/suggest`

**Request Body:** Same as create activity, with optional `requirements`

**Note:** Requirements now properly saved for suggested activities

---

## 8. Update Activity with Requirements (Fixed - Task 6)
**Endpoint:** `PUT /api/activities/:id`

**Request Body:**
```json
{
  "title": "Updated Workshop Title",
  "requirements": [
    {
      "type": "faculty",
      "id": "new_faculty_id"
    }
  ]
}
```

**Note:** Requirements are properly updated and replaced when provided

---

## 9. Get Student Activities with Status Filter (Fixed - Task 7)
**Endpoint:** `GET /api/activities/student/:student_id/filter?status=đã tổ chức&field_id=...&org_unit_id=...&title=...`

**Query Parameters:**
- `status` (optional, string): Can be Vietnamese (e.g., "đã tổ chức") or English (e.g., "completed")
- `field_id` (optional, string): Filter by field/category ID or name
- `org_unit_id` (optional, string): Filter by organization ID or name
- `title` (optional, string): Partial match on activity title

**Valid Status Values:**
- Vietnamese: "chờ duyệt", "chưa tổ chức", "đang tổ chức", "đã tổ chức", "từ chối", "hủy hoạt động"
- English: "pending", "approved", "in_progress", "completed", "rejected", "cancelled"

**Note:** Status filtering now works correctly on activity status (not just registration status)

---

## 10. Get Activities by Organization (Task 8)
**Endpoint:** `GET /api/activities?org_unit_id=org_id`

**Query Parameters:**
- `org_unit_id` (optional, string): Filter by organization unit ID
- `field_id` (optional, string): Filter by field/category ID
- `status` (optional, string): Filter by status (Vietnamese or English)
- `start_date` (optional, ISO date): Filter activities starting from this date
- `end_date` (optional, ISO date): Filter activities ending before this date

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "activity_id",
      "title": "Activity Title",
      "status": "đã tổ chức",
      "org_unit_id": { "_id": "org_id", "name": "Organization Name" },
      "field_id": { "_id": "field_id", "name": "Field Name" },
      "start_time": "2025-12-10T11:00:00.000Z",
      "end_time": "2025-12-10T16:00:00.000Z",
      "requirements": [
        { "type": "faculty", "id": "...", "name": "..." },
        { "type": "cohort", "id": "...", "year": "..." }
      ]
    }
  ]
}
```

---

## Error Handling

All endpoints follow this error format:
```json
{
  "success": false,
  "message": "Error description in English or Vietnamese"
}
```

### Common Validation Errors:
- 400: Bad Request - Missing required fields or invalid format
- 404: Not Found - Resource doesn't exist
- 500: Server Error

---

## Notes

1. **Dashboard by Year** - Returns statistics for selected year with monthly breakdown and faculty-wise community points
2. **Organization Management** - All fields are now properly validated with clear error messages in Vietnamese
3. **Bulk User Creation** - Efficiently creates multiple users with duplicate detection and batch validation
4. **Activity Requirements** - Now properly saved in all scenarios (create, suggest, update)
5. **Status Filtering** - Supports both Vietnamese and English status values for flexibility
6. **Organization Activities** - Can be filtered by multiple criteria simultaneously
