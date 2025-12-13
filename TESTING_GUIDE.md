# Testing Guide - All Implemented APIs

## Setup

Before testing, ensure:
1. Backend is running on `http://localhost:5000` (or your configured port)
2. Database is properly seeded with test data
3. You have a valid JWT token for authentication (if required)

---

## 1. Dashboard Statistics by Year

### Endpoint
```
GET /api/statistics/dashboard-by-year?year=2025
```

### Test Cases

#### Test 1.1: Valid Year Request
```bash
curl -X GET "http://localhost:5000/api/statistics/dashboard-by-year?year=2025"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Dashboard statistics retrieved successfully",
  "data": [{
    "year": 2025,
    "activity": {
      "monthly": [
        { "month": "Th1", "totalActivities": 12 },
        ...
      ],
      "byOrganization": [
        { "organization": "CLB...", "totalActivities": 42 },
        ...
      ]
    },
    "communityPoint": [
      { "faculty": "Khoa CNTT", "avgCPoint": 82 },
      ...
    ]
  }]
}
```

**Validation Checklist:**
- [ ] Status code: 200
- [ ] Response has `success: true`
- [ ] `activity.monthly` has 12 items with months Th1-Th12
- [ ] `activity.byOrganization` is sorted by descending totalActivities
- [ ] `communityPoint` has average points per faculty

#### Test 1.2: Missing Year Parameter
```bash
curl -X GET "http://localhost:5000/api/statistics/dashboard-by-year"
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Year parameter is required"
}
```

**Validation Checklist:**
- [ ] Status code: 400
- [ ] Error message is clear

#### Test 1.3: Invalid Year Format
```bash
curl -X GET "http://localhost:5000/api/statistics/dashboard-by-year?year=invalid"
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Invalid year format"
}
```

#### Test 1.4: Out of Range Year
```bash
curl -X GET "http://localhost:5000/api/statistics/dashboard-by-year?year=1800"
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Invalid year format"
}
```

---

## 2. Organization CRUD Operations

### Test 2.1: Create Organization

#### Endpoint
```
POST /api/org-units
```

#### Request
```bash
curl -X POST http://localhost:5000/api/org-units \
  -H "Content-Type: application/json" \
  -d '{
    "name": "CLB Lập Trình",
    "founded_date": "2023-01-15",
    "description": "Câu lạc bộ dành cho các lập trình viên",
    "achievements": ["Giải nhất hackathon 2023", "Đạt ISO"],
    "type": "club"
  }'
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Tổ chức được tạo thành công",
  "data": {
    "_id": "mongodb_id",
    "name": "CLB Lập Trình",
    "founded_date": "2023-01-15T00:00:00.000Z",
    "description": "Câu lạc bộ dành cho các lập trình viên",
    "achievements": ["Giải nhất hackathon 2023", "Đạt ISO"],
    "type": "club",
    "leader_id": null
  }
}
```

**Validation Checklist:**
- [ ] Status code: 201
- [ ] Response has organization ID
- [ ] All fields are returned correctly
- [ ] Dates are in ISO format

#### Test 2.2: Create Organization - Missing Name
```bash
curl -X POST http://localhost:5000/api/org-units \
  -H "Content-Type: application/json" \
  -d '{
    "founded_date": "2023-01-15",
    "description": "Test club"
  }'
```

**Expected Response (400):**
```json
{
  "success": false,
  "message": "Tên tổ chức là bắt buộc"
}
```

#### Test 2.3: Create Organization - Invalid Date
```bash
curl -X POST http://localhost:5000/api/org-units \
  -H "Content-Type: application/json" \
  -d '{
    "name": "CLB Test",
    "founded_date": "2099-01-15"
  }'
```

**Expected Response (400):**
```json
{
  "success": false,
  "message": "Ngày thành lập không thể trong tương lai"
}
```

#### Test 2.4: Create Organization - Invalid Achievements
```bash
curl -X POST http://localhost:5000/api/org-units \
  -H "Content-Type: application/json" \
  -d '{
    "name": "CLB Test",
    "achievements": "not an array"
  }'
```

**Expected Response (400):**
```json
{
  "success": false,
  "message": "Thành tựu phải là một mảng"
}
```

### Test 2.5: Update Organization

#### Endpoint
```
PUT /api/org-units/:id
```

#### Request
```bash
curl -X PUT http://localhost:5000/api/org-units/ORGANIZATION_ID \
  -H "Content-Type: application/json" \
  -d '{
    "name": "CLB Lập Trình & AI",
    "description": "Updated description"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Tổ chức được cập nhật thành công",
  "data": {
    "_id": "mongodb_id",
    "name": "CLB Lập Trình & AI",
    "description": "Updated description",
    ...
  }
}
```

**Validation Checklist:**
- [ ] Status code: 200
- [ ] Only provided fields are updated
- [ ] Other fields remain unchanged

