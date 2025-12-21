# TÀI LIỆU TRẢ LỜI CÁC CÂU HỎI CỦA THẦY

## 1. HỆ THỐNG PHÂN QUYỀN CHI TIẾT

### 1.1. Kiến trúc tổng quan

Hệ thống sử dụng **Role-Based Access Control (RBAC)** kết hợp với **User-Level Overrides**, cho phép phân quyền linh hoạt và chi tiết.

**Luồng phân quyền:**
```
User → UserRole → RoleAction → Action (+ UserActionOverride)
```

### 1.2. Các thành phần trong hệ thống

#### a. **User (Người dùng)**
- Lưu thông tin đăng nhập: `username`, `password_hash`
- Trạng thái: `active`, `isLocked`

#### b. **Role (Vai trò)**
- Các role chính: `admin`, `ctsv`, `khoa`, `student`, `staff`, `doantruong`, `clb`
- Mỗi role có `name` và `description`

#### c. **Action (Hành động/Quyền)**
- Định nghĩa các quyền chi tiết theo format: `resource:action_code`
- Ví dụ: `activity:CREATE`, `student:UPDATE`, `attendance:SCAN`
- Các action code chuẩn: `VIEW`, `CREATE`, `UPDATE`, `DELETE`, `APPROVE`, `REJECT`, `EXPORT`, `IMPORT`

#### d. **UserRole (Gán vai trò cho người dùng)**
- Liên kết user với role
- Hỗ trợ context theo đơn vị tổ chức: `org_unit_id`
- Một user có thể có nhiều role ở các đơn vị khác nhau

#### e. **RoleAction (Gán quyền cho vai trò)**
- Liên kết role với action
- Định nghĩa role nào được phép thực hiện action nào

#### f. **UserActionOverride (Ghi đè quyền cá nhân)**
- Cho phép cấp hoặc thu hồi quyền cụ thể cho từng user
- `is_granted: true` = cấp quyền, `false` = thu hồi quyền
- **Ưu tiên cao nhất** trong hệ thống

### 1.3. Quy trình kiểm tra quyền

```
1. Kiểm tra UserActionOverride
   └─ Nếu có override → trả về giá trị override (granted/revoked)
   
2. Nếu không có override, kiểm tra role của user
   └─ Lấy tất cả roles từ user_role
   └─ Với mỗi role, kiểm tra role_action
   └─ Nếu bất kỳ role nào có action → trả về true
   
3. Nếu không có role nào có quyền → trả về false
```

### 1.4. Phân quyền theo vai trò

#### **Admin (Quản trị viên)**
- Toàn quyền truy cập tất cả resources và actions
- Quản lý users, roles, permissions
- Xem và xuất tất cả báo cáo

#### **CTSV (Phòng Công tác Sinh viên)**
- Quản lý hoạt động, sinh viên, đăng ký, điểm danh
- Duyệt hoạt động và minh chứng
- Xem và xuất báo cáo thống kê

#### **Khoa (Faculty)**
- Tạo và quản lý hoạt động
- Xem sinh viên
- Duyệt/từ chối đăng ký
- Duyệt minh chứng (nếu được cấp quyền optional)

#### **Staff (Cán bộ/Tổ chức)**
- **Basic permissions** (tự động có khi có staff role):
  - Tạo, xem, cập nhật hoạt động
  - Điểm danh, xác minh điểm danh
  - Quản lý điểm PVCD
  - Duyệt đăng ký hoạt động
  - Quản lý bài đăng
  
- **Optional permissions** (admin cấp thủ công):
  - Duyệt hoạt động (Phòng CTSV, Đoàn trường)
  - Duyệt minh chứng (Khoa, CLB)
  - Xem báo cáo (Phòng CTSV, Đoàn trường)
  - Quản lý lớp (Khoa)

#### **Student (Sinh viên)**
- Xem hoạt động
- Đăng ký hoạt động
- Xem điểm danh của mình
- Nộp minh chứng
- Xem điểm PVCD của mình
- Cập nhật thông tin cá nhân

#### **Lớp trưởng (Class Monitor)**
- **KHÔNG phải là role**, chỉ là field boolean `isClassMonitor` trong `student_profile`
- Có thêm quyền:
  - Điểm danh cho lớp (`class:attendance`)
  - Xem báo cáo lớp (`class:report`)
  - Duyệt minh chứng cho sinh viên trong lớp (nếu được cấp)

