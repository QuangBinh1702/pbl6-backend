# 📸 Chatbot Image Analysis & OCR - Trạng Thái Hiện Tại

**Date:** December 2025  
**Question:** RAG có chức năng gửi ảnh rồi đọc từ ảnh đó đúng không?

---

## ✅ **TRẢ LỜI: CÓ, CODE ĐÃ CÓ SẴN NHƯNG ĐANG BỊ BYPASS**

---

## 📋 Tình Trạng Hiện Tại

### ✅ **Code Đã Có Sẵn:**

1. **Google Vision API Setup** ✅
   - File: `backend/src/config/google-vision.js`
   - Package: `@google-cloud/vision` (đã install)
   - Function: `extractTextFromImage()` - Trích text từ ảnh bằng OCR

2. **Image Analysis Controller** ✅
   - File: `backend/src/controllers/chatbot.enhanced.controller.js`
   - Function: `analyzeImageAndGetSuggestions()`
   - Chức năng:
     - ✅ Upload ảnh
     - ✅ Trích text từ ảnh (OCR)
     - ✅ Detect loại ảnh
     - ✅ Sinh suggested questions từ text đã trích

3. **Frontend Support** ✅
   - File: `frontend/src/components/ChatBot/ChatBot.jsx`
   - Có button upload ảnh (📸)
   - Có code gửi ảnh lên backend

4. **Route Setup** ✅
   - File: `backend/src/routes/chatbot.enhanced.route.js`
   - Endpoint: `POST /api/chatbot/analyze-image`
   - Middleware: Upload file + Authentication

---

## ⚠️ **Vấn Đề Hiện Tại:**

### 1. **Google Vision API Đang Bị BYPASS**

```javascript
// backend/src/controllers/chatbot.enhanced.controller.js (line 174-176)
// 1. Trích text từ ảnh - BYPASS Google Vision (billing not enabled)
const extractedText = 'Ảnh đã được upload thành công! 📸\n(Google Vision API chưa enable billing)';
console.log('✅ Image uploaded, skipping Google Vision');
```

**Lý do:** Google Vision API cần enable billing để sử dụng, hiện tại chưa enable.

### 2. **Enhanced Route Đang Bị DISABLE**

```javascript
// backend/src/app.js (line 127)
// app.use('/api/chatbot', require('./routes/chatbot.enhanced.route')); // LEGACY - disabled
```

**Lý do:** Route enhanced đang bị comment, không được sử dụng.

### 3. **Main Route Trả Về 501**

```javascript
// backend/src/controllers/chatbot.controller.js (line 61-68)
async function analyzeImage(req, res) {
  try {
    // For Phase 2+: integrate with Google Vision or similar
    // For now, this is backward compatibility with existing image analysis
    return res.status(501).json({
      success: false,
      error: 'Image analysis coming in Phase 2'
    });
  }
}
```

**Lý do:** Endpoint chính đang trả về placeholder.

---

## 🔍 **Chi Tiết Code:**

### **1. Google Vision Setup:**

```12:35:backend/src/controllers/chatbot.enhanced.controller.js
// Trích text từ ảnh bằng Google Vision
async function extractTextFromImage(imageUrl) {
  try {
    console.log('📸 Extracting text from:', imageUrl);
    const request = {
      image: { source: { imageUri: imageUrl } },
    };

    const results = await visionClient.textDetection(request);
    const detections = results[0].textAnnotations;
    
    if (detections.length > 0) {
      console.log('✅ Text extracted:', detections[0].description.substring(0, 50) + '...');
      return detections[0].description;
    }
    console.log('⚠️ No text detected in image');
    return null;
  } catch (err) {
    console.error('❌ Error extracting text from image:');
    console.error('URL:', imageUrl);
    console.error('Error:', err.message);
    throw new Error('Không thể xử lý ảnh. Vui lòng thử lại.');
  }
}
```

### **2. Image Analysis Function:**

