# ✅ Chatbot Test Cases Checklist

**Status**: Testing in progress  
**Updated**: 2025-11-26

---

## 🎯 Test Categories

### 1️⃣ HOW-TO Questions (Regulations)

#### Test Cases:

- [ ] **Q: "Làm sao để đăng ký hoạt động?"**
  - Expected: Bot returns regulations about registration
  - Should contain: Quy định đăng ký
  - Route: Regulations (findRelatedRegulations)

- [ ] **Q: "Cách nào để xem điểm PVCD?"**
  - Expected: Bot returns how-to regulations
  - Should contain: Quy định, hướng dẫn
  - Route: Regulations

- [ ] **Q: "Quy định điểm danh như thế nào?"**
  - Expected: Bot returns attendance regulations
  - Should contain: Quy định điểm danh
  - Route: Regulations

- [ ] **Q: "Giải thích về PVCD"**
  - Expected: Bot explains PVCD system
  - Should contain: Quy định PVCD
  - Route: Regulations

- [ ] **Q: "Thế nào là điểm rèn luyện?"**
  - Expected: Bot explains PVCD concept
  - Route: Regulations

---

### 2️⃣ User's Activities (Personal Activities)

#### Test Cases:

- [ ] **Q: "Hoạt động của em gần đây là gì?"**
  - Expected: Bot lists user's registered activities (from ActivityRegistration)
  - Should show: User's activity titles, dates, locations
  - Header: "Hoạt động của em gần đây:"
  - Route: ActivityRegistration collection

- [ ] **Q: "Em đã đăng ký hoạt động nào?"**
  - Expected: Same as above
  - Route: ActivityRegistration collection

- [ ] **Q: "Tôi đã tham gia hoạt động nào?"**
  - Expected: Same as above
  - Route: ActivityRegistration collection

- [ ] **Q: "Hoạt động gần đây của tôi là gì?"**
  - Expected: Same as above
  - Route: ActivityRegistration collection

---

### 3️⃣ All Upcoming Activities (Public Activities)

#### Test Cases:

- [ ] **Q: "Hoạt động sắp tới là gì?"**
  - Expected: Bot lists all upcoming activities (NOT user-specific)
  - Should show: All approved/in_progress activities with start_time >= now
  - Header: "Hoạt động sắp tới:"
  - Route: Activity collection

- [ ] **Q: "Có hoạt động nào sắp tới không?"**
  - Expected: All upcoming activities
  - Route: Activity collection

- [ ] **Q: "Hoạt động là gì?"**
  - Expected: All upcoming activities
  - Route: Activity collection

---

### 4️⃣ Attendance & Points (PVCD Info)

#### Test Cases:

- [ ] **Q: "Điểm PVCD của em bao nhiêu?"**
  - Expected: Bot shows:
    - 📊 Tổng hoạt động đã điểm danh: [count]
    - ⭐ Điểm PVCD năm này: [points]/100
  - Data: total_attended + pvcd_points for current year
  - Route: Attendance + PvcdRecord

- [ ] **Q: "Tôi tham gia mấy hoạt động?"**
  - Expected: Bot shows attendance count
  - Route: Attendance + PvcdRecord

- [ ] **Q: "Xem điểm của em"**
  - Expected: Bot shows PVCD score
  - Route: Attendance + PvcdRecord

- [ ] **Q: "Hoạt động tôi tham gia bao nhiêu?"**
  - Expected: Bot shows attendance count
  - Route: Attendance + PvcdRecord

---

### 5️⃣ Student Info (Profile)

#### Test Cases:

- [ ] **Q: "Lớp của em là gì?"**
  - Expected: Bot shows class name
  - Route: StudentProfile + Class

- [ ] **Q: "Khoa nào?"**
  - Expected: Bot shows class + faculty info
  - Route: StudentProfile

- [ ] **Q: "Thông tin cá nhân của em"**
  - Expected: Bot shows full profile:
    - Tên, MSSV, Lớp, Email, SĐT
  - Route: StudentProfile

- [ ] **Q: "Email của tôi là gì?"**
  - Expected: Bot shows email
  - Route: StudentProfile

---

### 6️⃣ Default / Regulations (Fallback)

