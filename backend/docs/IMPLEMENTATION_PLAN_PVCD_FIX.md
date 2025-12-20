# Plan Sửa Bug Total_Point PVCD

## Tóm Tắt Bug
- Sinh viên có 2 hoạt động: 10 điểm + 20 điểm = 30 nhưng hiển thị **20 điểm**
- Nguyên nhân: 2 conflicting calculation paths + sai year + sai field (points vs points_earned)

## Root Cause Analysis

### 1. **Two Conflicting Calculation Paths** ❌
- **Path 1**: `pvcd_record.model.js` pre-save hook (lines 54-85)
  - Dùng `attendance.points`
  - Year từ `activity.start_time`
  
- **Path 2**: `attendance.model.js` post-save hook (lines 128-188)
  - Dùng `attendance.points`
  - Year từ `attendance.scanned_at`

⚠️ Cùng 1 điểm có thể được tính vào 2 năm khác nhau → sai tổng

### 2. **Sai Field** ❌
- Schema có 2 fields:
  - `points_earned` (NEW - cái mới)
  - `points` (OLD - legacy)
- Code tìm `attendance.points` nhưng có thể nó null vì mã mới ghi vào `points_earned`
- Kết quả: thiếu dữ liệu, chỉ tính được 1 trong 2 điểm

### 3. **Sai Year Source** ❌
- Hiện tại: `activity.start_time` hoặc `attendance.scanned_at`
- **Spec yêu cầu**: `Evidence.submitted_at` (năm khi submit minh chứng)
- Điều này quan trọng vì PVCD phải tính theo năm học, không phải ngày hoạt động

## Implementation Plan (4 Bước)

### **BƯỚC 1: Unify Year Logic** 
**File**: `src/models/evidence.model.js`  
**Mục đích**: Define rõ ràng rằng năm của PVCD = year của `Evidence.submitted_at`

```javascript
// Thêm helper để extract năm từ evidence
evidenceSchema.methods.getYear = function() {
  return new Date(this.submitted_at).getFullYear();
};
```

---

### **BƯỚC 2: Fix Points Field (points_earned vs points)**
**File**: `src/models/attendance.model.js` & `src/models/pvcd_record.model.js`  
**Mục đích**: Luôn dùng `points_earned` với fallback `points` cho legacy

**Thay đổi**:
```javascript
// Helper function - add to both files
const getPointsValue = (attendance) => {
  return attendance.points_earned != null ? attendance.points_earned : attendance.points;
};
```

**Sửa điều kiện kiểm tra**:
```javascript
// Cũ (sai):
if (!doc.student_id || !doc.points) return;

// Mới (đúng):
if (!doc.student_id || (doc.points_earned == null && doc.points == null)) return;
```

---

### **BƯỚC 3: Consolidate Calculation Logic**
**File**: `src/models/evidence.model.js`  
**Mục đích**: Chuyển logic tính total_point vào Evidence post-save hook (đây là source of truth)

**Xóa hoặc vô hiệu hóa**:
1. `pvcd_record.model.js` pre-save hook (lines 54-85)
2. `attendance.model.js` post-save hook (lines 128-188) 

**Thêm vào `evidence.model.js` post-save hook**:
```javascript
evidenceSchema.post('save', async function(doc) {
  try {
    if (!doc.student_id || !doc.points_earned) return;

    const PvcdRecord = require('./pvcd_record.model');
    const year = new Date(doc.submitted_at).getFullYear();

    // Get ALL evidences for this student in this year
    const allEvidences = await this.constructor.find({
      student_id: doc.student_id,
      submitted_at: {
        $gte: new Date(`${year}-01-01`),
        $lt: new Date(`${year + 1}-01-01`)
      },
      // Chỉ count evidence đã approved
      status: 'approved'
    }).lean();

    // Sum all points_earned
    let totalPoints = 0;
    allEvidences.forEach(ev => {
      totalPoints += parseFloat(ev.points_earned) || 0;
    });

    // Upsert PVCD record
    await PvcdRecord.findOneAndUpdate(
      { student_id: doc.student_id, year },
      { student_id: doc.student_id, year, total_point: totalPoints },
      { upsert: true, new: true, runValidators: true }
    );
  } catch (err) {
    console.error('Error updating pvcd_record:', err.message);
  }
});
```

---

### **BƯỚC 4: Backfill & Verify**
**File**: `scripts/backfill_pvcd_records.js`  
**Mục đích**: Fix lại tất cả dữ liệu cũ

```javascript
// 1. Xóa tất cả PVCD records cũ
await PvcdRecord.deleteMany({});

// 2. Lặp qua tất cả evidences
const allEvidences = await Evidence.find({
  status: 'approved',
  points_earned: { $gt: 0 }
}).lean();

// 3. Group by (student_id, year)
const grouped = {};
allEvidences.forEach(ev => {
  const year = new Date(ev.submitted_at).getFullYear();
  const key = `${ev.student_id}_${year}`;
  if (!grouped[key]) {
    grouped[key] = { student_id: ev.student_id, year, total: 0 };
  }
  grouped[key].total += ev.points_earned || 0;
});

// 4. Upsert vào PvcdRecord
for (const key in grouped) {
  const { student_id, year, total } = grouped[key];
  await PvcdRecord.findOneAndUpdate(
    { student_id, year },
    { student_id, year, total_point: total },
    { upsert: true }
  );
}

console.log(`✅ Backfilled ${Object.keys(grouped).length} PVCD records`);
```

---

## Verification Checklist

- [ ] Xóa/disable `pvcd_record.model.js` pre-save hook
- [ ] Xóa/disable `attendance.model.js` post-save hook  
- [ ] Thêm post-save hook vào `evidence.model.js`
- [ ] Cập nhật `pvcd_record.model.js` để remove logic tính toán (chỉ validate)
- [ ] Chạy backfill script
- [ ] Test: login vào student ID `691d63565bcc1aa642a2f078`
  - [ ] Verify 2 hoạt động 10 + 20 = **30 điểm** ✅
  - [ ] Check dashboard statistics cũng hiển thị đúng
  - [ ] Check chatbot trả lời đúng PVCD points
- [ ] Kiểm tra year calculation:
  - [ ] Tạo 2 evidences cùng năm 2025 → cộng lại
  - [ ] Tạo evidences năm 2024 và 2025 → tách riêng

---

## Timeline
- **Step 1-2**: 15 phút (unify + fix field)
- **Step 3**: 30 phút (consolidate hooks)
- **Step 4**: 20 phút (backfill + test)
- **Buffer**: 15 phút (debugging)
- **Total**: ~1.5 giờ

## Risk Mitigation
- ✅ Backup database trước backfill
- ✅ Test trên dev environment trước
- ✅ Log old vs new totals khi backfill
- ✅ Spot-check 5-10 sinh viên ngẫu nhiên
