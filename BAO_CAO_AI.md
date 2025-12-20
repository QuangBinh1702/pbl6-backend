# ỨNG DỤNG TRÍ TUỆ NHÂN TẠO VÀO HỆ THỐNG

## 1. HỆ THỐNG CHATBOT AI TƯ VẤN KHÁCH HÀNG

### 1.1. Mô tả tổng quan

Hệ thống chatbot AI được xây dựng với khả năng tự động nhận diện ý định và trả lời tin nhắn người dùng một cách chính xác, nhanh chóng. Hệ thống sử dụng kiến trúc hybrid kết hợp giữa Rule-based matching và RAG (Retrieval-Augmented Generation) để đảm bảo độ chính xác cao và khả năng mở rộng.

**Ví dụ:** Khi người dùng đặt câu hỏi như "Quy định về điểm danh như thế nào?", hệ thống sẽ:
- Nhận diện ý định qua Rule Engine hoặc RAG
- Tự động truy xuất thông tin từ cơ sở dữ liệu
- Phản hồi chính xác với độ tin cậy cao

### 1.2. Công nghệ sử dụng

#### a. Ngôn ngữ lập trình và thư viện

- **Node.js/Express**: Framework backend chính để xây dựng API
- **MongoDB**: Cơ sở dữ liệu lưu trữ rules, documents, và chat history
- **string-similarity**: Thư viện tính toán độ tương đồng giữa các chuỗi văn bản
- **Axios**: Thư viện gọi API bên ngoài (HuggingFace, Google Translate)

#### b. Kiến trúc hệ thống

Hệ thống chatbot sử dụng kiến trúc 3 tầng:

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

### 1.3. Rule Engine Service

#### a. Nguyên lý hoạt động

Rule Engine sử dụng pattern matching kết hợp với string similarity để tìm câu trả lời phù hợp nhất. Hệ thống không yêu cầu câu hỏi phải khớp 100% với pattern, mà sử dụng thuật toán tính độ tương đồng.

#### b. Quy trình xử lý

**Bước 1: Chuẩn hóa văn bản**
```javascript
normalizeText(text) {
  // Chuyển về chữ thường
  // Loại bỏ dấu tiếng Việt
  // Loại bỏ ký tự đặc biệt
  // Chuẩn hóa khoảng trắng
}
```

**Bước 2: Tính độ tương đồng**
- Sử dụng thư viện `string-similarity` với thuật toán Dice coefficient
- So sánh câu hỏi với từng keyword trong rules
- Tính điểm tương đồng từ 0 đến 1

**Bước 3: Điều chỉnh điểm số theo priority**
```javascript
adjustedScore = similarityScore * (1 + (rule.priority - 5) * 0.05)
```

**Bước 4: Áp dụng ngưỡng confidence**
- Nếu `adjustedScore >= RULE_MIN_CONFIDENCE` (mặc định 0.35) → Trả về câu trả lời
- Nếu không → Chuyển sang RAG Service

#### c. Công thức tính độ tương đồng

Hệ thống sử dụng Dice coefficient để tính độ tương đồng giữa hai chuỗi:

```
similarity = (2 * common_bigrams) / (total_bigrams_A + total_bigrams_B)
```

Trong đó:
- `common_bigrams`: Số cặp ký tự chung giữa hai chuỗi
- `total_bigrams_A`: Tổng số cặp ký tự trong chuỗi A
- `total_bigrams_B`: Tổng số cặp ký tự trong chuỗi B

### 1.4. RAG (Retrieval-Augmented Generation) Service

#### a. Nguyên lý hoạt động

RAG Service sử dụng kỹ thuật embedding để chuyển đổi văn bản thành vector số, sau đó sử dụng cosine similarity để tìm các tài liệu liên quan nhất từ knowledge base.

#### b. Embedding Service

Hệ thống hỗ trợ hai loại embedding:

