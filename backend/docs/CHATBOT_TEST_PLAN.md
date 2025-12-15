# 🧪 Chatbot Test Plan - Kiểm Tra Mục Đích & Yêu Cầu

## 📋 Mục Đích Chính Của Chatbot

Dựa trên `CHATBOT_IMPLEMENTATION_PLAN.md`, chatbot có **3 mục đích chính**:

### 1. **Rule-based Matching** (Cách 1)
- ✅ Hiểu câu hỏi **KHÔNG CẦN 100% khớp mẫu**
- ✅ Dùng **NLP + cosine similarity**
- ✅ Trả lời theo pattern có sẵn **nhanh chóng**

### 2. **RAG (Retrieval-Augmented Generation)** (Cách 2)
- ✅ Tạo **knowledge base** từ tài liệu quy định, hoạt động
- ✅ Chatbot **tự tìm kiếm** thông tin phù hợp
- ✅ Trả lời theo **tài liệu thực tế**, không phải hardcode

### 3. **Hybrid Orchestrator** (Cách 3)
- ✅ **1 orchestrator** quyết định sử dụng rule hay RAG
- ✅ Nếu rule match tốt (confidence ≥ threshold) → **dùng rule**
- ✅ Nếu không → **dùng RAG**
- ✅ Nếu vẫn không → **fallback response**

---

## 🎯 Test Cases Cần Kiểm Tra

### **PHASE 1: Rule-based Matching Tests**

#### Test 1.1: Exact Match (100% khớp)
- **Input:** "hoạt động sắp tới"
- **Expected:** Match rule với confidence ≥ 0.35
- **Verify:** Source = "rule", có answer

#### Test 1.2: Similar Match (Không cần 100% khớp)
- **Input:** "hoạt động sắp đến" (từ đồng nghĩa)
- **Expected:** Match rule "hoạt động sắp tới" với confidence ≥ 0.35
- **Verify:** Fuzzy matching hoạt động

#### Test 1.3: Typo Handling
- **Input:** "đăng ki" (thiếu chữ "ý")
- **Expected:** Match rule "đăng ký hoạt động" với confidence ≥ 0.35
- **Verify:** Xử lý typo tốt

#### Test 1.4: Vietnamese Normalization
- **Input:** "ĐĂNG KÝ HOẠT ĐỘNG" (chữ hoa)
- **Expected:** Match rule với confidence ≥ 0.35
- **Verify:** Normalize Vietnamese text

#### Test 1.5: Partial Match
- **Input:** "quy định tham gia hoạt động"
- **Expected:** Match rule liên quan với confidence ≥ 0.35
- **Verify:** Partial matching hoạt động

---

### **PHASE 2: RAG System Tests**

#### Test 2.1: Document Retrieval
- **Input:** "quy định PVCD"
- **Expected:** Retrieve documents từ knowledge base
- **Verify:** Source = "rag", có retrievedDocIds

#### Test 2.2: Semantic Search
- **Input:** "điểm cộng hoạt động cộng đồng"
- **Expected:** Tìm documents về PVCD/hoạt động
- **Verify:** Semantic similarity hoạt động

#### Test 2.3: RAG Confidence Threshold
- **Input:** Câu hỏi có trong knowledge base
- **Expected:** Confidence ≥ 0.15 (RAG_MIN_CONFIDENCE)
- **Verify:** RAG được chọn khi confidence đủ

---

### **PHASE 3: Hybrid Orchestrator Tests**

#### Test 3.1: Rule Priority Over RAG
- **Input:** Câu hỏi match cả rule và RAG
- **Expected:** Chọn **rule** (vì rule nhanh hơn)
- **Verify:** Source = "rule", không phải "rag"

#### Test 3.2: RAG When Rule Fails
- **Input:** Câu hỏi không match rule nhưng có trong KB
- **Expected:** Chọn **RAG**
- **Verify:** Source = "rag", có answer từ documents

#### Test 3.3: Fallback When Both Fail
- **Input:** "xyz abc 123" (câu hỏi vô nghĩa)
- **Expected:** Fallback response
- **Verify:** Source = "fallback", có generic answer

#### Test 3.4: Confidence Threshold Decision
- **Input:** Rule match với confidence 0.30 (< 0.35)
- **Expected:** Skip rule, thử RAG
- **Verify:** Logic threshold đúng

---

### **PHASE 4: RBAC & Security Tests**

#### Test 4.1: Role-Based Filtering
- **Input:** Student hỏi về staff-only content
- **Expected:** Không trả về staff-only rules/documents
- **Verify:** RBAC filtering hoạt động

#### Test 4.2: Multi-Tenant Isolation
- **Input:** User từ tenant A hỏi
- **Expected:** Chỉ trả về rules/documents của tenant A
- **Verify:** Tenant isolation đúng

---

### **PHASE 5: Vietnamese Language Tests**

#### Test 5.1: Vietnamese Text Normalization
- **Input:** "ĐĂNG KÝ HOẠT ĐỘNG"
- **Expected:** Normalize thành "đăng ký hoạt động"
- **Verify:** Xử lý Vietnamese tốt

#### Test 5.2: Vietnamese Diacritics
- **Input:** "dang ky hoat dong" (không dấu)
- **Expected:** Match rule "đăng ký hoạt động"
- **Verify:** Xử lý dấu tiếng Việt

---

### **PHASE 6: Performance & Logging Tests**

#### Test 6.1: Response Time
- **Input:** Bất kỳ câu hỏi
- **Expected:** Response time < 500ms
- **Verify:** Performance tốt

#### Test 6.2: Message Logging
- **Input:** Bất kỳ câu hỏi
- **Expected:** Log vào chatbot_messages collection
- **Verify:** Có record trong database

#### Test 6.3: Score Logging
- **Input:** Bất kỳ câu hỏi
- **Expected:** Log ruleScore và ragScore
- **Verify:** Analytics data đầy đủ

---

## 📊 Test Execution Plan

### Browser Testing Sequence:

1. **Test Rule Matching** (5 tests)
   - Exact match
   - Similar match
   - Typo handling
   - Vietnamese normalization
   - Partial match

2. **Test RAG System** (3 tests)
   - Document retrieval
   - Semantic search
   - Confidence threshold

3. **Test Orchestrator** (4 tests)
   - Rule priority
   - RAG fallback
   - Fallback when both fail
   - Threshold decision

4. **Test RBAC** (2 tests)
   - Role filtering
   - Tenant isolation

5. **Test Vietnamese** (2 tests)
   - Text normalization
   - Diacritics handling

6. **Test Performance** (3 tests)
   - Response time
   - Message logging
   - Score logging

**Total: 19 Test Cases**

---

## ✅ Success Criteria

### Rule-based Matching:
- ✅ Match exact patterns
- ✅ Match similar patterns (fuzzy)
- ✅ Handle typos
- ✅ Normalize Vietnamese text
- ✅ Confidence ≥ 0.35

### RAG System:
- ✅ Retrieve relevant documents
- ✅ Semantic similarity works
- ✅ Confidence ≥ 0.15

### Orchestrator:
- ✅ Rule priority when both match
- ✅ RAG when rule fails
- ✅ Fallback when both fail
- ✅ Threshold logic correct

### RBAC:
- ✅ Filter by roles
- ✅ Filter by tenant

### Performance:
- ✅ Response time < 500ms
- ✅ All messages logged
- ✅ Scores logged

---

*Test Plan created based on CHATBOT_IMPLEMENTATION_PLAN.md*