```158:211:backend/src/controllers/chatbot.enhanced.controller.js
// API: Gửi ảnh → Trích text + Suggest questions
async function analyzeImageAndGetSuggestions(req, res) {
  try {
    const user_id = req.user._id;
    
    let imageUrl;
    if (req.file) {
      const protocol = req.protocol;
      const host = req.get('host');
      imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    } else if (req.body.image_url) {
      imageUrl = req.body.image_url;
    } else {
      return res.status(400).json({ error: 'Vui lòng upload file hoặc cung cấp image_url' });
    }

    // 1. Trích text từ ảnh - BYPASS Google Vision (billing not enabled)
    const extractedText = 'Ảnh đã được upload thành công! 📸\n(Google Vision API chưa enable billing)';
    console.log('✅ Image uploaded, skipping Google Vision');

    // 2. Detect loại ảnh - use default
    const imageType = 'photo';

    // 3. Sinh suggested questions
    const suggestedQuestions = await generateSuggestedQuestions(extractedText, imageType, user_id);

    // 4. Lưu vào ChatHistory (chưa có response)
    const chatRecord = new ChatHistory({
      user_id,
      extracted_text: extractedText,
      image_url: imageUrl,
      image_type: imageType,
      suggested_questions: suggestedQuestions,
      query_type: 'image'
    });
    await chatRecord.save();

    return res.json({
      success: true,
      data: {
        extracted_text: extractedText,
        image_type: imageType,
        suggested_questions: suggestedQuestions,
        chat_id: chatRecord._id
      }
    });
  } catch (err) {
    console.error('❌ Error in analyzeImageAndGetSuggestions:');
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);
    console.error('Full Error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}
```

### **3. Frontend Upload Code:**

```55:66:frontend/src/components/ChatBot/ChatBot.jsx
      // Handle image upload
      if (selectedFile) {
        const formData = new FormData();
        formData.append('image', selectedFile);

        response = await fetch(`${API_BASE_URL}/chatbot/analyze-image`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
```

---

## 🎯 **Để Kích Hoạt Chức Năng:**

### **Option 1: Enable Google Vision API Billing**

1. **Enable Google Cloud Billing:**
   - Vào Google Cloud Console
   - Enable billing cho project
   - Enable Vision API

2. **Uncomment Code:**
   ```javascript
   // backend/src/controllers/chatbot.enhanced.controller.js (line 174-176)
   // Thay đổi từ:
   const extractedText = 'Ảnh đã được upload thành công! 📸\n(Google Vision API chưa enable billing)';
   
   // Thành:
   const extractedText = await extractTextFromImage(imageUrl);
   ```

3. **Enable Enhanced Route:**
   ```javascript
   // backend/src/app.js (line 127)
   // Uncomment:
   app.use('/api/chatbot', require('./routes/chatbot.enhanced.route'));
   ```

### **Option 2: Dùng OCR Library Khác (Free)**

Có thể dùng:
- **Tesseract.js** (client-side OCR, free)
- **OCR.space API** (free tier available)
- **Azure Computer Vision** (có free tier)

---

## 📊 **Tóm Tắt:**

| Component | Status | Note |
|-----------|--------|------|
| **Google Vision Setup** | ✅ Ready | Cần enable billing |
| **OCR Function** | ✅ Ready | Đang bị bypass |
| **Image Upload** | ✅ Ready | Frontend + Backend |
| **Route** | ⚠️ Disabled | Enhanced route bị comment |
| **Main Route** | ⚠️ Placeholder | Trả về 501 |

---

## ✅ **Kết Luận:**

**CÓ, code đã có sẵn chức năng gửi ảnh và đọc text từ ảnh (OCR)**, nhưng:

1. ✅ Code đã được implement đầy đủ
2. ⚠️ Google Vision API đang bị bypass (cần enable billing)
3. ⚠️ Enhanced route đang bị disable
4. ⚠️ Main route trả về placeholder

**Để sử dụng:** Cần enable Google Vision API billing hoặc dùng OCR library khác.

---

*Report created: December 2025*

