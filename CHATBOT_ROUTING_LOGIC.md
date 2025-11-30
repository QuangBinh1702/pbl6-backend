# 🤖 Chatbot Smart Routing Logic

**Updated**: 2025-11-26

## Router Priority Order

The bot uses **priority-based routing** to detect user intent:

### 1️⃣ HOW-TO Questions (Highest Priority)
**Keywords**: "làm sao", "cách nào", "như thế nào", "thế nào", "giải thích", "quy định"

```
User: "Làm sao để đăng ký hoạt động?"
          ↓
Detect: "làm sao" → HOW-TO question
          ↓
Query: Regulations table
          ↓
Bot: "Quy định về đăng ký hoạt động..." (from Regulation collection)
```

**Examples:**
- ✅ "Làm sao để đăng ký hoạt động?" → Regulations
- ✅ "Cách nào để xem điểm?" → Regulations  
- ✅ "Quy định điểm danh như thế nào?" → Regulations
- ✅ "Giải thích về PVCD" → Regulations

---

### 2️⃣ Activity Questions
**Keywords**: "hoạt động"

**Sub-cases:**

#### A) User's Own Activities
**Sub-keywords**: "của em", "gần đây", "em đã", "tôi đã"

```
User: "Hoạt động của em gần đây là gì?"
          ↓
Detect: "hoạt động" + "của em"
          ↓
Query: ActivityRegistration (user's registrations)
          ↓
Bot: "Hoạt động của em gần đây:
       1. Đại hội Đoàn...
       2. Cuộc thi Khởi nghiệp..."
```

**Examples:**
- ✅ "Hoạt động của em gần đây là gì?" → User's activities
- ✅ "Em đã đăng ký hoạt động nào?" → User's activities
- ✅ "Tôi đã tham gia hoạt động nào?" → User's activities

#### B) All Upcoming Activities
```
User: "Hoạt động sắp tới là gì?"
          ↓
Detect: "hoạt động" (no "của em"/"gần đây"/etc.)
          ↓
Query: Activity collection (all upcoming)
          ↓
Bot: "Hoạt động sắp tới:
       1. Đại hội Đoàn...
       2. Cuộc thi Khởi nghiệp..."
```

**Examples:**
- ✅ "Hoạt động sắp tới là gì?" → All upcoming activities
- ✅ "Có hoạt động nào không?" → All upcoming activities

---

### 3️⃣ Attendance & Points Questions
**Keywords**: "điểm" OR "pvcd"

```
User: "Điểm PVCD của em bao nhiêu?"
          ↓
Detect: "điểm" or "pvcd"
          ↓
Query: Attendance + PvcdRecord
          ↓
Bot: "Thông tin điểm danh & PVCD của bạn:
       📊 Tổng hoạt động đã điểm danh: 5
       ⭐ Điểm PVCD năm này: 85/100"
```

**Examples:**
- ✅ "Điểm PVCD của em bao nhiêu?" → Attendance info
- ✅ "Tôi tham gia mấy hoạt động?" → Attendance count
- ✅ "Xem điểm của em" → PVCD points

---

### 4️⃣ Student Info Questions
**Keywords**: "lớp" OR "khoa" OR "thông tin"

```
User: "Lớp của em là gì?"
          ↓
Detect: "lớp"
          ↓
Query: StudentProfile + Class
          ↓
Bot: "Thông tin của bạn:
       👤 Tên: Nguyễn Văn A
       🎓 Lớp: CNTT21.1
       📧 Email: ..."
```

**Examples:**
- ✅ "Lớp của em là gì?" → Student info
- ✅ "Khoa nào?" → Student info
- ✅ "Thông tin cá nhân của em" → Student info

---

### 5️⃣ Default: Regulations (Fallback)
**All other questions**

```
User: "Quy định chung là gì?"
          ↓
No specific keyword match
          ↓
Query: Regulations (search by content)
          ↓
Bot: "Tìm thấy 3 quy định liên quan: ..."
```

---

## Decision Tree

