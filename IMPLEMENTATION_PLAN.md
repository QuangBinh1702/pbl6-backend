# Kế hoạch thực hiện: Evidence Review với Faculty Permission

## Vấn đề
Staff có thể thuộc nhiều tổ chức cùng lúc (khoa, đoàn trường, etc). Khi duyệt minh chứng sinh viên, cần kiểm tra staff cùng khoa với sinh viên.

## Giải pháp
Sử dụng **many-to-many relationship** `staff_org_unit` để staff có thể thuộc nhiều tổ chức, nhưng vẫn kiểm soát duyệt minh chứng theo khoa.

---

## Database Changes

### 1. Thêm parent_id vào org_unit (cấu trúc phân cấp)
```sql
ALTER TABLE org_unit 
ADD COLUMN parent_id BIGINT AFTER type;

ALTER TABLE org_unit 
ADD CONSTRAINT fk_org_unit_parent 
FOREIGN KEY(parent_id) REFERENCES org_unit(id) 
ON UPDATE NO ACTION ON DELETE NO ACTION;

CREATE INDEX idx_org_unit_parent ON org_unit(parent_id);
```

### 2. Xóa org_unit_id cũ, thêm primary_faculty_id vào staff_profile
```sql
ALTER TABLE staff_profile DROP FOREIGN KEY fk_staff_org_unit;
ALTER TABLE staff_profile DROP COLUMN org_unit_id;

ALTER TABLE staff_profile 
ADD COLUMN primary_faculty_id BIGINT AFTER phone;

ALTER TABLE staff_profile 
ADD CONSTRAINT fk_staff_faculty 
FOREIGN KEY(primary_faculty_id) REFERENCES org_unit(id) 
ON UPDATE NO ACTION ON DELETE NO ACTION;

CREATE INDEX idx_staff_faculty ON staff_profile(primary_faculty_id);
```

### 3. Tạo bảng staff_org_unit (many-to-many)
```sql
CREATE TABLE `staff_org_unit` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `staff_id` BIGINT NOT NULL,
  `org_unit_id` BIGINT NOT NULL,
  `role_in_unit` VARCHAR(100),
  `assigned_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_staff_org_unit` (`staff_id`, `org_unit_id`),
  FOREIGN KEY(`staff_id`) REFERENCES `staff_profile`(`id`) ON DELETE CASCADE,
  FOREIGN KEY(`org_unit_id`) REFERENCES `org_unit`(`id`) ON DELETE CASCADE
);

CREATE INDEX idx_staff_org_unit ON staff_org_unit(staff_id, org_unit_id);
```

### 4. Cập nhật evidence (thêm tracking người duyệt)
```sql
ALTER TABLE evidence 
ADD COLUMN class_reviewer_id BIGINT AFTER student_id;
ALTER TABLE evidence ADD COLUMN class_reviewed_at DATETIME;
ALTER TABLE evidence ADD COLUMN faculty_reviewer_id BIGINT;
ALTER TABLE evidence ADD COLUMN faculty_reviewed_at DATETIME;
ALTER TABLE evidence ADD COLUMN class_feedback VARCHAR(500);
ALTER TABLE evidence ADD COLUMN faculty_feedback VARCHAR(500);
ALTER TABLE evidence ADD COLUMN faculty_points INT;

ALTER TABLE evidence MODIFY COLUMN status ENUM('pending', 'approved_class', 'approved_faculty', 'rejected') DEFAULT 'pending';

ALTER TABLE evidence 
ADD CONSTRAINT fk_evidence_class_reviewer 
FOREIGN KEY(class_reviewer_id) REFERENCES staff_profile(id) ON DELETE NO ACTION;

ALTER TABLE evidence 
ADD CONSTRAINT fk_evidence_faculty_reviewer 
FOREIGN KEY(faculty_reviewer_id) REFERENCES staff_profile(id) ON DELETE NO ACTION;
```

---

## Mongoose Schemas

### 1. StaffProfile (cập nhật)
- Xóa `org_unit_id`
- Thêm `primary_faculty_id`