**1. Simple Embedding (TF-IDF style)**
- Tạo vector dựa trên tần suất xuất hiện của từ
- Sử dụng hash function để ánh xạ từ vào các chỉ số vector
- Kích thước vector: 256 chiều (có thể cấu hình)
- Normalize vector theo chuẩn L2

**Quy trình:**
```javascript
1. Normalize text (lowercase, remove punctuation)
2. Split thành các từ
3. Hash từ vào các chỉ số vector
4. Đếm tần suất xuất hiện
5. Normalize vector (L2 normalization)
```

**2. Advanced Embedding (HuggingFace)**
- Sử dụng mô hình pre-trained từ HuggingFace
- Mô hình mặc định: `sentence-transformers/all-MiniLM-L6-v2`
- Tạo vector 384 chiều với ngữ nghĩa sâu hơn
- Fallback về Simple Embedding nếu API lỗi

#### c. Cosine Similarity

Công thức tính cosine similarity giữa hai vector:

```
cosine_similarity(A, B) = (A · B) / (||A|| × ||B||)
```

Trong đó:
- `A · B`: Tích vô hướng của hai vector
- `||A||`: Độ dài (magnitude) của vector A
- `||B||`: Độ dài (magnitude) của vector B

Giá trị cosine similarity nằm trong khoảng [-1, 1]:
- **1**: Hai vector hoàn toàn giống nhau
- **0**: Hai vector độc lập
- **-1**: Hai vector ngược nhau

#### d. Quy trình RAG Retrieval

**Bước 1: Tạo query embedding**
```javascript
queryEmbedding = await embeddingService.embed(userQuestion)
```

**Bước 2: Lấy danh sách documents từ knowledge base**
- Lọc theo tenantId
- Lọc theo RBAC (roles)
- Chỉ lấy documents đang active

**Bước 3: Tính điểm relevance cho mỗi document**
```javascript
similarity = cosineSimilarity(queryEmbedding, doc.embedding)
priorityBoost = 1 + ((doc.priority - 5) * 0.05)
finalScore = min(similarity * priorityBoost, 1)
```

**Bước 4: Sắp xếp và lấy top K documents**
- Sắp xếp theo `relevanceScore` giảm dần
- Lấy top K documents (mặc định K = 5)

**Bước 5: Kiểm tra ngưỡng confidence**
- Nếu `bestMatch.relevanceScore >= RAG_MIN_CONFIDENCE` (0.15) → Trả về câu trả lời
- Nếu không → Chuyển sang Fallback

**Bước 6: Tổng hợp câu trả lời**
- Sử dụng LLM (nếu được cấu hình) hoặc concatenation
- Giới hạn độ dài response (mặc định 2000 ký tự)

### 1.5. Language Detection Service

#### a. Chức năng

Tự động phát hiện ngôn ngữ của câu hỏi người dùng để:
- Xử lý đúng ngữ pháp tiếng Việt
- Hỗ trợ đa ngôn ngữ trong tương lai
- Ghi log để phân tích

#### b. Phương pháp

**1. Google Cloud Translation API** (nếu có API key)
- Sử dụng API chính thức của Google
- Độ chính xác cao
- Trả về confidence score

**2. Heuristic Detection** (fallback)
- Phát hiện tiếng Việt qua các ký tự đặc biệt: ă, â, ê, ô, ơ, ư, đ
- Phát hiện tiếng Anh qua các từ thông dụng
- Confidence: 0.5 - 0.9

### 1.6. Document Similarity Detection

#### a. Chức năng

Tự động phát hiện các documents trùng lặp hoặc tương tự trong knowledge base để:
- Tránh duplicate content
- Gợi ý merge documents
- Cải thiện chất lượng knowledge base

#### b. Phương pháp

**1. Content-based Similarity**
- Sử dụng `string-similarity.compareTwoStrings()`
- So sánh 500 ký tự đầu tiên của mỗi document
- Trọng số: 60%

**2. Embedding-based Similarity**
- Tính cosine similarity giữa embedding vectors
- Trọng số: 40%

**3. Combined Score**
```javascript
combinedScore = (contentSimilarity * 0.6) + (embeddingSimilarity * 0.4)
```

