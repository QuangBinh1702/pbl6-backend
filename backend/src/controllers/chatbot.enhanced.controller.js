const visionClient = require('../config/google-vision');
const Regulation = require('../models/regulation.model');
const ChatHistory = require('../models/chat_history.model');
const Activity = require('../models/activity.model');
const StudentProfile = require('../models/student_profile.model');
const Class = require('../models/class.model');
const Attendance = require('../models/attendance.model');
const PvcdRecord = require('../models/pvcd_record.model');

// ==================== HELPER FUNCTIONS ====================

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

// Detect loại ảnh (document, poster, screenshot, photo)
async function detectImageType(imageUrl) {
  try {
    const request = {
      image: { source: { imageUri: imageUrl } },
      features: [{ type: 'LABEL_DETECTION', maxResults: 5 }]
    };

    const results = await visionClient.annotateImage(request);
    const labels = results.labelAnnotations;
    
    const labelNames = labels.map(l => l.description.toLowerCase());
    
    if (labelNames.some(l => l.includes('document') || l.includes('paper') || l.includes('text'))) {
      return 'document';
    } else if (labelNames.some(l => l.includes('poster') || l.includes('flyer'))) {
      return 'poster';
    } else if (labelNames.some(l => l.includes('screenshot') || l.includes('computer') || l.includes('screen'))) {
      return 'screenshot';
    }
    return 'photo';
  } catch (err) {
    console.error('Error detecting image type:', err.message);
    return 'unknown';
  }
}