### 2. StaffOrgUnit (tạo mới)
```javascript
{
  staff_id: ObjectId (ref: StaffProfile),
  org_unit_id: ObjectId (ref: OrgUnit),
  role_in_unit: String (teacher, officer, director),
  assigned_at: Date
}
```

### 3. OrgUnit (cập nhật)
- Thêm `parent_id: ObjectId (ref: OrgUnit)`

### 4. Evidence (cập nhật)
- Thêm `class_reviewer_id, faculty_reviewer_id`
- Thêm `class_reviewed_at, faculty_reviewed_at`
- Thêm `class_feedback, faculty_feedback`
- Thêm `faculty_points`
- Sửa status enum

---

## Middleware: checkFacultyApproveAccess

**Logic:**
1. Lấy staff profile từ user_id
2. Lấy tất cả org_unit của staff từ staff_org_unit table
3. Lấy khoa cha của từng org_unit (nếu là department)
4. So sánh khoa sinh viên với khoa của staff
5. Cho phép/từ chối

**Cách tìm khoa cha:**
- Nếu `org_unit.type = 'faculty'` → dùng trực tiếp
- Nếu `org_unit.type = 'department'` → theo `parent_id` đến khoa
- Nếu `org_unit.type = 'organization'` → bỏ qua, không dùng để duyệt minh chứng

---

## Routes & Controllers

### Approve Evidence (cấp lớp)
- Route: `PUT /evidence/:id/approve-class`
- Middleware: `checkPermissionOrClassMonitor`
- Controller: `approveEvidenceClass`
- Update: `status = 'approved_class', class_reviewer_id`

### Approve Evidence (cấp khoa)
- Route: `PUT /evidence/:id/approve-faculty`
- Middleware: `checkFacultyApproveAccess`
- Controller: `approveEvidenceFaculty`
- Update: `status = 'approved_faculty', faculty_reviewer_id`

### Reject Evidence (cấp khoa)
- Route: `PUT /evidence/:id/reject-faculty`
- Middleware: `checkFacultyApproveAccess`
- Controller: `rejectEvidenceFaculty`
- Update: `status = 'rejected', faculty_reviewer_id`

---

## Staff Organization Management

### Lấy tổ chức của staff
- Route: `GET /staff/:staffId/organizations`
- Return: `[{ org_unit_id, role_in_unit, assigned_at }]`

### Thêm staff vào tổ chức
- Route: `POST /staff/:staffId/organizations`
- Body: `{ org_unit_id, role_in_unit }`
- Validate: Không trùng lặp

### Xóa staff khỏi tổ chức
- Route: `DELETE /staff/:staffId/organizations/:orgUnitId`

---

## Data Example

**org_unit:**
```
| id | name               | type         | parent_id |
|----|-------------------|--------------|-----------|
| 1  | Khoa CNTT         | faculty      | NULL      |
| 2  | Phòng Đào Tạo     | department   | 1         |
| 3  | Khoa Điện         | faculty      | NULL      |
| 4  | Đoàn Trường       | organization | NULL      |
| 5  | Văn Phòng Đoàn    | department   | 4         |
```

**staff_profile:**
```
| id | user_id | full_name   | primary_faculty_id |
|----|---------|-------------|-------------------|
| 1  | user-A  | Trần Văn A  | 1                 |
| 2  | user-B  | Trần Văn B  | 3                 |
```

**staff_org_unit:**
```
| id | staff_id | org_unit_id | role_in_unit |
|----|----------|-------------|--------------|
| 1  | 1        | 2           | teacher      |
| 2  | 2        | 3           | teacher      |
| 3  | 2        | 5           | officer      |
```

**Result:**
- Staff A: Khoa CNTT (từ org_unit #2 → parent #1)
- Staff B: Khoa Điện + Đoàn Trường (org_unit #3 = faculty, #5 = khác org type)
  - Duyệt minh chứng: Chỉ Khoa Điện (tự động lọc organization)

---

## Status: Planning
- [ ] Sửa SQL schema
- [ ] Cập nhật Mongoose models
- [ ] Tạo middleware checkFacultyApproveAccess
- [ ] Cập nhật evidence routes
- [ ] Cập nhật evidence controller
- [ ] Tạo staff organization controller
- [ ] Test