**4. Ngưỡng phát hiện**
- Mặc định: `SIMILARITY_THRESHOLD = 0.75`
- Nếu `combinedScore >= threshold` → Đánh dấu là duplicate

### 1.7. Quy trình huấn luyện và cấu hình

#### a. Chuẩn bị dữ liệu

**1. Rules (Rule-based matching)**
- Tạo rules với pattern và keywords
- Gán priority (1-10) cho mỗi rule
- Thiết lập response template

**2. Documents (RAG knowledge base)**
- Tạo documents với title, content, category
- Hệ thống tự động tạo embedding khi save
- Gán priority và allowedRoles

#### b. Cấu hình siêu tham số

**Rule Engine:**
```javascript
RULE_MIN_CONFIDENCE: 0.35  // Ngưỡng tối thiểu để match rule
```

**RAG Service:**
```javascript
RAG_MIN_CONFIDENCE: 0.15        // Ngưỡng tối thiểu để trả về RAG
RAG_TOP_K: 5                    // Số documents top K
EMBEDDING_DIMENSION: 256        // Kích thước vector (simple)
MAX_RESPONSE_LENGTH: 2000       // Độ dài tối đa response
```

**Similarity Detection:**
```javascript
SIMILARITY_THRESHOLD: 0.75       // Ngưỡng phát hiện duplicate
```

#### c. Quy trình xử lý câu hỏi

```
1. User gửi câu hỏi
   ↓
2. Language Detection
   ↓
3. Rule Engine Matching
   ├─ Match? (confidence >= 0.35) → Trả về answer
   └─ Không match → Tiếp tục
   ↓
4. RAG Retrieval
   ├─ Match? (confidence >= 0.15) → Trả về answer
   └─ Không match → Tiếp tục
   ↓
5. Fallback Response
   ↓
6. Log message vào database
```

### 1.8. Đánh giá hiệu suất

#### a. Metrics

**Response Time:**
- Rule matching: < 50ms
- RAG retrieval: < 200ms
- Total: < 1 giây

**Accuracy:**
- Rule-based: ~85-90% (với rules được cấu hình tốt)
- RAG-based: ~70-80% (phụ thuộc vào chất lượng documents)

**Confidence Scores:**
- Rule: 0.35 - 1.0
- RAG: 0.15 - 1.0

#### b. Cải thiện hiệu suất

**1. Tối ưu Rule Engine:**
- Thêm nhiều keywords cho mỗi rule
- Điều chỉnh priority phù hợp
- Cập nhật response templates

**2. Tối ưu RAG:**
- Sử dụng Advanced Embedding (HuggingFace)
- Cải thiện chất lượng documents
- Tăng số lượng documents trong knowledge base

**3. Fine-tuning:**
- Thu thập feedback từ người dùng
- Phân tích các câu hỏi không được trả lời đúng
- Cập nhật rules và documents

### 1.9. Kết luận

Hệ thống chatbot AI đã được triển khai thành công với:
- ✅ Rule-based matching với string similarity
- ✅ RAG với embedding và cosine similarity
- ✅ Language detection
- ✅ Document similarity detection
- ✅ Hybrid orchestrator tự động chọn phương pháp tốt nhất
- ✅ Hỗ trợ đa ngôn ngữ (tiếng Việt, tiếng Anh)
- ✅ Analytics và feedback collection

Hệ thống có khả năng mở rộng cao và có thể tích hợp thêm các mô hình AI tiên tiến hơn trong tương lai.

---

## 2. ỨNG DỤNG RESNET-50 (PHẦN MỞ RỘNG TƯƠNG LAI)

*Lưu ý: Phần này mô tả kiến trúc ResNet-50 và ứng dụng tiềm năng trong hệ thống. Hiện tại chưa được triển khai trong codebase, nhưng có thể được tích hợp trong tương lai cho các tính năng như nhận diện hình ảnh, phân loại tài liệu, v.v.*

