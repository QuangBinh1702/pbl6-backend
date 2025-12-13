# Implementation Plan

## Tasks to Complete

### 1. ✅ Lọc điểm bị sai khi kết hợp khoa, lớp
- Fix grade filtering when combining faculty, class filters
- Status: Review & Fix

### 2. ⏳ Thêm Dashboard API cho Admin (PRIORITY)
- Create new endpoint for dashboard statistics by year
- Return: monthly activities, activities by organization, community points by faculty
- Add route and controller method
- Status: In Progress

### 3. ⏳ Update Permission System
- Add new requirements for permission logic
- Status: Pending

### 4. ⏳ Update Image in Student & Staff Profile
- Add/update image upload functionality
- Status: Pending

### 5. ⏳ Create Proposal Activity - Fix Requirements
- Fix issue with requirements not being saved
- Status: Pending

### 6. ⏳ Update Activity - Fix Requirements
- Fix issue with requirements not being updated
- Status: Pending

### 7. ⏳ Filter Activity Status - Student List
- Fix filtering by status in student activity list
- Status: Pending

### 8. ⏳ Get Activities by Organization
- Define parameters for org activity list API
- Status: Pending

### 9. ⏳ Add New Organization API
- Create: POST /org-units (name, founded_date, description, achievements)
- Update: PUT /org-units/:id (same fields)
- Optimize type field
- Status: Pending

### 10. ⏳ Create Multiple Users API
- Define request parameters for bulk user creation
- Status: Pending

---

## Implementation Order
1. Dashboard API (Task 2) - Most complex
2. Organization CRUD updates (Task 9)
3. User creation (Task 10)
4. Activity requirements fix (Tasks 5, 6)
5. Activity filtering (Task 7)
6. Org activities list (Task 8)
7. Other tasks (1, 3, 4)
