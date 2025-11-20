const visionClient = require('../config/google-vision');
const Regulation = require('../models/regulation.model');
const ChatHistory = require('../models/chat_history.model');

// Trích text từ ảnh bằng Google Vision
async function extractTextFromImage(imageUrl) {
  try {
    const request = {
      image: { source: { imageUri: imageUrl } },
    };

    const results = await visionClient.textDetection(request);
    const detections = results[0].textAnnotations;
    
    if (detections.length > 0) {
      return detections[0].description; // Text đầu tiên chứa toàn bộ text từ ảnh
    }
    return null;
  } catch (err) {
    console.error('Error extracting text from image:', err.message);
    throw new Error('Không thể xử lý ảnh. Vui lòng thử lại.');
  }
}

// Tìm kiếm quy định liên quan dựa vào keywords
async function findRelatedRegulations(text, limit = 5) {
  if (!text) return [];

  try {
    // Tách từ khóa từ text
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 2);

    // Tìm quy định có keywords trùng
    const regulations = await Regulation.find({
      $or: [
        { keywords: { $in: words } },
        { title: { $regex: words.join('|'), $options: 'i' } }
      ]
    }).limit(limit).lean();

    return regulations;
  } catch (err) {
    console.error('Error finding regulations:', err.message);
    return [];
  }
}

// Tạo response từ quy định
function createResponse(regulations) {
  if (regulations.length === 0) {
    return 'Không tìm thấy quy định liên quan. Vui lòng liên hệ với bộ phận tương ứng để được hỗ trợ.';
  }

  let response = `Tìm thấy ${regulations.length} quy định liên quan:\n\n`;
  
  regulations.forEach((reg, index) => {
    response += `${index + 1}. **${reg.title}** (${reg.category})\n`;
    response += `   ${reg.description}\n\n`;
  });

  return response;
}

// API: Gửi ảnh → trích text → tìm quy định
async function analyzeImageAndRespond(req, res) {
  try {
    const user_id = req.user._id; // Từ auth middleware
    
    // Hỗ trợ 2 cách: upload file hoặc gửi URL
    let imageUrl;
    
    if (req.file) {
      // File được upload
      imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    } else if (req.body.image_url) {
      // URL từ body
      imageUrl = req.body.image_url;
    } else {
      return res.status(400).json({ error: 'Vui lòng upload file hoặc cung cấp image_url' });
    }

    // 1. Trích text từ ảnh
    const extractedText = await extractTextFromImage(imageUrl);

    // 2. Tìm quy định liên quan
    const regulations = await findRelatedRegulations(extractedText);

    // 3. Tạo response
    const response = createResponse(regulations);

    // 4. Lưu vào ChatHistory
    const chatRecord = new ChatHistory({
      user_id,
      extracted_text: extractedText,
      response,
      related_regulation_ids: regulations.map(r => r._id),
      image_url: imageUrl,
      query_type: 'image'
    });
    await chatRecord.save();

    return res.json({
      success: true,
      extracted_text: extractedText,
      response,
      regulations: regulations.map(r => ({
        id: r._id,
        title: r.title,
        description: r.description,
        category: r.category
      }))
    });
  } catch (err) {
    console.error('Error in analyzeImageAndRespond:', err.message);
    res.status(500).json({ error: err.message });
  }
}

// API: Hỏi câu hỏi văn bản
async function answerQuestion(req, res) {
  try {
    const user_id = req.user._id;
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Vui lòng cung cấp câu hỏi' });
    }

    // Tìm quy định liên quan
    const regulations = await findRelatedRegulations(question);

    // Tạo response
    const response = createResponse(regulations);

    // Lưu lịch
    const chatRecord = new ChatHistory({
      user_id,
      question,
      response,
      related_regulation_ids: regulations.map(r => r._id),
      query_type: 'text'
    });
    await chatRecord.save();

    return res.json({
      success: true,
      response,
      regulations: regulations.map(r => ({
        id: r._id,
        title: r.title,
        description: r.description,
        category: r.category
      }))
    });
  } catch (err) {
    console.error('Error in answerQuestion:', err.message);
    res.status(500).json({ error: err.message });
  }
}

// API: Lấy lịch chat của user
async function getChatHistory(req, res) {
  try {
    const user_id = req.user._id;
    const { limit = 20, page = 1 } = req.query;

    const skip = (page - 1) * limit;

    const history = await ChatHistory.find({ user_id })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('related_regulation_ids', 'title category')
      .lean();

    const total = await ChatHistory.countDocuments({ user_id });

    return res.json({
      success: true,
      data: history,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error in getChatHistory:', err.message);
    res.status(500).json({ error: err.message });
  }
}

// API: Lấy danh sách quy định
async function getRegulations(req, res) {
  try {
    const { category, search, limit = 20, page = 1 } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (search) {
      filter.$text = { $search: search };
    }

    const skip = (page - 1) * limit;

    const regulations = await Regulation.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Regulation.countDocuments(filter);

    return res.json({
      success: true,
      data: regulations,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error in getRegulations:', err.message);
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  analyzeImageAndRespond,
  answerQuestion,
  getChatHistory,
  getRegulations
};