#### Test 2.6: Update Non-existent Organization
```bash
curl -X PUT http://localhost:5000/api/org-units/invalidid \
  -H "Content-Type: application/json" \
  -d '{"name": "Test"}'
```

**Expected Response (404):**
```json
{
  "success": false,
  "message": "Tổ chức không tồn tại"
}
```

---

## 3. Bulk User Creation

### Endpoint
```
POST /api/users/bulk/create
```

### Test 3.1: Create Multiple Users

#### Request
```bash
curl -X POST http://localhost:5000/api/users/bulk/create \
  -H "Content-Type: application/json" \
  -d '{
    "users": [
      {
        "username": "student001",
        "password": "securepass123",
        "email": "student001@university.edu.vn",
        "role": "student",
        "isLocked": false
      },
      {
        "username": "student002",
        "password": "securepass456",
        "email": "student002@university.edu.vn",
        "role": "student"
      }
    ]
  }'
```

**Expected Response:**
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
      },
      {
        "index": 1,
        "success": true,
        "user": {...}
      }
    ]
  }
}
```

**Validation Checklist:**
- [ ] Status code: 200
- [ ] Both users created successfully
- [ ] created count equals 2
- [ ] failed count equals 0
- [ ] Each user has _id assigned

#### Test 3.2: Bulk Create with Some Failures

#### Request
```bash
curl -X POST http://localhost:5000/api/users/bulk/create \
  -H "Content-Type: application/json" \
  -d '{
    "users": [
      {
        "username": "validuser",
        "password": "pass123",
        "email": "valid@test.com"
      },
      {
        "username": "student001",
        "password": "pass456",
        "email": "duplicate@test.com"
      }
    ]
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Created 1 users, with 1 errors",
  "data": {
    "created": 1,
    "failed": 1,
    "results": [...],
    "errors": [
      {
        "index": 1,
        "error": "Username already exists"
      }
    ]
  }
}
```

**Validation Checklist:**
- [ ] success: false (due to errors)
- [ ] created count: 1
- [ ] failed count: 1
- [ ] Error message is descriptive

#### Test 3.3: Empty Users Array
```bash
curl -X POST http://localhost:5000/api/users/bulk/create \
  -H "Content-Type: application/json" \
  -d '{"users": []}'