// Tìm kiếm quy định liên quan
async function findRelatedRegulations(text, limit = 5) {
  if (!text) return [];

  try {
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 2);

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

// Sinh suggested questions từ text/context (dùng cho image upload & general questions)
async function generateSuggestedQuestions(text, imageType = 'unknown', userId = null) {
  const suggestions = [];
  
  try {
    const textLower = text.toLowerCase();
    
    // Tránh lặp lại câu hỏi hiện tại - chỉ suggest những câu hỏi khác
    // Base suggestions dựa vào content
    if (textLower.includes('điểm') || textLower.includes('point')) {
      if (!textLower.includes('pvcd của em bao nhiêu')) {
        suggestions.push('Điểm PVCD của em bao nhiêu?');
      }
      suggestions.push('Điều kiện để đạt điểm tối đa là gì?');
    }
    
    if (textLower.includes('hoạt động') || textLower.includes('activity')) {
      if (!textLower.includes('sắp tới')) {
        suggestions.push('Hoạt động sắp tới là gì?');
      }
      if (!textLower.includes('gần đây')) {
        suggestions.push('Hoạt động của em gần đây là gì?');
      }
    }
    
    if (textLower.includes('điểm danh') || textLower.includes('attendance')) {
      suggestions.push('Quy định về điểm danh như thế nào?');
    }
    
    if (textLower.includes('quy định') || textLower.includes('rule')) {
      suggestions.push('Quy định chung là gì?');
      suggestions.push('Quy định hành vi là gì?');
    }

    // User-specific suggestions nếu có userId
    if (userId) {
      suggestions.push('Thông tin lớp và khoa của em là gì?');
    }

    // Image-type based suggestions
    if (imageType === 'poster') {
      suggestions.push('Làm sao để đăng ký cho hoạt động này?');
    } else if (imageType === 'document') {
      suggestions.push('Tài liệu này liên quan đến quy định nào?');
    }

    // Remove duplicates & limit to 4
    const unique = [...new Set(suggestions)].slice(0, 4);
    return unique.length > 0 ? unique : ['Bạn có câu hỏi gì khác không?'];
  } catch (err) {
    console.error('Error generating suggestions:', err.message);
    return ['Bạn có câu hỏi gì khác không?'];
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

// ==================== API CONTROLLERS ====================

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

// API: Hỏi bất kì (smart routing)
async function askAnything(req, res) {
  try {
    const user_id = req.user._id;
    const { question, chat_id } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Vui lòng cung cấp câu hỏi' });
    }

    const questionLower = question.toLowerCase();
    let response = '';
    let relatedRegulations = [];
    let relatedActivities = [];
    let queryType = 'text';

    // Check if question is asking HOW TO (should query regulations even if contains activity keyword)
    const isHowToQuestion = questionLower.includes('làm sao') || 
                            questionLower.includes('cách nào') || 
                            questionLower.includes('như thế nào') ||
                            questionLower.includes('thế nào') ||
                            questionLower.includes('giải thích') ||
                            questionLower.includes('quy định');

    // 1. Detect intent & route
    if (isHowToQuestion) {
      // Check if asking about specific HOW-TO topics
      if (questionLower.includes('đăng ký') || questionLower.includes('register')) {
        // Registration guidance - provide step-by-step instructions
        response = `## Hướng dẫn đăng ký hoạt động\n\n`;
        response += `### Các bước thực hiện:\n\n`;
        response += `**Bước 1: Truy cập danh sách hoạt động**\n`;
        response += `Đăng nhập vào hệ thống và vào mục "Hoạt động" để xem danh sách các hoạt động sắp tới.\n\n`;
        response += `**Bước 2: Chọn hoạt động bạn quan tâm**\n`;
        response += `Xem chi tiết hoạt động: tên, thời gian, địa điểm, mô tả, và yêu cầu tham gia.\n\n`;
        response += `**Bước 3: Nhấn nút "Đăng ký"**\n`;
        response += `Xác nhận ý định tham gia bằng cách nhấn nút đăng ký trên trang hoạt động.\n\n`;
        response += `**Bước 4: Chấp nhận điều khoản**\n`;
        response += `Đọc và đồng ý với các quy định và điều kiện của hoạt động này.\n\n`;
        response += `**Bước 5: Chờ phê duyệt**\n`;
        response += `Ban tổ chức hoạt động sẽ xem xét đơn đăng ký của bạn (thường mất 24-48 giờ).\n\n`;
        response += `**Bước 6: Nhận xác nhận**\n`;
        response += `Sau khi được phê duyệt, bạn sẽ nhận được thông báo và có thể xem hoạt động trong trang "Hoạt động của tôi".\n\n`;
        response += `### Các lưu ý quan trọng:\n`;
        response += `• **Deadline đăng ký:** Thường đóng 24-48 giờ trước hoạt động\n`;
        response += `• **Yêu cầu đặc biệt:** Một số hoạt động có giới hạn số người hoặc điều kiện riêng\n`;
        response += `• **Hủy đăng ký:** Có thể hủy nếu có lý do chính đáng, trước deadline\n`;
        response += `• **Ảnh hưởng điểm:** Vắng mặt không phép sẽ ảnh hưởng đến điểm PVCD`;
        queryType = 'registration';
      } else if (questionLower.includes('điểm danh') && (questionLower.includes('cách') || questionLower.includes('làm sao'))) {
        // Attendance guidance
        response = `## Hướng dẫn điểm danh hoạt động\n\n`;
        response += `### Các bước thực hiện:\n\n`;
        response += `**Bước 1: Tham dự hoạt động đúng giờ**\n`;
        response += `Đến tham dự hoạt động tại đúng thời gian và địa điểm được quy định.\n\n`;
        response += `**Bước 2: Tìm điểm danh**\n`;
        response += `Tìm khu vực điểm danh tại sự kiện (thường có nhân viên tổ chức hoặc biển chỉ dẫn).\n\n`;
        response += `**Bước 3: Thực hiện điểm danh**\n`;
        response += `Quét mã QR bằng điện thoại hoặc ký tên vào danh sách điểm danh (tùy theo quy định của hoạt động).\n\n`;
        response += `**Bước 4: Nhận xác nhận**\n`;
        response += `Hệ thống hoặc nhân viên tổ chức sẽ xác nhận bạn đã điểm danh thành công.\n\n`;
        response += `### Các lưu ý quan trọng:\n`;
        response += `• **Thời gian:** Điểm danh phải được thực hiện tại sự kiện\n`;
        response += `• **Vắng mặt:** Nếu vắng sẽ không được tính điểm và ảnh hưởng điểm PVCD\n`;
        response += `• **Thời lượng:** Một số hoạt động yêu cầu tham gia toàn bộ thời gian\n`;
        response += `• **Phép vắng:** Cần xin phép trước 24 giờ để không bị cảnh cáo`;
        queryType = 'attendance';
      } else if (questionLower.includes('xin phép') || questionLower.includes('vắng')) {
        // Leave/Absence guidance
        response = `## Hướng dẫn xin phép vắng hoạt động\n\n`;
        response += `### Các bước thực hiện:\n\n`;
        response += `**Bước 1: Chuẩn bị giấy tờ chứng minh**\n`;
        response += `Chuẩn bị các giấy tờ hợp lệ cho lý do vắng: giấy khám bệnh, thư gia đình, v.v.\n\n`;
        response += `**Bước 2: Nộp đơn xin phép sớm**\n`;
        response += `Gửi đơn xin phép trước 24 giờ (nếu biết trước) hoặc sớm nhất có thể sau khi có lý do.\n\n`;
        response += `**Bước 3: Chọn người xét duyệt**\n`;
        response += `Nộp đơn cho lớp trưởng hoặc ban tổ chức hoạt động tùy theo quy định.\n\n`;
        response += `**Bước 4: Chờ phê duyệt**\n`;
        response += `Lớp trưởng/ban tổ chức sẽ xem xét đơn và thông báo kết quả cho bạn.\n\n`;
        response += `### Các lưu ý quan trọng:\n`;
        response += `• **Thời hạn:** Xin phép trước 24 giờ sẽ tăng cơ hội được chấp thuận\n`;
        response += `• **Chứng minh:** Cần giấy tờ chứng minh hợp lệ (bệnh tật, hoàn cảnh gia đình)\n`;
        response += `• **Sau sự kiện:** Xin phép sau khi hoạt động diễn ra có thể không được chấp thuận\n`;
        response += `• **Hậu quả:** Vắng không phép sẽ không được tính điểm và ảnh hưởng điểm PVCD`;
        queryType = 'absence';
      } else {
        // HOW TO question - query regulations
        relatedRegulations = await findRelatedRegulations(question);
        response = createResponse(relatedRegulations);
        queryType = 'text';
      }
    } else if (questionLower.includes('hoạt động')) {
      // Activity question - distinguish between user's activities vs all activities
      const isUserActivities = questionLower.includes('của em') || 
                                questionLower.includes('gần đây') || 
                                questionLower.includes('em đã') ||
                                questionLower.includes('tôi đã');
      
      let activities = [];
      
      if (isUserActivities) {
        // Get user's registered activities
        const studentProfile = await StudentProfile.findOne({ user_id }).lean();
        
        if (studentProfile) {
          try {
            const ActivityRegistration = require('../models/activity_registration.model');
            const registrations = await ActivityRegistration.find({
              student_id: studentProfile._id
            }).populate('activity_id').sort({ created_at: -1 }).limit(5).lean();
            
            activities = registrations
              .map(r => r.activity_id)
              .filter(a => a); // Filter null
          } catch (err) {
            console.warn('ActivityRegistration model not found');
          }
        }
        
        if (activities.length > 0) {
          relatedActivities = activities;
          response = `Hoạt động của em gần đây:\n\n`;
          activities.forEach((act, idx) => {
            response += `${idx + 1}. **${act.title}**\n`;
            response += `   📍 ${act.location || 'Chưa có địa điểm'}\n`;
            response += `   🕐 ${new Date(act.start_time).toLocaleString('vi-VN')}\n`;
            response += `   📝 ${act.description || ''}\n\n`;
          });
          queryType = 'activity';
        } else {
          response = 'Bạn chưa đăng ký hoạt động nào.';
        }
      } else {
        // Get all upcoming activities
        activities = await Activity.find({
          status: { $in: ['approved', 'in_progress'] },
          start_time: { $gte: new Date() }
        }).sort({ start_time: 1 }).limit(5).lean();

        if (activities.length > 0) {
          relatedActivities = activities;
          response = `Hoạt động sắp tới:\n\n`;
          activities.forEach((act, idx) => {
            response += `${idx + 1}. **${act.title}**\n`;
            response += `   📍 ${act.location || 'Chưa có địa điểm'}\n`;
            response += `   🕐 ${new Date(act.start_time).toLocaleString('vi-VN')}\n`;
            response += `   📝 ${act.description || ''}\n\n`;
          });
          queryType = 'activity';
        } else {
          response = 'Hiện chưa có hoạt động nào sắp tới.';
        }
      }
    } else if (questionLower.includes('điểm') || questionLower.includes('pvcd')) {
      // Attendance & points
      const studentProfile = await StudentProfile.findOne({ user_id }).lean();
      
      if (!studentProfile) {
        response = 'Không tìm thấy hồ sơ sinh viên của bạn.';
      } else {
        const attendance = await Attendance.find({
          student_id: studentProfile._id
        }).lean();

        const currentYear = new Date().getFullYear();
        const pvcdRecord = await PvcdRecord.findOne({
          student_id: studentProfile._id,
          year: currentYear
        }).lean();

        response = `**Thông tin điểm danh & PVCD của bạn:**\n\n`;
        response += `📊 Tổng hoạt động đã điểm danh: ${attendance.length}\n`;
        response += `⭐ Điểm PVCD năm này: ${pvcdRecord?.total_point || 0}/100\n\n`;
        response += `Để xem chi tiết, vui lòng truy cập trang cá nhân của bạn.`;
        
        queryType = 'attendance';
      }
    } else if (questionLower.includes('lớp') || questionLower.includes('khoa') || questionLower.includes('thông tin')) {
      // Student info
      const studentProfile = await StudentProfile.findOne({ user_id })
        .populate('class_id', 'name')
        .lean();

      if (!studentProfile) {
        response = 'Không tìm thấy hồ sơ sinh viên của bạn.';
      } else {
        response = `**Thông tin của bạn:**\n\n`;
        response += `👤 Tên: ${studentProfile.full_name || 'N/A'}\n`;
        response += `📚 Mã sinh viên: ${studentProfile.student_number}\n`;
        response += `🎓 Lớp: ${studentProfile.class_id?.name || 'N/A'}\n`;
        response += `📧 Email: ${studentProfile.email || 'N/A'}\n`;
        response += `📱 SĐT: ${studentProfile.phone || 'N/A'}\n`;
        queryType = 'info';
      }
    } else {
      // Default to regulations
      relatedRegulations = await findRelatedRegulations(question);
      response = createResponse(relatedRegulations);
      queryType = 'text';
    }

    // 2. Sinh suggested questions cho follow-up
    let suggestedQuestions = [];
    
    // For HOW-TO questions, generate context-specific suggestions
    if (isHowToQuestion) {
      if (questionLower.includes('đăng ký')) {
        suggestedQuestions = ['Hoạt động sắp tới là gì?', 'Hoạt động của em gần đây là gì?'];
      } else if (questionLower.includes('điểm danh') && (questionLower.includes('cách') || questionLower.includes('làm sao'))) {
        suggestedQuestions = ['Làm sao để xin phép vắng?', 'Quy định điểm danh là gì?'];
      } else if (questionLower.includes('xin phép') || questionLower.includes('vắng')) {
        suggestedQuestions = ['Tôi đã tham gia hoạt động nào?', 'Điểm PVCD của em bao nhiêu?'];
      } else {
        suggestedQuestions = await generateSuggestedQuestions(question, 'unknown', user_id);
      }
    } else {
      suggestedQuestions = await generateSuggestedQuestions(question + ' ' + response, 'unknown', user_id);
    }

    // 3. Save to ChatHistory
    const chatRecord = new ChatHistory({
      user_id,
      question,
      response,
      related_regulation_ids: relatedRegulations.map(r => r._id),
      related_activity_ids: relatedActivities.map(a => a._id),
      suggested_questions: suggestedQuestions,
      query_type: queryType
    });

    if (chat_id) {
      // Update existing record
      await ChatHistory.findByIdAndUpdate(chat_id, {
        question,
        response,
        suggested_questions: suggestedQuestions,
        query_type: queryType,
        related_regulation_ids: relatedRegulations.map(r => r._id)
      });
    } else {
      await chatRecord.save();
    }

    return res.json({
      success: true,
      data: {
        response,
        suggested_questions: suggestedQuestions,
        query_type: queryType,
        regulations: relatedRegulations.map(r => ({
          id: r._id,
          title: r.title,
          description: r.description,
          category: r.category
        })),
        activities: relatedActivities.map(a => ({
          id: a._id,
          title: a.title,
          description: a.description,
          location: a.location,
          start_time: a.start_time
        }))
      }
    });
  } catch (err) {
    console.error('Error in askAnything:', err.message);
    res.status(500).json({ error: err.message });
  }
}

// API: Lấy hoạt động của user (thông qua registration)
async function getMyActivities(req, res) {
  try {
    const user_id = req.user._id;
    const { status = 'all', limit = 10, page = 1 } = req.query;

    const studentProfile = await StudentProfile.findOne({ user_id }).lean();
    
    if (!studentProfile) {
      return res.status(404).json({ error: 'Không tìm thấy hồ sơ sinh viên' });
    }

    const filter = { student_id: studentProfile._id };
    const skip = (page - 1) * limit;
    
    // Lấy activities qua registration (activity_registration collection)
    let ActivityRegistration;
    try {
      ActivityRegistration = require('../models/activity_registration.model');
    } catch (err) {
      console.warn('ActivityRegistration model not found, using Activity directly');
      // Fallback: lấy activities approved/in_progress
      const activities = await Activity.find({
        status: { $in: ['approved', 'in_progress'] }
      })
        .sort({ start_time: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const total = await Activity.countDocuments({ 
        status: { $in: ['approved', 'in_progress'] } 
      });

      return res.json({
        success: true,
        data: activities,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      });
    }

    // Lấy từ activity registration
    const registrations = await ActivityRegistration.find(filter)
      .populate('activity_id')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const activities = registrations
      .map(r => r.activity_id)
      .filter(a => a); // Filter null

    const total = await ActivityRegistration.countDocuments(filter);

    return res.json({
      success: true,
      data: activities,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error in getMyActivities:', err.message);
    res.status(500).json({ error: err.message });
  }
}

// API: Lấy thông tin điểm danh & PVCD
async function getMyAttendance(req, res) {
  try {
    const user_id = req.user._id;

    const studentProfile = await StudentProfile.findOne({ user_id }).lean();
    
    if (!studentProfile) {
      return res.status(404).json({ error: 'Không tìm thấy hồ sơ sinh viên' });
    }

    // Lấy ALL attendance (không filter verified)
    const attendance = await Attendance.find({
      student_id: studentProfile._id
    }).populate('activity_id', 'title start_time').lean();

    // Lấy PVCD năm hiện tại
    const currentYear = new Date().getFullYear();
    const pvcdRecord = await PvcdRecord.findOne({
      student_id: studentProfile._id,
      year: currentYear
    }).lean();

    // Count verified vs all
    const verifiedCount = attendance.filter(a => a.verified).length;
    const totalCount = attendance.length;

    return res.json({
      success: true,
      data: {
        total_attended: totalCount,
        total_verified: verifiedCount,
        pvcd_points: pvcdRecord?.total_point || 0,
        attendance_records: attendance.map(a => ({
          activity: a.activity_id?.title,
          scanned_at: a.scanned_at,
          points: a.points,
          verified: a.verified,
          status: a.status
        }))
      }
    });
  } catch (err) {
    console.error('Error in getMyAttendance:', err.message);
    res.status(500).json({ error: err.message });
  }
}

// API: Lấy thông tin sinh viên
async function getMyInfo(req, res) {
  try {
    const user_id = req.user._id;

    const studentProfile = await StudentProfile.findOne({ user_id })
      .populate('class_id', 'name')
      .lean();
    
    if (!studentProfile) {
      return res.status(404).json({ error: 'Không tìm thấy hồ sơ sinh viên' });
    }

    return res.json({
      success: true,
      data: {
        full_name: studentProfile.full_name,
        student_number: studentProfile.student_number,
        email: studentProfile.email,
        phone: studentProfile.phone,
        class: studentProfile.class_id?.name,
        enrollment_year: studentProfile.enrollment_year,
        date_of_birth: studentProfile.date_of_birth,
        gender: studentProfile.gender,
        contact_address: studentProfile.contact_address,
        is_class_monitor: studentProfile.isClassMonitor
      }
    });
  } catch (err) {
    console.error('Error in getMyInfo:', err.message);
    res.status(500).json({ error: err.message });
  }
}

// API: Lấy lịch chat
async function getChatHistory(req, res) {
  try {
    const user_id = req.user._id;
    const { limit = 20, page = 1 } = req.query;

    const skip = (page - 1) * limit;

    const history = await ChatHistory.find({ user_id })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
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

// API: Submit user feedback
async function submitFeedback(req, res) {
  try {
    const { chat_id, feedback, comment } = req.body;

    if (!chat_id || !feedback) {
      return res.status(400).json({ error: 'chat_id và feedback là bắt buộc' });
    }

    const updated = await ChatHistory.findByIdAndUpdate(
      chat_id,
      {
        user_feedback: feedback,
        feedback_comment: comment
      },
      { new: true }
    );

    return res.json({
      success: true,
      data: updated
    });
  } catch (err) {
    console.error('Error in submitFeedback:', err.message);
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  analyzeImageAndGetSuggestions,
  askAnything,
  getMyActivities,
  getMyAttendance,
  getMyInfo,
  getChatHistory,
  submitFeedback
};