### 1.5. Cách sử dụng trong code

#### Trong Routes (Middleware)
```javascript
const { checkPermission, checkClassMonitor } = require('./middlewares/check_permission.middleware');

// Kiểm tra quyền cụ thể
router.post('/activities', 
  checkPermission('activity', 'CREATE'), 
  activityController.create
);

// Kiểm tra lớp trưởng
router.post('/class/attendance', 
  checkClassMonitor(), 
  attendanceController.update
);
```

#### Trong Controllers (Logic)
```javascript
const { hasPermission, isClassMonitor } = require('../utils/permission.util');

// Kiểm tra quyền trong logic
const canUpdate = await hasPermission(userId, 'activity', 'UPDATE');
if (!canUpdate) {
  return res.status(403).json({ message: 'No permission' });
}

// Kiểm tra lớp trưởng
const isMonitor = await isClassMonitor(userId);
```

### 1.6. Ưu điểm của hệ thống

1. **Linh hoạt**: Có thể gán quyền theo role hoặc override cho từng user
2. **Chi tiết**: Phân quyền đến từng action trên từng resource
3. **Mở rộng**: Dễ dàng thêm role, action mới
4. **Bảo mật**: Kiểm tra quyền ở cả middleware và controller
5. **Context-aware**: Hỗ trợ phân quyền theo đơn vị tổ chức

---

## 2. AI DÙNG GÌ VÀ LÀM NHƯ THẾ NÀO

### 2.1. Tổng quan

Hệ thống sử dụng **Chatbot AI** với kiến trúc **Hybrid** kết hợp:
- **Rule-based Matching** (Pattern matching với string similarity)
- **RAG (Retrieval-Augmented Generation)** (Embedding + Cosine similarity)

### 2.2. Công nghệ sử dụng

#### a. **Backend Framework**
- **Node.js/Express**: Framework chính
- **MongoDB**: Lưu trữ rules, documents, chat history

#### b. **Thư viện AI/NLP**
- **string-similarity**: Tính độ tương đồng giữa các chuỗi (Dice coefficient)
- **Axios**: Gọi API bên ngoài (HuggingFace, Google Translate)
- **HuggingFace API**: Mô hình embedding `sentence-transformers/all-MiniLM-L6-v2` (384 chiều)

#### c. **Google Cloud Services**
- **Google Vision API**: Phân tích hình ảnh, OCR (hiện tại bypass do cần billing)
- **Google Translate API**: Phát hiện ngôn ngữ

### 2.3. Kiến trúc 3 tầng

```
┌─────────────────────────────────────┐
│   Rule Engine Service               │
│   - Pattern matching                │
│   - String similarity               │
│   - Confidence scoring              │
└─────────────────────────────────────┘
              ↓ (nếu không match)
┌─────────────────────────────────────┐
│   RAG Service                       │
│   - Embedding generation            │
│   - Document retrieval              │
│   - Cosine similarity               │
└─────────────────────────────────────┘
              ↓ (nếu không match)
┌─────────────────────────────────────┐
│   Fallback Service                  │
│   - Default responses               │
└─────────────────────────────────────┘
```

### 2.4. Rule Engine Service

#### Nguyên lý hoạt động
- Sử dụng pattern matching kết hợp string similarity
- Không yêu cầu câu hỏi khớp 100%, sử dụng thuật toán tính độ tương đồng

#### Quy trình xử lý

**Bước 1: Chuẩn hóa văn bản**
- Chuyển về chữ thường
- Loại bỏ dấu tiếng Việt
- Loại bỏ ký tự đặc biệt
- Chuẩn hóa khoảng trắng

**Bước 2: Tính độ tương đồng**
- Sử dụng thư viện `string-similarity` với thuật toán **Dice coefficient**
- So sánh câu hỏi với từng keyword trong rules
- Tính điểm tương đồng từ 0 đến 1

**Bước 3: Điều chỉnh điểm số theo priority**
```javascript
adjustedScore = similarityScore * (1 + (rule.priority - 5) * 0.05)
```

**Bước 4: Áp dụng ngưỡng confidence**
- Nếu `adjustedScore >= 0.35` → Trả về câu trả lời
- Nếu không → Chuyển sang RAG Service