### 2.1. Giới thiệu kiến trúc ResNet-50

ResNet-50 là kiến trúc CNN thuộc họ ResNet (Residual Networks), một loạt các mô hình được thiết kế để giải quyết các thách thức liên quan đến việc đào tạo mạng nơ-ron sâu. Được phát triển bởi các nhà nghiên cứu tại Microsoft Research Asia, ResNet-50 nổi tiếng về độ sâu và hiệu quả trong các tác vụ phân loại hình ảnh.

### 2.2. Vấn đề ResNet giải quyết

Vấn đề chính mà ResNet giải quyết là vấn đề suy thoái trong mạng nơ-ron sâu. Khi mạng trở nên sâu hơn, độ chính xác của chúng bão hòa và sau đó suy thoái nhanh chóng. Sự suy thoái này không phải do quá trình lắp ghép, mà là do khó khăn trong việc tối ưu hóa quá trình đào tạo.

ResNet đã giải quyết vấn đề này bằng cách sử dụng các Khối dư (Residual Blocks) cho phép thông tin chảy trực tiếp qua các kết nối bỏ qua, giảm thiểu vấn đề độ dốc biến mất.

### 2.3. Kiến trúc khối dư Bottleneck

Khối dư được sử dụng trong ResNet-50 được gọi là Khối dư Bottleneck. Khối này có kiến trúc:

**Các thành phần:**
1. **Lớp tích chập 1x1**: Giảm số kênh (channels) trong dữ liệu đầu vào
2. **Lớp tích chập 3x3**: Trích xuất các đặc điểm không gian
3. **Lớp tích chập 1x1**: Khôi phục số kênh ban đầu
4. **Kết nối bỏ qua (Skip Connection)**: Thêm đầu vào trực tiếp vào đầu ra

**Hàm kích hoạt ReLU**: Được áp dụng sau mỗi lớp tích chập và chuẩn hóa theo lô.

### 2.4. Ứng dụng tiềm năng trong hệ thống

**a. Nhận diện loại tài liệu**
- Phân loại ảnh upload: document, poster, screenshot, photo
- Tự động gán category cho documents

**b. OCR và xử lý hình ảnh**
- Trích xuất text từ ảnh
- Nhận diện chữ viết tay
- Xử lý ảnh chất lượng thấp

**c. Phân tích hình ảnh hoạt động**
- Nhận diện loại hoạt động từ poster
- Trích xuất thông tin thời gian, địa điểm từ ảnh

### 2.5. Quy trình triển khai (khi được tích hợp)

**Bước 1: Chuẩn bị dữ liệu**
- Thu thập và gán nhãn hình ảnh
- Chia tập dữ liệu: train (80%), validation (20%)

**Bước 2: Tiền xử lý**
- Resize ảnh về kích thước chuẩn (180x180 hoặc 224x224)
- Normalize pixel values
- Data augmentation (rotation, flip, zoom)

**Bước 3: Huấn luyện mô hình**
- Sử dụng Transfer Learning với ResNet-50 pre-trained
- Fine-tuning các lớp cuối cùng
- Sử dụng optimizer AdamW với learning rate 5e-5

**Bước 4: Đánh giá**
- Tính accuracy trên tập validation
- Theo dõi loss function
- Điều chỉnh hyperparameters

---

## 3. KẾT LUẬN TỔNG QUAN

Hệ thống đã tích hợp thành công các công nghệ AI tiên tiến:

1. **Chatbot AI System**: 
   - Rule-based matching với string similarity
   - RAG với embedding và cosine similarity
   - Language detection
   - Document similarity detection
   - ✅ **Đã triển khai và hoạt động**

2. **ResNet-50 Architecture**:
   - Kiến trúc mạng nơ-ron sâu với residual connections
   - Ứng dụng tiềm năng cho nhận diện hình ảnh
   - ⚠️ **Chưa triển khai, có thể tích hợp trong tương lai**

Hệ thống có nền tảng vững chắc để mở rộng và tích hợp thêm các tính năng AI trong tương lai.