```

**Expected Response (400):**
```json
{
  "success": false,
  "message": "users array is required and must not be empty"
}
```

#### Test 3.4: Too Many Users (> 100)
```bash
# This would be 101 users - testing the limit
```

**Expected Response (400):**
```json
{
  "success": false,
  "message": "Maximum 100 users can be created at once"
}
```

#### Test 3.5: Missing Required Fields
```bash
curl -X POST http://localhost:5000/api/users/bulk/create \
  -H "Content-Type: application/json" \
  -d '{
    "users": [
      {
        "username": "user1"
      }
    ]
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Created 0 users, with 1 errors",
  "data": {
    "created": 0,
    "failed": 1,
    "errors": [
      {
        "index": 0,
        "error": "Password is required"
      }
    ]
  }
}
```

#### Test 3.6: Invalid Email Format
```bash
curl -X POST http://localhost:5000/api/users/bulk/create \
  -H "Content-Type: application/json" \
  -d '{
    "users": [
      {
        "username": "user1",
        "password": "pass123",
        "email": "notanemail"
      }
    ]
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Created 0 users, with 1 errors",
  "data": {
    "errors": [
      {
        "index": 0,
        "error": "Invalid email format"
      }
    ]
  }
}
```

---

## 4. Activity Requirements (Create & Update)

### Test 4.1: Create Activity with Requirements

#### Endpoint
```
POST /api/activities
```

#### Request
```bash
curl -X POST http://localhost:5000/api/activities \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Workshop Data Science",
    "description": "Basic data science workshop",
    "location": "Room 101",
    "start_time": "2025-12-10T10:00:00.000Z",
    "end_time": "2025-12-10T16:00:00.000Z",
    "capacity": 50,
    "org_unit_id": "ORG_ID",
    "field_id": "FIELD_ID",
    "requirements": [
      {
        "type": "faculty",
        "id": "FACULTY_ID"
      },
      {
        "type": "cohort",
        "id": "COHORT_ID"
      }
    ]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "activity_id",
    "title": "Workshop Data Science",
    "status": "chưa tổ chức",
    ...
  }
}
```

**Validation Checklist:**
- [ ] Activity created successfully
- [ ] Status code: 201
- [ ] No warnings if valid requirements
- [ ] Requirements are saved in database

#### Test 4.2: Create Activity with Invalid Requirements

#### Request
```bash
curl -X POST http://localhost:5000/api/activities \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Activity",
    "start_time": "2025-12-10T10:00:00.000Z",
    "end_time": "2025-12-10T16:00:00.000Z",
    "requirements": [
      {
        "type": "faculty",
        "id": "INVALID_ID"
      }
    ]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {...},
  "warnings": [
    "Không tìm thấy khoa với id: \"INVALID_ID\""
  ]
}
```

**Validation Checklist:**
- [ ] Activity still created
- [ ] Warning messages included
- [ ] Invalid requirements not saved

### Test 4.3: Update Activity Requirements

#### Endpoint
```
PUT /api/activities/:id
```

#### Request
```bash
curl -X PUT http://localhost:5000/api/activities/ACTIVITY_ID \
  -H "Content-Type: application/json" \
  -d '{
    "requirements": [
      {
        "type": "cohort",
        "id": "NEW_COHORT_ID"
      }
    ]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {...}
}
```

**Validation Checklist:**
- [ ] Status code: 200
- [ ] Old requirements removed
- [ ] New requirements added
- [ ] Activity updated in database

---

## 5. Activity Status Filtering

### Test 5.1: Filter by Activity Status

#### Endpoint
```
GET /api/activities/student/:student_id/filter?status=đã tổ chức
```

#### Request
```bash
curl -X GET "http://localhost:5000/api/activities/student/STUDENT_ID/filter?status=đã tổ chức"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "activity_id",
      "title": "Completed Activity",
      "status": "đã tổ chức",
      ...
    }
  ],
  "count": 1
}
```

**Validation Checklist:**
- [ ] Only activities with status "đã tổ chức" returned
- [ ] Status is in Vietnamese
- [ ] Count matches returned items

#### Test 5.2: Filter with English Status

#### Request
```bash
curl -X GET "http://localhost:5000/api/activities/student/STUDENT_ID/filter?status=completed"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "status": "đã tổ chức",
      ...
    }
  ]
}
```

**Validation Checklist:**
- [ ] English status accepted
- [ ] Response still in Vietnamese
- [ ] Same activities returned as Vietnamese filter

#### Test 5.3: Filter with Multiple Criteria

#### Request
```bash
curl -X GET "http://localhost:5000/api/activities/student/STUDENT_ID/filter?status=đã tổ chức&field_id=FIELD_ID&org_unit_id=ORG_ID"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "status": "đã tổ chức",
      "field_id": { "_id": "FIELD_ID", ... },
      "org_unit_id": { "_id": "ORG_ID", ... }
    }
  ]
}
```

**Validation Checklist:**
- [ ] All filter criteria applied
- [ ] Only matching activities returned
- [ ] Multiple filters work together (AND logic)

---

## 6. Database Verification

After each test, verify data in MongoDB:

### Check Organization Created
```javascript
db.org_unit.findOne({ name: "CLB Test" })
```

### Check Users Created
```javascript
db.user.find({ username: { $in: ["student001", "student002"] } })
```

### Check Activity Requirements
```javascript
db.activity_eligibility.find({ activity_id: ObjectId("ACTIVITY_ID") })
```

---

## Performance Testing

### Load Testing Dashboard API
```bash
# Using Apache Bench
ab -n 100 -c 10 "http://localhost:5000/api/statistics/dashboard-by-year?year=2025"
```

**Expected Results:**
- Response time: < 500ms
- Success rate: 100%
- No 500 errors

### Bulk User Creation Performance
```bash
# Create 100 users at once
# Test should complete in < 5 seconds
```

---

## Validation Checklist - All Tests

- [ ] Dashboard API returns correct data structure
- [ ] Year filtering works correctly
- [ ] Organization creation validates all fields
- [ ] Organization update supports partial updates
- [ ] Bulk user creation handles duplicates
- [ ] User validation works for all fields
- [ ] Activity requirements saved in create
- [ ] Activity requirements saved in update
- [ ] Activity requirements saved in suggest
- [ ] Status filtering works with Vietnamese
- [ ] Status filtering works with English
- [ ] Multiple filters work together
- [ ] Error messages are clear and helpful
- [ ] All responses have consistent format
- [ ] No SQL/MongoDB injection vulnerabilities
- [ ] Proper HTTP status codes used

---

## Troubleshooting

### Issue: 404 endpoint not found
**Solution:** Verify routes are registered in Express app

### Issue: Database connection error
**Solution:** Check MongoDB connection string and database availability

### Issue: CORS errors in frontend
**Solution:** Verify CORS middleware is configured properly

### Issue: JWT validation errors
**Solution:** Ensure valid token is included in Authorization header for protected routes

### Issue: Validation error messages in English instead of Vietnamese
**Solution:** Check error message strings in controllers

---

## Notes

- All timestamps should be in ISO 8601 format
- All IDs are MongoDB ObjectIds
- All responses should include `success` boolean
- Error responses should include descriptive `message`
- Dates should not allow future dates (creation dates)
- Email validation should reject invalid formats

---

**Last Updated:** December 13, 2025
**Test Coverage:** All implemented features