#### Công thức Dice coefficient
```
similarity = (2 * common_bigrams) / (total_bigrams_A + total_bigrams_B)
```

### 2.5. RAG (Retrieval-Augmented Generation) Service

#### Nguyên lý hoạt động
- Chuyển đổi văn bản thành vector số (embedding)
- Sử dụng cosine similarity để tìm documents liên quan từ knowledge base

#### Embedding Service

**1. Simple Embedding (TF-IDF style)**
- Tạo vector dựa trên tần suất xuất hiện của từ
- Sử dụng hash function để ánh xạ từ vào chỉ số vector
- Kích thước: 256 chiều
- Normalize vector theo chuẩn L2

**2. Advanced Embedding (HuggingFace)**
- Sử dụng mô hình pre-trained: `sentence-transformers/all-MiniLM-L6-v2`
- Vector 384 chiều với ngữ nghĩa sâu hơn
- Fallback về Simple Embedding nếu API lỗi

#### Cosine Similarity
```
cosine_similarity(A, B) = (A · B) / (||A|| × ||B||)
```

Giá trị từ -1 đến 1:
- **1**: Hai vector hoàn toàn giống nhau
- **0**: Hai vector độc lập
- **-1**: Hai vector ngược nhau

#### Quy trình RAG Retrieval

1. **Tạo query embedding**: Chuyển câu hỏi thành vector
2. **Lấy documents từ knowledge base**: Lọc theo tenantId, RBAC, active status
3. **Tính điểm relevance**: 
   ```javascript
   similarity = cosineSimilarity(queryEmbedding, doc.embedding)
   priorityBoost = 1 + ((doc.priority - 5) * 0.05)
   finalScore = min(similarity * priorityBoost, 1)
   ```
4. **Sắp xếp và lấy top K**: Lấy top 5 documents có điểm cao nhất
5. **Kiểm tra ngưỡng confidence**: Nếu `relevanceScore >= 0.15` → Trả về
6. **Tổng hợp câu trả lời**: Sử dụng LLM hoặc concatenation

### 2.6. Smart Routing Logic

Hệ thống tự động phát hiện loại câu hỏi và route đến service phù hợp:

1. **HOW-TO Questions** (Ưu tiên cao nhất)
   - Keywords: "làm sao", "cách nào", "như thế nào", "quy định"
   - → Special guides (registration, attendance, absence)

2. **Activity Questions**
   - Keywords: "hoạt động"
   - → Activity collection hoặc ActivityRegistration

3. **Attendance Questions**
   - Keywords: "điểm", "pvcd", "điểm danh"
   - → Attendance + PvcdRecord

4. **Student Info Questions**
   - Keywords: "lớp", "khoa", "thông tin", "email"
   - → StudentProfile

5. **Default**
   - → Regulations collection

### 2.7. Image Analysis

- **Phát hiện loại ảnh**: document, poster, screenshot, photo
- **OCR**: Trích xuất text từ ảnh (Google Vision API)
- **Suggested Questions**: Tự động sinh câu hỏi gợi ý dựa trên nội dung ảnh

### 2.8. Hiệu suất

- **Response time**: < 1 giây cho câu hỏi text
- **Image upload**: 1-3 giây (Google Vision API)
- **Accuracy**: 
  - Rule-based: ~85-90%
  - RAG-based: ~70-80%

### 2.9. Tính năng nổi bật

- ✅ Smart Routing tự động phát hiện ý định
- ✅ 5 loại câu hỏi: Regulations, Activities, Attendance, Info, Image
- ✅ Suggested Questions tự động sinh
- ✅ Image Upload và phân tích
- ✅ Chat History với feedback
- ✅ React Widget tích hợp sẵn

---

## 3. ĐIỂM DANH LÀM BẰNG CÁCH NÀO RA SAO

### 3.1. Tổng quan

Hệ thống điểm danh sử dụng **QR Code** với quy trình 2 giai đoạn:
1. **Phase 1**: Sinh viên quét QR code → Tạo attendance record tạm thời
2. **Phase 2**: Sinh viên submit form với thông tin → Chờ staff duyệt

### 3.2. Quy trình điểm danh chi tiết

#### **Bước 1: Tạo QR Code (Staff/Admin)**

Staff hoặc Admin tạo QR code cho hoạt động:

```javascript
POST /api/attendance/generate-qr-code
{
  "activity_id": "...",
  "qr_name": "QR điểm danh buổi 1",
  "duration_minutes": 120  // Optional: thời gian hết hạn
}
```

**Quy trình tạo QR:**
1. Tạo ObjectId duy nhất cho QR
2. Tính thời gian hết hạn (nếu có `duration_minutes`)
3. Tạo URL form: `https://domain.com/qr-attendance-form.html?activity_id=...&qr_code_id=...`
4. Generate QR code image (Base64) từ URL
5. Lưu vào database với các thông tin:
   - `activity_id`: ID hoạt động
   - `qr_name`: Tên QR code
   - `qr_code`: Base64 image
   - `expires_at`: Thời gian hết hạn
   - `is_active`: Trạng thái active
   - `scans_count`: Số lần quét

#### **Bước 2: Sinh viên quét QR Code**

Sinh viên mở camera, quét QR code → Tự động mở form điểm danh.

**API được gọi:**
```javascript
POST /api/attendance/scan-qr-v2
{
  "activity_id": "...",
  "qr_code_id": "..."
}
```

**Quy trình xử lý:**
1. ✅ Kiểm tra user đã đăng nhập
2. ✅ Kiểm tra QR code tồn tại và còn active
3. ✅ Kiểm tra QR code chưa hết hạn
4. ✅ Kiểm tra sinh viên đã đăng ký và được duyệt tham gia hoạt động
5. ✅ Kiểm tra chưa quét QR này trước đó (prevent duplicate)
6. ✅ **KHÔNG kiểm tra time window** - có thể quét bất cứ lúc nào
7. ✅ Tạo attendance record với:
   - `status: 'present'`
   - `scanned_at: new Date()`
   - `qr_code_id`: ID của QR đã quét
8. ✅ Tăng `scans_count` của QR code

#### **Bước 3: Sinh viên submit form**

Sau khi quét QR, sinh viên điền form với thông tin:

```javascript
POST /api/attendance/submit
{
  "activity_id": "...",
  "session_id": "...",  // QR code ID
  "student_info": {
    "student_id_number": "202101001",
    "student_name": "Nguyễn Văn A",
    "class": "...",
    "faculty": "..."
  }
}
```

**Quy trình xử lý:**
1. ✅ Kiểm tra đã đăng ký và được duyệt
2. ✅ Validate QR code (nếu có):
   - QR tồn tại
   - QR còn active
   - QR chưa hết hạn
   - Chưa quét QR này trước đó
3. ✅ Validate class và faculty tồn tại trong database
4. ✅ Kiểm tra thông tin khớp với hệ thống:
   - So sánh class với class đã đăng ký
   - Đánh dấu `class_mismatch` nếu không khớp
5. ✅ Tạo/cập nhật attendance record với:
   - `status: 'pending'` (chờ duyệt)
   - `student_info`: Thông tin từ form
   - `student_info_flags`: Các cảnh báo (class_mismatch, etc.)

#### **Bước 4: Staff duyệt điểm danh**

Staff xem danh sách điểm danh chờ duyệt và approve:

```javascript
GET /api/attendance/pending
// Trả về danh sách attendance có status = 'pending'

POST /api/attendance/:id/approve
{
  "verified_comment": "Đã xác nhận tham gia"
}
```

**Quy trình duyệt:**
1. ✅ Tính điểm tự động (Dynamic QR Scoring):
   ```javascript
   // Nếu có scan_order và total_qr_at_scan
   pointsEarned = (scan_order / total_qr_at_scan) * max_points
   
   // Nếu không có → mặc định 0 điểm (staff tự set)
   ```
2. ✅ Cập nhật attendance:
   - `status: 'present'`
   - `verified_by`: ID staff duyệt
   - `verified_at`: Thời gian duyệt
   - `points_earned`: Điểm đạt được
3. ✅ Tự động cập nhật PVCD record

### 3.3. Dynamic QR Scoring (Tính điểm động)

Hệ thống tính điểm dựa trên thứ tự quét QR:

**Công thức:**
```javascript
pointsEarned = Math.floor((scan_order / total_qr_at_scan) * max_points)
```

**Ví dụ:**
- Hoạt động có `max_points = 10`
- Tổng số QR đã tạo: 5
- Sinh viên quét QR thứ 2 → `scan_order = 2`, `total_qr_at_scan = 5`
- Điểm = `(2/5) * 10 = 4 điểm`

