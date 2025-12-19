# Bulk Student Import API Documentation

## Endpoint

**POST** `/api/auth/bulk-import-students`

## Description

Bulk import students from JSON. Creates user accounts and student profiles for multiple students at once.

### Features
- Default username and password = student code
- Unique student code validation (no duplicates allowed)
- Automatic class mapping by class name and faculty
- Detailed success/failure reporting
- Transaction-safe processing

## Authentication

- **Required**: Yes (Bearer Token)
- **Header**: `Authorization: Bearer <token>`
- **Role**: Must have `user:CREATE` permission

## Request Format

```json
{
  "students": [
    {
      "studentCode": "SV001",
      "fullName": "Nguyễn Văn A",
      "className": "CNTT1",
      "faculty": "Công nghệ thông tin"
    },
    {
      "studentCode": "SV002",
      "fullName": "Trần Thị B",
      "className": "KT2",
      "faculty": "Kinh tế"
    }
  ]
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `studentCode` | String | Yes | Unique student identifier (e.g., student ID) |
| `fullName` | String | Yes | Full name of the student |
| `className` | String | No | Class name (e.g., "CNTT1", "KT2") |
| `faculty` | String | No | Faculty/Department name (e.g., "Công nghệ thông tin") |

### Constraints

- Maximum 1000 students per request
- `studentCode` must be unique (no duplicates in batch or database)
- `fullName` must not be empty

## Response Format

### Success Response (HTTP 201)

```json
{
  "success": true,
  "message": "Created 2 accounts, 0 failed",
  "data": {
    "summary": {
      "total": 2,
      "successful": 2,
      "failed": 0
    },
    "successful": [
      {
        "studentCode": "SV001",
        "fullName": "Nguyễn Văn A",
        "className": "CNTT1",
        "faculty": "Công nghệ thông tin",
        "username": "SV001",
        "password": "SV001",
        "userId": "507f1f77bcf86cd799439011",
        "studentProfileId": "507f1f77bcf86cd799439012"
      },
      {
        "studentCode": "SV002",
        "fullName": "Trần Thị B",
        "className": "KT2",
        "faculty": "Kinh tế",
        "username": "SV002",
        "password": "SV002",
        "userId": "507f1f77bcf86cd799439013",
        "studentProfileId": "507f1f77bcf86cd799439014"
      }
    ],
    "failed": []
  }
}
```

### Partial Failure Response (HTTP 201)

```json
{
  "success": true,
  "message": "Created 1 accounts, 1 failed",
  "data": {
    "summary": {
      "total": 2,
      "successful": 1,
      "failed": 1
    },
    "successful": [
      {
        "studentCode": "SV001",
        "fullName": "Nguyễn Văn A",
        "className": "CNTT1",
        "faculty": "Công nghệ thông tin",
        "username": "SV001",
        "password": "SV001",
        "userId": "507f1f77bcf86cd799439011",
        "studentProfileId": "507f1f77bcf86cd799439012"
      }
    ],
    "failed": [
      {
        "rowIndex": 2,
        "studentCode": "SV002",
        "fullName": "Trần Thị B",
        "reason": "Student code already exists in the system"
      }
    ]
  }
}
```

## Error Responses

### 400 - Bad Request

```json
{
  "success": false,
  "message": "Students array is required and must not be empty"
}
```

### 401 - Unauthorized

```json
{
  "success": false,
  "message": "Unauthorized"
}
```

### 500 - Server Error

```json
{
  "success": false,
  "message": "Error processing bulk import",
  "error": "Database connection error"
}
```

## Validation Rules

### Success Criteria
1. ✓ Student code is provided and not empty
2. ✓ Full name is provided and not empty
3. ✓ Student code is unique (in batch and database)
4. ✓ User account created successfully
5. ✓ Student profile created successfully

### Failure Reasons

| Reason | Description |
|--------|-------------|
| `Student code is required` | Empty or missing student code |
| `Full name is required` | Empty or missing full name |
| `Duplicate student code in batch` | Student code appears multiple times in the request |
| `Student code already exists in the system` | Student code exists in database |
| `[Error message]` | Any database or system error |

## Account Creation Details

### Default Credentials
- **Username**: Same as student code (e.g., "SV001")
- **Password**: Same as student code (e.g., "SV001")
- **Role**: Student

### Automatic Class Mapping
If both `className` and `faculty` are provided:
1. System searches for faculty by name (case-insensitive)
2. Within that faculty, searches for class by name
3. If found, associates student with that class
4. If not found, class_id remains null (student can be added to class later)

## Example Usage

### cURL

```bash
curl -X POST http://localhost:5000/api/auth/bulk-import-students \
  -H "Authorization: Bearer your_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "students": [
      {
        "studentCode": "SV001",
        "fullName": "Nguyễn Văn A",
        "className": "CNTT1",
        "faculty": "Công nghệ thông tin"
      },
      {
        "studentCode": "SV002",
        "fullName": "Trần Thị B",
        "className": "KT2",
        "faculty": "Kinh tế"
      }
    ]
  }'
```

### JavaScript (Fetch)

```javascript
const token = 'your_token_here';
const studentsData = {
  students: [
    {
      studentCode: 'SV001',
      fullName: 'Nguyễn Văn A',
      className: 'CNTT1',
      faculty: 'Công nghệ thông tin'
    },
    {
      studentCode: 'SV002',
      fullName: 'Trần Thị B',
      className: 'KT2',
      faculty: 'Kinh tế'
    }
  ]
};

const response = await fetch('http://localhost:5000/api/auth/bulk-import-students', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(studentsData)
});

const result = await response.json();
console.log(result);
```

### Python

```python
import requests
import json

token = 'your_token_here'
students_data = {
    'students': [
        {
            'studentCode': 'SV001',
            'fullName': 'Nguyễn Văn A',
            'className': 'CNTT1',
            'faculty': 'Công nghệ thông tin'
        },
        {
            'studentCode': 'SV002',
            'fullName': 'Trần Thị B',
            'className': 'KT2',
            'faculty': 'Kinh tế'
        }
    ]
}

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

response = requests.post(
    'http://localhost:5000/api/auth/bulk-import-students',
    headers=headers,
    json=students_data
)

print(response.json())
```

## Notes

- All created accounts are **active** by default
- All created accounts are **not locked** by default
- Passwords are returned in the success response for initial setup (should be kept securely)
- Students should change their password on first login
- Class mapping is case-insensitive for faculty names
- Class name matching is case-sensitive
- If class is not found, student will be created without class assignment

## Excel Integration (Frontend)

The frontend should parse Excel files following the template structure:

| Mã sinh viên | Họ và tên | Khoa | Lớp |
|-------|-----------|------|-----|
| SV001 | Nguyễn Văn A | Công nghệ thông tin | CNTT1 |
| SV002 | Trần Thị B | Kinh tế | KT2 |

Then send the data as JSON to this endpoint.