#### Test Cases:

- [ ] **Q: "Quy định chung là gì?"**
  - Expected: Bot searches regulations
  - Route: Regulations (default)

- [ ] **Q: "Hãy nói về quy định"**
  - Expected: Bot searches regulations
  - Route: Regulations (default)

- [ ] **Q: "Có bao nhiêu loại hoạt động?"** (ambiguous)
  - Expected: Bot treats as regulations search
  - Route: Regulations (default)

---

## 🔄 Edge Cases

- [ ] **Q: "Hoạt động + làm sao"** (Mixed keywords)
  - Example: "Hoạt động sắp tới là gì? Làm sao để đăng ký?"
  - Expected: Regulations (HOW-TO takes priority)

- [ ] **User has no activities**
  - Q: "Hoạt động của em gần đây là gì?"
  - Expected: "Bạn chưa đăng ký hoạt động nào."

- [ ] **User has no registered activities but activities exist in system**
  - Q: "Hoạt động của em gần đây là gì?" → No results
  - Q: "Hoạt động sắp tới là gì?" → Shows all activities
  - Expected: Different results for same keyword

- [ ] **No activities in system**
  - Q: "Hoạt động sắp tới là gì?"
  - Expected: "Hiện chưa có hoạt động nào sắp tới."

---

## 🎨 Response Format Verification

### Activity Responses Should Have:
- [ ] Title with **bold**
- [ ] Location with 📍
- [ ] Time with 🕐 (formatted as Vietnamese locale)
- [ ] Description with 📝
- [ ] Numbered list (1., 2., etc.)

### Attendance Response Should Have:
- [ ] 📊 Symbol for count
- [ ] ⭐ Symbol for points
- [ ] /100 suffix for points
- [ ] Current year context

### Student Info Response Should Have:
- [ ] 👤 Symbol for name
- [ ] 📚 Symbol for student number
- [ ] 🎓 Symbol for class
- [ ] 📧 Symbol for email
- [ ] 📱 Symbol for phone

---

## 📊 Suggested Questions Verification

After each bot response, verify that:
- [ ] 3-4 follow-up questions appear
- [ ] Questions are relevant to the topic
- [ ] Questions are clickable buttons
- [ ] Clicking a question sends it as new message

Example for activity response:
- "Làm sao để đăng ký hoạt động này?"
- "Hoạt động khác có không?"
- "Xem điểm của em"

---

## 🔐 Auth & Error Handling

- [ ] **No token**: API returns 401 Unauthorized
- [ ] **Invalid token**: API returns 401 Unauthorized
- [ ] **User not found**: Bot returns "Không tìm thấy hồ sơ sinh viên"
- [ ] **Empty question**: API returns 400 Bad Request

---

## 📱 Frontend Display

- [ ] **ChatBot widget opens/closes** with 💬 button
- [ ] **Messages display** with timestamps
- [ ] **Bot messages** have different style than user messages
- [ ] **Suggested questions** appear as clickable buttons
- [ ] **Activities/Regulations** display in card format
- [ ] **Typing indicator** shows while loading

---

## 🚀 Performance

- [ ] **Response time** < 1 second for text questions
- [ ] **Response time** 1-3 seconds for image upload
- [ ] **No console errors** in browser F12
- [ ] **No server errors** (500) in backend logs
- [ ] **Proper error messages** instead of crashes

---

## 🐛 Known Issues / To Fix

List any issues found during testing:

1. **Issue**: [Description]
   - **Affected Question**: Q: "..."
   - **Expected**: [what should happen]
   - **Actual**: [what is happening]
   - **Status**: [ ] Fixed / [ ] In Progress / [ ] Pending

---

## ✅ Verification Checklist

Before marking as COMPLETE:

- [ ] All 6 question categories tested
- [ ] All edge cases handled
- [ ] Response formats correct
- [ ] Suggested questions generated
- [ ] Auth errors handled
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Vietnamese text displays correctly

---

## 📝 Test Notes

Test Date: ___________  
Tester: ___________  
Environment: [ ] Local / [ ] Staging / [ ] Production

Additional notes:
```
[Paste test results/observations here]
```

---

*Created: 2025-11-26*  
*Version: 1.0*