**Mục đích:** Khuyến khích sinh viên đến sớm và quét QR sớm.

### 3.4. Bảo mật và validation

#### **Kiểm tra trùng lặp**
- Mỗi sinh viên chỉ quét được 1 lần cho mỗi QR code
- Kiểm tra: `student_id + activity_id + qr_code_id` unique

#### **Kiểm tra đăng ký**
- Sinh viên phải đăng ký và được duyệt (`status: 'approved'`) mới được điểm danh

#### **Kiểm tra QR code**
- QR phải tồn tại trong database
- QR phải còn active (`is_active: true`)
- QR chưa hết hạn (`expires_at > now()`)

#### **Kiểm tra thông tin**
- Class và Faculty phải tồn tại trong database
- So sánh class với class đã đăng ký → đánh dấu mismatch nếu khác

### 3.5. Các trạng thái điểm danh

- **`pending`**: Đã submit form, chờ staff duyệt
- **`present`**: Đã được duyệt, có mặt
- **`absent`**: Vắng mặt (staff đánh dấu)
- **`partial`**: Có mặt một phần (nếu có)

### 3.6. API Endpoints chính

1. **Generate QR Code**: `POST /api/attendance/generate-qr-code`
2. **Scan QR Code**: `POST /api/attendance/scan-qr-v2`
3. **Submit Attendance**: `POST /api/attendance/submit`
4. **Get Pending**: `GET /api/attendance/pending`
5. **Approve Attendance**: `POST /api/attendance/:id/approve`
6. **Validate QR**: `POST /api/attendance/validate-qr-code`
7. **Get My Attendance**: `GET /api/attendance/my-attendance`

### 3.7. Database Schema

**Attendance Model:**
```javascript
{
  student_id: ObjectId (ref: StudentProfile),
  activity_id: ObjectId (ref: Activity),
  qr_code_id: ObjectId (ref: QRCode),  // QR đã quét
  scan_order: Number,  // Thứ tự quét (1, 2, 3...)
  total_qr_at_scan: Number,  // Tổng số QR khi quét
  status: 'pending' | 'present' | 'absent' | 'partial',
  scanned_at: Date,  // Thời gian quét QR
  student_info: {
    student_id_number: String,
    student_name: String,
    class: ObjectId,
    faculty: ObjectId
  },
  student_info_flags: {
    class_mismatch: Boolean,
    registered_class: ObjectId,
    student_in_system: Boolean
  },
  points_earned: Number,
  verified_by: ObjectId,
  verified_at: Date
}
```

**QRCode Model:**
```javascript
{
  _id: ObjectId,
  activity_id: ObjectId,
  qr_name: String,
  qr_code: String (Base64 image),
  qr_data: String (JSON),
  created_by: ObjectId,
  created_at: Date,
  expires_at: Date,
  is_active: Boolean,
  scans_count: Number
}
```

### 3.8. Ưu điểm của hệ thống

1. **Linh hoạt**: Có thể tạo nhiều QR code cho 1 hoạt động
2. **Bảo mật**: Kiểm tra đăng ký, duplicate, QR validity
3. **Tự động**: Tính điểm dựa trên thứ tự quét
4. **Kiểm soát**: Staff có thể duyệt và điều chỉnh điểm
5. **Theo dõi**: Lưu đầy đủ thông tin quét, submit, duyệt

---

## TÓM TẮT

### 1. Phân quyền
- **RBAC** với user-level overrides
- Phân quyền chi tiết đến từng action trên từng resource
- Hỗ trợ context theo đơn vị tổ chức
- Lớp trưởng là flag, không phải role

### 2. AI/Chatbot
- **Hybrid**: Rule-based + RAG
- Rule Engine: Pattern matching với Dice coefficient
- RAG: Embedding (HuggingFace) + Cosine similarity
- Smart Routing tự động phát hiện ý định
- Hỗ trợ phân tích hình ảnh

### 3. Điểm danh
- **QR Code** với quy trình 2 giai đoạn
- Quét QR → Submit form → Staff duyệt
- Dynamic QR Scoring: Tính điểm theo thứ tự quét
- Bảo mật: Kiểm tra duplicate, đăng ký, QR validity
- Linh hoạt: Nhiều QR cho 1 hoạt động, có thể set thời gian hết hạn