```
                    ┌─────────────────────────┐
                    │   User Question         │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │ Contains HOW-TO keyword?│
                    │ (làm sao/cách/quy định)│
                    └────────────┬────────────┘
                            Yes │ No
                                │
                    ┌───────────┴────────────┐
                    │                        │
            ┌──────▼──────┐        ┌────────▼────────┐
            │  REGULATIONS│        │ Check next rule │
            └─────────────┘        └────────┬────────┘
                                            │
                              ┌─────────────▼─────────────┐
                              │ Contains "hoạt động"?     │
                              └─────────────┬─────────────┘
                                        Yes │ No
                                            │
                        ┌───────────────────┴──────────────────┐
                        │                                      │
                ┌───────▼──────────────┐           ┌──────────▼──────────┐
                │ Contains "của em"    │           │ Check next rule    │
                │ or "gần đây"?        │           └──────────┬─────────┘
                └───────┬──────────────┘                      │
                        │ Yes            ┌────────────────────┴──────────┐
                        │                 │                              │
        ┌───────────────▼──────────────┐ │                              │
        │ USER'S ACTIVITIES            │ │      ┌──────────────────────▼──┐
        │ (from ActivityRegistration)  │ │      │ Contains "điểm" or      │
        └──────────────────────────────┘ │      │ "pvcd"?                 │
                                         │      └──────────────┬──────────┘
                                         │                     │ Yes
                                         │              ┌──────▼──────────┐
                                         │              │ ATTENDANCE INFO │
                                         │              └─────────────────┘
                                         │
                                   ┌─────▼──────────────────────────┐
                                   │ ALL UPCOMING ACTIVITIES         │
                                   │ (from Activity collection)      │
                                   └────────────────────────────────┘
```

---

## Updated Test Cases

### ✅ Correct Responses (After Fix)

| Question | Intent | Route | Data Source |
|----------|--------|-------|-------------|
| "Làm sao để đăng ký hoạt động?" | HOW-TO | Regulations | Regulation collection |
| "Hoạt động của em gần đây là gì?" | User Activities | Activity | ActivityRegistration |
| "Hoạt động sắp tới là gì?" | All Activities | Activity | Activity collection |
| "Điểm PVCD của em bao nhiêu?" | Attendance | Attendance | Attendance + PvcdRecord |
| "Lớp của em là gì?" | Info | Student Info | StudentProfile |
| "Quy định điểm danh?" | HOW-TO | Regulations | Regulation collection |

---

## Code Logic

```javascript
// Priority 1: HOW-TO Questions
if (isHowToQuestion) {
  // Keywords: "làm sao", "cách nào", "như thế nào", etc.
  relatedRegulations = await findRelatedRegulations(question);
  response = createResponse(relatedRegulations);
}

// Priority 2: Activity Questions
else if (questionLower.includes('hoạt động')) {
  if (isUserActivities) {
    // "của em", "gần đây"
    activities = await ActivityRegistration.find({student_id})
  } else {
    // "sắp tới"
    activities = await Activity.find({start_time >= now})
  }
}

// Priority 3: Attendance Questions
else if (questionLower.includes('điểm') || includes('pvcd')) {
  attendance = await Attendance.find({student_id})
  pvcdRecord = await PvcdRecord.findOne({student_id, year})
}

// Priority 4: Student Info Questions
else if (includes('lớp') || includes('khoa') || includes('thông tin')) {
  studentProfile = await StudentProfile.findOne({user_id})
}

// Priority 5: Default to Regulations
else {
  relatedRegulations = await findRelatedRegulations(question);
}
```

---

## Common Question Patterns

### Queries that might be ambiguous:

**"Hoạt động là gì?"**
- Contains: "hoạt động" (Activity keyword)
- Doesn't contain: "của em", "gần đây", "làm sao"
- **Route**: All upcoming activities ✅

**"Cách đăng ký hoạt động?"**
- Contains: "hoạt động" (Activity keyword)
- Contains: "cách" (HOW-TO keyword)
- **Route**: Regulations (HOW-TO takes priority) ✅

**"Tôi đã tham gia hoạt động nào?"**
- Contains: "hoạt động" (Activity keyword)
- Contains: "tôi đã" (User activity indicator)
- **Route**: User's registered activities ✅

---

## Suggested Questions Generation

After each bot response, the bot generates 3-4 follow-up questions based on:

1. **Content of response** (e.g., if showing activities, suggest "How to register?")
2. **User context** (e.g., "View my activities", "Check my points")
3. **Query type** (e.g., if activity results, suggest regulation questions)

---

## Notes

- All datetime conversions use Vietnamese locale: `toLocaleString('vi-VN')`
- Default sort: Activities by `start_time` (ascending), Registrations by `created_at` (descending)
- Limit: 5 records per query (user can see more on dedicated pages)
- Error handling: Friendly Vietnamese messages if no data found

---

*Last updated: 2025-11-26*
